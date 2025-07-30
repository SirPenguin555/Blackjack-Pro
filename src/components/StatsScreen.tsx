import { GameStats } from '@/types/game'

interface StatsScreenProps {
  stats: GameStats
  onBack: () => void
  onReset: () => void
}

export function StatsScreen({ stats, onBack, onReset }: StatsScreenProps) {
  const winRate = stats.handsPlayed > 0 ? Math.round((stats.handsWon / stats.handsPlayed) * 100) : 0
  const blackjackRate = stats.handsPlayed > 0 ? Math.round((stats.blackjacks / stats.handsPlayed) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
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
                Your Statistics
              </h1>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
              ${stats.loansTaken * 500} borrowed
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
    </div>
  )
}