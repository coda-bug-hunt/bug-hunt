import { useEffect } from 'react'

// Keeps the screen on while `active`: a phone that sleeps mid-bug loses the
// visitor, and the stand PC must not dim the leaderboard. The browser drops
// the lock when the tab goes to the back, so it is taken again on return.
// Silently does nothing where the API is missing or refused.
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let stopped = false

    async function take() {
      try {
        const taken = await navigator.wakeLock.request('screen')
        if (stopped) void taken.release()
        else lock = taken
      } catch {
        // Refused (battery saver, no user gesture yet): the game works without it.
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') void take()
    }

    void take()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', onVisibility)
      void lock?.release().catch(() => {})
    }
  }, [active])
}
