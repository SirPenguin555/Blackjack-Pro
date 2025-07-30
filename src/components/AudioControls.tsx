'use client'

import { useState, useEffect } from 'react'
import { AudioManager } from '@/lib/audio/AudioManager'
import { AudioState } from '@/lib/audio/types'

interface AudioControlsProps {
  audioManager: AudioManager | null
  className?: string
}

export function AudioControls({ audioManager, className = '' }: AudioControlsProps) {
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const [soundEffectsVolume, setSoundEffectsVolume] = useState(50)
  const [isSoundEffectsMuted, setIsSoundEffectsMuted] = useState(true)
  const [audioState, setAudioState] = useState<AudioState>('idle')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!audioManager) return

    // Initialize state from audio manager
    setVolume(audioManager.getVolume())
    setIsMuted(audioManager.isMuted())
    setSoundEffectsVolume(audioManager.getSoundEffectsVolume())
    setIsSoundEffectsMuted(audioManager.isSoundEffectsMuted())
    setAudioState(audioManager.getState())

    // Set up event listeners
    const handleVolumeChange = (newVolume: number) => setVolume(newVolume)
    const handleMuteChange = (muted: boolean) => setIsMuted(muted)
    const handleSoundEffectsVolumeChange = (newVolume: number) => setSoundEffectsVolume(newVolume)
    const handleSoundEffectsMuteChange = (muted: boolean) => setIsSoundEffectsMuted(muted)
    const handleStateChange = (state: AudioState) => {
      setAudioState(state)
      setIsLoading(state === 'loading')
    }

    audioManager.on('volumeChange', handleVolumeChange)
    audioManager.on('muteChange', handleMuteChange)
    audioManager.on('soundEffectsVolumeChange', handleSoundEffectsVolumeChange)
    audioManager.on('soundEffectsMuteChange', handleSoundEffectsMuteChange)
    audioManager.on('stateChange', handleStateChange)

    return () => {
      audioManager.off('volumeChange', handleVolumeChange)
      audioManager.off('muteChange', handleMuteChange)
      audioManager.off('soundEffectsVolumeChange', handleSoundEffectsVolumeChange)
      audioManager.off('soundEffectsMuteChange', handleSoundEffectsMuteChange)
      audioManager.off('stateChange', handleStateChange)
    }
  }, [audioManager])

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(event.target.value)
    audioManager?.setVolume(newVolume)
  }

  const handleSoundEffectsVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(event.target.value)
    audioManager?.setSoundEffectsVolume(newVolume)
  }

  const handleMuteToggle = () => {
    audioManager?.toggleMute()
  }

  const handleSoundEffectsMuteToggle = () => {
    audioManager?.toggleSoundEffectsMute()
  }

  // Music is always playing, so we don't need play/pause functionality

  if (!audioManager) {
    return null
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Music Controls */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-300 hidden sm:inline">
          🎵
        </span>
        <button
          onClick={handleMuteToggle}
          className={`flex items-center justify-center w-6 h-6 ${
            isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          } text-white rounded-full transition-colors duration-200`}
          title={isMuted ? 'Unmute music' : 'Mute music'}
        >
          {isMuted ? (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>
        {!isMuted && (
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            disabled={isLoading}
            className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed slider"
            title={`Music volume: ${volume}%`}
          />
        )}
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-gray-600"></div>

      {/* Sound Effects Controls */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-300 hidden sm:inline">
          🔊
        </span>
        <button
          onClick={handleSoundEffectsMuteToggle}
          className={`flex items-center justify-center w-6 h-6 ${
            isSoundEffectsMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          } text-white rounded-full transition-colors duration-200`}
          title={isSoundEffectsMuted ? 'Unmute sound effects' : 'Mute sound effects'}
        >
          {isSoundEffectsMuted ? (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
          )}
        </button>
        {!isSoundEffectsMuted && (
          <input
            type="range"
            min="0"
            max="100"
            value={soundEffectsVolume}
            onChange={handleSoundEffectsVolumeChange}
            disabled={isLoading}
            className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed slider"
            title={`Sound effects volume: ${soundEffectsVolume}%`}
          />
        )}
      </div>

      {/* Audio State Indicator */}
      {audioState === 'error' && (
        <div className="text-red-400 text-xs" title="Audio error">
          ⚠️
        </div>
      )}
    </div>
  )
}