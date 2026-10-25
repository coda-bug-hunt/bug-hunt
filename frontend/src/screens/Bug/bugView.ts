import type { BugView, PublicBug } from '../../api'

// The view of a bug: without one, lines are code and a diagram is a diagram.
export function viewOf(bug: PublicBug): BugView {
  return bug.view ?? ('code' in bug ? 'code' : 'diagram')
}

// What the player is asked to touch, per view.
export const instructions: Record<BugView, string> = {
  code: 'Touche la ligne qui contient le bug.',
  terminal: 'Touche la ligne qui montre le problème.',
  email: 'Touche ce qui te paraît suspect.',
  config: 'Touche le réglage qui cloche.',
  rules: 'Touche la règle qui pose problème.',
  diagram: "Touche l'appareil mal configuré.",
}
