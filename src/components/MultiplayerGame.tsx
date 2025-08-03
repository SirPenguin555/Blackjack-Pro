'use client'

import { useState, useEffect } from 'react'
import { useMultiplayerStore } from '@/store/multiplayerStore'
import { MultiplayerPlayer, PlayerAction, ChatMessage } from '@/types/multiplayer'
import { Hand } from './Hand'
import { ChipSelector } from './ChipSelector'
import { GameActions } from './GameActions'
import { CHIP_DENOMINATIONS } from '@/store/gameStore'
import { Avatar } from './Avatar'
import { usePlayerTimeout } from '@/hooks/usePlayerTimeout'
import { useConnectionRecovery } from '@/hooks/useConnectionRecovery'

interface MultiplayerGameProps {
  onBack: () => void
}

export function MultiplayerGame({ onBack }: MultiplayerGameProps) {
  const {
    currentTable,
    currentGame,
    userId,
    playerName,
    leaveTable,
    sendChatMessage,
    placeBet,
    playerAction,
    startNewRound
  } = useMultiplayerStore()

  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // Connection and timeout management
  const { remainingTime, isMyTurn } = usePlayerTimeout()
  const { isConnected } = useConnectionRecovery()

  // Update chat messages when game updates
  useEffect(() => {
    if (currentGame?.messages) {
      setChatMessages(currentGame.messages.slice(-20)) // Keep last 20 messages
    }
  }, [currentGame?.messages])

  const handleLeaveTable = async () => {
    if (currentTable) {
      await leaveTable()
      onBack()
    }
  }

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (chatMessage.trim() && currentTable) {
      await sendChatMessage(chatMessage.trim())
      setChatMessage('')
    }
  }

  const currentPlayer = currentGame?.players.find(p => p.userId === userId)
  const otherPlayers = currentGame?.players.filter(p => p.userId !== userId) || []
  const isCurrentPlayerTurn = currentGame?.currentPlayerIndex !== undefined && 
    currentGame.players[currentGame.currentPlayerIndex]?.userId === userId

  if (!currentTable || !currentGame) {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-800 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handleLeaveTable}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            >
              ← Leave Table
            </button>
            <div className="text-yellow-400 font-semibold text-sm sm:text-base">
              {currentTable.name} | Round {currentGame.round}
            </div>
            <div className="flex items-center space-x-4 text-white text-sm">
              <span>{currentGame.players.length}/{currentTable.maxPlayers} Players</span>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>{isConnected ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Multiplayer Blackjack</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Game Area */}
          <div className="lg:col-span-3">
            <div className="bg-green-700 rounded-lg p-3 sm:p-6 shadow-xl">
              {/* Dealer Section */}
              <div className="mb-6 sm:mb-8 rounded-lg p-2">
                <Hand 
                  hand={currentGame.dealer} 
                  label="Dealer" 
                  className="justify-center"
                />
              </div>

              {/* Players Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Current Player */}
                {currentPlayer && (
                  <div className={`rounded-lg p-4 border-2 ${
                    isCurrentPlayerTurn ? 'border-yellow-400 bg-green-600' : 'border-green-500'
                  }`}>
                    <div className="mb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Avatar name={currentPlayer.name} size="sm" />
                          <span className="text-white font-semibold">
                            {currentPlayer.name} (You)
                            {isCurrentPlayerTurn && <span className="ml-2 text-yellow-400">• Your Turn</span>}
                          </span>
                        </div>
                        <span className="text-green-400 font-mono">${currentPlayer.chips}</span>
                      </div>
                      {currentPlayer.bet > 0 && (
                        <div className="text-sm text-gray-300">Bet: ${currentPlayer.bet}</div>
                      )}
                    </div>
                    <Hand 
                      hand={currentPlayer.hand} 
                      label="" 
                      className="justify-center"
                    />
                  </div>
                )}

                {/* Other Players */}
                {otherPlayers.map((player, index) => (
                  <div key={player.userId} className="rounded-lg p-4 border border-green-500">
                    <div className="mb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Avatar name={player.name} size="sm" />
                          <span className="text-white font-semibold">
                            {player.name}
                            {player.userId === currentGame.hostUserId && <span className="ml-1 text-yellow-400">👑</span>}
                            {currentGame.currentPlayerIndex === currentGame.players.indexOf(player) && (
                              <span className="ml-2 text-yellow-400">• Turn</span>
                            )}
                          </span>
                        </div>
                        <span className="text-green-400 font-mono">${player.chips}</span>
                      </div>
                      {player.bet > 0 && (
                        <div className="text-sm text-gray-300">Bet: ${player.bet}</div>
                      )}
                      <div className="flex items-center text-xs text-gray-300">
                        <div className={`w-2 h-2 rounded-full mr-1 ${
                          player.isConnected ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        {player.isConnected ? 'Online' : 'Offline'}
                      </div>
                    </div>
                    <Hand 
                      hand={player.hand} 
                      label="" 
                      className="justify-center"
                    />
                  </div>
                ))}
              </div>

              {/* Game Controls */}
              <div className="flex flex-col items-center space-y-6">
                {currentGame.phase === 'betting' && currentPlayer && (
                  <div className="space-y-4">
                    <ChipSelector
                      denominations={CHIP_DENOMINATIONS}
                      selectedBet={currentPlayer.bet}
                      onBetChange={(amount) => {
                        placeBet(amount).catch(error => {
                          console.error('Failed to place bet:', error)
                          // Could show toast notification here
                        })
                      }}
                      maxBet={currentPlayer.chips}
                    />
                    <button
                      disabled={currentPlayer.bet === 0}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ready
                    </button>
                  </div>
                )}

                {currentGame.phase === 'playing' && isCurrentPlayerTurn && currentPlayer && (
                  <div className="space-y-4">
                    <div className="text-center text-white">
                      <div className="text-lg font-semibold">Your Turn</div>
                      {remainingTime > 0 && (
                        <div className="text-sm text-yellow-400">
                          Time remaining: {Math.ceil(remainingTime)}s
                        </div>
                      )}
                    </div>
                    <GameActions
                      player={currentPlayer}
                      onAction={(action) => {
                        playerAction(action).catch(error => {
                          console.error('Failed to perform action:', error)
                          // Could show toast notification here
                        })
                      }}
                    />
                  </div>
                )}

                {currentGame.phase === 'playing' && !isCurrentPlayerTurn && (
                  <div className="text-center text-white">
                    <div className="text-lg font-semibold">
                      Waiting for {currentGame.players[currentGame.currentPlayerIndex]?.name}...
                    </div>
                  </div>
                )}

                {currentGame.phase === 'dealer' && (
                  <div className="text-center text-white">
                    <div className="text-lg font-semibold">Dealer Playing...</div>
                  </div>
                )}

                {currentGame.phase === 'finished' && (
                  <div className="space-y-4 text-center">
                    <div className="text-white text-lg">Round Complete!</div>
                    <button
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      onClick={() => {
                        startNewRound().catch(error => {
                          console.error('Failed to start new round:', error)
                        })
                      }}
                    >
                      Next Round
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-green-700 rounded-lg p-4 shadow-xl h-96 flex flex-col">
              <h3 className="text-white font-semibold mb-4">Chat</h3>
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                {chatMessages.map((msg, index) => (
                  <div key={index} className="text-sm">
                    <div className="text-gray-300">
                      <span className="font-semibold text-white">{msg.playerName}:</span>
                    </div>
                    <div className="text-gray-200 ml-2">{msg.message}</div>
                  </div>
                ))}
                {chatMessages.length === 0 && (
                  <div className="text-gray-400 text-sm italic">No messages yet...</div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-green-600 text-white placeholder-gray-300 rounded border-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  maxLength={100}
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Game Phase Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-800 text-white text-sm rounded">
            Phase: {currentGame.phase} | Current Player: {currentGame.currentPlayerIndex}
            {currentGame.lastAction && ` | Last Action: ${currentGame.lastAction}`}
          </div>
        )}
      </div>
    </div>
  )
}