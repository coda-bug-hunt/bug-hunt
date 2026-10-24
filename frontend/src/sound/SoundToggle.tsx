import { sound, useMuted, type SoundPlayer } from './player'

// Speaker button of the game screens. `player` is only passed by tests.
function SoundToggle({ player = sound }: { player?: SoundPlayer }) {
  const muted = useMuted(player)
  return (
    <button
      type="button"
      onClick={() => player.setMuted(!muted)}
      aria-label={muted ? 'Remettre le son' : 'Couper le son'}
      className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-full text-muted focus-visible:outline-2 focus-visible:outline-lime"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19.5 5.5a9 9 0 0 1 0 13" />}
      </svg>
    </button>
  )
}

export default SoundToggle
