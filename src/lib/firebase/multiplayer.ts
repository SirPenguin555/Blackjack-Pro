import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  DocumentReference,
  Unsubscribe
} from 'firebase/firestore'
import { db, auth, ensureAuthenticated, isDemoMode } from './config'
import { 
  GameTable, 
  MultiplayerGameState, 
  MultiplayerPlayer, 
  ChatMessage, 
  TableSettings,
  PlayerAction 
} from '@/types/multiplayer'

export class MultiplayerService {
  public tableUnsubscribe: Unsubscribe | null = null
  public gameUnsubscribe: Unsubscribe | null = null
  public tablesUnsubscribe: Unsubscribe | null = null

  /**
   * Generate a unique 6-character table code
   */
  private generateTableCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * Create a new game table
   */
  async createTable(
    name: string, 
    maxPlayers: number = 4, 
    settings: TableSettings,
    isPrivate: boolean = false,
    password?: string
  ): Promise<string> {
    if (isDemoMode || !db) {
      console.warn('Demo mode or Firebase unavailable: Creating mock table')
      const mockTableId = 'demo-table-' + Math.random().toString(36).substring(7)
      // In demo mode, just return a mock table ID
      setTimeout(() => {
        console.log('Demo table created:', mockTableId)
      }, 1000)
      return mockTableId
    }
    
    const user = await ensureAuthenticated()
    
    // Check if we're using a mock user (when anonymous auth is disabled)
    if (user.uid.startsWith('mock-user-') || user.uid.startsWith('demo-user-')) {
      console.warn('Using mock authentication - multiplayer features limited')
      const mockTableId = 'mock-table-' + Math.random().toString(36).substring(7)
      return mockTableId
    }

    const tableCode = this.generateTableCode()

    const tableData: Omit<GameTable, 'id'> = {
      name,
      hostUserId: user.uid,
      maxPlayers,
      currentPlayers: 0,
      isPrivate,
      password: password || null,
      tableCode,
      status: 'waiting',
      createdAt: Date.now(),
      settings
    }

    const docRef = await addDoc(collection(db, 'tables'), tableData)
    return docRef.id
  }

  /**
   * Find table by table code
   */
  async findTableByCode(tableCode: string): Promise<GameTable | null> {
    if (isDemoMode) {
      console.warn('Demo mode: Mock table search')
      return null
    }
    
    const tablesQuery = query(
      collection(db, 'tables'),
      where('tableCode', '==', tableCode.toUpperCase()),
      where('status', '==', 'waiting')
    )
    
    const snapshot = await getDocs(tablesQuery)
    if (snapshot.empty) return null
    
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() } as GameTable
  }

  /**
   * Join table by code
   */
  async joinTableByCode(tableCode: string, playerName: string, password?: string): Promise<string> {
    const table = await this.findTableByCode(tableCode)
    if (!table) {
      throw new Error('Table not found with code: ' + tableCode)
    }
    
    await this.joinTable(table.id, playerName, password)
    return table.id
  }

  /**
   * Join an existing table
   */
  async joinTable(tableId: string, playerName: string, password?: string): Promise<void> {
    if (isDemoMode) {
      console.warn('Demo mode: Mock joining table')
      return
    }
    
    const user = await ensureAuthenticated()
    
    // Check if we're using a mock user (when anonymous auth is disabled)
    if (user.uid.startsWith('mock-user-') || user.uid.startsWith('demo-user-')) {
      console.warn('Using mock authentication - cannot join real tables')
      throw new Error('Anonymous authentication is disabled. Please enable it in Firebase Console or sign in with a real account.')
    }

    const tableRef = doc(db, 'tables', tableId)
    const gameRef = doc(db, 'games', tableId)

    // Verify password if table is private
    const tableSnap = await getDoc(tableRef)
    if (!tableSnap.exists()) {
      throw new Error('Table not found')
    }
    
    const tableData = tableSnap.data() as GameTable
    if (tableData.isPrivate && tableData.password !== password) {
      throw new Error('Invalid password for private table')
    }

    // Add player to game
    const playerData: MultiplayerPlayer = {
      id: user.uid,
      userId: user.uid,
      name: playerName,
      chips: 1000, // Default starting chips
      hand: { cards: [], value: 0, isSoft: false, isBlackjack: false, isBusted: false },
      bet: 0,
      canDouble: false,
      canSplit: false,
      hasSplit: false,
      splitHand: undefined,
      isPlayingMainHand: true,
      lastHandWinnings: undefined,
      position: 0, // Will be set by server
      isHost: false,
      isConnected: true,
      lastSeen: Date.now()
    }

    // Update table player count
    await updateDoc(tableRef, {
      currentPlayers: increment(1)
    })

    // Add player to game
    await updateDoc(gameRef, {
      players: arrayUnion(playerData),
      [`playerConnections.${user.uid}`]: true
    })
  }

  /**
   * Leave a table
   */
  async leaveTable(tableId: string): Promise<void> {
    if (isDemoMode || !db) {
      console.warn('Demo mode or Firebase unavailable: Mock leaving table')
      return
    }

    const user = await ensureAuthenticated()

    // Check if we're using a mock user (when anonymous auth is disabled)
    if (user.uid.startsWith('mock-user-') || user.uid.startsWith('demo-user-')) {
      console.warn('Using mock authentication - cannot leave real tables')
      return
    }

    const tableRef = doc(db, 'tables', tableId)
    const gameRef = doc(db, 'games', tableId)

    // Get current table data to check player count
    const tableDoc = await getDoc(tableRef)
    if (!tableDoc.exists()) {
      console.warn('Table not found when trying to leave:', tableId)
      return
    }

    const tableData = tableDoc.data() as GameTable
    const newPlayerCount = Math.max(0, tableData.currentPlayers - 1)

    // If this is the last player leaving, delete the table completely
    if (newPlayerCount === 0) {
      console.log('Last player leaving table, deleting table:', tableId)
      
      try {
        // Delete the table document
        await deleteDoc(tableRef)
        console.log('Table document deleted:', tableId)
        
        // Also delete the game state if it exists
        const gameDoc = await getDoc(gameRef)
        if (gameDoc.exists()) {
          await deleteDoc(gameRef)
          console.log('Game state deleted:', tableId)
        }
        
        console.log('Empty table cleanup completed:', tableId)
      } catch (deleteError) {
        console.error('Error deleting empty table:', deleteError)
        // If deletion fails, at least mark it as offline
        try {
          await updateDoc(tableRef, {
            status: 'offline',
            currentPlayers: 0
          })
          console.log('Marked table as offline due to deletion error:', tableId)
        } catch (updateError) {
          console.error('Failed to mark table as offline:', updateError)
        }
      }
    } else {
      // Update table player count if there are still players
      await updateDoc(tableRef, {
        currentPlayers: newPlayerCount
      })

      // Remove player from game
      await updateDoc(gameRef, {
        [`playerConnections.${user.uid}`]: false,
        spectators: arrayRemove(user.uid)
      })
    }
  }

  /**
   * Send a chat message
   */
  async sendChatMessage(tableId: string, message: string): Promise<void> {
    const user = await ensureAuthenticated()

    const chatMessage: Omit<ChatMessage, 'id'> = {
      userId: user.uid,
      playerName: user.displayName || 'Anonymous',
      message,
      timestamp: Date.now(),
      type: 'chat'
    }

    const gameRef = doc(db, 'games', tableId)
    await updateDoc(gameRef, {
      messages: arrayUnion(chatMessage)
    })
  }

  /**
   * Make a player action (hit, stand, etc.)
   */
  async makePlayerAction(tableId: string, action: PlayerAction): Promise<void> {
    const user = await ensureAuthenticated()

    const gameRef = doc(db, 'games', tableId)
    await updateDoc(gameRef, {
      lastAction: action.action,
      lastActionPlayerId: action.playerId,
      lastActionTimestamp: action.timestamp,
      [`playerActions.${user.uid}`]: action
    })
  }

  /**
   * Subscribe to table updates
   */
  subscribeToTable(tableId: string, callback: (table: GameTable | null) => void): Unsubscribe {
    const tableRef = doc(db, 'tables', tableId)
    
    return onSnapshot(tableRef, (doc) => {
      if (doc.exists()) {
        const table = { id: doc.id, ...doc.data() } as GameTable
        callback(table)
      } else {
        callback(null)
      }
    })
  }

  /**
   * Subscribe to game state updates
   */
  subscribeToGame(tableId: string, callback: (game: MultiplayerGameState | null) => void): Unsubscribe {
    const gameRef = doc(db, 'games', tableId)
    
    return onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const game = { ...doc.data() } as MultiplayerGameState
        callback(game)
      } else {
        callback(null)
      }
    })
  }

  /**
   * Get available public tables
   */
  subscribeToAvailableTables(callback: (tables: GameTable[]) => void): Unsubscribe {
    if (isDemoMode || !db) {
      // Return empty tables list for demo mode
      callback([])
      return () => {}
    }

    const tablesQuery = query(
      collection(db, 'tables'),
      where('isPrivate', '==', false),
      where('status', '==', 'waiting'),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(tablesQuery, (snapshot) => {
      const tables: GameTable[] = []
      snapshot.forEach((doc) => {
        tables.push({ id: doc.id, ...doc.data() } as GameTable)
      })
      callback(tables)
    })
  }

  /**
   * Initialize a new game for a table
   */
  async initializeGame(tableId: string, settings: TableSettings): Promise<void> {
    const user = await ensureAuthenticated()

    const initialGameState: MultiplayerGameState = {
      tableId,
      deck: [], // Will be populated by game logic
      players: [],
      dealer: { cards: [], value: 0, isSoft: false, isBlackjack: false, isBusted: false },
      currentPlayerIndex: 0,
      phase: 'betting',
      round: 1,
      hostUserId: user.uid,
      spectators: [],
      messages: [],
      lastAction: null,
      lastActionPlayerId: null,
      lastActionTimestamp: 0,
      playerConnections: {}
    }

    const gameRef = doc(db, 'games', tableId)
    // Use setDoc instead of updateDoc for initial creation
    await setDoc(gameRef, initialGameState)
  }

  /**
   * Check and cleanup inactive tables (tables with no active connections)
   */
  async cleanupInactiveTables(): Promise<void> {
    if (isDemoMode || !db) {
      return
    }

    try {
      // Get all active tables
      const tablesQuery = query(
        collection(db, 'tables'),
        where('status', '==', 'waiting')
      )
      
      const tablesSnapshot = await getDocs(tablesQuery)
      
      for (const tableDoc of tablesSnapshot.docs) {
        const tableData = tableDoc.data() as GameTable
        const gameRef = doc(db, 'games', tableDoc.id)
        const gameDoc = await getDoc(gameRef)
        
        if (gameDoc.exists()) {
          const gameData = gameDoc.data()
          const connections = gameData.playerConnections || {}
          
          // Count active connections
          const activeConnections = Object.values(connections).filter(Boolean).length
          
          // If no active connections and currentPlayers is 0, delete the table
          if (activeConnections === 0 && tableData.currentPlayers === 0) {
            console.log('Cleaning up inactive table:', tableDoc.id)
            await deleteDoc(doc(db, 'tables', tableDoc.id))
            await deleteDoc(gameRef)
          }
        } else if (tableData.currentPlayers === 0) {
          // If game doesn't exist and no players, delete the table
          console.log('Cleaning up orphaned table:', tableDoc.id)
          await deleteDoc(doc(db, 'tables', tableDoc.id))
        }
      }
    } catch (error) {
      console.error('Error during table cleanup:', error)
    }
  }

  /**
   * Clean up subscriptions
   */
  cleanup(): void {
    if (this.tableUnsubscribe) {
      this.tableUnsubscribe()
      this.tableUnsubscribe = null
    }
    if (this.gameUnsubscribe) {
      this.gameUnsubscribe()
      this.gameUnsubscribe = null
    }
    if (this.tablesUnsubscribe) {
      this.tablesUnsubscribe()
      this.tablesUnsubscribe = null
    }
  }
}