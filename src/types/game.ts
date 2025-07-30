export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  suit: Suit
  rank: Rank
  hidden?: boolean
}

export interface Hand {
  cards: Card[]
  value: number
  isSoft: boolean
  isBlackjack: boolean
  isBusted: boolean
}

export interface Player {
  id: string
  name: string
  chips: number
  hand: Hand
  bet: number
  canDouble: boolean
  canSplit: boolean
  hasSplit: boolean
  splitHand?: Hand
  position: number
  lastHandWinnings?: number
  isPlayingMainHand?: boolean // Track which hand is active in split
}

export interface GameState {
  deck: Card[]
  players: Player[]
  dealer: Hand
  currentPlayerIndex: number
  phase: 'betting' | 'dealing' | 'playing' | 'dealer' | 'finished'
  round: number
}

export type GameAction = 'hit' | 'stand' | 'double' | 'split'

export type GameMode = 'menu' | 'normal' | 'tutorial' | 'easy' | 'stats' | 'reset' | 'help' | 'multiplayer'

export interface ChipDenomination {
  value: number
  color: string
  label: string
}

export interface GameStats {
  handsPlayed: number // Individual hands (split hands count as separate hands)
  roundsPlayed: number // Complete betting rounds (splitting counts as one round)
  handsWon: number
  handsLost: number
  handsPushed: number
  blackjacks: number
  totalWinnings: number
  loansTaken: number
}

// Re-export table system types for convenience
export { 
  TableLevel, 
  TableConfiguration, 
  TableRequirements, 
  TableTheme 
} from '../lib/tableSystem'