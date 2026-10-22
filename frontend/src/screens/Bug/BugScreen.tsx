import type { Choice, Track } from '../../api'
import Duck from '../../components/Duck'
import TrackIcon from '../../components/TrackIcon'
import { formatSeconds } from '../../game/countdown'
import type { GameState, Selection } from '../../game/gameReducer'
import { useCountdown } from '../../game/useCountdown'
import CodeLines from './CodeLines'
import DeviceList from './DeviceList'
import FixSheet from './FixSheet'

type BugScreenProps = {
  state: GameState
  totalBugs: number
  onSelect: (selection: Selection) => void
  onAnswer: (choice: Choice | null) => void
}

function segmentColor(index: number, current: number, tracks: Track[]): string {
  if (index === current) return 'bg-ink'
  if (index > current) return 'bg-line'
  return tracks[index] === 'dev' ? 'bg-lime' : 'bg-pink'
}

function BugScreen({ state, totalBugs, onSelect, onAnswer }: BugScreenProps) {
  const current = state.current!
  const { bug } = current
  const left = useCountdown(state.endTime, () => onAnswer(null))
  const hurry = left <= 10

  const { verdict } = state
  let correctLabel: string | null = null
  if (verdict && verdict.lineCorrect !== null) {
    correctLabel =
      bug.track === 'dev'
        ? `ligne ${Number(verdict.correctSelection) + 1}`
        : (bug.diagram.devices.find((device) => device.id === verdict.correctSelection)?.label ?? null)
  }

  return (
    <main className={`mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-5 pt-6 ${verdict ? 'pb-80' : 'pb-6'}`}>
      <div className="flex items-center justify-between font-mono text-sm">
        <span>
          Bug {current.index + 1}/{totalBugs}
        </span>
        <span
          role="timer"
          aria-label={`${left} secondes restantes`}
          className={`rounded-full px-3 py-1.5 font-semibold text-night ${hurry ? 'bg-danger' : 'bg-lime'}`}
        >
          {formatSeconds(left)}
        </span>
        <span className="text-muted">{state.score} pts</span>
      </div>
      <p aria-live="polite" className="sr-only">
        {hurry && left > 0 ? 'Plus que 10 secondes' : ''}
      </p>

      <div aria-hidden="true" className="grid gap-1" style={{ gridTemplateColumns: `repeat(${totalBugs}, minmax(0, 1fr))` }}>
        {Array.from({ length: totalBugs }, (_, index) => (
          <div key={index} className={`h-1.5 rounded-[3px] ${segmentColor(index, current.index, state.tracks)}`} />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span
          className={`inline-flex items-center gap-1.5 self-start rounded-md px-2.5 py-1 text-xs font-bold tracking-[0.08em] ${bug.track === 'dev' ? 'bg-lime/14 text-lime' : 'bg-pink/14 text-pink'}`}
        >
          <TrackIcon track={bug.track} />
          {bug.track === 'dev' ? 'DEV' : 'SR'} · NIVEAU {bug.difficulty}
        </span>
        <h1 className="font-display text-[26px] leading-tight font-bold">{bug.title}</h1>
        <p className="text-[15px] text-ink-soft">
          {bug.track === 'dev' ? 'Touche la ligne qui contient le bug.' : "Touche l'appareil mal configuré."}
        </p>
      </div>

      {bug.track === 'dev' ? (
        <CodeLines code={bug.code} selected={state.selected} verdict={verdict} onSelect={onSelect} />
      ) : (
        <DeviceList devices={bug.diagram.devices} selected={state.selected} verdict={verdict} onSelect={onSelect} />
      )}

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          Connexion perdue, réessaie.
        </p>
      )}

      {!verdict && (
        <div className="mt-auto flex items-center gap-2.5">
          <Duck mood="think" size={72} />
          <p className="flex-1 rounded-2xl rounded-bl-sm border border-line bg-surface px-3.5 py-2.5 text-sm leading-snug text-ink-soft">
            {bug.track === 'dev'
              ? "Coin… Lis chaque ligne à voix haute, comme si tu me l'expliquais."
              : 'Coin… Vérifie chaque appareil, un par un.'}
          </p>
        </div>
      )}

      {verdict && <FixSheet choices={bug.choices} verdict={verdict} correctLabel={correctLabel} onChoose={onAnswer} />}
    </main>
  )
}

export default BugScreen
