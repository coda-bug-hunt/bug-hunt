import { useEffect, useMemo, useState } from 'react'
import { ApiRequestError, type FullBug, type GameApi } from '../../api'
import { createTestBugClient, TEST_SESSION } from '../../game/testBugClient'
import { useGame } from '../../game/useGame'
import BugScreen from '../Bug/BugScreen'
import FeedbackScreen from '../Feedback/FeedbackScreen'

type BugTesterProps = {
  pin: string
  client: GameApi
  id: string
  onNext: () => void
  onBack: () => void
  onBadPin: () => void
}

function TestBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 pt-3">
      <button
        type="button"
        onClick={onBack}
        className="h-11 cursor-pointer rounded-lg border border-line px-3.5 font-display text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
      >
        Retour à la liste
      </button>
      <span className="rounded-md bg-pink/14 px-2.5 py-1 text-xs font-bold tracking-[0.08em] text-pink">MODE TEST · AUCUN SCORE</span>
    </div>
  )
}

// One bug, played in the page with the rules of the game. Nothing reaches the server.
function TestGame({ bug, onNext, onBack }: { bug: FullBug; onNext: () => void; onBack: () => void }) {
  const client = useMemo(() => createTestBugClient(bug), [bug])
  const { state, select, answer, next } = useGame(TEST_SESSION, onBack, client)

  // "Bug suivant" ends this one-bug game: go to the next bug of the list.
  useEffect(() => {
    if (state.phase === 'over') onNext()
  }, [state.phase, onNext])

  if (state.phase === 'playing') {
    return (
      <BugScreen
        state={state}
        totalBugs={1}
        onSelect={(selection) => void select(selection)}
        onAnswer={(choice) => void answer(choice)}
      />
    )
  }
  if (state.phase === 'feedback') {
    return (
      <FeedbackScreen
        bug={state.current!.bug}
        answer={state.answer!}
        verdict={state.verdict}
        index={0}
        totalBugs={1}
        streak={0}
        onNext={next}
      />
    )
  }
  return <p className="px-5 pt-6 text-ink-soft">Chargement…</p>
}

// Admin test tool (#132): loads the whole bug, then plays it.
function BugTester({ pin, client, id, onNext, onBack, onBadPin }: BugTesterProps) {
  const [bug, setBug] = useState<FullBug | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    client.getAdminBug(pin, id).then(
      (response) => setBug(response.bug),
      (caught: unknown) => {
        if (caught instanceof ApiRequestError && caught.code === 'bad_pin') onBadPin()
        else setError(true)
      },
    )
  }, [pin, client, id, onBadPin])

  return (
    <>
      <TestBar onBack={onBack} />
      {error && (
        <p role="alert" className="px-5 pt-6 text-danger">
          Bug introuvable.
        </p>
      )}
      {bug?.id === id && <TestGame key={id} bug={bug} onNext={onNext} onBack={onBack} />}
    </>
  )
}

export default BugTester
