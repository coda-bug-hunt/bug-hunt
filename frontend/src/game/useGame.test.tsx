// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { FullBug, GameApi, GameSession } from '../api'
import { mockBugs } from '../api/mockBugs'
import { createMockClient } from '../api/mockClient'
import { useGame } from './useGame'

// random() = 0 always draws the first bug of each level: mock-dev-0 first,
// whose bug is on line 1 and whose right fix is choice 0.
async function setUp() {
  const client = createMockClient({ random: () => 0 })
  const { gameId, token } = await client.createGame({ pseudo: 'Neo42', deviceId: 'device-a' })
  return { client, session: { gameId, token } }
}

function renderGame(client: GameApi, session: GameSession, onLost = vi.fn()) {
  return renderHook(() => useGame(session, onLost, client))
}

describe('useGame', () => {
  it('loads the first bug', async () => {
    const { client, session } = await setUp()
    const { result } = renderGame(client, session)
    await waitFor(() => expect(result.current.state.phase).toBe('playing'))
    expect(result.current.state.current).toMatchObject({ index: 0, bug: { id: 'mock-dev-0' } })
  })

  it('reveals the right line after a wrong pick, then scores 50 %', async () => {
    const { client, session } = await setUp()
    const { result } = renderGame(client, session)
    await waitFor(() => expect(result.current.state.phase).toBe('playing'))

    await act(() => result.current.select(0))
    expect(result.current.state.verdict).toEqual({ lineCorrect: false, correctSelection: 1 })

    await act(() => result.current.answer(0))
    expect(result.current.state.phase).toBe('feedback')
    expect(result.current.state.answer).toMatchObject({ correct: true, points: 50, score: 50 })
  })

  it('sends a single answer when the timer and a tap race', async () => {
    const { client, session } = await setUp()
    const answer = vi.spyOn(client, 'answer')
    const { result } = renderGame(client, session)
    await waitFor(() => expect(result.current.state.phase).toBe('playing'))
    await act(() => result.current.select(1))

    await act(() => Promise.all([result.current.answer(null), result.current.answer(0)]))
    expect(answer).toHaveBeenCalledTimes(1)
  })

  it('moves on to the next bug', async () => {
    const { client, session } = await setUp()
    const { result } = renderGame(client, session)
    await waitFor(() => expect(result.current.state.phase).toBe('playing'))
    await act(() => result.current.answer(null))

    act(() => result.current.next())
    await waitFor(() => expect(result.current.state.current?.index).toBe(1))
    expect(result.current.state.tracks).toEqual(['dev', 'network'])
  })

  it('calls onLost when the server does not know the game', async () => {
    const { client } = await setUp()
    const onLost = vi.fn()
    renderGame(client, { gameId: 'nope', token: 'nope' }, onLost)
    await waitFor(() => expect(onLost).toHaveBeenCalledTimes(1))
  })
})

describe('useGame with a network bug drawn as lines', () => {
  it('sends the touched line, not a device', async () => {
    const terminal: FullBug = {
      id: 'mock-net-0', track: 'network', difficulty: 0, points: 100, view: 'terminal', title: 'Les sites ne répondent plus',
      code: ['$ ping google.fr', 'ping: google.fr : nom inconnu'], bugLine: 1,
      choices: ['Corriger le DNS du PC', 'Changer de câble', 'Redémarrer google.fr'], answer: 0, explanation: 'C’est le DNS.',
    }
    const client = createMockClient({ random: () => 0, bugs: mockBugs.map((bug) => (bug.id === terminal.id ? terminal : bug)) })
    const { gameId, token } = await client.createGame({ pseudo: 'Neo42', deviceId: 'device-a' })
    const { result } = renderGame(client, { gameId, token })
    await waitFor(() => expect(result.current.state.phase).toBe('playing'))
    await act(() => result.current.select(1))
    await act(() => result.current.answer(0))
    act(() => result.current.next())
    await waitFor(() => expect(result.current.state.current?.bug.id).toBe('mock-net-0'))

    await act(() => result.current.select(1))
    expect(result.current.state.verdict).toEqual({ lineCorrect: true, correctSelection: 1 })
  })
})
