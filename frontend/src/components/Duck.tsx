// The debug duck mascot (rubber duck debugging): "bath duck" design, chosen
// on the mockup canvas (#79). Every move sits behind motion-safe: (#80).

export type DuckMood = 'idle' | 'think' | 'happy' | 'sad' | 'party'

const labels: Record<DuckMood, string> = {
  idle: 'Le canard, mascotte du jeu',
  think: 'Le canard réfléchit',
  happy: 'Le canard est content',
  sad: 'Le canard est déçu',
  party: 'Le canard fait la fête',
}

// Whole-body move, from the feet.
const bodyMoves: Record<DuckMood, string> = {
  idle: 'motion-safe:animate-duck-breathe',
  think: 'motion-safe:animate-duck-sway',
  happy: 'motion-safe:animate-duck-hop',
  sad: 'motion-safe:animate-duck-shake',
  party: 'motion-safe:animate-duck-dance',
}

// The shadow shrinks while the duck is in the air.
const shadowMoves: Partial<Record<DuckMood, string>> = {
  happy: 'motion-safe:animate-duck-shadow',
  party: 'motion-safe:animate-duck-shadow-fast',
}

const wings: Record<DuckMood, string> = {
  idle: 'M62 78 C70 72 84 74 88 84 C80 92 68 92 62 86 Z',
  think: 'M62 78 C70 72 84 74 88 84 C80 92 68 92 62 86 Z',
  happy: 'M60 74 C64 60 78 55 88 61 C84 73 72 80 62 80 Z',
  sad: 'M62 82 C70 80 82 84 84 92 C76 94 68 92 62 88 Z',
  party: 'M58 72 C62 58 74 52 86 56 C84 68 72 78 60 78 Z',
}

const BODY = 'M28 80 C28 64 42 58 60 62 C72 64 82 62 90 54 C98 47 108 54 106 68 C104 90 88 104 64 104 C42 104 28 94 28 80 Z'
const TUFT = 'M50 21 C47 12 53 8 57 13 C58 6 66 7 63 15 C68 13 71 18 65 21 Z'
const SAD_TUFT = 'M52 22 C46 16 39 18 40 25 C44 22 48 24 54 23 Z'
const BEAK = 'M27 47 C19 44 11 46 9 51 C12 57 21 58 29 55 Z'
const SAD_BEAK = 'M27 50 C19 50 12 54 12 58 C17 62 24 60 29 56 Z'
const SMILING_EYE = 'M38 44 Q45 35 52 44'
const SPARKLE = 'M92 20 L94 27 L101 29 L94 31 L92 38 L90 31 L83 29 L90 27 Z'
const SMALL_SPARKLE = 'M106 40 L107 44 L111 45 L107 46 L106 50 L105 46 L101 45 L105 44 Z'

// Each piece turns around its own box, not the whole drawing.
const own = 'transform-fill origin-center'

function OpenBeak() {
  return (
    <>
      <path d="M29 47 L9 47 L11 56 L29 55 Z" className="fill-code" />
      <ellipse cx="21" cy="52" rx="6" ry="2.2" className="fill-pink" />
      <path d="M27 45 C19 41 10 43 8 48 C14 50 22 50 29 49 Z" className="fill-lime" />
      <path d="M29 53 C22 53 14 54 11 56 C15 62 23 63 29 59 Z" className="fill-lime" />
    </>
  )
}

// Open eye: white, pupil, light. `look` moves the pupil.
function Eye({ look = [0, 0], glance = false }: { look?: [number, number]; glance?: boolean }) {
  const [dx, dy] = look
  return (
    <g data-part="eye" className={`${own} motion-safe:animate-duck-blink`}>
      <ellipse cx="45" cy="42" rx="8" ry="9" className="fill-ink" />
      <g className={glance ? 'motion-safe:animate-duck-glance' : undefined}>
        <circle cx={43 + dx} cy={43 + dy} r="5" className="fill-code" />
        <circle cx={41.5 + dx} cy={41 + dy} r="1.8" className="fill-ink" />
      </g>
    </g>
  )
}

const confetti = [
  { x: 84, y: 14, size: 6, turn: 20, color: 'fill-lime', delay: '0s' },
  { x: 100, y: 30, size: 6, turn: -15, color: 'fill-pink', delay: '0.5s' },
  { x: 16, y: 20, size: 5, turn: 35, color: 'fill-lime', delay: '0.9s' },
  { x: 104, y: 12, size: 5, turn: 10, color: 'fill-ink', delay: '1.3s' },
  { x: 74, y: 4, size: 5, turn: -25, color: 'fill-tear', delay: '0.3s' },
]

type DuckProps = {
  mood?: DuckMood
  size?: number
}

function Duck({ mood = 'idle', size = 160 }: DuckProps) {
  const smiling = mood === 'happy' || mood === 'party'

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" overflow="visible" role="img" aria-label={labels[mood]}>
      <ellipse cx="62" cy="110" rx="36" ry="5" className={`fill-code opacity-35 ${own} ${shadowMoves[mood] ?? ''}`} />

      {/* Mounted again on each mood change: the duck reacts with a pop. */}
      <g key={mood} data-part="pose" className="transform-fill origin-bottom motion-safe:animate-duck-pop">
        <g className={`transform-fill origin-bottom ${bodyMoves[mood]}`}>
          <path d={BODY} className="fill-duck" />
          <ellipse cx="60" cy="90" rx="22" ry="9" className="fill-ink opacity-10" />
          {mood === 'sad' && <path d={SAD_TUFT} className="fill-duck-dark" />}
          {mood !== 'sad' && mood !== 'party' && (
            <path d={TUFT} className="fill-duck-dark transform-fill origin-bottom motion-safe:animate-duck-wobble" />
          )}
          <circle cx="50" cy="45" r="25" className="fill-duck" />
          <path
            d={wings[mood]}
            className={`fill-duck-dark transform-fill origin-left ${smiling ? 'motion-safe:animate-duck-flap' : ''}`}
          />

          {smiling ? <OpenBeak /> : <path d={mood === 'sad' ? SAD_BEAK : BEAK} className="fill-lime" />}

          {mood === 'idle' && <Eye glance />}
          {mood === 'think' && (
            <>
              <path d="M30 71 C23 67 23 59 29 58 C35 58 39 64 39 71 Z" className="fill-duck-dark" />
              <Eye look={[4, -4]} />
              <path d="M37 29 Q45 24 53 29" strokeWidth="2.5" strokeLinecap="round" className="fill-none stroke-code" />
            </>
          )}
          {mood === 'sad' && (
            <>
              <g data-part="eye" className={`${own} motion-safe:animate-duck-blink`}>
                <ellipse cx="45" cy="42" rx="8" ry="9" className="fill-ink" />
                <circle cx="44" cy="46" r="5" className="fill-code" />
                <circle cx="42.5" cy="44.5" r="1.6" className="fill-ink" />
                <path d="M36 41 C40 34 50 33 54 38 L54 30 L36 30 Z" className="fill-duck" />
                <path d="M37 40 C41 36 49 35 53 38" strokeWidth="2" strokeLinecap="round" className="fill-none stroke-code" />
              </g>
              <path
                data-part="tear"
                d="M40 55 C44 61 44 65 40 65 C36 65 36 61 40 55 Z"
                className="fill-tear motion-safe:animate-duck-tear"
              />
            </>
          )}
          {smiling && <path d={SMILING_EYE} strokeWidth="3.5" strokeLinecap="round" className="fill-none stroke-code" />}

          <ellipse
            cx="58"
            cy="55"
            rx={smiling ? 7 : 6}
            ry={smiling ? 4 : 3.5}
            className={`fill-pink ${smiling ? 'opacity-90' : mood === 'sad' ? 'opacity-50' : 'opacity-75'}`}
          />

          {mood === 'party' && (
            <g className="transform-fill origin-bottom motion-safe:animate-duck-wobble">
              <path d="M40 25 L54 5 L64 24 Z" className="fill-pink" />
              <path d="M45 18 L59 14" strokeWidth="3" strokeLinecap="round" className="stroke-lime" />
              <circle cx="54" cy="5" r="4.5" className="fill-lime" />
            </g>
          )}
        </g>
      </g>

      {mood === 'think' && (
        <g className="motion-safe:animate-duck-bob">
          <circle cx="77" cy="30" r="2.5" className="fill-lime" />
          <circle cx="84" cy="22" r="3.5" className="fill-lime" />
          <circle cx="99" cy="13" r="11" className="fill-lime" />
          <text x="99" y="18.5" textAnchor="middle" fontSize="15" fontWeight="700" className="fill-night font-display">
            ?
          </text>
        </g>
      )}

      {mood === 'happy' && (
        <>
          <path d={SPARKLE} className={`fill-lime ${own} motion-safe:animate-duck-twinkle`} />
          <path d={SMALL_SPARKLE} className={`fill-pink ${own} motion-safe:animate-duck-twinkle`} style={{ animationDelay: '0.6s' }} />
        </>
      )}

      {mood === 'party' &&
        confetti.map(({ x, y, size: side, turn, color, delay }) => (
          <g key={`${x}-${y}`} data-part="confetti" className={`${own} motion-safe:animate-duck-confetti`} style={{ animationDelay: delay }}>
            <rect
              x={x}
              y={y}
              width={side}
              height={side}
              rx="1"
              transform={`rotate(${turn} ${x + side / 2} ${y + side / 2})`}
              className={color}
            />
          </g>
        ))}
    </svg>
  )
}

export default Duck
