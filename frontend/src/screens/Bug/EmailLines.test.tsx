// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EmailLines from './EmailLines'

const code = [
  'De : Netflix <info@netflix.com>',
  'Objet : Ton paiement a échoué',
  '',
  'Bonjour,',
  'Mets ta carte à jour ici : http://netflix.connexion-securite.ru',
]

describe('EmailLines', () => {
  it('makes every header and message line a button, but not the empty line between them', async () => {
    render(<EmailLines code={code} selected={null} verdict={null} onSelect={() => {}} />)
    const lines = screen.getAllByRole('button')
    expect(lines.map((line) => line.getAttribute('aria-label'))).toEqual([
      'Ligne 1 : De : Netflix <info@netflix.com>',
      'Ligne 2 : Objet : Ton paiement a échoué',
      'Ligne 4 : Bonjour,',
      'Ligne 5 : Mets ta carte à jour ici : http://netflix.connexion-securite.ru',
    ])
    await userEvent.tab()
    expect(document.activeElement).toBe(lines[0])
  })

  it('shows the header names apart from their values', () => {
    render(<EmailLines code={code} selected={null} verdict={null} onSelect={() => {}} />)
    const from = screen.getByRole('button', { name: /Ligne 1/ })
    expect(from.querySelector('.text-muted')?.textContent).toBe('De :')
    expect(from.textContent).toContain('Netflix <info@netflix.com>')
  })

  it('underlines the links of the message', () => {
    render(<EmailLines code={code} selected={null} verdict={null} onSelect={() => {}} />)
    const link = screen.getByRole('button', { name: /Ligne 5/ }).querySelector('.underline')
    expect(link?.textContent).toBe('http://netflix.connexion-securite.ru')
  })

  it('wraps long lines instead of hiding the end of a link', () => {
    render(<EmailLines code={code} selected={null} verdict={null} onSelect={() => {}} />)
    const line = screen.getByRole('button', { name: /Ligne 5/ })
    expect(line.className).not.toContain('min-w-max')
    expect(line.querySelector('.underline')?.className).toContain('break-all')
  })

  it('reads a message without headers as a message', () => {
    render(<EmailLines code={['Salut, clique ici : www.cadeau.fr']} selected={null} verdict={null} onSelect={() => {}} />)
    const line = screen.getByRole('button', { name: /Ligne 1/ })
    expect(line.querySelector('.text-muted')).toBeNull()
    expect(line.querySelector('.underline')?.textContent).toBe('www.cadeau.fr')
  })

  it('sends the index of the tapped line in the bug, empty line included', async () => {
    const onSelect = vi.fn()
    render(<EmailLines code={code} selected={null} verdict={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /Ligne 5/ }))
    expect(onSelect).toHaveBeenCalledWith(4)
  })

  it('marks the right line and the wrong pick, in text and not only by color', () => {
    render(<EmailLines code={code} selected={0} verdict={{ lineCorrect: false, correctSelection: 4 }} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /Ligne 1 .*, ta réponse, fausse$/ }).textContent).toContain('✗')
    expect(screen.getByRole('button', { name: /Ligne 5 .*, bonne réponse$/ }).textContent).toContain('✓')
    for (const line of screen.getAllByRole('button')) expect((line as HTMLButtonElement).disabled).toBe(true)
  })
})
