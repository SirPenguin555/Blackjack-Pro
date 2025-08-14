'use client'

import { useState, useEffect } from 'react'
import { authService, AuthUser, UserGameData } from '@/lib/supabase/auth'
import { useGameStore } from '@/store/gameStore'
import { achievementEngine } from '@/lib/achievementSystem'
import { playerProfileService } from '@/lib/PlayerProfileService'

interface AccountScreenProps {
  onBack: () => void
}

export function AccountScreen({ onBack }: AccountScreenProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [gameData, setGameData] = useState<UserGameData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [emailResent, setEmailResent] = useState(false)
  
  // Get current game state
  const { players, stats, currentTableLevel, currentGameVariant } = useGameStore()
  const currentPlayer = players[0]

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    setIsLoading(true)
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        const userData = await authService.getUserGameData(currentUser.id)
        setGameData(userData || null)
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setIsResendingEmail(true)
    try {
      const result = await authService.resendEmailVerification()
      if (result.error) {
        console.error('Failed to resend email:', result.error)
      } else {
        setEmailResent(true)
        setTimeout(() => setEmailResent(false), 5000)
      }
    } catch (error) {
      console.error('Failed to resend email:', error)
    } finally {
      setIsResendingEmail(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await authService.signOut()
      onBack()
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const calculateWinRate = () => {
    // Use real stats from game store first, then fall back to database data
    const totalHands = stats?.handsPlayed || gameData?.total_hands_played || 0
    const handsWon = stats?.handsWon || gameData?.hands_won || 0
    
    if (totalHands === 0) return 0
    return ((handsWon / totalHands) * 100).toFixed(1)
  }

  const calculateMultiplayerWinRate = () => {
    if (!gameData || gameData.multiplayer_games_played === 0) return 0
    return ((gameData.multiplayer_games_won / gameData.multiplayer_games_played) * 100).toFixed(1)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading account...</div>
      </div>
    )
  }

  if (!user || !user.profile?.username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center">
        <div className="text-white text-xl">Please sign in to view your account</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            ← Back to Main Menu
          </button>
          <h1 className="text-3xl font-bold text-white">My Account</h1>
          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="text-lg font-semibold text-gray-900">{user.profile?.username || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="text-lg text-gray-900">{user.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
              <div className="text-lg text-gray-900">
                {user.profile?.created_at ? new Date(user.profile.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Status</label>
              <div className="flex items-center gap-2">
                {authService.isEmailVerified(user) ? (
                  <span className="text-green-600 font-semibold">✓ Verified</span>
                ) : (
                  <div className="flex flex-col gap-2">
                    <span className="text-red-600 font-semibold">⚠ Not Verified</span>
                    <button
                      onClick={handleResendEmail}
                      disabled={isResendingEmail}
                      className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 rounded transition-colors duration-200"
                    >
                      {isResendingEmail ? 'Sending...' : 'Resend Email'}
                    </button>
                    {emailResent && (
                      <span className="text-sm text-green-600">Email sent!</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!authService.isEmailVerified(user) && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You need to verify your email address to access multiplayer features. 
                Single-player modes are available now.
              </p>
            </div>
          )}
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatNumber(currentPlayer?.chips || gameData?.total_chips || 0)}
              </div>
              <div className="text-sm text-gray-600">Current Chips</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-blue-600 capitalize">
                {currentTableLevel || gameData?.current_table_level || 'Beginner'}
              </div>
              <div className="text-sm text-gray-600">Current Table</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-purple-600 capitalize">
                {currentGameVariant || gameData?.current_game_variant || 'Vegas'}
              </div>
              <div className="text-sm text-gray-600">Current Variant</div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Single Player Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(stats?.handsPlayed || gameData?.total_hands_played || 0)}
              </div>
              <div className="text-sm text-gray-600">Total Hands</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{calculateWinRate()}%</div>
              <div className="text-sm text-gray-600">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {formatNumber(stats?.blackjacks || gameData?.blackjacks_hit || 0)}
              </div>
              <div className="text-sm text-gray-600">Blackjacks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(stats?.longestWinningStreak || gameData?.longest_winning_streak || 0)}
              </div>
              <div className="text-sm text-gray-600">Best Streak</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-semibold text-green-600">
                {formatNumber(stats?.handsWon || gameData?.hands_won || 0)}
              </div>
              <div className="text-sm text-gray-600">Hands Won</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-red-600">
                {formatNumber(stats?.handsLost || gameData?.hands_lost || 0)}
              </div>
              <div className="text-sm text-gray-600">Hands Lost</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-600">
                {formatNumber(stats?.handsPushed || gameData?.hands_pushed || 0)}
              </div>
              <div className="text-sm text-gray-600">Pushes</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-indigo-600">
                {formatNumber(stats?.currentStreak || gameData?.current_streak || 0)}
              </div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xl font-semibold text-green-600">
                +{formatNumber(stats?.totalWinnings || gameData?.total_winnings || 0)}
              </div>
              <div className="text-sm text-gray-600">Total Winnings</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-red-600">
                -{formatNumber(stats?.totalLosses || gameData?.total_losses || 0)}
              </div>
              <div className="text-sm text-gray-600">Total Losses</div>
            </div>
          </div>
        </div>

        {/* Multiplayer Statistics */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Multiplayer Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatNumber(gameData?.multiplayer_games_played || 0)}</div>
              <div className="text-sm text-gray-600">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{calculateMultiplayerWinRate()}%</div>
              <div className="text-sm text-gray-600">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatNumber(gameData?.multiplayer_tables_hosted || 0)}</div>
              <div className="text-sm text-gray-600">Tables Hosted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">+{formatNumber(gameData?.multiplayer_total_winnings || 0)}</div>
              <div className="text-sm text-gray-600">MP Winnings</div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Achievements</h2>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🏆</div>
            <div className="text-xl font-semibold text-gray-600 mb-2">
              {achievementEngine.getUnlockedAchievements().length} Achievements Unlocked
            </div>
            <div className="text-sm text-gray-500">
              Keep playing to unlock more achievements!
            </div>
          </div>
        </div>

        {/* Progression */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Progression</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">Unlocked Tables</h3>
              <div className="space-y-2">
                {(playerProfileService.loadProfile()?.tablesUnlocked || ['beginner']).map((table) => (
                  <div key={table} className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="capitalize text-black">{table}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">Unlocked Variants</h3>
              <div className="space-y-2">
                {(playerProfileService.loadProfile()?.variantsUnlocked || ['vegas']).map((variant) => (
                  <div key={variant} className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="capitalize text-black">{variant}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Management</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold text-blue-900 mb-2">Account Data</h3>
              <p className="text-sm text-blue-800 mb-3">
                Your game data is automatically saved to your account. No need to use save codes!
              </p>
              <p className="text-sm text-blue-700">
                Your progress, statistics, and achievements are safely stored and will be available 
                whenever you sign in from any device.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="font-semibold text-yellow-900 mb-2">Import Save Code</h3>
              <p className="text-sm text-yellow-800 mb-3">
                <strong>Warning:</strong> Importing a save code will completely override your current account data.
              </p>
              <p className="text-sm text-yellow-700">
                Save codes from single-player mode can still be imported, but this action cannot be undone.
                Make sure you want to replace your current progress before proceeding.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}