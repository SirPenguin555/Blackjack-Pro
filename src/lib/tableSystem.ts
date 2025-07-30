/**
 * Table System - Progressive Table Levels and Configurations
 * 
 * This module defines the table level progression system that provides
 * different betting limits and unlock requirements based on player progress.
 */

export enum TableLevel {
  BEGINNER = 'beginner',
  AMATEUR = 'amateur', 
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  PROFESSIONAL = 'professional',
  HIGH_ROLLER = 'high_roller'
}

export interface TableRequirements {
  minimumChips: number
  handsPlayed: number
  winRate: number // Percentage (0-100)
}

export type TableTheme = 'classic' | 'modern' | 'luxury' | 'vintage' | 'neon' | 'casino'

export interface TableConfiguration {
  level: TableLevel
  name: string
  description: string
  minBet: number
  maxBet: number
  buyInMin: number
  buyInMax: number
  theme: TableTheme
  unlockRequirements: TableRequirements
}

/**
 * Complete table configurations for all levels
 */
export const TABLE_CONFIGURATIONS: Record<TableLevel, TableConfiguration> = {
  [TableLevel.BEGINNER]: {
    level: TableLevel.BEGINNER,
    name: 'Beginner Table',
    description: 'Perfect for learning the basics of blackjack',
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
  },

  [TableLevel.AMATEUR]: {
    level: TableLevel.AMATEUR,
    name: 'Amateur Table',
    description: 'For players who have mastered the basics',
    minBet: 10,
    maxBet: 250,
    buyInMin: 100,
    buyInMax: 1250,
    theme: 'modern',
    unlockRequirements: {
      minimumChips: 500,
      handsPlayed: 25,
      winRate: 40
    }
  },

  [TableLevel.INTERMEDIATE]: {
    level: TableLevel.INTERMEDIATE,
    name: 'Intermediate Table',
    description: 'Challenging gameplay for developing players',
    minBet: 25,
    maxBet: 500,
    buyInMin: 250,
    buyInMax: 2500,
    theme: 'vintage',
    unlockRequirements: {
      minimumChips: 2000,
      handsPlayed: 50,
      winRate: 42
    }
  },

  [TableLevel.ADVANCED]: {
    level: TableLevel.ADVANCED,
    name: 'Advanced Table',
    description: 'High-stakes action for skilled players',
    minBet: 50,
    maxBet: 1000,
    buyInMin: 500,
    buyInMax: 5000,
    theme: 'casino',
    unlockRequirements: {
      minimumChips: 7500,
      handsPlayed: 150,
      winRate: 43
    }
  },

  [TableLevel.PROFESSIONAL]: {
    level: TableLevel.PROFESSIONAL,
    name: 'Professional Table',
    description: 'Elite gameplay for expert players',
    minBet: 100,
    maxBet: 2500,
    buyInMin: 1000,
    buyInMax: 12500,
    theme: 'neon',
    unlockRequirements: {
      minimumChips: 15000,
      handsPlayed: 300,
      winRate: 44
    }
  },

  [TableLevel.HIGH_ROLLER]: {
    level: TableLevel.HIGH_ROLLER,
    name: 'High Roller VIP',
    description: 'Exclusive table for the most experienced players',
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
}

/**
 * Ordered list of table levels for progression
 */
export const TABLE_LEVEL_ORDER: TableLevel[] = [
  TableLevel.BEGINNER,
  TableLevel.AMATEUR,
  TableLevel.INTERMEDIATE,
  TableLevel.ADVANCED,
  TableLevel.PROFESSIONAL,
  TableLevel.HIGH_ROLLER
]

/**
 * Get table configuration for a specific level
 */
export function getTableConfiguration(level: TableLevel): TableConfiguration {
  return TABLE_CONFIGURATIONS[level]
}

/**
 * Get all table configurations in order
 */
export function getAllTableConfigurations(): TableConfiguration[] {
  return TABLE_LEVEL_ORDER.map(level => TABLE_CONFIGURATIONS[level])
}

/**
 * Get the next table level in progression
 */
export function getNextTableLevel(currentLevel: TableLevel): TableLevel | null {
  const currentIndex = TABLE_LEVEL_ORDER.indexOf(currentLevel)
  if (currentIndex === -1 || currentIndex === TABLE_LEVEL_ORDER.length - 1) {
    return null
  }
  return TABLE_LEVEL_ORDER[currentIndex + 1]
}

/**
 * Check if a table level is valid
 */
export function isValidTableLevel(level: string): level is TableLevel {
  return Object.values(TableLevel).includes(level as TableLevel)
}