import type { Selection, Verdict } from '../../game/gameReducer'

// How a line or a device looks once the player picked one.
export type SelectionStatus = 'idle' | 'chosen' | 'right' | 'wrong'

export function selectionStatus(item: Selection, selected: Selection | null, verdict: Verdict | null): SelectionStatus {
  if (verdict && verdict.lineCorrect !== null) {
    if (verdict.correctSelection === item) return 'right'
    if (selected === item) return 'wrong'
    return 'idle'
  }
  return selected === item ? 'chosen' : 'idle'
}

export const statusClasses: Record<SelectionStatus, string> = {
  idle: 'border-transparent',
  chosen: 'border-lime bg-lime/14',
  right: 'border-lime bg-lime/14',
  wrong: 'border-danger bg-danger/14',
}

// Said to screen readers, and shown as an icon: never color alone.
export const statusLabels: Record<SelectionStatus, string> = {
  idle: '',
  chosen: ', ta réponse',
  right: ', bonne réponse',
  wrong: ', ta réponse, fausse',
}
