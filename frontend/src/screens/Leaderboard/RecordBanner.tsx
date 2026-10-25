import type { LeaderboardEntry } from '../../api'
import Duck from '../../components/Duck'

const COLORS = ['bg-lime', 'bg-pink', 'bg-tear', 'bg-ink']

// Spread by index, not at random: the same render every time.
const pieces = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 0.23) % 2.4).toFixed(2),
  color: COLORS[i % COLORS.length],
  size: i % 3 === 0 ? 'size-4' : 'size-3',
}))

// Big-screen celebration of a new record: banner, party duck and confetti.
// The banner sits at the foot of the ranking column, clear of the QR code.
function RecordBanner({ record }: { record: LeaderboardEntry }) {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden motion-reduce:hidden">
        {pieces.map(({ left, delay, color, size }, i) => (
          <span
            key={i}
            className={`absolute -top-6 rounded-sm ${size} ${color} motion-safe:animate-board-confetti`}
            style={{ left: `${left}%`, animationDelay: `${delay}s` }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex w-fit items-center gap-6 rounded-3xl border-2 border-lime bg-surface px-10 py-6 shadow-2xl motion-safe:animate-duck-pop">
        <Duck mood="party" size={140} />
        <div className="flex flex-col gap-1">
          <span className="font-display text-5xl font-bold text-lime">Nouveau record !</span>
          <span className="font-display text-4xl font-bold">
            {record.pseudo} · {record.score.toLocaleString('fr-FR')}
          </span>
        </div>
      </div>
    </>
  )
}

export default RecordBanner
