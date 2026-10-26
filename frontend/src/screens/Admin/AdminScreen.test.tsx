// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiRequestError, type AdminBugSummary, type AdminPlayer, type FullBug, type GameApi } from '../../api'
import AdminScreen from './AdminScreen'

const bugs: AdminBugSummary[] = [
  { id: 'dev-001', track: 'dev', difficulty: 0, title: 'Le total est faux', view: 'code' },
  { id: 'net-006', track: 'network', difficulty: 0, title: 'Plus de réseau', view: 'terminal' },
]
const fullBugs: Record<string, FullBug> = {
  'dev-001': {
    id: 'dev-001', track: 'dev', difficulty: 0, points: 100, title: 'Le total est faux',
    code: ['total = price - shipping', 'print(total)'], bugLine: 0,
    choices: ['total = price + shipping', 'total = price * 2', 'total = 0'], answer: 0, explanation: 'Il faut additionner.',
  },
  'net-006': {
    id: 'net-006', track: 'network', difficulty: 0, points: 100, view: 'terminal', title: 'Plus de réseau',
    code: ['$ ip link', 'eth0 : câble débranché'], bugLine: 1,
    choices: ['Rebrancher le câble', 'Redémarrer', 'Changer de box'], answer: 0, explanation: 'Le câble est débranché.',
  },
}

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
    getAdminBugs: vi.fn(async () => ({ bugs })),
    getAdminBug: vi.fn(async (_pin: string, id: string) => ({ bug: fullBugs[id] })),
    ...overrides,
  } as unknown as GameApi
}

async function signIn(pin = '1234') {
  await userEvent.type(screen.getByLabelText('Code PIN'), pin)
  await userEvent.click(screen.getByRole('button', { name: 'Valider' }))
}

beforeEach(() => {
  sessionStorage.clear()
  localStorage.setItem('bug-hunt:tutorial-seen', '1')
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

describe('AdminScreen bugs to test', () => {
  async function openBugs(client: GameApi) {
    render(<AdminScreen client={client} />)
    await signIn()
    await userEvent.click(await screen.findByRole('button', { name: 'Bugs' }))
  }

  it('lists every bug by track and level, with its style', async () => {
    const client = fakeClient()
    await openBugs(client)
    expect(await screen.findByRole('heading', { name: 'Dev · niveau 0' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'SR · niveau 0' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Jouer net-006 : Plus de réseau' }).textContent).toContain('Terminal')
    expect(client.getAdminBugs).toHaveBeenCalledWith('1234')
  })

  it('plays a bug in the real screens, without score, then goes to the next one', async () => {
    const client = fakeClient()
    await openBugs(client)
    await userEvent.click(await screen.findByRole('button', { name: 'Jouer dev-001 : Le total est faux' }))

    expect(await screen.findByRole('heading', { name: 'Le total est faux' })).toBeTruthy()
    expect(screen.getByText(/aucun score/i)).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /^Ligne 1/ }))
    await userEvent.click(await screen.findByRole('button', { name: /total = price \+ shipping/ }))
    expect(await screen.findByText('Il faut additionner.')).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Bug suivant' }))
    expect(await screen.findByRole('heading', { name: 'Plus de réseau' })).toBeTruthy()
    expect(client.getAdminBug).toHaveBeenLastCalledWith('1234', 'net-006')
  })

  it('goes back to the list', async () => {
    await openBugs(fakeClient())
    await userEvent.click(await screen.findByRole('button', { name: 'Jouer dev-001 : Le total est faux' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Retour à la liste' }))
    expect(await screen.findByRole('heading', { name: 'Dev · niveau 0' })).toBeTruthy()
  })
})
