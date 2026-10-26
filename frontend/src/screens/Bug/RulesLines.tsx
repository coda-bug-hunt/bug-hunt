import type { Selection, Verdict } from '../../game/gameReducer'
import LineButton from './LineButton'

type RulesLinesProps = {
  code: string[]
  language?: string
  selected: Selection | null
  verdict: Verdict | null
  onSelect: (line: number) => void
}

const RULE = /^(Autoriser|Bloquer)\b\s*(.*)$/i

// Allow: an arrow that goes through. Block: a no-entry sign. Always with the word.
function ActionIcon({ allow }: { allow: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 flex-none fill-none stroke-current stroke-2">
      {allow ? (
        <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <circle cx="8" cy="8" r="6" />
          <path d="M4 12l8-8" />
        </>
      )}
    </svg>
  )
}

// Firewall rules, numbered in the order they apply.
function RulesLines({ code, language, selected, verdict, onSelect }: RulesLinesProps) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-surface text-sm">
      <div className="border-b border-line px-3.5 py-2 text-xs font-bold tracking-[0.08em] text-muted uppercase">
        {language ?? 'Pare-feu'}
      </div>
      <ol className="flex flex-col gap-1 px-2 py-3">
        {code.map((text, line) => {
          const rule = RULE.exec(text)
          const allow = rule?.[1].toLowerCase() === 'autoriser'
          return (
            <li key={line}>
              <LineButton
                line={line}
                text={text}
                selected={selected}
                verdict={verdict}
                onSelect={onSelect}
                wrap
                lead={<span className="w-4 flex-none font-mono text-muted tabular-nums">{line + 1}</span>}
              >
                <span className="min-w-0 flex-1 text-ink">
                  {rule && (
                    <span
                      data-action={allow ? 'allow' : 'block'}
                      className={`mr-1.5 inline-flex items-center gap-1 align-middle font-bold ${allow ? 'text-lime' : 'text-danger'}`}
                    >
                      <ActionIcon allow={allow} />
                      {rule[1]}
                    </span>
                  )}
                  {rule ? rule[2] : text}
                </span>
              </LineButton>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default RulesLines
