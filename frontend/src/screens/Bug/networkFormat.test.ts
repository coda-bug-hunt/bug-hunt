import { describe, expect, it } from 'vitest'
import { deviceDetails, deviceIcon, maskToPrefix, orderDevices } from './networkFormat'

describe('maskToPrefix', () => {
  it.each([
    ['255.0.0.0', 8],
    ['255.255.0.0', 16],
    ['255.255.255.0', 24],
    ['255.255.255.128', 25],
    ['255.255.255.255', 32],
  ])('%s -> /%i', (mask, prefix) => {
    expect(maskToPrefix(mask)).toBe(prefix)
  })

  it.each(['255.0.255.0', '255.255.255', 'abc', '256.0.0.0'])('rejects %s', (mask) => {
    expect(maskToPrefix(mask)).toBeNull()
  })
})

describe('deviceDetails', () => {
  it('shows only the fields that exist, IP with its prefix', () => {
    expect(deviceDetails({ id: 'pc', label: 'PC', ip: '192.168.1.10', mask: '255.255.255.0' })).toEqual([
      '192.168.1.10 /24',
    ])
    expect(deviceDetails({ id: 'switch', label: 'Switch' })).toEqual([])
  })

  it('keeps a mask it cannot convert as is', () => {
    expect(deviceDetails({ id: 'pc', label: 'PC', ip: '10.0.0.1', mask: '255.0.255.0' })).toEqual(['10.0.0.1 / 255.0.255.0'])
  })

  it('lists gateway, DNS, ports and one line per router interface', () => {
    expect(
      deviceDetails({
        id: 'r', label: 'Routeur', gateway: '10.0.0.1', dns: '10.0.0.53',
        interfaces: [{ ip: '192.168.1.1', mask: '255.255.255.0' }, { ip: '10.0.0.1', mask: '255.255.255.0' }],
        ports: [{ port: 22, open: true }, { port: 443, open: false }],
      }),
    ).toEqual(['192.168.1.1 /24', '10.0.0.1 /24', 'Passerelle 10.0.0.1', 'DNS 10.0.0.53', 'Port 22 ouvert', 'Port 443 fermé'])
  })
})

describe('orderDevices', () => {
  const devices = ['printer', 'switch', 'pc'].map((id) => ({ id, label: id }))

  it('follows the links from one end of the chain', () => {
    const ordered = orderDevices(devices, [['pc', 'switch'], ['printer', 'switch']])
    expect(ordered.map((device) => device.id)).toEqual(['pc', 'switch', 'printer'])
  })

  it('keeps devices without links, at the end', () => {
    const ordered = orderDevices(devices, [['pc', 'switch']])
    expect(ordered.map((device) => device.id)).toEqual(['pc', 'switch', 'printer'])
  })
})

describe('deviceIcon', () => {
  it.each([
    ['PC', 'computer'],
    ['PC 2', 'computer'],
    ['Imprimante', 'printer'],
    ['Serveur web', 'server'],
    ['Box', 'network'],
    ['Routeur', 'network'],
  ])('%s -> %s', (label, icon) => {
    expect(deviceIcon(label)).toBe(icon)
  })
})
