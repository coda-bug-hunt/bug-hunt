import { useCallback, useEffect, useReducer, useRef } from 'react'
import { ApiRequestError, api, type Choice, type GameApi, type GameSession } from '../api'
import { gameReducer, initialGameState, type Selection } from './gameReducer'
import { withViewTransition } from './viewTransition'

// Drives a game: calls the API and keeps the current step. Screens only
// display it. `onLost` is called when the server no longer knows the game.
// `client` is only passed by tests.
export function useGame(session: GameSession, onLost: () => void, client: GameApi = api) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState)
  // One answer per bug: the timer and a tap on a fix can race.
  const answering = useRef(false)

  const fail = useCallback(
    (error: unknown) => {
      if (error instanceof ApiRequestError && (error.code === 'unknown_game' || error.code === 'bad_token')) {
        onLost()
        return
      }
      dispatch({ type: 'failed' })
    },
    [onLost],
  )

  const loadNext = useCallback(async () => {
    try {
      const next = await client.nextBug(session)
      answering.current = false
      // Screen changes (bug, feedback, end) are animated where the browser can.
      withViewTransition(() => {
        if (next) dispatch({ type: 'bugLoaded', next, now: Date.now() })
        else dispatch({ type: 'gameOver' })
      })
    } catch (error) {
      fail(error)
    }
  }, [session, fail, client])

  useEffect(() => {
    void loadNext()
  }, [loadNext])

  async function select(selection: Selection) {
    const bug = state.current?.bug
    if (!bug || state.selected !== null) return
    dispatch({ type: 'selected', selection })
    try {
      const request =
        'code' in bug
          ? { bugId: bug.id, selectedLine: Number(selection) }
          : { bugId: bug.id, selectedTarget: String(selection) }
      const response = await client.select(session, request)
      const correctSelection = 'correctLine' in response ? response.correctLine : response.correctTarget
      dispatch({ type: 'verdict', verdict: { lineCorrect: response.lineCorrect, correctSelection } })
    } catch (error) {
      // Chosen before a reload: go straight to the fixes.
      if (error instanceof ApiRequestError && error.code === 'already_selected') {
        dispatch({ type: 'verdict', verdict: { lineCorrect: null } })
        return
      }
      fail(error)
    }
  }

  // choice null: the timer ran out.
  async function answer(choice: Choice | null) {
    const bug = state.current?.bug
    if (!bug || answering.current) return
    answering.current = true
    try {
      const response = await client.answer(session, { bugId: bug.id, choice })
      withViewTransition(() => dispatch({ type: 'answered', answer: response }))
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'already_answered') {
        void loadNext()
        return
      }
      answering.current = false
      fail(error)
    }
  }

  function next() {
    if (state.answer?.finished) withViewTransition(() => dispatch({ type: 'gameOver' }))
    else void loadNext()
  }

  return { state, select, answer, next, retry: loadNext }
}
