import { describe, expect, it } from 'vitest'
import { affinityOf, pointsFor } from './mockRules'
import type { Level } from './types'

describe('pointsFor', () => {
  // [level, lineCorrect, choiceCorrect, timedOut, expected]
  const cases: [Level, boolean, boolean, boolean, number][] = [
    [0, true, true, false, 100],
    [4, true, true, false, 500],
    [0, false, true, false, 50],
    [4, false, true, false, 250],
    [0, true, false, false, 0],
    [4, false, false, false, 0],
    [0, true, true, true, 0],
    [4, true, true, true, 0],
  ]

  it.each(cases)(
    'level %i, right line %s, right fix %s, timeout %s -> %i',
    (level, lineCorrect, choiceCorrect, timedOut, expected) => {
      expect(pointsFor(level, lineCorrect, choiceCorrect, timedOut)).toBe(expected)
    },
  )
})

describe('affinityOf', () => {
  it('is both when nobody scored', () => {
    expect(affinityOf({ dev: 0, network: 0 })).toBe('both')
  })

  it('is both at a gap of exactly 10 points', () => {
    // 150 / 1500 = 10 %
    expect(affinityOf({ dev: 450, network: 300 })).toBe('both')
  })

  it('picks the stronger track above a gap of 10 points', () => {
    expect(affinityOf({ dev: 500, network: 300 })).toBe('dev')
    expect(affinityOf({ dev: 300, network: 500 })).toBe('network')
  })
})
