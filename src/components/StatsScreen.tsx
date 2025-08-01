import React, { useState, useEffect } from 'react'
import { GameStats } from '@/types/game'
import { achievementEngine, Achievement, AchievementProgress } from '@/lib/achievementSystem'
import { statsTracker } from '@/lib/StatsTracker'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import { ProgressDashboard } from './ProgressDashboard'
import { useGameStore } from '@/store/gameStore'
import { TABLE_CONFIGURATIONS, TableLevel } from '@/lib/tableSystem'
import { tableUnlockService } from '@/lib/tableUnlockService'

interface StatsScreenProps {
  stats: GameStats
  onBack: () => void
  onReset: () => void
}

type TabType = 'stats' | 'achievements' | 'analytics' | 'progress'

export function StatsScreen({ stats, onBack, onReset }: StatsScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stats')
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([])
  const [isClient, setIsClient] = useState(false)
  
  const winRate = stats.handsPlayed > 0 ? Math.round((stats.handsWon / stats.handsPlayed) * 100) : 0
  const blackjackRate = stats.handsPlayed > 0 ? Math.round((stats.blackjacks / stats.handsPlayed) * 100) : 0
  
  // Set client-side flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load achievement data
  useEffect(() => {
    const loadAchievements = () => {
      const allAchievements = achievementEngine.getAllAchievements()
      const detailedStats = statsTracker.getStatisticsSummary()
      const progress = achievementEngine.getAchievementProgress(detailedStats)
      
      setAchievements(allAchievements)
      setAchievementProgress(progress)
    }
    
    loadAchievements()
  }, [])

  const unlockedAchievements = achievementProgress.filter(a => a.unlocked)
  const totalPoints = achievementEngine.getTotalPoints()
  const completionPercentage = achievementEngine.getCompletionPercentage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={onBack}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              ← Menu
            </button>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
          
          <div className="text-center">
            <div className="bg-blue-800 bg-opacity-70 rounded-xl p-6">
              <h1 className="text-4xl sm:text-6xl font-bold text-yellow-400 shadow-lg">
                Stats & Achievements
              </h1>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-3 font-bold rounded-lg transition-all duration-200 ${
                activeTab === 'stats'
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'bg-blue-800 bg-opacity-70 text-yellow-400 hover:bg-blue-700'
              }`}
            >
              📊 Statistics
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-6 py-3 font-bold rounded-lg transition-all duration-200 ${
                activeTab === 'achievements'
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'bg-blue-800 bg-opacity-70 text-yellow-400 hover:bg-blue-700'
              }`}
            >
              🏆 Achievements
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-bold rounded-lg transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'bg-purple-600 bg-opacity-70 text-white hover:bg-purple-700'
              }`}
            >
              📈 Advanced Statistics
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-6 py-3 font-bold rounded-lg transition-all duration-200 ${
                activeTab === 'progress'
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'bg-green-600 bg-opacity-70 text-white hover:bg-green-700'
              }`}
            >
              🎯 Progression
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'stats' && (
          <StatsTab 
            stats={stats} 
            winRate={winRate} 
            blackjackRate={blackjackRate} 
            onReset={onReset}
            isClient={isClient}
          />
        )}

        {activeTab === 'achievements' && (
          <AchievementsTab 
            achievementProgress={achievementProgress}
            unlockedCount={unlockedAchievements.length}
            totalCount={achievements.length}
            totalPoints={totalPoints}
            completionPercentage={completionPercentage}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard onClose={() => setActiveTab('stats')} />
        )}

        {activeTab === 'progress' && (
          <ProgressTab />
        )}
      </div>
    </div>
  )
}

function StatsTab({ 
  stats, 
  winRate, 
  blackjackRate, 
  onReset,
  isClient 
}: { 
  stats: GameStats
  winRate: number
  blackjackRate: number
  onReset: () => void
  isClient: boolean
}) {
  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Rounds Played */}
        <div className="bg-blue-800 bg-opacity-70 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {stats.roundsPlayed}
          </div>
          <div className="text-white font-semibold">Rounds Played</div>
        </div>

        {/* Hands Played */}
        <div className="bg-indigo-800 bg-opacity-70 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-indigo-300 mb-2">
            {stats.handsPlayed}
          </div>
          <div className="text-white font-semibold">Hands Played</div>
          <div className="text-indigo-200 text-sm mt-1">
            (includes split hands)
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-blue-800 bg-opacity-70 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {winRate}%
          </div>
          <div className="text-white font-semibold">Win Rate</div>
        </div>

        {/* Wins */}
        <div className="bg-green-800 bg-opacity-70 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-300 mb-2">
            {stats.handsWon}
          </div>
          <div className="text-white font-semibold">Wins</div>
        </div>

        {/* Losses */}
        <div className="bg-red-800 bg-opacity-70 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-red-300 mb-2">
            {stats.handsLost}
          </div>
          <div className="text-white font-semibold">Losses</div>
        </div>

        {/* Pushes */}
        <div className="bg-gray-800 bg-opacity-70 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-gray-300 mb-2">
            {stats.handsPushed}
          </div>
          <div className="text-white font-semibold">Pushes</div>
        </div>

        {/* Blackjacks */}
        <div className="bg-yellow-800 bg-opacity-70 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-yellow-300 mb-2">
            {stats.blackjacks}
          </div>
          <div className="text-white font-semibold">Blackjacks</div>
          <div className="text-yellow-200 text-sm mt-1">
            ({blackjackRate}% of hands)
          </div>
        </div>

        {/* Loans Taken */}
        <div className="bg-purple-800 bg-opacity-70 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-300 mb-2">
            {stats.loansTaken}
          </div>
          <div className="text-white font-semibold">Loans Taken</div>
          <div className="text-purple-200 text-sm mt-1">
            ${stats.loansTaken * 100} borrowed
          </div>
        </div>
      </div>

      {/* Total Winnings */}
      <div className="bg-blue-800 bg-opacity-70 rounded-lg p-6 text-center mb-8">
        <div className="text-4xl font-bold text-yellow-400 mb-2">
          {stats.totalWinnings >= 0 ? '+' : ''}${stats.totalWinnings}
        </div>
        <div className="text-white font-semibold">Total Winnings</div>
      </div>

      {/* Table Progression */}
      {stats.roundsPlayed > 0 && isClient && (
        <div className="bg-green-800 bg-opacity-70 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-green-400 mb-4 text-center">🎯 Table Progression</h3>
          
          <div className="space-y-3">
            {Object.values(TABLE_CONFIGURATIONS).map((table, index) => {
              const isUnlocked = tableUnlockService.isTableUnlocked(table.level, stats)
              const progress = tableUnlockService.getUnlockProgress(table.level, stats)
              
              return (
                <div 
                  key={table.level} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isUnlocked 
                      ? 'bg-green-600 bg-opacity-50' 
                      : 'bg-gray-600 bg-opacity-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`text-2xl ${
                      isUnlocked ? '🔓' : '🔒'
                    }`}>
                      {isUnlocked ? '🔓' : '🔒'}
                    </div>
                    <div>
                      <div className={`font-semibold ${
                        isUnlocked ? 'text-green-300' : 'text-gray-300'
                      }`}>
                        {table.name}
                      </div>
                      <div className="text-sm text-gray-300">
                        ${table.minBet} - ${table.maxBet} • {table.theme}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {isUnlocked ? (
                      <div className="text-green-300 font-semibold">✓ Unlocked</div>
                    ) : (
                      <div className="text-gray-300 text-sm">
                        <div>Need:</div>
                        {progress.chipRequirement > 0 && (
                          <div>${progress.chipRequirement} more chips</div>
                        )}
                        {progress.handsRequirement > 0 && (
                          <div>{progress.handsRequirement} more hands</div>
                        )}
                        {progress.winRateRequirement > 0 && (
                          <div>{progress.winRateRequirement.toFixed(1)}% higher win rate</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-4 text-center text-sm text-green-200">
            Unlock higher tables by playing more hands, building your bankroll, and improving your win rate
          </div>
        </div>
      )}

      {/* No Stats Message */}
      {stats.roundsPlayed === 0 && (
        <div className="bg-blue-800 bg-opacity-70 rounded-lg p-8 text-center">
          <div className="text-2xl mb-4">🎯</div>
          <div className="text-white text-lg mb-2">No games played yet!</div>
          <div className="text-green-200">
            Start playing to see your statistics here.
          </div>
        </div>
      )}

      {/* Reset Button (only if stats exist) */}
      {stats.roundsPlayed > 0 && (
        <div className="text-center">
          <button
            onClick={onReset}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            Reset Statistics
          </button>
        </div>
      )}
    </div>
  )
}

function AchievementsTab({ 
  achievementProgress, 
  unlockedCount, 
  totalCount, 
  totalPoints, 
  completionPercentage 
}: {
  achievementProgress: AchievementProgress[]
  unlockedCount: number
  totalCount: number
  totalPoints: number
  completionPercentage: number
}) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')
  
  const filteredAchievements = achievementProgress.filter(a => {
    if (filter === 'unlocked') return a.unlocked
    if (filter === 'locked') return !a.unlocked
    return true
  })

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400'
      case 'uncommon': return 'text-green-400'
      case 'rare': return 'text-blue-400'
      case 'epic': return 'text-purple-400'
      case 'legendary': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gameplay': return '🎮'
      case 'strategy': return '🧠'
      case 'progression': return '📈'
      case 'special': return '✨'
      default: return '🏆'
    }
  }

  return (
    <div>
      {/* Achievement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-yellow-800 bg-opacity-70 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-yellow-300 mb-2">
            {unlockedCount} / {totalCount}
          </div>
          <div className="text-white font-semibold">Achievements</div>
          <div className="text-yellow-200 text-sm mt-1">
            {completionPercentage.toFixed(1)}% Complete
          </div>
        </div>

        <div className="bg-purple-800 bg-opacity-70 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-300 mb-2">
            {totalPoints}
          </div>
          <div className="text-white font-semibold">Achievement Points</div>
        </div>

        <div className="bg-blue-800 bg-opacity-70 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-300 mb-2">
            {Math.round(completionPercentage)}%
          </div>
          <div className="text-white font-semibold">Completion Rate</div>
          <div className="w-full bg-blue-900 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'all' 
              ? 'bg-yellow-600 text-white' 
              : 'bg-blue-800 bg-opacity-50 text-yellow-400 hover:bg-blue-700'
          }`}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => setFilter('unlocked')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'unlocked' 
              ? 'bg-yellow-600 text-white' 
              : 'bg-blue-800 bg-opacity-50 text-yellow-400 hover:bg-blue-700'
          }`}
        >
          Unlocked ({unlockedCount})
        </button>
        <button
          onClick={() => setFilter('locked')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'locked' 
              ? 'bg-yellow-600 text-white' 
              : 'bg-blue-800 bg-opacity-50 text-yellow-400 hover:bg-blue-700'
          }`}
        >
          Locked ({totalCount - unlockedCount})
        </button>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.achievement.id}
            className={`rounded-lg p-4 transition-all duration-200 ${
              achievement.unlocked
                ? 'bg-yellow-800 bg-opacity-70 border-2 border-yellow-600'
                : 'bg-gray-800 bg-opacity-70 border-2 border-gray-600'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">
                {achievement.unlocked ? achievement.achievement.icon : '🔒'}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className={`font-bold ${achievement.unlocked ? 'text-yellow-300' : 'text-gray-300'}`}>
                    {achievement.achievement.name}
                  </h3>
                  <span className="text-xs">
                    {getCategoryIcon(achievement.achievement.category)}
                  </span>
                </div>
                
                <p className={`text-sm mb-2 ${achievement.unlocked ? 'text-yellow-100' : 'text-gray-400'}`}>
                  {achievement.achievement.description}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <span className={getRarityColor(achievement.achievement.rarity)}>
                    {achievement.achievement.rarity.toUpperCase()}
                  </span>
                  <span className={achievement.unlocked ? 'text-yellow-300' : 'text-gray-400'}>
                    {achievement.achievement.points} pts
                  </span>
                </div>
                
                {!achievement.unlocked && achievement.target > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{achievement.current} / {achievement.target}</span>
                      <span>{achievement.percentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-gray-400 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(achievement.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {achievement.unlocked && achievement.unlockedAt && (
                  <div className="mt-2 text-xs text-yellow-200">
                    Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🏆</div>
          <div className="text-white text-xl mb-2">No achievements to show</div>
          <div className="text-gray-400">
            {filter === 'unlocked' 
              ? 'Start playing to unlock your first achievement!' 
              : 'Try a different filter to see achievements.'}
          </div>
        </div>
      )}
    </div>
  )
}

function ProgressTab() {
  const { currentTableLevel, players, stats } = useGameStore()
  const [showProgressDashboard, setShowProgressDashboard] = useState(true)
  const currentPlayer = players[0]

  if (!showProgressDashboard) {
    return (
      <div className="bg-green-800 bg-opacity-50 rounded-lg p-6">
        <div className="text-center">
          <h3 className="text-white text-xl font-bold mb-4">🎯 Progression Dashboard</h3>
          <p className="text-green-200 mb-4">Track your progress through different table levels and unlock requirements.</p>
          <button
            onClick={() => setShowProgressDashboard(true)}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-colors"
          >
            Open Progress Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <ProgressDashboard
      currentLevel={currentTableLevel}
      playerChips={currentPlayer?.chips || 0}
      stats={stats}
      onClose={() => setShowProgressDashboard(false)}
    />
  )
}