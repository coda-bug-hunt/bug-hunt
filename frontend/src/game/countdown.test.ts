import { describe, expect, it } from 'vitest'
import { endTimeFrom, formatSeconds, secondsLeft } from './countdown'

describe('countdown', () => {
  it('counts down from the end time', () => {
    const end = endTimeFrom(60, 1000)
    expect(secondsLeft(end, 1000)).toBe(60)
    expect(secondsLeft(end, 1001)).toBe(60)
    expect(secondsLeft(end, 31_000)).toBe(30)
    expect(secondsLeft(end, 61_000)).toBe(0)
  })

  it('never goes below 0', () => {
    expect(secondsLeft(endTimeFrom(5, 0), 999_999)).toBe(0)
  })

  it('formats minutes and seconds', () => {
    expect(formatSeconds(60)).toBe('1:00')
    expect(formatSeconds(42)).toBe('0:42')
    expect(formatSeconds(7)).toBe('0:07')
  })
})
