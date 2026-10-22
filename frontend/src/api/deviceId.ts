const STORAGE_KEY = 'bug-hunt:device-id'

let memoryId: string | null = null

// crypto.randomUUID() only exists in secure contexts (https or localhost).
// On the stand, phones open http://<ip>:8080, so fall back to getRandomValues.
export function randomId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// One id per browser, so a player can replay with the same nickname.
// Storage can be blocked (private mode): the id then lives until reload.
export function getDeviceId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
  } catch {
    // Storage unavailable: use the in-memory id below.
  }

  memoryId ??= randomId()
  try {
    localStorage.setItem(STORAGE_KEY, memoryId)
  } catch {
    // Same as above.
  }
  return memoryId
}
