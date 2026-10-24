import { useEffect, useId, useRef } from 'react'

type TutorialTipProps = { text: string; onDone: () => void }

// A duck bubble of the first-bug tutorial. The focus moves to "Compris",
// which reads the tip to screen readers.
function TutorialTip({ text, onDone }: TutorialTipProps) {
  const id = useId()
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    button.current?.focus()
  }, [])

  return (
    <div className="flex flex-1 items-center gap-3 rounded-2xl rounded-bl-sm border border-lime bg-surface py-2 pr-2 pl-3.5">
      <p id={id} className="flex-1 text-sm leading-snug font-medium">
        {text}
      </p>
      <button
        ref={button}
        type="button"
        onClick={onDone}
        aria-describedby={id}
        className="h-11 flex-none cursor-pointer rounded-lg bg-lime px-4 font-display text-sm font-bold text-night focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
      >
        Compris
      </button>
    </div>
  )
}

export default TutorialTip
