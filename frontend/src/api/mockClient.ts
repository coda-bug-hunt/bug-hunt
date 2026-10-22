// In-memory GameApi with the same rules as the server, so screens can be
// built and tested before the back end exists.

import { ApiRequestError, type GameApi, type GameSession } from './gameApi'
import { randomId } from './deviceId'
import { isValidPseudo } from './pseudo'
import { mockBugs, type MockBug } from './mockBugs'
import { LEVELS, MAX_PER_TRACK, TIME_LIMIT, affinityOf, percentOf, pointsFor } from './mockRules'
import type { Affinity, ByTrack, LeaderboardEntry, PublicBug } from './types'

const TOP_SIZE = 10
const ADMIN_LIST_SIZE = 50

type GameState = {
  id: string
  token: string
  pseudoKey: string
  bugs: MockBug[]
  index: number
  sentAt: number | null
  lineCorrect: boolean | null
  byTrack: ByTrack
}

type BestGame = {
  score: number
  byTrack: ByTrack
  affinity: Affinity
  // When the score was reached: an earlier score ranks higher on a tie.
  reachedAt: number
}

type PlayerState = {
  pseudo: string
  deviceId: string
  best: BestGame | null
  hidden: boolean
  lastPlayedAt: number
}

type RankedPlayer = PlayerState & { best: BestGame }

export type MockClientOptions = {
  now?: () => number
  random?: () => number
  adminPin?: string
  bugs?: MockBug[]
}

// Explicit list of public fields: a secret field added later cannot leak.
function toPublic(bug: MockBug): PublicBug {
  const base = {
    id: bug.id,
    difficulty: bug.difficulty,
    points: bug.points,
    title: bug.title,
    choices: bug.choices,
  }
  return bug.track === 'dev'
    ? { ...base, track: 'dev', code: bug.code }
    : { ...base, track: 'network', diagram: bug.diagram }
}

export function createMockClient(options: MockClientOptions = {}): GameApi {
  const now = options.now ?? Date.now
  const random = options.random ?? Math.random
  const adminPin = options.adminPin ?? '0000'
  const catalog = options.bugs ?? mockBugs

  const games = new Map<string, GameState>()
  const players = new Map<string, PlayerState>()
  const finishedAffinities: Affinity[] = []

  function pick(track: MockBug['track'], level: number): MockBug {
    const pool = catalog.filter((bug) => bug.track === track && bug.difficulty === level)
    if (pool.length === 0) throw new Error(`No ${track} bug for level ${level}`)
    return pool[Math.floor(random() * pool.length)]
  }

  // One dev bug then one network bug per level, from 0 to 4.
  function drawBugs(): MockBug[] {
    return LEVELS.flatMap((level) => [pick('dev', level), pick('network', level)])
  }

  function gameFor(session: GameSession): GameState {
    const game = games.get(session.gameId)
    if (!game) throw new ApiRequestError('unknown_game')
    if (game.token !== session.token) throw new ApiRequestError('bad_token')
    return game
  }

  function currentBug(game: GameState, bugId: string): MockBug {
    const bug = game.bugs[game.index]
    if (!bug || bug.id !== bugId) throw new ApiRequestError('not_current_bug')
    return bug
  }

  function scoreOf(byTrack: ByTrack): number {
    return byTrack.dev + byTrack.network
  }

  // Players with at least one finished game, not hidden by an admin.
  function visiblePlayers(): RankedPlayer[] {
    return [...players.values()].filter(
      (player): player is RankedPlayer => !player.hidden && player.best !== null,
    )
  }

  function recordFinished(game: GameState) {
    const player = players.get(game.pseudoKey)
    const affinity = affinityOf(game.byTrack)
    finishedAffinities.push(affinity)
    if (!player) return
    const score = scoreOf(game.byTrack)
    if (!player.best || score > player.best.score) {
      player.best = { score, byTrack: { ...game.byTrack }, affinity, reachedAt: now() }
    }
  }

  function checkPin(pin: string) {
    if (pin !== adminPin) throw new ApiRequestError('bad_pin')
  }

  return {
    async createGame({ pseudo, deviceId }) {
      if (!isValidPseudo(pseudo)) throw new ApiRequestError('pseudo_invalid')
      const pseudoKey = pseudo.toLowerCase()
      const player = players.get(pseudoKey)
      if (player && player.deviceId !== deviceId) throw new ApiRequestError('pseudo_unavailable')
      if (player) {
        player.lastPlayedAt = now()
      } else {
        players.set(pseudoKey, { pseudo, deviceId, best: null, hidden: false, lastPlayedAt: now() })
      }

      const game: GameState = {
        id: randomId(),
        token: randomId(),
        pseudoKey,
        bugs: drawBugs(),
        index: 0,
        sentAt: null,
        lineCorrect: null,
        byTrack: { dev: 0, network: 0 },
      }
      games.set(game.id, game)
      return { gameId: game.id, token: game.token, totalBugs: game.bugs.length }
    },

    async nextBug(session) {
      const game = gameFor(session)
      const bug = game.bugs[game.index]
      if (!bug) return null
      // The timer starts on the first call; reloading does not restart it.
      if (game.sentAt === null) game.sentAt = now()
      const elapsed = (now() - game.sentAt) / 1000
      return {
        index: game.index,
        bug: toPublic(bug),
        timeLimit: TIME_LIMIT,
        remainingSeconds: Math.max(0, Math.ceil(TIME_LIMIT - elapsed)),
      }
    },

    async select(session, request) {
      const game = gameFor(session)
      const bug = currentBug(game, request.bugId)
      if (game.lineCorrect !== null) throw new ApiRequestError('already_selected')
      if (bug.track === 'dev') {
        game.lineCorrect = 'selectedLine' in request && request.selectedLine === bug.bugLine
        return { lineCorrect: game.lineCorrect, correctLine: bug.bugLine }
      }
      game.lineCorrect = 'selectedTarget' in request && request.selectedTarget === bug.bugTarget
      return { lineCorrect: game.lineCorrect, correctTarget: bug.bugTarget }
    },

    async answer(session, { bugId, choice }) {
      const game = gameFor(session)
      const answered = game.bugs.slice(0, game.index)
      if (answered.some((played) => played.id === bugId)) {
        throw new ApiRequestError('already_answered')
      }
      const bug = currentBug(game, bugId)
      // A timeout (choice null) needs no selection: the timer can run out before it.
      if (game.lineCorrect === null && choice !== null) throw new ApiRequestError('selection_missing')

      const elapsed = game.sentAt === null ? 0 : now() - game.sentAt
      const timedOut = choice === null || elapsed > TIME_LIMIT * 1000
      const points = pointsFor(bug.difficulty, game.lineCorrect ?? false, choice === bug.answer, timedOut)
      game.byTrack[bug.track] += points

      game.index += 1
      game.sentAt = null
      game.lineCorrect = null
      const finished = game.index === game.bugs.length
      if (finished) recordFinished(game)

      return {
        correct: choice === bug.answer,
        correctChoice: bug.answer,
        points,
        explanation: bug.explanation,
        score: scoreOf(game.byTrack),
        finished,
      }
    },

    async getResult(session) {
      const game = gameFor(session)
      if (game.index < game.bugs.length) throw new ApiRequestError('game_not_finished')
      const score = scoreOf(game.byTrack)
      const visible = visiblePlayers()
      return {
        score,
        maxScore: MAX_PER_TRACK * 2,
        byTrack: { ...game.byTrack },
        percentByTrack: { dev: percentOf(game.byTrack.dev), network: percentOf(game.byTrack.network) },
        affinity: affinityOf(game.byTrack),
        rank: 1 + visible.filter((player) => player.best.score > score).length,
        playersCount: visible.length,
      }
    },

    async getLeaderboard() {
      const ranked = visiblePlayers().sort(
        (a, b) => b.best.score - a.best.score || a.best.reachedAt - b.best.reachedAt,
      )
      const top: LeaderboardEntry[] = ranked.slice(0, TOP_SIZE).map((player, i) => ({
        rank: i + 1,
        pseudo: player.pseudo,
        score: player.best.score,
        affinity: player.best.affinity,
        byTrack: { ...player.best.byTrack },
      }))
      // Every finished game counts, hidden players included; "both" counts twice.
      const gauges = { dev: 0, network: 0 }
      for (const affinity of finishedAffinities) {
        if (affinity !== 'network') gauges.dev += 1
        if (affinity !== 'dev') gauges.network += 1
      }
      return { top, gauges, gamesPlayed: finishedAffinities.length }
    },

    async getAdminPlayers(pin) {
      checkPin(pin)
      const latest = [...players.values()]
        .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
        .slice(0, ADMIN_LIST_SIZE)
      return {
        players: latest.map((player) => ({
          pseudo: player.pseudo,
          bestScore: player.best?.score ?? 0,
          affinity: player.best?.affinity ?? null,
          hidden: player.hidden,
          lastPlayedAt: new Date(player.lastPlayedAt).toISOString(),
        })),
      }
    },

    async setHidden(pin, pseudo, hidden) {
      checkPin(pin)
      const player = players.get(pseudo.toLowerCase())
      if (!player) throw new ApiRequestError('unknown_player')
      player.hidden = hidden
    },
  }
}
