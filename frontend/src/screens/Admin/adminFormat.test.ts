import { describe, expect, it } from 'vitest'
import { playedAgo } from './adminFormat'

const now = Date.parse('2026-11-07T10:30:00Z')

describe('playedAgo', () => {
  it.each([
    ['2026-11-07T10:29:40Z', "à l'instant"],
    ['2026-11-07T10:29:00Z', 'il y a 1 min'],
    ['2026-11-07T10:18:00Z', 'il y a 12 min'],
    ['2026-11-07T08:20:00Z', 'il y a 2 h'],
  ])('%s -> %s', (playedAt, expected) => {
    expect(playedAgo(playedAt, now)).toBe(expected)
  })
})
