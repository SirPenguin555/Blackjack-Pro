import { GameMode } from '@/types/game'

interface TitleScreenProps {
  onModeSelect: (mode: GameMode) => void
}

export function TitleScreen({ onModeSelect }: TitleScreenProps) {
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

        {/* Game Mode Buttons */}
        <div className="space-y-4 max-w-md mx-auto">
          <button
            onClick={() => onModeSelect('normal')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="text-xl">Play Game</div>
            <div className="text-sm opacity-90">Classic blackjack experience</div>
          </button>

          <button
            onClick={() => onModeSelect('tutorial')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="text-xl">Tutorial</div>
            <div className="text-sm opacity-90">Learn the rules step-by-step</div>
          </button>

          <button
            onClick={() => onModeSelect('easy')}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="text-xl">Easy Mode</div>
            <div className="text-sm opacity-80">With strategy hints and tips</div>
          </button>

          <button
            onClick={() => onModeSelect('multiplayer')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="text-xl">Multiplayer</div>
            <div className="text-sm opacity-90">Play with friends online</div>
          </button>

          <button
            onClick={() => onModeSelect('stats')}
            className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="text-lg">📊 View Statistics</div>
          </button>

          <button
            onClick={() => onModeSelect('help')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="text-lg">📖 Rules & Strategy</div>
          </button>

          <button
            onClick={() => onModeSelect('reset')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="text-lg">🔄 Reset Progress</div>
          </button>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="bg-blue-800 bg-opacity-70 rounded-lg p-4">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-white font-semibold">Casino Rules</div>
            <div className="text-green-200 text-sm">Authentic blackjack gameplay</div>
          </div>
          
          <div className="bg-blue-800 bg-opacity-70 rounded-lg p-4">
            <div className="text-2xl mb-2">🎓</div>
            <div className="text-white font-semibold">Learn & Practice</div>
            <div className="text-green-200 text-sm">Interactive tutorials included</div>
          </div>
          
          <div className="bg-blue-800 bg-opacity-70 rounded-lg p-4">
            <div className="text-2xl mb-2">📱</div>
            <div className="text-white font-semibold">Mobile Friendly</div>
            <div className="text-green-200 text-sm">Play anywhere, anytime</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-green-300 text-sm">
          Version Beta 2.0 • Phase 2 Complete
        </div>
      </div>
    </div>
  )
}