// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CodeLines from './CodeLines'

const code = ['function getTotal(price, shipping) {', '  return price - shipping;', '}']

describe('CodeLines', () => {
  it('makes every line a button, reachable with Tab', async () => {
    render(<CodeLines code={code} selected={null} verdict={null} onSelect={() => {}} />)
    const lines = screen.getAllByRole('button')
    expect(lines.map((line) => line.getAttribute('aria-label'))).toEqual([
      'Ligne 1 : function getTotal(price, shipping) {',
      'Ligne 2 : return price - shipping;',
      'Ligne 3 : }',
    ])
    await userEvent.tab()
    expect(document.activeElement).toBe(lines[0])
  })

  it('sends the tapped line', async () => {
    const onSelect = vi.fn()
    render(<CodeLines code={code} selected={null} verdict={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /Ligne 2/ }))
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('marks the right line and the wrong pick, in text and not only by color', () => {
    render(
      <CodeLines code={code} selected={0} verdict={{ lineCorrect: false, correctSelection: 1 }} onSelect={() => {}} />,
    )
    expect(screen.getByRole('button', { name: /Ligne 1 .*, ta réponse, fausse$/ }).textContent).toContain('✗')
    expect(screen.getByRole('button', { name: /Ligne 2 .*, bonne réponse$/ }).textContent).toContain('✓')
  })

  it('locks the lines once one is picked', () => {
    render(<CodeLines code={code} selected={2} verdict={null} onSelect={() => {}} />)
    for (const line of screen.getAllByRole('button')) expect((line as HTMLButtonElement).disabled).toBe(true)
  })
})
