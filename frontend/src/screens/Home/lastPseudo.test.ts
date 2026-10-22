import { afterEach, describe, expect, it, vi } from 'vitest'
import { readLastPseudo, saveLastPseudo } from './lastPseudo'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('last pseudo', () => {
  it('reads back what was saved', () => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    })
    expect(readLastPseudo()).toBeNull()
    saveLastPseudo('Neo42')
    expect(readLastPseudo()).toBe('Neo42')
  })

  it('does not crash when storage is blocked', () => {
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked })
    expect(() => saveLastPseudo('Neo42')).not.toThrow()
    expect(readLastPseudo()).toBeNull()
  })
})
