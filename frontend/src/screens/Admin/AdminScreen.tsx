import { useCallback, useState } from 'react'
import { ApiRequestError, api, type AdminPlayer, type GameApi } from '../../api'
import Duck from '../../components/Duck'
import { usePolling } from '../../hooks/usePolling'
import { playedAgo } from './adminFormat'
import { clearPin, readPin, savePin } from './adminPin'
import BugList from './BugList'
import BugTester from './BugTester'
import PinForm from './PinForm'

const REFRESH_MS = 5000

type PlayerRowProps = { player: AdminPlayer; hidden: boolean; now: number; onToggle: () => void }

function PlayerRow({ player, hidden, now, onToggle }: PlayerRowProps) {
  const action = hidden ? 'Réafficher' : 'Masquer'
  const meta = `${player.bestScore.toLocaleString('fr-FR')} pts · ${playedAgo(player.lastPlayedAt, now)}`
  return (
    <li className="flex min-h-15 items-center justify-between gap-3 rounded-[10px] border border-line bg-surface py-2 pr-2 pl-3.5">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={`truncate font-mono text-[15px] ${hidden ? 'text-muted line-through' : ''}`}>{player.pseudo}</span>
        <span className="text-xs text-muted">{hidden ? `Masqué · ${meta}` : meta}</span>
      </span>
      <button
        type="button"
        onClick={onToggle}
        aria-label={`${action} ${player.pseudo}`}
        className={`h-11 flex-none cursor-pointer rounded-lg px-3.5 font-display text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime ${hidden ? 'bg-lime text-night' : 'border border-danger text-danger'}`}
      >
        {action}
      </button>
    </li>
  )
}

type ModerationProps = { pin: string; client: GameApi; onBadPin: () => void }

function Moderation({ pin, client, onBadPin }: ModerationProps) {
  const [search, setSearch] = useState('')
  // New hidden states shown at once, before the next refresh confirms them.
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  // Time of the last refresh: "il y a x min" is relative to it.
  const [now, setNow] = useState(() => Date.now())

  const { data } = usePolling(async () => {
    try {
      const players = await client.getAdminPlayers(pin)
      setNow(Date.now())
      return players
    } catch (caught) {
      if (caught instanceof ApiRequestError && caught.code === 'bad_pin') onBadPin()
      throw caught
    }
  }, REFRESH_MS)

  function toggle(player: AdminPlayer, hidden: boolean) {
    setError(null)
    setPending((current) => ({ ...current, [player.pseudo]: !hidden }))
    client.setHidden(pin, player.pseudo, !hidden).catch(() => {
      setPending((current) => {
        const reverted = { ...current }
        delete reverted[player.pseudo]
        return reverted
      })
      setError('Action impossible, réessaie.')
    })
  }

  const query = search.trim().toLowerCase()
  const players = (data?.players ?? []).filter((player) => player.pseudo.toLowerCase().includes(query))

  return (
    <>
      <p className="text-sm text-ink-soft">
        Un pseudo masqué disparaît tout de suite du classement. Sa partie reste comptée dans les jauges.
      </p>
      <label htmlFor="search" className="flex flex-col gap-2 text-sm font-medium">
        Rechercher un pseudo
        <input
          id="search"
          type="search"
          placeholder="Pseudo…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-12 rounded-[10px] border border-line bg-code px-3.5 font-mono text-[15px] focus-visible:outline-2 focus-visible:outline-lime"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {players.map((player) => {
          const hidden = pending[player.pseudo] ?? player.hidden
          return <PlayerRow key={player.pseudo} player={player} hidden={hidden} now={now} onToggle={() => toggle(player, hidden)} />
        })}
      </ul>
    </>
  )
}

type Tab = 'players' | 'bugs'
const TABS: { tab: Tab; name: string }[] = [
  { tab: 'players', name: 'Joueurs' },
  { tab: 'bugs', name: 'Bugs' },
]

type Testing = { id: string; list: string[] }

function AdminHome({ pin, client, onBadPin }: ModerationProps) {
  const [tab, setTab] = useState<Tab>('players')
  const [testing, setTesting] = useState<Testing | null>(null)

  const back = useCallback(() => setTesting(null), [])
  // After the feedback: the next bug of the list, or the list after the last one.
  const next = useCallback(() => {
    setTesting((current) => {
      if (!current) return null
      const following = current.list[current.list.indexOf(current.id) + 1]
      return following ? { ...current, id: following } : null
    })
  }, [])

  if (testing) {
    return <BugTester pin={pin} client={client} id={testing.id} onNext={next} onBack={back} onBadPin={onBadPin} />
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-[18px] px-5 pt-7 pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Duck mood="idle" size={44} />
          <h1 className="font-display text-2xl font-bold">{tab === 'players' ? 'Modération' : 'Tester un bug'}</h1>
        </div>
        <span className="rounded-md bg-lime/14 px-2.5 py-1 text-xs font-bold tracking-[0.08em] text-lime">PIN VALIDÉ</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TABS.map(({ tab: value, name }) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={`h-11 cursor-pointer rounded-lg font-display text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime ${tab === value ? 'bg-lime text-night' : 'border border-line text-ink-soft'}`}
          >
            {name}
          </button>
        ))}
      </div>
      {tab === 'players' ? (
        <Moderation pin={pin} client={client} onBadPin={onBadPin} />
      ) : (
        <>
          <p className="text-sm text-ink-soft">
            Joue n'importe quel bug dans les vrais écrans du jeu. Aucun score, rien sur le grand écran.
          </p>
          <BugList pin={pin} client={client} onPlay={(id, list) => setTesting({ id, list })} onBadPin={onBadPin} />
        </>
      )}
    </main>
  )
}

// Coda mockup E8, at /admin (not linked from anywhere). `client` is only passed by tests.
function AdminScreen({ client = api }: { client?: GameApi }) {
  const [pin, setPin] = useState(readPin)
  const [wrongPin, setWrongPin] = useState(false)

  const forgetPin = useCallback(() => {
    clearPin()
    setPin(null)
    setWrongPin(true)
  }, [])

  function signIn(entered: string) {
    savePin(entered)
    setWrongPin(false)
    setPin(entered)
  }

  if (!pin) return <PinForm wrongPin={wrongPin} onSubmit={signIn} />
  return <AdminHome key={pin} pin={pin} client={client} onBadPin={forgetPin} />
}

export default AdminScreen
