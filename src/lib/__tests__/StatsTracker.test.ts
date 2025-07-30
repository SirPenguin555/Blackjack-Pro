/**
 * @vitest-environment jsdom
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { StatsTracker } from '../StatsTracker'
import { TableLevel } from '../tableSystem'
import { GameVariant } from '../ruleVariations'
import { GameAction } from '../../types/game'

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {}
  })
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => '2024-01-15'),
  startOfDay: vi.fn(() => new Date('2024-01-15T00:00:00.000Z')),
  isToday: vi.fn(() => true),
  subDays: vi.fn(() => new Date('2024-01-08T00:00:00.000Z'))
}))

describe('StatsTracker', () => {
  let statsTracker: StatsTracker

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    statsTracker = new StatsTracker()
  })

  describe('Basic Statistics Tracking', () => {
    test('should initialize with empty statistics', () => {
      const stats = statsTracker.getBasicStats()
      
      expect(stats).toEqual({
        handsPlayed: 0,
        roundsPlayed: 0,
        handsWon: 0,
        handsLost: 0,
        handsPushed: 0,
        blackjacks: 0,
        totalWinnings: 0,
        loansTaken: 0
      })
    })

    test('should track hand results correctly', () => {
      statsTracker.recordHandResult('win', 100, false)
      statsTracker.recordHandResult('loss', -50, false)
      statsTracker.recordHandResult('push', 0, false)
      statsTracker.recordHandResult('win', 150, true) // blackjack

      const stats = statsTracker.getBasicStats()
      
      expect(stats.handsPlayed).toBe(4)
      expect(stats.handsWon).toBe(2)
      expect(stats.handsLost).toBe(1)
      expect(stats.handsPushed).toBe(1)
      expect(stats.blackjacks).toBe(1)
      expect(stats.totalWinnings).toBe(200)
    })

    test('should track rounds played separately from hands', () => {
      statsTracker.recordRoundStart()
      statsTracker.recordHandResult('win', 100, false)
      
      // Split hand - same round, additional hand
      statsTracker.recordHandResult('loss', -50, false)
      
      const stats = statsTracker.getBasicStats()
      
      expect(stats.roundsPlayed).toBe(1)
      expect(stats.handsPlayed).toBe(2)
    })

    test('should track loans taken', () => {
      statsTracker.recordLoanTaken(1000)
      statsTracker.recordLoanTaken(500)

      const stats = statsTracker.getBasicStats()
      
      expect(stats.loansTaken).toBe(2)
    })
  })

  describe('Per-Table Statistics', () => {
    test('should track statistics per table level', () => {
      statsTracker.recordHandResult('win', 100, false, TableLevel.BEGINNER)
      statsTracker.recordHandResult('loss', -50, false, TableLevel.AMATEUR)
      statsTracker.recordHandResult('win', 200, true, TableLevel.BEGINNER)

      const beginnerStats = statsTracker.getTableStats(TableLevel.BEGINNER)
      const amateurStats = statsTracker.getTableStats(TableLevel.AMATEUR)

      expect(beginnerStats.handsPlayed).toBe(2)
      expect(beginnerStats.handsWon).toBe(2)
      expect(beginnerStats.blackjacks).toBe(1)
      expect(beginnerStats.totalWinnings).toBe(300)

      expect(amateurStats.handsPlayed).toBe(1)
      expect(amateurStats.handsLost).toBe(1)
      expect(amateurStats.totalWinnings).toBe(-50)
    })

    test('should return empty stats for table with no activity', () => {
      const stats = statsTracker.getTableStats(TableLevel.HIGH_ROLLER)
      
      expect(stats.handsPlayed).toBe(0)
      expect(stats.totalWinnings).toBe(0)
    })
  })

  describe('Per-Variant Statistics', () => {
    test('should track statistics per game variant', () => {
      statsTracker.recordHandResult('win', 100, false, TableLevel.BEGINNER, GameVariant.VEGAS)
      statsTracker.recordHandResult('loss', -50, false, TableLevel.BEGINNER, GameVariant.EUROPEAN)
      statsTracker.recordHandResult('win', 150, true, TableLevel.BEGINNER, GameVariant.VEGAS)

      const vegasStats = statsTracker.getVariantStats(GameVariant.VEGAS)
      const europeanStats = statsTracker.getVariantStats(GameVariant.EUROPEAN)

      expect(vegasStats.handsPlayed).toBe(2)
      expect(vegasStats.handsWon).toBe(2)
      expect(vegasStats.blackjacks).toBe(1)
      expect(vegasStats.totalWinnings).toBe(250)

      expect(europeanStats.handsPlayed).toBe(1)
      expect(europeanStats.handsLost).toBe(1)
      expect(europeanStats.totalWinnings).toBe(-50)
    })
  })

  describe('Strategy Accuracy Tracking', () => {
    test('should track strategy decisions correctly', () => {
      // Record optimal and suboptimal decisions
      statsTracker.recordStrategyDecision('hit', 'hit', true, 16, 10)
      statsTracker.recordStrategyDecision('stand', 'hit', false, 16, 10)
      statsTracker.recordStrategyDecision('double', 'double', true, 11, 6)

      const accuracy = statsTracker.getStrategyAccuracy()
      
      expect(accuracy.totalDecisions).toBe(3)
      expect(accuracy.optimalDecisions).toBe(2)
      expect(accuracy.accuracyPercentage).toBe(66.67)
    })

    test('should track strategy accuracy by action type', () => {
      statsTracker.recordStrategyDecision('hit', 'hit', true, 16, 10)
      statsTracker.recordStrategyDecision('hit', 'stand', false, 16, 10)
      statsTracker.recordStrategyDecision('stand', 'stand', true, 17, 10)
      statsTracker.recordStrategyDecision('double', 'hit', false, 11, 6)

      const accuracy = statsTracker.getStrategyAccuracy()
      
      expect(accuracy.byAction.hit.total).toBe(3) // 2 hit decisions + 1 should-have-been-hit
      expect(accuracy.byAction.hit.optimal).toBe(1)
      expect(accuracy.byAction.stand.total).toBe(2)
      expect(accuracy.byAction.stand.optimal).toBe(1)
      expect(accuracy.byAction.double.total).toBe(1)
      expect(accuracy.byAction.double.optimal).toBe(0)
    })

    test('should track strategy accuracy by hand total', () => {
      statsTracker.recordStrategyDecision('hit', 'hit', true, 16, 10)
      statsTracker.recordStrategyDecision('stand', 'hit', false, 16, 10)
      statsTracker.recordStrategyDecision('stand', 'stand', true, 17, 10)

      const accuracy = statsTracker.getStrategyAccuracy()
      
      expect(accuracy.byHandTotal[16].total).toBe(2)
      expect(accuracy.byHandTotal[16].optimal).toBe(1)
      expect(accuracy.byHandTotal[17].total).toBe(1)
      expect(accuracy.byHandTotal[17].optimal).toBe(1)
    })
  })

  describe('Performance Monitoring', () => {
    test('should track session performance', () => {
      const sessionId = statsTracker.startSession(TableLevel.BEGINNER, GameVariant.VEGAS)
      
      statsTracker.recordHandResult('win', 100, false)
      statsTracker.recordHandResult('loss', -50, false)
      
      const session = statsTracker.getCurrentSession()
      
      expect(session).toBeDefined()
      expect(session!.id).toBe(sessionId)
      expect(session!.tableLevel).toBe(TableLevel.BEGINNER)
      expect(session!.variant).toBe(GameVariant.VEGAS)
      expect(session!.handsPlayed).toBe(2)
      expect(session!.netWinnings).toBe(50)
    })

    test('should end session and calculate duration', () => {
      const sessionId = statsTracker.startSession(TableLevel.BEGINNER, GameVariant.VEGAS)
      
      // Mock Date.now to simulate time passage
      const originalNow = Date.now
      Date.now = vi.fn(() => originalNow() + 60000) // 1 minute later
      
      const endedSession = statsTracker.endSession()
      
      expect(endedSession).toBeDefined()
      expect(endedSession!.duration).toBe(60000)
      expect(statsTracker.getCurrentSession()).toBeNull()
      
      Date.now = originalNow
    })

    test('should track win rate trends over time', () => {
      // Record games across multiple days
      statsTracker.recordHandResult('win', 100, false)
      statsTracker.recordHandResult('win', 100, false)
      statsTracker.recordHandResult('loss', -50, false)

      const trends = statsTracker.getPerformanceTrends(7)
      
      // Find today's entry in the trends (it should exist)
      const todayTrend = trends.find(trend => trend.date === '2024-01-15')
      expect(todayTrend).toBeDefined()
      expect(todayTrend!.winRate).toBe(66.67)
      expect(todayTrend!.handsPlayed).toBe(3)
    })
  })

  describe('Persistence', () => {
    test('should save statistics to localStorage', () => {
      statsTracker.recordHandResult('win', 100, false)
      statsTracker.recordLoanTaken(500)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'blackjack_statistics',
        expect.stringContaining('"handsPlayed":1')
      )
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'blackjack_statistics',
        expect.stringContaining('"loansTaken":1')
      )
    })

    test('should load statistics from localStorage', () => {
      const savedStats = {
        basic: {
          handsPlayed: 10,
          roundsPlayed: 8,
          handsWon: 6,
          handsLost: 3,
          handsPushed: 1,
          blackjacks: 2,
          totalWinnings: 500,
          loansTaken: 1
        },
        tables: {},
        variants: {},
        strategy: {
          totalDecisions: 0,
          optimalDecisions: 0,
          byAction: {},
          byHandTotal: {}
        },
        sessions: [],
        dailyStats: {}
      }
      
      mockLocalStorage.store['blackjack_statistics'] = JSON.stringify(savedStats)
      
      const newTracker = new StatsTracker()
      const stats = newTracker.getBasicStats()
      
      expect(stats.handsPlayed).toBe(10)
      expect(stats.handsWon).toBe(6)
      expect(stats.totalWinnings).toBe(500)
    })

    test('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.store['blackjack_statistics'] = 'invalid json'
      
      const newTracker = new StatsTracker()
      const stats = newTracker.getBasicStats()
      
      expect(stats.handsPlayed).toBe(0) // Should reset to defaults
    })
  })

  describe('Advanced Statistics', () => {
    test('should calculate win rate correctly', () => {
      statsTracker.recordHandResult('win', 100, false)
      statsTracker.recordHandResult('win', 100, false)
      statsTracker.recordHandResult('loss', -50, false)
      statsTracker.recordHandResult('push', 0, false)

      const winRate = statsTracker.getWinRate()
      
      expect(winRate).toBe(50) // 2 wins out of 4 hands = 50%
    })

    test('should calculate average bet size', () => {
      statsTracker.recordHandResult('win', 100, false) // bet was 100 for win
      statsTracker.recordHandResult('loss', -50, false) // bet was 50
      statsTracker.recordHandResult('win', 150, true) // blackjack: bet was 150

      const avgBet = statsTracker.getAverageBetSize()
      
      // Average bet size calculation is approximate, based on total winnings/results
      // Total winnings: 100 + (-50) + 150 = 200, 3 hands = 200/3 ≈ 66.67
      expect(avgBet).toBeCloseTo(66.67)
    })

    test('should calculate return on investment', () => {
      // Simulate starting with 1000 chips, betting 100 each hand
      const initialBankroll = 1000
      statsTracker.recordHandResult('win', 100, false) // +100, bet 100
      statsTracker.recordHandResult('loss', -50, false)  // -50, bet 50
      statsTracker.recordHandResult('win', 150, true)   // +150, bet 60 (blackjack)

      const roi = statsTracker.getReturnOnInvestment(initialBankroll)
      
      expect(roi).toBeCloseTo(20) // (200 winnings / 1000 initial) * 100 = 20%
    })

    test('should get statistics summary', () => {
      statsTracker.recordRoundStart()
      statsTracker.recordHandResult('win', 100, false)
      statsTracker.recordHandResult('win', 150, true)
      statsTracker.recordLoanTaken(500)
      statsTracker.recordStrategyDecision('hit', 'hit', true, 16, 10)

      const summary = statsTracker.getStatisticsSummary()
      
      expect(summary.basic.handsPlayed).toBe(2)
      expect(summary.basic.blackjacks).toBe(1)
      expect(summary.winRate).toBe(100)
      expect(summary.averageBetSize).toBeGreaterThan(0)
      expect(summary.strategyAccuracy.accuracyPercentage).toBe(100)
    })
  })

  describe('Data Export/Import', () => {
    test('should export statistics data', () => {
      statsTracker.recordHandResult('win', 100, false)
      statsTracker.recordLoanTaken(500)

      const exportData = statsTracker.exportData()
      
      expect(exportData).toContain('handsPlayed')
      expect(exportData).toContain('loansTaken')
      
      // Should be valid JSON
      const parsed = JSON.parse(exportData)
      expect(parsed.basic.handsPlayed).toBe(1)
      expect(parsed.basic.loansTaken).toBe(1)
    })

    test('should import statistics data', () => {
      const importData = {
        basic: {
          handsPlayed: 15,
          roundsPlayed: 12,
          handsWon: 8,
          handsLost: 6,
          handsPushed: 1,
          blackjacks: 3,
          totalWinnings: 750,
          loansTaken: 2
        },
        tables: {},
        variants: {},
        strategy: {
          totalDecisions: 10,
          optimalDecisions: 8,
          byAction: {},
          byHandTotal: {}
        },
        sessions: [],
        dailyStats: {}
      }

      const success = statsTracker.importData(JSON.stringify(importData))
      
      expect(success).toBe(true)
      
      const stats = statsTracker.getBasicStats()
      expect(stats.handsPlayed).toBe(15)
      expect(stats.totalWinnings).toBe(750)
    })

    test('should handle invalid import data', () => {
      const success = statsTracker.importData('invalid json')
      
      expect(success).toBe(false)
      
      // Stats should remain unchanged
      const stats = statsTracker.getBasicStats()
      expect(stats.handsPlayed).toBe(0)
    })
  })

  describe('Reset Functionality', () => {
    test('should reset all statistics', () => {
      statsTracker.recordHandResult('win', 100, false)
      statsTracker.recordLoanTaken(500)
      statsTracker.recordStrategyDecision('hit', 'hit', true, 16, 10)

      statsTracker.resetAllStats()

      const stats = statsTracker.getBasicStats()
      const accuracy = statsTracker.getStrategyAccuracy()
      
      expect(stats.handsPlayed).toBe(0)
      expect(stats.loansTaken).toBe(0)
      expect(accuracy.totalDecisions).toBe(0)
    })

    test('should reset table-specific statistics', () => {
      statsTracker.recordHandResult('win', 100, false, TableLevel.BEGINNER)
      statsTracker.recordHandResult('win', 200, false, TableLevel.AMATEUR)

      statsTracker.resetTableStats(TableLevel.BEGINNER)

      const beginnerStats = statsTracker.getTableStats(TableLevel.BEGINNER)
      const amateurStats = statsTracker.getTableStats(TableLevel.AMATEUR)
      
      expect(beginnerStats.handsPlayed).toBe(0)
      expect(amateurStats.handsPlayed).toBe(1) // Should remain unchanged
    })
  })
})