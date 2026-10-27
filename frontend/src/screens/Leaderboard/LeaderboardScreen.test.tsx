// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GameApi, Leaderboard } from '../../api'
import { music } from '../../sound/music'
import { sound } from '../../sound/player'
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

describe('LeaderboardScreen live', () => {
  const entry = (rank: number, pseudo: string, score: number) => ({
    rank, pseudo, score, affinity: 'dev' as const, byTrack: { dev: score, network: 0 },
  })
  const before: Leaderboard = { top: [entry(1, 'Neo', 900), entry(2, 'Zed', 400)], gauges: { dev: 2, network: 0 }, gamesPlayed: 2 }
  const after: Leaderboard = {
    top: [entry(1, 'Lyra', 1200), entry(2, 'Neo', 900), entry(3, 'Zed', 400)],
    gauges: { dev: 3, network: 0 },
    gamesPlayed: 3,
  }

  async function wait(ms: number) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })
  }

  async function renderLive() {
    vi.useFakeTimers()
    const getLeaderboard = vi.fn().mockResolvedValueOnce(before).mockResolvedValue(after)
    render(<LeaderboardScreen client={{ getLeaderboard } as unknown as GameApi} />)
    await wait(0)
  }

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    sound.setMuted(false)
  })

  it('celebrates nothing on the first load', async () => {
    await renderLive()
    expect(screen.queryByText('Nouveau record !')).toBeNull()
    expect(document.querySelectorAll('[data-moved]')).toHaveLength(0)
  })

  it('highlights a nickname that enters or climbs, for 3 seconds', async () => {
    await renderLive()
    await wait(2000)
    const highlighted = [...document.querySelectorAll('[data-moved]')].map((row) => row.textContent)
    expect(highlighted).toHaveLength(1)
    expect(highlighted[0]).toContain('Lyra')
    await wait(3000)
    expect(document.querySelectorAll('[data-moved]')).toHaveLength(0)
  })

  it('celebrates a new record with a banner and a jingle', async () => {
    const play = vi.spyOn(sound, 'play').mockImplementation(() => {})
    await renderLive()
    await wait(2000)
    expect(screen.getByText('Nouveau record !')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Lyra')
    expect(play).toHaveBeenCalledWith('fanfare')
    await wait(5000)
    expect(screen.queryByText('Nouveau record !')).toBeNull()
  })

  it('mutes the jingle with the M key', async () => {
    await renderLive()
    fireEvent.keyDown(window, { key: 'm' })
    expect(sound.isMuted()).toBe(true)
    expect(screen.getByText(/M : remettre le son/)).toBeTruthy()
    fireEvent.keyDown(window, { key: 'M' })
    expect(sound.isMuted()).toBe(false)
  })
})

describe('LeaderboardScreen music', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts the background music on the first key or click, and stops it on leaving', async () => {
    const start = vi.spyOn(music, 'start').mockImplementation(() => {})
    const stop = vi.spyOn(music, 'stop').mockImplementation(() => {})
    const { unmount } = render(<LeaderboardScreen client={clientWith(board)} />)
    await screen.findAllByRole('listitem')
    expect(start).not.toHaveBeenCalled()
    fireEvent.pointerDown(window)
    expect(start).toHaveBeenCalled()
    unmount()
    expect(stop).toHaveBeenCalled()
  })

  it('lowers the music during the record fanfare', async () => {
    vi.useFakeTimers()
    const lower = vi.spyOn(music, 'lower').mockImplementation(() => {})
    vi.spyOn(sound, 'play').mockImplementation(() => {})
    const empty: Leaderboard = { top: [], gauges: { dev: 0, network: 0 }, gamesPlayed: 0 }
    const getLeaderboard = vi.fn().mockResolvedValueOnce(empty).mockResolvedValue(board)
    render(<LeaderboardScreen client={{ getLeaderboard } as unknown as GameApi} />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(lower).toHaveBeenCalled()
    vi.useRealTimers()
  })
})

describe('LeaderboardScreen showcase', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  async function after(ms: number) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })
  }

  it('shows a bug when no game ends for a while, and the board again on a new game', async () => {
    vi.useFakeTimers()
    const later: Leaderboard = { ...board, gamesPlayed: board.gamesPlayed + 1 }
    const getLeaderboard = vi.fn().mockResolvedValue(board)
    render(<LeaderboardScreen client={{ getLeaderboard } as unknown as GameApi} />)
    await after(0)
    expect(screen.queryByText('Trouveras-tu le bug ?')).toBeNull()

    await after(46_000)
    expect(screen.getByText('Trouveras-tu le bug ?')).toBeTruthy()
    expect(screen.getByText(`Scanne et bats ${board.top[0].pseudo} !`)).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()

    getLeaderboard.mockResolvedValue(later)
    await after(2_000)
    expect(screen.queryByText('Trouveras-tu le bug ?')).toBeNull()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
  })

  it('points at the faulty line, then shows the fix, in words and not only by color', async () => {
    vi.useFakeTimers()
    render(<LeaderboardScreen client={clientWith(board)} />)
    await after(46_000)
    expect(screen.queryByText('Le bug est ici')).toBeNull()
    await after(8_000)
    expect(screen.getByText('Le bug est ici')).toBeTruthy()
    await after(8_000)
    expect(screen.getByText('La correction')).toBeTruthy()
  })
})
