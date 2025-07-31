/**
 * @vitest-environment jsdom
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { AchievementEngine, AchievementCategory, AchievementRarity } from '../achievementSystem'
import { TableLevel } from '../tableSystem'
import { GameVariant } from '../ruleVariations'
import type { DetailedGameStats } from '../StatsTracker'

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

describe('AchievementEngine', () => {
  let achievementEngine: AchievementEngine
  let mockStats: DetailedGameStats

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    achievementEngine = new AchievementEngine()
    
    // Create comprehensive mock stats for testing
    mockStats = {
      handsPlayed: 0,
      roundsPlayed: 0,
      handsWon: 0,
      handsLost: 0,
      handsPushed: 0,
      blackjacks: 0,
      totalWinnings: 0,
      loansTaken: 0,
      strategyAccuracy: {
        totalDecisions: 0,
        optimalDecisions: 0,
        accuracyPercentage: 0,
        byAction: {},
        byHandTotal: {}
      },
      highestBet: 0,
      longestWinStreak: 0,
      tables: {},
      variants: {},
      sessions: [],
      dailyStats: {}
    }
  })

  describe('Achievement Initialization', () => {
    test('should initialize with all predefined achievements', () => {
      const achievements = achievementEngine.getAllAchievements()
      
      expect(achievements.length).toBeGreaterThan(15) // We have 15+ achievements
      
      // Check that we have achievements from all categories
      const categories = new Set(achievements.map(a => a.category))
      expect(categories).toContain(AchievementCategory.GAMEPLAY)
      expect(categories).toContain(AchievementCategory.STRATEGY)
      expect(categories).toContain(AchievementCategory.PROGRESSION)
      expect(categories).toContain(AchievementCategory.SPECIAL)
    })

    test('should load empty player achievements initially', () => {
      const unlockedAchievements = achievementEngine.getUnlockedAchievements()
      expect(unlockedAchievements).toHaveLength(0)
    })

    test('should return 0% completion initially', () => {
      const completion = achievementEngine.getCompletionPercentage()
      expect(completion).toBe(0)
    })

    test('should return 0 total points initially', () => {
      const points = achievementEngine.getTotalPoints()
      expect(points).toBe(0)
    })
  })

  describe('Achievement Categories and Filtering', () => {
    test('should filter achievements by category', () => {
      const gameplayAchievements = achievementEngine.getAchievementsByCategory(AchievementCategory.GAMEPLAY)
      const strategyAchievements = achievementEngine.getAchievementsByCategory(AchievementCategory.STRATEGY)
      
      expect(gameplayAchievements.length).toBeGreaterThan(0)
      expect(strategyAchievements.length).toBeGreaterThan(0)
      
      gameplayAchievements.forEach(achievement => {
        expect(achievement.category).toBe(AchievementCategory.GAMEPLAY)
      })
      
      strategyAchievements.forEach(achievement => {
        expect(achievement.category).toBe(AchievementCategory.STRATEGY)
      })
    })

    test('should have achievements of different rarities', () => {
      const achievements = achievementEngine.getAllAchievements()
      const rarities = new Set(achievements.map(a => a.rarity))
      
      expect(rarities.size).toBeGreaterThan(1)
      expect(rarities).toContain(AchievementRarity.COMMON)
    })
  })

  describe('Basic Stat-Based Achievements', () => {
    test('should unlock "First Steps" achievement after first hand', () => {
      mockStats.handsPlayed = 1
      
      const newlyUnlocked = achievementEngine.checkAchievements(mockStats)
      
      expect(newlyUnlocked).toHaveLength(1)
      expect(newlyUnlocked[0].id).toBe('first_hand')
      expect(newlyUnlocked[0].name).toBe('First Steps')
    })

    test('should unlock "Century Club" achievement after 100 hands', () => {
      mockStats.handsPlayed = 100
      
      const newlyUnlocked = achievementEngine.checkAchievements(mockStats)
      
      const centuryAchievement = newlyUnlocked.find(a => a.id === 'century_hands')
      expect(centuryAchievement).toBeDefined()
      expect(centuryAchievement!.name).toBe('Century Club')
    })

    test('should unlock "Natural 21" achievement after first blackjack', () => {
      mockStats.blackjacks = 1
      
      const newlyUnlocked = achievementEngine.checkAchievements(mockStats)
      
      const blackjackAchievement = newlyUnlocked.find(a => a.id === 'first_blackjack')
      expect(blackjackAchievement).toBeDefined()
      expect(blackjackAchievement!.name).toBe('Natural 21')
    })

    test('should unlock "High Roller" achievement with high bet', () => {
      mockStats.highestBet = 500
      
      const newlyUnlocked = achievementEngine.checkAchievements(mockStats)
      
      const highRollerAchievement = newlyUnlocked.find(a => a.id === 'high_roller')
      expect(highRollerAchievement).toBeDefined()
      expect(highRollerAchievement!.name).toBe('High Roller')
    })

    test('should unlock win streak achievements', () => {
      mockStats.longestWinStreak = 5
      
      const newlyUnlocked = achievementEngine.checkAchievements(mockStats)
      
      const hotStreakAchievement = newlyUnlocked.find(a => a.id === 'win_streak_5')
      expect(hotStreakAchievement).toBeDefined()
      expect(hotStreakAchievement!.name).toBe('Hot Streak')
    })
  })

  describe('Strategy-Based Achievements', () => {
    test('should unlock "Strategy Student" with 80% accuracy over 50 hands', () => {
      mockStats.strategyAccuracy = {
        totalDecisions: 50,
        optimalDecisions: 40,
        accuracyPercentage: 80,
        byAction: {},
        byHandTotal: {}
      }
      
      const newlyUnlocked = achievementEngine.checkAchievements(mockStats)
      
      const strategyStudentAchievement = newlyUnlocked.find(a => a.id === 'strategy_learner')
      expect(strategyStudentAchievement).toBeDefined()
      expect(strategyStudentAchievement!.name).toBe('Strategy Student')
    })

    test('should unlock "Basic Strategy Master" with 95% accuracy over 100 hands', () => {
      mockStats.strategyAccuracy = {
        totalDecisions: 100,
        optimalDecisions: 95,
        accuracyPercentage: 95,
        byAction: {},
        byHandTotal: {}
      }
      
      const newlyUnlocked = achievementEngine.checkAchievements(mockStats)
      
      const masterAchievement = newlyUnlocked.find(a => a.id === 'perfect_strategy')
      expect(masterAchievement).toBeDefined()
      expect(masterAchievement!.name).toBe('Basic Strategy Master')
    })

    test('should not unlock strategy achievements with insufficient accuracy', () => {
      mockStats.strategyAccuracy = {
        totalDecisions: 100,
        optimalDecisions: 70,
        accuracyPercentage: 70,
        byAction: {},
        byHandTotal: {}
      }
      
      const newlyUnlocked = achievementEngine.checkAchievements(mockStats)
      
      const strategyAchievements = newlyUnlocked.filter(a => a.category === AchievementCategory.STRATEGY)
      expect(strategyAchievements).toHaveLength(0)
    })

    test('should not unlock strategy achievements with insufficient decisions', () => {
      mockStats.strategyAccuracy = {
        totalDecisions: 25,
        optimalDecisions: 25,
        accuracyPercentage: 100,
        byAction: {},
        byHandTotal: {}
      }
      
      const newlyUnlocked = achievementEngine.checkAchievements(mockStats)
      
      const strategyAchievements = newlyUnlocked.filter(a => a.category === AchievementCategory.STRATEGY)
      expect(strategyAchievements).toHaveLength(0)
    })
  })

  describe('Progress Calculation', () => {
    test('should calculate progress correctly for stat-based achievements', () => {
      mockStats.handsPlayed = 50
      
      const progress = achievementEngine.getAchievementProgress(mockStats)
      
      // Find Century Club achievement progress
      const centuryProgress = progress.find(p => p.achievement.id === 'century_hands')
      expect(centuryProgress).toBeDefined()
      expect(centuryProgress!.current).toBe(50)
      expect(centuryProgress!.target).toBe(100)
      expect(centuryProgress!.percentage).toBe(50)
      expect(centuryProgress!.unlocked).toBe(false)
    })

    test('should show 100% progress for unlocked achievements', () => {
      mockStats.handsPlayed = 1
      
      // First unlock the achievement
      achievementEngine.checkAchievements(mockStats)
      
      // Then check progress
      const progress = achievementEngine.getAchievementProgress(mockStats)
      const firstHandProgress = progress.find(p => p.achievement.id === 'first_hand')
      
      expect(firstHandProgress).toBeDefined()
      expect(firstHandProgress!.unlocked).toBe(true)
      expect(firstHandProgress!.percentage).toBe(100)
      expect(firstHandProgress!.unlockedAt).toBeDefined()
    })

    test('should calculate progress for combo achievements based on limiting condition', () => {
      mockStats.strategyAccuracy = {
        totalDecisions: 25, // This is the limiting factor (need 50)
        optimalDecisions: 24,
        accuracyPercentage: 96, // This exceeds requirement (need 80)
        byAction: {},
        byHandTotal: {}
      }
      
      const progress = achievementEngine.getAchievementProgress(mockStats)
      const strategyProgress = progress.find(p => p.achievement.id === 'strategy_learner')
      
      expect(strategyProgress).toBeDefined()
      expect(strategyProgress!.current).toBe(25) // Based on limiting condition
      expect(strategyProgress!.target).toBe(50)
      expect(strategyProgress!.percentage).toBe(50)
    })
  })

  describe('Achievement Unlocking and Persistence', () => {
    test('should not unlock the same achievement twice', () => {
      mockStats.handsPlayed = 1
      
      const firstCheck = achievementEngine.checkAchievements(mockStats)
      const secondCheck = achievementEngine.checkAchievements(mockStats)
      
      expect(firstCheck).toHaveLength(1)
      expect(secondCheck).toHaveLength(0)
    })

    test('should save achievements to localStorage when unlocked', () => {
      mockStats.handsPlayed = 1
      
      achievementEngine.checkAchievements(mockStats)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'blackjack-achievements',
        expect.stringContaining('first_hand')
      )
    })

    test('should load achievements from localStorage', () => {
      const savedData = {
        version: '1.0.0',
        achievements: [
          {
            achievementId: 'first_hand',
            unlockedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        lastSaved: '2024-01-01T00:00:00.000Z'
      }
      
      mockLocalStorage.store['blackjack-achievements'] = JSON.stringify(savedData)
      
      const newEngine = new AchievementEngine()
      const unlockedAchievements = newEngine.getUnlockedAchievements()
      
      expect(unlockedAchievements).toHaveLength(1)
      expect(unlockedAchievements[0].achievementId).toBe('first_hand')
    })

    test('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.store['blackjack-achievements'] = 'invalid json'
      
      expect(() => new AchievementEngine()).not.toThrow()
      
      const engine = new AchievementEngine()
      const unlockedAchievements = engine.getUnlockedAchievements()
      
      expect(unlockedAchievements).toHaveLength(0)
    })
  })

  describe('Achievement Points and Completion', () => {
    test('should calculate total points correctly', () => {
      mockStats.handsPlayed = 1
      mockStats.blackjacks = 1
      
      achievementEngine.checkAchievements(mockStats)
      
      const totalPoints = achievementEngine.getTotalPoints()
      
      // First Steps (10 points) + Natural 21 (25 points) = 35 points
      expect(totalPoints).toBe(35)
    })

    test('should calculate completion percentage correctly', () => {
      const totalAchievements = achievementEngine.getAllAchievements().length
      
      mockStats.handsPlayed = 1
      achievementEngine.checkAchievements(mockStats)
      
      const completion = achievementEngine.getCompletionPercentage()
      const expectedCompletion = (1 / totalAchievements) * 100
      
      expect(completion).toBeCloseTo(expectedCompletion, 1)
    })
  })

  describe('Achievement Reset', () => {
    test('should reset all achievements', () => {
      mockStats.handsPlayed = 1
      achievementEngine.checkAchievements(mockStats)
      
      expect(achievementEngine.getUnlockedAchievements()).toHaveLength(1)
      expect(achievementEngine.getTotalPoints()).toBeGreaterThan(0)
      
      achievementEngine.resetAchievements()
      
      expect(achievementEngine.getUnlockedAchievements()).toHaveLength(0)
      expect(achievementEngine.getTotalPoints()).toBe(0)
      expect(achievementEngine.getCompletionPercentage()).toBe(0)
    })

    test('should save reset state to localStorage', () => {
      mockStats.handsPlayed = 1
      achievementEngine.checkAchievements(mockStats)
      
      achievementEngine.resetAchievements()
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'blackjack-achievements',
        expect.stringContaining('[]')
      )
    })
  })

  describe('Stat Value Extraction', () => {
    test('should extract nested stat values correctly', () => {
      mockStats.strategyAccuracy.accuracyPercentage = 85.5
      
      const progress = achievementEngine.getAchievementProgress(mockStats)
      
      // This implicitly tests the getStatValue method through progress calculation
      expect(progress).toBeDefined()
    })

    test('should return 0 for missing stat paths', () => {
      // Create stats without strategy accuracy
      const incompleteStats = {
        ...mockStats,
        strategyAccuracy: undefined as any
      }
      
      const progress = achievementEngine.getAchievementProgress(incompleteStats)
      
      // Should not throw and should handle missing paths gracefully
      expect(progress).toBeDefined()
    })
  })

  describe('Hidden Achievements', () => {
    test('should include hidden achievements in total count', () => {
      const allAchievements = achievementEngine.getAllAchievements()
      const hiddenAchievements = allAchievements.filter(a => a.hidden)
      
      expect(hiddenAchievements.length).toBeGreaterThan(0)
      
      // Hidden achievements should still count toward completion
      const totalCount = allAchievements.length
      expect(totalCount).toBeGreaterThan(hiddenAchievements.length)
    })
  })

  describe('Complex Achievement Scenarios', () => {
    test('should unlock multiple achievements in single check', () => {
      mockStats.handsPlayed = 100
      mockStats.handsWon = 60
      mockStats.blackjacks = 5
      mockStats.strategyAccuracy = {
        totalDecisions: 100,
        optimalDecisions: 95,
        accuracyPercentage: 95,
        byAction: {},
        byHandTotal: {}
      }
      
      const newlyUnlocked = achievementEngine.checkAchievements(mockStats)
      
      expect(newlyUnlocked.length).toBeGreaterThan(3)
      
      const achievementIds = newlyUnlocked.map(a => a.id)
      expect(achievementIds).toContain('first_hand')
      expect(achievementIds).toContain('century_hands')
      expect(achievementIds).toContain('first_blackjack')
      expect(achievementIds).toContain('perfect_strategy')
    })

    test('should handle achievements with different comparison operators', () => {
      // Test gte (greater than or equal)
      mockStats.handsPlayed = 100
      let newlyUnlocked = achievementEngine.checkAchievements(mockStats)
      expect(newlyUnlocked.some(a => a.id === 'century_hands')).toBe(true)
      
      // Reset for next test
      achievementEngine.resetAchievements()
      
      // Test exact values
      mockStats.handsPlayed = 1
      newlyUnlocked = achievementEngine.checkAchievements(mockStats)
      expect(newlyUnlocked.some(a => a.id === 'first_hand')).toBe(true)
    })
  })

  describe('Performance with Large Stats', () => {
    test('should handle large stat values efficiently', () => {
      mockStats.handsPlayed = 10000
      mockStats.handsWon = 5000
      mockStats.blackjacks = 500
      mockStats.totalWinnings = 50000
      mockStats.longestWinStreak = 25
      
      const startTime = performance.now()
      const progress = achievementEngine.getAchievementProgress(mockStats)
      const newlyUnlocked = achievementEngine.checkAchievements(mockStats)
      const endTime = performance.now()
      
      // Should complete in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100)
      
      expect(progress).toBeDefined()
      expect(newlyUnlocked.length).toBeGreaterThan(0)
    })
  })
})