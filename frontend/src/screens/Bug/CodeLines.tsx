import type { Selection, Verdict } from '../../game/gameReducer'
import LineButton from './LineButton'
import { selectionStatus } from './selectionStatus'

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
        const idle = selectionStatus(line, selected, verdict) === 'idle'
        return (
          <li key={line}>
            <LineButton
              line={line}
              text={text}
              selected={selected}
              verdict={verdict}
              onSelect={onSelect}
              lead={<span className={`w-4 flex-none ${idle ? 'text-muted' : 'text-lime'}`}>{line + 1}</span>}
            >
              <span className="whitespace-pre">{text}</span>
            </LineButton>
          </li>
        )
      })}
    </ol>
  )
}

export default CodeLines
