import { describe, expect, it, vi } from 'vitest'
import { ApiRequestError } from './gameApi'
import { ConnectionLostError, createHttpClient } from './httpClient'

const session = { gameId: 'g1', token: 'secret' }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function clientWith(...responses: (Response | Error)[]) {
  const fetch = vi.fn<typeof globalThis.fetch>()
  for (const response of responses) {
    if (response instanceof Error) fetch.mockRejectedValueOnce(response)
    else fetch.mockResolvedValueOnce(response)
  }
  return { fetch, client: createHttpClient({ baseUrl: '/api', fetch }) }
}

function sent(fetch: ReturnType<typeof vi.fn>, call = 0) {
  const [url, init = {}] = fetch.mock.calls[call] as [string, RequestInit]
  return { url, method: init.method ?? 'GET', headers: new Headers(init.headers), body: init.body ? JSON.parse(String(init.body)) : undefined }
}

describe('httpClient routes', () => {
  it('creates a game', async () => {
    const { fetch, client } = clientWith(json({ gameId: 'g1', token: 't', totalBugs: 10 }, 201))
    expect(await client.createGame({ pseudo: 'Neo42', deviceId: 'd' })).toEqual({ gameId: 'g1', token: 't', totalBugs: 10 })
    const request = sent(fetch)
    expect(request).toMatchObject({ url: '/api/games', method: 'POST', body: { pseudo: 'Neo42', deviceId: 'd' } })
    expect(request.headers.get('Content-Type')).toBe('application/json')
    expect(request.headers.get('Authorization')).toBeNull()
  })

  it('asks for the next bug with the token, and turns 204 into null', async () => {
    const { fetch, client } = clientWith(json({ index: 0 }), new Response(null, { status: 204 }))
    expect(await client.nextBug(session)).toEqual({ index: 0 })
    expect(sent(fetch)).toMatchObject({ url: '/api/games/g1/next', method: 'GET' })
    expect(sent(fetch).headers.get('Authorization')).toBe('Bearer secret')
    expect(await client.nextBug(session)).toBeNull()
  })

  it.each([
    ['select', () => ['selection', { bugId: 'b', selectedLine: 1 }]],
    ['answer', () => ['answers', { bugId: 'b', choice: null }]],
  ] as const)('posts %s with the token', async (method, route) => {
    const [path, body] = route()
    const { fetch, client } = clientWith(json({}))
    await (client[method] as (s: typeof session, b: unknown) => Promise<unknown>)(session, body)
    expect(sent(fetch)).toMatchObject({ url: `/api/games/g1/${path}`, method: 'POST', body })
    expect(sent(fetch).headers.get('Authorization')).toBe('Bearer secret')
  })

  it('reads the result and the leaderboard', async () => {
    const { fetch, client } = clientWith(json({ score: 1 }), json({ top: [] }))
    await client.getResult(session)
    await client.getLeaderboard()
    expect(sent(fetch, 0)).toMatchObject({ url: '/api/games/g1/result', method: 'GET' })
    expect(sent(fetch, 1)).toMatchObject({ url: '/api/leaderboard', method: 'GET' })
  })

  it('sends the admin PIN in its header, never in the URL', async () => {
    const { fetch, client } = clientWith(json({ players: [] }), new Response(null, { status: 204 }))
    await client.getAdminPlayers('1234')
    await client.setHidden('1234', 'Neo 42', true)
    expect(sent(fetch, 0)).toMatchObject({ url: '/api/admin/players', method: 'GET' })
    expect(sent(fetch, 1)).toMatchObject({ url: '/api/admin/players/Neo%2042', method: 'PATCH', body: { hidden: true } })
    expect(sent(fetch, 1).headers.get('X-Admin-Pin')).toBe('1234')
  })
})

describe('httpClient errors', () => {
  it('turns { "error": code } into an ApiRequestError', async () => {
    const { client } = clientWith(json({ error: 'pseudo_unavailable' }, 400))
    const error = await client.createGame({ pseudo: 'Neo42', deviceId: 'd' }).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).code).toBe('pseudo_unavailable')
  })

  it('does not retry an answer the server refused', async () => {
    const { fetch, client } = clientWith(json({ error: 'bad_token' }, 401))
    await expect(client.nextBug(session)).rejects.toBeInstanceOf(ApiRequestError)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('retries once when the network fails', async () => {
    const { fetch, client } = clientWith(new TypeError('Failed to fetch'), json({ top: [] }))
    expect(await client.getLeaderboard()).toEqual({ top: [] })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('gives up after a second network failure', async () => {
    const { fetch, client } = clientWith(new TypeError('Failed to fetch'), new TypeError('Failed to fetch'))
    await expect(client.getLeaderboard()).rejects.toBeInstanceOf(ConnectionLostError)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('reports a server error without a code as a lost connection', async () => {
    const { client } = clientWith(new Response('Bad gateway', { status: 502 }))
    await expect(client.getLeaderboard()).rejects.toBeInstanceOf(ConnectionLostError)
  })
})
