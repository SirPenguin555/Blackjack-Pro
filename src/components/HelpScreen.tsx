import { GameStats } from '@/types/game'

interface HelpScreenProps {
  onBack: () => void
}

export function HelpScreen({ onBack }: HelpScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            ← Back to Menu
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-yellow-400">
            Blackjack Rules & Strategy
          </h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Content */}
        <div className="bg-green-700 bg-opacity-50 rounded-lg p-6 space-y-8">
          
          {/* Basic Rules */}
          <section>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">📋 Basic Rules</h2>
            <div className="text-white space-y-3">
              <p><strong>Objective:</strong> Get as close to 21 as possible without going over, while beating the dealer's hand.</p>
              
              <div>
                <strong>Card Values:</strong>
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• Cards 2-10: Face value</li>
                  <li>• Jacks, Queens, Kings: 10 points</li>
                  <li>• Aces: 1 or 11 (whichever is better)</li>
                </ul>
              </div>

              <div>
                <strong>Winning Conditions:</strong>
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• <span className="text-yellow-400">Blackjack:</span> Ace + 10-value card (pays 3:2)</li>
                  <li>• <span className="text-green-400">Win:</span> Higher total than dealer without busting</li>
                  <li>• <span className="text-blue-400">Push:</span> Same total as dealer (tie)</li>
                  <li>• <span className="text-red-400">Bust:</span> Total over 21 (automatic loss)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Player Actions */}
          <section>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">🎯 Player Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
              <div className="bg-green-800 bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-bold text-green-400 mb-2">👆 Hit</h3>
                <p>Take another card to improve your hand total.</p>
              </div>
              
              <div className="bg-green-800 bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-bold text-blue-400 mb-2">✋ Stand</h3>
                <p>Keep your current hand and end your turn.</p>
              </div>
              
              <div className="bg-green-800 bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-bold text-yellow-400 mb-2">💰 Double Down</h3>
                <p>Double your bet, take exactly one more card, then stand.</p>
                <p className="text-sm text-gray-300 mt-1">Available only on first two cards.</p>
              </div>
              
              <div className="bg-green-800 bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-bold text-purple-400 mb-2">✂️ Split</h3>
                <p>If you have a pair, split into two separate hands.</p>
                <p className="text-sm text-gray-300 mt-1">Requires additional bet equal to original.</p>
              </div>
            </div>
          </section>

          {/* Dealer Rules */}
          <section>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">🏠 Dealer Rules</h2>
            <div className="text-white space-y-2">
              <p>• Dealer must hit on 16 or less</p>
              <p>• Dealer must stand on 17 or more</p>
              <p>• Dealer's first card is dealt face down (hole card)</p>
              <p>• Dealer checks for blackjack if showing Ace or 10-value card</p>
            </div>
          </section>

          {/* Basic Strategy Tips */}
          <section>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">💡 Basic Strategy Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
              <div>
                <h3 className="font-bold text-green-400 mb-2">Always Hit:</h3>
                <ul className="ml-4 space-y-1">
                  <li>• Hard 8 or less</li>
                  <li>• Soft 17 or less</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-blue-400 mb-2">Always Stand:</h3>
                <ul className="ml-4 space-y-1">
                  <li>• Hard 17 or more</li>
                  <li>• Soft 19 or more</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-yellow-400 mb-2">Always Double:</h3>
                <ul className="ml-4 space-y-1">
                  <li>• 11 vs any dealer card</li>
                  <li>• 10 vs dealer 2-9</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-purple-400 mb-2">Always Split:</h3>
                <ul className="ml-4 space-y-1">
                  <li>• Aces</li>
                  <li>• 8s</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Game Modes */}
          <section>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">🎮 Game Modes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-white">
              <div className="bg-green-600 bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2">Classic Mode</h3>
                <p>Standard blackjack gameplay with authentic casino rules.</p>
              </div>
              
              <div className="bg-blue-600 bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2">Tutorial Mode</h3>
                <p>Step-by-step guided learning with interactive instructions.</p>
              </div>
              
              <div className="bg-yellow-500 bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-bold text-black mb-2">Easy Mode</h3>
                <p>Strategy hints and suggestions to help you learn optimal play.</p>
              </div>
              
              <div className="bg-purple-600 bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2">Multiplayer Mode</h3>
                <p>Play with up to 3 other players in real-time with chat and avatars.</p>
              </div>
            </div>
          </section>

          {/* Multiplayer Guide */}
          <section>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">👥 Multiplayer Guide</h2>
            
            <div className="space-y-6">
              {/* How to Join */}
              <div className="bg-green-800 bg-opacity-60 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-purple-400 mb-3">🚪 Joining a Game</h3>
                <div className="text-white space-y-2">
                  <p>• Select "Multiplayer" from the main menu</p>
                  <p>• Choose "Join Table" to find available games</p>
                  <p>• Or select "Create Table" to host your own game</p>
                  <p>• Tables support 2-4 players total</p>
                </div>
              </div>

              {/* Game Flow */}
              <div className="bg-green-800 bg-opacity-60 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-blue-400 mb-3">🔄 Multiplayer Game Flow</h3>
                <div className="text-white space-y-2">
                  <p><strong>1. Betting Phase:</strong> All players place their bets simultaneously</p>
                  <p><strong>2. Dealing:</strong> Cards are dealt to all players and the dealer</p>
                  <p><strong>3. Player Turns:</strong> Each player takes their turn in order</p>
                  <p><strong>4. Dealer Turn:</strong> Dealer plays according to standard rules</p>
                  <p><strong>5. Results:</strong> Winnings are calculated for all players</p>
                </div>
              </div>

              {/* Social Features */}
              <div className="bg-green-800 bg-opacity-60 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-green-400 mb-3">💬 Social Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                  <div>
                    <h4 className="font-bold mb-2">Chat System:</h4>
                    <ul className="ml-4 space-y-1">
                      <li>• Real-time messaging with other players</li>
                      <li>• Quick reaction emojis</li>
                      <li>• Respectful communication expected</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-bold mb-2">Player Avatars:</h4>
                    <ul className="ml-4 space-y-1">
                      <li>• Unique visual representation</li>
                      <li>• Shows player status and actions</li>
                      <li>• Displays chip count and bet amount</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Multiplayer Strategy */}
              <div className="bg-green-800 bg-opacity-60 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-yellow-400 mb-3">🧠 Multiplayer Strategy</h3>
                <div className="text-white space-y-3">
                  <div>
                    <h4 className="font-bold text-orange-400 mb-2">Key Differences from Single Player:</h4>
                    <ul className="ml-4 space-y-1">
                      <li>• Your decisions don't affect other players' outcomes</li>
                      <li>• Each player plays independently against the dealer</li>
                      <li>• Other players' cards are visible for information</li>
                      <li>• Time limits prevent long delays</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-cyan-400 mb-2">Multiplayer Etiquette:</h4>
                    <ul className="ml-4 space-y-1">
                      <li>• Make decisions promptly to keep the game flowing</li>
                      <li>• Be respectful in chat communications</li>
                      <li>• Don't give unsolicited advice unless asked</li>
                      <li>• Congratulate winners and support those learning</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-pink-400 mb-2">Advanced Tips:</h4>
                    <ul className="ml-4 space-y-1">
                      <li>• Observe other players' strategies to learn</li>
                      <li>• Card counting becomes more complex with multiple players</li>
                      <li>• Focus on your own optimal play, not others' decisions</li>
                      <li>• Use the social aspect to make the game more enjoyable</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Connection & Technical */}
              <div className="bg-green-800 bg-opacity-60 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-red-400 mb-3">🔧 Connection & Technical</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                  <div>
                    <h4 className="font-bold mb-2">Connection Issues:</h4>
                    <ul className="ml-4 space-y-1">
                      <li>• Game includes automatic reconnection</li>
                      <li>• Your seat is reserved for 60 seconds</li>
                      <li>• Progress is saved during disconnections</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-bold mb-2">Turn Timeouts:</h4>
                    <ul className="ml-4 space-y-1">
                      <li>• 30 seconds to make betting decisions</li>
                      <li>• 15 seconds for hit/stand/double/split</li>
                      <li>• Auto-stand if time expires</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tips for Success */}
          <section>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">🏆 Tips for Success</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-green-400 mb-3">Single Player Tips:</h3>
                <div className="text-white space-y-2">
                  <p>• Start with Easy Mode to learn basic strategy</p>
                  <p>• Pay attention to the dealer's up card when making decisions</p>
                  <p>• Manage your bankroll - don't bet more than you can afford to lose</p>
                  <p>• Remember that blackjack is a game of probability, not luck</p>
                  <p>• Practice with the tutorial to understand all the rules</p>
                  <p>• Use the statistics screen to track your improvement over time</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-purple-400 mb-3">Multiplayer Tips:</h3>
                <div className="text-white space-y-2">
                  <p>• Practice in single player before joining multiplayer tables</p>
                  <p>• Be patient and respectful with newer players</p>
                  <p>• Don't let others' play affect your optimal strategy</p>
                  <p>• Use chat to enhance the social experience</p>
                  <p>• Learn by observing experienced players</p>
                  <p>• Keep the game moving - make decisions promptly</p>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-green-300 text-sm">
          Good luck at the tables! 🍀
        </div>
      </div>
    </div>
  )
}