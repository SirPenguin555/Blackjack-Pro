import { AudioManager } from './AudioManager'

/**
 * Sound service for playing game-related sound effects
 * This service provides a clean interface for triggering sound effects
 * based on game events without directly exposing the AudioManager
 */
export class SoundService {
  private audioManager: AudioManager | null = null

  constructor(audioManager: AudioManager | null) {
    this.audioManager = audioManager
  }

  /**
   * Update the audio manager reference
   */
  setAudioManager(audioManager: AudioManager | null): void {
    this.audioManager = audioManager
  }

  /**
   * Play a sound effect safely (won't throw if audio is not available)
   */
  private async playSafe(soundEffectId: string): Promise<void> {
    if (!this.audioManager) {
      return // Audio not available
    }

    try {
      await this.audioManager.playSoundEffect(soundEffectId)
    } catch (error) {
      // Silently ignore audio errors - game should continue without sound
      console.warn(`Could not play sound effect ${soundEffectId}:`, error)
    }
  }

  // Card-related sounds
  async playCardDeal(): Promise<void> {
    await this.playSafe('card-deal')
  }

  async playCardFlip(): Promise<void> {
    await this.playSafe('card-flip')
  }

  // Chip-related sounds
  async playChipPlace(): Promise<void> {
    await this.playSafe('chip-place')
  }

  async playChipStack(): Promise<void> {
    await this.playSafe('chip-stack')
  }

  async playChipCollect(): Promise<void> {
    await this.playSafe('chip-collect')
  }

  // Outcome-related sounds
  async playWin(): Promise<void> {
    await this.playSafe('win')
  }

  async playLose(): Promise<void> {
    await this.playSafe('lose')
  }

  async playBlackjack(): Promise<void> {
    await this.playSafe('blackjack')
  }

  async playPush(): Promise<void> {
    await this.playSafe('push')
  }

  async playDraw(): Promise<void> {
    await this.playSafe('draw')
  }

  async playBust(): Promise<void> {
    await this.playSafe('bust')
  }
}

// Create a singleton instance
let soundServiceInstance: SoundService | null = null

/**
 * Get the global sound service instance
 */
export function getSoundService(): SoundService {
  if (!soundServiceInstance) {
    soundServiceInstance = new SoundService(null)
  }
  return soundServiceInstance
}