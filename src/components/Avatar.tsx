import { getAvatarForName, getAvatarSizeClasses } from '@/lib/avatars'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Avatar component with emoji and styling based on player name
 */
export function Avatar({ name, size = 'md' }: AvatarProps) {
  const emoji = getAvatarForName(name)
  const sizeClasses = getAvatarSizeClasses(size)
  
  return (
    <div className={`
      ${sizeClasses} 
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