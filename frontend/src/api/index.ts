import type { GameApi } from './gameApi'
import { createMockClient } from './mockClient'

export { ApiRequestError, type GameApi, type GameSession } from './gameApi'
export { getDeviceId } from './deviceId'
export type * from './types'

// The client is picked once, from VITE_API_MODE (.env.development: mock).
function createClient(): GameApi {
  const mode = import.meta.env.VITE_API_MODE ?? 'mock'
  if (mode === 'mock') return createMockClient()
  throw new Error(`VITE_API_MODE=${mode}: the HTTP client comes with #41`)
}

export const api: GameApi = createClient()
