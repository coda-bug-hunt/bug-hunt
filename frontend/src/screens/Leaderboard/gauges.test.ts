import { describe, expect, it } from 'vitest'
import { gaugeWidths } from './gauges'

describe('gaugeWidths', () => {
  it('gives the higher gauge 100 % and the other its share of it', () => {
    expect(gaugeWidths({ dev: 21, network: 19 })).toEqual({ dev: 100, network: 90 })
    expect(gaugeWidths({ dev: 5, network: 20 })).toEqual({ dev: 25, network: 100 })
  })

  it('stays empty before the first game', () => {
    expect(gaugeWidths({ dev: 0, network: 0 })).toEqual({ dev: 0, network: 0 })
  })
})
