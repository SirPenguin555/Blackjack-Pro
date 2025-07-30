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
 * Generate an avatar component with emoji and fallback
 */
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const emoji = getAvatarForName(name)
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-12 h-12 text-xl'
  }
  
  return (
    <div className={`
      ${sizeClasses[size]} 
      bg-gradient-to-br from-green-400 to-green-600 
      rounded-full 
      flex items-center justify-center 
      text-white font-bold
      shadow-lg
      border-2 border-white
    `}>
      <span className="drop-shadow-sm">{emoji}</span>
    </div>
  )
}