export interface AudioTrack {
  id: string
  name: string
  url: string
  buffer?: AudioBuffer
  duration?: number
}

export interface AudioPreferences {
  volume: number // 0-100
  isMuted: boolean
}

export interface AudioManagerConfig {
  defaultVolume?: number
  enableFadeTransitions?: boolean
  fadeDuration?: number
}

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface AudioManagerEvents {
  'stateChange': (state: AudioState) => void
  'volumeChange': (volume: number) => void
  'muteChange': (isMuted: boolean) => void
  'trackEnd': () => void
  'error': (error: Error) => void
}