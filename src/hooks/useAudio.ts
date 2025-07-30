'use client'

import { useEffect, useRef, useState } from 'react'
import { AudioManager } from '@/lib/audio/AudioManager'
import { AudioTrack, SoundEffect } from '@/lib/audio/types'

const CASINO_TRACKS: AudioTrack[] = [
  {
    id: 'casino-ambient',
    name: 'Casino Ambiance',
    url: '/audio/casino-ambient.mp3'
  },
  {
    id: 'casino-tense',
    name: 'Casino Tense',
    url: '/audio/casino-tense.mp3'
  },
  {
    id: 'casino-victory',
    name: 'Casino Victory',
    url: '/audio/casino-victory.mp3'
  },
  {
    id: 'casino-chill',
    name: 'Casino Chill',
    url: '/audio/casino-chill.mp3'
  }
]

const SOUND_EFFECTS: SoundEffect[] = [
  // Card sounds
  {
    id: 'card-deal',
    name: 'Card Deal',
    category: 'card',
    url: '/audio/card-deal.mp3'
  },
  {
    id: 'card-flip',
    name: 'Card Flip',
    category: 'card',
    url: '/audio/card-flip.mp3'
  },
  
  // Chip sounds
  {
    id: 'chip-place',
    name: 'Chip Place',
    category: 'chip',
    url: '/audio/chip-place.mp3'
  },
  {
    id: 'chip-stack',
    name: 'Chip Stack',
    category: 'chip',
    url: '/audio/chip-stack.mp3'
  },
  {
    id: 'chip-collect',
    name: 'Chip Collect',
    category: 'chip',
    url: '/audio/chip-collect.mp3'
  },
  
  // Outcome sounds
  {
    id: 'win',
    name: 'Win',
    category: 'outcome',
    url: '/audio/win.mp3'
  },
  {
    id: 'lose',
    name: 'Lose',
    category: 'outcome',
    url: '/audio/lost.mp3'
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    category: 'outcome',
    url: '/audio/blackjack.mp3'
  },
  {
    id: 'push',
    name: 'Push',
    category: 'outcome',
    url: '/audio/draw.mp3'
  },
  {
    id: 'draw',
    name: 'Draw',
    category: 'outcome',
    url: '/audio/draw.mp3'
  },
  {
    id: 'bust',
    name: 'Bust',
    category: 'outcome',
    url: '/audio/bust.mp3'
  }
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
    
    // Start muted by default
    audioManager.setMuted(true)
    audioManager.setSoundEffectsMuted(true)

    audioManagerRef.current = audioManager

    // Set up error handling
    const handleError = (error: Error) => {
      console.error('Audio error:', error)
      setError(error.message)
    }

    audioManager.on('error', handleError)

    // Initialize and load default track and sound effects
    const initializeAudio = async () => {
      try {
        await audioManager.initialize()
        
        // Try to load all tracks
        let loadedCount = 0
        for (const track of CASINO_TRACKS) {
          try {
            await audioManager.loadTrack(track)
            loadedCount++
            
            // Set the first successfully loaded track as current
            if (loadedCount === 1) {
              setCurrentTrack(track)
            }
          } catch (loadError) {
            // Silently ignore track loading errors - some tracks may not exist
            console.warn(`Could not load audio track ${track.id}:`, loadError)
          }
        }
        
        if (loadedCount === 0) {
          setError('No audio tracks available')
        }
        
        // Load sound effects (silently fail if not available)
        for (const soundEffect of SOUND_EFFECTS) {
          try {
            await audioManager.loadSoundEffect(soundEffect)
          } catch (loadError) {
            // Silently ignore sound effect loading errors
            console.warn(`Could not load sound effect ${soundEffect.id}:`, loadError)
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

  return {
    audioManager: audioManagerRef.current,
    isInitialized,
    currentTrack,
    error,
    availableTracks: CASINO_TRACKS,
    availableSoundEffects: SOUND_EFFECTS
  }
}