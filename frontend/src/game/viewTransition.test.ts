// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { withViewTransition } from './viewTransition'

function reducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce') }))
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete (document as Partial<Document>).startViewTransition
})

describe('withViewTransition', () => {
  it('animates the change where the browser can', () => {
    reducedMotion(false)
    const start = vi.fn((callback: () => void) => callback())
    Object.assign(document, { startViewTransition: start })
    const update = vi.fn()
    withViewTransition(update)
    expect(start).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledOnce()
  })

  it('just updates without the View Transitions API', () => {
    reducedMotion(false)
    const update = vi.fn()
    withViewTransition(update)
    expect(update).toHaveBeenCalledOnce()
  })

  it('does not animate when the phone asks for less motion', () => {
    reducedMotion(true)
    const start = vi.fn()
    Object.assign(document, { startViewTransition: start })
    const update = vi.fn()
    withViewTransition(update)
    expect(start).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledOnce()
  })
})
