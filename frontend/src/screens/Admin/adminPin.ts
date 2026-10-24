const STORAGE_KEY = 'bug-hunt:admin-pin'

// Kept for the tab only: closing it signs the admin out.
export function readPin(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function savePin(pin: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, pin)
  } catch {
    // The PIN is then asked again after a reload.
  }
}

export function clearPin(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Same as above.
  }
}
