import { useEffect, useRef, useState } from 'react'
import { secondsLeft } from './countdown'

// Seconds left until `endTime`; calls `onExpire` once when it reaches 0.
export function useCountdown(endTime: number, onExpire: () => void): number {
  const [left, setLeft] = useState(() => secondsLeft(endTime, Date.now()))
  const expire = useRef(onExpire)

  useEffect(() => {
    expire.current = onExpire
  }, [onExpire])

  useEffect(() => {
    let expired = false
    function tick() {
      const seconds = secondsLeft(endTime, Date.now())
      setLeft(seconds)
      if (seconds === 0 && !expired) {
        expired = true
        expire.current()
      }
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [endTime])

  return left
}
