# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-07-30-progression-variations/spec.md

> Created: 2025-07-30
> Version: 1.0.0

## Schema Changes

### New Data Structures

#### Player Progression Data (localStorage primary)
```typescript
interface PlayerProgression {
  currentLevel: TableLevel
  unlockedTables: TableLevel[]
  unlockedVariations: RuleVariation[]
  totalHandsPlayed: number
  totalWins: number
  totalLosses: number
  highestBankroll: number
  achievementsEarned: string[]
  statistics: PlayerStatistics
  createdAt: string
  lastUpdated: string
}

interface PlayerStatistics {
  winRateByTable: Record<TableLevel, WinRateStats>
  strategyAccuracy: number
  averageBetSize: number
  bestStreak: number
  worstStreak: number
  handsPerVariation: Record<RuleVariation, number>
  monthlyStats: Record<string, MonthlyStats>
}

interface WinRateStats {
  handsPlayed: number
  wins: number
  losses: number
  pushes: number
  winRate: number
  avgBetSize: number
}

interface MonthlyStats {
  handsPlayed: number
  netWinnings: number
  winRate: number
  hoursPlayed: number
}
```

#### Table Configuration
```typescript
interface TableConfig {
  level: TableLevel
  minBet: number
  maxBet: number
  theme: TableTheme
  unlockRequirements: UnlockRequirements
  backgroundMusic?: string
  description: string
}

interface UnlockRequirements {
  minHandsPlayed: number
  minWinRate: number
  minBankroll: number
  requiredAchievements?: string[]
}
```

#### Rule Variations
```typescript
interface RuleSet {
  name: RuleVariation
  dealerHitsSoft17: boolean
  doubleAfterSplit: boolean
  lateSurrender: boolean
  dealerPeeksBlackjack: boolean
  maxSplits: number
  splitAcesOnce: boolean
  blackjackPayout: number // 1.5 for 3:2, 1.2 for 6:5
  description: string
  unlockRequirements: UnlockRequirements
}
```

#### Achievement Definitions
```typescript
interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  requirements: AchievementRequirement[]
  badge: string // icon identifier
  points: number
  hidden: boolean // secret achievements
}

interface AchievementRequirement {
  type: 'hands_played' | 'win_streak' | 'strategy_accuracy' | 'bankroll' | 'specific_action'
  value: number
  timeframe?: 'session' | 'daily' | 'weekly' | 'all_time'
  conditions?: Record<string, any>
}
```

## Storage Strategy

### Primary Storage: localStorage
- Key: `blackjack_progression_v1`
- Contains complete PlayerProgression object
- Updated after each hand completion
- Versioned for migration compatibility

### Backup Storage: Firestore (Optional)
- Collection: `user_progression`
- Document ID: user auth ID or anonymous session ID
- Synced when user is authenticated
- Fallback for data recovery

### Migration Handling
```typescript
interface StorageVersion {
  version: number
  migrationDate: string
  changes: string[]
}

// Migration function for version updates
function migrateProgressionData(oldData: any, fromVersion: number): PlayerProgression {
  // Handle data structure changes between versions
  // Preserve user progress during updates
}
```

## Indexes and Performance

### localStorage Optimization
- Single object storage to minimize read/write operations
- Lazy loading of detailed statistics
- Compression for large datasets using JSON.stringify optimizations

### Firestore Indexes (if implemented)
- Composite index on userId + lastUpdated for sync operations
- Index on achievementsEarned array for achievement queries
- Index on currentLevel for progression analytics

## Data Integrity

### Validation Rules
- All monetary values stored as integers (cents) to avoid floating point errors
- Win rates calculated dynamically from base statistics
- Achievement progress validated against actual game history
- Table unlock status verified on each game session start

### Error Handling
- Graceful degradation if localStorage is unavailable
- Default progression state for new players
- Data validation on load with automatic repair for corruption
- Backup creation before major progression updates