// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from './useCountdown'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(0)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useCountdown', () => {
  it('counts down from the end time', () => {
    const { result } = renderHook(() => useCountdown(10_000, () => {}))
    expect(result.current).toBe(10)
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(result.current).toBe(6)
  })

  it('calls onExpire once, even when time keeps running', () => {
    const onExpire = vi.fn()
    renderHook(() => useCountdown(2000, onExpire))
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('stops ticking once unmounted', () => {
    const onExpire = vi.fn()
    const { unmount } = renderHook(() => useCountdown(2000, onExpire))
    unmount()
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(onExpire).not.toHaveBeenCalled()
  })
})
