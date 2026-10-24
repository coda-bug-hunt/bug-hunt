import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSoundPlayer, type SoundDeps } from './player'

// Just enough of the Web Audio API to count the notes played.
function fakeContext() {
  const ramp = () => {}
  const context = {
    currentTime: 0,
    state: 'suspended',
    destination: {},
    notes: [] as number[],
    resume: vi.fn(async () => {
      context.state = 'running'
    }),
    createGain: () => ({
      gain: { setValueAtTime: ramp, exponentialRampToValueAtTime: ramp },
      connect: (node: unknown) => node,
    }),
    createOscillator: () => {
      const oscillator = {
        type: 'sine',
        frequency: { value: 0 },
        connect: (node: unknown) => node,
        start: () => context.notes.push(oscillator.frequency.value),
        stop: () => {},
      }
      return oscillator
    },
  }
  return context
}

function setup(overrides: Partial<SoundDeps> = {}) {
  const context = fakeContext()
  const vibrate = vi.fn()
  const deps = { createContext: () => context as unknown as AudioContext, vibrate, ...overrides }
  return { player: createSoundPlayer(deps), context, vibrate }
}

beforeEach(() => {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('sound player', () => {
  it('is on by default and plays generated notes', () => {
    const { player, context } = setup()
    expect(player.isMuted()).toBe(false)
    player.play('right')
    expect(context.notes.length).toBeGreaterThan(0)
  })

  it('unlocks the audio on a tap (iOS needs a user gesture)', () => {
    const { player, context } = setup()
    player.unlock()
    expect(context.resume).toHaveBeenCalled()
  })

  it('vibrates on a right or a wrong answer only', () => {
    const { player, vibrate } = setup()
    player.play('tick')
    expect(vibrate).not.toHaveBeenCalled()
    player.play('right')
    player.play('wrong')
    expect(vibrate).toHaveBeenCalledTimes(2)
  })

  it('plays nothing and does not vibrate when muted', () => {
    const { player, context, vibrate } = setup()
    player.setMuted(true)
    player.play('wrong')
    expect(context.notes).toHaveLength(0)
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('remembers the choice on the device', () => {
    setup().player.setMuted(true)
    expect(setup().player.isMuted()).toBe(true)
  })

  it('tells the mute button when the setting changes', () => {
    const { player } = setup()
    const listener = vi.fn()
    const unsubscribe = player.subscribe(listener)
    player.setMuted(true)
    unsubscribe()
    player.setMuted(false)
    expect(listener).toHaveBeenCalledOnce()
  })

  it('plays a sound once when asked twice at the same moment (React strict mode)', () => {
    const { player, context } = setup()
    player.play('tap')
    const once = context.notes.length
    player.play('tap')
    expect(context.notes).toHaveLength(once)
    vi.advanceTimersByTime(1000)
    player.play('tap')
    expect(context.notes).toHaveLength(once * 2)
  })

  it('does not crash without Web Audio, vibration or storage', () => {
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked })
    const { player } = setup({ createContext: () => null, vibrate: undefined })
    expect(() => {
      player.unlock()
      player.play('fanfare')
      player.setMuted(true)
    }).not.toThrow()
  })
})
