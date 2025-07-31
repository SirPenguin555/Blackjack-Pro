'use client'

import { useEffect, useState } from 'react'
import { useGameStore, CHIP_DENOMINATIONS } from '@/store/gameStore'
import { GameAction } from '@/types/game'
import { Hand } from './Hand'
import { ChipSelector } from './ChipSelector'
import { GameActions } from './GameActions'
import { TitleScreen } from './TitleScreen'
import { TutorialOverlay } from './TutorialOverlay'
import { StatsScreen } from './StatsScreen'
import { SaveLoadScreen } from './SaveLoadScreen'
import { ResetConfirmation } from './ResetConfirmation'
import { MenuWarning } from './MenuWarning'
import { BankruptcyScreen } from './BankruptcyScreen'
import { StrategyHint } from './StrategyHint'
import { HelpScreen } from './HelpScreen'
import { SplitHand } from './SplitHand'
import { AudioControls } from './AudioControls'
import { MultiplayerLobby } from './MultiplayerLobby'
import { MultiplayerGame } from './MultiplayerGame'
import { AchievementNotification } from './AchievementNotification'
import { useAudio } from '@/hooks/useAudio'
import { useGameSounds } from '@/hooks/useGameSounds'
import { useDynamicMusic } from '@/hooks/useDynamicMusic'
import { getSoundService } from '@/lib/audio/SoundService'
import { useMultiplayerStore } from '@/store/multiplayerStore'

export function BlackjackGame() {
  const {
    players,
    dealer,
    phase,
    currentPlayerIndex,
    round,
    gameMode,
    stats,
    tutorial,
    currentStrategyAdvice,
    setGameMode,
    initializeGame,
    placeBet,
    dealInitialCards,
    playerAction,
    startNewRound,
    nextTutorialStep,
    skipTutorial,
    resetStats,
    resetProgress,
    recordMenuExit,
    takeLoan,
    updateStrategyAdvice,
    clearStrategyAdvice,
    newlyUnlockedAchievements,
    clearNewAchievements
  } = useGameStore()

  const currentPlayer = players[currentPlayerIndex]
  const mainPlayer = players[0] // For single player, we'll focus on the first player
  
  // Multiplayer state
  const { currentTable, currentGame } = useMultiplayerStore()
  
  // Audio system
  const { audioManager } = useAudio()
  const soundService = getSoundService()
  useGameSounds() // Hook that monitors game state and plays outcome sounds
  useDynamicMusic(audioManager) // Hook that adjusts music based on game state
  
  // Initialize sound service with audio manager
  useEffect(() => {
    soundService.setAudioManager(audioManager)
  }, [audioManager, soundService])
  
  // Auto-start background music on first user interaction (muted by default)
  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (audioManager && (gameMode === 'normal' || gameMode === 'tutorial' || gameMode === 'easy')) {
        try {
          await audioManager.play()
        } catch (error) {
          console.warn('Could not auto-start audio:', error)
        }
        // Remove the event listener after first interaction
        document.removeEventListener('click', handleFirstInteraction)
        document.removeEventListener('keydown', handleFirstInteraction)
      }
    }

    document.addEventListener('click', handleFirstInteraction)
    document.addEventListener('keydown', handleFirstInteraction)

    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [audioManager, gameMode])
  
  // State for menu warning
  const [showMenuWarning, setShowMenuWarning] = useState(false)
  
  
  // Check for bankruptcy - only show after a round completes, not at the start
  const isBankrupt = mainPlayer && mainPlayer.chips === 0 && mainPlayer.bet === 0 && (phase === 'finished' || phase === 'betting')

  // Update strategy advice in easy mode
  useEffect(() => {
    if (gameMode === 'easy') {
      updateStrategyAdvice()
    } else {
      clearStrategyAdvice()
    }
  }, [gameMode, phase, currentPlayerIndex, mainPlayer?.hand, dealer, updateStrategyAdvice, clearStrategyAdvice])


  const handleBetChange = (amount: number) => {
    if (mainPlayer && phase === 'betting') {
      const oldBet = mainPlayer.bet
      placeBet(mainPlayer.id, amount)
      
      // Play appropriate chip sound based on action
      if (amount > oldBet) {
        // Adding chips - play chip stack sound
        soundService.playChipStack()
      } else if (amount < oldBet) {
        // Removing chips - play chip collect sound
        soundService.playChipCollect()
      } else if (amount > 0) {
        // Same amount or initial bet - play chip place sound
        soundService.playChipPlace()
      }
    }
  }

  const handleStartRound = () => {
    if (mainPlayer && mainPlayer.bet > 0) {
      dealInitialCards()
    }
  }

  const handlePlayerAction = (action: GameAction) => {
    if (currentPlayer) {
      playerAction(currentPlayer.id, action)
    }
  }

  const handleNewRound = () => {
    startNewRound()
  }

  const handleBackToMenu = () => {
    // Check if there's an active game that would result in a loss
    const isGameActive = mainPlayer && (
      mainPlayer.bet > 0 && // Player has placed a bet
      (phase === 'playing' || phase === 'dealing' || phase === 'dealer') // Game is in progress
    )
    
    if (isGameActive) {
      setShowMenuWarning(true)
    } else {
      setGameMode('menu')
    }
  }

  const handleConfirmMenuExit = () => {
    // Record the loss in statistics if there was an active bet
    recordMenuExit()
    setShowMenuWarning(false)
    setGameMode('menu')
  }

  const handleCancelMenuExit = () => {
    setShowMenuWarning(false)
  }

  const handleBankruptcyReset = () => {
    resetProgress()
  }

  const handleTakeLoan = () => {
    takeLoan()
    // Play chip stacking sound for receiving loan money
    soundService.playChipStack()
  }

  // Tutorial logic
  const currentTutorialStep = tutorial.steps[tutorial.currentStep]
  const isTutorialActive = gameMode === 'tutorial' && tutorial.isActive

  // No auto-advance - removed

  // Check if tutorial step requirements are met
  const canAdvanceTutorial = () => {
    if (!currentTutorialStep) return false
    
    switch (currentTutorialStep.action) {
      case 'bet':
        return mainPlayer && mainPlayer.bet >= 5 // Lower requirement to $5
      case 'deal':
        return phase !== 'betting'
      case 'hit':
        return phase !== 'playing' || currentPlayer?.hand.cards.length > 2
      case 'observe':
        return phase === 'finished'
      default:
        return true
    }
  }

  // Get highlight class for tutorial
  const getHighlightClass = (element: string) => {
    if (isTutorialActive && currentTutorialStep?.highlight === element) {
      return 'ring-4 ring-yellow-400 ring-opacity-75 animate-pulse'
    }
    return ''
  }

  // Show title screen if in menu mode
  if (gameMode === 'menu') {
    return <TitleScreen onModeSelect={setGameMode} />
  }

  // Show stats screen if in stats mode
  if (gameMode === 'stats') {
    return (
      <StatsScreen
        stats={stats}
        onBack={() => setGameMode('menu')}
        onReset={() => {
          resetStats()
          setGameMode('menu')
        }}
      />
    )
  }
  
  // Show save/load screen if in saveload mode
  if (gameMode === 'saveload') {
    return (
      <SaveLoadScreen
        onBack={() => setGameMode('menu')}
        onProfileLoaded={() => {
          // Reload the page to refresh all game state with loaded profile
          window.location.reload()
        }}
      />
    )
  }

  // Show help screen if in help mode
  if (gameMode === 'help') {
    return (
      <HelpScreen
        onBack={() => setGameMode('menu')}
      />
    )
  }

  // Show multiplayer lobby if in multiplayer mode
  if (gameMode === 'multiplayer') {
    // If we're in an active multiplayer game, show the game
    if (currentTable && currentGame) {
      return (
        <MultiplayerGame
          onBack={() => setGameMode('menu')}
        />
      )
    }
    
    // Otherwise show the lobby
    return (
      <MultiplayerLobby
        onBack={() => setGameMode('menu')}
      />
    )
  }

  // Show reset confirmation if in reset mode
  if (gameMode === 'reset') {
    return (
      <ResetConfirmation
        onConfirm={() => {
          resetProgress()
          setGameMode('menu')
        }}
        onCancel={() => setGameMode('menu')}
      />
    )
  }

  if (!mainPlayer) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  // Show bankruptcy screen if player is out of chips
  if (isBankrupt) {
    return (
      <BankruptcyScreen
        onReset={handleBankruptcyReset}
        onLoan={handleTakeLoan}
      />
    )
  }

  return (
    <div className="min-h-screen bg-green-800 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="relative flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <button
                onClick={handleBackToMenu}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                ← Menu
              </button>
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2 text-yellow-400 font-semibold text-sm sm:text-base">
              {gameMode === 'normal' ? 'Classic Mode' : 
               gameMode === 'tutorial' ? 'Tutorial Mode' : 
               gameMode === 'easy' ? 'Easy Mode' : 'Game Mode'}
            </div>
            <AudioControls 
              audioManager={audioManager}
              className="text-sm"
            />
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Blackjack Pro</h1>
          <div className="text-white text-sm sm:text-base">
            Round {round} | Chips: ${mainPlayer.chips}
            {phase === 'finished' && mainPlayer.lastHandWinnings !== undefined && (
              <span className={`ml-2 font-bold ${
                mainPlayer.lastHandWinnings > 0 ? 'text-green-400' : 
                mainPlayer.lastHandWinnings < 0 ? 'text-red-400' : 'text-yellow-400'
              }`}>
                ({mainPlayer.lastHandWinnings > 0 ? '+' : ''}${mainPlayer.lastHandWinnings})
              </span>
            )}
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-green-700 rounded-lg p-3 sm:p-6 shadow-xl">
          {/* Dealer Section */}
          <div className={`mb-6 sm:mb-8 rounded-lg p-2 ${getHighlightClass('dealer')}`}>
            <Hand 
              hand={dealer} 
              label="Dealer" 
              className="justify-center"
            />
          </div>

          {/* Player Section */}
          <div className={`mb-6 sm:mb-8 rounded-lg p-2 ${getHighlightClass('player')}`}>
            <SplitHand 
              mainHand={mainPlayer.hand} 
              splitHand={mainPlayer.splitHand}
              label={`${mainPlayer.name} (Bet: $${mainPlayer.bet}${mainPlayer.hasSplit ? ' each hand' : ''})`}
              className="justify-center"
              isPlayingMainHand={mainPlayer.isPlayingMainHand}
            />
          </div>

          {/* Game Controls */}
          <div className="flex flex-col items-center space-y-6">
            {phase === 'betting' && (
              <div className="space-y-4">
                <div className={`rounded-lg p-2 ${getHighlightClass('chips')}`}>
                  <ChipSelector
                    denominations={CHIP_DENOMINATIONS}
                    selectedBet={mainPlayer.bet}
                    onBetChange={handleBetChange}
                    maxBet={mainPlayer.chips}
                  />
                </div>
                <div className={`text-center ${getHighlightClass('cards')}`}>
                  <button
                    onClick={handleStartRound}
                    disabled={mainPlayer.bet === 0}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Deal Cards
                  </button>
                </div>
              </div>
            )}

            {phase === 'playing' && currentPlayer && (
              <div className="space-y-4">
                <div className="text-center text-white">
                  <div className="text-lg font-semibold">
                    {currentPlayer.name}&apos;s Turn
                  </div>
                </div>
                <div className={`rounded-lg p-2 ${getHighlightClass('actions')}`}>
                  <GameActions
                    player={currentPlayer}
                    onAction={handlePlayerAction}
                  />
                </div>
              </div>
            )}

            {phase === 'dealer' && (
              <div className="text-center text-white">
                <div className="text-lg font-semibold">Dealer Playing...</div>
              </div>
            )}

            {phase === 'finished' && (
              <div className="space-y-4 text-center">
                <div className="text-white text-lg">
                  Round Complete!
                </div>
                <button
                  onClick={handleNewRound}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  New Round
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Game Phase Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-800 text-white text-sm rounded">
            Phase: {phase} | Current Player: {currentPlayerIndex}
            {isTutorialActive && ` | Tutorial Step: ${tutorial.currentStep + 1}/${tutorial.steps.length}`}
          </div>
        )}
      </div>

      {/* Tutorial Overlay */}
      {isTutorialActive && currentTutorialStep && (
        <TutorialOverlay
          step={currentTutorialStep}
          onNext={nextTutorialStep}
          onSkip={skipTutorial}
          canAdvance={canAdvanceTutorial()}
        />
      )}

      {/* Menu Warning Dialog */}
      {showMenuWarning && (
        <MenuWarning
          onConfirm={handleConfirmMenuExit}
          onCancel={handleCancelMenuExit}
        />
      )}

      {/* Strategy Hint for Easy Mode */}
      <StrategyHint
        advice={currentStrategyAdvice}
        isVisible={gameMode === 'easy' && phase === 'playing'}
      />

      {/* Achievement Notification */}
      {newlyUnlockedAchievements.length > 0 && (
        <AchievementNotification
          achievements={newlyUnlockedAchievements}
          onClose={clearNewAchievements}
        />
      )}

    </div>
  )
}