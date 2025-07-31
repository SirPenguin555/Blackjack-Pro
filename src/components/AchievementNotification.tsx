import React, { useEffect, useState } from 'react'
import { Achievement } from '@/lib/achievementSystem'

interface AchievementNotificationProps {
  achievements: Achievement[]
  onClose: () => void
}

export function AchievementNotification({ achievements, onClose }: AchievementNotificationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (achievements.length > 0) {
      setIsVisible(true)
      setCurrentIndex(0)
    }
  }, [achievements])

  useEffect(() => {
    if (achievements.length > 0 && isVisible) {
      // Auto-advance to next achievement after 4 seconds
      const timer = setTimeout(() => {
        if (currentIndex < achievements.length - 1) {
          setCurrentIndex(currentIndex + 1)
        } else {
          // All achievements shown, close notification
          setIsVisible(false)
          setTimeout(onClose, 300) // Wait for fade out animation
        }
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [currentIndex, achievements.length, isVisible, onClose])

  if (!isVisible || achievements.length === 0) {
    return null
  }

  const currentAchievement = achievements[currentIndex]
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-600 to-gray-800 border-gray-500'
      case 'uncommon': return 'from-green-600 to-green-800 border-green-500'
      case 'rare': return 'from-blue-600 to-blue-800 border-blue-500'
      case 'epic': return 'from-purple-600 to-purple-800 border-purple-500'
      case 'legendary': return 'from-yellow-500 to-yellow-700 border-yellow-400'
      default: return 'from-gray-600 to-gray-800 border-gray-500'
    }
  }

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'shadow-gray-500/50'
      case 'uncommon': return 'shadow-green-500/50'
      case 'rare': return 'shadow-blue-500/50'
      case 'epic': return 'shadow-purple-500/50'
      case 'legendary': return 'shadow-yellow-400/50'
      default: return 'shadow-gray-500/50'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div 
        className={`
          relative max-w-md w-full mx-4 p-6 rounded-xl border-2 
          bg-gradient-to-br ${getRarityColor(currentAchievement.rarity)}
          shadow-2xl ${getRarityGlow(currentAchievement.rarity)}
          transform animate-slideInUp
        `}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="absolute top-2 right-2 text-white hover:text-gray-300 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-black hover:bg-opacity-20"
        >
          ×
        </button>

        {/* Achievement Unlocked Header */}
        <div className="text-center mb-4">
          <div className="text-yellow-300 font-bold text-lg mb-1">
            🏆 ACHIEVEMENT UNLOCKED! 🏆
          </div>
          <div className="text-xs text-gray-200 uppercase tracking-wider">
            {currentAchievement.rarity} • {currentAchievement.points} Points
          </div>
        </div>

        {/* Achievement Content */}
        <div className="text-center">
          <div className="text-6xl mb-3 animate-bounce">
            {currentAchievement.icon}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">
            {currentAchievement.name}
          </h3>
          
          <p className="text-gray-200 text-sm mb-4">
            {currentAchievement.description}
          </p>

          {/* Progress Indicator */}
          {achievements.length > 1 && (
            <div className="flex justify-center space-x-1 mb-4">
              {achievements.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-30'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Continue Button or Auto-advance Message */}
          <div className="text-xs text-gray-300">
            {achievements.length > 1 && currentIndex < achievements.length - 1 ? (
              <>
                <div className="mb-2">
                  {currentIndex + 1} of {achievements.length} achievements
                </div>
                <button
                  onClick={() => {
                    if (currentIndex < achievements.length - 1) {
                      setCurrentIndex(currentIndex + 1)
                    } else {
                      setIsVisible(false)
                      setTimeout(onClose, 300)
                    }
                  }}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white font-medium transition-all duration-200"
                >
                  Next →
                </button>
              </>
            ) : (
              <div>Click × to close or wait 4 seconds</div>
            )}
          </div>
        </div>

        {/* Sparkle Effects */}
        <div className="absolute -top-2 -left-2 text-yellow-300 animate-pulse">✨</div>
        <div className="absolute -top-1 -right-3 text-yellow-300 animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</div>
        <div className="absolute -bottom-2 -left-3 text-yellow-300 animate-pulse" style={{ animationDelay: '1s' }}>✨</div>
        <div className="absolute -bottom-1 -right-2 text-yellow-300 animate-pulse" style={{ animationDelay: '1.5s' }}>⭐</div>
      </div>
    </div>
  )
}