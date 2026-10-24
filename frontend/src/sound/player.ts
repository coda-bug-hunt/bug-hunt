import { useSyncExternalStore } from 'react'

export type SoundName = 'tap' | 'right' | 'wrong' | 'tick' | 'timeout' | 'fanfare'

// One generated note: no audio file, no dependency.
type Note = { freq: number; at: number; length: number; wave: OscillatorType; volume: number }

const note = (freq: number, at: number, length: number, wave: OscillatorType = 'triangle', volume = 0.25): Note => ({
  freq, at, length, wave, volume,
})

const SOUNDS: Record<SoundName, Note[]> = {
  tap: [note(660, 0, 0.06, 'square', 0.08)],
  right: [note(523, 0, 0.12), note(659, 0.09, 0.12), note(784, 0.18, 0.25)],
  wrong: [note(330, 0, 0.18, 'sawtooth', 0.12), note(247, 0.16, 0.3, 'sawtooth', 0.12)],
  tick: [note(1200, 0, 0.04, 'square', 0.05)],
  timeout: [note(196, 0, 0.5, 'square', 0.12)],
  fanfare: [note(523, 0, 0.14), note(659, 0.14, 0.14), note(784, 0.28, 0.14), note(1047, 0.42, 0.5)],
}

// Android only; other phones ignore it.
const VIBRATIONS: Partial<Record<SoundName, number | number[]>> = { right: 40, wrong: [60, 50, 60] }

// React strict mode runs mount effects twice: the same sound within this delay plays once.
const REPEAT_MS = 100
const STORAGE_KEY = 'bug-hunt:sound-muted'

export type SoundDeps = {
  createContext: () => AudioContext | null
  vibrate?: (pattern: number | number[]) => void
}

export type SoundPlayer = ReturnType<typeof createSoundPlayer>

function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0')
  } catch {
    // Not critical: the setting lasts until the page is closed.
  }
}

export function createSoundPlayer({ createContext, vibrate }: SoundDeps) {
  let context: AudioContext | null = null
  let muted = readMuted()
  let last = { name: '', time: -Infinity }
  const listeners = new Set<() => void>()

  // Created lazily; resumed from a tap, as iOS only starts audio on a user gesture.
  function audio(): AudioContext | null {
    try {
      context ??= createContext()
      if (context?.state === 'suspended') void context.resume()
    } catch {
      context = null
    }
    return context
  }

  function schedule(ctx: AudioContext, { freq, at, length, wave, volume }: Note) {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    const start = ctx.currentTime + at
    oscillator.type = wave
    oscillator.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(start)
    oscillator.stop(start + length + 0.02)
  }

  return {
    unlock() {
      audio()
    },
    play(name: SoundName) {
      if (muted) return
      const now = Date.now()
      if (last.name === name && now - last.time < REPEAT_MS) return
      last = { name, time: now }
      const pattern = VIBRATIONS[name]
      try {
        if (pattern !== undefined) vibrate?.(pattern)
        const ctx = audio()
        if (ctx) SOUNDS[name].forEach((n) => schedule(ctx, n))
      } catch {
        // A sound that fails never stops the game.
      }
    },
    isMuted: () => muted,
    setMuted(value: boolean) {
      muted = value
      saveMuted(value)
      listeners.forEach((listener) => listener())
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

function browserContext(): AudioContext | null {
  const Context = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return Context ? new Context() : null
}

export const sound = createSoundPlayer({
  createContext: browserContext,
  vibrate: (pattern) => navigator.vibrate?.(pattern),
})

export function useMuted(player: SoundPlayer = sound): boolean {
  return useSyncExternalStore(player.subscribe, player.isMuted)
}
