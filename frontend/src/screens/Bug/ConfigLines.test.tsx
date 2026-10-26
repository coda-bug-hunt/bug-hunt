// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ConfigLines from './ConfigLines'

const code = ['[wifi]', 'nom = Maison', 'bande = 5GHz', 'mot_de_passe = ********']

describe('ConfigLines', () => {
  it('makes every setting a button, labelled with its text', async () => {
    render(<ConfigLines code={code} selected={null} verdict={null} onSelect={() => {}} />)
    const lines = screen.getAllByRole('button')
    expect(lines.map((line) => line.getAttribute('aria-label'))).toEqual([
      'Ligne 1 : [wifi]',
      'Ligne 2 : nom = Maison',
      'Ligne 3 : bande = 5GHz',
      'Ligne 4 : mot_de_passe = ********',
    ])
    await userEvent.tab()
    expect(document.activeElement).toBe(lines[0])
  })

  it('shows the key in grey and the value in mono', () => {
    render(<ConfigLines code={code} selected={null} verdict={null} onSelect={() => {}} />)
    const band = screen.getByRole('button', { name: /Ligne 3/ })
    expect(band.querySelector('.text-muted')?.textContent).toBe('bande')
    expect(band.querySelector('.font-mono')?.textContent).toBe('5GHz')
  })

  it('shows a line without = as it is, like a section name', () => {
    render(<ConfigLines code={code} selected={null} verdict={null} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /Ligne 1/ }).textContent).toContain('[wifi]')
  })

  it('names the panel after the language', () => {
    render(<ConfigLines code={code} language="Box Wi-Fi" selected={null} verdict={null} onSelect={() => {}} />)
    expect(screen.getByText('Box Wi-Fi')).toBeTruthy()
  })

  it('sends the tapped line', async () => {
    const onSelect = vi.fn()
    render(<ConfigLines code={code} selected={null} verdict={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /Ligne 3/ }))
    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('marks the right line and the wrong pick, in text and not only by color', () => {
    render(<ConfigLines code={code} selected={1} verdict={{ lineCorrect: false, correctSelection: 2 }} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /Ligne 2 .*, ta réponse, fausse$/ }).textContent).toContain('✗')
    expect(screen.getByRole('button', { name: /Ligne 3 .*, bonne réponse$/ }).textContent).toContain('✓')
    for (const line of screen.getAllByRole('button')) expect((line as HTMLButtonElement).disabled).toBe(true)
  })
})
