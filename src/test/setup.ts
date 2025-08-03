import '@testing-library/jest-dom'

// Mock Web Audio API for testing
global.AudioContext = class MockAudioContext {
  destination = {}
  currentTime = 0
  sampleRate = 44100
  state = 'running'
  
  createGain() {
    return {
      gain: { 
        value: 1,
        cancelScheduledValues: vi.fn(),
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn()
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }
  }
  
  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null
    }
  }
  
  decodeAudioData(arrayBuffer: ArrayBuffer) {
    // Return a proper mock audio buffer
    return Promise.resolve({
      duration: 120,
      length: 5292000,
      numberOfChannels: 2,
      sampleRate: 44100,
      getChannelData: vi.fn(),
      copyFromChannel: vi.fn(),
      copyToChannel: vi.fn()
    })
  }
  
  close() {
    return Promise.resolve()
  }
  
  suspend() {
    return Promise.resolve()
  }
  
  resume() {
    return Promise.resolve()
  }
}

// @ts-expect-error - Setting global for test environment
global.webkitAudioContext = global.AudioContext