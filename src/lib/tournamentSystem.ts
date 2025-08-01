export interface Tournament {
  id: string
  name: string
  description: string
  type: 'elimination' | 'leaderboard' | 'survival'
  maxParticipants: number
  entryFee: number
  prizePool: number
  startTime: number
  duration: number // in minutes
  status: 'waiting' | 'active' | 'finished'
  participants: TournamentParticipant[]
  rules: TournamentRules
  currentRound?: number
  totalRounds?: number
}

export interface TournamentParticipant {
  playerId: string
  playerName: string
  chips: number
  isEliminated: boolean
  finalPosition?: number
  joinedAt: number
  lastActiveAt: number
}

export interface TournamentRules {
  startingChips: number
  blindsStructure: BlindLevel[]
  eliminationCondition: 'bankruptcy' | 'time_limit' | 'chip_count'
  minBet: number
  maxBet?: number
  allowedActions?: string[]
  gameVariant: string
  tableLevel: string
}

export interface BlindLevel {
  level: number
  duration: number // in minutes
  ante: number
  minBet: number
}

export interface TournamentResult {
  tournamentId: string
  participantResults: ParticipantResult[]
  winner: string
  totalPrizePool: number
  duration: number
}

export interface ParticipantResult {
  playerId: string
  playerName: string
  finalPosition: number
  finalChips: number
  handsPlayed: number
  prize: number
}

// Predefined tournament templates
export const TOURNAMENT_TEMPLATES: Tournament[] = [
  {
    id: 'quickfire-elimination',
    name: 'Quickfire Elimination',
    description: 'Fast-paced 8-player elimination tournament. Last player standing wins!',
    type: 'elimination',
    maxParticipants: 8,
    entryFee: 100,
    prizePool: 800,
    startTime: 0,
    duration: 30,
    status: 'waiting',
    participants: [],
    currentRound: 1,
    totalRounds: 3,
    rules: {
      startingChips: 500,
      blindsStructure: [
        { level: 1, duration: 10, ante: 5, minBet: 10 },
        { level: 2, duration: 10, ante: 10, minBet: 20 },
        { level: 3, duration: 10, ante: 25, minBet: 50 }
      ],
      eliminationCondition: 'bankruptcy',
      minBet: 10,
      gameVariant: 'vegas',
      tableLevel: 'beginner'
    }
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: '16-player leaderboard tournament. Highest chip count after 45 minutes wins!',
    type: 'leaderboard',
    maxParticipants: 16,
    entryFee: 200,
    prizePool: 3200,
    startTime: 0,
    duration: 45,
    status: 'waiting',
    participants: [],
    rules: {
      startingChips: 1000,
      blindsStructure: [
        { level: 1, duration: 15, ante: 5, minBet: 10 },
        { level: 2, duration: 15, ante: 10, minBet: 25 },
        { level: 3, duration: 15, ante: 20, minBet: 50 }
      ],
      eliminationCondition: 'time_limit',
      minBet: 10,
      maxBet: 100,
      gameVariant: 'european',
      tableLevel: 'intermediate'
    }
  },
  {
    id: 'high-stakes-showdown',
    name: 'High Stakes Showdown',
    description: 'Elite 6-player tournament for experienced players. Winner takes 60% of prize pool!',
    type: 'elimination',
    maxParticipants: 6,
    entryFee: 500,
    prizePool: 3000,
    startTime: 0,
    duration: 60,
    status: 'waiting',
    participants: [],
    currentRound: 1,
    totalRounds: 5,
    rules: {
      startingChips: 2000,
      blindsStructure: [
        { level: 1, duration: 12, ante: 10, minBet: 25 },
        { level: 2, duration: 12, ante: 25, minBet: 50 },
        { level: 3, duration: 12, ante: 50, minBet: 100 },
        { level: 4, duration: 12, ante: 100, minBet: 200 },
        { level: 5, duration: 12, ante: 200, minBet: 400 }
      ],
      eliminationCondition: 'bankruptcy',
      minBet: 25,
      allowedActions: ['hit', 'stand', 'double', 'split'], // No surrender or insurance
      gameVariant: 'atlantic_city',
      tableLevel: 'professional'
    }
  },
  {
    id: 'survival-challenge',
    name: 'Survival Challenge',
    description: 'Survive 12 rounds with increasing difficulty. Starting chips decrease each round!',
    type: 'survival',
    maxParticipants: 12,
    entryFee: 150,
    prizePool: 1800,
    startTime: 0,
    duration: 40,
    status: 'waiting',
    participants: [],
    currentRound: 1,
    totalRounds: 12,
    rules: {
      startingChips: 300, // Decreases each round
      blindsStructure: [
        { level: 1, duration: 3, ante: 5, minBet: 15 },
        { level: 2, duration: 3, ante: 10, minBet: 25 },
        { level: 3, duration: 3, ante: 15, minBet: 35 }
      ],
      eliminationCondition: 'chip_count',
      minBet: 15,
      gameVariant: 'vegas',
      tableLevel: 'intermediate'
    }
  }
]

export class TournamentEngine {
  private tournaments: Map<string, Tournament> = new Map()
  private activeTournament: Tournament | null = null
  private tournamentHistory: TournamentResult[] = []

  constructor() {
    this.loadTournamentHistory()
    this.initializeDefaultTournaments()
  }
  
  private initializeDefaultTournaments() {
    // Create some default tournaments if none exist
    if (this.tournaments.size === 0) {
      // Create one tournament from each template to start with
      TOURNAMENT_TEMPLATES.forEach((template, index) => {
        console.log(`Creating tournament ${index + 1}:`, {
          name: template.name,
          entryFee: template.entryFee,
          type: template.type
        })
        if (index < 4) { // Create first 4 templates including survival challenge
          const created = this.createTournament(template)
          console.log(`Created tournament:`, {
            id: created.id,
            name: created.name,
            entryFee: created.entryFee,
            status: created.status
          })
        }
      })
      console.log(`Total tournaments created: ${this.tournaments.size}`)
    }
  }

  private loadTournamentHistory() {
    try {
      const saved = localStorage.getItem('tournament-history')
      if (saved) {
        this.tournamentHistory = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load tournament history:', error)
    }
  }

  private saveTournamentHistory() {
    try {
      localStorage.setItem('tournament-history', JSON.stringify(this.tournamentHistory))
    } catch (error) {
      console.warn('Failed to save tournament history:', error)
    }
  }

  createTournament(template: Tournament): Tournament {
    const tournament: Tournament = {
      ...template,
      id: `tournament-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      participants: [],
      status: 'waiting'
    }
    
    this.tournaments.set(tournament.id, tournament)
    return tournament
  }

  joinTournament(tournamentId: string, playerId: string, playerName: string, playerChips: number): boolean {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament || tournament.status !== 'waiting') return false
    
    if (tournament.participants.length >= tournament.maxParticipants) return false
    if (playerChips < tournament.entryFee) return false
    
    // Check if player is already in tournament
    if (tournament.participants.some(p => p.playerId === playerId)) return false
    
    const participant: TournamentParticipant = {
      playerId,
      playerName,
      chips: tournament.rules.startingChips,
      isEliminated: false,
      joinedAt: Date.now(),
      lastActiveAt: Date.now()
    }
    
    tournament.participants.push(participant)
    return true
  }

  leaveTournament(tournamentId: string, playerId: string): boolean {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament || tournament.status === 'active') return false
    
    tournament.participants = tournament.participants.filter(p => p.playerId !== playerId)
    return true
  }

  startTournament(tournamentId: string): boolean {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament || tournament.status !== 'waiting') return false
    if (tournament.participants.length < 2) return false
    
    tournament.status = 'active'
    tournament.startTime = Date.now()
    this.activeTournament = tournament
    
    return true
  }

  updateParticipantChips(tournamentId: string, playerId: string, newChips: number): void {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament || tournament.status !== 'active') return
    
    const participant = tournament.participants.find(p => p.playerId === playerId)
    if (!participant || participant.isEliminated) return
    
    participant.chips = newChips
    participant.lastActiveAt = Date.now()
    
    // Check for elimination
    if (tournament.rules.eliminationCondition === 'bankruptcy' && newChips <= 0) {
      this.eliminateParticipant(tournamentId, playerId)
    }
  }

  eliminateParticipant(tournamentId: string, playerId: string): void {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament) return
    
    const participant = tournament.participants.find(p => p.playerId === playerId)
    if (!participant || participant.isEliminated) return
    
    participant.isEliminated = true
    const remainingPlayers = tournament.participants.filter(p => !p.isEliminated)
    participant.finalPosition = remainingPlayers.length + 1
    
    // Check if tournament should end
    if (remainingPlayers.length <= 1) {
      this.finishTournament(tournamentId)
    }
  }

  finishTournament(tournamentId: string): TournamentResult | null {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament) return null
    
    tournament.status = 'finished'
    const endTime = Date.now()
    const duration = (endTime - tournament.startTime) / 1000 / 60 // in minutes
    
    // Assign final positions for remaining players
    const remainingPlayers = tournament.participants.filter(p => !p.isEliminated)
    remainingPlayers.sort((a, b) => b.chips - a.chips) // Sort by chips descending
    
    remainingPlayers.forEach((participant, index) => {
      participant.finalPosition = index + 1
      participant.isEliminated = true
    })
    
    // Calculate prizes
    const prizeDistribution = this.calculatePrizeDistribution(tournament)
    const participantResults: ParticipantResult[] = tournament.participants.map(p => ({
      playerId: p.playerId,
      playerName: p.playerName,
      finalPosition: p.finalPosition!,
      finalChips: p.chips,
      handsPlayed: 0, // This would be tracked during play
      prize: prizeDistribution[p.finalPosition! - 1] || 0
    }))
    
    const winner = participantResults.find(p => p.finalPosition === 1)!
    
    const result: TournamentResult = {
      tournamentId,
      participantResults,
      winner: winner.playerName,
      totalPrizePool: tournament.prizePool,
      duration
    }
    
    this.tournamentHistory.push(result)
    this.saveTournamentHistory()
    
    if (this.activeTournament?.id === tournamentId) {
      this.activeTournament = null
    }
    
    return result
  }

  private calculatePrizeDistribution(tournament: Tournament): number[] {
    const total = tournament.prizePool
    const playerCount = tournament.participants.length
    
    if (playerCount === 1) return [total]
    if (playerCount === 2) return [total * 0.7, total * 0.3]
    if (playerCount <= 4) return [total * 0.5, total * 0.3, total * 0.2]
    if (playerCount <= 8) return [total * 0.4, total * 0.25, total * 0.15, total * 0.1, ...Array(playerCount - 4).fill(total * 0.1 / (playerCount - 4))]
    
    // For larger tournaments
    const prizes = [
      total * 0.35, // 1st
      total * 0.20, // 2nd  
      total * 0.15, // 3rd
      total * 0.10, // 4th
      total * 0.08, // 5th
      total * 0.07, // 6th
      total * 0.05  // 7th
    ]
    
    // Distribute remaining among other positions
    const remaining = total - prizes.reduce((sum, prize) => sum + prize, 0)
    const otherPositions = playerCount - prizes.length
    if (otherPositions > 0) {
      const otherPrize = remaining / otherPositions
      prizes.push(...Array(otherPositions).fill(otherPrize))
    }
    
    return prizes
  }

  getCurrentBlinds(tournamentId: string): BlindLevel | null {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament || tournament.status !== 'active') return null
    
    const elapsed = (Date.now() - tournament.startTime) / 1000 / 60 // in minutes
    let currentLevel = 1
    let timeInLevel = elapsed
    
    for (const blind of tournament.rules.blindsStructure) {
      if (timeInLevel <= blind.duration) {
        return { ...blind, level: currentLevel }
      }
      timeInLevel -= blind.duration
      currentLevel++
    }
    
    // Return last blind level if time exceeded
    const lastBlind = tournament.rules.blindsStructure[tournament.rules.blindsStructure.length - 1]
    return { ...lastBlind, level: tournament.rules.blindsStructure.length }
  }

  getActiveTournament(): Tournament | null {
    return this.activeTournament
  }

  getTournament(tournamentId: string): Tournament | null {
    return this.tournaments.get(tournamentId) || null
  }

  getAvailableTournaments(playerChips?: number): Tournament[] {
    const waitingTournaments = Array.from(this.tournaments.values()).filter(t => t.status === 'waiting')
    
    console.log('=== TOURNAMENT FILTERING DEBUG ===', {
      playerChips,
      totalTournaments: this.tournaments.size,
      waitingTournaments: waitingTournaments.map(t => ({
        name: t.name,
        entryFee: t.entryFee,
        status: t.status,
        canAfford: playerChips !== undefined ? playerChips >= t.entryFee : 'no filter',
        comparison: playerChips !== undefined ? `${playerChips} >= ${t.entryFee} = ${playerChips >= t.entryFee}` : 'no comparison'
      }))
    })
    
    // If playerChips is provided, filter by affordability  
    if (playerChips !== undefined) {
      const affordableTournaments = waitingTournaments.filter(t => {
        const canAfford = playerChips >= t.entryFee
        console.log(`Filtering ${t.name}: $${playerChips} >= $${t.entryFee} = ${canAfford}`)
        return canAfford
      })
      console.log('FINAL RESULT - Affordable tournaments:', affordableTournaments.map(t => `${t.name} ($${t.entryFee})`))
      return affordableTournaments
    }
    
    return waitingTournaments
  }

  getTournamentHistory(): TournamentResult[] {
    return [...this.tournamentHistory].reverse() // Most recent first
  }

  getPlayerTournamentStats(playerId: string): {
    tournamentsPlayed: number
    wins: number
    topThree: number
    totalPrizes: number
    bestFinish: number
  } {
    const playerResults = this.tournamentHistory
      .flatMap(t => t.participantResults)
      .filter(p => p.playerId === playerId)
    
    return {
      tournamentsPlayed: playerResults.length,
      wins: playerResults.filter(p => p.finalPosition === 1).length,
      topThree: playerResults.filter(p => p.finalPosition <= 3).length,
      totalPrizes: playerResults.reduce((sum, p) => sum + p.prize, 0),
      bestFinish: playerResults.length > 0 ? Math.min(...playerResults.map(p => p.finalPosition)) : 0
    }
  }
}

// Global tournament engine instance
export const tournamentEngine = new TournamentEngine()