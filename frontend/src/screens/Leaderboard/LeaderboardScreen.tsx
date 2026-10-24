import { api, type GameApi, type LeaderboardEntry } from '../../api'
import { usePolling } from '../../hooks/usePolling'

const REFRESH_MS = 2000

function Row({ entry }: { entry: LeaderboardEntry }) {
  const first = entry.rank === 1
  return (
    <li
      className={`grid h-13 grid-cols-[64px_minmax(0,1fr)_160px] items-center rounded-[10px] border px-5 ${first ? 'border-lime bg-lime/10' : 'border-line bg-surface'}`}
    >
      <span className={`font-mono text-[22px] font-semibold ${first ? 'text-lime' : 'text-muted'}`}>{entry.rank}</span>
      <span className="truncate text-2xl font-medium">{entry.pseudo}</span>
      <span className="text-right font-mono text-2xl font-semibold">{entry.score.toLocaleString('fr-FR')}</span>
    </li>
  )
}

// Big screen of the stand (Coda mockup E7), landscape, read from 3 metres.
// `client` is only passed by tests.
function LeaderboardScreen({ client = api }: { client?: GameApi }) {
  const { data } = usePolling(() => client.getLeaderboard(), REFRESH_MS)

  return (
    <main className="flex min-h-dvh flex-col gap-[22px] px-14 py-11">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-5xl font-bold">
          Chasse aux <span className="text-lime">bugs</span>
        </h1>
        <span className="font-mono text-lg text-muted">CODA · JPO · Top 10 en direct</span>
      </div>
      <ol className="flex flex-col gap-1.5">
        {data?.top.map((entry) => <Row key={entry.pseudo} entry={entry} />)}
      </ol>
    </main>
  )
}

export default LeaderboardScreen
