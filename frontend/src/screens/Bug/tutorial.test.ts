import { afterEach, describe, expect, it, vi } from 'vitest'
import { markTutorialSeen, tutorialSeen } from './tutorial'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('tutorial memory', () => {
  it('is not seen on a new device, then remembered', () => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    })
    expect(tutorialSeen()).toBe(false)
    markTutorialSeen()
    expect(tutorialSeen()).toBe(true)
  })

  it('counts as not seen when storage is blocked, without crashing', () => {
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked })
    expect(() => markTutorialSeen()).not.toThrow()
    expect(tutorialSeen()).toBe(false)
  })
})
