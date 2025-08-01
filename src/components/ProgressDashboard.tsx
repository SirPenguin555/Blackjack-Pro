import React from 'react'
import { 
  TableLevel, 
  TABLE_CONFIGURATIONS, 
  TABLE_LEVEL_ORDER,
  getNextTableLevel 
} from '@/lib/tableSystem'
import { TableUnlockService } from '@/lib/tableUnlockService'
import { GameStats } from '@/types/game'

interface ProgressDashboardProps {
  currentLevel: TableLevel
  playerChips: number
  stats: GameStats
  onClose: () => void
}

const tableUnlockService = new TableUnlockService()

export function ProgressDashboard({ 
  currentLevel, 
  playerChips, 
  stats, 
  onClose 
}: ProgressDashboardProps) {
  const currentTableConfig = TABLE_CONFIGURATIONS[currentLevel]
  const nextLevel = getNextTableLevel(currentLevel)
  const nextUnlockInfo = tableUnlockService.getNextUnlockInfo(playerChips, stats)
  const progressToNext = tableUnlockService.getProgressToNextLevel(playerChips, stats)
  const currentWinRate = tableUnlockService.calculateWinRate(stats)

  return (
    <div className="fixed inset-0 bg-green-900 bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-green-900 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Progress Dashboard</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-800 bg-opacity-50 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">💰 Current Bankroll</h3>
            <div className="text-2xl font-bold text-green-400">
              ${playerChips.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-purple-800 bg-opacity-50 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">🎯 Current Table</h3>
            <div className="text-xl font-bold text-white">
              {currentTableConfig.name}
            </div>
            <div className="text-sm text-gray-300">
              ${currentTableConfig.minBet} - ${currentTableConfig.maxBet} betting range
            </div>
          </div>
          
          <div className="bg-green-800 bg-opacity-50 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">📊 Win Rate</h3>
            <div className="text-2xl font-bold text-green-400">
              {currentWinRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-300">
              {stats.handsWon} wins / {stats.handsPlayed} hands
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="mb-6">
          <h3 className="text-white font-bold text-xl mb-4">🏆 Your Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black bg-opacity-30 rounded-lg p-3 text-center">
              <div className="text-white font-semibold">Hands Played</div>
              <div className="text-2xl font-bold text-blue-400">{stats.handsPlayed}</div>
            </div>
            
            <div className="bg-black bg-opacity-30 rounded-lg p-3 text-center">
              <div className="text-white font-semibold">Blackjacks</div>
              <div className="text-2xl font-bold text-yellow-400">{stats.blackjacks}</div>
            </div>
            
            <div className="bg-black bg-opacity-30 rounded-lg p-3 text-center">
              <div className="text-white font-semibold">Total Winnings</div>
              <div className={`text-2xl font-bold ${stats.totalWinnings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${stats.totalWinnings}
              </div>
            </div>
            
            <div className="bg-black bg-opacity-30 rounded-lg p-3 text-center">
              <div className="text-white font-semibold">Rounds Played</div>
              <div className="text-2xl font-bold text-purple-400">{stats.roundsPlayed}</div>
            </div>
          </div>
        </div>

        {/* Progression to Next Level */}
        {nextLevel && nextUnlockInfo && (
          <div className="mb-6">
            <h3 className="text-white font-bold text-xl mb-4">🎯 Next Goal: {TABLE_CONFIGURATIONS[nextLevel].name}</h3>
            
            <div className="bg-black bg-opacity-30 rounded-lg p-4">
              <div className="mb-4">
                <div className="flex justify-between text-white mb-2">
                  <span>Overall Progress</span>
                  <span>{progressToNext.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, progressToNext)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Chips Requirement */}
                <div className="text-center">
                  <div className="text-sm text-gray-300 mb-1">Chips Needed</div>
                  {nextUnlockInfo.missingRequirements.chips > 0 ? (
                    <div className="text-red-400 font-bold">
                      +${nextUnlockInfo.missingRequirements.chips.toLocaleString()}
                    </div>
                  ) : (
                    <div className="text-green-400 font-bold">✓ Complete</div>
                  )}
                </div>
                
                {/* Hands Requirement */}
                <div className="text-center">
                  <div className="text-sm text-gray-300 mb-1">Hands Needed</div>
                  {nextUnlockInfo.missingRequirements.hands > 0 ? (
                    <div className="text-red-400 font-bold">
                      +{nextUnlockInfo.missingRequirements.hands}
                    </div>
                  ) : (
                    <div className="text-green-400 font-bold">✓ Complete</div>
                  )}
                </div>
                
                {/* Win Rate Requirement */}
                <div className="text-center">
                  <div className="text-sm text-gray-300 mb-1">Win Rate Needed</div>
                  {nextUnlockInfo.missingRequirements.winRate > 0 ? (
                    <div className="text-red-400 font-bold">
                      +{nextUnlockInfo.missingRequirements.winRate.toFixed(1)}%
                    </div>
                  ) : (
                    <div className="text-green-400 font-bold">✓ Complete</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Level Progress */}
        <div className="mb-6">
          <h3 className="text-white font-bold text-xl mb-4">🏅 Table Progression</h3>
          <div className="space-y-2">
            {TABLE_LEVEL_ORDER.map((level, index) => {
              const config = TABLE_CONFIGURATIONS[level]
              const isUnlocked = tableUnlockService.canUnlockTable(level, playerChips, stats)
              const isCurrent = level === currentLevel
              const isCompleted = TABLE_LEVEL_ORDER.indexOf(currentLevel) > index

              return (
                <div
                  key={level}
                  className={`
                    flex items-center justify-between p-3 rounded-lg
                    ${isCurrent ? 'bg-yellow-600 bg-opacity-50 border-2 border-yellow-400' :
                      isCompleted ? 'bg-green-800 bg-opacity-50' :
                      isUnlocked ? 'bg-blue-800 bg-opacity-50' :
                      'bg-gray-800 bg-opacity-50'}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {isCompleted ? '✅' : isCurrent ? '⭐' : isUnlocked ? '🔓' : '🔒'}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{config.name}</div>
                      <div className="text-sm text-gray-300">
                        ${config.minBet} - ${config.maxBet} • {config.theme} theme
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {isCurrent && <div className="text-yellow-400 font-bold text-sm">CURRENT</div>}
                    {isCompleted && <div className="text-green-400 font-bold text-sm">UNLOCKED</div>}
                    {!isCompleted && !isCurrent && isUnlocked && (
                      <div className="text-blue-400 font-bold text-sm">AVAILABLE</div>
                    )}
                    {!isUnlocked && <div className="text-gray-400 text-sm">LOCKED</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* All Tables Unlocked Message */}
        {!nextLevel && (
          <div className="text-center p-6 bg-yellow-900 bg-opacity-50 rounded-lg">
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-2">Congratulations!</h3>
            <p className="text-white">
              You've unlocked all table levels! You are now a true Blackjack master.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}