'use client'

import { useEffect, useRef, useState } from 'react'
import { AudioManager } from '@/lib/audio/AudioManager'
import { AudioTrack } from '@/lib/audio/types'

const CASINO_TRACKS: AudioTrack[] = [
  {
    id: 'casino-ambient-1',
    name: 'Casino Ambiance',
    url: '/audio/casino-ambient.mp3' // We'll add this audio file later
  }
  // We can add more tracks here in the future
]

export function useAudio() {
  const audioManagerRef = useRef<AudioManager | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize AudioManager
    const audioManager = new AudioManager({
      defaultVolume: 30, // Start with lower volume
      enableFadeTransitions: true,
      fadeDuration: 1000
    })

    audioManagerRef.current = audioManager

    // Set up error handling
    const handleError = (error: Error) => {
      console.error('Audio error:', error)
      setError(error.message)
    }

    audioManager.on('error', handleError)

    // Initialize and load default track
    const initializeAudio = async () => {
      try {
        await audioManager.initialize()
        
        // Try to load the first track
        if (CASINO_TRACKS.length > 0) {
          try {
            await audioManager.loadTrack(CASINO_TRACKS[0])
            setCurrentTrack(CASINO_TRACKS[0])
          } catch (loadError) {
            // If we can't load the track, that's okay - just log it
            console.warn('Could not load audio track:', loadError)
            setError('Audio track not available')
          }
        }
        
        setIsInitialized(true)
      } catch (initError) {
        console.warn('Could not initialize audio:', initError)
        setError('Audio not supported')
        setIsInitialized(true) // Still set as initialized so UI doesn't keep trying
      }
    }

    initializeAudio()

    // Cleanup on unmount
    return () => {
      audioManager.off('error', handleError)
      audioManager.dispose()
    }
  }, [])

  const startBackgroundMusic = async () => {
    if (!audioManagerRef.current || !currentTrack) {
      return
    }

    try {
      await audioManagerRef.current.play()
    } catch (error) {
      console.error('Failed to start background music:', error)
    }
  }

  const stopBackgroundMusic = () => {
    if (!audioManagerRef.current) {
      return
    }

    audioManagerRef.current.pause()
  }

  return {
    audioManager: audioManagerRef.current,
    isInitialized,
    currentTrack,
    error,
    startBackgroundMusic,
    stopBackgroundMusic,
    availableTracks: CASINO_TRACKS
  }
}