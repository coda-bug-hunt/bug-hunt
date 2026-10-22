import type { AnswerResponse } from '../../api'
import Duck from '../../components/Duck'

// Placeholder so a game can be played end to end. The real feedback
// screen (Coda mockup E5, with the diff) comes with #25.
function FeedbackPlaceholder({ answer, onNext }: { answer: AnswerResponse; onNext: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-5 py-6">
      <div className="flex items-center gap-3">
        <Duck mood={answer.correct ? 'happy' : 'sad'} size={72} />
        <h1 className="font-display text-3xl font-bold">{answer.correct ? 'Bug écrasé !' : 'Raté'}</h1>
      </div>
      <p className="font-mono text-lime">
        +{answer.points} pts · total {answer.score} pts
      </p>
      <p className="text-ink-soft">{answer.explanation}</p>
      <button
        type="button"
        onClick={onNext}
        autoFocus
        className="mt-auto h-14 cursor-pointer rounded-xl bg-lime font-display text-[17px] font-bold text-night focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
      >
        {answer.finished ? 'Voir mon résultat' : 'Bug suivant'}
      </button>
    </main>
  )
}

export default FeedbackPlaceholder
