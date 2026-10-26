import { describe, expect, it } from 'vitest'
import type { FullDiagramBug, FullLineBug } from '../api'
import { createTestBugClient, TEST_SESSION } from './testBugClient'

const lines: FullLineBug = {
  id: 'net-006', track: 'network', difficulty: 2, points: 300, view: 'terminal', title: 'Plus de réseau', hint: 'Regarde le câble.',
  code: ['$ ip link', 'eth0 : câble débranché'], bugLine: 1,
  choices: ['Rebrancher le câble', 'Redémarrer', 'Changer de box'], answer: 0, explanation: 'Le câble est débranché.',
}

const diagram: FullDiagramBug = {
  id: 'net-001', track: 'network', difficulty: 0, points: 100, title: 'Imprimante perdue',
  diagram: { devices: [{ id: 'pc', label: 'PC' }, { id: 'printer', label: 'Imprimante' }], links: [['pc', 'printer']] },
  bugTarget: 'printer', choices: ['a', 'b', 'c'], answer: 2, explanation: 'Même réseau.',
}

describe('testBugClient', () => {
  it('serves the bug once, as a player sees it, without its answer', async () => {
    const client = createTestBugClient(lines)
    const next = await client.nextBug(TEST_SESSION)
    expect(next).toMatchObject({ index: 0, timeLimit: 60, remainingSeconds: 60 })
    expect(next!.bug).toMatchObject({ id: 'net-006', view: 'terminal', code: lines.code, hint: 'Regarde le câble.' })
    for (const secret of ['bugLine', 'answer', 'explanation']) expect(next!.bug).not.toHaveProperty(secret)

    await client.select(TEST_SESSION, { bugId: 'net-006', selectedLine: 1 })
    await client.answer(TEST_SESSION, { bugId: 'net-006', choice: 0 })
    expect(await client.nextBug(TEST_SESSION)).toBeNull()
  })

  it('checks the line, then scores the fix like a game', async () => {
    const client = createTestBugClient(lines)
    await client.nextBug(TEST_SESSION)
    expect(await client.select(TEST_SESSION, { bugId: 'net-006', selectedLine: 0 })).toEqual({ lineCorrect: false, correctLine: 1 })
    await expect(client.select(TEST_SESSION, { bugId: 'net-006', selectedLine: 1 })).rejects.toMatchObject({ code: 'already_selected' })

    // Wrong line, right fix: half the points. Not "finished": the feedback offers the next bug.
    expect(await client.answer(TEST_SESSION, { bugId: 'net-006', choice: 0 })).toEqual({
      correct: true, correctChoice: 0, points: 150, explanation: 'Le câble est débranché.', score: 150, finished: false,
    })
  })

  it('checks a device of a diagram, and scores a timeout 0', async () => {
    const client = createTestBugClient(diagram)
    await client.nextBug(TEST_SESSION)
    expect(await client.select(TEST_SESSION, { bugId: 'net-001', selectedTarget: 'printer' })).toEqual({ lineCorrect: true, correctTarget: 'printer' })
    expect(await createTestBugClient(diagram).answer(TEST_SESSION, { bugId: 'net-001', choice: null })).toMatchObject({ correct: false, points: 0, correctChoice: 2 })
  })

  it('keeps nothing: no result, no leaderboard', async () => {
    const client = createTestBugClient(lines)
    await expect(client.getResult(TEST_SESSION)).rejects.toThrow()
    await expect(client.getLeaderboard()).rejects.toThrow()
  })
})
