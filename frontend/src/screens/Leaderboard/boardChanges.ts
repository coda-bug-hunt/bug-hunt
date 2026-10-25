import type { Leaderboard, LeaderboardEntry } from '../../api'

export type BoardChanges = {
  // Nicknames that entered the top or climbed, to slide and highlight.
  moved: string[]
  // The new first place, when it beats the previous best score.
  record: LeaderboardEntry | null
}

// Everything comes from two answers of GET /leaderboard: no API change.
export function compareBoards(previous: Leaderboard | null, current: Leaderboard): BoardChanges {
  if (!previous) return { moved: [], record: null }

  const ranks = new Map(previous.top.map((entry) => [entry.pseudo, entry.rank]))
  const moved = current.top
    .filter((entry) => {
      const before = ranks.get(entry.pseudo)
      return before === undefined || entry.rank < before
    })
    .map((entry) => entry.pseudo)

  // A hidden record holder lowers the best score: that is no record.
  const best = previous.top[0]?.score ?? -Infinity
  const first = current.top[0]
  return { moved, record: first && first.score > best ? first : null }
}
