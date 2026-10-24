// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextBugResponse } from '../../api'
import { initialGameState, type GameState } from '../../game/gameReducer'
import { sound } from '../../sound/player'
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

describe('BugScreen sounds', () => {
  it('ticks each of the last 10 seconds only', () => {
    const play = vi.spyOn(sound, 'play').mockImplementation(() => {})
    render(<BugScreen state={stateWith(12)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(play).not.toHaveBeenCalledWith('tick')
    act(() => vi.advanceTimersByTime(2000))
    expect(play).toHaveBeenCalledWith('tick')
    act(() => vi.advanceTimersByTime(1000))
    expect(play.mock.calls.filter(([name]) => name === 'tick')).toHaveLength(2)
    play.mockRestore()
  })

  it('sounds the timeout at 0', () => {
    const play = vi.spyOn(sound, 'play').mockImplementation(() => {})
    render(<BugScreen state={stateWith(0)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(play).toHaveBeenCalledWith('timeout')
    expect(play).not.toHaveBeenCalledWith('tick')
    play.mockRestore()
  })

  it('clicks when a line is touched', () => {
    const play = vi.spyOn(sound, 'play').mockImplementation(() => {})
    const onSelect = vi.fn()
    render(<BugScreen state={stateWith(42)} totalBugs={10} onSelect={onSelect} onAnswer={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /return age > 18/ }))
    expect(play).toHaveBeenCalledWith('tap')
    expect(onSelect).toHaveBeenCalled()
    play.mockRestore()
  })

  it('has a mute button', () => {
    render(<BugScreen state={stateWith(42)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.getByRole('button', { name: 'Couper le son' })).toBeTruthy()
  })
})
