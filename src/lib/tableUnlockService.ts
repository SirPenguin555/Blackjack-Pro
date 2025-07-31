/**
 * Table Unlock Service - Manages Table Progression Logic
 * 
 * This service handles determining which tables a player can access
 * based on their current chips, statistics, and progression requirements.
 */

import { GameStats } from '../types/game'
import { 
  TableLevel, 
  TableConfiguration, 
  TABLE_CONFIGURATIONS, 
  TABLE_LEVEL_ORDER,
  getNextTableLevel 
} from './tableSystem'

export interface UnlockProgress {
  level: TableLevel
  missingRequirements: {
    chips: number
    hands: number
    winRate: number
  }
}

export interface UnlockProgressInfo {
  chipRequirement: number
  handsRequirement: number
  winRateRequirement: number
}

export class TableUnlockService {
  /**
   * Calculate the player's win rate as a percentage
   */
  calculateWinRate(stats: GameStats): number {
    if (stats.handsPlayed === 0) {
      return 0
    }
    return Math.round((stats.handsWon / stats.handsPlayed) * 100 * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Check if a player can unlock a specific table level
   */
  canUnlockTable(level: TableLevel, playerChips: number, stats: GameStats): boolean {
    const config = TABLE_CONFIGURATIONS[level]
    const requirements = config.unlockRequirements
    const playerWinRate = this.calculateWinRate(stats)

    // Check all requirements
    const hasEnoughChips = playerChips >= requirements.minimumChips
    const hasEnoughHands = stats.handsPlayed >= requirements.handsPlayed
    const hasEnoughWinRate = playerWinRate >= requirements.winRate

    return hasEnoughChips && hasEnoughHands && hasEnoughWinRate
  }

  /**
   * Get all tables that the player can currently access
   */
  getAvailableTables(playerChips: number, stats: GameStats): TableConfiguration[] {
    const availableTables: TableConfiguration[] = []

    for (const level of TABLE_LEVEL_ORDER) {
      if (this.canUnlockTable(level, playerChips, stats)) {
        availableTables.push(TABLE_CONFIGURATIONS[level])
      }
    }

    return availableTables
  }

  /**
   * Get the next table that the player can work towards unlocking
   */
  getNextUnlockInfo(playerChips: number, stats: GameStats): UnlockProgress | null {
    for (const level of TABLE_LEVEL_ORDER) {
      if (!this.canUnlockTable(level, playerChips, stats)) {
        const config = TABLE_CONFIGURATIONS[level]
        const requirements = config.unlockRequirements
        const playerWinRate = this.calculateWinRate(stats)

        return {
          level,
          missingRequirements: {
            chips: Math.max(0, requirements.minimumChips - playerChips),
            hands: Math.max(0, requirements.handsPlayed - stats.handsPlayed),
            winRate: Math.max(0, requirements.winRate - playerWinRate)
          }
        }
      }
    }

    // All tables are unlocked
    return null
  }

  /**
   * Get unlock requirements for a specific level
   */
  getUnlockRequirements(level: TableLevel) {
    return TABLE_CONFIGURATIONS[level].unlockRequirements
  }

  /**
   * Check if player meets buy-in requirements for a table
   */
  canAffordTable(level: TableLevel, playerChips: number): boolean {
    const config = TABLE_CONFIGURATIONS[level]
    return playerChips >= config.buyInMin
  }

  /**
   * Get suggested buy-in amount for a table level
   */
  getSuggestedBuyIn(level: TableLevel, playerChips: number): number {
    const config = TABLE_CONFIGURATIONS[level]
    
    // Suggest 20% of player's chips, but within table limits
    const twentyPercent = Math.floor(playerChips * 0.2)
    const suggested = Math.max(config.buyInMin, Math.min(twentyPercent, config.buyInMax))
    
    // Make sure player can afford it
    return Math.min(suggested, playerChips)
  }

  /**
   * Get the highest table level the player has unlocked
   */
  getHighestUnlockedLevel(playerChips: number, stats: GameStats): TableLevel {
    let highestLevel = TableLevel.BEGINNER

    for (const level of TABLE_LEVEL_ORDER) {
      if (this.canUnlockTable(level, playerChips, stats)) {
        highestLevel = level
      } else {
        break
      }
    }

    return highestLevel
  }

  /**
   * Get progression percentage to next level (0-100)
   */
  getProgressToNextLevel(playerChips: number, stats: GameStats): number {
    const nextUnlock = this.getNextUnlockInfo(playerChips, stats)
    
    if (!nextUnlock) {
      return 100 // All levels unlocked
    }

    const config = TABLE_CONFIGURATIONS[nextUnlock.level]
    const requirements = config.unlockRequirements
    const playerWinRate = this.calculateWinRate(stats)

    // Calculate progress for each requirement (chips, hands, win rate)
    const chipsProgress = requirements.minimumChips > 0 
      ? Math.min(100, (playerChips / requirements.minimumChips) * 100)
      : 100

    const handsProgress = requirements.handsPlayed > 0
      ? Math.min(100, (stats.handsPlayed / requirements.handsPlayed) * 100)  
      : 100

    const winRateProgress = requirements.winRate > 0
      ? Math.min(100, (playerWinRate / requirements.winRate) * 100)
      : 100

    // Return the minimum progress (bottleneck requirement)
    return Math.min(chipsProgress, handsProgress, winRateProgress)
  }

  /**
   * Validate if a table level exists and player can access it
   */
  validateTableAccess(level: TableLevel, playerChips: number, stats: GameStats): {
    canAccess: boolean
    canAfford: boolean
    reason?: string
  } {
    if (!TABLE_CONFIGURATIONS[level]) {
      return {
        canAccess: false,
        canAfford: false,
        reason: 'Invalid table level'
      }
    }

    const canUnlock = this.canUnlockTable(level, playerChips, stats)
    const canAfford = this.canAffordTable(level, playerChips)

    if (!canUnlock) {
      const nextUnlock = this.getNextUnlockInfo(playerChips, stats)
      if (nextUnlock && nextUnlock.level === level) {
        const missing = nextUnlock.missingRequirements
        const reasons = []
        
        if (missing.chips > 0) reasons.push(`${missing.chips} more chips`)
        if (missing.hands > 0) reasons.push(`${missing.hands} more hands`)
        if (missing.winRate > 0) reasons.push(`${missing.winRate.toFixed(1)}% higher win rate`)
        
        return {
          canAccess: false,
          canAfford: false,
          reason: `Need: ${reasons.join(', ')}`
        }
      }
      return {
        canAccess: false,
        canAfford: false,
        reason: 'Table not yet unlocked'
      }
    }

    if (!canAfford) {
      const config = TABLE_CONFIGURATIONS[level]
      return {
        canAccess: true,
        canAfford: false,
        reason: `Need ${config.buyInMin} chips to buy in`
      }
    }

    return {
      canAccess: true,
      canAfford: true
    }
  }

  /**
   * Check if a table is unlocked based on stats
   */
  isTableUnlocked(level: TableLevel, stats: GameStats): boolean {
    const config = TABLE_CONFIGURATIONS[level]
    const requirements = config.unlockRequirements
    const playerWinRate = this.calculateWinRate(stats)

    // Check all requirements (assuming player has enough chips if they've played games)
    const hasEnoughHands = stats.handsPlayed >= requirements.handsPlayed
    const hasEnoughWinRate = playerWinRate >= requirements.winRate
    
    // For stats screen, we'll assume they have minimum chips if they meet other requirements
    // This is because the stats screen doesn't have access to current chip count
    const estimatedChips = Math.max(stats.totalWinnings, requirements.minimumChips)
    const hasEnoughChips = estimatedChips >= requirements.minimumChips

    return hasEnoughChips && hasEnoughHands && hasEnoughWinRate
  }

  /**
   * Get unlock progress information for a table level
   */
  getUnlockProgress(level: TableLevel, stats: GameStats): UnlockProgressInfo {
    const config = TABLE_CONFIGURATIONS[level]
    const requirements = config.unlockRequirements
    const playerWinRate = this.calculateWinRate(stats)
    
    // Estimate player chips based on total winnings
    const estimatedChips = Math.max(stats.totalWinnings, 0)

    return {
      chipRequirement: Math.max(0, requirements.minimumChips - estimatedChips),
      handsRequirement: Math.max(0, requirements.handsPlayed - stats.handsPlayed),
      winRateRequirement: Math.max(0, requirements.winRate - playerWinRate)
    }
  }
}

// Export singleton instance
export const tableUnlockService = new TableUnlockService()