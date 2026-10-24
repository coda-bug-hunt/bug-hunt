// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { GameApi, GameResult } from '../api'
import { useResult } from './useResult'

const result = { score: 100, maxScore: 3000 } as GameResult
const session = { gameId: 'g', token: 't' }

describe('useResult', () => {
  it('loads the result of the game', async () => {
    const client = { getResult: vi.fn().mockResolvedValue(result) } as unknown as GameApi
    const { result: hook } = renderHook(() => useResult(session, client))
    await waitFor(() => expect(hook.current.result).toBe(result))
    expect(client.getResult).toHaveBeenCalledWith(session)
  })

  it('reports a failure and retries on demand', async () => {
    const getResult = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(result)
    const client = { getResult } as unknown as GameApi
    const { result: hook } = renderHook(() => useResult(session, client))
    await waitFor(() => expect(hook.current.error).toBe(true))

    act(() => hook.current.retry())
    await waitFor(() => expect(hook.current).toMatchObject({ result, error: false }))
  })
})
