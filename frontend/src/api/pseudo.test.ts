import { describe, expect, it } from 'vitest'
import { isValidPseudo } from './pseudo'

describe('isValidPseudo', () => {
  it.each([
    ['abc', true],
    ['ab', false],
    ['A234567890123456', true],
    ['A2345678901234567', false],
    ['Neo_42-x', true],
    ['Neo 42', false],
    ['Léa42', false],
    ['', false],
  ])('%s -> %s', (pseudo, expected) => {
    expect(isValidPseudo(pseudo)).toBe(expected)
  })
})
