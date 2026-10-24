// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiRequestError, type AdminPlayer, type GameApi } from '../../api'
import AdminScreen from './AdminScreen'

const playedAt = new Date().toISOString()
const players: AdminPlayer[] = [
  { pseudo: 'Zed', bestScore: 750, affinity: 'network', hidden: false, lastPlayedAt: playedAt },
  { pseudo: 'Neo42', bestScore: 1450, affinity: 'dev', hidden: false, lastPlayedAt: playedAt },
  { pseudo: 'Troll', bestScore: 400, affinity: null, hidden: true, lastPlayedAt: playedAt },
]

function fakeClient(overrides: Partial<GameApi> = {}) {
  return {
    getAdminPlayers: vi.fn(async (pin: string) => {
      if (pin !== '1234') throw new ApiRequestError('bad_pin')
      return { players }
    }),
    setHidden: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as GameApi
}

async function signIn(pin = '1234') {
  await userEvent.type(screen.getByLabelText('Code PIN'), pin)
  await userEvent.click(screen.getByRole('button', { name: 'Valider' }))
}

beforeEach(() => {
  sessionStorage.clear()
})

describe('AdminScreen', () => {
  it('asks for the PIN, then lists the latest players', async () => {
    const client = fakeClient()
    render(<AdminScreen client={client} />)
    await signIn()
    expect(await screen.findByText('Neo42')).toBeTruthy()
    expect(screen.getByText('PIN VALIDÉ')).toBeTruthy()
    expect(client.getAdminPlayers).toHaveBeenCalledWith('1234')
    expect(screen.getByText("Masqué · 400 pts · à l'instant")).toBeTruthy()
  })

  it('forgets a wrong PIN and asks again, with a neutral message', async () => {
    render(<AdminScreen client={fakeClient()} />)
    await signIn('0000')
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Code incorrect.')
    expect(screen.getByLabelText('Code PIN')).toBeTruthy()
    expect(sessionStorage.length).toBe(0)
  })

  it('keeps the PIN for the session', async () => {
    const { unmount } = render(<AdminScreen client={fakeClient()} />)
    await signIn()
    await screen.findByText('Neo42')
    unmount()
    render(<AdminScreen client={fakeClient()} />)
    expect(await screen.findByText('Neo42')).toBeTruthy()
  })

  it('hides a player at once, before the server answers', async () => {
    let finish = () => {}
    const setHidden = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    const client = fakeClient({ setHidden })
    render(<AdminScreen client={client} />)
    await signIn()
    await userEvent.click(await screen.findByRole('button', { name: 'Masquer Neo42' }))
    expect(screen.getByRole('button', { name: 'Réafficher Neo42' })).toBeTruthy()
    expect(setHidden).toHaveBeenCalledWith('1234', 'Neo42', true)
    finish()
  })

  it('puts the player back when the server refuses', async () => {
    const client = fakeClient({ setHidden: vi.fn().mockRejectedValue(new Error('offline')) })
    render(<AdminScreen client={client} />)
    await signIn()
    await userEvent.click(await screen.findByRole('button', { name: 'Masquer Neo42' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Masquer Neo42' })).toBeTruthy())
    expect(screen.getByRole('alert').textContent).toBe('Action impossible, réessaie.')
  })

  it('filters by nickname', async () => {
    render(<AdminScreen client={fakeClient()} />)
    await signIn()
    await screen.findByText('Neo42')
    await userEvent.type(screen.getByLabelText('Rechercher un pseudo'), 'ne')
    expect(screen.getByText('Neo42')).toBeTruthy()
    expect(screen.queryByText('Zed')).toBeNull()
  })
})
