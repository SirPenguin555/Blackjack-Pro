/**
 * Achievement System for Blackjack Pro
 * Tracks player milestones and rewards accomplishments
 */

import type { TableLevel, GameVariant } from '@/types/game'
import type { StatisticsSummary } from './StatsTracker'

export enum AchievementCategory {
  GAMEPLAY = 'gameplay',
  STRATEGY = 'strategy', 
  PROGRESSION = 'progression',
  SPECIAL = 'special'
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon', 
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  rarity: AchievementRarity
  icon: string
  points: number
  requirement: AchievementRequirement
  reward?: AchievementReward
  hidden?: boolean // Secret achievements
}

export interface AchievementRequirement {
  type: 'stat' | 'condition' | 'combo'
  target: string
  value?: number
  comparison?: 'gte' | 'lte' | 'eq'
  conditions?: AchievementRequirement[]
}

export interface AchievementReward {
  type: 'chips' | 'unlock' | 'badge' | 'title'
  value: number | string
  description: string
}

export interface PlayerAchievement {
  achievementId: string
  unlockedAt: string
  progress?: number
  maxProgress?: number
}

export interface AchievementProgress {
  achievement: Achievement
  current: number
  target: number
  percentage: number
  unlocked: boolean
  unlockedAt?: string
}

export class AchievementEngine {
  private achievements: Map<string, Achievement> = new Map()
  private playerAchievements: Map<string, PlayerAchievement> = new Map()
  private storageKey = 'blackjack-achievements'

  constructor() {
    this.initializeAchievements()
    this.loadPlayerAchievements()
  }

  /**
   * Get all available achievements
   */
  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values())
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.getAllAchievements().filter(a => a.category === category)
  }

  /**
   * Get unlocked achievements
   */
  getUnlockedAchievements(): PlayerAchievement[] {
    return Array.from(this.playerAchievements.values())
  }

  /**
   * Get achievement progress for display
   */
  getAchievementProgress(stats: StatisticsSummary): AchievementProgress[] {
    return this.getAllAchievements().map(achievement => {
      const progress = this.calculateProgress(achievement, stats)
      const playerAchievement = this.playerAchievements.get(achievement.id)
      
      return {
        achievement,
        current: progress.current,
        target: progress.target,
        percentage: Math.min(100, (progress.current / progress.target) * 100),
        unlocked: !!playerAchievement,
        unlockedAt: playerAchievement?.unlockedAt
      }
    })
  }

  /**
   * Check and unlock achievements based on current stats
   */
  checkAchievements(stats: StatisticsSummary): Achievement[] {
    const newlyUnlocked: Achievement[] = []

    for (const achievement of this.achievements.values()) {
      // Skip if already unlocked
      if (this.playerAchievements.has(achievement.id)) continue

      // Check if requirement is met
      if (this.isRequirementMet(achievement.requirement, stats)) {
        this.unlockAchievement(achievement.id)
        newlyUnlocked.push(achievement)
      }
    }

    if (newlyUnlocked.length > 0) {
      this.savePlayerAchievements()
    }

    return newlyUnlocked
  }

  /**
   * Get total achievement points earned
   */
  getTotalPoints(): number {
    let total = 0
    for (const playerAchievement of this.playerAchievements.values()) {
      const achievement = this.achievements.get(playerAchievement.achievementId)
      if (achievement) {
        total += achievement.points
      }
    }
    return total
  }

  /**
   * Get achievement completion percentage
   */
  getCompletionPercentage(): number {
    const totalAchievements = this.achievements.size
    const unlockedAchievements = this.playerAchievements.size
    return totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0
  }

  /**
   * Reset all achievements (for testing or new profiles)
   */
  resetAchievements(): void {
    this.playerAchievements.clear()
    this.savePlayerAchievements()
  }

  // Private methods

  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      // Gameplay Achievements
      {
        id: 'first_hand',
        name: 'First Steps',
        description: 'Play your first hand of blackjack',
        category: AchievementCategory.GAMEPLAY,
        rarity: AchievementRarity.COMMON,
        icon: '🎰',
        points: 10,
        requirement: {
          type: 'stat',
          target: 'basic.handsPlayed',
          value: 1,
          comparison: 'gte'
        }
      },
      {
        id: 'century_hands',
        name: 'Century Club',
        description: 'Play 100 hands of blackjack',
        category: AchievementCategory.GAMEPLAY,
        rarity: AchievementRarity.UNCOMMON,
        icon: '💯',
        points: 50,
        requirement: {
          type: 'stat',
          target: 'basic.handsPlayed',
          value: 100,
          comparison: 'gte'
        }
      },
      {
        id: 'thousand_hands',
        name: 'Veteran Player',
        description: 'Play 1,000 hands of blackjack',
        category: AchievementCategory.GAMEPLAY,
        rarity: AchievementRarity.RARE,
        icon: '🏆',
        points: 200,
        requirement: {
          type: 'stat',
          target: 'basic.handsPlayed',
          value: 1000,
          comparison: 'gte'
        }
      },
      {
        id: 'first_blackjack',
        name: 'Natural 21',
        description: 'Get your first blackjack (21 with first two cards)',
        category: AchievementCategory.GAMEPLAY,
        rarity: AchievementRarity.COMMON,
        icon: '🃏',
        points: 25,
        requirement: {
          type: 'stat',
          target: 'basic.blackjacks',
          value: 1,
          comparison: 'gte'
        }
      },
      {
        id: 'blackjack_streak',
        name: 'Lucky Streak',
        description: 'Get 5 blackjacks in your career',
        category: AchievementCategory.GAMEPLAY,
        rarity: AchievementRarity.UNCOMMON,
        icon: '⚡',
        points: 75,
        requirement: {
          type: 'stat',
          target: 'basic.blackjacks',
          value: 5,
          comparison: 'gte'
        }
      },

      // Strategy Achievements
      {
        id: 'strategy_learner',
        name: 'Strategy Student',
        description: 'Achieve 80% strategy accuracy over 50 hands',
        category: AchievementCategory.STRATEGY,
        rarity: AchievementRarity.UNCOMMON,
        icon: '📚',
        points: 100,
        requirement: {
          type: 'combo',
          conditions: [
            {
              type: 'stat',
              target: 'strategyAccuracy.accuracyPercentage',
              value: 80,
              comparison: 'gte'
            },
            {
              type: 'stat',
              target: 'strategyAccuracy.totalDecisions',
              value: 50,
              comparison: 'gte'
            }
          ]
        }
      },
      {
        id: 'perfect_strategy',
        name: 'Basic Strategy Master',
        description: 'Achieve 95% strategy accuracy over 100 hands',
        category: AchievementCategory.STRATEGY,
        rarity: AchievementRarity.RARE,
        icon: '🎯',
        points: 250,
        requirement: {
          type: 'combo',
          conditions: [
            {
              type: 'stat',
              target: 'strategyAccuracy.accuracyPercentage',
              value: 95,
              comparison: 'gte'
            },
            {
              type: 'stat',
              target: 'strategyAccuracy.totalDecisions',
              value: 100,
              comparison: 'gte'
            }
          ]
        }
      },

      // Progression Achievements
      {
        id: 'bronze_table',
        name: 'Moving Up',
        description: 'Unlock the Bronze table',
        category: AchievementCategory.PROGRESSION,
        rarity: AchievementRarity.COMMON,
        icon: '🥉',
        points: 30,
        requirement: {
          type: 'stat',
          target: 'basic.totalWinnings',
          value: 50,
          comparison: 'gte'
        }
      },
      {
        id: 'silver_table',
        name: 'Silver Streak',
        description: 'Unlock the Silver table',
        category: AchievementCategory.PROGRESSION,
        rarity: AchievementRarity.UNCOMMON,
        icon: '🥈',
        points: 60,
        requirement: {
          type: 'stat',
          target: 'basic.totalWinnings',
          value: 200,
          comparison: 'gte'
        }
      },
      {
        id: 'gold_table',
        name: 'Golden Touch',
        description: 'Unlock the Gold table',
        category: AchievementCategory.PROGRESSION,
        rarity: AchievementRarity.RARE,
        icon: '🥇',
        points: 120,
        requirement: {
          type: 'stat',
          target: 'basic.totalWinnings',
          value: 500,
          comparison: 'gte'
        }
      },
      {
        id: 'diamond_table',
        name: 'Diamond Elite',
        description: 'Unlock the Diamond table',
        category: AchievementCategory.PROGRESSION,
        rarity: AchievementRarity.EPIC,
        icon: '💎',
        points: 300,
        requirement: {
          type: 'stat',
          target: 'basic.totalWinnings',
          value: 1000,
          comparison: 'gte'
        }
      },

      // Special Achievements
      {
        id: 'comeback_kid',
        name: 'Comeback Kid',
        description: 'Win after being down to your last 50 chips',
        category: AchievementCategory.SPECIAL,
        rarity: AchievementRarity.RARE,
        icon: '🔥',
        points: 150,
        requirement: {
          type: 'stat',
          target: 'basic.loansTaken',
          value: 1,
          comparison: 'gte'
        },
        hidden: true
      },
      {
        id: 'high_roller',
        name: 'High Roller',
        description: 'Win a hand with a bet of 500 chips or more',
        category: AchievementCategory.SPECIAL,
        rarity: AchievementRarity.EPIC,
        icon: '💰',
        points: 200,
        requirement: {
          type: 'stat',
          target: 'basic.handsWon',
          value: 50,
          comparison: 'gte'
        }
      },
      {
        id: 'win_streak_5',
        name: 'Hot Streak',
        description: 'Win 5 hands in a row',
        category: AchievementCategory.SPECIAL,
        rarity: AchievementRarity.UNCOMMON,
        icon: '🔥',
        points: 80,
        requirement: {
          type: 'stat',
          target: 'basic.longestWinStreak',
          value: 5,
          comparison: 'gte'
        }
      },
      {
        id: 'win_streak_10',
        name: 'On Fire',
        description: 'Win 10 hands in a row',
        category: AchievementCategory.SPECIAL,
        rarity: AchievementRarity.RARE,
        icon: '🔥',
        points: 180,
        requirement: {
          type: 'stat',
          target: 'basic.longestWinStreak',
          value: 10,
          comparison: 'gte'
        }
      },
      {
        id: 'variant_explorer',
        name: 'Rule Explorer',
        description: 'Play all three rule variations (Vegas, European, Atlantic City)',
        category: AchievementCategory.SPECIAL,
        rarity: AchievementRarity.UNCOMMON,
        icon: '🌍',
        points: 100,
        requirement: {
          type: 'stat',
          target: 'basic.roundsPlayed',
          value: 25,
          comparison: 'gte'
        }
      }
    ]

    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement)
    })
  }

  private calculateProgress(achievement: Achievement, stats: StatisticsSummary): { current: number; target: number } {
    const requirement = achievement.requirement
    
    if (requirement.type === 'stat' && requirement.value) {
      const current = this.getStatValue(requirement.target, stats)
      return { current, target: requirement.value }
    }
    
    if (requirement.type === 'combo' && requirement.conditions) {
      // For combo requirements, show progress of the limiting condition
      let minProgress = 1
      let target = 1
      
      for (const condition of requirement.conditions) {
        if (condition.type === 'stat' && condition.value) {
          const current = this.getStatValue(condition.target, stats)
          const progress = current / condition.value
          if (progress < minProgress) {
            minProgress = progress
            target = condition.value
          }
        }
      }
      
      return { current: Math.floor(minProgress * target), target }
    }
    
    // Default for condition-based achievements
    return { current: 0, target: 1 }
  }

  private isRequirementMet(requirement: AchievementRequirement, stats: StatisticsSummary): boolean {
    switch (requirement.type) {
      case 'stat':
        return this.checkStatRequirement(requirement, stats)
      
      case 'condition':
        return this.checkConditionRequirement(requirement, stats)
      
      case 'combo':
        return requirement.conditions?.every(cond => this.isRequirementMet(cond, stats)) || false
      
      default:
        return false
    }
  }

  private checkStatRequirement(requirement: AchievementRequirement, stats: StatisticsSummary): boolean {
    const currentValue = this.getStatValue(requirement.target, stats)
    const targetValue = requirement.value || 0
    const comparison = requirement.comparison || 'gte'

    switch (comparison) {
      case 'gte':
        return currentValue >= targetValue
      case 'lte':
        return currentValue <= targetValue
      case 'eq':
        return currentValue === targetValue
      default:
        return false
    }
  }

  private checkConditionRequirement(requirement: AchievementRequirement, stats: StatisticsSummary): boolean {
    // Special condition checks would be implemented here
    // For now, return false for unimplemented conditions
    return false
  }

  private getStatValue(path: string, stats: StatisticsSummary): number {
    const keys = path.split('.')
    let value: any = stats
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return 0
      }
    }
    
    return typeof value === 'number' ? value : 0
  }

  private unlockAchievement(achievementId: string): void {
    this.playerAchievements.set(achievementId, {
      achievementId,
      unlockedAt: new Date().toISOString()
    })
  }

  private loadPlayerAchievements(): void {
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        data.achievements?.forEach((achievement: PlayerAchievement) => {
          this.playerAchievements.set(achievement.achievementId, achievement)
        })
      }
    } catch (error) {
      console.warn('Failed to load achievements:', error)
    }
  }

  private savePlayerAchievements(): void {
    try {
      const data = {
        version: '1.0.0',
        achievements: Array.from(this.playerAchievements.values()),
        lastSaved: new Date().toISOString()
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save achievements:', error)
    }
  }
}

// Global instance
export const achievementEngine = new AchievementEngine()