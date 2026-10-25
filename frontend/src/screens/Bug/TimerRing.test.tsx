// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TimerRing from './TimerRing'

function ring(left: number) {
  const { container } = render(<TimerRing left={left} total={60} />)
  const circle = container.querySelector('[data-ring]')!
  const length = Number(circle.getAttribute('stroke-dasharray'))
  return { circle, emptied: Number(circle.getAttribute('stroke-dashoffset')) / length }
}

describe('TimerRing', () => {
  it('is full at the start and empty at the end', () => {
    expect(ring(60).emptied).toBe(0)
    expect(ring(0).emptied).toBe(1)
  })

  it('empties with the time left', () => {
    expect(ring(15).emptied).toBeCloseTo(0.75)
  })

  it('turns red under 10 seconds', () => {
    expect(ring(20).circle.getAttribute('class')).toContain('stroke-lime')
    expect(ring(10).circle.getAttribute('class')).toContain('stroke-danger')
  })

  it('only glides between seconds when motion is allowed', () => {
    const classes = ring(30).circle.getAttribute('class')!.split(' ')
    expect(classes.filter((name) => name.includes('transition') || name.includes('duration')).every((name) => name.startsWith('motion-safe:'))).toBe(true)
  })
})
