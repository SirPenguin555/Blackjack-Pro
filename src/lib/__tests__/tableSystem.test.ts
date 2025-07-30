import { describe, it, expect, beforeEach } from 'vitest'
import { TableLevel, TableConfiguration, TableRequirements } from '../tableSystem'
import { TableUnlockService } from '../tableUnlockService'
import { GameStats } from '../../types/game'

describe('Table System', () => {
  describe('TableLevel enum', () => {
    it('should have all expected table levels', () => {
      expect(TableLevel.BEGINNER).toBe('beginner')
      expect(TableLevel.AMATEUR).toBe('amateur')
      expect(TableLevel.INTERMEDIATE).toBe('intermediate')
      expect(TableLevel.ADVANCED).toBe('advanced')
      expect(TableLevel.PROFESSIONAL).toBe('professional')
      expect(TableLevel.HIGH_ROLLER).toBe('high_roller')
    })
  })

  describe('TableConfiguration', () => {
    it('should contain proper configuration structure for beginner table', () => {
      const config: TableConfiguration = {
        level: TableLevel.BEGINNER,
        name: 'Beginner Table',
        description: 'Perfect for learning the basics',
        minBet: 5,
        maxBet: 100,
        buyInMin: 50,
        buyInMax: 500,
        theme: 'classic',
        unlockRequirements: {
          minimumChips: 0,
          handsPlayed: 0,
          winRate: 0
        }
      }

      expect(config.level).toBe(TableLevel.BEGINNER)
      expect(config.name).toBe('Beginner Table')
      expect(config.minBet).toBe(5)
      expect(config.maxBet).toBe(100)
      expect(config.buyInMin).toBe(50)
      expect(config.buyInMax).toBe(500)
      expect(config.theme).toBe('classic')
      expect(config.unlockRequirements.minimumChips).toBe(0)
    })

    it('should contain proper configuration structure for high roller table', () => {
      const config: TableConfiguration = {
        level: TableLevel.HIGH_ROLLER,
        name: 'High Roller VIP',
        description: 'For the most experienced players',
        minBet: 500,
        maxBet: 10000,
        buyInMin: 5000,
        buyInMax: 50000,
        theme: 'luxury',
        unlockRequirements: {
          minimumChips: 25000,
          handsPlayed: 500,
          winRate: 45
        }
      }

      expect(config.level).toBe(TableLevel.HIGH_ROLLER)
      expect(config.minBet).toBe(500)
      expect(config.maxBet).toBe(10000)
      expect(config.unlockRequirements.minimumChips).toBe(25000)
      expect(config.unlockRequirements.handsPlayed).toBe(500)
      expect(config.unlockRequirements.winRate).toBe(45)
    })
  })

  describe('TableRequirements', () => {
    it('should validate requirement structure', () => {
      const requirements: TableRequirements = {
        minimumChips: 1000,
        handsPlayed: 50,
        winRate: 40
      }

      expect(requirements.minimumChips).toBe(1000)
      expect(requirements.handsPlayed).toBe(50)
      expect(requirements.winRate).toBe(40)
    })

    it('should allow zero requirements for beginner level', () => {
      const requirements: TableRequirements = {
        minimumChips: 0,
        handsPlayed: 0,
        winRate: 0
      }

      expect(requirements.minimumChips).toBe(0)
      expect(requirements.handsPlayed).toBe(0)
      expect(requirements.winRate).toBe(0)
    })
  })
})

describe('TableUnlockService', () => {
  let unlockService: TableUnlockService
  let mockStats: GameStats

  beforeEach(() => {
    unlockService = new TableUnlockService()
    mockStats = {
      handsPlayed: 0,
      roundsPlayed: 0,
      handsWon: 0,
      handsLost: 0,
      handsPushed: 0,
      blackjacks: 0,
      totalWinnings: 0,
      loansTaken: 0
    }
  })

  describe('Table Unlock Validation', () => {
    it('should allow beginner table access with no requirements', () => {
      const playerChips = 50
      const canUnlock = unlockService.canUnlockTable(TableLevel.BEGINNER, playerChips, mockStats)
      
      expect(canUnlock).toBe(true)
    })

    it('should deny amateur table access without sufficient chips', () => {
      const playerChips = 100 // Below amateur requirement
      mockStats.handsPlayed = 25
      const winRate = unlockService.calculateWinRate(mockStats)
      
      const canUnlock = unlockService.canUnlockTable(TableLevel.AMATEUR, playerChips, mockStats)
      
      expect(canUnlock).toBe(false)
    })

    it('should allow amateur table access with sufficient requirements', () => {
      const playerChips = 500 // Above amateur requirement
      mockStats.handsPlayed = 25
      mockStats.handsWon = 15 // 60% win rate
      
      const canUnlock = unlockService.canUnlockTable(TableLevel.AMATEUR, playerChips, mockStats)
      
      expect(canUnlock).toBe(true)
    })

    it('should deny intermediate table access without sufficient hands played', () => {
      const playerChips = 2000
      mockStats.handsPlayed = 40 // Below intermediate requirement of 50
      mockStats.handsWon = 30 // 75% win rate (high enough)
      
      const canUnlock = unlockService.canUnlockTable(TableLevel.INTERMEDIATE, playerChips, mockStats)
      
      expect(canUnlock).toBe(false)
    })

    it('should deny high roller table access without sufficient win rate', () => {
      const playerChips = 30000
      mockStats.handsPlayed = 600
      mockStats.handsWon = 240 // 40% win rate (below 45% requirement)
      
      const canUnlock = unlockService.canUnlockTable(TableLevel.HIGH_ROLLER, playerChips, mockStats)
      
      expect(canUnlock).toBe(false)
    })

    it('should allow high roller table access with all requirements met', () => {
      const playerChips = 30000
      mockStats.handsPlayed = 600
      mockStats.handsWon = 300 // 50% win rate (above 45% requirement)
      
      const canUnlock = unlockService.canUnlockTable(TableLevel.HIGH_ROLLER, playerChips, mockStats)
      
      expect(canUnlock).toBe(true)
    })
  })

  describe('Win Rate Calculation', () => {
    it('should calculate win rate correctly', () => {
      mockStats.handsPlayed = 100
      mockStats.handsWon = 45
      
      const winRate = unlockService.calculateWinRate(mockStats)
      
      expect(winRate).toBe(45)
    })

    it('should return 0 win rate when no hands played', () => {
      mockStats.handsPlayed = 0
      mockStats.handsWon = 0
      
      const winRate = unlockService.calculateWinRate(mockStats)
      
      expect(winRate).toBe(0)
    })

    it('should handle decimal win rates correctly', () => {
      mockStats.handsPlayed = 7
      mockStats.handsWon = 5 // 71.43% win rate
      
      const winRate = unlockService.calculateWinRate(mockStats)
      
      expect(winRate).toBeCloseTo(71.43, 1)
    })
  })

  describe('Available Tables', () => {
    it('should return only beginner table for new player', () => {
      const playerChips = 50
      const availableTables = unlockService.getAvailableTables(playerChips, mockStats)
      
      expect(availableTables).toHaveLength(1)
      expect(availableTables[0].level).toBe(TableLevel.BEGINNER)
    })

    it('should return multiple tables for experienced player', () => {
      const playerChips = 5000
      mockStats.handsPlayed = 100
      mockStats.handsWon = 50 // 50% win rate
      
      const availableTables = unlockService.getAvailableTables(playerChips, mockStats)
      
      expect(availableTables.length).toBeGreaterThan(1)
      expect(availableTables.some(table => table.level === TableLevel.BEGINNER)).toBe(true)
      expect(availableTables.some(table => table.level === TableLevel.AMATEUR)).toBe(true)
      expect(availableTables.some(table => table.level === TableLevel.INTERMEDIATE)).toBe(true)
    })

    it('should return all tables for high-end player', () => {
      const playerChips = 50000
      mockStats.handsPlayed = 1000
      mockStats.handsWon = 500 // 50% win rate
      
      const availableTables = unlockService.getAvailableTables(playerChips, mockStats)
      
      expect(availableTables).toHaveLength(6) // All table levels
    })
  })

  describe('Next Unlock Information', () => {
    it('should provide next unlock information for new player', () => {
      const playerChips = 100
      const nextUnlock = unlockService.getNextUnlockInfo(playerChips, mockStats)
      
      expect(nextUnlock).toBeDefined()
      expect(nextUnlock?.level).toBe(TableLevel.AMATEUR)
      expect(nextUnlock?.missingRequirements.chips).toBeGreaterThan(0)
      expect(nextUnlock?.missingRequirements.hands).toBeGreaterThan(0)
    })

    it('should return null when all tables are unlocked', () => {
      const playerChips = 50000
      mockStats.handsPlayed = 1000
      mockStats.handsWon = 500 // 50% win rate
      
      const nextUnlock = unlockService.getNextUnlockInfo(playerChips, mockStats)
      
      expect(nextUnlock).toBeNull()
    })

    it('should correctly identify missing requirements', () => {
      const playerChips = 400 // Below amateur requirement of 500
      mockStats.handsPlayed = 20 // Below amateur requirement of 25
      mockStats.handsWon = 10 // 50% win rate (above 40% requirement)
      
      const nextUnlock = unlockService.getNextUnlockInfo(playerChips, mockStats)
      
      expect(nextUnlock?.missingRequirements.chips).toBe(100) // 500 - 400
      expect(nextUnlock?.missingRequirements.hands).toBe(5) // 25 - 20
      expect(nextUnlock?.missingRequirements.winRate).toBe(0) // Already met
    })
  })
})