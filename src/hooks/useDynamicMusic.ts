'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { AudioManager } from '@/lib/audio/AudioManager'

/**
 * Hook that dynamically adjusts music based on game state
 * Creates more immersive gameplay by responding to different phases
 */
export function useDynamicMusic(audioManager: AudioManager | null) {
  const { phase, players, dealer, gameMode } = useGameStore()
  const mainPlayer = players[0]
  const previousVolume = useRef<number>(30) // Store original volume
  const transitionInProgress = useRef<boolean>(false)

  useEffect(() => {
    if (!audioManager || !mainPlayer || transitionInProgress.current) return

    // Skip dynamic effects for tutorial mode (keep consistent)
    if (gameMode === 'tutorial') return

    const adjustMusicForPhase = async () => {
      transitionInProgress.current = true
      
      // Don't adjust volume if music is muted
      if (audioManager.isMuted()) {
        transitionInProgress.current = false
        return
      }
      
      try {
        switch (phase) {
          case 'betting':
            // Normal ambient volume for betting phase
            await audioManager.setVolume(30)
            break
            
          case 'dealing':
            // Slightly increase volume during dealing for anticipation
            await audioManager.setVolume(35)
            break
            
          case 'playing':
            // Moderate volume during player decisions
            const currentHandValue = mainPlayer.hand?.value || 0
            
            if (currentHandValue >= 19) {
              // Tense moment - higher volume
              await audioManager.setVolume(40)
            } else if (currentHandValue <= 11) {
              // Safe zone - normal volume
              await audioManager.setVolume(32)
            } else {
              // Decision zone - slightly elevated
              await audioManager.setVolume(35)
            }
            break
            
          case 'dealer':
            // Build tension during dealer's turn
            const dealerValue = dealer?.value || 0
            
            if (dealerValue >= 17) {
              // Dealer close to standing - moderate volume
              await audioManager.setVolume(37)
            } else {
              // Dealer might bust - increase tension
              await audioManager.setVolume(42)
            }
            break
            
          case 'finished':
            // Brief quiet moment after round completion
            await audioManager.setVolume(25)
            
            // Return to normal after a moment
            setTimeout(async () => {
              if (audioManager && !audioManager.isMuted()) {
                await audioManager.setVolume(30)
              }
            }, 2000)
            break
            
          default:
            // Default volume for any other states
            await audioManager.setVolume(30)
            break
        }
        
        // Store the target volume for future reference
        if (phase !== 'finished') {
          previousVolume.current = audioManager.getVolume()
        }
        
      } catch (error) {
        console.warn('Failed to adjust music volume:', error)
      } finally {
        // Allow transitions after a brief delay
        setTimeout(() => {
          transitionInProgress.current = false
        }, 500)
      }
    }

    adjustMusicForPhase()
  }, [phase, mainPlayer?.hand?.value, dealer?.value, audioManager, gameMode])

  // Handle special game events
  useEffect(() => {
    if (!audioManager || !mainPlayer || gameMode === 'tutorial') return
    
    // Don't adjust volume if music is muted
    if (audioManager.isMuted()) return

    const handleSpecialEvents = async () => {
      // Check for blackjack
      if (mainPlayer.hand?.isBlackjack && phase === 'finished') {
        // Brief volume boost for blackjack celebration
        try {
          await audioManager.setVolume(45)
          setTimeout(async () => {
            if (audioManager && !audioManager.isMuted()) {
              await audioManager.setVolume(30)
            }
          }, 3000)
        } catch (error) {
          console.warn('Failed to celebrate blackjack with music:', error)
        }
      }
      
      // Check for bust
      if (mainPlayer.hand?.isBusted && phase === 'finished') {
        // Lower volume briefly for bust
        try {
          await audioManager.setVolume(20)
          setTimeout(async () => {
            if (audioManager && !audioManager.isMuted()) {
              await audioManager.setVolume(30)
            }
          }, 2000)
        } catch (error) {
          console.warn('Failed to adjust music for bust:', error)
        }
      }
    }

    handleSpecialEvents()
  }, [mainPlayer?.hand?.isBlackjack, mainPlayer?.hand?.isBusted, phase, audioManager, gameMode])

  // Reset to normal volume when switching game modes
  useEffect(() => {
    if (audioManager && !audioManager.isMuted()) {
      audioManager.setVolume(30).catch(error => {
        console.warn('Failed to reset volume:', error)
      })
    }
  }, [gameMode, audioManager])
}