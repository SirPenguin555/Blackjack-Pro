/* eslint-disable react/no-unescaped-entities */
import { useState } from 'react'

interface HelpScreenProps {
  onBack: () => void
}

export function HelpScreen({ onBack }: HelpScreenProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'variants' | 'tables' | 'multiplayer' | 'dealer' | 'tournaments' | 'challenges' | 'patches'>('basic')

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

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-6 bg-black bg-opacity-30 rounded-lg p-2">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors m-1 ${
              activeTab === 'basic' 
                ? 'bg-blue-600 text-white' 
                : 'bg-transparent text-blue-300 hover:bg-blue-600 hover:bg-opacity-50'
            }`}
          >
            📋 Basic Rules
          </button>
          <button
            onClick={() => setActiveTab('variants')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors m-1 ${
              activeTab === 'variants' 
                ? 'bg-purple-600 text-white' 
                : 'bg-transparent text-purple-300 hover:bg-purple-600 hover:bg-opacity-50'
            }`}
          >
            🃏 Game Variants
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors m-1 ${
              activeTab === 'tables' 
                ? 'bg-green-600 text-white' 
                : 'bg-transparent text-green-300 hover:bg-green-600 hover:bg-opacity-50'
            }`}
          >
            🎯 Tables & Progression
          </button>
          <button
            onClick={() => setActiveTab('multiplayer')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors m-1 ${
              activeTab === 'multiplayer' 
                ? 'bg-pink-600 text-white' 
                : 'bg-transparent text-pink-300 hover:bg-pink-600 hover:bg-opacity-50'
            }`}
          >
            👥 Multiplayer Guide
          </button>
          <button
            onClick={() => setActiveTab('dealer')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors m-1 ${
              activeTab === 'dealer' 
                ? 'bg-red-600 text-white' 
                : 'bg-transparent text-red-300 hover:bg-red-600 hover:bg-opacity-50'
            }`}
          >
            🎭 Dealer Mode
          </button>
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors m-1 ${
              activeTab === 'tournaments' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-transparent text-yellow-300 hover:bg-yellow-600 hover:bg-opacity-50'
            }`}
          >
            🏆 Tournaments
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors m-1 ${
              activeTab === 'challenges' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-transparent text-indigo-300 hover:bg-indigo-600 hover:bg-opacity-50'
            }`}
          >
            💰 Bankroll Challenges
          </button>
          <button
            onClick={() => setActiveTab('patches')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors m-1 ${
              activeTab === 'patches' 
                ? 'bg-orange-600 text-white' 
                : 'bg-transparent text-orange-300 hover:bg-orange-600 hover:bg-opacity-50'
            }`}
          >
            📝 Patch Notes
          </button>
        </div>

        {/* Content */}
        <div className="bg-green-700 bg-opacity-50 rounded-lg p-6 space-y-8">
          
          {/* Basic Rules Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-8">
          {/* Basic Rules */}
          <section>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">📋 Basic Rules</h2>
            <div className="text-white space-y-3">
              <p><strong>Objective:</strong> Get as close to 21 as possible without going over, while beating the dealer&apos;s hand.</p>
              
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

          {/* Tips for Success */}
          <section>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">🏆 Tips for Success</h2>
            <div className="text-white space-y-2">
              <p>• Start with Easy Mode to learn basic strategy</p>
              <p>• Pay attention to the dealer's up card when making decisions</p>
              <p>• Manage your bankroll - don't bet more than you can afford to lose</p>
              <p>• Remember that blackjack is a game of probability, not luck</p>
              <p>• Practice with the tutorial to understand all the rules</p>
              <p>• Use the statistics screen to track your improvement over time</p>
            </div>
          </section>
            </div>
          )}

          {/* Game Variants Tab */}
          {activeTab === 'variants' && (
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">🃏 Game Variants</h2>
                <p className="text-white mb-6">
                  Each blackjack variant has different rules that affect strategy and house edge. Choose the variant that matches your experience level and preferences.
                </p>
                
                <div className="space-y-6">
                  {Object.values(RULE_CONFIGURATIONS).map((rules) => (
                    <div key={rules.id} className="bg-green-800 bg-opacity-60 p-6 rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-purple-400 mb-2">{rules.name}</h3>
                          <p className="text-green-200 text-sm">{rules.description}</p>
                        </div>
                        <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {rules.numberOfDecks} Deck{rules.numberOfDecks > 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-bold text-yellow-400 mb-2">Key Rules:</h4>
                          <ul className="text-white space-y-1 text-sm">
                            <li>• Dealer {rules.dealerHitsSoft17 ? 'hits' : 'stands on'} soft 17</li>
                            <li>• {rules.noHoleCard ? 'No hole card (European style)' : 'Hole card dealt'}</li>
                            <li>• Blackjack pays {rules.blackjackPayout === 1.5 ? '3:2' : '6:5'}</li>
                            <li>• {rules.doubleAfterSplit ? 'Can' : 'Cannot'} double after split</li>
                            <li>• {rules.resplitAces ? 'Can' : 'Cannot'} resplit Aces</li>
                            <li>• {rules.surrenderAllowed ? 'Late surrender allowed' : 'No surrender'}</li>
                            <li>• {rules.insuranceAllowed ? 'Insurance available' : 'No insurance'}</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-blue-400 mb-2">Strategy Impact:</h4>
                          <div className="text-white text-sm space-y-1">
                            {rules.id === 'vegas' && (
                              <div>
                                <p>• Standard strategy applies</p>
                                <p>• Dealer hitting soft 17 increases house edge slightly</p>
                                <p>• Insurance and even money generally not recommended</p>
                              </div>
                            )}
                            {rules.id === 'european' && (
                              <div>
                                <p>• More cautious doubling/splitting vs dealer A/10</p>
                                <p>• Dealer standing on soft 17 is player-favorable</p>
                                <p>• No early surrender vs blackjack</p>
                              </div>
                            )}
                            {rules.id === 'atlantic_city' && (
                              <div>
                                <p>• Best variant for players overall</p>
                                <p>• Use surrender with hard 15 vs 10, hard 16 vs 9/10/A</p>
                                <p>• Resplitting Aces is a significant advantage</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
          
          {/* Tables & Progression Tab */}
          {activeTab === 'tables' && (
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">🎯 Tables & Progression</h2>
                <p className="text-white mb-6">
                  Progress through different table levels as you improve your skills and build your bankroll. Each table has unique betting limits and unlock requirements.
                </p>
                
                <div className="space-y-4">
                  {Object.values(TABLE_CONFIGURATIONS).map((table, index) => (
                    <div key={table.level} className="bg-green-800 bg-opacity-60 p-6 rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-green-400 mb-2">
                            {index + 1}. {table.name}
                          </h3>
                          <p className="text-green-200 text-sm">{table.description}</p>
                        </div>
                        <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold capitalize">
                          {table.theme}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-bold text-yellow-400 mb-2">Betting Limits:</h4>
                          <ul className="text-white space-y-1 text-sm">
                            <li>• Min bet: ${table.minBet}</li>
                            <li>• Max bet: ${table.maxBet}</li>
                            <li>• Buy-in: ${table.buyInMin} - ${table.buyInMax}</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-blue-400 mb-2">Unlock Requirements:</h4>
                          <ul className="text-white space-y-1 text-sm">
                            <li>• Bankroll: ${table.unlockRequirements.minimumChips}</li>
                            <li>• Hands played: {table.unlockRequirements.handsPlayed}</li>
                            <li>• Win rate: {table.unlockRequirements.winRate}%</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-purple-400 mb-2">Strategy Tips:</h4>
                          <div className="text-white text-sm space-y-1">
                            {table.level === 'beginner' && <p>• Focus on learning basic strategy</p>}
                            {table.level === 'amateur' && <p>• Practice bankroll management</p>}
                            {table.level === 'intermediate' && <p>• Master advanced plays</p>}
                            {table.level === 'advanced' && <p>• Consistent strategy execution</p>}
                            {table.level === 'professional' && <p>• Optimize for max efficiency</p>}
                            {table.level === 'high_roller' && <p>• Elite-level play required</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-800 bg-opacity-60 p-6 rounded-lg mt-8">
                  <h3 className="text-xl font-bold text-blue-400 mb-4">💡 Progression Tips</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white text-sm">
                    <div>
                      <h4 className="font-bold mb-2">Bankroll Management:</h4>
                      <ul className="ml-4 space-y-1">
                        <li>• Never bet more than 5% of your bankroll on a single hand</li>
                        <li>• Build up your bankroll gradually before moving to higher tables</li>
                        <li>• Consider taking breaks if you're on a losing streak</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Skill Development:</h4>
                      <ul className="ml-4 space-y-1">
                        <li>• Focus on consistency rather than short-term results</li>
                        <li>• Use Easy Mode to practice strategy at higher table levels</li>
                        <li>• Track your statistics to identify areas for improvement</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
          
          {/* Multiplayer Tab */}
          {activeTab === 'multiplayer' && (
            <div className="space-y-8">
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
                  
                  <div className="bg-blue-800 bg-opacity-60 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-blue-400 mb-4">🏆 Multiplayer Tips for Success</h3>
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
          )}

          {/* Dealer Mode Tab */}
          {activeTab === 'dealer' && (
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">🎭 Dealer Mode Guide</h2>
                
                <div className="space-y-6">
                  <div className="bg-red-800 bg-opacity-60 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-red-400 mb-4">Playing as the Dealer</h3>
                    <div className="text-white space-y-3">
                      <p>In Dealer Mode, you take on the role of the casino dealer while AI players compete at your table.</p>
                      
                      <div className="bg-red-700 bg-opacity-50 p-4 rounded">
                        <h4 className="font-semibold text-red-300 mb-2">How It Works:</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                          <li>Watch as AI players (Sarah, Mike, Lisa) place bets and make decisions</li>
                          <li>Each AI player has a different strategy: Basic, Aggressive, or Conservative</li>
                          <li>You automatically deal cards and play the dealer hand according to casino rules</li>
                          <li>Collect winnings when players bust or have lower hands than you</li>
                        </ul>
                      </div>
                      
                      <div className="bg-red-700 bg-opacity-50 p-4 rounded">
                        <h4 className="font-semibold text-red-300 mb-2">Game Controls:</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                          <li>Adjust game speed (Slow, Normal, Fast) to control the pace</li>
                          <li>Watch your house bankroll grow as you win hands</li>
                          <li>Start new rounds after each hand is complete</li>
                        </ul>
                      </div>
                      
                      <div className="bg-red-700 bg-opacity-50 p-4 rounded">
                        <h4 className="font-semibold text-red-300 mb-2">AI Player Strategies:</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                          <li><strong>Basic Strategy:</strong> Uses mathematically optimal decisions</li>
                          <li><strong>Aggressive:</strong> Takes more risks, hits more often</li>
                          <li><strong>Conservative:</strong> Plays it safe, stands on lower totals</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Tournaments Tab */}
          {activeTab === 'tournaments' && (
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">🏆 Tournament Guide</h2>
                
                <div className="space-y-6">
                  <div className="bg-yellow-800 bg-opacity-60 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4">Tournament Types</h3>
                    <div className="text-white space-y-4">
                      
                      <div className="bg-yellow-700 bg-opacity-50 p-4 rounded">
                        <h4 className="font-semibold text-yellow-300 mb-2">🥊 Elimination Tournaments</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                          <li>Players are eliminated when they go bankrupt</li>
                          <li>Last player standing wins the prize pool</li>
                          <li>Higher stakes and faster pace</li>
                        </ul>
                      </div>
                      
                      <div className="bg-yellow-700 bg-opacity-50 p-4 rounded">
                        <h4 className="font-semibold text-yellow-300 mb-2">📊 Leaderboard Tournaments</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                          <li>Compete for highest chip count within time limit</li>
                          <li>All players can participate until time runs out</li>
                          <li>Prize distribution based on final rankings</li>
                        </ul>
                      </div>
                      
                      <div className="bg-yellow-700 bg-opacity-50 p-4 rounded">
                        <h4 className="font-semibold text-yellow-300 mb-2">🏃 Survival Tournaments</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                          <li>Survive multiple rounds with increasing difficulty</li>
                          <li>Starting chips decrease each round</li>
                          <li>Unique challenge format for experienced players</li>
                        </ul>
                      </div>
                      
                      <div className="bg-red-700 bg-opacity-50 p-4 rounded mt-4">
                        <p className="text-sm text-red-200">
                          <strong>⚠️ Note:</strong> Tournament functionality may be limited due to lack of multiplayer testing. 
                          Single-player modes are recommended for the most stable experience.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Bankroll Challenges Tab */}
          {activeTab === 'challenges' && (
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">💰 Bankroll Challenges</h2>
                
                <div className="space-y-6">
                  <div className="bg-indigo-800 bg-opacity-60 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-indigo-400 mb-4">Challenge Types</h3>
                    <div className="text-white space-y-4">
                      
                      <div className="bg-indigo-700 bg-opacity-50 p-4 rounded">
                        <h4 className="font-semibold text-indigo-300 mb-2">🎯 Target Challenges</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                          <li>Reach a specific chip target within a set number of hands</li>
                          <li>Test your ability to grow your bankroll consistently</li>
                          <li>Various difficulty levels with different targets</li>
                        </ul>
                      </div>
                      
                      <div className="bg-indigo-700 bg-opacity-50 p-4 rounded">
                        <h4 className="font-semibold text-indigo-300 mb-2">⏱️ Time Challenges</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                          <li>Maximize winnings within a time limit</li>
                          <li>Fast-paced decision making under pressure</li>
                          <li>Leaderboard tracking for competitive players</li>
                        </ul>
                      </div>
                      
                      <div className="bg-indigo-700 bg-opacity-50 p-4 rounded">
                        <h4 className="font-semibold text-indigo-300 mb-2">🎲 Risk Challenges</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                          <li>Special scenarios with modified rules</li>
                          <li>High-risk, high-reward gameplay</li>
                          <li>Unique betting patterns and constraints</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-700 bg-opacity-50 p-4 rounded mt-4">
                        <p className="text-sm text-gray-300">
                          <strong>📊 Coming Soon:</strong> Bankroll Challenges are currently in development. 
                          Check back in future updates for these exciting gameplay modes!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Patch Notes Tab */}
          {activeTab === 'patches' && (
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">📝 Patch Notes</h2>
                
                <div className="space-y-6">
                  <div className="bg-orange-800 bg-opacity-60 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-orange-400 mb-4">Version 1.1 - Navigation & Bug Fixes</h3>
                    <div className="text-white space-y-3">
                      <div className="bg-green-700 bg-opacity-50 p-3 rounded">
                        <p className="font-semibold text-green-300">✅ New Features</p>
                        <div className="text-sm mt-2 space-y-1">
                          <p>• Implemented proper routing with dedicated page paths</p>
                          <p>• Added separate routes: /tournaments, /multiplayer, /challenges, /stats, /help, /save-load</p>
                          <p>• Improved navigation with browser back/forward button support</p>
                          <p>• Enhanced URL structure for better bookmarking and sharing</p>
                        </div>
                      </div>
                      
                      <div className="bg-blue-700 bg-opacity-50 p-3 rounded">
                        <p className="font-semibold text-blue-300">🔧 Bug Fixes</p>
                        <div className="text-sm mt-2 space-y-1">
                          <p>• Fixed critical dealer bust logic - players now correctly win when dealer busts</p>
                          <p>• Resolved card visibility issues during dealer play</p>
                          <p>• Fixed all-in betting feature for players with insufficient chips for minimum bet</p>
                          <p>• Improved game state management for accurate payout calculations</p>
                        </div>
                      </div>
                      
                      <div className="bg-purple-700 bg-opacity-50 p-3 rounded">
                        <p className="font-semibold text-purple-300">🎯 Improvements</p>
                        <div className="text-sm mt-2 space-y-1">
                          <p>• Streamlined core game component by separating routing concerns</p>
                          <p>• Better code organization with dedicated page components</p>
                          <p>• Enhanced user experience with proper page-based navigation</p>
                          <p>• Improved performance through component separation</p>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-700 bg-opacity-50 p-3 rounded">
                        <p className="font-semibold text-yellow-300">📝 Notes</p>
                        <div className="text-sm mt-2 space-y-1">
                          <p>• All game logic bugs from version 1.0 have been resolved</p>
                          <p>• Routing system provides foundation for future feature expansion</p>
                          <p>• Core gameplay is now fully stable and tested</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-300 mb-4">Version 1.0 - Stable Release (Previous)</h3>
                    <div className="text-white space-y-2">
                      <div className="bg-green-700 bg-opacity-30 p-2 rounded text-sm">
                        <p className="font-semibold text-green-300">Features:</p>
                        <p>Complete single-player experience, tutorial system, progressive unlocking, save/load functionality, audio system, multiplayer foundation</p>
                      </div>
                      <div className="bg-blue-700 bg-opacity-30 p-2 rounded text-sm">
                        <p className="font-semibold text-blue-300">Fixes:</p>
                        <p>Dealer soft 17 behavior, bankroll challenges unlock, betting limits, insurance payouts, surrender functionality</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-green-300 text-sm">
          Good luck at the tables! 🍀
        </div>
      </div>
    </div>
  )
}