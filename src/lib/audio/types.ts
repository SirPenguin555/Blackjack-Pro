export interface AudioTrack {
  id: string
  name: string
  url: string
  buffer?: AudioBuffer
  duration?: number
}

export type SoundEffectCategory = 'card' | 'chip' | 'outcome'

export interface SoundEffect {
  id: string
  name: string
  category: SoundEffectCategory
  url: string
  buffer?: AudioBuffer
}

export interface AudioPreferences {
  volume: number // 0-100 (music volume)
  isMuted: boolean // music mute state
  soundEffectsVolume: number // 0-100 (sound effects volume)
  soundEffectsMuted: boolean // sound effects mute state
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
  'soundEffectsVolumeChange': (volume: number) => void
  'soundEffectsMuteChange': (isMuted: boolean) => void
  'trackEnd': () => void
  'error': (error: Error) => void
}