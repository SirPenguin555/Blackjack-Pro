import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GameMode } from '@/types/game'
import { TableLevel, getTableConfiguration } from '@/lib/tableSystem'
import { GameVariant, RULE_CONFIGURATIONS } from '@/lib/ruleVariations'
import { TableSelector } from './TableSelector'
import { VariantSelector } from './VariantSelector'
import { AuthModal } from './auth/AuthModal'
import { useGameStore } from '@/store/gameStore'
import { authService, AuthUser } from '@/lib/supabase/auth'

interface TitleScreenProps {
  onModeSelect?: (mode: GameMode) => void
}

export function TitleScreen({ onModeSelect }: TitleScreenProps = {}) {
  const router = useRouter()
  const [showTableSelector, setShowTableSelector] = useState(false)
  const [showVariantSelector, setShowVariantSelector] = useState(false)
  const [showTutorialDropdown, setShowTutorialDropdown] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  
  const { 
    currentTableLevel, 
    currentGameVariant, 
    setTableLevel, 
    setGameVariant,
    startVariantTutorial,
    players,
    stats 
  } = useGameStore()
  
  const currentPlayer = players[0]
  const currentTableConfig = getTableConfiguration(currentTableLevel)
  const currentVariantConfig = RULE_CONFIGURATIONS[currentGameVariant]
  
  // Prevent hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    if (currentTableLevel && currentGameVariant) {
      setIsHydrated(true)
    }
  }, [currentTableLevel, currentGameVariant])

  // Load user data and set up auth listener
  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await authService.getCurrentUser()
      console.log('TitleScreen: Initial user load:', currentUser?.profile?.username || 'no user')
      setUser(currentUser)
    }
    
    loadUser()

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange((newUser) => {
      console.log('TitleScreen: Auth state change received:', newUser?.profile?.username || 'no user')
      setUser(newUser)
    })

    return unsubscribe
  }, [])

  const handleAuthSuccess = async () => {
    console.log('TitleScreen: handleAuthSuccess called')
    // The auth state change listener should handle the user update
    // We just need to ensure we reload the current user
    try {
      const currentUser = await authService.getCurrentUser()
      console.log('TitleScreen: Loaded user after auth success:', currentUser?.profile?.username || 'no user')
      setUser(currentUser)
    } catch (error) {
      console.error('TitleScreen: Failed to refresh user after auth:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Title */}
        <div className="mb-12">
          <div className="bg-blue-800 bg-opacity-70 rounded-xl p-6 mb-2">
            <h1 className="text-6xl sm:text-8xl font-bold text-yellow-400 shadow-lg">
              Blackjack
            </h1>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-yellow-400 mb-4">
            Pro
          </h2>
          <p className="text-lg text-green-200 max-w-lg mx-auto">
            Master the art of Blackjack with authentic casino rules, interactive tutorials, and progressive gameplay
          </p>
        </div>

        {/* Authentication Button */}
        <div className="mb-6 max-w-md mx-auto">
          {user && user.profile?.username ? (
            <button
              onClick={() => router.push('/account')}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <div className="text-lg">Welcome back, {user.profile.username}!</div>
              <div className="text-sm opacity-80">View account & statistics</div>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <div className="text-lg">👤 Sign In / Sign Up</div>
              <div className="text-sm opacity-80">Save progress & play multiplayer</div>
            </button>
          )}
        </div>

        {/* Promotional Text for Non-Authenticated Users */}
        {(!user || !user.profile?.username) && (
          <div className="mb-6 max-w-md mx-auto">
            <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4 border border-blue-400 border-opacity-30">
              <p className="text-blue-200 text-sm">
                <strong>Sign up to unlock:</strong> Access your stats and achievements, 
                save and load your data automatically, and play multiplayer modes with friends!
              </p>
            </div>
          </div>
        )}

        {/* Game Mode Buttons */}
        <div className="space-y-4 max-w-md mx-auto">
          <button
            onClick={() => router.push('/play')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="text-xl">Play Game</div>
            <div className="text-sm opacity-90">Classic blackjack experience</div>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowTutorialDropdown(!showTutorialDropdown)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 flex items-center justify-between"
            >
              <div className="text-left">
                <div className="text-xl">Tutorial</div>
                <div className="text-sm opacity-90">Learn the rules step-by-step</div>
              </div>
              <div className="text-xl">
                {showTutorialDropdown ? '▲' : '▼'}
              </div>
            </button>
            
            {showTutorialDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-blue-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => {
                    router.push('/tutorial-basic')
                    setShowTutorialDropdown(false)
                  }}
                  className="w-full px-6 py-3 text-left hover:bg-blue-600 transition-colors border-b border-blue-600"
                >
                  <div className="text-white font-semibold">Basic Tutorial</div>
                  <div className="text-blue-200 text-sm">Learn fundamental blackjack rules</div>
                </button>
                
                <button
                  onClick={() => {
                    router.push('/tutorial-vegas')
                    setShowTutorialDropdown(false)
                  }}
                  className="w-full px-6 py-3 text-left hover:bg-blue-600 transition-colors border-b border-blue-600"
                >
                  <div className="text-white font-semibold">Vegas Rules Tutorial</div>
                  <div className="text-blue-200 text-sm">Classic Las Vegas casino rules</div>
                </button>
                
                <button
                  onClick={() => {
                    router.push('/tutorial-european')
                    setShowTutorialDropdown(false)
                  }}
                  className="w-full px-6 py-3 text-left hover:bg-blue-600 transition-colors border-b border-blue-600"
                >
                  <div className="text-white font-semibold">European Rules Tutorial</div>
                  <div className="text-blue-200 text-sm">No hole card, dealer stands soft 17</div>
                </button>
                
                <button
                  onClick={() => {
                    router.push('/tutorial-atlantic-city')
                    setShowTutorialDropdown(false)
                  }}
                  className="w-full px-6 py-3 text-left hover:bg-blue-600 transition-colors"
                >
                  <div className="text-white font-semibold">Atlantic City Tutorial</div>
                  <div className="text-blue-200 text-sm">Surrender allowed, can resplit Aces</div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/easy-mode')}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="text-xl">Easy Mode</div>
            <div className="text-sm opacity-80">With strategy hints and tips</div>
          </button>

          <button
            onClick={() => {
              if (!user) {
                setShowAuthModal(true)
              } else if (!authService.isEmailVerified(user)) {
                alert('Please verify your email address to access multiplayer features.')
              } else {
                router.push('/multiplayer')
              }
            }}
            className={`w-full font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 ${
              user && authService.isEmailVerified(user)
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-gray-200'
            }`}
          >
            <div className="text-xl">
              Multiplayer {(!user || !authService.isEmailVerified(user)) && '🔒'}
            </div>
            <div className="text-sm opacity-90">
              {!user ? 'Sign in required' : 
               !authService.isEmailVerified(user) ? 'Email verification required' :
               'Play with friends online'}
            </div>
          </button>

          <button
            onClick={() => router.push('/challenges')}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="text-xl">🎯 Bankroll Challenges</div>
            <div className="text-sm opacity-90">Special betting scenarios & rewards</div>
          </button>

          <button
            onClick={() => router.push('/tournaments')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="text-xl">🏆 Tournaments</div>
            <div className="text-sm opacity-90">Compete in organized competitions</div>
          </button>



          <button
            onClick={() => router.push('/help')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="text-lg">📖 Rules & Strategy</div>
          </button>

          <button
            onClick={() => router.push('/save-load')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="text-lg">💾 Save & Load</div>
          </button>

          <button
            onClick={() => onModeSelect?.('reset')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="text-lg">🔄 Reset Progress</div>
          </button>
        </div>

        {/* Table and Variant Selection */}
        <div className="mt-8 space-y-4 max-w-md mx-auto">
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Game Settings</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => setShowTableSelector(true)}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded transition-colors duration-200 text-sm"
              >
                <div className="flex justify-between items-center">
                  <span>🎯 Table: {isHydrated ? currentTableConfig.name : 'Loading...'}</span>
                  <span className="text-xs opacity-75">Change</span>
                </div>
              </button>
              
              <button
                onClick={() => setShowVariantSelector(true)}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-2 px-4 rounded transition-colors duration-200 text-sm"
              >
                <div className="flex justify-between items-center">
                  <span>🃏 Rules: {isHydrated ? currentVariantConfig.name : 'Loading...'}</span>
                  <span className="text-xs opacity-75">Change</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-green-300 text-sm">
          Version 1.2
        </div>
      </div>

      {/* Table Selector Modal */}
      {showTableSelector && isHydrated && (
        <TableSelector
          currentLevel={currentTableLevel}
          playerChips={currentPlayer?.chips || 0}
          stats={stats}
          onTableSelect={(level) => {
            setTableLevel(level)
            setShowTableSelector(false)
          }}
          onClose={() => setShowTableSelector(false)}
        />
      )}

      {/* Variant Selector Modal */}
      {showVariantSelector && isHydrated && (
        <VariantSelector
          currentVariant={currentGameVariant}
          onVariantSelect={(variant) => {
            setGameVariant(variant)
            setShowVariantSelector(false)
          }}
          onClose={() => setShowVariantSelector(false)}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

    </div>
  )
}