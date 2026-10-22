import { afterEach, describe, expect, it, vi } from 'vitest'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

// deviceId keeps an in-memory fallback: reload the module for each test.
async function loadModule() {
  vi.resetModules()
  return import('./deviceId')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getDeviceId', () => {
  it('returns the same id on every call', async () => {
    vi.stubGlobal('localStorage', memoryStorage())
    const { getDeviceId } = await loadModule()
    const id = getDeviceId()
    expect(id).not.toBe('')
    expect(getDeviceId()).toBe(id)
  })

  it('still works when storage throws', async () => {
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked })
    const { getDeviceId } = await loadModule()
    const id = getDeviceId()
    expect(getDeviceId()).toBe(id)
  })
})

describe('randomId', () => {
  it('works without crypto.randomUUID (http on the stand)', async () => {
    vi.stubGlobal('crypto', { getRandomValues: (bytes: Uint8Array) => bytes.fill(171) })
    const { randomId } = await loadModule()
    expect(randomId()).toBe('ab'.repeat(16))
  })
})
