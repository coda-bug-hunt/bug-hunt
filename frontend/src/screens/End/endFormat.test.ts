import { describe, expect, it } from 'vitest'
import { formatScore, rankText } from './endFormat'

describe('formatScore', () => {
  it('groups thousands the French way, with a narrow no-break space', () => {
    expect(formatScore(2150)).toBe('2 150')
    expect(formatScore(950)).toBe('950')
  })
})

describe('rankText', () => {
  it('says the rank among the players', () => {
    expect(rankText(4, 37)).toBe('4ᵉ au classement sur 37 joueurs')
  })

  it('uses 1ᵉʳ and the singular', () => {
    expect(rankText(1, 1)).toBe('1ᵉʳ au classement sur 1 joueur')
  })
})
