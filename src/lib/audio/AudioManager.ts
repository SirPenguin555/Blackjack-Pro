import { 
  AudioTrack, 
  AudioPreferences, 
  AudioManagerConfig, 
  AudioState, 
  AudioManagerEvents 
} from './types'

export class AudioManager {
  private audioContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private currentSource: AudioBufferSourceNode | null = null
  private currentTrack: AudioTrack | null = null
  private state: AudioState = 'idle'
  private preferences: AudioPreferences = { volume: 50, isMuted: false }
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
      this.gainNode.connect(this.audioContext.destination)
      
      // Set initial volume
      this.updateGainNodeVolume()
      
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
      this.currentTrack = track
      
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
   * Clean up resources
   */
  dispose(): void {
    this.stop()
    
    if (this.gainNode) {
      this.gainNode.disconnect()
      this.gainNode = null
    }
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
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
          isMuted: Boolean(preferences.isMuted)
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