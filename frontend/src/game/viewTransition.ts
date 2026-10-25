import { flushSync } from 'react-dom'

// Animates a screen change with the View Transitions API where the browser
// has it (styles in index.css); otherwise, or with reduced motion, it just updates.
export function withViewTransition(update: () => void): void {
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  if (still || typeof document.startViewTransition !== 'function') {
    update()
    return
  }
  document.startViewTransition(() => flushSync(update))
}
