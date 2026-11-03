import { useEffect } from 'react'
import type { Affinity, GameResult, Track } from '../../api'
import Duck from '../../components/Duck'
import TrackIcon from '../../components/TrackIcon'
import { sound } from '../../sound/player'
import { formatScore, rankText } from './endFormat'
import ProgramTile from './ProgramTile'

// Drafts, to be validated by the team (#37).
type AffinityText = { title: string; tracks: Track[]; border: string; text: string; fill: string; message: string; speciality: string }

const affinities: Record<Affinity, AffinityText> = {
  dev: {
    title: 'Dev',
    tracks: ['dev'],
    border: 'border-lime',
    text: 'text-lime',
    fill: 'bg-lime',
    message: "Tu lis le code comme un livre et tu repères vite ce qui cloche. Viens en discuter avec l'équipe dev sur le stand.",
    speciality: 'Dev Full Stack',
  },
  network: {
    title: 'SR',
    tracks: ['network'],
    border: 'border-pink',
    text: 'text-pink',
    fill: 'bg-pink',
    message: "Tu as l'œil pour repérer les machines qui ne se parlent pas. Viens en discuter avec l'équipe réseau sur le stand.",
    speciality: 'Systèmes et Réseaux',
  },
  both: {
    title: 'Polyvalent',
    tracks: ['dev', 'network'],
    border: 'border-ink',
    text: 'text-ink',
    fill: 'bg-ink',
    message: "Code ou réseau, tu t'en sors des deux côtés. Viens découvrir les deux filières sur le stand.",
    speciality: 'Dev ou Systèmes et Réseaux',
  },
}

function TrackBar({ track, percent }: { track: Track; percent: number }) {
  const dev = track === 'dev'
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className={`inline-flex items-center gap-1.5 ${dev ? 'text-lime' : 'text-pink'}`}>
          <TrackIcon track={track} />
          {dev ? 'Dev' : 'SR'}
        </span>
        <span className="font-mono">{percent} %</span>
      </div>
      <div aria-hidden="true" className="h-2.5 rounded-[5px] bg-line">
        <div className={`h-2.5 rounded-[5px] ${dev ? 'bg-lime' : 'bg-pink'}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

type EndScreenProps = {
  pseudo: string
  result: GameResult
  onReplay: () => void
}

// Coda mockup E6.
function EndScreen({ pseudo, result, onReplay }: EndScreenProps) {
  const affinity = result.affinity ? affinities[result.affinity] : null

  useEffect(() => {
    sound.play('fanfare')
  }, [])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-[18px] px-5 pt-7 pb-6 short:gap-3 short:pt-4 short:pb-3">
      <div className="flex items-center gap-3">
        {/* CSS sizes override the svg attributes: a smaller duck on small phones. */}
        <div className="shrink-0 short:[&>svg]:size-20">
          <Duck mood="party" size={104} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[13px] text-muted">Partie terminée · {pseudo}</span>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-[44px] leading-none font-semibold">{formatScore(result.score)}</span>
            <span className="text-base text-muted">/ {formatScore(result.maxScore)}</span>
          </div>
          <span className="text-[15px]">{rankText(result.rank, result.playersCount)}</span>
        </div>
      </div>

      {affinity && (
        <section className={`flex flex-col gap-4 rounded-2xl border-2 bg-surface p-5 short:gap-3 short:p-4 ${affinity.border}`}>
          <span className="text-xs font-bold tracking-[0.08em] text-muted">TON PROFIL</span>
          <h1 className={`flex items-center gap-2.5 font-display text-4xl font-bold ${affinity.text}`}>
            {affinity.tracks.map((track) => (
              <TrackIcon key={track} track={track} size={32} />
            ))}
            {affinity.title}
          </h1>
          <TrackBar track="dev" percent={result.percentByTrack.dev} />
          <TrackBar track="network" percent={result.percentByTrack.network} />
          <p className="text-[15px] leading-normal text-ink-soft">{affinity.message}</p>
          <ProgramTile speciality={affinity.speciality} accent={affinity.fill} />
        </section>
      )}

      <button
        type="button"
        onClick={onReplay}
        autoFocus
        className="mt-auto h-14 shrink-0 cursor-pointer short:h-12 rounded-xl bg-lime font-display text-[17px] font-bold text-night focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
      >
        Rejouer
      </button>
      <p className="text-center text-xs text-muted">Ton score s'affiche sur le grand écran du stand.</p>
    </main>
  )
}

export default EndScreen
