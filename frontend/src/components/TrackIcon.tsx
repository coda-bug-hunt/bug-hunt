import type { Track } from '../api'

// Dev and network are always shown with an icon, never by color alone.
// Decorative: the text next to it names the track.
function TrackIcon({ track, size = 14 }: { track: Track; size?: number }) {
  if (track === 'dev') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 6 3 12l5 6M16 6l5 6-5 6M14 4l-4 16" />
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <path d="M11 7.3 6.2 16.8M13 7.3l4.8 9.5M7.5 19h9" />
    </svg>
  )
}

export default TrackIcon
