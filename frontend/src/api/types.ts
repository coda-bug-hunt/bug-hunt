// API contract v1 (spec section 3.2).
// Change the spec first, then these types, then both sides of the API.

// --- Shared ---

// `network` is shown as "SR" to players; the id stays `network`.
export type Track = 'dev' | 'network'

// 0 = complete beginners, 4 = hardest. Points: 100 x (level + 1).
export type Level = 0 | 1 | 2 | 3 | 4

// `both` when the dev % and network % gap is 10 points or less.
export type Affinity = 'dev' | 'network' | 'both'

export type ByTrack = { dev: number; network: number }

export type Choice = 0 | 1 | 2

// --- Bugs, as the client sees them ---
// Never add bugLine, bugTarget, answer or explanation here: the client
// must not know the right answer before the player answers.

type PublicBugBase = {
  id: string
  difficulty: Level
  points: number
  title: string
  choices: [string, string, string]
}

export type PublicDevBug = PublicBugBase & {
  track: 'dev'
  code: string[]
}

// Device fields are pending the bug JSON format issue (#2).
export type NetworkInterface = { ip: string; mask: string }

export type NetworkDevice = {
  id: string
  label: string
  ip?: string
  mask?: string
  gateway?: string
  dns?: string
  ports?: { port: number; open: boolean }[]
  interfaces?: NetworkInterface[]
}

export type NetworkDiagram = {
  devices: NetworkDevice[]
  links: [string, string][]
}

export type PublicNetworkBug = PublicBugBase & {
  track: 'network'
  diagram: NetworkDiagram
}

export type PublicBug = PublicDevBug | PublicNetworkBug

// --- POST /api/games ---

export type CreateGameRequest = {
  pseudo: string
  deviceId: string
}

export type CreateGameResponse = {
  gameId: string
  token: string
  totalBugs: number
}

// --- GET /api/games/{gameId}/next ---
// 204 No Content once the game is over (the client returns null).

export type NextBugResponse = {
  index: number
  bug: PublicBug
  timeLimit: number
  remainingSeconds: number
}

// --- POST /api/games/{gameId}/selection ---

export type SelectionRequest =
  | { bugId: string; selectedLine: number }
  | { bugId: string; selectedTarget: string }

export type SelectionResponse =
  | { lineCorrect: boolean; correctLine: number }
  | { lineCorrect: boolean; correctTarget: string }

// --- POST /api/games/{gameId}/answers ---

export type AnswerRequest = {
  bugId: string
  // null when the timer ran out on screen: scores 0, and needs no selection.
  choice: Choice | null
}

export type AnswerResponse = {
  correct: boolean
  correctChoice: Choice
  points: number
  explanation: string
  score: number
  finished: boolean
}

// --- GET /api/games/{gameId}/result ---

export type GameResult = {
  score: number
  maxScore: number
  byTrack: ByTrack
  percentByTrack: ByTrack
  // null in dev-only mode.
  affinity: Affinity | null
  rank: number
  playersCount: number
}

// --- GET /api/leaderboard ---

export type LeaderboardEntry = {
  rank: number
  pseudo: string
  score: number
  affinity: Affinity | null
  byTrack: ByTrack
}

export type Leaderboard = {
  top: LeaderboardEntry[]
  gauges: ByTrack
  gamesPlayed: number
}

// --- Admin (header X-Admin-Pin) ---

export type AdminPlayer = {
  pseudo: string
  bestScore: number
  affinity: Affinity | null
  hidden: boolean
  lastPlayedAt: string
}

// GET /api/admin/players
export type AdminPlayersResponse = {
  players: AdminPlayer[]
}

// PATCH /api/admin/players/{pseudo}, answers 204
export type SetHiddenRequest = {
  hidden: boolean
}

// --- Errors ---
// Every error body is { "error": "<code>" }; the front maps codes to French messages.

export type ApiErrorCode =
  | 'pseudo_invalid'
  | 'pseudo_unavailable'
  | 'bad_token'
  | 'unknown_game'
  | 'already_selected'
  | 'not_current_bug'
  | 'already_answered'
  | 'selection_missing'
  | 'game_not_finished'
  | 'bad_pin'
  | 'unknown_player'

export type ApiError = {
  error: ApiErrorCode
}
