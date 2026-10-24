import { QRCodeSVG } from 'qrcode.react'
import type { Leaderboard, Track } from '../../api'
import Duck from '../../components/Duck'
import TrackIcon from '../../components/TrackIcon'
import { gaugeWidths } from './gauges'

const panel = 'flex rounded-[18px] border border-line bg-surface'

function Gauge({ track, count, width, max }: { track: Track; count: number; width: number; max: number }) {
  const dev = track === 'dev'
  const label = dev ? 'Dev' : 'SR'
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className={`inline-flex items-center gap-2 font-display text-[26px] font-bold ${dev ? 'text-lime' : 'text-pink'}`}>
          <TrackIcon track={track} size={24} />
          {label}
        </span>
        <span className="font-mono text-3xl font-semibold">{count}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={count}
        className="h-[18px] rounded-[9px] bg-line"
      >
        <div className={`h-[18px] rounded-[9px] ${dev ? 'bg-lime' : 'bg-pink'}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

// Right column of the big screen: record, profiles of the day, QR code.
function DayPanel({ leaderboard }: { leaderboard: Leaderboard }) {
  const record = leaderboard.top[0]
  const { gauges, gamesPlayed } = leaderboard
  const widths = gaugeWidths(gauges)
  const max = Math.max(gauges.dev, gauges.network, 1)

  return (
    <aside className="flex flex-col gap-5">
      <div className={`${panel} items-center gap-4 px-5 py-[18px]`}>
        <Duck mood={record ? 'party' : 'idle'} size={112} />
        {record ? (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold tracking-[0.08em] text-lime">NOUVEAU RECORD</span>
            <span className="font-display text-[26px] font-bold">
              {record.pseudo} · {record.score.toLocaleString('fr-FR')}
            </span>
            <span className="text-[15px] text-ink-soft">Qui fait mieux ?</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="font-display text-[26px] font-bold">Sois le premier !</span>
            <span className="text-[15px] text-ink-soft">Scanne le QR code et lance une partie.</span>
          </div>
        )}
      </div>

      <div className={`${panel} flex-col gap-[18px] p-6`}>
        <span className="text-[15px] font-bold tracking-[0.08em] text-muted">PROFILS DE LA JOURNÉE</span>
        <Gauge track="dev" count={gauges.dev} width={widths.dev} max={max} />
        <Gauge track="network" count={gauges.network} width={widths.network} max={max} />
        <span className="text-base text-muted">
          {gamesPlayed} {gamesPlayed > 1 ? 'parties jouées' : 'partie jouée'}
        </span>
      </div>

      <div className="mt-auto flex items-center gap-[22px] rounded-[18px] bg-lime p-5 text-night">
        <QRCodeSVG
          value={`${window.location.origin}/`}
          title="QR code pour jouer"
          size={128}
          bgColor="transparent"
          fgColor="currentColor"
          className="flex-none"
        />
        <div className="flex flex-col gap-2">
          <span className="font-display text-[28px] leading-tight font-bold">Scanne pour jouer</span>
          <span className="text-base">5 à 10 min, sans compte</span>
        </div>
      </div>
    </aside>
  )
}

export default DayPanel
