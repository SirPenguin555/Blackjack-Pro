import { create } from 'zustand'
import {
  MultiplayerState,
  GameTable,
  MultiplayerGameState,
  TableSettings,
  ConnectionStatus,
  ChatMessage
} from '@/types/multiplayer'
import { GameAction } from '@/types/game'
import { MultiplayerGameEngine } from '@/lib/multiplayerGameEngine'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

interface MultiplayerStore extends MultiplayerState {
  // Service instance
  service: MultiplayerService

  // Actions
  createTable: (name: string, maxPlayers: number, settings: TableSettings, isPrivate?: boolean, password?: string) => Promise<string>
  joinTable: (tableId: string, playerName: string, password?: string) => Promise<void>
  leaveTable: () => Promise<void>
  sendChatMessage: (message: string) => Promise<void>
  setConnectionStatus: (status: ConnectionStatus) => void
  setCurrentTable: (table: GameTable | null) => void
  setCurrentGame: (game: MultiplayerGameState | null) => void
  setAvailableTables: (tables: GameTable[]) => void
  setPlayerName: (name: string) => void
  
  // Game actions
  placeBet: (amount: number) => Promise<void>
  playerAction: (action: GameAction) => Promise<void>
  startNewRound: () => Promise<void>
  
  // Initialize multiplayer system
  initialize: () => void
  cleanup: () => void
}

const defaultTableSettings: TableSettings = {
  // Betting limits
  minBet: 5,
  maxBet: 500,
  startingChips: 1000,
  
  // Game variant rules
  gameVariant: 'vegas',
  dealerStandsOn17: true,
  doubleAfterSplit: true,
  surrenderAllowed: false,
  insuranceAllowed: true,
  blackjackPayout: 1.5, // 3:2
  maxSplits: 3,
  doubleOnAnyTwoCards: true,
  doubleAfterSplitAces: false,
  
  // Table experience
  dealerSpeed: 'normal',
  showStrategyHints: false,
  allowSpectators: true,
  
  // Time limits
  playerActionTimeLimit: 30, // 30 seconds
  maxGameDuration: 0 // No limit
}

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  // Initial state
  connectionStatus: 'disconnected',
  currentTable: null,
  currentGame: null,
  availableTables: [],
  isHost: false,
  userId: '',
  playerName: '',
  
  // Service instance (initialized lazily)
  service: null as any,

  // Actions
  createTable: async (name: string, maxPlayers: number, settings: TableSettings, isPrivate = false, password?: string) => {
    const { service } = get()
    
    if (!service) {
      throw new Error('Multiplayer service not initialized')
    }
    
    try {
      set({ connectionStatus: 'connecting' })
      const tableId = await service.createTable(name, maxPlayers, settings, isPrivate, password)
      
      // Initialize the game for this table
      await service.initializeGame(tableId, settings)
      
      // Subscribe to table and game updates
      const tableUnsubscribe = service.subscribeToTable(tableId, (table) => {
        set({ currentTable: table })
      })
      
      const gameUnsubscribe = service.subscribeToGame(tableId, (game) => {
        set({ currentGame: game })
      })
      
      // Store unsubscribe functions for cleanup
      service.tableUnsubscribe = tableUnsubscribe
      service.gameUnsubscribe = gameUnsubscribe
      
      set({ 
        connectionStatus: 'connected',
        isHost: true 
      })
      
      return tableId
    } catch (error) {
      console.error('Failed to create table:', error)
      set({ connectionStatus: 'error' })
      throw error
    }
  },

  joinTable: async (tableId: string, playerName: string, password?: string) => {
    const { service } = get()
    
    if (!service) {
      throw new Error('Multiplayer service not initialized')
    }
    
    try {
      set({ connectionStatus: 'connecting' })
      await service.joinTable(tableId, playerName, password)
      
      // Subscribe to table and game updates
      const tableUnsubscribe = service.subscribeToTable(tableId, (table) => {
        set({ currentTable: table })
      })
      
      const gameUnsubscribe = service.subscribeToGame(tableId, (game) => {
        set({ currentGame: game })
      })
      
      // Store unsubscribe functions for cleanup
      service.tableUnsubscribe = tableUnsubscribe
      service.gameUnsubscribe = gameUnsubscribe
      
      set({ 
        connectionStatus: 'connected',
        playerName,
        isHost: false
      })
    } catch (error) {
      console.error('Failed to join table:', error)
      set({ connectionStatus: 'error' })
      throw error
    }
  },

  leaveTable: async () => {
    const { service, currentTable } = get()
    
    if (!currentTable || !service) return
    
    try {
      await service.leaveTable(currentTable.id)
      
      // Clean up subscriptions
      if (service.tableUnsubscribe) {
        service.tableUnsubscribe()
        service.tableUnsubscribe = null
      }
      if (service.gameUnsubscribe) {
        service.gameUnsubscribe()
        service.gameUnsubscribe = null
      }
      
      set({
        currentTable: null,
        currentGame: null,
        connectionStatus: 'disconnected',
        isHost: false
      })
    } catch (error) {
      console.error('Failed to leave table:', error)
      throw error
    }
  },

  sendChatMessage: async (message: string) => {
    const { service, currentTable } = get()
    
    if (!currentTable || !service) return
    
    try {
      await service.sendChatMessage(currentTable.id, message)
    } catch (error) {
      console.error('Failed to send chat message:', error)
      throw error
    }
  },

  setConnectionStatus: (status: ConnectionStatus) => {
    set({ connectionStatus: status })
  },

  setCurrentTable: (table: GameTable | null) => {
    set({ currentTable: table })
  },

  setCurrentGame: (game: MultiplayerGameState | null) => {
    set({ currentGame: game })
  },

  setAvailableTables: (tables: GameTable[]) => {
    set({ availableTables: tables })
  },

  setPlayerName: (name: string) => {
    set({ playerName: name })
  },

  placeBet: async (amount: number) => {
    const { service, currentTable, currentGame, userId } = get()
    
    if (!currentTable || !currentGame || !service) {
      throw new Error('No active table or game')
    }
    
    try {
      // Process bet through game engine
      const updatedGameState = MultiplayerGameEngine.processBet(currentGame, userId, amount)
      
      // Update Firestore
      const gameRef = doc(db, 'games', currentTable.id)
      await updateDoc(gameRef, updatedGameState)
      
      // Check if all players have bet and start dealing
      const playersWithBets = updatedGameState.players.filter(p => p.bet > 0)
      if (playersWithBets.length === updatedGameState.players.length) {
        const dealingState = MultiplayerGameEngine.startDealing(updatedGameState)
        await updateDoc(gameRef, dealingState)
      }
    } catch (error) {
      console.error('Failed to place bet:', error)
      throw error
    }
  },

  playerAction: async (action: GameAction) => {
    const { service, currentTable, currentGame, userId } = get()
    
    if (!currentTable || !currentGame || !service) {
      throw new Error('No active table or game')
    }
    
    try {
      // Process action through game engine
      let updatedGameState = MultiplayerGameEngine.processPlayerAction(currentGame, userId, action)
      
      // If we moved to dealer phase, process dealer logic
      if (updatedGameState.phase === 'dealer') {
        // Wait a moment for dramatic effect
        setTimeout(async () => {
          const finalState = MultiplayerGameEngine.calculateResults(updatedGameState)
          const gameRef = doc(db, 'games', currentTable.id)
          await updateDoc(gameRef, finalState)
        }, 2000)
      }
      
      // Update Firestore
      const gameRef = doc(db, 'games', currentTable.id)
      await updateDoc(gameRef, updatedGameState)
      
    } catch (error) {
      console.error('Failed to process player action:', error)
      throw error
    }
  },

  startNewRound: async () => {
    const { service, currentTable, currentGame } = get()
    
    if (!currentTable || !currentGame || !service) {
      throw new Error('No active table or game')
    }
    
    try {
      // Initialize new round
      const newRoundState = MultiplayerGameEngine.initializeRound(currentGame, currentTable.settings)
      
      // Update Firestore
      const gameRef = doc(db, 'games', currentTable.id)
      await updateDoc(gameRef, newRoundState)
      
    } catch (error) {
      console.error('Failed to start new round:', error)
      throw error
    }
  },

  initialize: async () => {
    try {
      set({ connectionStatus: 'connecting' })
      
      // Dynamically import Firebase and services
      const { auth } = await import('@/lib/firebase/config')
      const { MultiplayerService } = await import('@/lib/firebase/multiplayer')
      
      // Initialize service
      const service = new MultiplayerService()
      set({ service })
      
      // Set up auth state listener
      auth.onAuthStateChanged((user) => {
        if (user) {
          set({ 
            userId: user.uid,
            playerName: user.displayName || 'Player',
            connectionStatus: 'connected'
          })
        } else {
          set({ 
            userId: '',
            playerName: '',
            connectionStatus: 'disconnected',
            currentTable: null,
            currentGame: null
          })
        }
      })

      // Subscribe to available tables (if service supports it)
      if (service.subscribeToAvailableTables) {
        service.subscribeToAvailableTables((tables) => {
          set({ availableTables: tables })
        })
      }
    } catch (error) {
      console.error('Failed to initialize multiplayer:', error)
      set({ connectionStatus: 'error' })
    }
  },

  cleanup: () => {
    const { service } = get()
    if (service) {
      service.cleanup()
    }
  }
}))

// Initialize the store when imported
if (typeof window !== 'undefined') {
  useMultiplayerStore.getState().initialize()
}