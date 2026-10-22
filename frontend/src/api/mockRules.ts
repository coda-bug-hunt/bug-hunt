// Game rules the mock client applies, as the server will (CLAUDE.md, domain rules).
// Only the mock uses them: screens never compute scores.

import type { Affinity, ByTrack, Level } from './types'

export const TIME_LIMIT = 60
export const LEVELS: Level[] = [0, 1, 2, 3, 4]
// 100 + 200 + 300 + 400 + 500
export const MAX_PER_TRACK = 1500

export function basePoints(level: Level): number {
  return 100 * (level + 1)
}

export function pointsFor(
  level: Level,
  lineCorrect: boolean,
  choiceCorrect: boolean,
  timedOut: boolean,
): number {
  if (timedOut || !choiceCorrect) return 0
  return lineCorrect ? basePoints(level) : basePoints(level) / 2
}

export function percentOf(points: number): number {
  return Math.round((points / MAX_PER_TRACK) * 100)
}

// A gap of 10 percentage points or less is "both". Compared on exact
// percentages: rounding first could flip the result at the boundary.
export function affinityOf(byTrack: ByTrack): Affinity {
  const gap = ((byTrack.dev - byTrack.network) / MAX_PER_TRACK) * 100
  if (Math.abs(gap) <= 10) return 'both'
  return gap > 0 ? 'dev' : 'network'
}
