/**
 * Avatar utilities for multiplayer player representation
 */

const AVATAR_EMOJIS = [
  '🎯', '🎲', '🃏', '♠️', '♥️', '♦️', '♣️', '🎰', 
  '💎', '👑', '🎭', '🎪', '🎨', '🎸', '🎵', '⭐',
  '🔥', '⚡', '💫', '🌟', '🚀', '🎊', '🎉', '🏆'
]

/**
 * Generate a consistent avatar emoji based on a string (like username)
 */
export function getAvatarForName(name: string): string {
  // Create a simple hash from the name
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Use absolute value to ensure positive index
  const index = Math.abs(hash) % AVATAR_EMOJIS.length
  return AVATAR_EMOJIS[index]
}

/**
 * Get size classes for avatar styling
 */
export function getAvatarSizeClasses(size: 'sm' | 'md' | 'lg') {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-12 h-12 text-xl'
  }
  return sizeClasses[size]
}