import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
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
import { db, auth } from './config'
import { 
  GameTable, 
  MultiplayerGameState, 
  MultiplayerPlayer, 
  ChatMessage, 
  TableSettings,
  PlayerAction 
} from '@/types/multiplayer'

export class MultiplayerService {
  private tableUnsubscribe: Unsubscribe | null = null
  private gameUnsubscribe: Unsubscribe | null = null

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
    const user = auth.currentUser
    if (!user) throw new Error('User must be authenticated')

    const tableData: Omit<GameTable, 'id'> = {
      name,
      hostUserId: user.uid,
      maxPlayers,
      currentPlayers: 0,
      isPrivate,
      password,
      status: 'waiting',
      createdAt: Date.now(),
      settings
    }

    const docRef = await addDoc(collection(db, 'tables'), tableData)
    return docRef.id
  }

  /**
   * Join an existing table
   */
  async joinTable(tableId: string, playerName: string, password?: string): Promise<void> {
    const user = auth.currentUser
    if (!user) throw new Error('User must be authenticated')

    const tableRef = doc(db, 'tables', tableId)
    const gameRef = doc(db, 'games', tableId)

    // Verify password if table is private
    // TODO: Add password verification logic

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
    const user = auth.currentUser
    if (!user) throw new Error('User must be authenticated')

    const tableRef = doc(db, 'tables', tableId)
    const gameRef = doc(db, 'games', tableId)

    // Update table player count
    await updateDoc(tableRef, {
      currentPlayers: increment(-1)
    })

    // Remove player from game
    await updateDoc(gameRef, {
      [`playerConnections.${user.uid}`]: false,
      spectators: arrayRemove(user.uid)
    })
  }

  /**
   * Send a chat message
   */
  async sendChatMessage(tableId: string, message: string): Promise<void> {
    const user = auth.currentUser
    if (!user) throw new Error('User must be authenticated')

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
    const user = auth.currentUser
    if (!user) throw new Error('User must be authenticated')

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
    const user = auth.currentUser
    if (!user) throw new Error('User must be authenticated')

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
  }
}