import type { Selection, Verdict } from '../../game/gameReducer'
import LineButton from './LineButton'

type ConfigLinesProps = {
  code: string[]
  language?: string
  selected: Selection | null
  verdict: Verdict | null
  onSelect: (line: number) => void
}

const SETTING = /^\s*([^=]+?)\s*=\s*(.*)$/

// A settings panel: one row per `key = value`, the key in grey, the value in mono.
function ConfigLines({ code, language, selected, verdict, onSelect }: ConfigLinesProps) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-surface text-sm">
      <div className="border-b border-line px-3.5 py-2 text-xs font-bold tracking-[0.08em] text-muted uppercase">
        {language ?? 'Réglages'}
      </div>
      <ol className="flex flex-col gap-1 px-2 py-3">
        {code.map((text, line) => {
          const setting = SETTING.exec(text)
          return (
            <li key={line}>
              <LineButton line={line} text={text} selected={selected} verdict={verdict} onSelect={onSelect} wrap>
                {setting ? (
                  <span className="flex min-w-0 flex-1 flex-wrap justify-between gap-x-3">
                    <span className="text-muted">{setting[1]}</span>
                    <span className="font-mono break-all text-ink">{setting[2]}</span>
                  </span>
                ) : (
                  <span className="min-w-0 font-bold break-all text-ink-soft">{text}</span>
                )}
              </LineButton>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default ConfigLines
