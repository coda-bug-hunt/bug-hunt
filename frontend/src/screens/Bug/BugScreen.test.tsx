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
  score: 0,
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

describe('BugScreen hint', () => {
  const hint = 'À 18 ans pile, on a le droit de voter ?'
  const hinted: NextBugResponse = { ...next, bug: { ...next.bug, hint } }

  it('whispers the hint when the duck is touched', () => {
    render(<BugScreen state={stateWith(55, hinted)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.queryByText(hint)).toBeNull()
    const duck = screen.getByRole('button', { name: 'Demander un indice au canard' })
    fireEvent.click(duck)
    expect(screen.getAllByText(hint).length).toBeGreaterThan(0)
    expect(duck.getAttribute('aria-expanded')).toBe('true')
  })

  it('offers the hint from 5 seconds, then alternates it with its tip every 8 seconds', () => {
    render(<BugScreen state={stateWith(56, hinted)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    const bubble = () => document.getElementById('duck-bubble')!.textContent
    expect(bubble()).toMatch(/Lis chaque ligne/)
    act(() => vi.advanceTimersByTime(1000))
    const first = bubble()
    expect(first).toMatch(/indice/i)
    act(() => vi.advanceTimersByTime(8000))
    expect(bubble()).toMatch(/Lis chaque ligne/)
    act(() => vi.advanceTimersByTime(8000))
    // Said another way each time, so the visitor notices it.
    expect(bubble()).toMatch(/indice/i)
    expect(bubble()).not.toBe(first)
    // No extra button: the duck is the way to the hint.
    expect(screen.queryByRole('button', { name: "Afficher l'indice" })).toBeNull()
  })

  it('moves while it offers the hint, and only where motion is allowed', () => {
    render(<BugScreen state={stateWith(56, hinted)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    const duck = screen.getByRole('button', { name: 'Demander un indice au canard' })
    expect(duck.className).not.toContain('animate-')
    act(() => vi.advanceTimersByTime(1000))
    expect(duck.className).toContain('motion-safe:animate-duck-bob')
    fireEvent.click(duck)
    expect(document.getElementById('duck-bubble')!.textContent).toBe(hint)
    expect(duck.className).not.toContain('animate-')
  })

  it('offers nothing when the bug has no hint', () => {
    render(<BugScreen state={stateWith(30)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Demander un indice au canard' })).toBeNull()
    expect(screen.queryByText(/indice/i)).toBeNull()
  })
})

describe('BugScreen ring', () => {
  it('empties the ring around the duck with the end time of the bug', () => {
    const { container } = render(<BugScreen state={stateWith(30)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    const circle = container.querySelector('[data-ring]')!
    const emptied = () => Number(circle.getAttribute('stroke-dashoffset')) / Number(circle.getAttribute('stroke-dasharray'))
    expect(emptied()).toBeCloseTo(0.5)
    act(() => vi.advanceTimersByTime(15000))
    expect(emptied()).toBeCloseTo(0.75)
    expect(screen.getByRole('timer').textContent).toBe('0:15')
  })
})

describe('BugScreen views', () => {
  const lines: NextBugResponse = {
    ...next,
    bug: {
      id: 'net-t', track: 'network', difficulty: 1, points: 200, view: 'terminal', title: 'Les sites ne répondent plus',
      context: 'Le PC joint 8.8.8.8, mais aucun site.',
      code: ['$ ping google.fr', 'ping: google.fr : nom inconnu'], choices: ['a', 'b', 'c'],
    },
  }

  it('draws a network bug as lines the player touches', () => {
    const onSelect = vi.fn()
    render(<BugScreen state={stateWith(42, lines)} totalBugs={10} onSelect={onSelect} onAnswer={() => {}} />)
    expect(screen.getByText(/SR · NIVEAU 1/)).toBeTruthy()
    expect(screen.getByText('Le PC joint 8.8.8.8, mais aucun site.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /nom inconnu/ }))
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('draws each line view in its own skin', () => {
    const { unmount } = render(<BugScreen state={stateWith(42, lines)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.getByText('Terminal')).toBeTruthy()
    unmount()

    const email: NextBugResponse = {
      ...next,
      bug: { ...lines.bug, view: 'email', code: ['De : Netflix <info@netflix.com>', '', 'Clique ici : http://netflix.ru'] },
    }
    render(<BugScreen state={stateWith(42, email)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.getByText('De :')).toBeTruthy()
    expect(screen.getByText('http://netflix.ru').className).toContain('underline')
  })

  it('draws settings and firewall rules in their own skin', () => {
    const config: NextBugResponse = { ...next, bug: { ...lines.bug, view: 'config', code: ['bande = 5GHz'] } }
    const { unmount } = render(<BugScreen state={stateWith(42, config)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.getByText('Réglages')).toBeTruthy()
    unmount()

    const rules: NextBugResponse = { ...next, bug: { ...lines.bug, view: 'rules', code: ['Bloquer tout'] } }
    render(<BugScreen state={stateWith(42, rules)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.getByText('Pare-feu')).toBeTruthy()
  })

  it('names the language of the code when the bug gives one', () => {
    const sql: NextBugResponse = { ...next, bug: { ...next.bug, language: 'SQL' } }
    render(<BugScreen state={stateWith(42, sql)} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.getByText('SQL')).toBeTruthy()
  })

  it('names the right line after a pick on a line view', () => {
    const state = { ...stateWith(42, lines), selected: 0, verdict: { lineCorrect: false, correctSelection: 1 } }
    render(<BugScreen state={state} totalBugs={10} onSelect={() => {}} onAnswer={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Raté : le bug est ligne 2. Quelle correction ?' })).toBeTruthy()
  })
})
