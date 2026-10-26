// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import RulesLines from './RulesLines'

const code = ['Bloquer tout depuis Internet', 'Autoriser le port 443 depuis Internet', 'Autoriser tout depuis la maison']

describe('RulesLines', () => {
  it('makes every rule a button, labelled with its text', async () => {
    render(<RulesLines code={code} selected={null} verdict={null} onSelect={() => {}} />)
    const lines = screen.getAllByRole('button')
    expect(lines.map((line) => line.getAttribute('aria-label'))).toEqual([
      'Ligne 1 : Bloquer tout depuis Internet',
      'Ligne 2 : Autoriser le port 443 depuis Internet',
      'Ligne 3 : Autoriser tout depuis la maison',
    ])
    await userEvent.tab()
    expect(document.activeElement).toBe(lines[0])
  })

  it('numbers the rules in the order they apply', () => {
    render(<RulesLines code={code} selected={null} verdict={null} onSelect={() => {}} />)
    expect(screen.getAllByRole('button').map((line) => line.querySelector('.tabular-nums')?.textContent)).toEqual(['1', '2', '3'])
  })

  it('shows Autoriser and Bloquer in words and with an icon, not only by color', () => {
    render(<RulesLines code={code} selected={null} verdict={null} onSelect={() => {}} />)
    const block = screen.getByRole('button', { name: /Ligne 1/ }).querySelector('[data-action]')
    const allow = screen.getByRole('button', { name: /Ligne 2/ }).querySelector('[data-action]')
    expect(block?.getAttribute('data-action')).toBe('block')
    expect(block?.textContent).toContain('Bloquer')
    expect(block?.querySelector('svg')).toBeTruthy()
    expect(allow?.getAttribute('data-action')).toBe('allow')
    expect(allow?.textContent).toContain('Autoriser')
    expect(allow?.querySelector('svg')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Ligne 2/ }).textContent).toContain('le port 443 depuis Internet')
  })

  it('shows a rule without an action as it is', () => {
    render(<RulesLines code={['Journaliser tout']} selected={null} verdict={null} onSelect={() => {}} />)
    const line = screen.getByRole('button', { name: /Ligne 1/ })
    expect(line.querySelector('[data-action]')).toBeNull()
    expect(line.textContent).toContain('Journaliser tout')
  })

  it('sends the tapped line', async () => {
    const onSelect = vi.fn()
    render(<RulesLines code={code} selected={null} verdict={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /Ligne 2/ }))
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('marks the right line and the wrong pick, in text and not only by color', () => {
    render(<RulesLines code={code} selected={1} verdict={{ lineCorrect: false, correctSelection: 0 }} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /Ligne 2 .*, ta réponse, fausse$/ }).textContent).toContain('✗')
    expect(screen.getByRole('button', { name: /Ligne 1 .*, bonne réponse$/ }).textContent).toContain('✓')
    for (const line of screen.getAllByRole('button')) expect((line as HTMLButtonElement).disabled).toBe(true)
  })
})
