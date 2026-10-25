import type { ReactNode } from 'react'

const RADIUS = 43
const LENGTH = 2 * Math.PI * RADIUS

type TimerRingProps = { left: number; total: number; children?: ReactNode }

// A ring around the duck that empties with the timer: read faster than a
// number under pressure. `left` comes from the end time of the bug; between
// two seconds the ring glides, unless the phone asks for less motion.
function TimerRing({ left, total, children }: TimerRingProps) {
  const hurry = left <= 10
  const emptied = total > 0 ? 1 - Math.min(Math.max(left / total, 0), 1) : 1
  return (
    <div className="relative flex size-23 flex-none items-center justify-center">
      <svg aria-hidden="true" viewBox="0 0 92 92" className="absolute inset-0 -rotate-90">
        <circle cx="46" cy="46" r={RADIUS} strokeWidth="4" className="fill-none stroke-line" />
        <circle
          data-ring
          cx="46"
          cy="46"
          r={RADIUS}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={LENGTH}
          strokeDashoffset={LENGTH * emptied}
          className={`fill-none ${hurry ? 'stroke-danger' : 'stroke-lime'} motion-safe:transition-[stroke-dashoffset] motion-safe:duration-1000 motion-safe:ease-linear`}
        />
      </svg>
      {children}
    </div>
  )
}

export default TimerRing
