import type { ReactNode } from 'react'
import type { NetworkDiagram as Diagram } from '../../api'
import type { Selection, Verdict } from '../../game/gameReducer'
import StatusMark from './StatusMark'
import { deviceDetails, deviceIcon, orderDevices, type DeviceIconName } from './networkFormat'
import { selectionStatus, statusClasses, statusLabels } from './selectionStatus'

function DeviceIcon({ name }: { name: DeviceIconName }) {
  const paths: Record<DeviceIconName, ReactNode> = {
    computer: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </>
    ),
    printer: (
      <>
        <path d="M7 9V4h10v5" />
        <rect x="3" y="9" width="18" height="8" rx="2" />
        <path d="M7 14h10v6H7z" />
      </>
    ),
    server: (
      <>
        <rect x="4" y="3" width="16" height="8" rx="1.5" />
        <rect x="4" y="13" width="16" height="8" rx="1.5" />
        <path d="M8 7h.01M8 17h.01" />
      </>
    ),
    network: (
      <>
        <rect x="3" y="12" width="18" height="7" rx="2" />
        <path d="M7 15.5h.01M11 15.5h.01M12 12V5M9 7l3-3 3 3" />
      </>
    ),
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="flex-none text-pink">
      {paths[name]}
    </svg>
  )
}

type NetworkDiagramProps = {
  diagram: Diagram
  selected: Selection | null
  verdict: Verdict | null
  onSelect: (deviceId: string) => void
}

// Coda mockup E4: devices top to bottom, joined by their links. Every
// device is a button; one without any field (a switch) is drawn dashed.
function NetworkDiagram({ diagram, selected, verdict, onSelect }: NetworkDiagramProps) {
  return (
    <ul className="flex flex-col rounded-[14px] border border-line bg-code p-4">
      {orderDevices(diagram.devices, diagram.links).map((device, index) => {
        const status = selectionStatus(device.id, selected, verdict)
        const details = deviceDetails(device)
        const idle = details.length > 0 ? 'border-line bg-surface' : 'border-dashed border-line text-muted'
        return (
          <li key={device.id} className="flex flex-col">
            {index > 0 && <div aria-hidden="true" className="h-6 w-0.5 self-center bg-line" />}
            <button
              type="button"
              disabled={selected !== null}
              onClick={() => onSelect(device.id)}
              aria-label={`${device.label}${details.length ? ` : ${details.join(', ')}` : ''}${statusLabels[status]}`}
              className={`flex min-h-18 w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 text-left disabled:cursor-default focus-visible:outline-2 focus-visible:outline-lime ${status === 'idle' ? idle : statusClasses[status]}`}
            >
              <span className="flex flex-1 flex-col gap-1">
                <span className="font-display text-base font-bold">{device.label}</span>
                {details.map((line) => (
                  <span key={line} className="font-mono text-[13px] text-muted">
                    {line}
                  </span>
                ))}
              </span>
              <StatusMark status={status} />
              <DeviceIcon name={deviceIcon(device.label)} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default NetworkDiagram
