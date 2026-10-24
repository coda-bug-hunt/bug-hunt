// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePolling } from './usePolling'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('usePolling', () => {
  it('loads at once, then every interval', async () => {
    const load = vi.fn().mockResolvedValue('data')
    const { result } = renderHook(() => usePolling(load, 2000))
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(result.current).toEqual({ data: 'data', error: false })
    expect(load).toHaveBeenCalledTimes(1)

    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('keeps the last data when a request fails, and retries', async () => {
    const load = vi.fn().mockResolvedValueOnce('first').mockRejectedValueOnce(new Error('offline')).mockResolvedValue('third')
    const { result } = renderHook(() => usePolling(load, 2000))
    await act(() => vi.advanceTimersByTimeAsync(0))
    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(result.current).toEqual({ data: 'first', error: true })

    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(result.current).toEqual({ data: 'third', error: false })
  })

  it('never stacks requests while one is pending', async () => {
    const load = vi.fn(() => new Promise<string>(() => {}))
    renderHook(() => usePolling(load, 2000))
    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('stops when the page is left', async () => {
    const load = vi.fn().mockResolvedValue('data')
    const { unmount } = renderHook(() => usePolling(load, 2000))
    await act(() => vi.advanceTimersByTimeAsync(0))
    unmount()
    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(load).toHaveBeenCalledTimes(1)
  })
})
