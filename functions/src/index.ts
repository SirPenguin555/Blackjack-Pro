import { onDocumentUpdate } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { MultiplayerGameState, MultiplayerPlayer } from './types/multiplayer'

// Initialize Firebase Admin
initializeApp()
const db = getFirestore()

/**
 * Validates game state changes to prevent cheating
 * Triggers when a game document is updated
 */
export const validateGameState = onDocumentUpdate(
  'games/{gameId}',
  async (event) => {
    const before = event.data?.before.data() as MultiplayerGameState | undefined
    const after = event.data?.after.data() as MultiplayerGameState | undefined
    
    if (!before || !after) {
      console.log('Missing before/after data')
      return
    }

    try {
      // Validate player chip counts
      validateChipCounts(before, after)
      
      // Validate game phase transitions
      validatePhaseTransitions(before, after)
      
      // Validate player actions
      validatePlayerActions(before, after)
      
      // Validate card dealing
      validateCardDealing(before, after)
      
      console.log('Game state validation passed')
    } catch (error) {
      console.error('Game state validation failed:', error)
      
      // Revert to previous valid state
      await event.data?.after.ref.update(before)
      
      // Log suspicious activity
      await db.collection('suspicious_activity').add({
        gameId: event.params.gameId,
        timestamp: Date.now(),
        error: error.message,
        beforeState: before,
        afterState: after
      })
    }
  }
)

/**
 * Validate that chip counts make sense
 */
function validateChipCounts(before: MultiplayerGameState, after: MultiplayerGameState) {
  for (let i = 0; i < after.players.length; i++) {
    const beforePlayer = before.players[i]
    const afterPlayer = after.players[i]
    
    if (!beforePlayer || !afterPlayer) continue
    
    // Check that chips don't increase without justification
    if (afterPlayer.chips > beforePlayer.chips) {
      // Only valid if they won money (phase went from dealer/playing to finished)
      if (!(before.phase === 'dealer' && after.phase === 'finished')) {
        throw new Error(`Invalid chip increase for player ${afterPlayer.userId}`)
      }
    }
    
    // Check that bets don't exceed available chips
    if (afterPlayer.bet > beforePlayer.chips + beforePlayer.bet) {
      throw new Error(`Bet exceeds available chips for player ${afterPlayer.userId}`)
    }
  }
}

/**
 * Validate game phase transitions
 */
function validatePhaseTransitions(before: MultiplayerGameState, after: MultiplayerGameState) {
  const validTransitions: Record<string, string[]> = {
    'betting': ['dealing'],
    'dealing': ['playing'],
    'playing': ['dealer', 'playing'], // Can stay in playing for multiple players
    'dealer': ['finished'],
    'finished': ['betting'] // New round
  }
  
  if (before.phase !== after.phase) {
    const allowedNextPhases = validTransitions[before.phase] || []
    if (!allowedNextPhases.includes(after.phase)) {
      throw new Error(`Invalid phase transition: ${before.phase} -> ${after.phase}`)
    }
  }
}

/**
 * Validate player actions are legitimate
 */
function validatePlayerActions(before: MultiplayerGameState, after: MultiplayerGameState) {
  if (before.phase !== 'playing' || after.phase !== 'playing') {
    return // Only validate during playing phase
  }
  
  // Check that only the current player's state changed
  const currentPlayerIndex = before.currentPlayerIndex
  
  for (let i = 0; i < before.players.length; i++) {
    const beforePlayer = before.players[i]
    const afterPlayer = after.players[i]
    
    if (!beforePlayer || !afterPlayer) continue
    
    // Only current player should have changes (except for phase transitions)
    if (i !== currentPlayerIndex) {
      if (beforePlayer.hand.cards.length !== afterPlayer.hand.cards.length) {
        throw new Error(`Non-current player ${afterPlayer.userId} received cards`)
      }
    }
  }
}

/**
 * Validate card dealing logic
 */
function validateCardDealing(before: MultiplayerGameState, after: MultiplayerGameState) {
  // Check that deck size decreases appropriately when cards are dealt
  const beforeDeckSize = before.deck.length
  const afterDeckSize = after.deck.length
  
  if (beforeDeckSize < afterDeckSize) {
    throw new Error('Deck size cannot increase')
  }
  
  // Count total cards dealt to all players and dealer
  let totalCardsDealt = 0
  
  // Count player cards
  for (let i = 0; i < after.players.length; i++) {
    const beforePlayer = before.players[i]
    const afterPlayer = after.players[i]
    
    if (beforePlayer && afterPlayer) {
      const beforeCards = beforePlayer.hand.cards.length + (beforePlayer.splitHand?.cards.length || 0)
      const afterCards = afterPlayer.hand.cards.length + (afterPlayer.splitHand?.cards.length || 0)
      totalCardsDealt += (afterCards - beforeCards)
    }
  }
  
  // Count dealer cards
  const beforeDealerCards = before.dealer.cards.length
  const afterDealerCards = after.dealer.cards.length
  totalCardsDealt += (afterDealerCards - beforeDealerCards)
  
  // Verify deck decreased by correct amount
  const expectedDeckDecrease = totalCardsDealt
  const actualDeckDecrease = beforeDeckSize - afterDeckSize
  
  if (actualDeckDecrease !== expectedDeckDecrease) {
    throw new Error(`Deck size mismatch: expected decrease of ${expectedDeckDecrease}, got ${actualDeckDecrease}`)
  }
}

/**
 * Clean up old games and tables
 */
export const cleanupOldGames = onDocumentUpdate(
  'tables/{tableId}',
  async (event) => {
    const after = event.data?.after.data()
    
    if (!after) return
    
    // If table is empty for more than 1 hour, delete it
    if (after.currentPlayers === 0) {
      const oneHourAgo = Date.now() - (60 * 60 * 1000)
      
      if (after.createdAt < oneHourAgo) {
        console.log(`Cleaning up empty table: ${event.params.tableId}`)
        
        // Delete the table
        await event.data.after.ref.delete()
        
        // Delete associated game
        await db.collection('games').doc(event.params.tableId).delete()
      }
    }
  }
)