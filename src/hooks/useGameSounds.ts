'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { getSoundService } from '@/lib/audio/SoundService'
import { determineWinner } from '@/lib/blackjack'

/**
 * Custom hook that monitors game state and triggers appropriate sound effects
 */
export function useGameSounds() {
  const { players, dealer, phase, round } = useGameStore()
  const soundService = getSoundService()
  const mainPlayer = players[0]
  
  // Track previous state to avoid duplicate sounds
  const previousPhase = useRef<string>('')
  const previousRound = useRef<number>(0)
  const dealerCardFlipPlayed = useRef<boolean>(false)

  // Monitor phase changes to trigger sounds
  useEffect(() => {
    // Skip if no main player or same phase
    if (!mainPlayer || phase === previousPhase.current) {
      return
    }

    const prevPhase = previousPhase.current
    previousPhase.current = phase

    // Handle phase transitions
    switch (phase) {
      case 'dealing':
        // Play card dealing sound when dealing initial cards
        if (prevPhase === 'betting') {
          soundService.playCardDeal()
        }
        break
        
      case 'playing':
        // Reset dealer card flip flag for new rounds
        dealerCardFlipPlayed.current = false
        break
        
      case 'dealer':
        // Play card flip sound ONCE when dealer reveals hole card
        if (!dealerCardFlipPlayed.current) {
          setTimeout(() => soundService.playCardFlip(), 300)
          dealerCardFlipPlayed.current = true
        }
        break
        
      case 'finished':
        // Play outcome sounds
        if (mainPlayer.hand) {
          const playOutcomeSound = async () => {
            if (mainPlayer.hand.isBusted) {
              await soundService.playBust()
            } else {
              const winner = determineWinner(mainPlayer.hand, dealer)
              
              if (winner === 'player') {
                if (mainPlayer.hand.isBlackjack) {
                  await soundService.playBlackjack()
                } else {
                  await soundService.playWin()
                }
                // Play chip collection sound after win sound
                setTimeout(() => soundService.playChipCollect(), 500)
              } else if (winner === 'dealer') {
                await soundService.playLose()
              } else {
                // Push/tie
                await soundService.playPush()
              }
            }
          }
          
          // Delay to match visual timing
          setTimeout(playOutcomeSound, 800)
        }
        break
    }
  }, [phase, mainPlayer, dealer, soundService])

  // Monitor hand size changes to detect hits
  const previousHandSize = useRef<number>(0)
  
  useEffect(() => {
    if (!mainPlayer || !mainPlayer.hand) return
    
    const currentHandSize = mainPlayer.hand.cards.length
    
    // Play card deal sound when hand size increases during playing phase
    // (but not during initial dealing)
    if (phase === 'playing' && 
        currentHandSize > previousHandSize.current && 
        previousHandSize.current >= 2) {
      soundService.playCardDeal()
    }
    
    previousHandSize.current = currentHandSize
  }, [mainPlayer?.hand.cards.length, phase, soundService])
}