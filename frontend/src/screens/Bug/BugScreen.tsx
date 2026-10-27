import { useEffect, useRef, useState } from 'react'
import type { Choice, Track } from '../../api'
import Duck from '../../components/Duck'
import TrackIcon from '../../components/TrackIcon'
import { formatSeconds } from '../../game/countdown'
import type { GameState, Selection } from '../../game/gameReducer'
import { useCountdown } from '../../game/useCountdown'
import { sound } from '../../sound/player'
import SoundToggle from '../../sound/SoundToggle'
import BugLines from './BugLines'
import { instructions, viewOf } from './bugView'
import NetworkDiagram from './NetworkDiagram'
import FixSheet from './FixSheet'
import TimerRing from './TimerRing'
import TutorialTip from './TutorialTip'
import { markTutorialSeen, tutorialSeen } from './tutorial'

// The duck offers its hint once this much of the bug has gone by.
const HINT_AFTER_SECONDS = 20

// First-bug tutorial: one duck bubble per gesture, then the usual tips.
type TutorialStep = 'line' | 'fix' | 'done'

function BulbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z" />
    </svg>
  )
}

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
  const left = useCountdown(state.endTime, () => {
    sound.play('timeout')
    onAnswer(null)
  })
  const hurry = left <= 10
  const heading = useRef<HTMLHeadingElement>(null)
  // The screen is mounted again for each bug: the tutorial is decided once.
  const [step, setStep] = useState<TutorialStep>(() => (current.index === 0 && !tutorialSeen() ? 'line' : 'done'))

  useEffect(() => {
    if (step === 'line') markTutorialSeen()
  }, [step])

  const [hintShown, setHintShown] = useState(false)
  const hintOffered = Boolean(bug.hint) && current.timeLimit - left >= HINT_AFTER_SECONDS
  let bubble =
    'code' in bug
      ? "Coin… Lis chaque ligne à voix haute, comme si tu me l'expliquais."
      : 'Coin… Compare bien les réglages de chaque appareil.'
  if (hintShown) bubble = bug.hint!
  else if (hintOffered) bubble = 'Un indice ? Touche-moi !'

  function lineTipDone() {
    setStep('fix')
    heading.current?.focus()
  }

  useEffect(() => {
    if (left > 0 && left <= 10) sound.play('tick')
  }, [left])

  function select(selection: Selection) {
    sound.play('tap')
    onSelect(selection)
  }

  const { verdict } = state
  let correctLabel: string | null = null
  if (verdict && verdict.lineCorrect !== null) {
    correctLabel =
      'code' in bug
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
        <span className="flex items-center gap-1 text-muted">
          {state.score} pts
          <SoundToggle />
        </span>
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
        <h1 ref={heading} tabIndex={-1} className="font-display text-[26px] leading-tight font-bold outline-none">
          {bug.title}
        </h1>
        <p className="text-[15px] text-ink-soft">{instructions[viewOf(bug)]}</p>
      </div>

      {'code' in bug ? (
        <BugLines bug={bug} selected={state.selected} verdict={verdict} onSelect={select} />
      ) : (
        <NetworkDiagram diagram={bug.diagram} selected={state.selected} verdict={verdict} onSelect={select} />
      )}

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          Connexion perdue, réessaie.
        </p>
      )}

      {!verdict && (
        <div className="mt-auto flex items-center gap-2.5">
          <TimerRing left={left} total={current.timeLimit}>
            {bug.hint ? (
              <button
                type="button"
                onClick={() => setHintShown(true)}
                aria-label="Demander un indice au canard"
                aria-expanded={hintShown}
                aria-controls="duck-bubble"
                className="flex-none cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
              >
                <Duck mood={hintShown ? 'happy' : 'think'} size={72} />
              </button>
            ) : (
              <Duck mood="think" size={72} />
            )}
          </TimerRing>
          {step === 'line' ? (
            <TutorialTip text="Touche la ligne où se cache le bug." onDone={lineTipDone} />
          ) : (
            <div className="flex flex-1 flex-col items-start gap-2">
              <p
                id="duck-bubble"
                aria-live="polite"
                className={`w-full rounded-2xl rounded-bl-sm border bg-surface px-3.5 py-2.5 text-sm leading-snug ${hintShown || hintOffered ? 'border-lime text-ink' : 'border-line text-ink-soft'}`}
              >
                {bubble}
              </p>
              {bug.hint && !hintShown && (
                <button
                  type="button"
                  onClick={() => setHintShown(true)}
                  aria-label="Afficher l'indice"
                  aria-controls="duck-bubble"
                  className="flex h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-lime px-3 font-display text-sm font-bold text-lime focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
                >
                  <BulbIcon />
                  Indice
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {verdict && (
        <FixSheet
          choices={bug.choices}
          verdict={verdict}
          correctLabel={correctLabel}
          onChoose={onAnswer}
          tip={step === 'done' ? undefined : 'Choisis la bonne correction.'}
          onTipDone={() => setStep('done')}
        />
      )}
    </main>
  )
}

export default BugScreen
