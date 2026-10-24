// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import FixSheet from './FixSheet'

const choices: [string, string, string] = ['return price + shipping;', 'return price * shipping;', 'return 0;']

describe('FixSheet', () => {
  it('names the right line after a wrong pick and takes the focus', () => {
    render(
      <FixSheet choices={choices} verdict={{ lineCorrect: false, correctSelection: 1 }} correctLabel="ligne 2" onChoose={() => {}} />,
    )
    const title = screen.getByRole('heading', { name: 'Raté : le bug est ligne 2. Quelle correction ?' })
    expect(document.activeElement).toBe(title)
  })

  it('congratulates a right pick', () => {
    render(
      <FixSheet choices={choices} verdict={{ lineCorrect: true, correctSelection: 1 }} correctLabel="ligne 2" onChoose={() => {}} />,
    )
    expect(screen.getByRole('heading').textContent).toBe('Bien vu, ligne 2 ! Quelle correction ?')
  })

  it('still asks for a fix when the line is unknown (after a reload)', () => {
    render(<FixSheet choices={choices} verdict={{ lineCorrect: null }} correctLabel={null} onChoose={() => {}} />)
    expect(screen.getByRole('heading').textContent).toBe('Quelle correction ?')
  })

  it('sends the chosen fix', async () => {
    const onChoose = vi.fn()
    render(<FixSheet choices={choices} verdict={{ lineCorrect: null }} correctLabel={null} onChoose={onChoose} />)
    await userEvent.click(screen.getByRole('button', { name: /return price \* shipping/ }))
    expect(onChoose).toHaveBeenCalledWith(1)
  })
})
