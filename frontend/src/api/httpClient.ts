import { ApiRequestError, type GameApi, type GameSession } from './gameApi'
import type { ApiErrorCode } from './types'

// The network failed, or the server answered without an error code (a proxy
// error page, a crash). Screens show "Connexion perdue".
export class ConnectionLostError extends Error {
  constructor() {
    super('connection_lost')
    this.name = 'ConnectionLostError'
  }
}

type HttpClientOptions = {
  baseUrl: string
  fetch?: typeof globalThis.fetch
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  token?: string
  pin?: string
}

// GameApi over HTTP, contract v1 (CLAUDE.md). The server stays the only judge:
// this client sends what the player did and returns what the server says.
export function createHttpClient({ baseUrl, fetch = globalThis.fetch.bind(globalThis) }: HttpClientOptions): GameApi {
  async function send(path: string, { method = 'GET', body, token, pin }: RequestOptions): Promise<Response> {
    const headers: Record<string, string> = {}
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`
    if (pin) headers['X-Admin-Pin'] = pin
    const init = { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }

    // One retry, and only when the request never got an answer.
    try {
      return await fetch(`${baseUrl}${path}`, init)
    } catch {
      try {
        return await fetch(`${baseUrl}${path}`, init)
      } catch {
        throw new ConnectionLostError()
      }
    }
  }

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await send(path, options)
    if (response.status === 204) return null as T
    const payload: unknown = await response.json().catch(() => null)
    if (response.ok) return payload as T

    const code = (payload as { error?: unknown } | null)?.error
    if (typeof code === 'string') throw new ApiRequestError(code as ApiErrorCode)
    throw new ConnectionLostError()
  }

  const game = (session: GameSession, route: string) => `/games/${encodeURIComponent(session.gameId)}/${route}`

  return {
    createGame: (body) => request('/games', { method: 'POST', body }),
    nextBug: (session) => request(game(session, 'next'), { token: session.token }),
    select: (session, body) => request(game(session, 'selection'), { method: 'POST', body, token: session.token }),
    answer: (session, body) => request(game(session, 'answers'), { method: 'POST', body, token: session.token }),
    getResult: (session) => request(game(session, 'result'), { token: session.token }),
    getLeaderboard: () => request('/leaderboard'),
    getAdminPlayers: (pin) => request('/admin/players', { pin }),
    setHidden: (pin, pseudo, hidden) =>
      request(`/admin/players/${encodeURIComponent(pseudo)}`, { method: 'PATCH', body: { hidden }, pin }),
    getAdminBugs: (pin) => request('/admin/bugs', { pin }),
    getAdminBug: (pin, id) => request(`/admin/bugs/${encodeURIComponent(id)}`, { pin }),
  }
}
