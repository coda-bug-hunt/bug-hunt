import type {
  AdminPlayersResponse,
  AnswerRequest,
  AnswerResponse,
  ApiErrorCode,
  CreateGameRequest,
  CreateGameResponse,
  GameResult,
  Leaderboard,
  NextBugResponse,
  SelectionRequest,
  SelectionResponse,
} from './types'

// What the client keeps after creating a game, to call the game routes.
export type GameSession = {
  gameId: string
  token: string
}

// One method per route of contract v1. Screens only talk to this interface:
// the mock client and the HTTP client (#41) both implement it.
export interface GameApi {
  createGame(request: CreateGameRequest): Promise<CreateGameResponse>
  // null when the game is over (204).
  nextBug(session: GameSession): Promise<NextBugResponse | null>
  select(session: GameSession, request: SelectionRequest): Promise<SelectionResponse>
  answer(session: GameSession, request: AnswerRequest): Promise<AnswerResponse>
  getResult(session: GameSession): Promise<GameResult>
  getLeaderboard(): Promise<Leaderboard>
  getAdminPlayers(pin: string): Promise<AdminPlayersResponse>
  setHidden(pin: string, pseudo: string, hidden: boolean): Promise<void>
}

// Thrown for every { "error": "<code>" } answer.
export class ApiRequestError extends Error {
  code: ApiErrorCode

  constructor(code: ApiErrorCode) {
    super(code)
    this.name = 'ApiRequestError'
    this.code = code
  }
}
