import { supabase, ensureAuthenticated, isDemoMode } from './config'
import { 
  GameTable, 
  MultiplayerGameState, 
  MultiplayerPlayer, 
  ChatMessage, 
  TableSettings,
  PlayerAction 
} from '@/types/multiplayer'

export class MultiplayerService {
  public tableSubscription: any = null
  public gameSubscription: any = null
  public tablesSubscription: any = null
  public tableUnsubscribe: (() => void) | null = null
  public gameUnsubscribe: (() => void) | null = null
  public tablesUnsubscribe: (() => void) | null = null

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
    maxPlayers: number, 
    settings: TableSettings, 
    isPrivate = false, 
    password?: string
  ): Promise<string> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Creating mock table')
      return 'DEMO' + Math.random().toString(36).substring(2, 8).toUpperCase()
    }

    const user = await ensureAuthenticated()
    if (!user) {
      throw new Error('Authentication required')
    }

    const code = this.generateTableCode()
    
    // Hash password if provided
    let passwordHash: string | undefined
    if (password) {
      // Simple hash for demo - in production use proper password hashing
      passwordHash = btoa(password)
    }

    try {
      const { data: table, error } = await supabase
        .from('game_tables')
        .insert({
          code,
          name,
          max_players: maxPlayers,
          current_players: 1,
          status: 'waiting',
          is_private: isPrivate,
          password_hash: passwordHash,
          host_user_id: user.id,
          settings
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Add the host as the first player
      await supabase
        .from('table_players')
        .insert({
          table_id: table.id,
          user_id: user.id,
          name: user.email || 'Host',
          chips: settings.startingChips || 1000,
          is_host: true,
          seat_position: 0
        })

      return table.id
    } catch (error) {
      console.error('Failed to create table:', error)
      throw new Error('Failed to create table')
    }
  }

  /**
   * Join an existing table by ID
   */
  async joinTable(tableId: string, playerName: string, password?: string): Promise<void> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Joining mock table')
      return
    }

    const user = await ensureAuthenticated()
    if (!user) {
      throw new Error('Authentication required')
    }

    try {
      // Get table info
      const { data: table, error: tableError } = await supabase
        .from('game_tables')
        .select('*')
        .eq('id', tableId)
        .single()

      if (tableError || !table) {
        throw new Error('Table not found')
      }

      // Check password if table is private
      if (table.is_private && table.password_hash) {
        if (!password || btoa(password) !== table.password_hash) {
          throw new Error('Invalid password')
        }
      }

      // Check if table is full
      if (table.current_players >= table.max_players) {
        throw new Error('Table is full')
      }

      // Check if user is already in the table
      const { data: existingPlayer } = await supabase
        .from('table_players')
        .select('*')
        .eq('table_id', tableId)
        .eq('user_id', user.id)
        .single()

      if (existingPlayer) {
        // User is already in the table, just update their connection status
        await supabase
          .from('table_players')
          .update({ 
            is_connected: true,
            last_seen: new Date().toISOString()
          })
          .eq('id', existingPlayer.id)
        return
      }

      // Find available seat position
      const { data: existingPlayers } = await supabase
        .from('table_players')
        .select('seat_position')
        .eq('table_id', tableId)
        .order('seat_position')

      let seatPosition = 0
      const usedPositions = existingPlayers?.map(p => p.seat_position) || []
      while (usedPositions.includes(seatPosition)) {
        seatPosition++
      }

      // Add player to table
      await supabase
        .from('table_players')
        .insert({
          table_id: tableId,
          user_id: user.id,
          name: playerName,
          chips: table.settings.startingChips || 1000,
          is_host: false,
          seat_position: seatPosition
        })

      // Update table player count
      await supabase
        .from('game_tables')
        .update({ 
          current_players: table.current_players + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId)

    } catch (error) {
      console.error('Failed to join table:', error)
      throw error
    }
  }

  /**
   * Join table by code
   */
  async joinTableByCode(tableCode: string, playerName: string, password?: string): Promise<string> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Joining table by mock code')
      return 'demo-table-id'
    }

    try {
      const { data: table, error } = await supabase
        .from('game_tables')
        .select('*')
        .eq('code', tableCode.toUpperCase())
        .single()

      if (error || !table) {
        throw new Error('Table not found')
      }

      await this.joinTable(table.id, playerName, password)
      return table.id
    } catch (error) {
      console.error('Failed to join table by code:', error)
      throw error
    }
  }

  /**
   * Find table by code
   */
  async findTableByCode(tableCode: string): Promise<GameTable | null> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Finding mock table')
      return null
    }

    try {
      const { data: table, error } = await supabase
        .from('game_tables')
        .select('*')
        .eq('code', tableCode.toUpperCase())
        .single()

      if (error || !table) {
        return null
      }

      return this.mapSupabaseTableToGameTable(table)
    } catch (error) {
      console.error('Failed to find table by code:', error)
      return null
    }
  }

  /**
   * Leave a table
   */
  async leaveTable(tableId: string): Promise<void> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Leaving mock table')
      return
    }

    const user = await ensureAuthenticated()
    if (!user) {
      throw new Error('Authentication required')
    }

    try {
      // Remove player from table
      await supabase
        .from('table_players')
        .delete()
        .eq('table_id', tableId)
        .eq('user_id', user.id)

      // Update table player count
      const { data: table } = await supabase
        .from('game_tables')
        .select('current_players, host_user_id')
        .eq('id', tableId)
        .single()

      if (table) {
        const newPlayerCount = Math.max(0, table.current_players - 1)
        
        // If this was the host leaving, delete the table
        if (table.host_user_id === user.id) {
          await supabase
            .from('game_tables')
            .delete()
            .eq('id', tableId)
        } else {
          // Otherwise just update player count
          await supabase
            .from('game_tables')
            .update({ 
              current_players: newPlayerCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', tableId)
        }
      }
    } catch (error) {
      console.error('Failed to leave table:', error)
      throw error
    }
  }

  /**
   * Send a chat message
   */
  async sendChatMessage(tableId: string, message: string, playerName: string): Promise<void> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Sending mock chat message')
      return
    }

    const user = await ensureAuthenticated()
    if (!user) {
      throw new Error('Authentication required')
    }

    try {
      await supabase
        .from('chat_messages')
        .insert({
          table_id: tableId,
          user_id: user.id,
          player_name: playerName,
          message
        })
    } catch (error) {
      console.error('Failed to send chat message:', error)
      throw error
    }
  }

  /**
   * Subscribe to table updates
   */
  subscribeToTable(tableId: string, callback: (table: GameTable) => void): () => void {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Mock table subscription')
      return () => {}
    }

    const subscription = supabase
      .channel(`table_${tableId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_tables',
          filter: `id=eq.${tableId}`
        },
        async (payload: any) => {
          try {
            const { data: table } = await supabase
              .from('game_tables')
              .select('*')
              .eq('id', tableId)
              .single()

            if (table) {
              callback(this.mapSupabaseTableToGameTable(table))
            }
          } catch (error) {
            console.error('Error in table subscription:', error)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }

  /**
   * Subscribe to game state updates
   */
  subscribeToGame(tableId: string, callback: (game: MultiplayerGameState) => void): () => void {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Mock game subscription')
      return () => {}
    }

    const subscription = supabase
      .channel(`game_${tableId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_states',
          filter: `table_id=eq.${tableId}`
        },
        async (payload: any) => {
          try {
            const { data: gameState } = await supabase
              .from('game_states')
              .select('*')
              .eq('table_id', tableId)
              .single()

            if (gameState) {
              callback(this.mapSupabaseGameToMultiplayerGame(gameState))
            }
          } catch (error) {
            console.error('Error in game subscription:', error)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }

  /**
   * Subscribe to available tables
   */
  subscribeToAvailableTables(callback: (tables: GameTable[]) => void): () => void {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Mock tables subscription')
      return () => {}
    }

    const subscription = supabase
      .channel('available_tables')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_tables'
        },
        async () => {
          try {
            const { data: tables } = await supabase
              .from('game_tables')
              .select('*')
              .eq('status', 'waiting')
              .eq('is_private', false)
              .order('created_at', { ascending: false })

            if (tables) {
              callback(tables.map(table => this.mapSupabaseTableToGameTable(table)))
            }
          } catch (error) {
            console.error('Error in tables subscription:', error)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }

  /**
   * Initialize a new game for a table
   */
  async initializeGame(tableId: string, settings: TableSettings): Promise<void> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Initializing mock game')
      return
    }

    try {
      // Get players for this table
      const { data: players } = await supabase
        .from('table_players')
        .select('*')
        .eq('table_id', tableId)
        .order('seat_position')

      if (!players || players.length === 0) {
        throw new Error('No players found for table')
      }

      // Create initial game state
      const initialGameState = {
        table_id: tableId,
        round: 1,
        phase: 'betting',
        current_player_index: 0,
        dealer: { cards: [], value: 0, isSoft: false, isBlackjack: false, isBusted: false },
        players: players.map((player, index) => ({
          userId: player.user_id,
          name: player.name,
          chips: player.chips,
          bet: 0,
          hand: { cards: [], value: 0, isSoft: false, isBlackjack: false, isBusted: false },
          isConnected: player.is_connected
        })),
        deck: this.createNewDeck(),
        last_action: null,
        messages: []
      }

      await supabase
        .from('game_states')
        .insert(initialGameState)

    } catch (error) {
      console.error('Failed to initialize game:', error)
      throw error
    }
  }

  /**
   * Clean up inactive tables
   */
  async cleanupInactiveTables(): Promise<void> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Skipping table cleanup')
      return
    }

    try {
      // Call the database function to cleanup inactive tables
      await supabase.rpc('cleanup_inactive_tables')
    } catch (error) {
      console.error('Failed to cleanup inactive tables:', error)
    }
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    if (this.tableUnsubscribe) {
      this.tableUnsubscribe()
    }
    if (this.gameUnsubscribe) {
      this.gameUnsubscribe()
    }
    if (this.tablesUnsubscribe) {
      this.tablesUnsubscribe()
    }
  }

  /**
   * Helper methods for mapping data
   */
  private mapSupabaseTableToGameTable(table: any): GameTable {
    return {
      id: table.id,
      code: table.code,
      name: table.name,
      maxPlayers: table.max_players,
      currentPlayers: table.current_players,
      status: table.status,
      isPrivate: table.is_private,
      hostUserId: table.host_user_id,
      settings: table.settings,
      createdAt: table.created_at,
      updatedAt: table.updated_at
    }
  }

  private mapSupabaseGameToMultiplayerGame(gameState: any): MultiplayerGameState {
    return {
      tableId: gameState.table_id,
      round: gameState.round,
      phase: gameState.phase,
      currentPlayerIndex: gameState.current_player_index,
      dealer: gameState.dealer,
      players: gameState.players,
      deck: gameState.deck,
      lastAction: gameState.last_action,
      messages: gameState.messages,
      hostUserId: '', // Will be populated from table data
      settings: {} // Will be populated from table data
    }
  }

  private createNewDeck(): any[] {
    // Simple deck creation - this should match your existing deck logic
    const suits = ['hearts', 'diamonds', 'clubs', 'spades']
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    const deck = []

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank, hidden: false })
      }
    }

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]
    }

    return deck
  }
}