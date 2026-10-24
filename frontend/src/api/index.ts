import type { GameApi } from './gameApi'
import { createHttpClient } from './httpClient'
import { createMockClient } from './mockClient'

export { ApiRequestError, type GameApi, type GameSession } from './gameApi'
export { getDeviceId } from './deviceId'
export { ConnectionLostError } from './httpClient'
export type * from './types'

// The client is picked once, from VITE_API_MODE (.env.development: mock)
// and VITE_API_URL (default /api, served by the Vite proxy or nginx).
function createClient(): GameApi {
  const mode = import.meta.env.VITE_API_MODE ?? 'mock'
  if (mode === 'mock') return createMockClient()
  return createHttpClient({ baseUrl: import.meta.env.VITE_API_URL ?? '/api' })
}

export const api: GameApi = createClient()
