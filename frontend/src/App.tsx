import { useCallback, useState, type ReactNode } from 'react'
import { useGame } from './game/useGame'
import { clearGame, readGame, saveGame, type ActiveGame } from './game/session'
import BugScreen from './screens/Bug/BugScreen'
import FeedbackPlaceholder from './screens/Feedback/FeedbackPlaceholder'
import HomeScreen from './screens/Home/HomeScreen'

function Centered({ children }: { children: ReactNode }) {
  return <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">{children}</main>
}

const primaryButton =
  'h-14 cursor-pointer rounded-xl bg-lime px-6 font-display text-[17px] font-bold text-night focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime'

function GameView({ game, onLeave }: { game: ActiveGame; onLeave: () => void }) {
  const { state, select, answer, next, retry } = useGame(game, onLeave)

  if (state.phase === 'loading') {
    return (
      <Centered>
        {state.error ? (
          <>
            <p role="alert" className="text-danger">Connexion perdue.</p>
            <button type="button" onClick={() => void retry()} className={primaryButton}>
              Réessayer
            </button>
          </>
        ) : (
          <p className="text-ink-soft">Chargement…</p>
        )}
      </Centered>
    )
  }

  if (state.phase === 'playing') {
    return (
      <BugScreen
        key={state.current!.bug.id}
        state={state}
        totalBugs={game.totalBugs}
        onSelect={(selection) => void select(selection)}
        onAnswer={(choice) => void answer(choice)}
      />
    )
  }

  if (state.phase === 'feedback') return <FeedbackPlaceholder answer={state.answer!} onNext={next} />

  // Placeholder until the end screen (#37).
  return (
    <Centered>
      <h1 className="font-display text-3xl font-bold">Partie terminée</h1>
      <p className="font-mono text-lime">{state.score} pts</p>
      <button type="button" onClick={onLeave} className={primaryButton}>
        Rejouer
      </button>
    </Centered>
  )
}

// The player view. Game steps are React state, not routes; the game in
// progress survives a reload through sessionStorage.
function App() {
  const [game, setGame] = useState<ActiveGame | null>(readGame)

  const start = useCallback((started: ActiveGame) => {
    saveGame(started)
    setGame(started)
  }, [])

  const leave = useCallback(() => {
    clearGame()
    setGame(null)
  }, [])

  if (!game) return <HomeScreen onStart={start} />
  return <GameView key={game.gameId} game={game} onLeave={leave} />
}

export default App
