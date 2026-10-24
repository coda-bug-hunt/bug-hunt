const STORAGE_KEY = 'bug-hunt:tutorial-seen'

// The duck explains the two gestures on the very first bug of a device.
// Storage can be blocked (private mode): the tutorial then shows every game.
export function tutorialSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markTutorialSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Not critical: the visitor sees it once more.
  }
}
