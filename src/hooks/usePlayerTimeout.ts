'use client'

import { useEffect, useRef } from 'react'
import { useMultiplayerStore } from '@/store/multiplayerStore'

const TURN_TIMEOUT_MS = 30000 // 30 seconds per turn

/**
 * Hook that manages player turn timeouts in multiplayer games
 */
export function usePlayerTimeout() {
  const { currentGame, userId, playerAction } = useMultiplayerStore()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPlayerIndex = useRef<number>(-1)

  useEffect(() => {
    if (!currentGame || currentGame.phase !== 'playing') {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    const currentPlayer = currentGame.players[currentGame.currentPlayerIndex]
    const isMyTurn = currentPlayer?.userId === userId

    // Clear previous timeout if player changed
    if (lastPlayerIndex.current !== currentGame.currentPlayerIndex) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      lastPlayerIndex.current = currentGame.currentPlayerIndex
    }

    // Set timeout for current player's turn
    if (isMyTurn && !timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        // Auto-stand when time runs out
        console.log('Turn timeout - auto standing')
        playerAction('stand').catch(error => {
          console.error('Failed to auto-stand on timeout:', error)
        })
        timeoutRef.current = null
      }, TURN_TIMEOUT_MS)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [currentGame?.currentPlayerIndex, currentGame?.phase, userId, playerAction])

  // Calculate remaining time for display
  const getRemainingTime = (): number => {
    if (!currentGame || currentGame.phase !== 'playing') return 0
    
    const currentPlayer = currentGame.players[currentGame.currentPlayerIndex]
    const isMyTurn = currentPlayer?.userId === userId
    
    if (!isMyTurn || !timeoutRef.current) return 0
    
    // This is approximate - in a real implementation you'd want to track
    // the actual start time and calculate more precisely
    return TURN_TIMEOUT_MS / 1000 // Return in seconds
  }

  return {
    remainingTime: getRemainingTime(),
    isMyTurn: currentGame?.players[currentGame.currentPlayerIndex]?.userId === userId
  }
}