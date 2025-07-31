import React from 'react'
import { 
  TableLevel, 
  TABLE_CONFIGURATIONS, 
  TABLE_LEVEL_ORDER, 
  TableConfiguration 
} from '@/lib/tableSystem'
import { TableUnlockService } from '@/lib/tableUnlockService'
import { GameStats } from '@/types/game'

interface TableSelectorProps {
  currentLevel: TableLevel
  playerChips: number
  stats: GameStats
  onTableSelect: (level: TableLevel) => void
  onClose: () => void
}

const tableUnlockService = new TableUnlockService()

const getThemeClasses = (theme: string) => {
  switch (theme) {
    case 'classic':
      return 'bg-gradient-to-br from-green-800 to-green-900 border-green-600'
    case 'modern':
      return 'bg-gradient-to-br from-blue-800 to-blue-900 border-blue-600'
    case 'vintage':
      return 'bg-gradient-to-br from-amber-800 to-amber-900 border-amber-600'
    case 'casino':
      return 'bg-gradient-to-br from-red-800 to-red-900 border-red-600'
    case 'neon':
      return 'bg-gradient-to-br from-purple-800 to-purple-900 border-purple-600'
    case 'luxury':
      return 'bg-gradient-to-br from-yellow-700 to-yellow-800 border-yellow-500'
    default:
      return 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600'
  }
}

export function TableSelector({ 
  currentLevel, 
  playerChips, 
  stats, 
  onTableSelect, 
  onClose 
}: TableSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-green-900 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Select Table</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-400 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TABLE_LEVEL_ORDER.map((level) => {
            const config = TABLE_CONFIGURATIONS[level]
            const validation = tableUnlockService.validateTableAccess(level, playerChips, stats)
            const isCurrentTable = level === currentLevel
            const themeClasses = getThemeClasses(config.theme)

            return (
              <div
                key={level}
                className={`
                  ${themeClasses}
                  border-2 rounded-lg p-4 transition-all duration-200
                  ${validation.canAccess 
                    ? 'hover:scale-105 cursor-pointer opacity-100' 
                    : 'opacity-50 cursor-not-allowed'
                  }
                  ${isCurrentTable ? 'ring-4 ring-yellow-400' : ''}
                `}
                onClick={() => {
                  if (validation.canAccess && validation.canAfford) {
                    onTableSelect(level)
                  }
                }}
              >
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {config.name}
                    {isCurrentTable && (
                      <span className="ml-2 text-yellow-400 text-sm">(Current)</span>
                    )}
                  </h3>
                  
                  <p className="text-sm text-gray-200 mb-3">
                    {config.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white">
                      <span>Betting Range:</span>
                      <span>${config.minBet} - ${config.maxBet}</span>
                    </div>
                    
                    <div className="flex justify-between text-white">
                      <span>Buy-in:</span>
                      <span>${config.buyInMin} - ${config.buyInMax}</span>
                    </div>
                  </div>

                  {/* Unlock Requirements */}
                  <div className="mt-4 p-2 bg-black bg-opacity-30 rounded">
                    <div className="text-xs text-gray-300">
                      <div>Requirements:</div>
                      <div>• ${config.unlockRequirements.minimumChips} chips</div>
                      <div>• {config.unlockRequirements.handsPlayed} hands played</div>
                      <div>• {config.unlockRequirements.winRate}% win rate</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-3">
                    {!validation.canAccess && (
                      <div className="text-red-300 text-xs">
                        {validation.reason}
                      </div>
                    )}
                    {validation.canAccess && !validation.canAfford && (
                      <div className="text-yellow-300 text-xs">
                        {validation.reason}
                      </div>
                    )}
                    {validation.canAccess && validation.canAfford && (
                      <div className="text-green-300 text-xs font-bold">
                        Available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Player Progress */}
        <div className="mt-6 p-4 bg-black bg-opacity-30 rounded-lg">
          <h3 className="text-white font-bold mb-2">Your Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <span className="text-white">Chips:</span> ${playerChips.toLocaleString()}
            </div>
            <div>
              <span className="text-white">Hands Played:</span> {stats.handsPlayed}
            </div>
            <div>
              <span className="text-white">Win Rate:</span> {
                stats.handsPlayed > 0 
                  ? `${((stats.handsWon / stats.handsPlayed) * 100).toFixed(1)}%`
                  : '0%'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}