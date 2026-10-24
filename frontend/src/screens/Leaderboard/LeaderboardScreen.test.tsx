// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { GameApi, Leaderboard } from '../../api'
import LeaderboardScreen from './LeaderboardScreen'

const pseudos = ['PixelKid', 'Lyra_09', 'ByteMe', 'Neo42', 'Tom-B', 'Sasha', 'Krypto', 'Ilyes', 'Maelle', 'Zed']

const board: Leaderboard = {
  top: pseudos.map((pseudo, i) => ({
    rank: i + 1, pseudo, score: 2350 - i * 150, affinity: 'dev', byTrack: { dev: 0, network: 0 },
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
})
