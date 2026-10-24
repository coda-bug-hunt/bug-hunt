// The countdown runs from an end time, not by counting ticks: a phone that
// throttles the tab stays accurate. The server still decides the score.

export function endTimeFrom(remainingSeconds: number, now: number): number {
  return now + remainingSeconds * 1000
}

export function secondsLeft(endTime: number, now: number): number {
  return Math.max(0, Math.ceil((endTime - now) / 1000))
}

// 42 -> "0:42"
export function formatSeconds(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
