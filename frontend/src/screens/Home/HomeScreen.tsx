import { useState, type FormEvent, type ReactNode } from 'react'
import { ApiRequestError, api, getDeviceId, type GameSession } from '../../api'
import { PSEUDO_MAX_LENGTH, isValidPseudo } from '../../api/pseudo'
import Duck from '../../components/Duck'
import TrackIcon from '../../components/TrackIcon'
import { readLastPseudo, saveLastPseudo } from './lastPseudo'
import { randomPseudo } from './randomPseudo'

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime'

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px]">{children}</span>
}

function DiceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" />
      <circle cx="16" cy="8" r="1.3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="8" cy="16" r="1.3" fill="currentColor" />
      <circle cx="16" cy="16" r="1.3" fill="currentColor" />
    </svg>
  )
}

type HomeScreenProps = {
  onStart: (session: GameSession) => void
}

function HomeScreen({ onStart }: HomeScreenProps) {
  const [pseudo, setPseudo] = useState(() => readLastPseudo() ?? randomPseudo())
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid = isValidPseudo(pseudo)

  function changePseudo(value: string) {
    setPseudo(value)
    setError(null)
  }

  async function start(event: FormEvent) {
    event.preventDefault()
    if (!valid || sending) return
    setSending(true)
    try {
      const { gameId, token } = await api.createGame({ pseudo, deviceId: getDeviceId() })
      saveLastPseudo(pseudo)
      onStart({ gameId, token })
    } catch (caught) {
      // Banned word and taken nickname share one neutral message (spec 2.5).
      const rejected =
        caught instanceof ApiRequestError &&
        (caught.code === 'pseudo_unavailable' || caught.code === 'pseudo_invalid')
      setError(rejected ? "Ce pseudo n'est pas disponible." : 'Connexion perdue, réessaie.')
      setSending(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-5 pt-7 pb-6">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-bold tracking-[0.14em]">CODA</span>
        <span className="rounded-full bg-lime px-2.5 py-1 text-xs font-bold text-night">JPO · 7 nov.</span>
      </div>

      <div className="mt-2 flex items-end gap-2">
        <Duck mood="idle" size={132} />
        <p className="mb-[70px] flex-1 rounded-2xl rounded-bl-sm border border-line bg-surface px-3.5 py-3 text-sm leading-snug text-ink-soft">
          Explique-moi ton code, je t'écoute.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <h1 className="font-display text-[44px] leading-[1.02] font-bold">
          Chasse aux <span className="text-lime">bugs</span>
        </h1>
        <p className="text-[15px] leading-normal text-ink-soft">
          Trouve le bug, corrige-le, grimpe au classement. Pas besoin de savoir coder : les premiers bugs se trouvent
          avec un peu de logique.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip>10 bugs</Chip>
        <Chip>60 s par bug</Chip>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-lime bg-lime/12 px-3 py-1.5 text-[13px] font-bold text-lime">
          <TrackIcon track="dev" />5 dev
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-pink bg-pink/12 px-3 py-1.5 text-[13px] font-bold text-pink">
          <TrackIcon track="network" />5 SR
        </span>
      </div>

      <form onSubmit={start} className="mt-auto flex flex-col gap-2.5" noValidate>
        <label htmlFor="pseudo" className="text-sm font-medium">
          Ton pseudo
        </label>
        <div className="flex gap-2">
          <input
            id="pseudo"
            type="text"
            value={pseudo}
            onChange={(event) => changePseudo(event.target.value)}
            maxLength={PSEUDO_MAX_LENGTH}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={!valid || error !== null}
            aria-describedby="pseudo-help"
            className={`h-13 min-w-0 flex-1 rounded-xl border border-line bg-code px-4 font-mono text-base ${focusRing}`}
          />
          <button
            type="button"
            aria-label="Pseudo au hasard"
            onClick={() => changePseudo(randomPseudo())}
            className={`flex size-13 flex-none cursor-pointer items-center justify-center rounded-xl border border-lime text-lime ${focusRing}`}
          >
            <DiceIcon />
          </button>
        </div>
        <p id="pseudo-help" aria-live="polite" className={`text-xs ${error || (!valid && pseudo) ? 'text-danger' : 'text-muted'}`}>
          {error ?? 'Tape ton pseudo ou laisse le dé en choisir un (3 à 16 caractères : lettres, chiffres, - et _).'}
        </p>
        <button
          type="submit"
          disabled={!valid || sending}
          className={`mt-1.5 h-14 cursor-pointer rounded-xl bg-lime font-display text-[17px] font-bold text-night disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
        >
          {sending ? 'Lancement…' : 'Lancer la partie'}
        </button>
      </form>

      <p className="text-center text-xs text-muted">Aucune donnée collectée en dehors de ton pseudo.</p>
    </main>
  )
}

export default HomeScreen
