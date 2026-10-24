import { useState, type FormEvent } from 'react'
import Duck from '../../components/Duck'

// The error stays neutral: it never says whether the PIN was close.
function PinForm({ wrongPin, onSubmit }: { wrongPin: boolean; onSubmit: (pin: string) => void }) {
  const [pin, setPin] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    if (pin) onSubmit(pin)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-5 px-5">
      <div className="flex items-center gap-2">
        <Duck mood="idle" size={44} />
        <h1 className="font-display text-2xl font-bold">Modération</h1>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-2.5">
        <label htmlFor="pin" className="text-sm font-medium">
          Code PIN
        </label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          className="h-13 rounded-xl border border-line bg-code px-4 font-mono text-base focus-visible:outline-2 focus-visible:outline-lime"
        />
        {wrongPin && (
          <p role="alert" className="text-sm text-danger">
            Code incorrect.
          </p>
        )}
        <button
          type="submit"
          className="mt-1.5 h-14 cursor-pointer rounded-xl bg-lime font-display text-[17px] font-bold text-night focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
        >
          Valider
        </button>
      </form>
    </main>
  )
}

export default PinForm
