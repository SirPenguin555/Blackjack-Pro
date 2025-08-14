import { supabase, isDemoMode } from './config'
import { authService, UserGameData } from './auth'
import { safeLocalStorage } from '@/lib/utils/storage'

export interface LocalStorageGameData {
  totalChips: number
  currentTableLevel: string
  currentGameVariant: string
  
  // Stats
  totalHands: number
  handsWon: number
  handsLost: number
  handsPushed: number
  blackjacksHit: number
  totalWinnings: number
  totalLosses: number
  biggestWin: number
  biggestLoss: number
  winningStreak: number
  currentStreak: number
  longestWinningStreak: number
  
  // Advanced stats
  handsByVariant: Record<string, number>
  handsByTableLevel: Record<string, number>
  strategyAccuracy: Record<string, number>
  
  // Achievements and progression
  achievementsUnlocked: string[]
  tablesUnlocked: string[]
  variantsUnlocked: string[]
  tutorialProgress: Record<string, any>
}

export class GameDataService {
  /**
   * Load game data for authenticated user
   */
  async loadUserGameData(userId: string): Promise<UserGameData | null> {
    if (isDemoMode || !supabase) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_game_data')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error loading user game data:', error)
        return null
      }

      return data || null
    } catch (error) {
      console.error('Failed to load user game data:', error)
      return null
    }
  }

  /**
   * Save game data for authenticated user
   */
  async saveUserGameData(userId: string, gameData: Partial<UserGameData>): Promise<{ success: boolean; error?: string }> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Cannot save game data')
      return { success: false, error: 'Demo mode active' }
    }

    try {
      const { error } = await supabase
        .from('user_game_data')
        .upsert({
          user_id: userId,
          ...gameData,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving user game data:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Failed to save user game data:', error)
      return { success: false, error: error.message || 'Failed to save data' }
    }
  }

  /**
   * Migrate localStorage data to authenticated account
   */
  async migrateLocalStorageToAccount(userId: string, overwrite = false): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user already has data
      const existingData = await this.loadUserGameData(userId)
      
      if (existingData && !overwrite) {
        return { success: false, error: 'User already has saved data. Use overwrite option to replace.' }
      }

      // Load data from localStorage
      const localData = this.loadFromLocalStorage()
      
      if (!localData) {
        // Create default data for new user
        const defaultData: Partial<UserGameData> = {
          total_chips: 1000,
          current_table_level: 'beginner',
          current_game_variant: 'vegas',
          total_hands_played: 0,
          hands_won: 0,
          hands_lost: 0,
          hands_pushed: 0,
          blackjacks_hit: 0,
          total_winnings: 0,
          total_losses: 0,
          biggest_win: 0,
          biggest_loss: 0,
          winning_streak: 0,
          current_streak: 0,
          longest_winning_streak: 0,
          hands_by_variant: {},
          hands_by_table_level: {},
          strategy_accuracy: {},
          betting_patterns: {},
          achievements_unlocked: [],
          achievement_progress: {},
          tables_unlocked: ['beginner'],
          variants_unlocked: ['vegas'],
          tutorial_progress: {},
          multiplayer_games_played: 0,
          multiplayer_games_won: 0,
          multiplayer_tables_hosted: 0,
          multiplayer_total_winnings: 0
        }

        return await this.saveUserGameData(userId, defaultData)
      }

      // Convert localStorage format to Supabase format
      const convertedData: Partial<UserGameData> = {
        total_chips: localData.totalChips || 1000,
        current_table_level: localData.currentTableLevel || 'beginner',
        current_game_variant: localData.currentGameVariant || 'vegas',
        total_hands_played: localData.totalHands || 0,
        hands_won: localData.handsWon || 0,
        hands_lost: localData.handsLost || 0,
        hands_pushed: localData.handsPushed || 0,
        blackjacks_hit: localData.blackjacksHit || 0,
        total_winnings: localData.totalWinnings || 0,
        total_losses: localData.totalLosses || 0,
        biggest_win: localData.biggestWin || 0,
        biggest_loss: localData.biggestLoss || 0,
        winning_streak: localData.winningStreak || 0,
        current_streak: localData.currentStreak || 0,
        longest_winning_streak: localData.longestWinningStreak || 0,
        hands_by_variant: localData.handsByVariant || {},
        hands_by_table_level: localData.handsByTableLevel || {},
        strategy_accuracy: localData.strategyAccuracy || {},
        betting_patterns: {},
        achievements_unlocked: localData.achievementsUnlocked || [],
        achievement_progress: {},
        tables_unlocked: localData.tablesUnlocked || ['beginner'],
        variants_unlocked: localData.variantsUnlocked || ['vegas'],
        tutorial_progress: localData.tutorialProgress || {},
        multiplayer_games_played: 0,
        multiplayer_games_won: 0,
        multiplayer_tables_hosted: 0,
        multiplayer_total_winnings: 0
      }

      return await this.saveUserGameData(userId, convertedData)
    } catch (error: any) {
      console.error('Failed to migrate localStorage data:', error)
      return { success: false, error: error.message || 'Migration failed' }
    }
  }

  /**
   * Load data from localStorage
   */
  loadFromLocalStorage(): LocalStorageGameData | null {
    try {
      const gameStateStr = safeLocalStorage.getItem('blackjack-game-state')
      const statsStr = safeLocalStorage.getItem('blackjack-stats')
      const progressStr = safeLocalStorage.getItem('blackjack-progress')

      if (!gameStateStr && !statsStr && !progressStr) {
        return null
      }

      const gameState = gameStateStr ? JSON.parse(gameStateStr) : {}
      const stats = statsStr ? JSON.parse(statsStr) : {}
      const progress = progressStr ? JSON.parse(progressStr) : {}

      return {
        totalChips: gameState.players?.[0]?.chips || 1000,
        currentTableLevel: gameState.currentTableLevel || 'beginner',
        currentGameVariant: gameState.currentGameVariant || 'vegas',
        
        totalHands: stats.totalHands || 0,
        handsWon: stats.handsWon || 0,
        handsLost: stats.handsLost || 0,
        handsPushed: stats.handsPushed || 0,
        blackjacksHit: stats.blackjacksHit || 0,
        totalWinnings: stats.totalWinnings || 0,
        totalLosses: stats.totalLosses || 0,
        biggestWin: stats.biggestWin || 0,
        biggestLoss: stats.biggestLoss || 0,
        winningStreak: stats.winningStreak || 0,
        currentStreak: stats.currentStreak || 0,
        longestWinningStreak: stats.longestWinningStreak || 0,
        
        handsByVariant: stats.handsByVariant || {},
        handsByTableLevel: stats.handsByTableLevel || {},
        strategyAccuracy: stats.strategyAccuracy || {},
        
        achievementsUnlocked: progress.achievementsUnlocked || [],
        tablesUnlocked: progress.tablesUnlocked || ['beginner'],
        variantsUnlocked: progress.variantsUnlocked || ['vegas'],
        tutorialProgress: progress.tutorialProgress || {}
      }
    } catch (error) {
      console.error('Failed to load localStorage data:', error)
      return null
    }
  }

  /**
   * Import save code data to authenticated account
   */
  async importSaveCodeToAccount(userId: string, saveCode: string, overwrite = false): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user already has data
      const existingData = await this.loadUserGameData(userId)
      
      if (existingData && !overwrite) {
        return { success: false, error: 'Account already has saved data. This will overwrite all current progress.' }
      }

      // Decode save code (assuming it's base64 encoded JSON)
      let decodedData: any
      try {
        const decoded = atob(saveCode)
        decodedData = JSON.parse(decoded)
      } catch (error) {
        return { success: false, error: 'Invalid save code format' }
      }

      // Convert save code format to Supabase format
      const convertedData: Partial<UserGameData> = {
        total_chips: decodedData.players?.[0]?.chips || 1000,
        current_table_level: decodedData.currentTableLevel || 'beginner',
        current_game_variant: decodedData.currentGameVariant || 'vegas',
        total_hands_played: decodedData.stats?.totalHands || 0,
        hands_won: decodedData.stats?.handsWon || 0,
        hands_lost: decodedData.stats?.handsLost || 0,
        hands_pushed: decodedData.stats?.handsPushed || 0,
        blackjacks_hit: decodedData.stats?.blackjacksHit || 0,
        total_winnings: decodedData.stats?.totalWinnings || 0,
        total_losses: decodedData.stats?.totalLosses || 0,
        biggest_win: decodedData.stats?.biggestWin || 0,
        biggest_loss: decodedData.stats?.biggestLoss || 0,
        winning_streak: decodedData.stats?.winningStreak || 0,
        current_streak: decodedData.stats?.currentStreak || 0,
        longest_winning_streak: decodedData.stats?.longestWinningStreak || 0,
        hands_by_variant: decodedData.stats?.handsByVariant || {},
        hands_by_table_level: decodedData.stats?.handsByTableLevel || {},
        strategy_accuracy: decodedData.stats?.strategyAccuracy || {},
        betting_patterns: {},
        achievements_unlocked: decodedData.achievementsUnlocked || [],
        achievement_progress: {},
        tables_unlocked: decodedData.tablesUnlocked || ['beginner'],
        variants_unlocked: decodedData.variantsUnlocked || ['vegas'],
        tutorial_progress: decodedData.tutorialProgress || {},
        // Keep existing multiplayer stats
        multiplayer_games_played: existingData?.multiplayer_games_played || 0,
        multiplayer_games_won: existingData?.multiplayer_games_won || 0,
        multiplayer_tables_hosted: existingData?.multiplayer_tables_hosted || 0,
        multiplayer_total_winnings: existingData?.multiplayer_total_winnings || 0
      }

      return await this.saveUserGameData(userId, convertedData)
    } catch (error: any) {
      console.error('Failed to import save code:', error)
      return { success: false, error: error.message || 'Import failed' }
    }
  }

  /**
   * Export account data as save code
   */
  async exportAccountAsSaveCode(userId: string): Promise<{ success: boolean; saveCode?: string; error?: string }> {
    try {
      const gameData = await this.loadUserGameData(userId)
      
      if (!gameData) {
        return { success: false, error: 'No game data found' }
      }

      // Convert to save code format
      const exportData = {
        players: [{
          chips: gameData.total_chips
        }],
        currentTableLevel: gameData.current_table_level,
        currentGameVariant: gameData.current_game_variant,
        stats: {
          totalHands: gameData.total_hands_played,
          handsWon: gameData.hands_won,
          handsLost: gameData.hands_lost,
          handsPushed: gameData.hands_pushed,
          blackjacksHit: gameData.blackjacks_hit,
          totalWinnings: gameData.total_winnings,
          totalLosses: gameData.total_losses,
          biggestWin: gameData.biggest_win,
          biggestLoss: gameData.biggest_loss,
          winningStreak: gameData.winning_streak,
          currentStreak: gameData.current_streak,
          longestWinningStreak: gameData.longest_winning_streak,
          handsByVariant: gameData.hands_by_variant,
          handsByTableLevel: gameData.hands_by_table_level,
          strategyAccuracy: gameData.strategy_accuracy
        },
        achievementsUnlocked: gameData.achievements_unlocked,
        tablesUnlocked: gameData.tables_unlocked,
        variantsUnlocked: gameData.variants_unlocked,
        tutorialProgress: gameData.tutorial_progress
      }

      // Encode as base64
      const saveCode = btoa(JSON.stringify(exportData))

      return { success: true, saveCode }
    } catch (error: any) {
      console.error('Failed to export save code:', error)
      return { success: false, error: error.message || 'Export failed' }
    }
  }
}

export const gameDataService = new GameDataService()