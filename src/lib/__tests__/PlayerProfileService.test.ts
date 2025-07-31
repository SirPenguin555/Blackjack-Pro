/**
 * Tests for PlayerProfileService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PlayerProfileService } from '../PlayerProfileService'
import { TableLevel, GameVariant } from '@/types/game'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

vi.stubGlobal('localStorage', localStorageMock)

describe('PlayerProfileService', () => {
  let service: PlayerProfileService
  
  beforeEach(() => {
    service = new PlayerProfileService()
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('loadProfile', () => {
    it('should return default profile when no saved data exists', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const profile = service.loadProfile()
      
      expect(profile.chips).toBe(250)
      expect(profile.currentTableLevel).toBe(TableLevel.BEGINNER)
      expect(profile.currentGameVariant).toBe(GameVariant.VEGAS)
      expect(profile.stats.handsPlayed).toBe(0)
      expect(profile.unlockedTables).toEqual([TableLevel.BEGINNER])
      expect(profile.unlockedVariants).toEqual([GameVariant.VEGAS])
    })

    it('should load saved profile data', () => {
      const savedData = {
        version: '1.0.0',
        profile: {
          stats: {
            handsPlayed: 100,
            roundsPlayed: 50,
            handsWon: 45,
            handsLost: 35,
            handsPushed: 20,
            blackjacks: 8,
            totalWinnings: 150,
            loansTaken: 2
          },
          chips: 500,
          currentTableLevel: TableLevel.AMATEUR,
          currentGameVariant: GameVariant.EUROPEAN,
          unlockedTables: [TableLevel.BEGINNER, TableLevel.AMATEUR],
          unlockedVariants: [GameVariant.VEGAS, GameVariant.EUROPEAN],
          createdAt: '2023-01-01T00:00:00.000Z',
          lastSaved: '2023-01-02T00:00:00.000Z',
          version: '1.0.0'
        }
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData))
      
      const profile = service.loadProfile()
      
      expect(profile.chips).toBe(500)
      expect(profile.currentTableLevel).toBe(TableLevel.AMATEUR)
      expect(profile.currentGameVariant).toBe(GameVariant.EUROPEAN)
      expect(profile.stats.handsPlayed).toBe(100)
      expect(profile.stats.totalWinnings).toBe(150)
    })

    it('should handle corrupted save data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      
      const profile = service.loadProfile()
      
      // Should return default profile when save data is corrupted
      expect(profile.chips).toBe(250)
      expect(profile.currentTableLevel).toBe(TableLevel.BEGINNER)
    })
  })

  describe('saveProfile', () => {
    it('should save profile to localStorage', () => {
      const profile = service.loadProfile()
      profile.chips = 1000
      profile.stats.handsPlayed = 50
      
      service.saveProfile(profile)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'blackjack-player-profile',
        expect.stringContaining('"chips":1000')
      )
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'blackjack-player-profile',
        expect.stringContaining('"handsPlayed":50')
      )
    })

    it('should update lastSaved timestamp', () => {
      const profile = service.loadProfile()
      const originalLastSaved = profile.lastSaved
      
      // Wait a moment to ensure timestamp difference
      vi.useFakeTimers()
      vi.advanceTimersByTime(1000)
      
      service.saveProfile(profile)
      
      const savedCall = localStorageMock.setItem.mock.calls[0]
      const savedData = JSON.parse(savedCall[1])
      expect(savedData.profile.lastSaved).not.toBe(originalLastSaved)
      
      vi.useRealTimers()
    })
  })

  describe('updateProfile', () => {
    it('should update specific profile fields', () => {
      localStorageMock.getItem.mockReturnValue(null) // Start with default
      
      const updatedProfile = service.updateProfile({
        chips: 750,
        currentTableLevel: TableLevel.INTERMEDIATE
      })
      
      expect(updatedProfile.chips).toBe(750)
      expect(updatedProfile.currentTableLevel).toBe(TableLevel.INTERMEDIATE)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })

  describe('updateStats', () => {
    it('should update only stats', () => {
      const newStats = {
        handsPlayed: 200,
        roundsPlayed: 100,
        handsWon: 90,
        handsLost: 70,
        handsPushed: 40,
        blackjacks: 15,
        totalWinnings: 300,
        loansTaken: 1
      }
      
      service.updateStats(newStats)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'blackjack-player-profile',
        expect.stringContaining('"handsPlayed":200')
      )
    })
  })

  describe('updateChips', () => {
    it('should update only chip amount', () => {
      service.updateChips(1500)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'blackjack-player-profile',
        expect.stringContaining('"chips":1500')
      )
    })
  })

  describe('unlock methods', () => {
    beforeEach(() => {
      // Start with default profile
      localStorageMock.getItem.mockReturnValue(null)
    })

    it('should unlock new table', () => {
      service.unlockTable(TableLevel.AMATEUR)
      
      const savedCall = localStorageMock.setItem.mock.calls[0]
      const savedData = JSON.parse(savedCall[1])
      expect(savedData.profile.unlockedTables).toContain(TableLevel.AMATEUR)
    })

    it('should not duplicate unlocked tables', () => {
      service.unlockTable(TableLevel.BEGINNER) // Already unlocked by default
      
      // Should not save since table already unlocked
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('should unlock new variant', () => {
      service.unlockVariant(GameVariant.EUROPEAN)
      
      const savedCall = localStorageMock.setItem.mock.calls[0]
      const savedData = JSON.parse(savedCall[1])
      expect(savedData.profile.unlockedVariants).toContain(GameVariant.EUROPEAN)
    })

    it('should check if table is unlocked', () => {
      expect(service.isTableUnlocked(TableLevel.BEGINNER)).toBe(true)
      expect(service.isTableUnlocked(TableLevel.PROFESSIONAL)).toBe(false)
    })

    it('should check if variant is unlocked', () => {
      expect(service.isVariantUnlocked(GameVariant.VEGAS)).toBe(true)
      expect(service.isVariantUnlocked(GameVariant.EUROPEAN)).toBe(false)
    })
  })

  describe('resetProfile', () => {
    it('should reset to default profile', () => {
      const resetProfile = service.resetProfile()
      
      expect(resetProfile.chips).toBe(250)
      expect(resetProfile.stats.handsPlayed).toBe(0)
      expect(resetProfile.currentTableLevel).toBe(TableLevel.BEGINNER)
      expect(resetProfile.unlockedTables).toEqual([TableLevel.BEGINNER])
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })

  describe('export/import', () => {
    it('should export profile as JSON string', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const exportedData = service.exportProfile()
      const parsed = JSON.parse(exportedData)
      
      expect(parsed.profile).toBeDefined()
      expect(parsed.exportedAt).toBeDefined()
      expect(parsed.version).toBe('1.0.0')
    })

    it('should import valid profile data', () => {
      const importData = {
        profile: {
          chips: 2000,
          stats: {
            handsPlayed: 500,
            roundsPlayed: 250,
            handsWon: 225,
            handsLost: 175,
            handsPushed: 100,
            blackjacks: 40,
            totalWinnings: 1000,
            loansTaken: 0
          },
          currentTableLevel: TableLevel.ADVANCED,
          currentGameVariant: GameVariant.ATLANTIC_CITY,
          unlockedTables: [TableLevel.BEGINNER, TableLevel.AMATEUR, TableLevel.INTERMEDIATE, TableLevel.ADVANCED],
          unlockedVariants: [GameVariant.VEGAS, GameVariant.EUROPEAN, GameVariant.ATLANTIC_CITY],
          createdAt: '2023-01-01T00:00:00.000Z',
          lastSaved: '2023-01-15T00:00:00.000Z',
          version: '1.0.0'
        },
        version: '1.0.0'
      }
      
      const success = service.importProfile(JSON.stringify(importData))
      
      expect(success).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should reject invalid import data', () => {
      const success = service.importProfile('invalid json')
      
      expect(success).toBe(false)
    })
  })

  describe('utility methods', () => {
    it('should calculate storage size', () => {
      localStorageMock.getItem.mockReturnValue('{"test": "data"}')
      
      const size = service.getStorageSize()
      
      expect(size).toBeGreaterThan(0)
    })

    it('should clear profile', () => {
      service.clearProfile()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('blackjack-player-profile')
    })
  })

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const service1 = new PlayerProfileService()
      const service2 = new PlayerProfileService()
      
      expect(service1).toBe(service2)
    })
  })
})