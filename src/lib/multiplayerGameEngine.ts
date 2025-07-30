import { Card, createDeck, shuffleDeck } from '@/types/game'
import type { GameAction } from '@/types/game'
import { MultiplayerGameState, MultiplayerPlayer, TableSettings } from '@/types/multiplayer'
import { 
  createHand, 
  addCardToHand, 
  calculatePayout, 
  determineWinner,
  canSplit,
  canDouble,
  shouldDealerHit
} from '@/lib/blackjack'

/**
 * Multiplayer game engine that handles all game logic server-side
 * This ensures fair play and prevents cheating
 */
export class MultiplayerGameEngine {
  /**
   * Initialize a new game round
   */
  static initializeRound(gameState: MultiplayerGameState, settings: TableSettings): MultiplayerGameState {
    // Create and shuffle a new deck
    const deck = shuffleDeck(createDeck())
    
    // Reset all players for new round
    const resetPlayers = gameState.players.map(player => ({
      ...player,
      hand: createHand([]),
      splitHand: undefined,
      bet: 0,
      canDouble: false,
      canSplit: false,
      hasSplit: false,
      isPlayingMainHand: true,
      lastHandWinnings: undefined
    }))
    
    // Reset dealer
    const dealer = createHand([])
    
    return {
      ...gameState,
      deck,
      players: resetPlayers,
      dealer,
      currentPlayerIndex: 0,
      phase: 'betting',
      round: gameState.round + 1
    }
  }
  
  /**
   * Process a player's bet
   */
  static processBet(
    gameState: MultiplayerGameState, 
    playerId: string, 
    betAmount: number
  ): MultiplayerGameState {
    if (gameState.phase !== 'betting') {
      throw new Error('Betting is not allowed in current phase')
    }
    
    const playerIndex = gameState.players.findIndex(p => p.userId === playerId)
    if (playerIndex === -1) {
      throw new Error('Player not found')
    }
    
    const player = gameState.players[playerIndex]
    
    // Validate bet amount
    if (betAmount < 1 || betAmount > player.chips) {
      throw new Error('Invalid bet amount')
    }
    
    // Update player's bet and chips
    const updatedPlayers = [...gameState.players]
    updatedPlayers[playerIndex] = {
      ...player,
      bet: betAmount,
      chips: player.chips - betAmount
    }
    
    return {
      ...gameState,
      players: updatedPlayers
    }
  }
  
  /**
   * Start dealing cards when all players have placed bets
   */
  static startDealing(gameState: MultiplayerGameState): MultiplayerGameState {
    if (gameState.phase !== 'betting') {
      throw new Error('Cannot start dealing in current phase')
    }
    
    // Check if all players have placed bets
    const playersWithBets = gameState.players.filter(p => p.bet > 0)
    if (playersWithBets.length === 0) {
      throw new Error('No players have placed bets')
    }
    
    let deck = [...gameState.deck]
    let updatedPlayers = [...gameState.players]
    
    // Deal initial cards (2 to each player, 2 to dealer)
    // First card to each player
    for (let i = 0; i < updatedPlayers.length; i++) {
      if (updatedPlayers[i].bet > 0) {
        const card = deck.pop()!
        updatedPlayers[i] = {
          ...updatedPlayers[i],
          hand: addCardToHand(updatedPlayers[i].hand, card)
        }
      }
    }
    
    // First card to dealer (face down)
    let dealerHand = createHand([])
    const dealerCard1 = deck.pop()!
    dealerCard1.hidden = true
    dealerHand = addCardToHand(dealerHand, dealerCard1)
    
    // Second card to each player
    for (let i = 0; i < updatedPlayers.length; i++) {
      if (updatedPlayers[i].bet > 0) {
        const card = deck.pop()!
        updatedPlayers[i] = {
          ...updatedPlayers[i],
          hand: addCardToHand(updatedPlayers[i].hand, card)
        }
      }
    }
    
    // Second card to dealer (face up)
    const dealerCard2 = deck.pop()!
    dealerHand = addCardToHand(dealerHand, dealerCard2)
    
    // Update player abilities (can double, can split)
    updatedPlayers = updatedPlayers.map(player => {
      if (player.bet > 0) {
        return {
          ...player,
          canDouble: canDouble(player.hand) && player.chips >= player.bet,
          canSplit: canSplit(player.hand) && player.chips >= player.bet
        }
      }
      return player
    })
    
    // Find first player with a bet to start
    const firstPlayerIndex = updatedPlayers.findIndex(p => p.bet > 0)
    
    return {
      ...gameState,
      deck,
      players: updatedPlayers,
      dealer: dealerHand,
      phase: 'playing',
      currentPlayerIndex: firstPlayerIndex
    }
  }
  
  /**
   * Process a player action (hit, stand, double, split)
   */
  static processPlayerAction(
    gameState: MultiplayerGameState,
    playerId: string,
    action: GameAction
  ): MultiplayerGameState {
    if (gameState.phase !== 'playing') {
      throw new Error('Player actions not allowed in current phase')
    }
    
    const playerIndex = gameState.players.findIndex(p => p.userId === playerId)
    if (playerIndex === -1) {
      throw new Error('Player not found')
    }
    
    if (gameState.currentPlayerIndex !== playerIndex) {
      throw new Error('Not player\'s turn')
    }
    
    let updatedGameState = { ...gameState }
    let deck = [...gameState.deck]
    const player = gameState.players[playerIndex]
    
    switch (action) {
      case 'hit':
        updatedGameState = this.processHit(updatedGameState, playerIndex, deck)
        break
        
      case 'stand':
        updatedGameState = this.processStand(updatedGameState, playerIndex)
        break
        
      case 'double':
        if (!player.canDouble) {
          throw new Error('Double down not allowed')
        }
        updatedGameState = this.processDouble(updatedGameState, playerIndex, deck)
        break
        
      case 'split':
        if (!player.canSplit) {
          throw new Error('Split not allowed')
        }
        updatedGameState = this.processSplit(updatedGameState, playerIndex, deck)
        break
        
      default:
        throw new Error('Invalid action')
    }
    
    // Check if we need to move to next player or dealer phase
    updatedGameState = this.checkForPhaseTransition(updatedGameState)
    
    return updatedGameState
  }
  
  /**
   * Process hit action
   */
  private static processHit(
    gameState: MultiplayerGameState,
    playerIndex: number,
    deck: Card[]
  ): MultiplayerGameState {
    const card = deck.pop()!
    const player = gameState.players[playerIndex]
    
    const updatedPlayers = [...gameState.players]
    
    if (player.hasSplit && player.isPlayingMainHand) {
      // Hitting main hand in split
      updatedPlayers[playerIndex] = {
        ...player,
        hand: addCardToHand(player.hand, card),
        canDouble: false,
        canSplit: false
      }
    } else if (player.hasSplit && !player.isPlayingMainHand) {
      // Hitting split hand
      updatedPlayers[playerIndex] = {
        ...player,
        splitHand: addCardToHand(player.splitHand!, card),
        canDouble: false,
        canSplit: false
      }
    } else {
      // Normal hit
      updatedPlayers[playerIndex] = {
        ...player,
        hand: addCardToHand(player.hand, card),
        canDouble: false,
        canSplit: false
      }
    }
    
    return {
      ...gameState,
      deck,
      players: updatedPlayers
    }
  }
  
  /**
   * Process stand action
   */
  private static processStand(
    gameState: MultiplayerGameState,
    playerIndex: number
  ): MultiplayerGameState {
    const player = gameState.players[playerIndex]
    const updatedPlayers = [...gameState.players]
    
    if (player.hasSplit && player.isPlayingMainHand) {
      // Finished main hand, move to split hand
      updatedPlayers[playerIndex] = {
        ...player,
        isPlayingMainHand: false,
        canDouble: canDouble(player.splitHand!) && player.chips >= player.bet,
        canSplit: false
      }
      
      return {
        ...gameState,
        players: updatedPlayers
      }
    }
    
    // Player is done, move to next player
    return gameState
  }
  
  /**
   * Process double down action
   */
  private static processDouble(
    gameState: MultiplayerGameState,
    playerIndex: number,
    deck: Card[]
  ): MultiplayerGameState {
    const card = deck.pop()!
    const player = gameState.players[playerIndex]
    
    const updatedPlayers = [...gameState.players]
    updatedPlayers[playerIndex] = {
      ...player,
      hand: addCardToHand(player.hand, card),
      bet: player.bet * 2,
      chips: player.chips - player.bet,
      canDouble: false,
      canSplit: false
    }
    
    return {
      ...gameState,
      deck,
      players: updatedPlayers
    }
  }
  
  /**
   * Process split action
   */
  private static processSplit(
    gameState: MultiplayerGameState,
    playerIndex: number,
    deck: Card[]
  ): MultiplayerGameState {
    const player = gameState.players[playerIndex]
    const [card1, card2] = player.hand.cards
    
    // Deal new cards to each hand
    const newCard1 = deck.pop()!
    const newCard2 = deck.pop()!
    
    const mainHand = createHand([card1, newCard1])
    const splitHand = createHand([card2, newCard2])
    
    const updatedPlayers = [...gameState.players]
    updatedPlayers[playerIndex] = {
      ...player,
      hand: mainHand,
      splitHand,
      bet: player.bet * 2,
      chips: player.chips - player.bet,
      hasSplit: true,
      isPlayingMainHand: true,
      canDouble: canDouble(mainHand) && player.chips >= player.bet,
      canSplit: canSplit(mainHand)
    }
    
    return {
      ...gameState,
      deck,
      players: updatedPlayers
    }
  }
  
  /**
   * Check if we need to transition to next player or dealer phase
   */
  private static checkForPhaseTransition(gameState: MultiplayerGameState): MultiplayerGameState {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    
    // Check if current player is done
    const isPlayerDone = 
      currentPlayer.hand.isBusted ||
      (!currentPlayer.hasSplit) ||
      (currentPlayer.hasSplit && !currentPlayer.isPlayingMainHand && 
       (currentPlayer.splitHand?.isBusted || false))
    
    if (!isPlayerDone) {
      return gameState
    }
    
    // Find next player with bet
    let nextPlayerIndex = gameState.currentPlayerIndex + 1
    while (nextPlayerIndex < gameState.players.length) {
      if (gameState.players[nextPlayerIndex].bet > 0) {
        return {
          ...gameState,
          currentPlayerIndex: nextPlayerIndex
        }
      }
      nextPlayerIndex++
    }
    
    // No more players, move to dealer phase
    return this.startDealerPhase(gameState)
  }
  
  /**
   * Start dealer phase
   */
  private static startDealerPhase(gameState: MultiplayerGameState): MultiplayerGameState {
    let deck = [...gameState.deck]
    let dealerHand = { ...gameState.dealer }
    
    // Reveal dealer's hole card
    dealerHand.cards[0].hidden = false
    dealerHand = createHand(dealerHand.cards)
    
    // Dealer hits according to rules
    while (shouldDealerHit(dealerHand) && deck.length > 0) {
      const card = deck.pop()!
      dealerHand = addCardToHand(dealerHand, card)
    }
    
    return {
      ...gameState,
      deck,
      dealer: dealerHand,
      phase: 'dealer'
    }
  }
  
  /**
   * Calculate final results and payouts
   */
  static calculateResults(gameState: MultiplayerGameState): MultiplayerGameState {
    const updatedPlayers = gameState.players.map(player => {
      if (player.bet === 0) return player
      
      let totalWinnings = 0
      
      // Calculate main hand
      const mainHandPayout = calculatePayout(player.bet, player.hand, gameState.dealer)
      totalWinnings += mainHandPayout
      
      // Calculate split hand if exists
      if (player.hasSplit && player.splitHand) {
        const splitHandPayout = calculatePayout(player.bet, player.splitHand, gameState.dealer)
        totalWinnings += splitHandPayout
      }
      
      const finalWinnings = totalWinnings - (player.hasSplit ? player.bet * 2 : player.bet)
      
      return {
        ...player,
        chips: player.chips + totalWinnings,
        lastHandWinnings: finalWinnings
      }
    })
    
    return {
      ...gameState,
      players: updatedPlayers,
      phase: 'finished'
    }
  }
}