import type { Selection, Verdict } from '../../game/gameReducer'
import StatusMark from './StatusMark'
import { selectionStatus, statusClasses, statusLabels } from './selectionStatus'

type CodeLinesProps = {
  code: string[]
  selected: Selection | null
  verdict: Verdict | null
  onSelect: (line: number) => void
}

// One line = one button. Lines never wrap: the block scrolls if needed.
function CodeLines({ code, selected, verdict, onSelect }: CodeLinesProps) {
  return (
    <ol className="flex flex-col gap-1 overflow-x-auto rounded-[14px] border border-line bg-code px-2 py-3 font-mono text-[13px]">
      {code.map((text, line) => {
        const status = selectionStatus(line, selected, verdict)
        return (
          <li key={line}>
            <button
              type="button"
              disabled={selected !== null}
              onClick={() => onSelect(line)}
              aria-label={`Ligne ${line + 1} : ${text.trim() || 'vide'}${statusLabels[status]}`}
              className={`flex min-h-11 w-full min-w-max cursor-pointer items-center gap-2 rounded-lg border px-2 text-left disabled:cursor-default focus-visible:outline-2 focus-visible:outline-lime ${statusClasses[status]}`}
            >
              <span className={`w-4 flex-none ${status === 'idle' ? 'text-muted' : 'text-lime'}`}>{line + 1}</span>
              <StatusMark status={status} />
              <span className="whitespace-pre">{text}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export default CodeLines
