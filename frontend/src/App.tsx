import { useState } from 'react'
import type { GameSession } from './api'
import HomeScreen from './screens/Home/HomeScreen'

// The player view. Game steps are React state, not routes.
function App() {
  const [session, setSession] = useState<GameSession | null>(null)

  if (!session) return <HomeScreen onStart={setSession} />

  // Placeholder until the bug screen (#24).
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <p className="font-display text-2xl font-bold">Partie créée</p>
    </main>
  )
}

export default App
