import { describe, expect, it } from 'vitest'
import { BOARD_MS, IDLE_MS, SHOW_MS, SHOWCASE_BUGS, showcaseAt } from './showcase'

const s = 1000

describe('showcaseAt', () => {
  it('shows the board while games keep ending', () => {
    expect(showcaseAt(0)).toBeNull()
    expect(showcaseAt(IDLE_MS - 1)).toBeNull()
  })

  it('then alternates a showcase and the board', () => {
    expect(showcaseAt(IDLE_MS)).toEqual({ round: 0, step: 'read' })
    expect(showcaseAt(IDLE_MS + SHOW_MS - 1)?.step).toBe('fix')
    expect(showcaseAt(IDLE_MS + SHOW_MS)).toBeNull()
    expect(showcaseAt(IDLE_MS + SHOW_MS + BOARD_MS)).toEqual({ round: 1, step: 'read' })
  })

  it('reads the bug, then points at the faulty line, then shows the fix', () => {
    expect(showcaseAt(IDLE_MS + 2 * s)?.step).toBe('read')
    expect(showcaseAt(IDLE_MS + 9 * s)?.step).toBe('line')
    expect(showcaseAt(IDLE_MS + 17 * s)?.step).toBe('fix')
  })
})

describe('SHOWCASE_BUGS', () => {
  it('are short enough for the big screen, with their faulty line', () => {
    for (const bug of SHOWCASE_BUGS) {
      expect(bug.code.length).toBeLessThanOrEqual(6)
      expect(bug.code[bug.bugLine]).toBeTruthy()
    }
  })
})
