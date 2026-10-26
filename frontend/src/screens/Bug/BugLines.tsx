import type { PublicLineBug } from '../../api'
import type { Selection, Verdict } from '../../game/gameReducer'
import CodeLines from './CodeLines'

type BugLinesProps = {
  bug: PublicLineBug
  selected: Selection | null
  verdict: Verdict | null
  onSelect: (selection: Selection) => void
}

// A bug drawn as lines (code, terminal, e-mail...): its language and context,
// then the lines the player touches.
function BugLines({ bug, selected, verdict, onSelect }: BugLinesProps) {
  return (
    <div className="flex flex-col gap-2">
      {bug.context && (
        <p className="rounded-[10px] border border-line bg-surface px-3.5 py-2.5 font-mono text-[13px] whitespace-pre-wrap text-ink-soft">
          {bug.context}
        </p>
      )}
      {bug.language && (
        <span className="self-start rounded-md bg-surface px-2 py-0.5 font-mono text-xs text-muted">{bug.language}</span>
      )}
      <CodeLines code={bug.code} selected={selected} verdict={verdict} onSelect={onSelect} />
    </div>
  )
}

export default BugLines
