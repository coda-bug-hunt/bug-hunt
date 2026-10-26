import type { PublicLineBug } from '../../api'
import type { Selection, Verdict } from '../../game/gameReducer'
import { viewOf } from './bugView'
import CodeLines from './CodeLines'
import EmailLines from './EmailLines'
import TerminalLines from './TerminalLines'

type BugLinesProps = {
  bug: PublicLineBug
  selected: Selection | null
  verdict: Verdict | null
  onSelect: (selection: Selection) => void
}

// A bug drawn as lines (code, terminal, e-mail...): its context, then the
// lines the player touches, in the skin of its view.
function BugLines({ bug, selected, verdict, onSelect }: BugLinesProps) {
  const view = viewOf(bug)
  const lines = { code: bug.code, selected, verdict, onSelect }
  return (
    <div className="flex flex-col gap-2">
      {bug.context && (
        <p className="rounded-[10px] border border-line bg-surface px-3.5 py-2.5 font-mono text-[13px] whitespace-pre-wrap text-ink-soft">
          {bug.context}
        </p>
      )}
      {view === 'terminal' ? (
        <TerminalLines {...lines} language={bug.language} />
      ) : view === 'email' ? (
        <EmailLines {...lines} />
      ) : (
        <>
          {bug.language && (
            <span className="self-start rounded-md bg-surface px-2 py-0.5 font-mono text-xs text-muted">{bug.language}</span>
          )}
          <CodeLines {...lines} />
        </>
      )}
    </div>
  )
}

export default BugLines
