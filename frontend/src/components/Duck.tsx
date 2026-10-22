// The debug duck mascot (rubber duck debugging), from the Coda mockup.

export type DuckMood = 'idle' | 'think' | 'happy' | 'sad' | 'party'

const labels: Record<DuckMood, string> = {
  idle: 'Le canard, mascotte du jeu',
  think: 'Le canard réfléchit',
  happy: 'Le canard est content',
  sad: 'Le canard est déçu',
  party: 'Le canard fait la fête',
}

const wings: Record<DuckMood, string> = {
  idle: 'M60 76 C68 72 80 74 84 82 C76 88 66 88 60 82 Z',
  think: 'M60 76 C68 72 80 74 84 82 C76 88 66 88 60 82 Z',
  happy: 'M58 74 C64 62 76 60 84 66 C80 76 70 80 60 80 Z',
  sad: 'M60 78 C68 76 80 80 82 88 C74 90 66 88 60 84 Z',
  party: 'M58 72 C62 58 74 52 86 56 C84 68 72 78 60 78 Z',
}

const BEAK = 'M30 46 C22 44 14 46 12 50 C14 56 24 58 32 54 Z'
const SAD_BEAK = 'M30 48 C22 48 14 52 14 56 C18 60 26 60 32 56 Z'
const SMILING_EYE = 'M39 41 Q44 34 49 41'

type DuckProps = {
  mood?: DuckMood
  size?: number
}

function Duck({ mood = 'idle', size = 160 }: DuckProps) {
  const smiling = mood === 'happy' || mood === 'party'

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={labels[mood]}>
      <ellipse cx="64" cy="108" rx="38" ry="6" className="fill-code opacity-35" />
      <path
        d="M30 74 C30 60 44 54 62 58 C74 60 84 58 92 50 C100 44 108 52 106 64 C104 86 88 102 64 102 C42 102 30 92 30 74 Z"
        className="fill-duck"
      />
      <circle cx="50" cy="46" r="22" className="fill-duck" />
      <path d={wings[mood]} className="fill-duck-dark" />
      <path d={mood === 'sad' ? SAD_BEAK : BEAK} className="fill-lime" />

      {smiling ? (
        <>
          <path d={SMILING_EYE} strokeWidth="3" strokeLinecap="round" className="fill-none stroke-code" />
          <ellipse cx="55" cy="52" rx="6" ry="3.5" className="fill-pink opacity-85" />
        </>
      ) : (
        <ellipse cx="55" cy="52" rx="5" ry="3" className="fill-pink opacity-60" />
      )}

      {mood === 'idle' && (
        <>
          <circle cx="44" cy="40" r="4.5" className="fill-code" />
          <circle cx="45.5" cy="38.5" r="1.5" className="fill-ink" />
        </>
      )}

      {mood === 'think' && (
        <>
          <path d="M38 31 L49 29" strokeWidth="2.5" strokeLinecap="round" className="stroke-code" />
          <circle cx="45" cy="38" r="4.5" className="fill-code" />
          <circle cx="46.5" cy="36" r="1.5" className="fill-ink" />
          <circle cx="76" cy="34" r="2.5" className="fill-lime" />
          <circle cx="83" cy="27" r="3.5" className="fill-lime" />
          <circle cx="98" cy="16" r="12" className="fill-lime" />
          <text
            x="98"
            y="21.5"
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
            className="fill-night font-display"
          >
            ?
          </text>
        </>
      )}

      {mood === 'happy' && (
        <>
          <path d="M92 20 L94 27 L101 29 L94 31 L92 38 L90 31 L83 29 L90 27 Z" className="fill-lime" />
          <path d="M106 40 L107 44 L111 45 L107 46 L106 50 L105 46 L101 45 L105 44 Z" className="fill-pink" />
        </>
      )}

      {mood === 'sad' && (
        <>
          <path d="M38 33 L49 36" strokeWidth="2.5" strokeLinecap="round" className="stroke-code" />
          <circle cx="44" cy="42" r="4.5" className="fill-code" />
          <circle cx="45.5" cy="40.5" r="1.5" className="fill-ink" />
          <path d="M70 22 C75 30 75 35 70 35 C65 35 65 30 70 22 Z" className="fill-tear" />
        </>
      )}

      {mood === 'party' && (
        <>
          <path d="M40 27 L54 2 L64 28 Z" className="fill-pink" />
          <path d="M46 18 L58 14" strokeWidth="3" strokeLinecap="round" className="stroke-lime" />
          <circle cx="54" cy="3" r="4.5" className="fill-lime" />
          <rect x="84" y="14" width="6" height="6" rx="1" transform="rotate(20 87 17)" className="fill-lime" />
          <rect x="100" y="30" width="6" height="6" rx="1" transform="rotate(-15 103 33)" className="fill-pink" />
          <rect x="18" y="18" width="5" height="5" rx="1" transform="rotate(35 20 20)" className="fill-lime" />
          <rect x="104" y="12" width="5" height="5" rx="1" transform="rotate(10 106 14)" className="fill-ink" />
        </>
      )}
    </svg>
  )
}

export default Duck
