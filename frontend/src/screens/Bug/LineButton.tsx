import type { ReactNode } from 'react'
import type { Selection, Verdict } from '../../game/gameReducer'
import StatusMark from './StatusMark'
import { selectionStatus, statusClasses, statusLabels } from './selectionStatus'

type LineButtonProps = {
  line: number
  text: string
  selected: Selection | null
  verdict: Verdict | null
  onSelect: (line: number) => void
  // Shown before the status mark, like the line number of the code.
  lead?: ReactNode
  // Prose wraps; code and commands keep their line and scroll.
  wrap?: boolean
  children: ReactNode
}

// One line the player can touch, whatever the view: same size, label and marks.
function LineButton({ line, text, selected, verdict, onSelect, lead, wrap = false, children }: LineButtonProps) {
  const status = selectionStatus(line, selected, verdict)
  return (
    <button
      type="button"
      disabled={selected !== null}
      onClick={() => onSelect(line)}
      aria-label={`Ligne ${line + 1} : ${text.trim() || 'vide'}${statusLabels[status]}`}
      className={`flex min-h-11 w-full ${wrap ? 'py-1.5' : 'min-w-max'} cursor-pointer items-center gap-2 rounded-lg border px-2 text-left disabled:cursor-default focus-visible:outline-2 focus-visible:outline-lime ${statusClasses[status]}`}
    >
      {lead}
      <StatusMark status={status} />
      {children}
    </button>
  )
}

export default LineButton
