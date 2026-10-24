import type { Affinity, Track } from '../../api'
import TrackIcon from '../../components/TrackIcon'

const tags: Record<Affinity, { label: string; tracks: Track[]; style: string }> = {
  dev: { label: 'DEV', tracks: ['dev'], style: 'bg-lime/14 text-lime' },
  network: { label: 'SR', tracks: ['network'], style: 'bg-pink/14 text-pink' },
  both: { label: 'POLYVALENT', tracks: ['dev', 'network'], style: 'bg-ink/10 text-ink' },
}

// Icon and text: an affinity is never told by color alone.
function AffinityTag({ affinity }: { affinity: Affinity | null }) {
  if (!affinity) return null
  const tag = tags[affinity]
  return (
    <span
      data-affinity={affinity}
      className={`inline-flex items-center gap-1.5 justify-self-end rounded-full px-3 py-1 text-sm font-bold tracking-[0.06em] ${tag.style}`}
    >
      {tag.tracks.map((track) => (
        <TrackIcon key={track} track={track} />
      ))}
      {tag.label}
    </span>
  )
}

export default AffinityTag
