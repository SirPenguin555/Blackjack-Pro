import { create } from 'zustand'
import { GameState, Player, GameAction, ChipDenomination, GameMode, GameStats, TableLevel } from '@/types/game'
import { TutorialState, TUTORIAL_STEPS } from '@/types/tutorial'
import { StrategyAdvice, getBasicStrategyAdvice } from '@/lib/strategy'
import { createDeck, shuffleDeck, dealCard } from '@/lib/deck'
import { createHand, addCardToHand, shouldDealerHit, calculatePayout, canDouble, canSplit, determineWinner } from '@/lib/blackjack'
import { createRuleSet, GameVariant, RuleSet } from '@/lib/ruleVariations'
import { statsTracker } from '@/lib/StatsTracker'

export const CHIP_DENOMINATIONS: ChipDenomination[] = [
  { value: 1, color: 'bg-white border-gray-400 text-black', label: '$1' },
  { value: 5, color: 'bg-red-500 text-white', label: '$5' },
  { value: 25, color: 'bg-green-500 text-white', label: '$25' },
  { value: 100, color: 'bg-black text-white', label: '$100' },
]

interface GameStore extends GameState {
  // New state
  gameMode: GameMode
  stats: GameStats
  tutorial: TutorialState
  currentStrategyAdvice: StrategyAdvice | null
  currentTableLevel: TableLevel
  currentGameVariant: GameVariant
  
  // Actions
  setGameMode: (mode: GameMode) => void
  setRules: (rules: RuleSet) => void
  setTableLevel: (level: TableLevel) => void
  setGameVariant: (variant: GameVariant) => void
  initializeGame: () => void
  placeBet: (playerId: string, amount: number) => void
  dealInitialCards: () => void
  playerAction: (playerId: string, action: GameAction) => void
  dealerPlay: () => void
  finishRound: () => void
  startNewRound: () => void
  addPlayer: (name: string) => void
  removePlayer: (playerId: string) => void
  resetStats: () => void
  
  // Tutorial actions
  nextTutorialStep: () => void
  skipTutorial: () => void
  resetTutorial: () => void
  
  // Reset actions
  resetProgress: () => void
  recordMenuExit: () => void
  takeLoan: () => void
  
  // Strategy actions
  updateStrategyAdvice: () => void
  clearStrategyAdvice: () => void
}

const createInitialPlayer = (name: string, position: number): Player => ({
  id: `player-${Date.now()}-${position}`,
  name,
  chips: 250, // Starting chips
  hand: createHand(),
  bet: 0,
  canDouble: false,
  canSplit: false,
  hasSplit: false,
  position,
  lastHandWinnings: undefined,
  isPlayingMainHand: undefined,
  splitCount: 0
})

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  deck: [],
  players: [createInitialPlayer('Player 1', 0)],
  dealer: createHand(),
  currentPlayerIndex: 0,
  phase: 'betting',
  round: 1,
  rules: createRuleSet(GameVariant.VEGAS), // Default to Vegas rules
  gameMode: 'menu',
  stats: {
    handsPlayed: 0,
    roundsPlayed: 0,
    handsWon: 0,
    handsLost: 0,
    handsPushed: 0,
    blackjacks: 0,
    totalWinnings: 0,
    loansTaken: 0
  },
  tutorial: {
    currentStep: 0,
    isActive: false,
    completed: false,
    steps: TUTORIAL_STEPS
  },
  currentStrategyAdvice: null,
  currentTableLevel: TableLevel.BEGINNER,
  currentGameVariant: GameVariant.VEGAS,

  // Actions
  setGameMode: (mode: GameMode) => {
    set({ gameMode: mode })
    
    // Reset game state when going to menu or switching modes
    if (mode === 'menu' || mode === 'stats' || mode === 'reset') {
      // Don't initialize game for non-playing modes
      set({
        dealer: createHand(),
        currentPlayerIndex: 0,
        phase: 'betting',
        players: get().players.map(player => ({
          ...player,
          hand: createHand(),
          bet: 0,
          canDouble: false,
          canSplit: false,
          hasSplit: false,
          splitHand: undefined,
          lastHandWinnings: undefined,
          isPlayingMainHand: undefined,
          splitCount: 0
        }))
      })
    }
    
    
    if (mode === 'tutorial') {
      set({
        tutorial: {
          currentStep: 0,
          isActive: true,
          completed: false,
          steps: TUTORIAL_STEPS
        }
      })
    }
    
    // Initialize game for playing modes
    if (mode === 'normal' || mode === 'tutorial' || mode === 'easy') {
      get().initializeGame()
    }
  },
  setRules: (rules: RuleSet) => {
    set({ rules })
  },
  setTableLevel: (level: TableLevel) => {
    set({ currentTableLevel: level })
  },
  setGameVariant: (variant: GameVariant) => {
    const rules = createRuleSet(variant)
    set({ 
      currentGameVariant: variant,
      rules 
    })
  },
  initializeGame: () => {
    const state = get()
    const newDeck = shuffleDeck(createDeck())
    
    // Start a new session for advanced tracking
    statsTracker.startSession(state.currentTableLevel, state.currentGameVariant)
    
    set({
      deck: newDeck,
      dealer: createHand(),
      phase: 'betting',
      currentPlayerIndex: 0
    })
  },

  placeBet: (playerId: string, amount: number) => {
    const state = get()
    const playerIndex = state.players.findIndex(p => p.id === playerId)
    
    if (playerIndex === -1) return

    const updatedPlayers = state.players.map(player => {
      if (player.id === playerId) {
        const betDifference = amount - player.bet
        return { 
          ...player, 
          bet: amount, 
          chips: player.chips - betDifference 
        }
      }
      return player
    })

    set({
      players: updatedPlayers,
      currentPlayerIndex: state.currentPlayerIndex
    })
  },

  dealInitialCards: () => {
    const state = get()
    let currentDeck = [...state.deck]
    const updatedPlayers = [...state.players]
    let dealerHand = createHand()

    // Track round start
    statsTracker.recordRoundStart()

    // Deal first card to each player
    for (let i = 0; i < updatedPlayers.length; i++) {
      const { card, remainingDeck } = dealCard(currentDeck)
      currentDeck = remainingDeck
      updatedPlayers[i].hand = addCardToHand(updatedPlayers[i].hand, card)
    }

    // Deal first card to dealer (face down)
    const { card: dealerCard1, remainingDeck: deck1 } = dealCard(currentDeck)
    currentDeck = deck1
    dealerHand = addCardToHand(dealerHand, { ...dealerCard1, hidden: true })

    // Deal second card to each player
    for (let i = 0; i < updatedPlayers.length; i++) {
      const { card, remainingDeck } = dealCard(currentDeck)
      currentDeck = remainingDeck
      updatedPlayers[i].hand = addCardToHand(updatedPlayers[i].hand, card)
      
      // Update player action capabilities
      updatedPlayers[i].canDouble = canDouble(updatedPlayers[i].hand)
      updatedPlayers[i].canSplit = canSplit(updatedPlayers[i].hand, state.rules, updatedPlayers[i].splitCount || 0)
    }

    // Deal second card to dealer (face up)
    const { card: dealerCard2, remainingDeck: deck2 } = dealCard(currentDeck)
    currentDeck = deck2
    dealerHand = addCardToHand(dealerHand, dealerCard2)

    set({
      deck: currentDeck,
      players: updatedPlayers,
      dealer: dealerHand,
      phase: 'playing',
      currentPlayerIndex: 0
    })
  },

  playerAction: (playerId: string, action: GameAction) => {
    const state = get()
    let currentDeck = [...state.deck]
    const updatedPlayers = [...state.players]
    const playerIndex = updatedPlayers.findIndex(p => p.id === playerId)
    
    if (playerIndex === -1) return

    const player = updatedPlayers[playerIndex]

    // Track strategy decisions if we have advice available
    if (state.currentStrategyAdvice && state.dealer.cards[1]) {
      const currentHand = player.hasSplit && !player.isPlayingMainHand && player.splitHand 
        ? player.splitHand 
        : player.hand
      
      const optimalAction = state.currentStrategyAdvice.action
      const isOptimal = action === optimalAction
      const dealerUpCard = state.dealer.cards[1]
      const dealerUpValue = dealerUpCard.rank === 'A' ? 11 : 
                          ['J', 'Q', 'K'].includes(dealerUpCard.rank) ? 10 : 
                          parseInt(dealerUpCard.rank)

      statsTracker.recordStrategyDecision(
        action,
        optimalAction,
        isOptimal,
        currentHand.value,
        dealerUpValue
      )
    }

    switch (action) {
      case 'hit': {
        const { card, remainingDeck } = dealCard(currentDeck)
        currentDeck = remainingDeck
        
        if (player.hasSplit && !player.isPlayingMainHand && player.splitHand) {
          // Hit on split hand
          player.splitHand = addCardToHand(player.splitHand, card)
        } else {
          // Hit on main hand
          player.hand = addCardToHand(player.hand, card)
        }
        
        player.canDouble = false
        player.canSplit = false
        break
      }
      case 'stand': {
        // Player stands - no changes to hand
        break
      }
      case 'double': {
        if (player.canDouble && player.chips >= player.bet) {
          player.chips -= player.bet
          const { card, remainingDeck } = dealCard(currentDeck)
          currentDeck = remainingDeck
          
          if (player.hasSplit && !player.isPlayingMainHand && player.splitHand) {
            // Double on split hand
            player.splitHand = addCardToHand(player.splitHand, card)
            // Note: In split hands, each hand has its own bet equal to original bet
          } else {
            // Double on main hand
            player.bet *= 2
            player.hand = addCardToHand(player.hand, card)
          }
          
          player.canDouble = false
          player.canSplit = false
        }
        break
      }
      case 'split': {
        if (player.canSplit && player.chips >= player.bet && player.hand.cards.length === 2) {
          // Deduct chips for second bet
          player.chips -= player.bet
          
          // Create split hand from the second card
          const splitCard = player.hand.cards[1]
          player.splitHand = createHand([splitCard])
          
          // Keep first card in original hand
          const firstCard = player.hand.cards[0]
          player.hand = createHand([firstCard])
          
          // Deal new cards to both hands
          const { card: card1, remainingDeck: deck1 } = dealCard(currentDeck)
          currentDeck = deck1
          player.hand = addCardToHand(player.hand, card1)
          
          const { card: card2, remainingDeck: deck2 } = dealCard(currentDeck)
          currentDeck = deck2
          player.splitHand = addCardToHand(player.splitHand, card2)
          
          // Set split flags
          player.hasSplit = true
          player.canSplit = false
          player.canDouble = canDouble(player.hand) // Can still double on first hand
          player.isPlayingMainHand = true // Start with main hand
          
          // Player will continue playing first hand, then split hand
        }
        break
      }
    }

    // Handle split hand logic
    let nextPlayerIndex = state.currentPlayerIndex
    let shouldAdvancePlayer = false
    
    if (player.hasSplit && player.isPlayingMainHand && (player.hand.isBusted || action === 'stand' || action === 'double')) {
      // Just finished main hand, move to split hand
      player.isPlayingMainHand = false
      player.canDouble = player.splitHand ? canDouble(player.splitHand) : false
      player.canSplit = false // Can't split again
    } else if (player.hasSplit && !player.isPlayingMainHand && (player.splitHand?.isBusted || action === 'stand' || action === 'double')) {
      // Finished split hand, move to next player
      shouldAdvancePlayer = true
    } else if (!player.hasSplit && (player.hand.isBusted || action === 'stand' || action === 'double')) {
      // Regular hand finished, move to next player
      shouldAdvancePlayer = true
    }
    
    if (shouldAdvancePlayer) {
      nextPlayerIndex = state.currentPlayerIndex + 1
    }

    // Check if all players are done
    const allPlayersDone = nextPlayerIndex >= updatedPlayers.length
    const newPhase = allPlayersDone ? 'dealer' : 'playing'

    set({
      deck: currentDeck,
      players: updatedPlayers,
      currentPlayerIndex: nextPlayerIndex,
      phase: newPhase
    })

    // If all players are done, start dealer play
    if (allPlayersDone) {
      setTimeout(() => get().dealerPlay(), 1000)
    }
  },

  dealerPlay: () => {
    const state = get()
    let currentDeck = [...state.deck]
    let dealerHand = { ...state.dealer }

    // First, reveal dealer's hidden card
    dealerHand = createHand(dealerHand.cards.map(card => ({ ...card, hidden: false })))
    
    set({
      dealer: dealerHand
    })

    // Function to deal one card at a time with delays
    const dealNextCard = () => {
      const currentState = get()
      let currentDealerHand = currentState.dealer
      let currentDeck = [...currentState.deck]

      if (shouldDealerHit(currentDealerHand, currentState.rules)) {
        const { card, remainingDeck } = dealCard(currentDeck)
        currentDeck = remainingDeck
        currentDealerHand = addCardToHand(currentDealerHand, card)

        set({
          deck: currentDeck,
          dealer: currentDealerHand
        })

        // Continue dealing after a delay if dealer still needs to hit
        setTimeout(dealNextCard, 1000)
      } else {
        // Dealer is done, finish the round
        set({
          phase: 'finished'
        })
        setTimeout(() => get().finishRound(), 1000)
      }
    }

    // Start dealing additional cards after revealing the hidden card
    setTimeout(dealNextCard, 1000)
  },

  finishRound: () => {
    const state = get()
    let updatedStats = { ...state.stats }
    
    // Increment rounds played once per round (not per split hand)
    updatedStats.roundsPlayed++
    
    const updatedPlayers = state.players.map(player => {
      let totalPayout = 0
      let totalWinnings = 0
      
      // Calculate payout for main hand
      const mainPayout = calculatePayout(player.bet, player.hand, state.dealer, state.rules)
      const mainWinner = determineWinner(player.hand, state.dealer)
      const mainWinnings = mainPayout - player.bet
      
      totalPayout += mainPayout
      totalWinnings += mainWinnings
      
      // Update basic statistics for main hand
      updatedStats.handsPlayed++
      updatedStats.totalWinnings += mainWinnings
      
      if (mainWinner === 'player') {
        updatedStats.handsWon++
        if (player.hand.isBlackjack) {
          updatedStats.blackjacks++
        }
      } else if (mainWinner === 'dealer') {
        updatedStats.handsLost++
      } else {
        updatedStats.handsPushed++
      }

      // Track advanced statistics for main hand
      const mainResult = mainWinner === 'player' ? 'win' : 
                        mainWinner === 'dealer' ? 'loss' : 'push'
      statsTracker.recordHandResult(
        mainResult, 
        mainWinnings, 
        player.hand.isBlackjack,
        state.currentTableLevel,
        state.currentGameVariant
      )
      
      // Calculate payout for split hand if exists
      if (player.hasSplit && player.splitHand) {
        const splitPayout = calculatePayout(player.bet, player.splitHand, state.dealer, state.rules)
        const splitWinner = determineWinner(player.splitHand, state.dealer)
        const splitWinnings = splitPayout - player.bet
        
        totalPayout += splitPayout
        totalWinnings += splitWinnings
        
        // Update basic statistics for split hand
        updatedStats.handsPlayed++
        updatedStats.totalWinnings += splitWinnings
        
        if (splitWinner === 'player') {
          updatedStats.handsWon++
          if (player.splitHand.isBlackjack) {
            updatedStats.blackjacks++
          }
        } else if (splitWinner === 'dealer') {
          updatedStats.handsLost++
        } else {
          updatedStats.handsPushed++
        }

        // Track advanced statistics for split hand
        const splitResult = splitWinner === 'player' ? 'win' : 
                           splitWinner === 'dealer' ? 'loss' : 'push'
        statsTracker.recordHandResult(
          splitResult, 
          splitWinnings, 
          player.splitHand.isBlackjack,
          state.currentTableLevel,
          state.currentGameVariant
        )
      }
      
      return {
        ...player,
        chips: player.chips + totalPayout,
        bet: 0,
        lastHandWinnings: totalWinnings,
        hasSplit: false,
        splitHand: undefined,
        isPlayingMainHand: undefined
      }
    })

    set({
      players: updatedPlayers,
      stats: updatedStats,
      phase: 'finished'
    })
  },

  startNewRound: () => {
    const state = get()
    
    // Reset players for new round
    const updatedPlayers = state.players.map(player => ({
      ...player,
      hand: createHand(),
      bet: 0,
      canDouble: false,
      canSplit: false,
      hasSplit: false,
      splitHand: undefined,
      lastHandWinnings: undefined,
      isPlayingMainHand: undefined
    }))

    // Check if deck needs reshuffling (less than 20 cards remaining)
    let newDeck = state.deck
    if (newDeck.length < 20) {
      newDeck = shuffleDeck(createDeck())
    }

    set({
      deck: newDeck,
      players: updatedPlayers,
      dealer: createHand(),
      currentPlayerIndex: 0,
      phase: 'betting',
      round: state.round + 1
    })
  },

  addPlayer: (name: string) => {
    const state = get()
    const newPlayer = createInitialPlayer(name, state.players.length)
    set({
      players: [...state.players, newPlayer]
    })
  },

  removePlayer: (playerId: string) => {
    set((state) => ({
      players: state.players.filter(player => player.id !== playerId)
    }))
  },

  resetStats: () => {
    // Reset both basic stats and advanced tracking
    statsTracker.resetAllStats()
    
    set({
      stats: {
        handsPlayed: 0,
        roundsPlayed: 0,
        handsWon: 0,
        handsLost: 0,
        handsPushed: 0,
        blackjacks: 0,
        totalWinnings: 0,
        loansTaken: 0
      }
    })
  },

  // Tutorial actions
  nextTutorialStep: () => {
    const state = get()
    const nextStep = state.tutorial.currentStep + 1
    
    if (nextStep >= state.tutorial.steps.length) {
      // Tutorial complete
      set({
        tutorial: {
          ...state.tutorial,
          isActive: false,
          completed: true
        }
      })
    } else {
      set({
        tutorial: {
          ...state.tutorial,
          currentStep: nextStep
        }
      })
    }
  },

  skipTutorial: () => {
    set({
      tutorial: {
        ...get().tutorial,
        isActive: false,
        completed: true
      },
      gameMode: 'normal'
    })
  },

  resetTutorial: () => {
    set({
      tutorial: {
        currentStep: 0,
        isActive: false,
        completed: false,
        steps: TUTORIAL_STEPS
      }
    })
  },

  resetProgress: () => {
    // Reset stats
    const newStats = {
      handsPlayed: 0,
      roundsPlayed: 0,
      handsWon: 0,
      handsLost: 0,
      handsPushed: 0,
      blackjacks: 0,
      totalWinnings: 0,
      loansTaken: 0
    }
    
    // Reset player chips to starting amount
    const resetPlayers = get().players.map(player => ({
      ...player,
      chips: 250, // Reset to starting chips
      hand: createHand(),
      bet: 0,
      canDouble: false,
      canSplit: false,
      hasSplit: false,
      splitHand: undefined,
      lastHandWinnings: undefined,
      isPlayingMainHand: undefined
    }))

    set({
      stats: newStats,
      players: resetPlayers,
      dealer: createHand(),
      currentPlayerIndex: 0,
      phase: 'betting',
      round: 1,
      deck: shuffleDeck(createDeck())
    })
  },

  recordMenuExit: () => {
    const state = get()
    // Only record loss if there was an active bet
    const mainPlayer = state.players[0]
    if (mainPlayer && mainPlayer.bet > 0) {
      const updatedStats = {
        ...state.stats,
        handsPlayed: state.stats.handsPlayed + 1,
        roundsPlayed: state.stats.roundsPlayed + 1,
        handsLost: state.stats.handsLost + 1,
        totalWinnings: state.stats.totalWinnings - mainPlayer.bet
      }
      
      // Update player chips to reflect the loss
      const updatedPlayers = state.players.map((player, index) => {
        if (index === 0) { // Main player
          return {
            ...player,
            chips: player.chips // Chips were already deducted when bet was placed
          }
        }
        return player
      })
      
      set({ 
        stats: updatedStats,
        players: updatedPlayers
      })
    }
  },

  takeLoan: () => {
    const state = get()
    const loanAmount = 100
    
    const updatedStats = {
      ...state.stats,
      loansTaken: state.stats.loansTaken + 1
    }
    
    const updatedPlayers = state.players.map(player => ({
      ...player,
      chips: player.chips + loanAmount
    }))
    
    // Track loan in advanced statistics
    statsTracker.recordLoanTaken(loanAmount)
    
    set({
      stats: updatedStats,
      players: updatedPlayers
    })
  },

  // Strategy actions
  updateStrategyAdvice: () => {
    const state = get()
    
    // Only provide advice in easy mode during player's turn
    if (state.gameMode !== 'easy' || state.phase !== 'playing') {
      set({ currentStrategyAdvice: null })
      return
    }

    const currentPlayer = state.players[state.currentPlayerIndex]
    if (!currentPlayer || currentPlayer.hand.cards.length === 0) {
      set({ currentStrategyAdvice: null })
      return
    }

    // Get dealer's up card (second card, first is hidden)
    const dealerUpCard = state.dealer.cards[1]
    if (!dealerUpCard) {
      set({ currentStrategyAdvice: null })
      return
    }

    const advice = getBasicStrategyAdvice(
      currentPlayer.hand,
      dealerUpCard,
      currentPlayer.canDouble,
      currentPlayer.canSplit
    )

    set({ currentStrategyAdvice: advice })
  },

  clearStrategyAdvice: () => {
    set({ currentStrategyAdvice: null })
  }
}))