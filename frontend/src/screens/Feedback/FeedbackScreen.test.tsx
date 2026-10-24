// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AnswerResponse, PublicBug } from '../../api'
import FeedbackScreen from './FeedbackScreen'

const devBug: PublicBug = {
  id: 'dev', track: 'dev', difficulty: 1, points: 200, title: 'Le panier compte mal',
  code: ['function getTotal(price, shipping) {', '  return price - shipping;', '}'],
  choices: ['return price + shipping;', 'return price * shipping;', 'return 0;'],
}

const networkBug: PublicBug = {
  id: 'net', track: 'network', difficulty: 0, points: 100, title: "Le PC n'a pas Internet",
  diagram: { devices: [{ id: 'pc', label: 'PC' }, { id: 'box', label: 'Box' }], links: [['pc', 'box']] },
  choices: ['Passerelle 192.168.1.1', 'IP 192.168.1.1', 'Masque 255.0.0.0'],
}

const right: AnswerResponse = {
  correct: true, correctChoice: 0, points: 200, explanation: 'On additionne les frais de port.', score: 500, finished: false,
}

function renderFeedback(props: Partial<Parameters<typeof FeedbackScreen>[0]> = {}) {
  return render(
    <FeedbackScreen
      bug={devBug}
      answer={right}
      verdict={{ lineCorrect: true, correctSelection: 1 }}
      index={2}
      totalBugs={10}
      onNext={() => {}}
      {...props}
    />,
  )
}

describe('FeedbackScreen', () => {
  it('celebrates a right answer with the points and the score', () => {
    renderFeedback()
    expect(screen.getByText('Bug 3/10 terminé')).toBeTruthy()
    expect(screen.getByText('500 pts')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Coin-coin ! Bug écrasé.')
    expect(screen.getByText('+200 pts')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Le canard est content' })).toBeTruthy()
  })

  it('comforts a wrong answer', () => {
    renderFeedback({ answer: { ...right, correct: false, points: 0 } })
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Pas grave, même les seniors se trompent.')
    expect(screen.getByText('+0 pt')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Le canard est déçu' })).toBeTruthy()
  })

  it('shows a dev fix as a diff, with - and + written out', () => {
    renderFeedback()
    const diff = screen.getByRole('list', { name: 'La correction' })
    const [removed, added] = within(diff).getAllByRole('listitem')
    expect(removed.textContent).toBe('-Supprimé : return price - shipping;')
    expect(added.textContent).toBe('+Ajouté : return price + shipping;')
  })

  it('shows only the fix when the line is unknown (timeout before any pick)', () => {
    renderFeedback({ verdict: null })
    const items = within(screen.getByRole('list', { name: 'La correction' })).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual(['+Ajouté : return price + shipping;'])
  })

  it('shows a network fix as text, on the right device', () => {
    renderFeedback({ bug: networkBug, verdict: { lineCorrect: false, correctSelection: 'pc' } })
    expect(screen.queryByRole('list', { name: 'La correction' })).toBeNull()
    expect(screen.getByText('Sur PC : Passerelle 192.168.1.1')).toBeTruthy()
  })

  it('shows the explanation', () => {
    renderFeedback()
    expect(screen.getByText('On additionne les frais de port.')).toBeTruthy()
  })

  it('goes to the next bug, or to the result after the last one', async () => {
    const onNext = vi.fn()
    const { unmount } = renderFeedback({ onNext })
    await userEvent.click(screen.getByRole('button', { name: 'Bug suivant' }))
    expect(onNext).toHaveBeenCalledTimes(1)
    unmount()

    renderFeedback({ answer: { ...right, finished: true } })
    expect(screen.getByRole('button', { name: 'Voir mon résultat' })).toBeTruthy()
  })
})
