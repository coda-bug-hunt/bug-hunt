import type { NetworkDevice, NetworkDiagram } from '../../api'

// "255.255.255.0" -> 24. null for anything that is not a valid mask.
export function maskToPrefix(mask: string): number | null {
  const parts = mask.split('.')
  if (parts.length !== 4) return null
  const bytes = parts.map(Number)
  if (bytes.some((byte, i) => !/^\d{1,3}$/.test(parts[i]) || byte > 255)) return null
  const bits = bytes.map((byte) => byte.toString(2).padStart(8, '0')).join('')
  // A mask is ones then zeros; the prefix is the number of ones.
  if (!/^1*0*$/.test(bits)) return null
  return bits.replace(/0/g, '').length
}

function address(ip: string, mask?: string): string {
  if (!mask) return ip
  const prefix = maskToPrefix(mask)
  return prefix === null ? `${ip} / ${mask}` : `${ip} /${prefix}`
}

// Only the fields present in the bug JSON, in a fixed order.
export function deviceDetails(device: NetworkDevice): string[] {
  const lines: string[] = []
  if (device.ip) lines.push(address(device.ip, device.mask))
  for (const item of device.interfaces ?? []) lines.push(address(item.ip, item.mask))
  if (device.gateway) lines.push(`Passerelle ${device.gateway}`)
  if (device.dns) lines.push(`DNS ${device.dns}`)
  for (const port of device.ports ?? []) lines.push(`Port ${port.port} ${port.open ? 'ouvert' : 'fermé'}`)
  return lines
}

// Top-to-bottom order: walk the links from one end of the chain; devices
// without links go last, in their original order.
export function orderDevices(devices: NetworkDevice[], links: NetworkDiagram['links']): NetworkDevice[] {
  const neighbours = new Map<string, string[]>()
  for (const [a, b] of links) {
    neighbours.set(a, [...(neighbours.get(a) ?? []), b])
    neighbours.set(b, [...(neighbours.get(b) ?? []), a])
  }

  const ids: string[] = []
  const visit = (id: string) => {
    if (ids.includes(id)) return
    ids.push(id)
    for (const next of neighbours.get(id) ?? []) visit(next)
  }
  if (links.length > 0) {
    const [first, second] = links[0]
    visit((neighbours.get(first)?.length ?? 0) <= 1 || (neighbours.get(second)?.length ?? 0) > 1 ? first : second)
  }
  for (const device of devices) visit(device.id)

  return ids.flatMap((id) => devices.filter((device) => device.id === id))
}

export type DeviceIconName = 'computer' | 'printer' | 'server' | 'network'

// The bug JSON has no device type yet (#2): guess it from the label.
export function deviceIcon(label: string): DeviceIconName {
  const name = label.toLowerCase()
  if (/\bpc\b|ordinateur|portable/.test(name)) return 'computer'
  if (name.includes('imprim')) return 'printer'
  if (name.includes('serveur')) return 'server'
  return 'network'
}
