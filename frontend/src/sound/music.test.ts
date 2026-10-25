// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMusic } from './music'
import { createSoundPlayer } from './player'

// Just enough of the Web Audio API: counts notes, records the master volume.
function fakeContext() {
  const param = () => ({
    value: 0,
    targets: [] as number[],
    setValueAtTime() {},
    cancelScheduledValues() {},
    exponentialRampToValueAtTime() {},
    linearRampToValueAtTime(value: number) {
      this.targets.push(value)
    },
  })
  const context = {
    get currentTime() {
      return Date.now() / 1000
    },
    state: 'running',
    destination: {},
    notes: 0,
    gains: [] as ReturnType<typeof param>[],
    resume: async () => {},
    createGain: () => {
      const gain = param()
      context.gains.push(gain)
      return { gain, connect: (node: unknown) => node, disconnect: () => {} }
    },
    createOscillator: () => ({
      type: 'sine',
      frequency: { value: 0 },
      connect: (node: unknown) => node,
      start: () => {
        context.notes++
      },
      stop: () => {},
    }),
  }
  return context
}

function setup() {
  const context = fakeContext()
  const player = createSoundPlayer({ createContext: () => context as unknown as AudioContext })
  const music = createMusic(player)
  // The first gain created by the music is its master volume.
  const master = () => context.gains[0].targets
  return { context, player, music, master }
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('background music', () => {
  it('plays a soft loop once started, and keeps it going', () => {
    const { context, music } = setup()
    music.start()
    const first = context.notes
    expect(first).toBeGreaterThan(0)
    vi.advanceTimersByTime(8000)
    expect(context.notes).toBeGreaterThan(first)
  })

  it('starts only once', () => {
    const { context, music } = setup()
    music.start()
    music.start()
    vi.advanceTimersByTime(4000)
    const { notes } = context
    const twice = setup()
    twice.music.start()
    vi.advanceTimersByTime(4000)
    expect(notes).toBe(twice.context.notes)
  })

  it('stops for good', () => {
    const { context, music } = setup()
    music.start()
    music.stop()
    const { notes } = context
    vi.advanceTimersByTime(8000)
    expect(context.notes).toBe(notes)
  })

  it('stays silent when muted, and comes back when the sound is on again', () => {
    const { context, player, music, master } = setup()
    player.setMuted(true)
    music.start()
    vi.advanceTimersByTime(8000)
    expect(context.notes).toBe(0)
    player.setMuted(false)
    vi.advanceTimersByTime(8000)
    expect(context.notes).toBeGreaterThan(0)
    expect(master().at(-1)).toBeGreaterThan(0)
  })

  it('lowers during the fanfare, then comes back', () => {
    const { music, master } = setup()
    music.start()
    const full = master().at(-1)!
    music.lower(4000)
    expect(master().at(-1)).toBeLessThan(full)
    vi.advanceTimersByTime(4000)
    expect(master().at(-1)).toBe(full)
  })

  it('does not crash without Web Audio', () => {
    const music = createMusic(createSoundPlayer({ createContext: () => null }))
    expect(() => {
      music.start()
      music.lower(1000)
      music.stop()
    }).not.toThrow()
  })
})
