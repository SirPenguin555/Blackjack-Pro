// Simplified types for Cloud Functions (avoid importing from main app)

export interface Hand {
  cards: Card[]
  value: number
  isSoft: boolean
  isBlackjack: boolean
  isBusted: boolean
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
  hidden?: boolean
}

export interface MultiplayerPlayer {
  id: string
  userId: string
  name: string
  chips: number
  hand: Hand
  bet: number
  canDouble: boolean
  canSplit: boolean
  hasSplit: boolean
  splitHand?: Hand
  isPlayingMainHand: boolean
  lastHandWinnings?: number
  position: number
  isHost: boolean
  isConnected: boolean
  lastSeen: number
}

export interface MultiplayerGameState {
  tableId: string
  deck: Card[]
  players: MultiplayerPlayer[]
  dealer: Hand
  currentPlayerIndex: number
  phase: 'betting' | 'dealing' | 'playing' | 'dealer' | 'finished'
  round: number
  hostUserId: string
  spectators: string[]
  messages: any[]
  lastAction: string | null
  lastActionPlayerId: string | null
  lastActionTimestamp: number
  playerConnections: Record<string, boolean>
}