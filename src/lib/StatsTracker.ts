/**
 * Advanced Statistics Tracking System for Blackjack Pro
 * 
 * Provides comprehensive statistics tracking including:
 * - Basic game statistics (wins, losses, bankroll)
 * - Per-table and per-variant performance tracking
 * - Strategy accuracy monitoring
 * - Session performance analysis
 * - Persistence to localStorage and optional Firebase
 */

import { format, startOfDay, isToday, subDays } from 'date-fns'
import { TableLevel } from './tableSystem'
import { GameVariant } from './ruleVariations'
import { GameStats, GameAction } from '../types/game'

export interface AdvancedGameStats extends GameStats {
  // Extended statistics
  winRate: number
  averageBetSize: number
  biggestWin: number
  biggestLoss: number
  longestWinStreak: number
  longestLoseStreak: number
  currentStreak: number
  currentStreakType: 'win' | 'lose' | 'none'
}

export interface TableStats extends GameStats {
  tableLevel: TableLevel
}

export interface VariantStats extends GameStats {
  variant: GameVariant
}

export interface StrategyDecision {
  playerAction: GameAction
  optimalAction: GameAction
  isOptimal: boolean
  playerTotal: number
  dealerUpCard: number
  timestamp: number
}

export interface StrategyAccuracy {
  totalDecisions: number
  optimalDecisions: number
  accuracyPercentage: number
  byAction: Record<GameAction, { total: number; optimal: number }>
  byHandTotal: Record<number, { total: number; optimal: number }>
}

export interface GameSession {
  id: string
  startTime: number
  endTime?: number
  duration?: number
  tableLevel: TableLevel
  variant: GameVariant
  handsPlayed: number
  handsWon: number
  handsLost: number
  handsPushed: number
  netWinnings: number
  biggestWin: number
  biggestLoss: number
}

export interface DailyStats {
  date: string
  handsPlayed: number
  handsWon: number
  handsLost: number
  handsPushed: number
  netWinnings: number
  winRate: number
  sessionsPlayed: number
}

export interface PerformanceTrend {
  date: string
  handsPlayed: number
  winRate: number
  netWinnings: number
  averageBetSize: number
}

export interface StatisticsSummary {
  basic: AdvancedGameStats
  winRate: number
  averageBetSize: number
  returnOnInvestment: number
  strategyAccuracy: StrategyAccuracy
  bestTable: { level: TableLevel; winRate: number } | null
  bestVariant: { variant: GameVariant; winRate: number } | null
  currentSession: GameSession | null
}

interface StoredStatistics {
  basic: GameStats
  tables: Record<TableLevel, GameStats>
  variants: Record<GameVariant, GameStats>
  strategy: StrategyAccuracy
  sessions: GameSession[]
  dailyStats: Record<string, DailyStats>
}

export class StatsTracker {
  private stats: StoredStatistics
  private currentSession: GameSession | null = null
  private storageKey = 'blackjack_statistics'

  constructor() {
    this.stats = this.loadStats()
  }

  // Basic Statistics Methods
  getBasicStats(): GameStats {
    return { ...this.stats.basic }
  }

  getAdvancedStats(): AdvancedGameStats {
    const basic = this.stats.basic
    const winRate = basic.handsPlayed > 0 
      ? Math.round((basic.handsWon / basic.handsPlayed) * 100 * 100) / 100
      : 0

    // Calculate average bet size from total winnings and results
    const totalResults = basic.handsWon + basic.handsLost + basic.handsPushed
    const averageBetSize = totalResults > 0 
      ? Math.round(Math.abs(basic.totalWinnings) / totalResults * 100) / 100
      : 0

    return {
      ...basic,
      winRate,
      averageBetSize,
      biggestWin: 0, // TODO: Track these in future sessions
      biggestLoss: 0,
      longestWinStreak: 0,
      longestLoseStreak: 0,
      currentStreak: 0,
      currentStreakType: 'none'
    }
  }

  recordHandResult(
    result: 'win' | 'loss' | 'push',
    winnings: number,
    isBlackjack: boolean,
    tableLevel?: TableLevel,
    variant?: GameVariant
  ): void {
    // Update basic stats
    this.stats.basic.handsPlayed++
    
    if (result === 'win') {
      this.stats.basic.handsWon++
    } else if (result === 'loss') {
      this.stats.basic.handsLost++
    } else {
      this.stats.basic.handsPushed++
    }

    if (isBlackjack) {
      this.stats.basic.blackjacks++
    }

    this.stats.basic.totalWinnings += winnings

    // Update table-specific stats
    if (tableLevel) {
      this.updateTableStats(tableLevel, result, winnings, isBlackjack)
    }

    // Update variant-specific stats
    if (variant) {
      this.updateVariantStats(variant, result, winnings, isBlackjack)
    }

    // Update current session
    if (this.currentSession) {
      this.currentSession.handsPlayed++
      if (result === 'win') {
        this.currentSession.handsWon++
      } else if (result === 'loss') {
        this.currentSession.handsLost++
      } else {
        this.currentSession.handsPushed++
      }
      this.currentSession.netWinnings += winnings

      if (winnings > this.currentSession.biggestWin) {
        this.currentSession.biggestWin = winnings
      }
      if (winnings < this.currentSession.biggestLoss) {
        this.currentSession.biggestLoss = winnings
      }
    }

    // Update daily stats
    this.updateDailyStats(result, winnings)

    this.saveStats()
  }

  recordRoundStart(): void {
    this.stats.basic.roundsPlayed++
    this.saveStats()
  }

  recordLoanTaken(amount: number): void {
    this.stats.basic.loansTaken++
    this.saveStats()
  }

  // Table-specific Statistics
  getTableStats(tableLevel: TableLevel): GameStats {
    return this.stats.tables[tableLevel] || this.createEmptyStats()
  }

  private updateTableStats(
    tableLevel: TableLevel,
    result: 'win' | 'loss' | 'push',
    winnings: number,
    isBlackjack: boolean
  ): void {
    if (!this.stats.tables[tableLevel]) {
      this.stats.tables[tableLevel] = this.createEmptyStats()
    }

    const tableStats = this.stats.tables[tableLevel]
    tableStats.handsPlayed++
    
    if (result === 'win') {
      tableStats.handsWon++
    } else if (result === 'loss') {
      tableStats.handsLost++
    } else {
      tableStats.handsPushed++
    }

    if (isBlackjack) {
      tableStats.blackjacks++
    }

    tableStats.totalWinnings += winnings
  }

  // Variant-specific Statistics
  getVariantStats(variant: GameVariant): GameStats {
    return this.stats.variants[variant] || this.createEmptyStats()
  }

  private updateVariantStats(
    variant: GameVariant,
    result: 'win' | 'loss' | 'push',
    winnings: number,
    isBlackjack: boolean
  ): void {
    if (!this.stats.variants[variant]) {
      this.stats.variants[variant] = this.createEmptyStats()
    }

    const variantStats = this.stats.variants[variant]
    variantStats.handsPlayed++
    
    if (result === 'win') {
      variantStats.handsWon++
    } else if (result === 'loss') {
      variantStats.handsLost++
    } else {
      variantStats.handsPushed++
    }

    if (isBlackjack) {
      variantStats.blackjacks++
    }

    variantStats.totalWinnings += winnings
  }

  // Strategy Accuracy Tracking
  recordStrategyDecision(
    playerAction: GameAction,
    optimalAction: GameAction,
    isOptimal: boolean,
    playerTotal: number,
    dealerUpCard: number
  ): void {
    this.stats.strategy.totalDecisions++
    
    if (isOptimal) {
      this.stats.strategy.optimalDecisions++
    }

    // Track by action type
    if (!this.stats.strategy.byAction[playerAction]) {
      this.stats.strategy.byAction[playerAction] = { total: 0, optimal: 0 }
    }
    this.stats.strategy.byAction[playerAction].total++
    if (isOptimal) {
      this.stats.strategy.byAction[playerAction].optimal++
    }

    // Also track what the optimal action should have been
    if (playerAction !== optimalAction) {
      if (!this.stats.strategy.byAction[optimalAction]) {
        this.stats.strategy.byAction[optimalAction] = { total: 0, optimal: 0 }
      }
      this.stats.strategy.byAction[optimalAction].total++
      // Don't increment optimal since player didn't choose it
    }

    // Track by hand total
    if (!this.stats.strategy.byHandTotal[playerTotal]) {
      this.stats.strategy.byHandTotal[playerTotal] = { total: 0, optimal: 0 }
    }
    this.stats.strategy.byHandTotal[playerTotal].total++
    if (isOptimal) {
      this.stats.strategy.byHandTotal[playerTotal].optimal++
    }

    // Update accuracy percentage
    this.stats.strategy.accuracyPercentage = 
      Math.round((this.stats.strategy.optimalDecisions / this.stats.strategy.totalDecisions) * 100 * 100) / 100

    this.saveStats()
  }

  getStrategyAccuracy(): StrategyAccuracy {
    return { ...this.stats.strategy }
  }

  // Session Management
  startSession(tableLevel: TableLevel, variant: GameVariant): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      tableLevel,
      variant,
      handsPlayed: 0,
      handsWon: 0,
      handsLost: 0,
      handsPushed: 0,
      netWinnings: 0,
      biggestWin: 0,
      biggestLoss: 0
    }

    return sessionId
  }

  endSession(): GameSession | null {
    if (!this.currentSession) return null

    this.currentSession.endTime = Date.now()
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime

    // Save completed session
    this.stats.sessions.push({ ...this.currentSession })
    
    const completedSession = { ...this.currentSession }
    this.currentSession = null

    this.saveStats()
    return completedSession
  }

  getCurrentSession(): GameSession | null {
    return this.currentSession ? { ...this.currentSession } : null
  }

  // Performance Analysis
  getWinRate(): number {
    const stats = this.stats.basic
    return stats.handsPlayed > 0 
      ? Math.round((stats.handsWon / stats.handsPlayed) * 100 * 100) / 100
      : 0
  }

  getAverageBetSize(): number {
    const stats = this.stats.basic
    const totalResults = stats.handsWon + stats.handsLost + stats.handsPushed
    
    if (totalResults === 0) return 0
    
    // Estimate average bet from total winnings and results
    // This is approximate since we don't track individual bet sizes
    return Math.round(Math.abs(stats.totalWinnings) / totalResults * 100) / 100
  }

  getReturnOnInvestment(initialBankroll: number): number {
    if (initialBankroll <= 0) return 0
    
    const roi = (this.stats.basic.totalWinnings / initialBankroll) * 100
    return Math.round(roi * 100) / 100
  }

  getPerformanceTrends(days: number): PerformanceTrend[] {
    const trends: PerformanceTrend[] = []
    const today = startOfDay(new Date())

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dailyData = this.stats.dailyStats[dateStr]

      if (dailyData) {
        trends.push({
          date: dateStr,
          handsPlayed: dailyData.handsPlayed,
          winRate: dailyData.winRate,
          netWinnings: dailyData.netWinnings,
          averageBetSize: dailyData.handsPlayed > 0 
            ? Math.abs(dailyData.netWinnings) / dailyData.handsPlayed 
            : 0
        })
      }
    }

    return trends
  }

  private updateDailyStats(result: 'win' | 'loss' | 'push', winnings: number): void {
    const today = format(new Date(), 'yyyy-MM-dd')
    
    if (!this.stats.dailyStats[today]) {
      this.stats.dailyStats[today] = {
        date: today,
        handsPlayed: 0,
        handsWon: 0,
        handsLost: 0,
        handsPushed: 0,
        netWinnings: 0,
        winRate: 0,
        sessionsPlayed: 0
      }
    }

    const dayStats = this.stats.dailyStats[today]
    dayStats.handsPlayed++
    dayStats.netWinnings += winnings

    if (result === 'win') {
      dayStats.handsWon++
    } else if (result === 'loss') {
      dayStats.handsLost++
    } else {
      dayStats.handsPushed++
    }

    dayStats.winRate = dayStats.handsPlayed > 0 
      ? Math.round((dayStats.handsWon / dayStats.handsPlayed) * 100 * 100) / 100
      : 0
  }

  // Comprehensive Statistics Summary
  getStatisticsSummary(): StatisticsSummary {
    const advanced = this.getAdvancedStats()
    
    // Find best performing table
    let bestTable: { level: TableLevel; winRate: number } | null = null
    for (const [levelStr, stats] of Object.entries(this.stats.tables)) {
      const level = levelStr as TableLevel
      const winRate = stats.handsPlayed > 0 ? (stats.handsWon / stats.handsPlayed) * 100 : 0
      
      if (!bestTable || winRate > bestTable.winRate) {
        bestTable = { level, winRate: Math.round(winRate * 100) / 100 }
      }
    }

    // Find best performing variant
    let bestVariant: { variant: GameVariant; winRate: number } | null = null
    for (const [variantStr, stats] of Object.entries(this.stats.variants)) {
      const variant = variantStr as GameVariant
      const winRate = stats.handsPlayed > 0 ? (stats.handsWon / stats.handsPlayed) * 100 : 0
      
      if (!bestVariant || winRate > bestVariant.winRate) {
        bestVariant = { variant, winRate: Math.round(winRate * 100) / 100 }
      }
    }

    return {
      basic: advanced,
      winRate: this.getWinRate(),
      averageBetSize: this.getAverageBetSize(),
      returnOnInvestment: this.getReturnOnInvestment(1000), // Default ROI calculation
      strategyAccuracy: this.getStrategyAccuracy(),
      bestTable,
      bestVariant,
      currentSession: this.getCurrentSession()
    }
  }

  // Data Management
  exportData(): string {
    return JSON.stringify({
      ...this.stats,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }, null, 2)
  }

  importData(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData)
      
      // Validate basic structure
      if (!imported.basic || !imported.strategy) {
        return false
      }

      // Merge imported data with current structure
      this.stats = {
        basic: imported.basic || this.createEmptyStats(),
        tables: imported.tables || {},
        variants: imported.variants || {},
        strategy: imported.strategy || this.createEmptyStrategyStats(),
        sessions: imported.sessions || [],
        dailyStats: imported.dailyStats || {}
      }

      this.saveStats()
      return true
    } catch (error) {
      console.error('Failed to import statistics:', error)
      return false
    }
  }

  // Reset Methods
  resetAllStats(): void {
    this.stats = {
      basic: this.createEmptyStats(),
      tables: {},
      variants: {},
      strategy: this.createEmptyStrategyStats(),
      sessions: [],
      dailyStats: {}
    }
    
    this.currentSession = null
    this.saveStats()
  }

  resetTableStats(tableLevel: TableLevel): void {
    delete this.stats.tables[tableLevel]
    this.saveStats()
  }

  resetVariantStats(variant: GameVariant): void {
    delete this.stats.variants[variant]
    this.saveStats()
  }

  resetStrategyStats(): void {
    this.stats.strategy = this.createEmptyStrategyStats()
    this.saveStats()
  }

  // Persistence
  private saveStats(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.stats))
    } catch (error) {
      console.error('Failed to save statistics to localStorage:', error)
    }
  }

  private loadStats(): StoredStatistics {
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          basic: parsed.basic || this.createEmptyStats(),
          tables: parsed.tables || {},
          variants: parsed.variants || {},
          strategy: parsed.strategy || this.createEmptyStrategyStats(),
          sessions: parsed.sessions || [],
          dailyStats: parsed.dailyStats || {}
        }
      }
    } catch (error) {
      console.error('Failed to load statistics from localStorage:', error)
    }

    return {
      basic: this.createEmptyStats(),
      tables: {},
      variants: {},
      strategy: this.createEmptyStrategyStats(),
      sessions: [],
      dailyStats: {}
    }
  }

  // Helper Methods
  private createEmptyStats(): GameStats {
    return {
      handsPlayed: 0,
      roundsPlayed: 0,
      handsWon: 0,
      handsLost: 0,
      handsPushed: 0,
      blackjacks: 0,
      totalWinnings: 0,
      loansTaken: 0
    }
  }

  private createEmptyStrategyStats(): StrategyAccuracy {
    return {
      totalDecisions: 0,
      optimalDecisions: 0,
      accuracyPercentage: 0,
      byAction: {},
      byHandTotal: {}
    }
  }
}

// Global instance for easy access throughout the app
export const statsTracker = new StatsTracker()