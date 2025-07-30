import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AudioManager } from '../AudioManager'
import { AudioTrack } from '../types'

describe('AudioManager', () => {
  let audioManager: AudioManager
  let mockAudioBuffer: AudioBuffer
  let mockTrack: AudioTrack

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Mock fetch
    global.fetch = vi.fn()
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    })

    // Create mock audio buffer
    mockAudioBuffer = {
      duration: 120,
      length: 5292000,
      numberOfChannels: 2,
      sampleRate: 44100,
      getChannelData: vi.fn(),
      copyFromChannel: vi.fn(),
      copyToChannel: vi.fn()
    } as AudioBuffer

    // Create mock track
    mockTrack = {
      id: 'test-track',
      name: 'Test Casino Music',
      url: '/audio/casino-ambient.mp3'
    }

    // Create fresh AudioManager instance
    audioManager = new AudioManager({
      defaultVolume: 75,
      enableFadeTransitions: false, // Disable for easier testing
      fadeDuration: 100
    })
  })

  afterEach(() => {
    audioManager.dispose()
  })

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(audioManager.getVolume()).toBe(75)
      expect(audioManager.isMuted()).toBe(false)
      expect(audioManager.getState()).toBe('idle')
    })

    it('should initialize audio context', async () => {
      await audioManager.initialize()
      expect(audioManager.getState()).toBe('idle')
    })

    it('should handle Web Audio API not supported', async () => {
      // Mock missing AudioContext
      const originalAudioContext = window.AudioContext
      delete (window as any).AudioContext
      delete (window as any).webkitAudioContext

      await expect(audioManager.initialize()).rejects.toThrow('Web Audio API not supported')

      // Restore
      window.AudioContext = originalAudioContext
    })
  })

  describe('Track Loading', () => {
    it('should load audio track successfully', async () => {
      const arrayBuffer = new ArrayBuffer(1024)
      
      // Mock successful fetch
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(arrayBuffer)
      })

      await audioManager.loadTrack(mockTrack)

      expect(global.fetch).toHaveBeenCalledWith(mockTrack.url)
      
      const currentTrack = audioManager.getCurrentTrack()
      expect(currentTrack).toBeTruthy()
      expect(currentTrack?.id).toBe(mockTrack.id)
      expect(currentTrack?.name).toBe(mockTrack.name)
      expect(currentTrack?.url).toBe(mockTrack.url)
      expect(currentTrack?.duration).toBe(120)
      expect(currentTrack?.buffer).toBeTruthy()
      expect(audioManager.getState()).toBe('idle')
    })

    it('should handle failed track loading', async () => {
      // Mock failed fetch
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      })

      await expect(audioManager.loadTrack(mockTrack)).rejects.toThrow('Failed to load audio: Not Found')
      expect(audioManager.getState()).toBe('error')
    })

    it('should handle decode error', async () => {
      const arrayBuffer = new ArrayBuffer(1024)
      
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(arrayBuffer)
      })

      // Create a new AudioManager instance and mock its audio context
      const testAudioManager = new AudioManager()
      
      // Spy on AudioContext constructor to return a mocked version
      const mockDecodeAudioData = vi.fn().mockRejectedValue(new Error('Decode failed'))
      const MockAudioContextClass = class extends AudioContext {
        decodeAudioData = mockDecodeAudioData
      }
      
      // Override the global AudioContext temporarily
      const originalAudioContext = global.AudioContext
      global.AudioContext = MockAudioContextClass as any
      
      try {
        await expect(testAudioManager.loadTrack(mockTrack)).rejects.toThrow('Decode failed')
        expect(testAudioManager.getState()).toBe('error')
      } finally {
        // Restore original AudioContext
        global.AudioContext = originalAudioContext
        testAudioManager.dispose()
      }
    })
  })

  describe('Playback Control', () => {
    beforeEach(async () => {
      // Load a track for playback tests
      const arrayBuffer = new ArrayBuffer(1024)
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(arrayBuffer)
      })

      const mockAudioContext = new AudioContext()
      mockAudioContext.decodeAudioData = vi.fn().mockResolvedValue(mockAudioBuffer)
      
      await audioManager.loadTrack(mockTrack)
    })

    it('should play loaded track', async () => {
      await audioManager.play()
      expect(audioManager.getState()).toBe('playing')
    })

    it('should pause playing track', async () => {
      await audioManager.play()
      audioManager.pause()
      expect(audioManager.getState()).toBe('paused')
    })

    it('should stop playing track', async () => {
      await audioManager.play()
      audioManager.stop()
      expect(audioManager.getState()).toBe('idle')
    })

    it('should toggle playback', async () => {
      // Start paused/idle
      expect(audioManager.getState()).toBe('idle')
      
      // Toggle to play
      await audioManager.togglePlayback()
      expect(audioManager.getState()).toBe('playing')
      
      // Toggle to pause
      await audioManager.togglePlayback()
      expect(audioManager.getState()).toBe('paused')
      
      // Toggle back to play
      await audioManager.togglePlayback()
      expect(audioManager.getState()).toBe('playing')
    })

    it('should throw error when playing without loaded track', async () => {
      const emptyAudioManager = new AudioManager()
      await expect(emptyAudioManager.play()).rejects.toThrow('No track loaded')
    })
  })

  describe('Volume Control', () => {
    it('should set volume within valid range', () => {
      audioManager.setVolume(75)
      expect(audioManager.getVolume()).toBe(75)
    })

    it('should clamp volume to valid range', () => {
      audioManager.setVolume(-10)
      expect(audioManager.getVolume()).toBe(0)
      
      audioManager.setVolume(150)
      expect(audioManager.getVolume()).toBe(100)
    })

    it('should toggle mute state', () => {
      expect(audioManager.isMuted()).toBe(false)
      
      audioManager.toggleMute()
      expect(audioManager.isMuted()).toBe(true)
      
      audioManager.toggleMute()
      expect(audioManager.isMuted()).toBe(false)
    })

    it('should set mute state directly', () => {
      audioManager.setMuted(true)
      expect(audioManager.isMuted()).toBe(true)
      
      audioManager.setMuted(false)
      expect(audioManager.isMuted()).toBe(false)
    })
  })

  describe('Event System', () => {
    it('should emit volume change events', () => {
      const volumeCallback = vi.fn()
      audioManager.on('volumeChange', volumeCallback)
      
      audioManager.setVolume(80)
      expect(volumeCallback).toHaveBeenCalledWith(80)
    })

    it('should emit mute change events', () => {
      const muteCallback = vi.fn()
      audioManager.on('muteChange', muteCallback)
      
      audioManager.toggleMute()
      expect(muteCallback).toHaveBeenCalledWith(true)
    })

    it('should emit state change events', () => {
      const stateCallback = vi.fn()
      audioManager.on('stateChange', stateCallback)
      
      // Initialize should trigger state change
      audioManager.initialize()
      expect(stateCallback).toHaveBeenCalled()
    })

    it('should remove event listeners', () => {
      const callback = vi.fn()
      audioManager.on('volumeChange', callback)
      audioManager.off('volumeChange', callback)
      
      audioManager.setVolume(90)
      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle listener errors gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Listener error')
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      audioManager.on('volumeChange', errorCallback)
      audioManager.setVolume(60)
      
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Persistence', () => {
    it('should save preferences to localStorage', () => {
      audioManager.setVolume(85)
      audioManager.setMuted(true)
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'blackjack-audio-preferences',
        JSON.stringify({ volume: 85, isMuted: true })
      )
    })

    it('should load preferences from localStorage', () => {
      // Mock saved preferences
      ;(localStorage.getItem as any).mockReturnValue(
        JSON.stringify({ volume: 90, isMuted: true })
      )
      
      const newAudioManager = new AudioManager()
      expect(newAudioManager.getVolume()).toBe(90)
      expect(newAudioManager.isMuted()).toBe(true)
    })

    it('should handle invalid localStorage data gracefully', () => {
      ;(localStorage.getItem as any).mockReturnValue('invalid-json')
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const newAudioManager = new AudioManager({ defaultVolume: 50 })
      expect(newAudioManager.getVolume()).toBe(50) // Falls back to default
      
      consoleSpy.mockRestore()
    })

    it('should handle localStorage errors gracefully', () => {
      ;(localStorage.setItem as any).mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      audioManager.setVolume(70)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Cleanup', () => {
    it('should dispose resources properly', () => {
      audioManager.dispose()
      
      expect(audioManager.getState()).toBe('idle')
      expect(audioManager.getCurrentTrack()).toBeNull()
    })

    it('should clear event listeners on dispose', () => {
      const callback = vi.fn()
      audioManager.on('volumeChange', callback)
      
      audioManager.dispose()
      audioManager.setVolume(80) // This shouldn't trigger the callback
      
      expect(callback).not.toHaveBeenCalled()
    })
  })
})