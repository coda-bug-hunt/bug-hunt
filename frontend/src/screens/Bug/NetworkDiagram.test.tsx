// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { mockBugs } from '../../api/mockBugs'
import type { NetworkDiagram as Diagram } from '../../api'
import NetworkDiagram from './NetworkDiagram'

const diagram: Diagram = {
  devices: [
    { id: 'pc', label: 'PC', ip: '192.168.1.10', mask: '255.255.255.0' },
    { id: 'switch', label: 'Switch' },
    { id: 'printer', label: 'Imprimante', ip: '192.168.2.50', mask: '255.255.255.0' },
  ],
  links: [['pc', 'switch'], ['printer', 'switch']],
}

describe('NetworkDiagram', () => {
  it('makes every device a button, in link order, reachable with Tab', async () => {
    render(<NetworkDiagram diagram={diagram} selected={null} verdict={null} onSelect={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'PC : 192.168.1.10 /24',
      'Switch',
      'Imprimante : 192.168.2.50 /24',
    ])
    await userEvent.tab()
    expect(document.activeElement).toBe(buttons[0])
  })

  it('sends the tapped device', async () => {
    const onSelect = vi.fn()
    render(<NetworkDiagram diagram={diagram} selected={null} verdict={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /^Imprimante/ }))
    expect(onSelect).toHaveBeenCalledWith('printer')
  })

  it('highlights the right device after a wrong pick', () => {
    render(
      <NetworkDiagram
        diagram={diagram}
        selected="pc"
        verdict={{ lineCorrect: false, correctSelection: 'printer' }}
        onSelect={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: /^PC.*, ta réponse, fausse$/ }).textContent).toContain('✗')
    expect(screen.getByRole('button', { name: /^Imprimante.*, bonne réponse$/ }).textContent).toContain('✓')
    for (const button of screen.getAllByRole('button')) expect((button as HTMLButtonElement).disabled).toBe(true)
  })

  it('displays every network bug of the mock', () => {
    for (const bug of mockBugs) {
      if (bug.track !== 'network') continue
      const { unmount } = render(<NetworkDiagram diagram={bug.diagram} selected={null} verdict={null} onSelect={() => {}} />)
      expect(screen.getAllByRole('button')).toHaveLength(bug.diagram.devices.length)
      unmount()
    }
  })
})
