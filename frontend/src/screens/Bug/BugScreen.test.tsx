// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextBugResponse } from '../../api'
import { initialGameState, type GameState } from '../../game/gameReducer'
import BugScreen from './BugScreen'

const next: NextBugResponse = {
  index: 2,
  timeLimit: 60,
  remainingSeconds: 42,
  bug: {
    id: 'bug-2', track: 'dev', difficulty: 1, points: 200, title: 'Les 18 ans sont refusés',
    code: ['return age > 18;'], choices: ['a', 'b', 'c'],
  },
}

function stateWith(secondsLeft: number): GameState {
  return {
    ...initialGameState,
    phase: 'playing',
    current: next,
    endTime: Date.now() + secondsLeft * 1000,
    score: 300,
    tracks: ['dev', 'network', 'dev'],
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(0)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('BugScreen', () => {
  it('shows the counter, the timer, the score and the track', () => {
    render(<BugScreen state={stateWith(42)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.getByText('Bug 3/10')).toBeTruthy()
    expect(screen.getByRole('timer').textContent).toBe('0:42')
    expect(screen.getByText('300 pts')).toBeTruthy()
    expect(screen.getByText(/DEV · NIVEAU 1/)).toBeTruthy()
  })

  it('turns the timer red under 10 seconds', () => {
    render(<BugScreen state={stateWith(8)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.getByRole('timer').className).toContain('bg-danger')
  })

  it('sends a timeout answer at 0', () => {
    const onAnswer = vi.fn()
    render(<BugScreen state={stateWith(0)} totalBugs={10} onSelect={() => {}} onAnswer={onAnswer} />)
    expect(onAnswer).toHaveBeenCalledWith(null)
  })
})
