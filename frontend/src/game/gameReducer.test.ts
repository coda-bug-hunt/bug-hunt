import { describe, expect, it } from 'vitest'
import type { AnswerResponse, NextBugResponse, PublicBug } from '../api'
import { gameReducer, initialGameState } from './gameReducer'

function nextBug(index: number, track: PublicBug['track']): NextBugResponse {
  const base = { id: `bug-${index}`, difficulty: 0 as const, points: 100, title: 'Titre', choices: ['a', 'b', 'c'] as [string, string, string] }
  const bug: PublicBug =
    track === 'dev'
      ? { ...base, track: 'dev', code: ['line'] }
      : { ...base, track: 'network', diagram: { devices: [], links: [] } }
  return { index, bug, timeLimit: 60, remainingSeconds: 42 }
}

const answer: AnswerResponse = {
  correct: true, correctChoice: 0, points: 50, explanation: 'Parce que.', score: 50, finished: false,
}

describe('gameReducer', () => {
  it('plays a bug: wrong line, right line revealed, answer, next bug', () => {
    let state = gameReducer(initialGameState, { type: 'bugLoaded', next: nextBug(0, 'dev'), now: 1000 })
    expect(state).toMatchObject({ phase: 'playing', endTime: 43_000, selected: null, tracks: ['dev'] })

    state = gameReducer(state, { type: 'selected', selection: 2 })
    state = gameReducer(state, { type: 'verdict', verdict: { lineCorrect: false, correctSelection: 1 } })
    expect(state.verdict).toEqual({ lineCorrect: false, correctSelection: 1 })

    state = gameReducer(state, { type: 'answered', answer })
    expect(state).toMatchObject({ phase: 'feedback', score: 50 })

    state = gameReducer(state, { type: 'bugLoaded', next: nextBug(1, 'network'), now: 0 })
    expect(state).toMatchObject({ phase: 'playing', selected: null, verdict: null, answer: null, score: 50 })
    expect(state.tracks).toEqual(['dev', 'network'])
  })

  it('ends the game', () => {
    expect(gameReducer(initialGameState, { type: 'gameOver' }).phase).toBe('over')
  })

  it('lets the player select again when the selection never reached the server', () => {
    let state = gameReducer(initialGameState, { type: 'bugLoaded', next: nextBug(0, 'dev'), now: 0 })
    state = gameReducer(state, { type: 'selected', selection: 2 })
    state = gameReducer(state, { type: 'failed' })
    expect(state).toMatchObject({ error: true, selected: null })
  })

  it('keeps a confirmed selection when the answer fails', () => {
    let state = gameReducer(initialGameState, { type: 'bugLoaded', next: nextBug(0, 'dev'), now: 0 })
    state = gameReducer(state, { type: 'selected', selection: 1 })
    state = gameReducer(state, { type: 'verdict', verdict: { lineCorrect: true, correctSelection: 1 } })
    state = gameReducer(state, { type: 'failed' })
    expect(state).toMatchObject({ error: true, selected: 1 })
  })
})
