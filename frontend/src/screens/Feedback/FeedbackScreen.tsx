import { useEffect } from 'react'
import type { AnswerResponse, PublicBug } from '../../api'
import Duck from '../../components/Duck'
import type { Verdict } from '../../game/gameReducer'
import { viewOf } from '../Bug/bugView'
import { sound } from '../../sound/player'
import SoundToggle from '../../sound/SoundToggle'

type FeedbackScreenProps = {
  bug: PublicBug
  answer: AnswerResponse
  // null when the timer ran out before any pick: the buggy line is unknown.
  verdict: Verdict | null
  index: number
  totalBugs: number
  // Right answers in a row, this one included.
  streak: number
  onNext: () => void
}

// A streak is celebrated from this many right answers in a row.
const STREAK_FROM = 3

function correctSelection(verdict: Verdict | null) {
  return verdict && verdict.lineCorrect !== null ? verdict.correctSelection : null
}

// One diff line: the sign is visible, and its meaning is read out.
function DiffLine({ sign, label, text, className }: { sign: string; label: string; text: string; className: string }) {
  return (
    <li className={`flex gap-2.5 px-3 py-2.5 ${className}`}>
      <span aria-hidden="true">{sign}</span>
      <span className="sr-only">{label} : </span>
      <span className="whitespace-pre-wrap">{text}</span>
    </li>
  )
}

// Coda mockup E5. Everything comes from the answer and the bug already loaded.
function FeedbackScreen({ bug, answer, verdict, index, totalBugs, streak, onNext }: FeedbackScreenProps) {
  const fix = bug.choices[answer.correctChoice]
  const target = correctSelection(verdict)

  useEffect(() => {
    sound.play(answer.correct ? 'right' : 'wrong')
  }, [answer.correct])

  let correction
  if ('code' in bug && viewOf(bug) === 'code') {
    const buggyLine = typeof target === 'number' ? bug.code[target]?.trim() : undefined
    correction = (
      <ul aria-label="La correction" className="overflow-hidden rounded-[10px] border border-line font-mono text-[13px]">
        {buggyLine && <DiffLine sign="-" label="Supprimé" text={buggyLine} className="bg-danger/14 text-danger" />}
        <DiffLine sign="+" label="Ajouté" text={fix} className="bg-lime/14 text-lime" />
      </ul>
    )
  } else if ('code' in bug) {
    // Terminal, e-mail, settings: the fix is an action, not a line of code.
    const line = typeof target === 'number' ? `Ligne ${target + 1} : ${fix}` : fix
    correction = <p className="font-mono text-[13px] text-lime">{line}</p>
  } else {
    const device = bug.diagram.devices.find((candidate) => candidate.id === target)
    correction = <p className="font-mono text-[13px] text-lime">{device ? `Sur ${device.label} : ${fix}` : fix}</p>
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-5 py-6">
      <div className="flex items-center justify-between font-mono text-sm">
        <span>
          Bug {index + 1}/{totalBugs} terminé
        </span>
        <span className="flex items-center gap-1 text-muted">
          {answer.score} pts
          <SoundToggle />
        </span>
      </div>

      <div className="mt-3 flex flex-col items-center gap-2 text-center">
        <Duck mood={streak >= STREAK_FROM ? 'party' : answer.correct ? 'happy' : 'sad'} size={160} />
        <h1 className="font-display text-[32px] leading-tight font-bold">
          {answer.correct ? 'Coin-coin ! Bug écrasé.' : 'Pas grave, même les seniors se trompent.'}
        </h1>
        <span className={`font-mono text-[28px] font-semibold ${answer.points > 0 ? 'text-lime' : 'text-muted'}`}>
          {answer.points > 0 ? `+${answer.points} pts` : '+0 pt'}
        </span>
        {streak >= STREAK_FROM && (
          <span className="rounded-md bg-pink/14 px-3 py-1 font-display text-sm font-bold tracking-[0.04em] text-pink">
            {streak} d'affilée !
          </span>
        )}
      </div>

      <section className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-[18px]">
        <h2 className="text-xs font-bold tracking-[0.08em] text-muted">LA CORRECTION, COMME DANS UNE REVUE DE CODE</h2>
        {correction}
        <p className="text-[15px] leading-normal">{answer.explanation}</p>
      </section>

      <button
        type="button"
        onClick={onNext}
        autoFocus
        className="mt-auto h-14 cursor-pointer rounded-xl bg-lime font-display text-[17px] font-bold text-night focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
      >
        {answer.finished ? 'Voir mon résultat' : 'Bug suivant'}
      </button>
    </main>
  )
}

export default FeedbackScreen
