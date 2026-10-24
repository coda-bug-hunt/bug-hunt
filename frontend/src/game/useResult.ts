import { useEffect, useState } from 'react'
import { api, type GameApi, type GameResult, type GameSession } from '../api'

// Loads the end-of-game result. `client` is only passed by tests.
export function useResult(session: GameSession, client: GameApi = api) {
  const [result, setResult] = useState<GameResult | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    client.getResult(session).then(
      (loaded) => {
        if (!current) return
        setResult(loaded)
        setError(false)
      },
      () => {
        if (current) setError(true)
      },
    )
    // A late answer for an unmounted screen or an older attempt is ignored.
    return () => {
      current = false
    }
  }, [session, client, attempt])

  return { result, error, retry: () => setAttempt((count) => count + 1) }
}
