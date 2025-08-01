export interface BankrollChallenge {
  id: string
  name: string
  description: string
  targetAmount: number
  startingChips: number
  timeLimit?: number // in minutes, undefined means no time limit
  maxBet?: number
  minBet?: number
  allowedActions?: GameAction[]
  specialRules?: string[]
  reward: {
    chips: number
    achievement?: string
  }
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  unlockRequirement: {
    type: 'chips' | 'wins' | 'achievement' | 'level'
    value: number | string
  }
}

export type GameAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance'

export interface ChallengeProgress {
  challengeId: string
  isActive: boolean
  startTime?: number
  currentChips: number
  handsPlayed: number
  isCompleted: boolean
  bestAttempt: number
}

export interface ChallengeResult {
  success: boolean
  finalAmount: number
  timeUsed?: number
  handsPlayed: number
  reward?: {
    chips: number
    achievement?: string
  }
}

// Define available challenges
export const BANKROLL_CHALLENGES: BankrollChallenge[] = [
  {
    id: 'double-or-nothing',
    name: 'Double or Nothing',
    description: 'Double your starting bankroll of $100 to reach $200',
    targetAmount: 200,
    startingChips: 100,
    timeLimit: 30,
    difficulty: 'easy',
    unlockRequirement: {
      type: 'chips',
      value: 500
    },
    reward: {
      chips: 50,
      achievement: 'First Challenge'
    }
  },
  {
    id: 'conservative-growth',
    name: 'Conservative Growth',
    description: 'Grow $250 to $400 using only minimum bets ($5)',
    targetAmount: 400,
    startingChips: 250,
    maxBet: 5,
    minBet: 5,
    difficulty: 'medium',
    unlockRequirement: {
      type: 'wins',
      value: 50
    },
    reward: {
      chips: 100,
      achievement: 'Conservative Player'
    }
  },
  {
    id: 'high-roller',
    name: 'High Roller Challenge',
    description: 'Turn $500 into $1000 with minimum $25 bets',
    targetAmount: 1000,
    startingChips: 500,
    minBet: 25,
    timeLimit: 20,
    difficulty: 'hard',
    unlockRequirement: {
      type: 'chips',
      value: 1000
    },
    reward: {
      chips: 250,
      achievement: 'High Roller'
    }
  },
  {
    id: 'no-double-down',
    name: 'Basic Strategy Only',
    description: 'Reach $300 from $150 without doubling down or splitting',
    targetAmount: 300,
    startingChips: 150,
    allowedActions: ['hit', 'stand', 'surrender', 'insurance'],
    difficulty: 'medium',
    unlockRequirement: {
      type: 'achievement',
      value: 'Strategy Master'
    },
    reward: {
      chips: 75,
      achievement: 'Purist'
    }
  },
  {
    id: 'time-pressure',
    name: 'Beat the Clock',
    description: 'Reach $400 from $200 in just 10 minutes',
    targetAmount: 400,
    startingChips: 200,
    timeLimit: 10,
    difficulty: 'hard',
    unlockRequirement: {
      type: 'level',
      value: 3
    },
    reward: {
      chips: 150,
      achievement: 'Speed Demon'
    }
  },
  {
    id: 'comeback-kid',
    name: 'The Comeback',
    description: 'Recover from $50 to reach $300',
    targetAmount: 300,
    startingChips: 50,
    specialRules: ['No loans allowed'],
    difficulty: 'expert',
    unlockRequirement: {
      type: 'achievement',
      value: 'Bankrupt Recovery'
    },
    reward: {
      chips: 200,
      achievement: 'Comeback Kid'
    }
  },
  {
    id: 'perfect-strategy',
    name: 'Perfect Strategy Challenge',
    description: 'Reach $350 from $200 with 95%+ strategy accuracy',
    targetAmount: 350,
    startingChips: 200,
    specialRules: ['Must maintain 95% strategy accuracy'],
    difficulty: 'expert',
    unlockRequirement: {
      type: 'achievement',
      value: 'Perfect Strategist'
    },
    reward: {
      chips: 175,
      achievement: 'Flawless Execution'
    }
  }
]

export class BankrollChallengeEngine {
  private challenges: Map<string, BankrollChallenge> = new Map()
  private progress: Map<string, ChallengeProgress> = new Map()

  constructor() {
    BANKROLL_CHALLENGES.forEach(challenge => {
      this.challenges.set(challenge.id, challenge)
    })
    this.loadProgress()
  }

  private loadProgress() {
    try {
      const saved = localStorage.getItem('bankroll-challenge-progress')
      if (saved) {
        const data = JSON.parse(saved)
        Object.entries(data).forEach(([id, progress]) => {
          this.progress.set(id, progress as ChallengeProgress)
        })
      }
    } catch (error) {
      console.warn('Failed to load challenge progress:', error)
    }
  }

  private saveProgress() {
    try {
      const data: Record<string, ChallengeProgress> = {}
      this.progress.forEach((progress, id) => {
        data[id] = progress
      })
      localStorage.setItem('bankroll-challenge-progress', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save challenge progress:', error)
    }
  }

  getAvailableChallenges(playerStats: any): BankrollChallenge[] {
    return BANKROLL_CHALLENGES.filter(challenge => 
      this.isChallengeUnlocked(challenge, playerStats)
    )
  }

  getAllChallenges(): BankrollChallenge[] {
    return [...BANKROLL_CHALLENGES]
  }

  private isChallengeUnlocked(challenge: BankrollChallenge, playerStats: any): boolean {
    const req = challenge.unlockRequirement
    
    switch (req.type) {
      case 'chips':
        return playerStats.maxChips >= req.value
      case 'wins':
        return playerStats.handsWon >= req.value
      case 'level':
        return playerStats.currentTableLevel >= req.value
      case 'achievement':
        return playerStats.achievements?.includes(req.value) || false
      default:
        return true
    }
  }

  startChallenge(challengeId: string): BankrollChallenge | null {
    const challenge = this.challenges.get(challengeId)
    if (!challenge) return null

    const progress: ChallengeProgress = {
      challengeId,
      isActive: true,
      startTime: Date.now(),
      currentChips: challenge.startingChips,
      handsPlayed: 0,
      isCompleted: false,
      bestAttempt: this.progress.get(challengeId)?.bestAttempt || 0
    }

    this.progress.set(challengeId, progress)
    this.saveProgress()
    return challenge
  }

  updateChallengeProgress(challengeId: string, newChips: number, handsPlayed: number): ChallengeResult | null {
    const challenge = this.challenges.get(challengeId)
    const progress = this.progress.get(challengeId)
    
    if (!challenge || !progress || !progress.isActive) return null

    progress.currentChips = newChips
    progress.handsPlayed = handsPlayed
    progress.bestAttempt = Math.max(progress.bestAttempt, newChips)

    // Check for completion
    const success = newChips >= challenge.targetAmount
    const timeUp = challenge.timeLimit && 
      ((Date.now() - (progress.startTime || 0)) / 1000 / 60) >= challenge.timeLimit

    if (success || timeUp || newChips <= 0) {
      progress.isActive = false
      progress.isCompleted = success

      const result: ChallengeResult = {
        success,
        finalAmount: newChips,
        timeUsed: progress.startTime ? (Date.now() - progress.startTime) / 1000 / 60 : undefined,
        handsPlayed: progress.handsPlayed,
        reward: success ? challenge.reward : undefined
      }

      this.saveProgress()
      return result
    }

    this.saveProgress()
    return null
  }

  getChallengeProgress(challengeId: string): ChallengeProgress | null {
    return this.progress.get(challengeId) || null
  }

  getActiveChallenge(): { challenge: BankrollChallenge; progress: ChallengeProgress } | null {
    for (const [id, progress] of this.progress.entries()) {
      if (progress.isActive) {
        const challenge = this.challenges.get(id)
        if (challenge) {
          return { challenge, progress }
        }
      }
    }
    return null
  }

  abandonChallenge(challengeId: string): void {
    const progress = this.progress.get(challengeId)
    if (progress) {
      progress.isActive = false
      this.saveProgress()
    }
  }

  isActionAllowed(challengeId: string, action: GameAction): boolean {
    const challenge = this.challenges.get(challengeId)
    if (!challenge || !challenge.allowedActions) return true
    
    return challenge.allowedActions.includes(action)
  }

  isBetAllowed(challengeId: string, betAmount: number): boolean {
    const challenge = this.challenges.get(challengeId)
    if (!challenge) return true

    if (challenge.minBet && betAmount < challenge.minBet) return false
    if (challenge.maxBet && betAmount > challenge.maxBet) return false

    return true
  }

  getCompletedChallenges(): string[] {
    const completed: string[] = []
    this.progress.forEach((progress, id) => {
      if (progress.isCompleted) {
        completed.push(id)
      }
    })
    return completed
  }

  resetChallenge(challengeId: string): void {
    this.progress.delete(challengeId)
    this.saveProgress()
  }

  resetAllChallenges(): void {
    this.progress.clear()
    this.saveProgress()
  }
}

// Create global instance
export const bankrollChallengeEngine = new BankrollChallengeEngine()