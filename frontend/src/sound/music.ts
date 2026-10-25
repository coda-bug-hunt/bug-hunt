import { sound, type SoundPlayer } from './player'

// Soft background loop of the big screen, generated with the Web Audio API:
// slow chords and a light pentatonic melody. Never played on a phone.

const VOLUME = 0.5
// Share of the volume kept while the record fanfare plays.
const LOWERED = 0.2
const BAR_SECONDS = 4
// Notes are scheduled this far ahead, so a slow tab never leaves a gap.
const AHEAD_SECONDS = 2
const TICK_MS = 1000

// Cmaj7, Am7, Fmaj7, G6
const CHORDS = [
  [130.81, 164.81, 196.0, 246.94],
  [110.0, 130.81, 164.81, 196.0],
  [87.31, 110.0, 130.81, 164.81],
  [98.0, 123.47, 146.83, 164.81],
]

// C major pentatonic; one bar is 8 steps of half a second, null = rest.
const C5 = 523.25
const D5 = 587.33
const E5 = 659.25
const G5 = 783.99
const A5 = 880.0
const MELODY = [
  [E5, null, G5, null, null, A5, null, null],
  [C5, null, null, E5, null, D5, null, null],
  [A5, null, G5, null, E5, null, null, null],
  [D5, null, null, G5, null, null, E5, null],
]

export function createMusic(player: SoundPlayer) {
  let context: AudioContext | null = null
  let master: GainNode | null = null
  let timer: number | undefined
  let unsubscribe = () => {}
  let nextBar = 0
  let bar = 0
  let lowered = false
  let restore: number | undefined

  function level() {
    if (player.isMuted()) return 0
    return lowered ? VOLUME * LOWERED : VOLUME
  }

  function fadeTo(value: number, seconds: number) {
    if (!context || !master) return
    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(value, now + seconds)
  }

  function note(ctx: AudioContext, out: GainNode, freq: number, start: number, wave: OscillatorType, peak: number, attack: number, length: number) {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = wave
    oscillator.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(peak, start + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
    oscillator.connect(gain).connect(out)
    oscillator.start(start)
    oscillator.stop(start + length + 0.05)
  }

  function scheduleBar(ctx: AudioContext, out: GainNode, start: number, index: number) {
    // Pads overlap the next bar a little, so chords melt into each other.
    for (const freq of CHORDS[index % CHORDS.length]) note(ctx, out, freq, start, 'sine', 0.05, 1.2, BAR_SECONDS + 0.8)
    MELODY[index % MELODY.length].forEach((freq, step) => {
      if (freq) note(ctx, out, freq, start + step * 0.5, 'triangle', 0.035, 0.02, 1.2)
    })
  }

  function schedule() {
    if (!context || !master) return
    while (nextBar < context.currentTime + AHEAD_SECONDS) {
      if (!player.isMuted()) scheduleBar(context, master, nextBar, bar)
      nextBar += BAR_SECONDS
      bar++
    }
  }

  return {
    // Call from a key or a click: browsers only start audio after a gesture.
    start() {
      if (timer !== undefined) return
      try {
        context = player.context()
        if (!context) return
        master = context.createGain()
        master.gain.value = 0
        master.connect(context.destination)
        fadeTo(level(), 2)
        nextBar = context.currentTime + 0.1
        schedule()
        timer = window.setInterval(schedule, TICK_MS)
        unsubscribe = player.subscribe(() => fadeTo(level(), 0.5))
      } catch {
        // Music is a bonus: the big screen works without it.
      }
    },
    stop() {
      window.clearInterval(timer)
      window.clearTimeout(restore)
      timer = undefined
      unsubscribe()
      fadeTo(0, 0.3)
      master?.disconnect()
      master = null
    },
    // Makes room for the record fanfare, then comes back.
    lower(ms: number) {
      lowered = true
      fadeTo(level(), 0.3)
      window.clearTimeout(restore)
      restore = window.setTimeout(() => {
        lowered = false
        fadeTo(level(), 1.5)
      }, ms)
    },
  }
}

export const music = createMusic(sound)
