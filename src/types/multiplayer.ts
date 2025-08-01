import { GameState, Player, Hand } from './game'

export interface MultiplayerPlayer extends Player {
  userId: string // Firebase user ID
  isHost: boolean
  isConnected: boolean
  lastSeen: number // Timestamp
  avatar?: string
  splitHand?: Hand // For split hands
  isPlayingMainHand: boolean // Track which hand is active during split
  lastHandWinnings?: number // Track winnings from last hand
}

export interface GameTable {
  id: string
  name: string
  hostUserId: string
  maxPlayers: number // 1-4 players
  currentPlayers: number
  isPrivate: boolean
  password?: string
  tableCode: string // 6-character code for easy joining
  status: 'waiting' | 'playing' | 'finished'
  createdAt: number
  settings: TableSettings
}

export interface TableSettings {
  // Betting limits
  minBet: number
  maxBet: number
  startingChips: number
  
  // Game variant rules
  gameVariant: 'vegas' | 'european' | 'atlantic_city' | 'custom'
  dealerStandsOn17: boolean
  doubleAfterSplit: boolean
  surrenderAllowed: boolean
  insuranceAllowed: boolean
  blackjackPayout: number // e.g., 1.5 for 3:2, 1.2 for 6:5
  maxSplits: number // 0-3
  doubleOnAnyTwoCards: boolean
  doubleAfterSplitAces: boolean
  
  // Table experience
  dealerSpeed: 'slow' | 'normal' | 'fast'
  showStrategyHints: boolean
  allowSpectators: boolean
  
  // Time limits
  playerActionTimeLimit: number // seconds, 0 = no limit
  maxGameDuration: number // minutes, 0 = no limit
}

export interface MultiplayerGameState extends Omit<GameState, 'players'> {
  tableId: string
  players: MultiplayerPlayer[]
  hostUserId: string
  spectators: string[] // User IDs of spectators
  messages: ChatMessage[]
  lastAction: GameAction | null
  lastActionPlayerId: string | null
  lastActionTimestamp: number
  playerConnections: Record<string, boolean> // Track active connections
}

export interface ChatMessage {
  id: string
  userId: string
  playerName: string
  message: string
  timestamp: number
  type: 'chat' | 'system' | 'action'
}

export interface PlayerAction {
  playerId: string
  action: GameAction
  timestamp: number
  bet?: number
}

export interface GameEvent {
  type: 'player_joined' | 'player_left' | 'game_started' | 'player_action' | 'round_ended' | 'chat_message'
  payload: any
  timestamp: number
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface MultiplayerState {
  connectionStatus: ConnectionStatus
  currentTable: GameTable | null
  currentGame: MultiplayerGameState | null
  availableTables: GameTable[]
  isHost: boolean
  userId: string
  playerName: string
}