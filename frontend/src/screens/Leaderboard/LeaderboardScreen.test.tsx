// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { GameApi, Leaderboard } from '../../api'
import LeaderboardScreen from './LeaderboardScreen'

// The QR code itself is drawn by qrcode.react: check only what it encodes.
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, title }: { value: string; title: string }) => <svg role="img" aria-label={title} data-value={value} />,
}))

const pseudos = ['PixelKid', 'Lyra_09', 'ByteMe', 'Neo42', 'Tom-B', 'Sasha', 'Krypto', 'Ilyes', 'Maelle', 'Zed']

const board: Leaderboard = {
  top: pseudos.map((pseudo, i) => ({
    rank: i + 1, pseudo, score: 2350 - i * 150, affinity: (['dev', 'network', 'both'] as const)[i % 3], byTrack: { dev: 0, network: 0 },
  })),
  gauges: { dev: 21, network: 19 },
  gamesPlayed: 37,
}

function clientWith(leaderboard: Leaderboard) {
  return { getLeaderboard: vi.fn().mockResolvedValue(leaderboard) } as unknown as GameApi
}

describe('LeaderboardScreen', () => {
  it('shows the top 10: rank, nickname and score', async () => {
    render(<LeaderboardScreen client={clientWith(board)} />)
    const rows = await screen.findAllByRole('listitem')
    expect(rows).toHaveLength(10)
    expect(within(rows[0]).getByText('1')).toBeTruthy()
    expect(within(rows[0]).getByText('PixelKid')).toBeTruthy()
    expect(rows[0].textContent).toContain('2 350')
    expect(within(rows[9]).getByText('Zed')).toBeTruthy()
  })

  it('has its title, for the big screen', async () => {
    render(<LeaderboardScreen client={clientWith(board)} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Chasse aux bugs')
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(10))
  })

  it('tags each player with an affinity, in text and with an icon', async () => {
    render(<LeaderboardScreen client={clientWith(board)} />)
    const rows = await screen.findAllByRole('listitem')
    expect(rows.slice(0, 3).map((row) => row.querySelector('[data-affinity]')?.textContent)).toEqual(['DEV', 'SR', 'POLYVALENT'])
    expect(rows[2].querySelectorAll('[data-affinity] svg')).toHaveLength(2)
  })

  it('shows the record, the gauges of the day and the games played', async () => {
    render(<LeaderboardScreen client={clientWith(board)} />)
    expect(await screen.findByText('NOUVEAU RECORD')).toBeTruthy()
    expect(screen.getByText(/^PixelKid · 2\s350$/)).toBeTruthy()
    expect(screen.getByRole('meter', { name: 'Dev' }).getAttribute('aria-valuenow')).toBe('21')
    expect(screen.getByRole('meter', { name: 'SR' }).getAttribute('aria-valuenow')).toBe('19')
    expect(screen.getByText('37 parties jouées')).toBeTruthy()
  })

  it('invites the first player before any game', async () => {
    const empty: Leaderboard = { top: [], gauges: { dev: 0, network: 0 }, gamesPlayed: 0 }
    render(<LeaderboardScreen client={clientWith(empty)} />)
    expect(await screen.findByText('Sois le premier !')).toBeTruthy()
    expect(screen.queryByText('NOUVEAU RECORD')).toBeNull()
  })

  it('points the QR code to the game, on the address the screen was opened from', async () => {
    render(<LeaderboardScreen client={clientWith(board)} />)
    const qr = await screen.findByRole('img', { name: 'QR code pour jouer' })
    expect(qr.getAttribute('data-value')).toBe(`${window.location.origin}/`)
    expect(screen.getByText('Scanne pour jouer')).toBeTruthy()
  })
})
