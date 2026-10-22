const STORAGE_KEY = 'bug-hunt:last-pseudo'

// Prefills the field when a visitor replays. Storage can be blocked
// (private mode): the field then starts with a random nickname.
export function readLastPseudo(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function saveLastPseudo(pseudo: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, pseudo)
  } catch {
    // Not critical: the visitor types it again.
  }
}
