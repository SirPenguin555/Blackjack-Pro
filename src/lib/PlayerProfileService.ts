/**
 * Player Profile Service
 * Handles persistent storage of player data including stats, progress, and preferences
 */

import type { GameStats } from '@/types/game'
import { TableLevel, GameVariant } from '@/types/game'

export interface PlayerProfile {
  // Basic game stats
  stats: GameStats
  
  // Player progression
  chips: number
  currentTableLevel: TableLevel
  currentGameVariant: GameVariant
  
  // Unlocked content
  unlockedTables: TableLevel[]
  unlockedVariants: GameVariant[]
  
  // Profile metadata
  createdAt: string
  lastSaved: string
  version: string
}

export interface StorageData {
  profile: PlayerProfile
  version: string
}

export class PlayerProfileService {
  private static instance: PlayerProfileService
  private storageKey = 'blackjack-player-profile'
  private currentVersion = '1.0.0'

  constructor() {
    // Singleton pattern
    if (PlayerProfileService.instance) {
      return PlayerProfileService.instance
    }
    PlayerProfileService.instance = this
  }

  /**
   * Get the default/initial player profile
   */
  private getDefaultProfile(): PlayerProfile {
    const now = new Date().toISOString()
    
    return {
      stats: {
        handsPlayed: 0,
        roundsPlayed: 0,
        handsWon: 0,
        handsLost: 0,
        handsPushed: 0,
        blackjacks: 0,
        totalWinnings: 0,
        loansTaken: 0
      },
      chips: 250, // Starting chips
      currentTableLevel: TableLevel.BEGINNER,
      currentGameVariant: GameVariant.VEGAS,
      unlockedTables: [TableLevel.BEGINNER], // Start with beginner table unlocked
      unlockedVariants: [GameVariant.VEGAS], // Start with Vegas rules unlocked
      createdAt: now,
      lastSaved: now,
      version: this.currentVersion
    }
  }

  /**
   * Load player profile from localStorage
   */
  loadProfile(): PlayerProfile {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.warn('Failed to load player profile, using defaults: localStorage is not available')
        return this.getDefaultProfile()
      }

      const saved = localStorage.getItem(this.storageKey)
      if (!saved) {
        return this.getDefaultProfile()
      }

      const data: StorageData = JSON.parse(saved)
      
      // Version check and migration logic
      if (data.version !== this.currentVersion) {
        console.log(`Migrating profile from version ${data.version} to ${this.currentVersion}`)
        return this.migrateProfile(data.profile)
      }

      // Validate required fields and provide defaults for missing ones
      const profile = {
        ...this.getDefaultProfile(),
        ...data.profile,
        lastSaved: data.profile.lastSaved || new Date().toISOString()
      }

      return profile
    } catch (error) {
      console.warn('Failed to load player profile, using defaults:', error)
      return this.getDefaultProfile()
    }
  }

  /**
   * Save player profile to localStorage
   */
  saveProfile(profile: PlayerProfile): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.warn('Failed to save player profile: localStorage is not available')
        return
      }

      const updatedProfile: PlayerProfile = {
        ...profile,
        lastSaved: new Date().toISOString(),
        version: this.currentVersion
      }

      const data: StorageData = {
        profile: updatedProfile,
        version: this.currentVersion
      }

      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save player profile:', error)
    }
  }

  /**
   * Update specific parts of the profile
   */
  updateProfile(updates: Partial<PlayerProfile>): PlayerProfile {
    const currentProfile = this.loadProfile()
    const updatedProfile = { ...currentProfile, ...updates }
    this.saveProfile(updatedProfile)
    return updatedProfile
  }

  /**
   * Update player stats
   */
  updateStats(stats: GameStats): void {
    this.updateProfile({ stats })
  }

  /**
   * Update player chips
   */
  updateChips(chips: number): void {
    this.updateProfile({ chips })
  }

  /**
   * Update current table level
   */
  updateTableLevel(tableLevel: TableLevel): void {
    this.updateProfile({ currentTableLevel: tableLevel })
  }

  /**
   * Update current game variant
   */
  updateGameVariant(variant: GameVariant): void {
    this.updateProfile({ currentGameVariant: variant })
  }

  /**
   * Unlock a new table level
   */
  unlockTable(tableLevel: TableLevel): void {
    const profile = this.loadProfile()
    if (!profile.unlockedTables.includes(tableLevel)) {
      const unlockedTables = [...profile.unlockedTables, tableLevel]
      this.updateProfile({ unlockedTables })
    }
  }

  /**
   * Unlock a new game variant
   */
  unlockVariant(variant: GameVariant): void {
    const profile = this.loadProfile()
    if (!profile.unlockedVariants.includes(variant)) {
      const unlockedVariants = [...profile.unlockedVariants, variant]
      this.updateProfile({ unlockedVariants })
    }
  }

  /**
   * Check if a table is unlocked
   */
  isTableUnlocked(tableLevel: TableLevel): boolean {
    const profile = this.loadProfile()
    return profile.unlockedTables.includes(tableLevel)
  }

  /**
   * Check if a variant is unlocked
   */
  isVariantUnlocked(variant: GameVariant): boolean {
    const profile = this.loadProfile()
    return profile.unlockedVariants.includes(variant)
  }

  /**
   * Reset all profile data
   */
  resetProfile(): PlayerProfile {
    const defaultProfile = this.getDefaultProfile()
    this.saveProfile(defaultProfile)
    return defaultProfile
  }

  /**
   * Export profile data for backup
   */
  exportProfile(): string {
    const profile = this.loadProfile()
    return JSON.stringify({
      profile,
      exportedAt: new Date().toISOString(),
      version: this.currentVersion
    }, null, 2)
  }

  /**
   * Import profile data from backup
   */
  importProfile(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      if (data.profile && data.version) {
        const migratedProfile = this.migrateProfile(data.profile)
        this.saveProfile(migratedProfile)
        return true
      }
      return false
    } catch (error) {
      console.warn('Failed to import profile:', error)
      return false
    }
  }

  /**
   * Migrate profile from older versions
   */
  private migrateProfile(oldProfile: any): PlayerProfile {
    const defaultProfile = this.getDefaultProfile()
    
    // Handle migration logic here as versions evolve
    // For now, just merge with defaults and ensure required fields exist
    return {
      ...defaultProfile,
      ...oldProfile,
      version: this.currentVersion,
      // Ensure arrays exist
      unlockedTables: oldProfile.unlockedTables || [TableLevel.BEGINNER],
      unlockedVariants: oldProfile.unlockedVariants || [GameVariant.VEGAS],
      // Ensure stats object exists with all required fields
      stats: {
        ...defaultProfile.stats,
        ...oldProfile.stats
      }
    }
  }

  /**
   * Get profile storage size
   */
  getStorageSize(): number {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return 0
      }
      const data = localStorage.getItem(this.storageKey)
      return data ? new Blob([data]).size : 0
    } catch {
      return 0
    }
  }

  /**
   * Clear all profile data
   */
  clearProfile(): void {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.warn('Failed to clear profile: localStorage is not available')
        return
      }
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      console.warn('Failed to clear profile:', error)
    }
  }
}

// Export singleton instance
export const playerProfileService = new PlayerProfileService()