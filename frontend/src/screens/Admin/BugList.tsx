import { useEffect, useState } from 'react'
import { ApiRequestError, type AdminBugSummary, type GameApi, type Track } from '../../api'
import TrackIcon from '../../components/TrackIcon'
import { viewLabels } from '../Bug/bugView'

const TRACKS: { track: Track; name: string }[] = [
  { track: 'dev', name: 'Dev' },
  { track: 'network', name: 'SR' },
]
const LEVELS = [0, 1, 2, 3, 4]

type BugListProps = {
  pin: string
  client: GameApi
  onPlay: (id: string, list: string[]) => void
  onBadPin: () => void
}

// Every bug of the pool, by track and level, to play one in the real screens.
function BugList({ pin, client, onPlay, onBadPin }: BugListProps) {
  const [bugs, setBugs] = useState<AdminBugSummary[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    client.getAdminBugs(pin).then(
      (response) => setBugs(response.bugs),
      (caught: unknown) => {
        if (caught instanceof ApiRequestError && caught.code === 'bad_pin') onBadPin()
        else setError(true)
      },
    )
  }, [pin, client, onBadPin])

  if (error) return <p role="alert" className="text-sm text-danger">Liste des bugs indisponible, recharge la page.</p>
  if (!bugs) return <p className="text-sm text-ink-soft">Chargement…</p>

  // The order of a game: dev then SR, level by level.
  const groups = TRACKS.flatMap(({ track, name }) =>
    LEVELS.map((level) => ({
      track,
      name: `${name} · niveau ${level}`,
      bugs: bugs.filter((bug) => bug.track === track && bug.difficulty === level),
    })),
  ).filter((group) => group.bugs.length > 0)
  const order = groups.flatMap((group) => group.bugs.map((bug) => bug.id))

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <section key={group.name} className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1.5 text-xs font-bold tracking-[0.08em] text-muted uppercase">
            <TrackIcon track={group.track} />
            {group.name}
          </h2>
          <ul className="flex flex-col gap-2">
            {group.bugs.map((bug) => (
              <li key={bug.id}>
                <button
                  type="button"
                  onClick={() => onPlay(bug.id, order)}
                  aria-label={`Jouer ${bug.id} : ${bug.title}`}
                  className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-[10px] border border-line bg-surface px-3.5 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-mono text-xs text-muted">{bug.id}</span>
                    <span className="text-sm">{bug.title}</span>
                  </span>
                  <span className="flex-none rounded-md bg-night px-2 py-0.5 font-mono text-xs text-ink-soft">{viewLabels[bug.view]}</span>
                  <span aria-hidden="true" className="flex-none font-display text-sm font-bold text-lime">
                    Jouer
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default BugList
