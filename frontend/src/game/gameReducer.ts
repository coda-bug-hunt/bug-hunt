import type { AnswerResponse, NextBugResponse, Track } from '../api'
import { endTimeFrom } from './countdown'

// A line index (dev bug) or a device id (network bug).
export type Selection = number | string

// What `selection` told us. `lineCorrect: null` when the line was chosen
// before a reload: the API does not say which one.
export type Verdict =
  | { lineCorrect: boolean; correctSelection: Selection }
  | { lineCorrect: null }

export type GameState = {
  phase: 'loading' | 'playing' | 'feedback' | 'over'
  current: NextBugResponse | null
  endTime: number
  selected: Selection | null
  verdict: Verdict | null
  answer: AnswerResponse | null
  score: number
  // Track of every bug served so far, by index, for the progress bar.
  tracks: Track[]
  error: boolean
}

export type GameAction =
  | { type: 'bugLoaded'; next: NextBugResponse; now: number }
  | { type: 'gameOver' }
  | { type: 'selected'; selection: Selection }
  | { type: 'verdict'; verdict: Verdict }
  | { type: 'answered'; answer: AnswerResponse }
  | { type: 'failed' }

export const initialGameState: GameState = {
  phase: 'loading',
  current: null,
  endTime: 0,
  selected: null,
  verdict: null,
  answer: null,
  score: 0,
  tracks: [],
  error: false,
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'bugLoaded': {
      const tracks = [...state.tracks]
      tracks[action.next.index] = action.next.bug.track
      return {
        ...state,
        phase: 'playing',
        current: action.next,
        endTime: endTimeFrom(action.next.remainingSeconds, action.now),
        selected: null,
        verdict: null,
        answer: null,
        tracks,
        error: false,
      }
    }
    case 'gameOver':
      return { ...state, phase: 'over', error: false }
    case 'selected':
      return { ...state, selected: action.selection, error: false }
    case 'verdict':
      return { ...state, verdict: action.verdict }
    case 'answered':
      return { ...state, phase: 'feedback', answer: action.answer, score: action.answer.score, error: false }
    case 'failed':
      // A selection the server never confirmed can be made again.
      return { ...state, error: true, selected: state.verdict ? state.selected : null }
  }
}
