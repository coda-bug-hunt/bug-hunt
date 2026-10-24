// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
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

function stateWith(secondsLeft: number, current: NextBugResponse = next): GameState {
  return {
    ...initialGameState,
    phase: 'playing',
    current,
    endTime: Date.now() + secondsLeft * 1000,
    score: 300,
    tracks: ['dev', 'network', 'dev'],
  }
}

beforeEach(() => {
  localStorage.clear()
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

describe('BugScreen tutorial', () => {
  const first: NextBugResponse = { ...next, index: 0 }
  const lineTip = 'Touche la ligne où se cache le bug.'
  const fixTip = 'Choisis la bonne correction.'

  it('explains the first gesture on the first bug of a new device', () => {
    render(<BugScreen state={stateWith(60, first)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.getByText(lineTip)).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Compris' }))
  })

  it('gives the duck its usual tip back once understood', () => {
    render(<BugScreen state={stateWith(60, first)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Compris' }))
    expect(screen.queryByText(lineTip)).toBeNull()
    expect(screen.getByText(/Lis chaque ligne à voix haute/)).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }))
  })

  it('explains the second gesture when the fix sheet opens', () => {
    const state = { ...stateWith(50, first), selected: 0, verdict: { lineCorrect: true, correctSelection: 0 } }
    render(<BugScreen state={state} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.getByText(fixTip)).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Compris' }))
  })

  it('is shown only once per device', () => {
    const { unmount } = render(<BugScreen state={stateWith(60, first)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    unmount()
    render(<BugScreen state={stateWith(60, first)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.queryByText(lineTip)).toBeNull()
  })

  it('is not shown after the first bug', () => {
    render(<BugScreen state={stateWith(60)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.queryByText(lineTip)).toBeNull()
  })

  it('still shows when storage is blocked', () => {
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked })
    render(<BugScreen state={stateWith(60, first)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.getByText(lineTip)).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('keeps the timer running', () => {
    render(<BugScreen state={stateWith(60, first)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.getByRole('timer').textContent).toBe('0:55')
  })
})
