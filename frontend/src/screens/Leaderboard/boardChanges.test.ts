import { describe, expect, it } from 'vitest'
import type { Leaderboard } from '../../api'
import { compareBoards } from './boardChanges'

function board(...players: [string, number][]): Leaderboard {
  return {
    top: players.map(([pseudo, score], i) => ({ rank: i + 1, pseudo, score, affinity: 'dev', byTrack: { dev: score, network: 0 } })),
    gauges: { dev: 0, network: 0 },
    gamesPlayed: players.length,
  }
}

describe('compareBoards', () => {
  it('sees nothing on the first load', () => {
    expect(compareBoards(null, board(['Neo', 900]))).toEqual({ moved: [], record: null })
  })

  it('sees a nickname entering the top', () => {
    const changes = compareBoards(board(['Neo', 900]), board(['Neo', 900], ['Lyra', 500]))
    expect(changes.moved).toEqual(['Lyra'])
    expect(changes.record).toBeNull()
  })

  it('sees a nickname climbing, not the ones it passed', () => {
    const changes = compareBoards(board(['Neo', 900], ['Lyra', 500], ['Zed', 400]), board(['Neo', 900], ['Zed', 600], ['Lyra', 500]))
    expect(changes.moved).toEqual(['Zed'])
  })

  it('celebrates a new record, by someone else or by the holder', () => {
    expect(compareBoards(board(['Neo', 900]), board(['Lyra', 1200], ['Neo', 900])).record?.pseudo).toBe('Lyra')
    expect(compareBoards(board(['Neo', 900]), board(['Neo', 1000])).record?.score).toBe(1000)
  })

  it('celebrates the very first player of the day', () => {
    expect(compareBoards(board(), board(['Neo', 300])).record?.pseudo).toBe('Neo')
  })

  it('does not celebrate a tie or a hidden record holder', () => {
    expect(compareBoards(board(['Neo', 900]), board(['Neo', 900], ['Lyra', 900])).record).toBeNull()
    expect(compareBoards(board(['Neo', 900], ['Lyra', 500]), board(['Lyra', 500])).record).toBeNull()
  })
})
