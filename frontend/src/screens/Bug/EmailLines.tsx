import type { Selection, Verdict } from '../../game/gameReducer'
import LineButton from './LineButton'

type EmailLinesProps = {
  code: string[]
  selected: Selection | null
  verdict: Verdict | null
  onSelect: (line: number) => void
}

const HEADER = /^([A-ZÀ-Ý][\p{L}-]*) ?: (.*)$/u
const LINK = /((?:https?:\/\/|www\.)\S+)/

// Headers are the lines before the first empty one, if the first looks like `De : ...`.
function headerCount(code: string[]): number {
  if (!HEADER.test(code[0] ?? '')) return 0
  const blank = code.findIndex((text) => text.trim() === '')
  return blank === -1 ? code.length : blank
}

// A message line, with its links underlined as a mail app shows them.
function MessageText({ text }: { text: string }) {
  return (
    <span className="min-w-0 whitespace-pre-wrap text-ink">
      {text.split(LINK).map((part, index) =>
        index % 2 === 1 ? (
          <span key={index} className="break-all text-pink underline">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  )
}

// A mail card: headers on top, then the message. The empty line between them can't be touched.
function EmailLines({ code, selected, verdict, onSelect }: EmailLinesProps) {
  const headers = headerCount(code)
  return (
    <ol className="flex flex-col gap-1 rounded-[14px] border border-line bg-surface px-2 py-3 text-sm">
      {code.map((text, line) => {
        if (line === headers && text.trim() === '') {
          return <li key={line} aria-hidden="true" className="mx-2 my-1 border-t border-line" />
        }
        const header = line < headers ? HEADER.exec(text) : null
        return (
          <li key={line}>
            <LineButton line={line} text={text} selected={selected} verdict={verdict} onSelect={onSelect} wrap>
              {header ? (
                <span className="min-w-0 break-all">
                  <span className="text-muted">{`${header[1]} :`}</span> <span className="text-ink">{header[2]}</span>
                </span>
              ) : (
                <MessageText text={text} />
              )}
            </LineButton>
          </li>
        )
      })}
    </ol>
  )
}

export default EmailLines
