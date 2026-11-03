// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { GameResult } from '../../api'
import { sound } from '../../sound/player'
import EndScreen from './EndScreen'

const result: GameResult = {
  score: 2150,
  maxScore: 3000,
  byTrack: { dev: 900, network: 1250 },
  percentByTrack: { dev: 60, network: 83 },
  affinity: 'network',
  rank: 4,
  playersCount: 37,
}

// Testing Library collapses whitespace: compare the narrow no-break space exactly.
const exactText = (text: string) => (_: string, element: Element | null) => element?.textContent === text

function renderEnd(overrides: Partial<GameResult> = {}, onReplay = () => {}) {
  return render(<EndScreen pseudo="Neo42" result={{ ...result, ...overrides }} onReplay={onReplay} />)
}

describe('EndScreen', () => {
  it('shows the score out of the maximum, the nickname and the rank', () => {
    renderEnd()
    expect(screen.getByText('Partie terminée · Neo42')).toBeTruthy()
    expect(screen.getByText(exactText('2 150'))).toBeTruthy()
    expect(screen.getByText(exactText('/ 3 000'))).toBeTruthy()
    expect(screen.getByText('4ᵉ au classement sur 37 joueurs')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Le canard fait la fête' })).toBeTruthy()
  })

  it('names the affinity and writes each percentage, not only as a bar', () => {
    renderEnd()
    expect(screen.getByRole('heading', { name: 'SR' })).toBeTruthy()
    expect(screen.getByText('60 %')).toBeTruthy()
    expect(screen.getByText('83 %')).toBeTruthy()
    expect(screen.getByText(/machines qui ne se parlent pas/)).toBeTruthy()
  })

  it.each([
    ['dev', 'Dev', /comme un livre/],
    ['both', 'Polyvalent', /des deux côtés/],
  ] as const)('has a title and a message for %s', (affinity, title, message) => {
    renderEnd({ affinity })
    expect(screen.getByRole('heading', { name: title })).toBeTruthy()
    expect(screen.getByText(message)).toBeTruthy()
  })

  it.each([
    ['dev', 'Bachelor Développeur Web Fullstack', 'bachelor-developpeur-web-avignon'],
    ['network', 'Bachelor Systèmes et Réseaux', 'bachelor-administrateur-systemes-et-reseaux-avignon'],
    ['both', 'Bachelor Informatique', 'bachelor-informatique-avignon'],
  ] as const)('points %s to its Coda Avignon program, in a new tab', (affinity, program, page) => {
    renderEnd({ affinity })
    const link = screen.getByRole('link', { name: new RegExp(program) })
    expect(link.getAttribute('href')).toBe(`https://www.coda.school/formation-campus/${page}`)
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.textContent).toMatch(/nouvel onglet/)
  })

  it('hides the affinity block in dev-only mode', () => {
    renderEnd({ affinity: null })
    expect(screen.queryByText('TON PROFIL')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('replays', async () => {
    const onReplay = vi.fn()
    renderEnd({}, onReplay)
    await userEvent.click(screen.getByRole('button', { name: 'Rejouer' }))
    expect(onReplay).toHaveBeenCalledTimes(1)
  })
})

describe('EndScreen sound', () => {
  it('plays a fanfare', () => {
    const play = vi.spyOn(sound, 'play').mockImplementation(() => {})
    renderEnd()
    expect(play).toHaveBeenCalledWith('fanfare')
    play.mockRestore()
  })
})
