import { create } from 'zustand'
import {
  MultiplayerState,
  GameTable,
  MultiplayerGameState,
  TableSettings,
  ConnectionStatus,
  ChatMessage
} from '@/types/multiplayer'

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
  
  // Initialize multiplayer system
  initialize: () => void
  cleanup: () => void
}

const defaultTableSettings: TableSettings = {
  minBet: 5,
  maxBet: 500,
  startingChips: 1000,
  dealerStandsOn17: true,
  doubleAfterSplit: true,
  surrenderAllowed: false
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