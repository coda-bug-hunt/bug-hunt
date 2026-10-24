// "il y a 12 min", from the ISO date of the last game.
export function playedAgo(playedAt: string, now: number): string {
  const minutes = Math.floor((now - Date.parse(playedAt)) / 60_000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  return `il y a ${Math.floor(minutes / 60)} h`
}
