import type { Track } from '../../api'

// With no new game for IDLE_MS, the big screen alternates a showcase bug
// (SHOW_MS) and the leaderboard (BOARD_MS). A new game brings the board back.
export const IDLE_MS = 45_000
export const SHOW_MS = 24_000
export const BOARD_MS = 30_000
const STEP_MS = SHOW_MS / 3

// Read the bug, then the duck points at the faulty line, then the fix.
export type ShowcaseStep = 'read' | 'line' | 'fix'

export type ShowcaseBug = {
  track: Track
  title: string
  language: string
  code: string[]
  bugLine: number
  fix: string
}

// Written for the showcase, outside the pool of 50: the big screen shows the
// answer, so it must never be the answer of a bug a visitor will play.
export const SHOWCASE_BUGS: ShowcaseBug[] = [
  {
    track: 'dev',
    title: 'Le jeu dit « Perdu » à celui qui bat le record',
    language: 'Python',
    code: ['def message(score, record):', '    if score < record:', '        return "Nouveau record !"', '    return "Perdu"'],
    bugLine: 1,
    fix: '    if score > record:',
  },
  {
    track: 'dev',
    title: 'Le bouton « Valider » ne fait rien',
    language: 'HTML',
    code: ['<form action="/inscription">', '  <input name="pseudo">', '  <button type="button">Valider</button>', '</form>'],
    bugLine: 2,
    fix: '  <button type="submit">Valider</button>',
  },
  {
    track: 'network',
    title: "La console n'a pas Internet",
    language: 'Console · Réseau',
    code: ['[réseau]', 'ip = 192.168.1.20', 'passerelle = 192.168.1.20', 'dns = 192.168.1.1'],
    bugLine: 2,
    fix: 'passerelle = 192.168.1.1',
  },
]

// Where the screen stands, `sinceChange` ms after the last new game: null for
// the board, or the round (which bug) and its step.
export function showcaseAt(sinceChange: number): { round: number; step: ShowcaseStep } | null {
  if (sinceChange < IDLE_MS) return null
  const elapsed = sinceChange - IDLE_MS
  const round = Math.floor(elapsed / (SHOW_MS + BOARD_MS))
  const inRound = elapsed % (SHOW_MS + BOARD_MS)
  if (inRound >= SHOW_MS) return null
  const steps: ShowcaseStep[] = ['read', 'line', 'fix']
  return { round, step: steps[Math.floor(inRound / STEP_MS)] }
}
