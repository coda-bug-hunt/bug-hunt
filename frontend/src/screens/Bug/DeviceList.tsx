import type { NetworkDevice } from '../../api'
import type { Selection, Verdict } from '../../game/gameReducer'
import StatusMark from './StatusMark'
import { selectionStatus, statusClasses, statusLabels } from './selectionStatus'

// Minimal network view so a game can be played end to end.
// The real diagram (Coda mockup E4) comes with #38.

function details(device: NetworkDevice): string[] {
  const lines: string[] = []
  if (device.ip) lines.push(`IP ${device.ip}${device.mask ? ` / ${device.mask}` : ''}`)
  for (const item of device.interfaces ?? []) lines.push(`IP ${item.ip} / ${item.mask}`)
  if (device.gateway) lines.push(`Passerelle ${device.gateway}`)
  if (device.dns) lines.push(`DNS ${device.dns}`)
  for (const port of device.ports ?? []) lines.push(`Port ${port.port} ${port.open ? 'ouvert' : 'fermé'}`)
  return lines
}

type DeviceListProps = {
  devices: NetworkDevice[]
  selected: Selection | null
  verdict: Verdict | null
  onSelect: (deviceId: string) => void
}

function DeviceList({ devices, selected, verdict, onSelect }: DeviceListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {devices.map((device) => {
        const status = selectionStatus(device.id, selected, verdict)
        const lines = details(device)
        return (
          <li key={device.id}>
            <button
              type="button"
              disabled={selected !== null}
              onClick={() => onSelect(device.id)}
              aria-label={`${device.label}${lines.length ? ` : ${lines.join(', ')}` : ''}${statusLabels[status]}`}
              className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border bg-code px-3 py-2 text-left disabled:cursor-default focus-visible:outline-2 focus-visible:outline-lime ${status === 'idle' ? 'border-line' : statusClasses[status]}`}
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-display font-bold">{device.label}</span>
                {lines.map((line) => (
                  <span key={line} className="font-mono text-[13px] text-ink-soft">
                    {line}
                  </span>
                ))}
              </span>
              <span className="ml-auto">
                <StatusMark status={status} />
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default DeviceList
