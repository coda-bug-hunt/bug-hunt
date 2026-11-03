// High-school visitors enter Coda after the bac through the Bachelor
// Informatique, and pick dev or systems & networks in 3rd year (#139, #154).
const PROGRAM_URL = 'https://www.coda.school/formation-campus/bachelor-informatique-avignon'

type ProgramTileProps = {
  // The 3rd-year specialisation of the profile.
  speciality: string
  // Background of the arrow, in the colour of the profile.
  accent: string
}

function ProgramTile({ speciality, accent }: ProgramTileProps) {
  return (
    <a
      href={PROGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-line bg-night px-4 py-3 transition-colors hover:border-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[11px] font-bold tracking-[0.08em] text-muted">TA VOIE À CODA AVIGNON</span>
        <span className="font-display text-lg leading-tight font-bold text-ink">Bachelor Informatique</span>
        <span className="text-[13px] leading-snug text-ink-soft">
          Après le bac · spé {speciality} en 3<sup>e</sup> année
        </span>
        <span className="sr-only">Voir la formation (nouvel onglet)</span>
      </span>
      <span
        aria-hidden="true"
        className={`ml-auto flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-night transition-transform motion-safe:group-hover:scale-110 ${accent}`}
      >
        ↗
      </span>
    </a>
  )
}

export default ProgramTile
