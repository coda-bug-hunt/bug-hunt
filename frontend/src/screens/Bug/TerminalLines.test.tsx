// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TerminalLines from './TerminalLines'

const code = ['$ ping google.fr', 'ping: google.fr : nom inconnu', '$ ping 8.8.8.8', '64 octets de 8.8.8.8']

describe('TerminalLines', () => {
  it('makes every command and output line a button, labelled with its text', async () => {
    render(<TerminalLines code={code} selected={null} verdict={null} onSelect={() => {}} />)
    const lines = screen.getAllByRole('button')
    expect(lines.map((line) => line.getAttribute('aria-label'))).toEqual([
      'Ligne 1 : $ ping google.fr',
      'Ligne 2 : ping: google.fr : nom inconnu',
      'Ligne 3 : $ ping 8.8.8.8',
      'Ligne 4 : 64 octets de 8.8.8.8',
    ])
    await userEvent.tab()
    expect(document.activeElement).toBe(lines[0])
  })

  it('shows the prompt apart from the command, and the output in grey', () => {
    render(<TerminalLines code={code} selected={null} verdict={null} onSelect={() => {}} />)
    const command = screen.getByRole('button', { name: /Ligne 1/ })
    expect(command.querySelector('.text-ink > .text-lime')?.textContent).toBe('$')
    expect(command.textContent).toContain('ping google.fr')
    expect(screen.getByRole('button', { name: /Ligne 2/ }).querySelector('.text-muted')?.textContent).toBe(code[1])
  })

  it('names the window after the language', () => {
    render(<TerminalLines code={code} language="bash" selected={null} verdict={null} onSelect={() => {}} />)
    expect(screen.getByText('bash')).toBeTruthy()
  })

  it('sends the tapped line', async () => {
    const onSelect = vi.fn()
    render(<TerminalLines code={code} selected={null} verdict={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /Ligne 2/ }))
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('marks the right line and the wrong pick, in text and not only by color', () => {
    render(
      <TerminalLines code={code} selected={0} verdict={{ lineCorrect: false, correctSelection: 1 }} onSelect={() => {}} />,
    )
    expect(screen.getByRole('button', { name: /Ligne 1 .*, ta réponse, fausse$/ }).textContent).toContain('✗')
    expect(screen.getByRole('button', { name: /Ligne 2 .*, bonne réponse$/ }).textContent).toContain('✓')
    for (const line of screen.getAllByRole('button')) expect((line as HTMLButtonElement).disabled).toBe(true)
  })
})
