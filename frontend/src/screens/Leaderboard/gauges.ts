import type { ByTrack } from '../../api'

// Bar widths in %: the higher gauge fills its bar, the other is relative to it.
export function gaugeWidths(gauges: ByTrack): ByTrack {
  const max = Math.max(gauges.dev, gauges.network)
  if (max === 0) return { dev: 0, network: 0 }
  return { dev: Math.round((gauges.dev / max) * 100), network: Math.round((gauges.network / max) * 100) }
}
