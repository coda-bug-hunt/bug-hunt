import { describe, expect, it } from 'vitest'
import { isValidPseudo } from '../../api/pseudo'
import { randomPseudo } from './randomPseudo'

describe('randomPseudo', () => {
  it('always produces a valid nickname', () => {
    for (let i = 0; i < 1000; i++) {
      const pseudo = randomPseudo()
      expect(isValidPseudo(pseudo), pseudo).toBe(true)
    }
  })

  it('stays valid at the extremes of the random source', () => {
    expect(isValidPseudo(randomPseudo(() => 0))).toBe(true)
    expect(isValidPseudo(randomPseudo(() => 0.9999))).toBe(true)
  })
})
