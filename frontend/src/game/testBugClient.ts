import { ApiRequestError, type FullBug, type GameApi, type GameSession } from '../api'
import { TIME_LIMIT, pointsFor } from '../api/mockRules'
import { publicBugOf } from '../api/publicBug'

// The admin test tool plays one bug in the page: no game on the server.
export const TEST_SESSION: GameSession = { gameId: 'test', token: '' }

async function notInATest(): Promise<never> {
  throw new Error('Not available while testing a bug')
}

// A one-bug game for useGame: the real screens, the rules of the mock, no
// score kept. Never "finished": the feedback offers the next bug of the list.
export function createTestBugClient(bug: FullBug): GameApi {
  let served = false
  let answered = false
  let lineCorrect: boolean | null = null

  return {
    async nextBug() {
      if (answered) return null
      served = true
      return { index: 0, bug: publicBugOf(bug), timeLimit: TIME_LIMIT, remainingSeconds: TIME_LIMIT, score: 0 }
    },

    async select(_session, request) {
      if (!served) throw new ApiRequestError('not_current_bug')
      if (lineCorrect !== null) throw new ApiRequestError('already_selected')
      if ('bugLine' in bug) {
        lineCorrect = 'selectedLine' in request && request.selectedLine === bug.bugLine
        return { lineCorrect, correctLine: bug.bugLine }
      }
      lineCorrect = 'selectedTarget' in request && request.selectedTarget === bug.bugTarget
      return { lineCorrect, correctTarget: bug.bugTarget }
    },

    async answer(_session, { choice }) {
      if (answered) throw new ApiRequestError('already_answered')
      answered = true
      const correct = choice === bug.answer
      const points = pointsFor(bug.difficulty, lineCorrect === true, correct, choice === null)
      return { correct, correctChoice: bug.answer, points, explanation: bug.explanation, score: points, finished: false }
    },

    createGame: notInATest,
    getResult: notInATest,
    getLeaderboard: notInATest,
    getAdminPlayers: notInATest,
    setHidden: notInATest,
    getAdminBugs: notInATest,
    getAdminBug: notInATest,
  }
}
