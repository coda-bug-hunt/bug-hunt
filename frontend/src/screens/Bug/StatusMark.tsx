import type { SelectionStatus } from './selectionStatus'

// Fixed-width slot, so the mark stays visible even on a line that scrolls.
function StatusMark({ status }: { status: SelectionStatus }) {
  const mark = status === 'right' ? '✓' : status === 'wrong' ? '✗' : ''
  const color = status === 'wrong' ? 'text-danger' : 'text-lime'
  return (
    <span aria-hidden="true" className={`w-3 flex-none font-bold ${color}`}>
      {mark}
    </span>
  )
}

export default StatusMark
