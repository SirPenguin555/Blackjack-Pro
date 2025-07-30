'use client'

import { useEffect, useRef } from 'react'
import { useMultiplayerStore } from '@/store/multiplayerStore'

/**
 * Hook that handles connection recovery and game state synchronization
 */
export function useConnectionRecovery() {
  const { 
    currentTable, 
    currentGame, 
    connectionStatus, 
    setConnectionStatus,
    userId 
  } = useMultiplayerStore()
  
  const lastSeenRef = useRef<number>(Date.now())
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update last seen timestamp when active
  useEffect(() => {
    if (connectionStatus === 'connected' && currentTable) {
      const updateLastSeen = () => {
        lastSeenRef.current = Date.now()
        // In a full implementation, you'd update this in Firestore
      }

      // Update every 30 seconds
      const interval = setInterval(updateLastSeen, 30000)
      
      // Update on visibility change
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          updateLastSeen()
        }
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      return () => {
        clearInterval(interval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [connectionStatus, currentTable])

  // Handle connection loss and recovery
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored')
      setConnectionStatus('connected')
      
      // Clear any reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }

    const handleOffline = () => {
      console.log('Connection lost')
      setConnectionStatus('disconnected')
      
      // Set timeout to attempt reconnection
      reconnectTimeoutRef.current = setTimeout(() => {
        if (navigator.onLine) {
          handleOnline()
        }
      }, 5000)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [setConnectionStatus])

  // Monitor for game state inconsistencies
  useEffect(() => {
    if (!currentGame || !userId) return

    const currentPlayer = currentGame.players.find(p => p.userId === userId)
    
    if (!currentPlayer) {
      console.warn('Player not found in game state - possible desync')
      // In a full implementation, you'd attempt to rejoin or refresh state
      return
    }

    // Check if player appears disconnected according to game state
    if (!currentPlayer.isConnected && connectionStatus === 'connected') {
      console.log('Updating connection status in game state')
      // In a full implementation, you'd update Firestore to mark player as connected
    }
  }, [currentGame, userId, connectionStatus])

  return {
    isConnected: connectionStatus === 'connected',
    lastSeen: lastSeenRef.current
  }
}