import { create } from 'zustand'
import { GameState, Player, GameAction, ChipDenomination, GameMode, GameStats, TableLevel, Card } from '@/types/game'
import { TutorialState, TUTORIAL_STEPS, VARIANT_TUTORIAL_STEPS } from '@/types/tutorial'
import { StrategyAdvice, getBasicStrategyAdvice } from '@/lib/strategy'
import { createDeck, shuffleDeck, dealCard } from '@/lib/deck'
import { createHand, addCardToHand, shouldDealerHit, calculatePayout, canDouble, canSplit, canSurrender, canInsurance, determineWinner } from '@/lib/blackjack'
import { createRuleSet, GameVariant, RuleSet } from '@/lib/ruleVariations'
import { statsTracker } from '@/lib/StatsTracker'
import { achievementEngine, Achievement } from '@/lib/achievementSystem'
import { playerProfileService } from '@/lib/PlayerProfileService'
import { tableUnlockService } from '@/lib/tableUnlockService'
import { authService } from '@/lib/supabase/auth'
import { gameDataService } from '@/lib/supabase/gameDataService'
import { ChallengeResult, bankrollChallengeEngine } from '@/lib/bankrollChallenges'
import { tournamentEngine } from '@/lib/tournamentSystem'
import { TABLE_CONFIGURATIONS } from '@/lib/tableSystem'

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
  newlyUnlockedAchievements: Achievement[]
  activeChallengeResult: ChallengeResult | null
  
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
  collectWinnings: () => void
  addPlayer: (name: string) => void
  removePlayer: (playerId: string) => void
  resetStats: () => void
  
  // Tutorial actions
  nextTutorialStep: () => void
  skipTutorial: () => void
  resetTutorial: () => void
  startVariantTutorial: (variant: GameVariant) => void
  
  // Reset actions
  resetProgress: () => void
  recordMenuExit: () => void
  takeLoan: () => void
  
  // Strategy actions
  updateStrategyAdvice: () => void
  clearStrategyAdvice: () => void
  
  // Achievement actions
  checkAchievements: () => void
  clearNewAchievements: () => void
  
  // Table unlock actions
  checkTableUnlocks: () => void
  
  // Challenge actions
  clearChallengeResult: () => void
}

// Helper function to save game data (either to localStorage or account)
const saveGameData = async (chips: number, stats: GameStats, tableLevel: TableLevel, variant: GameVariant) => {
  try {
    const user = await authService.getCurrentUser()
    
    if (user) {
      // Save to account
      const detailedStats = statsTracker.getStatisticsSummary()
      const achievements = achievementEngine.getUnlockedAchievements()
      const achievementProgress = achievementEngine.getAchievementProgress()
      const profile = playerProfileService.loadProfile()
      
      const gameData = {
        total_chips: chips,
        current_table_level: tableLevel,
        current_game_variant: variant,
        total_hands_played: stats.handsPlayed || 0,
        hands_won: stats.handsWon || 0,
        hands_lost: stats.handsLost || 0,
        hands_pushed: stats.handsPushed || 0,
        blackjacks_hit: stats.blackjacks || 0,
        total_winnings: stats.totalWinnings || 0,
        total_losses: 0, // Add if needed
        biggest_win: 0, // Add if needed
        biggest_loss: 0, // Add if needed
        winning_streak: 0, // Add if needed
        current_streak: 0, // Add if needed
        longest_winning_streak: stats.longestWinStreak || 0,
        hands_by_variant: detailedStats?.handsByVariant || {},
        hands_by_table_level: detailedStats?.handsByTableLevel || {},
        strategy_accuracy: detailedStats?.strategyAccuracy || {},
        betting_patterns: detailedStats?.bettingPatterns || {},
        achievements_unlocked: achievements.map(a => a.id),
        achievement_progress: achievementProgress,
        tables_unlocked: profile.tablesUnlocked || ['beginner'],
        variants_unlocked: profile.variantsUnlocked || ['vegas'],
        tutorial_progress: profile.tutorialProgress || {},
        multiplayer_games_played: 0, // Will be updated by multiplayer system
        multiplayer_games_won: 0,
        multiplayer_tables_hosted: 0,
        multiplayer_total_winnings: 0
      }
      
      await gameDataService.saveUserGameData(user.id, gameData)
    } else {
      // Save to localStorage (fallback)
      playerProfileService.updateChips(chips)
      playerProfileService.updateStats(stats)
      playerProfileService.updateTableLevel(tableLevel)
      playerProfileService.updateGameVariant(variant)
    }
  } catch (error) {
    console.error('Failed to save game data:', error)
    // Fallback to localStorage
    playerProfileService.updateChips(chips)
    playerProfileService.updateStats(stats)
    playerProfileService.updateTableLevel(tableLevel)
    playerProfileService.updateGameVariant(variant)
  }
}

// Load initial data from player profile or account
const loadInitialProfile = async () => {
  try {
    const user = await authService.getCurrentUser()
    
    if (user) {
      // Load from account
      const gameData = await gameDataService.loadUserGameData(user.id)
      
      if (gameData) {
        // Update local systems with account data
        if (gameData.achievements_unlocked) {
          achievementEngine.loadAchievements(gameData.achievements_unlocked, gameData.achievement_progress || {})
        }
        
        return {
          chips: gameData.total_chips,
          currentTableLevel: gameData.current_table_level as TableLevel,
          currentGameVariant: gameData.current_game_variant as GameVariant,
          stats: {
            handsPlayed: gameData.total_hands_played,
            roundsPlayed: 0, // Not stored separately
            handsWon: gameData.hands_won,
            handsLost: gameData.hands_lost,
            handsPushed: gameData.hands_pushed,
            blackjacks: gameData.blackjacks_hit,
            totalWinnings: gameData.total_winnings,
            loansTaken: 0, // Add if needed
            longestWinStreak: gameData.longest_winning_streak
          },
          tablesUnlocked: gameData.tables_unlocked || ['beginner'],
          variantsUnlocked: gameData.variants_unlocked || ['vegas'],
          tutorialProgress: gameData.tutorial_progress || {}
        }
      } else {
        // Migrate localStorage data to account
        await gameDataService.migrateLocalStorageToAccount(user.id)
        return playerProfileService.loadProfile()
      }
    }
  } catch (error) {
    console.error('Failed to load account data:', error)
  }
  
  // Fallback to localStorage
  return playerProfileService.loadProfile()
}

const createInitialPlayer = (name: string, position: number, chips?: number): Player => ({
  id: `player-${Date.now()}-${position}`,
  name,
  chips: chips ?? 250, // Use saved chips or default to 250
  hand: createHand(),
  bet: 0,
  canDouble: false,
  canSplit: false,
  canSurrender: false,
  canInsurance: false,
  hasSplit: false,
  hasSurrendered: false,
  hasInsurance: false,
  insuranceBet: 0,
  position,
  lastHandWinnings: undefined,
  isPlayingMainHand: undefined,
  splitCount: 0
})

export const useGameStore = create<GameStore>((set, get) => {
  // Load initial profile data synchronously (will be updated async)
  const initialProfile = playerProfileService.loadProfile()
  
  // Load account data asynchronously
  loadInitialProfile().then(profile => {
    const state = get()
    set({
      players: [createInitialPlayer('Player 1', 0, profile.chips)],
      currentTableLevel: profile.currentTableLevel,
      currentGameVariant: profile.currentGameVariant,
      rules: createRuleSet(profile.currentGameVariant),
      stats: profile.stats
    })
    
    // Update PlayerProfileService with loaded data for backward compatibility
    playerProfileService.updateChips(profile.chips)
    playerProfileService.updateStats(profile.stats)
    playerProfileService.updateTableLevel(profile.currentTableLevel)
    playerProfileService.updateGameVariant(profile.currentGameVariant)
    
    if (profile.tablesUnlocked) {
      playerProfileService.loadProfile().tablesUnlocked = profile.tablesUnlocked
    }
    if (profile.variantsUnlocked) {
      playerProfileService.loadProfile().variantsUnlocked = profile.variantsUnlocked
    }
    if (profile.tutorialProgress) {
      playerProfileService.loadProfile().tutorialProgress = profile.tutorialProgress
    }
  }).catch(console.error)
  
  return {
    // Initial state
    deck: [],
    players: [createInitialPlayer('Player 1', 0, initialProfile.chips)],
    dealer: createHand(),
    currentPlayerIndex: 0,
    phase: 'betting' as const,
    round: 1,
    rules: createRuleSet(initialProfile.currentGameVariant),
    gameMode: 'menu' as GameMode,
    stats: initialProfile.stats,
    tutorial: {
      currentStep: 0,
      isActive: false,
      completed: false,
      steps: TUTORIAL_STEPS
    },
    currentStrategyAdvice: null,
    currentTableLevel: initialProfile.currentTableLevel,
    currentGameVariant: initialProfile.currentGameVariant,
    newlyUnlockedAchievements: [],
    activeChallengeResult: null,

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
          canSurrender: false,
          canInsurance: false,
          hasSplit: false,
          hasSurrendered: false,
          hasInsurance: false,
          insuranceBet: 0,
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
    const state = get()
    set({ currentTableLevel: level })
    
    // Save updated table level
    const mainPlayer = state.players[0]
    if (mainPlayer) {
      saveGameData(mainPlayer.chips, state.stats, level, state.currentGameVariant)
    }
  },
  setGameVariant: (variant: GameVariant) => {
    const state = get()
    const rules = createRuleSet(variant)
    set({ 
      currentGameVariant: variant,
      rules 
    })
    
    // Save updated variant
    const mainPlayer = state.players[0]
    if (mainPlayer) {
      saveGameData(mainPlayer.chips, state.stats, state.currentTableLevel, variant)
    }
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

    // Check table betting limits
    const tableConfig = TABLE_CONFIGURATIONS[state.currentTableLevel]
    const player = state.players[playerIndex]
    
    // Allow all-in betting if player has less than minimum bet but more than 0 chips
    const isAllInBet = player.chips > 0 && player.chips < tableConfig.minBet && amount === player.chips
    
    if (!isAllInBet && (amount < tableConfig.minBet || amount > tableConfig.maxBet)) {
      // Bet outside table limits (unless it's a valid all-in bet)
      return
    }

    // Check if bet is allowed by active challenge rules
    const activeChallenge = bankrollChallengeEngine.getActiveChallenge()
    if (activeChallenge && !bankrollChallengeEngine.isBetAllowed(activeChallenge.challenge.id, amount)) {
      // Bet not allowed by challenge rules
      return
    }

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

    // Deal first card to dealer based on variant
    const { card: dealerCard1, remainingDeck: deck1 } = dealCard(currentDeck)
    currentDeck = deck1
    if (state.rules?.noHoleCard) {
      // European style - dealer gets first card face up
      dealerHand = addCardToHand(dealerHand, dealerCard1)
    } else {
      // Vegas/Atlantic City style - dealer gets first card face down (hole card)
      dealerHand = addCardToHand(dealerHand, { ...dealerCard1, hidden: true })
    }

    // Deal second card to each player
    for (let i = 0; i < updatedPlayers.length; i++) {
      const { card, remainingDeck } = dealCard(currentDeck)
      currentDeck = remainingDeck
      updatedPlayers[i].hand = addCardToHand(updatedPlayers[i].hand, card)
      
      // Update player action capabilities
      updatedPlayers[i].canDouble = canDouble(updatedPlayers[i].hand)
      updatedPlayers[i].canSplit = canSplit(updatedPlayers[i].hand, state.rules, updatedPlayers[i].splitCount || 0)
      updatedPlayers[i].canSurrender = canSurrender(updatedPlayers[i].hand, state.rules)
    }

    // Set dealer's up card based on variant rules
    let dealerUpCard: Card
    if (state.rules?.noHoleCard) {
      // European style - dealer only has one card (already face up)
      dealerUpCard = dealerHand.cards[0]
    } else {
      // Vegas/Atlantic City style - dealer gets second card face up  
      const { card: dealerCard2, remainingDeck: deck2 } = dealCard(currentDeck)
      currentDeck = deck2
      dealerHand = addCardToHand(dealerHand, dealerCard2)
      dealerUpCard = dealerCard2
    }

    // Set insurance availability based on dealer's up card
    for (let i = 0; i < updatedPlayers.length; i++) {
      updatedPlayers[i].canInsurance = canInsurance(dealerUpCard, state.rules)
    }

    // Find the first player who doesn't have blackjack (auto-stand those with blackjack)
    let currentPlayerIndex = 0
    while (currentPlayerIndex < updatedPlayers.length && updatedPlayers[currentPlayerIndex].hand.isBlackjack) {
      currentPlayerIndex++
    }

    // If all players have blackjack, go directly to dealer phase
    const allPlayersHaveBlackjack = currentPlayerIndex >= updatedPlayers.length
    const phase = allPlayersHaveBlackjack ? 'dealer' : 'playing'

    set({
      deck: currentDeck,
      players: updatedPlayers,
      dealer: dealerHand,
      phase: phase,
      currentPlayerIndex: currentPlayerIndex
    })

    // If all players have blackjack, start dealer play immediately
    if (allPlayersHaveBlackjack) {
      setTimeout(() => get().dealerPlay(), 1000)
    }
  },

  playerAction: (playerId: string, action: GameAction) => {
    const state = get()
    let currentDeck = [...state.deck]
    const updatedPlayers = [...state.players]
    const playerIndex = updatedPlayers.findIndex(p => p.id === playerId)
    
    if (playerIndex === -1) return

    // Check if action is allowed by active challenge rules
    const activeChallenge = bankrollChallengeEngine.getActiveChallenge()
    if (activeChallenge && !bankrollChallengeEngine.isActionAllowed(activeChallenge.challenge.id, action)) {
      // Action not allowed by challenge rules
      return
    }

    const player = updatedPlayers[playerIndex]

    // Track strategy decisions if we have advice available
    if (state.currentStrategyAdvice) {
      const currentHand = player.hasSplit && !player.isPlayingMainHand && player.splitHand 
        ? player.splitHand 
        : player.hand
      
      const optimalAction = state.currentStrategyAdvice.action
      const isOptimal = action === optimalAction
      
      // Get dealer up card based on variant
      let dealerUpCard: Card | undefined
      if (state.rules?.noHoleCard) {
        // European variant - dealer only has one visible card
        dealerUpCard = state.dealer.cards[0]
      } else {
        // Vegas/Atlantic City - second card is the up card
        dealerUpCard = state.dealer.cards[1]
      }
      
      if (dealerUpCard) {
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
          
          // Increment split count
          player.splitCount = (player.splitCount || 0) + 1
          
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
          player.canSplit = canSplit(player.hand, state.rules, player.splitCount) // Check if can split again
          player.canDouble = canDouble(player.hand) // Can still double on first hand
          player.isPlayingMainHand = true // Start with main hand
          
          // Player will continue playing first hand, then split hand
        }
        break
      }
      case 'surrender': {
        if (player.canSurrender) {
          player.hasSurrendered = true
          player.chips += Math.floor(player.bet / 2) // Return half the bet
          player.canDouble = false
          player.canSplit = false
          player.canSurrender = false
        }
        break
      }
      case 'insurance': {
        if (player.canInsurance && player.chips >= Math.floor(player.bet / 2)) {
          const insuranceBet = Math.floor(player.bet / 2)
          player.chips -= insuranceBet
          player.insuranceBet = insuranceBet
          player.hasInsurance = true
          player.canInsurance = false
        }
        break
      }
    }

    // Handle split hand logic
    let nextPlayerIndex = state.currentPlayerIndex
    let shouldAdvancePlayer = false
    
    if (player.hasSplit && player.isPlayingMainHand && (player.hand.isBusted || player.hand.isBlackjack || action === 'stand' || action === 'double')) {
      // Just finished main hand, move to split hand
      player.isPlayingMainHand = false
      player.canDouble = player.splitHand ? canDouble(player.splitHand) : false
      player.canSplit = false // Can't split again
      
      // If split hand also has blackjack, auto-advance to next player
      if (player.splitHand?.isBlackjack) {
        shouldAdvancePlayer = true
      }
    } else if (player.hasSplit && !player.isPlayingMainHand && (player.splitHand?.isBusted || player.splitHand?.isBlackjack || action === 'stand' || action === 'double')) {
      // Finished split hand, move to next player
      shouldAdvancePlayer = true
    } else if (!player.hasSplit && (player.hand.isBusted || player.hand.isBlackjack || action === 'stand' || action === 'double')) {
      // Regular hand finished, move to next player
      shouldAdvancePlayer = true
    }
    
    if (shouldAdvancePlayer) {
      nextPlayerIndex = state.currentPlayerIndex + 1
      // Skip players with blackjack (they auto-stand)
      while (nextPlayerIndex < updatedPlayers.length && updatedPlayers[nextPlayerIndex].hand.isBlackjack) {
        nextPlayerIndex++
      }
    }

    // Check if all players are done
    const allPlayersDone = nextPlayerIndex >= updatedPlayers.length
    
    // Check if all players have busted or surrendered (dealer doesn't need to play)
    const allPlayersBustedOrSurrendered = updatedPlayers.every(player => {
      if (player.hasSurrendered) return true
      if (player.hasSplit) {
        // For split hands, both hands must be busted
        return player.hand.isBusted && player.splitHand?.isBusted
      } else {
        // For regular hands, just check if main hand is busted
        return player.hand.isBusted
      }
    })
    
    const newPhase = allPlayersDone ? (allPlayersBustedOrSurrendered ? 'finished' : 'dealer') : 'playing'

    set({
      deck: currentDeck,
      players: updatedPlayers,
      currentPlayerIndex: nextPlayerIndex,
      phase: newPhase
    })

    // If all players are done, start dealer play (unless all busted/surrendered)
    if (allPlayersDone && !allPlayersBustedOrSurrendered) {
      setTimeout(() => get().dealerPlay(), 1000)
    } else if (allPlayersDone && allPlayersBustedOrSurrendered) {
      // All players busted/surrendered, skip dealer and finish round
      setTimeout(() => {
        set({ phase: 'finished' })
        setTimeout(() => get().finishRound(), 1000)
      }, 1000)
    }
  },

  dealerPlay: () => {
    const state = get()
    let currentDeck = [...state.deck]
    let dealerHand = { ...state.dealer }

    // Handle European no-hole-card variant
    if (state.rules?.noHoleCard && dealerHand.cards.length === 1) {
      // Deal the second card for European variant
      const { card, remainingDeck } = dealCard(currentDeck)
      currentDeck = remainingDeck
      dealerHand = addCardToHand(dealerHand, card)
    } else {
      // First, reveal dealer's hidden card for Vegas/Atlantic City variants
      dealerHand = createHand(dealerHand.cards.map(card => ({ ...card, hidden: false })))
    }
    
    set({
      deck: currentDeck,
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
        
        // Ensure all cards are visible for proper value calculation
        currentDealerHand = createHand(currentDealerHand.cards.map(card => ({ ...card, hidden: false })))

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
        setTimeout(() => {
          const currentState = get()
          // Only finish round if we're still in finished phase (not already started new round)
          if (currentState.phase === 'finished') {
            get().finishRound()
          }
        }, 1000)
      }
    }

    // Start dealing additional cards after revealing the hidden card
    setTimeout(dealNextCard, 1000)
  },

  finishRound: () => {
    const state = get()
    const updatedStats = { ...state.stats }
    
    // Increment rounds played once per round (not per split hand)
    updatedStats.roundsPlayed++
    
    const updatedPlayers = state.players.map(player => {
      let totalPayout = 0
      let totalWinnings = 0
      
      // Handle surrendered hands first
      if (player.hasSurrendered) {
        // Surrendered hands already received half bet back during surrender
        // No additional payout needed
        totalPayout = 0
        totalWinnings = -Math.floor(player.bet / 2) // Lost half the bet
      } else {
        // Calculate payout for main hand (non-surrendered)
        const mainPayout = calculatePayout(player.bet, player.hand, state.dealer, state.rules)
        const mainWinnings = mainPayout - player.bet
        
        totalPayout += mainPayout
        totalWinnings += mainWinnings
      }
      
      // Handle insurance payouts
      if (player.hasInsurance && player.insuranceBet > 0) {
        if (state.dealer.isBlackjack) {
          // Insurance pays 2:1 when dealer has blackjack
          const insurancePayout = player.insuranceBet * 3 // Return bet + 2:1 winnings
          totalPayout += insurancePayout
          totalWinnings += player.insuranceBet * 2 // Net insurance winnings (2:1)
        }
        // If dealer doesn't have blackjack, insurance bet is already lost (taken during playerAction)
      }
      
      // Update basic statistics for main hand
      updatedStats.handsPlayed++
      updatedStats.totalWinnings += totalWinnings
      
      if (player.hasSurrendered) {
        updatedStats.handsLost++ // Surrendered hands count as losses
      } else {
        const mainWinner = determineWinner(player.hand, state.dealer)
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
      }

      // Track advanced statistics for main hand
      if (player.hasSurrendered) {
        statsTracker.recordHandResult(
          'loss', 
          totalWinnings, 
          false, // Surrendered hands can't be blackjack
          state.currentTableLevel,
          state.currentGameVariant
        )
      } else {
        const mainWinner = determineWinner(player.hand, state.dealer)
        const mainResult = mainWinner === 'player' ? 'win' : 
                          mainWinner === 'dealer' ? 'loss' : 'push'
        statsTracker.recordHandResult(
          mainResult, 
          totalWinnings, 
          player.hand.isBlackjack,
          state.currentTableLevel,
          state.currentGameVariant
        )
      }
      
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
        hasSurrendered: false,
        hasInsurance: false,
        insuranceBet: 0,
        splitHand: undefined,
        isPlayingMainHand: undefined
      }
    })

    set({
      players: updatedPlayers,
      stats: updatedStats,
      phase: 'finished'
    })
    
    // Save player progress after each round
    const mainPlayer = updatedPlayers[0]
    if (mainPlayer) {
      saveGameData(mainPlayer.chips, updatedStats, state.currentTableLevel, state.currentGameVariant)
      
      // Check for new achievements and table unlocks after each round
      get().checkAchievements()
      get().checkTableUnlocks()
      
      // Update bankroll challenge progress if active
      const activeChallenge = bankrollChallengeEngine.getActiveChallenge()
      if (activeChallenge) {
        const challengeResult = bankrollChallengeEngine.updateChallengeProgress(
          activeChallenge.challenge.id,
          mainPlayer.chips,
          updatedStats.handsPlayed
        )
        
        if (challengeResult) {
          set({ activeChallengeResult: challengeResult })
          
          // Award bonus chips if challenge was successful
          if (challengeResult.success && challengeResult.reward) {
            const bonusChips = challengeResult.reward.chips
            const updatedPlayersWithBonus = updatedPlayers.map((player, index) => {
              if (index === 0) { // Main player
                return { ...player, chips: player.chips + bonusChips }
              }
              return player
            })
            
            set({ players: updatedPlayersWithBonus })
            
            // Update saved chips
            saveGameData(updatedPlayersWithBonus[0].chips, updatedStats, state.currentTableLevel, state.currentGameVariant)
          }
        }
      }
    }
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
      canSurrender: false,
      canInsurance: false,
      hasSplit: false,
      hasSurrendered: false,
      hasInsurance: false,
      insuranceBet: 0,
      splitHand: undefined,
      lastHandWinnings: undefined,
      isPlayingMainHand: undefined,
      splitCount: 0
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

  // New function to collect winnings and allow next round
  collectWinnings: () => {
    const state = get()
    const updatedPlayers = state.players.map(player => ({
      ...player,
      lastHandWinnings: undefined
    }))
    
    set({
      players: updatedPlayers
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
        loansTaken: 0,
        longestWinStreak: 0
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

  startVariantTutorial: (variant: GameVariant) => {
    const variantSteps = VARIANT_TUTORIAL_STEPS[variant]
    const variantRules = createRuleSet(variant)
    set({
      tutorial: {
        currentStep: 0,
        isActive: true,
        completed: false,
        steps: variantSteps
      },
      gameMode: 'tutorial',
      currentGameVariant: variant,
      rules: variantRules
    })
  },

  resetProgress: () => {
    // Abandon active bankroll challenge if any
    const activeChallenge = bankrollChallengeEngine.getActiveChallenge()
    if (activeChallenge) {
      bankrollChallengeEngine.abandonChallenge(activeChallenge.challenge.id)
    }
    
    // Abandon active tournament if any
    const activeTournament = tournamentEngine.getActiveTournament()
    if (activeTournament) {
      const mainPlayer = get().players[0]
      if (mainPlayer) {
        tournamentEngine.leaveTournament(activeTournament.id, mainPlayer.id)
      }
    }
    
    // Reset stats tracker
    statsTracker.resetAllStats()
    
    // Reset achievement engine
    achievementEngine.resetAchievements()
    
    // Reset stats
    const newStats = {
      handsPlayed: 0,
      roundsPlayed: 0,
      handsWon: 0,
      handsLost: 0,
      handsPushed: 0,
      blackjacks: 0,
      totalWinnings: 0,
      loansTaken: 0,
      longestWinStreak: 0
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
    
    // Reset profile service
    playerProfileService.resetProfile()

    set({
      stats: newStats,
      players: resetPlayers,
      dealer: createHand(),
      currentPlayerIndex: 0,
      phase: 'betting',
      round: 1,
      deck: shuffleDeck(createDeck()),
      currentTableLevel: 'beginner',
      currentGameVariant: 'vegas',
      rules: createRuleSet('vegas')
    })
    
    // Save reset progress
    saveGameData(250, newStats, 'beginner', 'vegas')
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
    
    // Save updated chips and stats
    const mainPlayer = updatedPlayers[0]
    if (mainPlayer) {
      saveGameData(mainPlayer.chips, updatedStats, state.currentTableLevel, state.currentGameVariant)
    }
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

    // Get dealer's up card - handle both European (first card) and Vegas/Atlantic City (second card)
    let dealerUpCard: Card | undefined
    if (state.rules?.noHoleCard) {
      // European variant - dealer only has one visible card
      dealerUpCard = state.dealer.cards[0]
    } else {
      // Vegas/Atlantic City - second card is the up card (first is hidden)
      dealerUpCard = state.dealer.cards[1]
    }
    
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

    set({ currentStrategyAdvice: advice });
  },

  clearStrategyAdvice: () => {
    set({ currentStrategyAdvice: null });
  },

  // Achievement methods
  checkAchievements: () => {
    const detailedStats = statsTracker.getStatisticsSummary();
    const newAchievements = achievementEngine.checkAchievements(detailedStats);
    
    if (newAchievements.length > 0) {
      set({ newlyUnlockedAchievements: newAchievements });
    }
  },

  clearNewAchievements: () => {
    set({ newlyUnlockedAchievements: [] });
  },

  // Table unlock methods
  checkTableUnlocks: () => {
    const state = get()
    const mainPlayer = state.players[0]
    
    if (!mainPlayer) return
    
    // Get all available tables based on current progress
    const availableTables = tableUnlockService.getAvailableTables(mainPlayer.chips, state.stats)
    const profile = playerProfileService.loadProfile()
    
    // Check each available table and permanently unlock it
    availableTables.forEach(tableConfig => {
      if (!profile.unlockedTables.includes(tableConfig.level)) {
        console.log(`Unlocking table: ${tableConfig.name}`)
        playerProfileService.unlockTable(tableConfig.level)
      }
    })
  },

  // Challenge methods
  clearChallengeResult: () => {
    set({ activeChallengeResult: null });
  }
  }
})
