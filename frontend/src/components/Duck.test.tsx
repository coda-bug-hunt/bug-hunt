// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Duck, { type DuckMood } from './Duck'

const moods: [DuckMood, string][] = [
  ['idle', 'Le canard, mascotte du jeu'],
  ['think', 'Le canard réfléchit'],
  ['happy', 'Le canard est content'],
  ['sad', 'Le canard est déçu'],
  ['party', 'Le canard fait la fête'],
]

// SVG elements expose their classes as an attribute, not a string property.
function animations(container: Element): string[] {
  return [...container.querySelectorAll('[class*="animate-"]')].flatMap((element) =>
    (element.getAttribute('class') ?? '').split(' ').filter((name) => name.includes('animate-')),
  )
}

const part = (container: Element, name: string) => container.querySelectorAll(`[data-part="${name}"]`)

describe('Duck', () => {
  it.each(moods)('says what it feels (%s)', (mood, label) => {
    render(<Duck mood={mood} />)
    expect(screen.getByRole('img', { name: label })).toBeTruthy()
  })

  it.each(moods)('is alive in every mood (%s)', (mood) => {
    const { container } = render(<Duck mood={mood} />)
    expect(animations(container).length).toBeGreaterThan(1)
  })

  it.each(moods)('stays still when the phone asks for less motion (%s)', (mood) => {
    const { container } = render(<Duck mood={mood} />)
    expect(animations(container).every((name) => name.startsWith('motion-safe:'))).toBe(true)
  })

  it('blinks when its eye is open', () => {
    for (const mood of ['idle', 'think', 'sad'] as const) {
      const { container, unmount } = render(<Duck mood={mood} />)
      expect(part(container, 'eye')[0].getAttribute('class')).toContain('animate-duck-blink')
      unmount()
    }
  })

  it('cries when sad and throws confetti at a party', () => {
    expect(part(render(<Duck mood="sad" />).container, 'tear')).toHaveLength(1)
    expect(part(render(<Duck mood="party" />).container, 'confetti').length).toBeGreaterThanOrEqual(4)
  })

  it('reacts again when its mood changes', () => {
    const { container, rerender } = render(<Duck mood="think" />)
    const before = part(container, 'pose')[0]
    rerender(<Duck mood="happy" />)
    expect(part(container, 'pose')[0]).not.toBe(before)
  })
})
