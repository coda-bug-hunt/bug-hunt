import { useEffect, useRef, useState } from 'react'
import type { GameApi, Leaderboard, LeaderboardEntry } from '../../api'
import { usePolling } from '../../hooks/usePolling'
import { music } from '../../sound/music'
import { sound } from '../../sound/player'
import { compareBoards } from './boardChanges'

const HIGHLIGHT_MS = 3000
const BANNER_MS = 5000
// The background music steps back while the fanfare plays.
const FANFARE_MS = 3000

// Polls the leaderboard and remembers what changed since the last answer:
// nicknames that moved (highlighted 3 s) and a new record (banner for 5 s).
export function useLiveBoard(client: GameApi, interval: number) {
  const previous = useRef<Leaderboard | null>(null)
  const timers = useRef<number[]>([])
  // A newer change must not be cleared by the timer of an older one.
  const generation = useRef({ moved: 0, record: 0 })
  const [moved, setMoved] = useState<string[]>([])
  const [record, setRecord] = useState<LeaderboardEntry | null>(null)

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  function later(ms: number, done: () => void) {
    timers.current.push(window.setTimeout(done, ms))
  }

  const polled = usePolling(async () => {
    const board = await client.getLeaderboard()
    const changes = compareBoards(previous.current, board)
    previous.current = board
    if (changes.moved.length > 0) {
      const id = ++generation.current.moved
      setMoved(changes.moved)
      later(HIGHLIGHT_MS, () => {
        if (generation.current.moved === id) setMoved([])
      })
    }
    if (changes.record) {
      const id = ++generation.current.record
      setRecord(changes.record)
      sound.play('fanfare')
      music.lower(FANFARE_MS)
      later(BANNER_MS, () => {
        if (generation.current.record === id) setRecord(null)
      })
    }
    return board
  }, interval)

  return { ...polled, moved, record }
}
