// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWakeLock } from './useWakeLock'

function fakeWakeLock(request = vi.fn()) {
  const release = vi.fn().mockResolvedValue(undefined)
  request.mockImplementation(async () => ({ release }))
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
  return { request, release }
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

afterEach(() => {
  // @ts-expect-error: removed between tests, as in browsers without it.
  delete navigator.wakeLock
  setVisibility('visible')
})

describe('useWakeLock', () => {
  it('keeps the screen on while active, and lets it sleep after', async () => {
    const { request, release } = fakeWakeLock()
    const { unmount } = renderHook(() => useWakeLock(true))
    await act(async () => {})
    expect(request).toHaveBeenCalledWith('screen')
    unmount()
    expect(release).toHaveBeenCalled()
  })

  it('asks nothing while inactive', async () => {
    const { request } = fakeWakeLock()
    renderHook(() => useWakeLock(false))
    await act(async () => {})
    expect(request).not.toHaveBeenCalled()
  })

  // The browser drops the lock when the tab goes to the back.
  it('takes the lock again when the page comes back to the front', async () => {
    const { request } = fakeWakeLock()
    renderHook(() => useWakeLock(true))
    await act(async () => {})
    await act(async () => setVisibility('hidden'))
    await act(async () => setVisibility('visible'))
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('does nothing where the browser has no wake lock, or refuses it', async () => {
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow()
    const { request } = fakeWakeLock(vi.fn())
    request.mockRejectedValue(new Error('NotAllowedError'))
    renderHook(() => useWakeLock(true))
    await act(async () => {})
    expect(request).toHaveBeenCalled()
  })
})
