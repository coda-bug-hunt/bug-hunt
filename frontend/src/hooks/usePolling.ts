import { useEffect, useRef, useState } from 'react'

export type Polled<T> = { data: T | null; error: boolean }

// Calls `load` at once, then `interval` ms after each answer: requests never
// stack on a slow network. A failure keeps the last data on screen.
export function usePolling<T>(load: () => Promise<T>, interval: number): Polled<T> {
  const [state, setState] = useState<Polled<T>>({ data: null, error: false })
  const latest = useRef(load)

  useEffect(() => {
    latest.current = load
  }, [load])

  useEffect(() => {
    let active = true
    let timer: number | undefined

    function tick() {
      latest.current().then(
        (data) => {
          if (active) setState({ data, error: false })
        },
        () => {
          if (active) setState((previous) => ({ ...previous, error: true }))
        },
      ).finally(() => {
        if (active) timer = window.setTimeout(tick, interval)
      })
    }

    tick()
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [interval])

  return state
}
