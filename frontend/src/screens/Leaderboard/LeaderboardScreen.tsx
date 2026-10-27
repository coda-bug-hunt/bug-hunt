import { useEffect, useLayoutEffect, useRef, useState, type Ref } from 'react'
import { api, type GameApi, type LeaderboardEntry } from '../../api'
import { useWakeLock } from '../../hooks/useWakeLock'
import { music } from '../../sound/music'
import { sound, useMuted } from '../../sound/player'
import AffinityTag from './AffinityTag'
import DayPanel from './DayPanel'
import IdleShowcase from './IdleShowcase'
import RecordBanner from './RecordBanner'
import { SHOWCASE_BUGS, showcaseAt } from './showcase'
import { useLiveBoard } from './useLiveBoard'

const REFRESH_MS = 2000

function Row({ entry, moved, ref }: { entry: LeaderboardEntry; moved: boolean; ref: Ref<HTMLLIElement> }) {
  const first = entry.rank === 1
  let frame = first ? 'border-lime bg-lime/10' : 'border-line bg-surface'
  if (moved) frame = 'border-pink bg-pink/14'
  return (
    <li
      ref={ref}
      data-moved={moved || undefined}
      className={`grid h-13 grid-cols-[64px_minmax(0,1fr)_140px_190px] items-center gap-x-6 rounded-[10px] border px-5 transition-colors duration-700 ${frame}`}
    >
      <span className={`font-mono text-[22px] font-semibold ${first ? 'text-lime' : 'text-muted'}`}>{entry.rank}</span>
      <span className="truncate text-2xl font-medium">{entry.pseudo}</span>
      <span className="text-right font-mono text-2xl font-semibold">{entry.score.toLocaleString('fr-FR')}</span>
      <AffinityTag affinity={entry.affinity} />
    </li>
  )
}

// Rows slide from their old place to the new one (FLIP), with the Web
// Animations API where it exists; nothing moves with reduced motion.
function useSlidingRows(data: unknown) {
  const rows = useRef(new Map<string, HTMLLIElement>())
  const tops = useRef(new Map<string, number>())

  useLayoutEffect(() => {
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const next = new Map<string, number>()
    const firstLoad = tops.current.size === 0
    rows.current.forEach((row, pseudo) => {
      const top = row.getBoundingClientRect().top
      next.set(pseudo, top)
      if (still || firstLoad || typeof row.animate !== 'function') return
      const old = tops.current.get(pseudo)
      if (old === undefined) {
        row.animate([{ opacity: 0, transform: 'translateX(-32px)' }, { opacity: 1, transform: 'none' }], {
          duration: 500,
          easing: 'ease-out',
        })
      } else if (old !== top) {
        row.animate([{ transform: `translateY(${old - top}px)` }, { transform: 'none' }], {
          duration: 600,
          easing: 'ease-in-out',
        })
      }
    })
    tops.current = next
  }, [data])

  return (pseudo: string) => (row: HTMLLIElement | null) => {
    if (!row) return
    rows.current.set(pseudo, row)
    return () => {
      rows.current.delete(pseudo)
    }
  }
}

// Big screen of the stand (Coda mockup E7), landscape, read from 3 metres.
// `client` is only passed by tests.
// The current time, refreshed every `interval` ms.
function useNow(interval: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), interval)
    return () => window.clearInterval(timer)
  }, [interval])
  return now
}

function LeaderboardScreen({ client = api }: { client?: GameApi }) {
  const { data, moved, record, changedAt } = useLiveBoard(client, REFRESH_MS)
  const now = useNow(1000)
  const showcase = data ? showcaseAt(now - changedAt) : null
  const rowRef = useSlidingRows(data)
  const muted = useMuted()
  useWakeLock(true)

  // The stand PC has speakers: any key or click unlocks the audio and starts
  // the background music; M mutes everything.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      sound.unlock()
      music.start()
      if (event.key.toLowerCase() === 'm') sound.setMuted(!sound.isMuted())
    }
    function onPointer() {
      sound.unlock()
      music.start()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
      music.stop()
    }
  }, [])

  return (
    <main className="grid min-h-dvh grid-cols-[minmax(0,1fr)_440px] gap-12 px-14 py-11">
      <section className="relative flex min-w-0 flex-col gap-[22px]">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-5xl font-bold">
            Chasse aux <span className="text-lime">bugs</span>
          </h1>
          <span className="flex flex-col items-end gap-1 font-mono text-lg text-muted">
            CODA · JPO · Top 10 en direct
            <span className="text-sm">{muted ? 'M : remettre le son' : 'M : couper le son'}</span>
          </span>
        </div>
        {showcase ? (
          <IdleShowcase
            bug={SHOWCASE_BUGS[showcase.round % SHOWCASE_BUGS.length]}
            step={showcase.step}
            leader={data?.top[0]?.pseudo ?? null}
          />
        ) : (
          <ol className="flex flex-col gap-1.5">
            {data?.top.map((entry) => (
              <Row key={entry.pseudo} ref={rowRef(entry.pseudo)} entry={entry} moved={moved.includes(entry.pseudo)} />
            ))}
          </ol>
        )}
        {record && <RecordBanner record={record} />}
      </section>
      {data && <DayPanel leaderboard={data} />}
      <p role="status" className="sr-only">
        {record ? `Nouveau record : ${record.pseudo}, ${record.score} points` : ''}
      </p>
    </main>
  )
}

export default LeaderboardScreen
