import type { Selection, Verdict } from '../../game/gameReducer'
import LineButton from './LineButton'

type TerminalLinesProps = {
  code: string[]
  language?: string
  selected: Selection | null
  verdict: Verdict | null
  onSelect: (line: number) => void
}

const PROMPT = '$ '

// A terminal window: commands after a lime prompt, their output in grey.
function TerminalLines({ code, language, selected, verdict, onSelect }: TerminalLinesProps) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-code font-mono text-[13px]">
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span aria-hidden="true" className="size-2.5 rounded-full bg-danger" />
        <span aria-hidden="true" className="size-2.5 rounded-full bg-pink" />
        <span aria-hidden="true" className="size-2.5 rounded-full bg-lime" />
        <span className="ml-2 text-xs text-muted">{language ?? 'Terminal'}</span>
      </div>
      <ol className="flex flex-col gap-1 overflow-x-auto px-2 py-3">
        {code.map((text, line) => (
          <li key={line}>
            <LineButton line={line} text={text} selected={selected} verdict={verdict} onSelect={onSelect}>
              {text.startsWith(PROMPT) ? (
                <span className="whitespace-pre text-ink">
                  <span className="text-lime">$</span> {text.slice(PROMPT.length)}
                </span>
              ) : (
                <span className="whitespace-pre text-muted">{text}</span>
              )}
            </LineButton>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default TerminalLines
