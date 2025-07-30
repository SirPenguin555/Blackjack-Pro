'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { AudioManager } from '@/lib/audio/AudioManager'

/**
 * Hook that dynamically adjusts music based on game state
 * Creates more immersive gameplay by switching tracks and adjusting volume
 */
export function useDynamicMusic(audioManager: AudioManager | null) {
  const { phase, players, dealer, gameMode } = useGameStore()
  const mainPlayer = players[0]
  const previousVolume = useRef<number>(30) // Store original volume
  const transitionInProgress = useRef<boolean>(false)
  const currentTrackRef = useRef<string>('casino-ambient') // Track current track ID

  useEffect(() => {
    if (!audioManager || !mainPlayer || transitionInProgress.current) return

    // Skip dynamic effects for tutorial mode (keep consistent)
    if (gameMode === 'tutorial') return
    
    // Skip if dynamic music is disabled
    if (!audioManager.isDynamicMusicEnabled()) return

    const adjustMusicForPhase = async () => {
      transitionInProgress.current = true
      
      // Don't adjust if music is muted
      if (audioManager.isMuted()) {
        transitionInProgress.current = false
        return
      }
      
      try {
        let targetTrack = 'casino-ambient'
        let targetVolume = 30
        
        switch (phase) {
          case 'betting':
            // Chill music for relaxed betting phase
            targetTrack = 'casino-chill'
            targetVolume = 30
            break
            
          case 'dealing':
            // Ambient music with slightly higher volume for anticipation
            targetTrack = 'casino-ambient'
            targetVolume = 35
            break
            
          case 'playing':
            // Dynamic track selection based on hand value
            const currentHandValue = mainPlayer.hand?.value || 0
            
            if (currentHandValue >= 19) {
              // Tense moment - switch to tense track
              targetTrack = 'casino-tense'
              targetVolume = 40
            } else if (currentHandValue <= 11) {
              // Safe zone - chill music
              targetTrack = 'casino-chill'
              targetVolume = 32
            } else {
              // Decision zone - ambient music
              targetTrack = 'casino-ambient'
              targetVolume = 35
            }
            break
            
          case 'dealer':
            // Build tension during dealer's turn
            const dealerValue = dealer?.value || 0
            targetTrack = 'casino-tense'
            
            if (dealerValue >= 17) {
              // Dealer close to standing - moderate volume
              targetVolume = 37
            } else {
              // Dealer might bust - increase tension
              targetVolume = 42
            }
            break
            
          case 'finished':
            // Keep current track but lower volume briefly
            targetTrack = currentTrackRef.current
            targetVolume = 25
            
            // Return to normal after a moment
            setTimeout(async () => {
              if (audioManager && !audioManager.isMuted() && audioManager.isDynamicMusicEnabled()) {
                await audioManager.setVolume(30)
              }
            }, 2000)
            break
            
          default:
            // Default ambient music
            targetTrack = 'casino-ambient'
            targetVolume = 30
            break
        }
        
        // Switch track if different from current
        if (targetTrack !== currentTrackRef.current) {
          const targetTrackObj = audioManager.getLoadedTrack(targetTrack)
          if (targetTrackObj) {
            await audioManager.switchTrack(targetTrack)
            currentTrackRef.current = targetTrack
          }
        }
        
        // Adjust volume
        await audioManager.setVolume(targetVolume)
        
        // Store the target volume for future reference
        if (phase !== 'finished') {
          previousVolume.current = targetVolume
        }
        
      } catch (error) {
        console.warn('Failed to adjust dynamic music:', error)
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
    
    // Don't adjust if music is muted or dynamic music is disabled
    if (audioManager.isMuted() || !audioManager.isDynamicMusicEnabled()) return

    const handleSpecialEvents = async () => {
      // Check for blackjack
      if (mainPlayer.hand?.isBlackjack && phase === 'finished') {
        // Switch to victory music and boost volume for blackjack celebration
        try {
          const victoryTrack = audioManager.getLoadedTrack('casino-victory')
          if (victoryTrack) {
            await audioManager.switchTrack('casino-victory')
            currentTrackRef.current = 'casino-victory'
          }
          await audioManager.setVolume(45)
          
          setTimeout(async () => {
            if (audioManager && !audioManager.isMuted() && audioManager.isDynamicMusicEnabled()) {
              // Return to ambient music
              const ambientTrack = audioManager.getLoadedTrack('casino-ambient')
              if (ambientTrack) {
                await audioManager.switchTrack('casino-ambient')
                currentTrackRef.current = 'casino-ambient'
              }
              await audioManager.setVolume(30)
            }
          }, 4000)
        } catch (error) {
          console.warn('Failed to celebrate blackjack with music:', error)
        }
      }
      
      // Check for regular win (not blackjack)
      else if (!mainPlayer.hand?.isBusted && !mainPlayer.hand?.isBlackjack && phase === 'finished') {
        // Check if player actually won (this is a simplified check)
        try {
          const victoryTrack = audioManager.getLoadedTrack('casino-victory')
          if (victoryTrack) {
            await audioManager.switchTrack('casino-victory')
            currentTrackRef.current = 'casino-victory'
          }
          await audioManager.setVolume(38)
          
          setTimeout(async () => {
            if (audioManager && !audioManager.isMuted() && audioManager.isDynamicMusicEnabled()) {
              // Return to chill music after victory
              const chillTrack = audioManager.getLoadedTrack('casino-chill')
              if (chillTrack) {
                await audioManager.switchTrack('casino-chill')
                currentTrackRef.current = 'casino-chill'
              }
              await audioManager.setVolume(30)
            }
          }, 3000)
        } catch (error) {
          console.warn('Failed to play victory music:', error)
        }
      }
      
      // Check for bust
      else if (mainPlayer.hand?.isBusted && phase === 'finished') {
        // Keep current track but lower volume briefly for bust
        try {
          await audioManager.setVolume(20)
          setTimeout(async () => {
            if (audioManager && !audioManager.isMuted() && audioManager.isDynamicMusicEnabled()) {
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

  // Reset to normal state when switching game modes
  useEffect(() => {
    if (audioManager && !audioManager.isMuted() && audioManager.isDynamicMusicEnabled()) {
      // Reset to ambient track and normal volume
      const resetMusic = async () => {
        try {
          const ambientTrack = audioManager.getLoadedTrack('casino-ambient')
          if (ambientTrack) {
            await audioManager.switchTrack('casino-ambient')
            currentTrackRef.current = 'casino-ambient'
          }
          await audioManager.setVolume(30)
        } catch (error) {
          console.warn('Failed to reset music for game mode:', error)
        }
      }
      
      resetMusic()
    }
  }, [gameMode, audioManager])
}