// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createSoundPlayer } from './player'
import SoundToggle from './SoundToggle'

describe('SoundToggle', () => {
  it('mutes, then turns the sound back on', async () => {
    localStorage.clear()
    const player = createSoundPlayer({ createContext: () => null })
    render(<SoundToggle player={player} />)
    await userEvent.click(screen.getByRole('button', { name: 'Couper le son' }))
    expect(player.isMuted()).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Remettre le son' }))
    expect(player.isMuted()).toBe(false)
  })
})
