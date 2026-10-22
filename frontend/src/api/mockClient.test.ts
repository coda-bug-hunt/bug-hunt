import { describe, expect, it } from 'vitest'
import type { GameApi, GameSession } from './gameApi'
import { mockBugs, type MockBug } from './mockBugs'
import { createMockClient } from './mockClient'
import type { PublicBug } from './types'

function fakeClock() {
  let time = 0
  return { now: () => time, advance: (seconds: number) => void (time += seconds * 1000) }
}

function fullBug(bug: PublicBug): MockBug {
  const found = mockBugs.find((candidate) => candidate.id === bug.id)
  if (!found) throw new Error(`Unknown bug ${bug.id}`)
  return found
}

function rightSelection(bug: MockBug) {
  return bug.track === 'dev'
    ? { bugId: bug.id, selectedLine: bug.bugLine }
    : { bugId: bug.id, selectedTarget: bug.bugTarget }
}

function wrongSelection(bug: MockBug) {
  return bug.track === 'dev'
    ? { bugId: bug.id, selectedLine: bug.bugLine + 1 }
    : { bugId: bug.id, selectedTarget: 'nowhere' }
}

async function start(api: GameApi, pseudo = 'Neo42', deviceId = 'device-a'): Promise<GameSession> {
  const { gameId, token } = await api.createGame({ pseudo, deviceId })
  return { gameId, token }
}

// Plays a whole game; `skip` bugs (by index) get a wrong fix.
async function playGame(api: GameApi, session: GameSession, skip: number[] = []) {
  for (;;) {
    const next = await api.nextBug(session)
    if (!next) return
    const bug = fullBug(next.bug)
    await api.select(session, rightSelection(bug))
    const choice = skip.includes(next.index) ? (bug.answer + 1) % 3 : bug.answer
    await api.answer(session, { bugId: bug.id, choice: choice as 0 | 1 | 2 })
  }
}

describe('a full game', () => {
  it('serves 10 bugs: one dev then one network bug per level, 0 to 4', async () => {
    const api = createMockClient()
    const created = await api.createGame({ pseudo: 'Neo42', deviceId: 'device-a' })
    expect(created.totalBugs).toBe(10)
    const session = { gameId: created.gameId, token: created.token }

    const served: string[] = []
    for (let i = 0; i < 10; i++) {
      const next = await api.nextBug(session)
      expect(next?.index).toBe(i)
      const bug = fullBug(next!.bug)
      served.push(`${bug.track}-${bug.difficulty}`)
      await api.select(session, rightSelection(bug))
      const { finished } = await api.answer(session, { bugId: bug.id, choice: bug.answer })
      expect(finished).toBe(i === 9)
    }

    expect(served).toEqual([
      'dev-0', 'network-0', 'dev-1', 'network-1', 'dev-2',
      'network-2', 'dev-3', 'network-3', 'dev-4', 'network-4',
    ])
    expect(await api.nextBug(session)).toBeNull()
    expect(await api.getResult(session)).toMatchObject({
      score: 3000, maxScore: 3000, percentByTrack: { dev: 100, network: 100 }, affinity: 'both',
    })
  })

  it('never sends the answer with a bug', async () => {
    const api = createMockClient()
    const session = await start(api)
    for (let i = 0; i < 10; i++) {
      const next = await api.nextBug(session)
      for (const secret of ['bugLine', 'bugTarget', 'answer', 'explanation']) {
        expect(next!.bug).not.toHaveProperty(secret)
      }
      const bug = fullBug(next!.bug)
      await api.select(session, rightSelection(bug))
      await api.answer(session, { bugId: bug.id, choice: bug.answer })
    }
  })
})

describe('scoring', () => {
  it('gives 50 % for a wrong line then the right fix', async () => {
    const api = createMockClient()
    const session = await start(api)
    const bug = fullBug((await api.nextBug(session))!.bug)
    const selection = await api.select(session, wrongSelection(bug))
    expect(selection.lineCorrect).toBe(false)
    const answer = await api.answer(session, { bugId: bug.id, choice: bug.answer })
    expect(answer).toMatchObject({ correct: true, points: 50 })
  })

  it('gives 0 when the timer ran out on screen', async () => {
    const api = createMockClient()
    const session = await start(api)
    const bug = fullBug((await api.nextBug(session))!.bug)
    await api.select(session, rightSelection(bug))
    expect((await api.answer(session, { bugId: bug.id, choice: null })).points).toBe(0)
  })

  it('gives 0 for an answer after 60 seconds, even a right one', async () => {
    const clock = fakeClock()
    const api = createMockClient({ now: clock.now })
    const session = await start(api)
    const bug = fullBug((await api.nextBug(session))!.bug)
    await api.select(session, rightSelection(bug))
    clock.advance(61)
    const answer = await api.answer(session, { bugId: bug.id, choice: bug.answer })
    expect(answer).toMatchObject({ correct: true, points: 0 })
  })

  it('does not restart the timer when the bug is asked again', async () => {
    const clock = fakeClock()
    const api = createMockClient({ now: clock.now })
    const session = await start(api)
    const first = await api.nextBug(session)
    clock.advance(20)
    const again = await api.nextBug(session)
    expect(again!.bug.id).toBe(first!.bug.id)
    expect(again!.remainingSeconds).toBe(40)
  })
})

describe('errors', () => {
  it('rejects a wrong token and an unknown game', async () => {
    const api = createMockClient()
    const session = await start(api)
    await expect(api.nextBug({ ...session, token: 'nope' })).rejects.toMatchObject({ code: 'bad_token' })
    await expect(api.nextBug({ ...session, gameId: 'nope' })).rejects.toMatchObject({ code: 'unknown_game' })
  })

  it('enforces the two steps of an answer', async () => {
    const api = createMockClient()
    const session = await start(api)
    const bug = fullBug((await api.nextBug(session))!.bug)
    await expect(api.answer(session, { bugId: bug.id, choice: 0 })).rejects.toMatchObject({ code: 'selection_missing' })
    await expect(api.select(session, { bugId: 'other', selectedLine: 0 })).rejects.toMatchObject({ code: 'not_current_bug' })
    await api.select(session, rightSelection(bug))
    await expect(api.select(session, rightSelection(bug))).rejects.toMatchObject({ code: 'already_selected' })
    await api.answer(session, { bugId: bug.id, choice: bug.answer })
    await expect(api.answer(session, { bugId: bug.id, choice: bug.answer })).rejects.toMatchObject({ code: 'already_answered' })
    await expect(api.getResult(session)).rejects.toMatchObject({ code: 'game_not_finished' })
  })

  it('checks nicknames: format, and taken by another device', async () => {
    const api = createMockClient()
    await expect(api.createGame({ pseudo: 'ab', deviceId: 'device-a' })).rejects.toMatchObject({ code: 'pseudo_invalid' })
    await expect(api.createGame({ pseudo: 'Neo 42', deviceId: 'device-a' })).rejects.toMatchObject({ code: 'pseudo_invalid' })
    await start(api, 'Neo42', 'device-a')
    await expect(start(api, 'neo42', 'device-b')).rejects.toMatchObject({ code: 'pseudo_unavailable' })
    await expect(start(api, 'Neo42', 'device-a')).resolves.toBeDefined()
  })
})

describe('leaderboard and admin', () => {
  it('keeps the best score of each player, once', async () => {
    const api = createMockClient()
    await playGame(api, await start(api, 'Neo42'), [8, 9])
    await playGame(api, await start(api, 'Neo42'))
    await playGame(api, await start(api, 'Trinity', 'device-b'), [0])

    const board = await api.getLeaderboard()
    expect(board.top.map((entry) => [entry.pseudo, entry.score])).toEqual([['Neo42', 3000], ['Trinity', 2900]])
    expect(board.gamesPlayed).toBe(3)
  })

  it('hides a player from the top but keeps their games in the gauges', async () => {
    const api = createMockClient({ adminPin: '1234' })
    // Wrong fixes on both level-4 bugs and the level-3 network bug: dev 1000, network 600.
    await playGame(api, await start(api, 'Neo42'), [7, 8, 9])
    await api.setHidden('1234', 'neo42', true)

    const board = await api.getLeaderboard()
    expect(board.top).toEqual([])
    expect(board.gauges).toEqual({ dev: 1, network: 0 })
    const { players } = await api.getAdminPlayers('1234')
    expect(players[0]).toMatchObject({ pseudo: 'Neo42', hidden: true, affinity: 'dev' })
  })

  it('rejects a wrong PIN and an unknown player', async () => {
    const api = createMockClient({ adminPin: '1234' })
    await expect(api.getAdminPlayers('0000')).rejects.toMatchObject({ code: 'bad_pin' })
    await expect(api.setHidden('0000', 'Neo42', true)).rejects.toMatchObject({ code: 'bad_pin' })
    await expect(api.setHidden('1234', 'Ghost', true)).rejects.toMatchObject({ code: 'unknown_player' })
  })
})
