// 2150 -> "2 150", with the narrow no-break space French uses.
export function formatScore(points: number): string {
  return points.toLocaleString('fr-FR')
}

export function rankText(rank: number, playersCount: number): string {
  const ordinal = rank === 1 ? '1ᵉʳ' : `${rank}ᵉ`
  return `${ordinal} au classement sur ${playersCount} joueur${playersCount > 1 ? 's' : ''}`
}
