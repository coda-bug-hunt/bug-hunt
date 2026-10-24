// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TutorialTip from './TutorialTip'

describe('TutorialTip', () => {
  it('moves the focus to "Compris", which reads the tip to screen readers', () => {
    render(<TutorialTip text="Touche la ligne où se cache le bug." onDone={() => {}} />)
    const button = screen.getByRole('button', { name: 'Compris' })
    expect(document.activeElement).toBe(button)
    expect(document.getElementById(button.getAttribute('aria-describedby')!)?.textContent).toBe(
      'Touche la ligne où se cache le bug.',
    )
  })

  it('closes with the keyboard', async () => {
    const onDone = vi.fn()
    render(<TutorialTip text="Choisis la bonne correction." onDone={onDone} />)
    await userEvent.keyboard('{Enter}')
    expect(onDone).toHaveBeenCalledOnce()
  })
})
