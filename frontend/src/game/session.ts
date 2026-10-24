import type { GameSession } from '../api'

export type ActiveGame = GameSession & { totalBugs: number }

const STORAGE_KEY = 'bug-hunt:game'

// Kept for the tab only, so a reload resumes the game in progress.
export function readGame(): ActiveGame | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as ActiveGame) : null
  } catch {
    return null
  }
}

export function saveGame(game: ActiveGame): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  } catch {
    // Not critical: a reload then starts from the home screen.
  }
}

export function clearGame(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Same as above.
  }
}
