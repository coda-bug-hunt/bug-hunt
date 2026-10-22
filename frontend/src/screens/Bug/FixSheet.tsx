import { useEffect, useRef } from 'react'
import type { Choice } from '../../api'
import Duck from '../../components/Duck'
import type { Verdict } from '../../game/gameReducer'

const LETTERS = ['A', 'B', 'C']

type FixSheetProps = {
  choices: [string, string, string]
  verdict: Verdict
  // "la ligne 4" or the device name, for the title.
  correctLabel: string | null
  onChoose: (choice: Choice) => void
}

// Bottom sheet with the 3 fixes (Coda mockup E3). The code stays visible above.
function FixSheet({ choices, verdict, correctLabel, onChoose }: FixSheetProps) {
  const title = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    title.current?.focus()
  }, [])

  let heading = 'Quelle correction ?'
  if (verdict.lineCorrect === true && correctLabel) heading = `Bien vu, ${correctLabel} ! Quelle correction ?`
  if (verdict.lineCorrect === false && correctLabel) heading = `Raté : le bug est ${correctLabel}. Quelle correction ?`

  return (
    <section
      aria-labelledby="fix-sheet-title"
      className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-md flex-col gap-2.5 rounded-t-3xl border-t-2 border-lime bg-surface px-5 pt-2.5 pb-6"
    >
      <div aria-hidden="true" className="h-1 w-10 self-center rounded-sm bg-line" />
      <div className="flex items-center gap-2">
        <Duck mood="think" size={40} />
        <h2 id="fix-sheet-title" ref={title} tabIndex={-1} className="flex-1 font-display text-base font-bold outline-none">
          {heading}
        </h2>
      </div>
      {choices.map((choice, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onChoose(index as Choice)}
          className="flex min-h-13 cursor-pointer items-center gap-3 rounded-xl border border-line bg-night px-4 text-left font-mono text-[13px] focus-visible:outline-2 focus-visible:outline-lime"
        >
          <span className="font-display font-bold text-lime">{LETTERS[index]}</span>
          <span>{choice}</span>
        </button>
      ))}
    </section>
  )
}

export default FixSheet
