import Duck from '../../components/Duck'
import TrackIcon from '../../components/TrackIcon'
import type { ShowcaseBug, ShowcaseStep } from './showcase'

type ShowcaseProps = { bug: ShowcaseBug; step: ShowcaseStep; leader: string | null }

function CodeRow({ number, text, tone, label }: { number: string; text: string; tone: 'plain' | 'bug' | 'fix'; label?: string }) {
  const tones = {
    plain: 'border-transparent',
    bug: 'border-danger bg-danger/14',
    fix: 'border-lime bg-lime/14 text-lime',
  }
  return (
    <div className={`flex items-center gap-5 rounded-xl border-2 px-4 py-1.5 motion-safe:transition-colors motion-safe:duration-500 ${tones[tone]}`}>
      <span className="w-6 flex-none text-muted">{number}</span>
      <span className="min-w-0 flex-1 whitespace-pre">{text}</span>
      {label && (
        <span className={`flex flex-none items-center gap-2 font-display text-xl font-bold ${tone === 'bug' ? 'text-danger' : 'text-lime'}`}>
          <span aria-hidden="true">{tone === 'bug' ? '✗' : '✓'}</span>
          <span>{label}</span>
        </span>
      )}
    </div>
  )
}

// The idle big screen: a bug in large type, read from across the stand. The
// faulty line is pointed at, then the fix shows right under it. Fits 810 px.
function IdleShowcase({ bug, step, leader }: ShowcaseProps) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-3">
        <p className="font-display text-3xl font-bold text-lime">Trouveras-tu le bug ?</p>
        <span
          className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-sm font-bold tracking-[0.08em] ${bug.track === 'dev' ? 'bg-lime/14 text-lime' : 'bg-pink/14 text-pink'}`}
        >
          <TrackIcon track={bug.track} size={16} />
          {bug.track === 'dev' ? 'DEV' : 'SR'} · {bug.language}
        </span>
      </div>
      <h2 className="font-display text-[34px] leading-tight font-bold">{bug.title}</h2>

      <div className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-code p-5 font-mono text-2xl">
        {bug.code.map((text, line) => {
          const faulty = step !== 'read' && line === bug.bugLine
          return (
            <div key={line} className="flex flex-col gap-1.5">
              <CodeRow number={String(line + 1)} text={text} tone={faulty ? 'bug' : 'plain'} label={faulty && step === 'line' ? 'Le bug est ici' : undefined} />
              {faulty && step === 'fix' && <CodeRow number="+" text={bug.fix} tone="fix" label="La correction" />}
            </div>
          )
        })}
      </div>

      <div className="mt-auto flex items-center gap-4">
        <Duck mood={step === 'fix' ? 'happy' : 'think'} size={72} />
        <p className="font-display text-[34px] leading-tight font-bold">
          {leader ? `Scanne et bats ${leader} !` : 'Scanne et lance la première partie !'}
          <span aria-hidden="true" className="text-lime">
            {' '}
            →
          </span>
        </p>
      </div>
    </div>
  )
}

export default IdleShowcase
