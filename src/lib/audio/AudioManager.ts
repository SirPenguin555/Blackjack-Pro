import { 
  AudioTrack, 
  SoundEffect,
  AudioPreferences, 
  AudioManagerConfig, 
  AudioState, 
  AudioManagerEvents 
} from './types'

export class AudioManager {
  private audioContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private soundEffectsGainNode: GainNode | null = null
  private currentSource: AudioBufferSourceNode | null = null
  private currentTrack: AudioTrack | null = null
  private loadedTracks: Map<string, AudioTrack> = new Map()
  private soundEffects: Map<string, SoundEffect> = new Map()
  private state: AudioState = 'idle'
  private preferences: AudioPreferences = { 
    volume: 50, 
    isMuted: false,
    soundEffectsVolume: 50,
    soundEffectsMuted: true, // Default muted
    dynamicMusicEnabled: true // Default enabled
  }
  private config: AudioManagerConfig
  private eventListeners: Map<keyof AudioManagerEvents, Function[]> = new Map()
  private startTime = 0
  private pauseTime = 0

  constructor(config: AudioManagerConfig = {}) {
    this.config = {
      defaultVolume: 50,
      enableFadeTransitions: true,
      fadeDuration: 1000,
      ...config
    }
    
    this.preferences.volume = config.defaultVolume || 50
    this.preferences.soundEffectsVolume = config.defaultVolume || 50
    this.loadPreferences()
  }

  /**
   * Initialize the audio context and gain node
   */
  async initialize(): Promise<void> {
    try {
      // Create audio context with fallback for older browsers
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported')
      }

      this.audioContext = new AudioContextClass()
      this.gainNode = this.audioContext.createGain()
      this.soundEffectsGainNode = this.audioContext.createGain()
      this.gainNode.connect(this.audioContext.destination)
      this.soundEffectsGainNode.connect(this.audioContext.destination)
      
      // Set initial volumes
      this.updateGainNodeVolume()
      this.updateSoundEffectsGainNodeVolume()
      
      this.emit('stateChange', this.state)
    } catch (error) {
      this.setState('error')
      this.emit('error', error as Error)
      throw error
    }
  }

  /**
   * Load an audio track
   */
  async loadTrack(track: AudioTrack): Promise<void> {
    if (!this.audioContext) {
      await this.initialize()
    }

    this.setState('loading')
    
    try {
      const response = await fetch(track.url)
      if (!response.ok) {
        throw new Error(`Failed to load audio: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
      
      track.buffer = audioBuffer
      track.duration = audioBuffer.duration
      
      // Store in loaded tracks map
      this.loadedTracks.set(track.id, track)
      
      // Set as current track if no track is currently loaded
      if (!this.currentTrack) {
        this.currentTrack = track
      }
      
      this.setState('idle')
    } catch (error) {
      this.setState('error')
      this.emit('error', error as Error)
      throw error
    }
  }

  /**
   * Play the current track
   */
  async play(): Promise<void> {
    if (!this.audioContext || !this.currentTrack?.buffer) {
      throw new Error('No track loaded')
    }

    // Resume audio context if suspended (required for mobile)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    // Stop current playback if any
    this.stop()

    // Create new buffer source
    this.currentSource = this.audioContext.createBufferSource()
    this.currentSource.buffer = this.currentTrack.buffer
    this.currentSource.connect(this.gainNode!)
    this.currentSource.loop = true // Loop background music
    
    // Handle track end
    this.currentSource.onended = () => {
      if (this.state === 'playing') {
        this.emit('trackEnd')
      }
    }

    // Start playback
    const when = this.pauseTime > 0 ? this.pauseTime : 0
    this.currentSource.start(0, when)
    this.startTime = this.audioContext.currentTime - when
    this.pauseTime = 0
    
    this.setState('playing')
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.currentSource && this.state === 'playing') {
      this.pauseTime = this.audioContext!.currentTime - this.startTime
      this.currentSource.stop()
      this.currentSource = null
      this.setState('paused')
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.currentSource) {
      this.currentSource.stop()
      this.currentSource.disconnect()
      this.currentSource = null
    }
    this.startTime = 0
    this.pauseTime = 0
    this.setState('idle')
  }

  /**
   * Toggle play/pause
   */
  async togglePlayback(): Promise<void> {
    if (this.state === 'playing') {
      this.pause()
    } else if (this.state === 'paused' || this.state === 'idle') {
      await this.play()
    }
  }

  /**
   * Set volume (0-100)
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(100, volume))
    this.preferences.volume = clampedVolume
    this.updateGainNodeVolume()
    this.savePreferences()
    this.emit('volumeChange', clampedVolume)
  }

  /**
   * Get current volume (0-100)
   */
  getVolume(): number {
    return this.preferences.volume
  }

  /**
   * Toggle mute
   */
  toggleMute(): void {
    this.preferences.isMuted = !this.preferences.isMuted
    this.updateGainNodeVolume()
    this.savePreferences()
    this.emit('muteChange', this.preferences.isMuted)
  }

  /**
   * Set mute state
   */
  setMuted(muted: boolean): void {
    this.preferences.isMuted = muted
    this.updateGainNodeVolume()
    this.savePreferences()
    this.emit('muteChange', muted)
  }

  /**
   * Check if muted
   */
  isMuted(): boolean {
    return this.preferences.isMuted
  }

  /**
   * Get current state
   */
  getState(): AudioState {
    return this.state
  }

  /**
   * Get current track
   */
  getCurrentTrack(): AudioTrack | null {
    return this.currentTrack
  }

  /**
   * Load a sound effect
   */
  async loadSoundEffect(soundEffect: SoundEffect): Promise<void> {
    if (!this.audioContext) {
      await this.initialize()
    }

    try {
      const response = await fetch(soundEffect.url)
      if (!response.ok) {
        throw new Error(`Failed to load sound effect: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
      
      soundEffect.buffer = audioBuffer
      this.soundEffects.set(soundEffect.id, soundEffect)
    } catch (error) {
      this.emit('error', error as Error)
      throw error
    }
  }

  /**
   * Play a sound effect
   */
  async playSoundEffect(soundEffectId: string): Promise<void> {
    if (!this.audioContext || !this.soundEffectsGainNode) {
      await this.initialize()
    }

    const soundEffect = this.soundEffects.get(soundEffectId)
    if (!soundEffect || !soundEffect.buffer) {
      throw new Error(`Sound effect not found: ${soundEffectId}`)
    }

    // Resume audio context if suspended (required for mobile)
    if (this.audioContext!.state === 'suspended') {
      await this.audioContext!.resume()
    }

    // Create new buffer source for this sound effect
    const source = this.audioContext!.createBufferSource()
    source.buffer = soundEffect.buffer
    source.connect(this.soundEffectsGainNode!)
    
    // Play the sound effect (one-shot)
    source.start(0)
  }

  /**
   * Get a loaded sound effect
   */
  getSoundEffect(soundEffectId: string): SoundEffect | null {
    return this.soundEffects.get(soundEffectId) || null
  }

  /**
   * Set sound effects volume (0-100)
   */
  setSoundEffectsVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(100, volume))
    this.preferences.soundEffectsVolume = clampedVolume
    this.updateSoundEffectsGainNodeVolume()
    this.savePreferences()
    this.emit('soundEffectsVolumeChange', clampedVolume)
  }

  /**
   * Get current sound effects volume (0-100)
   */
  getSoundEffectsVolume(): number {
    return this.preferences.soundEffectsVolume
  }

  /**
   * Toggle sound effects mute
   */
  toggleSoundEffectsMute(): void {
    this.preferences.soundEffectsMuted = !this.preferences.soundEffectsMuted
    this.updateSoundEffectsGainNodeVolume()
    this.savePreferences()
    this.emit('soundEffectsMuteChange', this.preferences.soundEffectsMuted)
  }

  /**
   * Set sound effects mute state
   */
  setSoundEffectsMuted(muted: boolean): void {
    this.preferences.soundEffectsMuted = muted
    this.updateSoundEffectsGainNodeVolume()
    this.savePreferences()
    this.emit('soundEffectsMuteChange', muted)
  }

  /**
   * Check if sound effects are muted
   */
  isSoundEffectsMuted(): boolean {
    return this.preferences.soundEffectsMuted
  }

  /**
   * Switch to a different track
   */
  async switchTrack(trackId: string): Promise<void> {
    const track = this.loadedTracks.get(trackId)
    if (!track || !track.buffer) {
      throw new Error(`Track not found or not loaded: ${trackId}`)
    }

    const wasPlaying = this.state === 'playing'
    this.currentTrack = track
    
    if (wasPlaying) {
      await this.play()
    }
    
    this.emit('trackChange', track)
  }

  /**
   * Get a loaded track by ID
   */
  getLoadedTrack(trackId: string): AudioTrack | null {
    return this.loadedTracks.get(trackId) || null
  }

  /**
   * Get all loaded tracks
   */
  getLoadedTracks(): AudioTrack[] {
    return Array.from(this.loadedTracks.values())
  }

  /**
   * Set dynamic music enabled/disabled
   */
  setDynamicMusicEnabled(enabled: boolean): void {
    this.preferences.dynamicMusicEnabled = enabled
    this.savePreferences()
    this.emit('dynamicMusicChange', enabled)
  }

  /**
   * Check if dynamic music is enabled
   */
  isDynamicMusicEnabled(): boolean {
    return this.preferences.dynamicMusicEnabled
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop()
    
    if (this.gainNode) {
      this.gainNode.disconnect()
      this.gainNode = null
    }
    
    if (this.soundEffectsGainNode) {
      this.soundEffectsGainNode.disconnect()
      this.soundEffectsGainNode = null
    }
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    // Clear sound effects and loaded tracks
    this.soundEffects.clear()
    this.loadedTracks.clear()
    
    this.eventListeners.clear()
  }

  /**
   * Add event listener
   */
  on<K extends keyof AudioManagerEvents>(
    event: K, 
    listener: AudioManagerEvents[K]
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  /**
   * Remove event listener
   */
  off<K extends keyof AudioManagerEvents>(
    event: K, 
    listener: AudioManagerEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // Private methods

  private setState(newState: AudioState): void {
    if (this.state !== newState) {
      this.state = newState
      this.emit('stateChange', newState)
    }
  }

  private updateGainNodeVolume(): void {
    if (this.gainNode) {
      const volume = this.preferences.isMuted ? 0 : this.preferences.volume / 100
      
      if (this.config.enableFadeTransitions && this.audioContext) {
        // Smooth volume transition
        this.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime)
        this.gainNode.gain.setValueAtTime(
          this.gainNode.gain.value, 
          this.audioContext.currentTime
        )
        this.gainNode.gain.linearRampToValueAtTime(
          volume, 
          this.audioContext.currentTime + (this.config.fadeDuration! / 1000)
        )
      } else {
        this.gainNode.gain.value = volume
      }
    }
  }

  private updateSoundEffectsGainNodeVolume(): void {
    if (this.soundEffectsGainNode) {
      const volume = this.preferences.soundEffectsMuted ? 0 : this.preferences.soundEffectsVolume / 100
      
      if (this.config.enableFadeTransitions && this.audioContext) {
        // Smooth volume transition
        this.soundEffectsGainNode.gain.cancelScheduledValues(this.audioContext.currentTime)
        this.soundEffectsGainNode.gain.setValueAtTime(
          this.soundEffectsGainNode.gain.value, 
          this.audioContext.currentTime
        )
        this.soundEffectsGainNode.gain.linearRampToValueAtTime(
          volume, 
          this.audioContext.currentTime + (this.config.fadeDuration! / 1000)
        )
      } else {
        this.soundEffectsGainNode.gain.value = volume
      }
    }
  }

  private emit<K extends keyof AudioManagerEvents>(
    event: K, 
    ...args: Parameters<AudioManagerEvents[K]>
  ): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as any)(...args)
        } catch (error) {
          console.error(`Error in audio event listener for ${event}:`, error)
        }
      })
    }
  }

  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem('blackjack-audio-preferences')
      if (saved) {
        const preferences = JSON.parse(saved)
        this.preferences = {
          volume: Math.max(0, Math.min(100, preferences.volume || 50)),
          isMuted: Boolean(preferences.isMuted),
          soundEffectsVolume: Math.max(0, Math.min(100, preferences.soundEffectsVolume || this.config.defaultVolume || 50)),
          soundEffectsMuted: preferences.soundEffectsMuted !== undefined ? Boolean(preferences.soundEffectsMuted) : true, // Default muted
          dynamicMusicEnabled: preferences.dynamicMusicEnabled !== undefined ? Boolean(preferences.dynamicMusicEnabled) : true // Default enabled
        }
      }
    } catch (error) {
      console.warn('Failed to load audio preferences:', error)
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(
        'blackjack-audio-preferences', 
        JSON.stringify(this.preferences)
      )
    } catch (error) {
      console.warn('Failed to save audio preferences:', error)
    }
  }
}