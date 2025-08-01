'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Tournament, TournamentParticipant, tournamentEngine } from '@/lib/tournamentSystem'
import { BlackjackGame } from './BlackjackGame'

interface TournamentGameProps {
  tournament: Tournament
  onExit: () => void
}

export default function TournamentGame({ tournament, onExit }: TournamentGameProps) {
  const { players, stats, setGameMode } = useGameStore()
  const [tournamentState, setTournamentState] = useState<Tournament>(tournament)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [currentRound, setCurrentRound] = useState<number>(1)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const mainPlayer = players[0]
  const playerId = mainPlayer?.id || 'player-1'

  useEffect(() => {
    // Start the tournament if it hasn't started yet
    if (tournament.status === 'waiting') {
      const started = tournamentEngine.startTournament(tournament.id)
      if (started) {
        const updatedTournament = tournamentEngine.getTournament(tournament.id)
        if (updatedTournament) {
          setTournamentState(updatedTournament)
        }
      }
    }

    // Set up timer
    const interval = setInterval(() => {
      if (tournament.status === 'active') {
        const elapsed = (Date.now() - tournament.startTime) / 1000 / 60 // in minutes
        const remaining = Math.max(0, tournament.duration - elapsed)
        setTimeRemaining(remaining)

        // Check if tournament should end
        if (remaining <= 0) {
          finishTournament()
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [tournament.id])

  useEffect(() => {
    // Update player chips in tournament when main player chips change
    if (mainPlayer && tournament.status === 'active') {
      tournamentEngine.updateParticipantChips(tournament.id, playerId, mainPlayer.chips)
      
      // Get updated tournament state
      const updated = tournamentEngine.getTournament(tournament.id)
      if (updated) {
        setTournamentState(updated)
        
        // Check for eliminations in elimination tournaments
        if (updated.type === 'elimination' && mainPlayer.chips <= 0) {
          tournamentEngine.eliminateParticipant(tournament.id, playerId)
        }
      }
    }
  }, [mainPlayer?.chips, tournament.id, playerId])

  const finishTournament = () => {
    const result = tournamentEngine.finishTournament(tournament.id)
    if (result) {
      setIsFinished(true)
      setShowLeaderboard(true)
    }
  }

  const handleExit = () => {
    if (tournament.status === 'active' && !isFinished) {
      // Leave tournament
      tournamentEngine.leaveTournament(tournament.id, playerId)
    }
    onExit()
  }

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes)
    const secs = Math.floor((minutes - mins) * 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPlayerPosition = () => {
    const participant = tournamentState.participants.find(p => p.playerId === playerId)
    if (!participant) return 0

    const sorted = [...tournamentState.participants]
      .filter(p => !p.isEliminated)
      .sort((a, b) => b.chips - a.chips)
    
    return sorted.findIndex(p => p.playerId === playerId) + 1
  }

  const getCurrentBlinds = () => {
    return tournamentEngine.getCurrentBlinds(tournament.id)
  }

  const getLeaderboard = () => {
    return [...tournamentState.participants]
      .sort((a, b) => {
        if (a.isEliminated && !b.isEliminated) return 1
        if (!a.isEliminated && b.isEliminated) return -1
        if (a.finalPosition && b.finalPosition) return a.finalPosition - b.finalPosition
        return b.chips - a.chips
      })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900">
      {/* Tournament Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{tournamentState.name}</h1>
            <div className="flex items-center space-x-6 text-sm mt-1">
              <span>
                Position: #{getPlayerPosition()} / {tournamentState.participants.filter(p => !p.isEliminated).length}
              </span>
              <span>Time: {formatTime(timeRemaining)}</span>
              <span>Round: {currentRound} / {tournamentState.totalRounds || '∞'}</span>
              {getCurrentBlinds() && (
                <span>Blinds: ${getCurrentBlinds()?.ante} / ${getCurrentBlinds()?.minBet}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Your Chips</div>
            <div className="text-2xl font-bold">${mainPlayer?.chips || 0}</div>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="px-3 py-1 bg-purple-500 hover:bg-purple-600 rounded text-sm"
              >
                Leaderboard
              </button>
              <button
                onClick={handleExit}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm"
              >
                Exit Tournament
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Status */}
      {isFinished && (
        <div className="bg-yellow-100 border-b border-yellow-300 p-3">
          <div className="max-w-6xl mx-auto text-center">
            <span className="text-yellow-800 font-semibold">Tournament Finished!</span>
            <span className="text-yellow-700 ml-2">Check the leaderboard for final results.</span>
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className="relative">
        <BlackjackGame />
      </div>

      {/* Leaderboard Overlay */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Tournament Leaderboard</h2>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-white hover:text-gray-200 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                {getLeaderboard().map((participant, index) => {
                  const isCurrentPlayer = participant.playerId === playerId
                  const position = participant.finalPosition || (participant.isEliminated ? '—' : index + 1)
                  
                  return (
                    <div
                      key={participant.playerId}
                      className={`flex justify-between items-center p-3 rounded-lg border ${
                        isCurrentPlayer 
                          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500' 
                          : participant.isEliminated 
                            ? 'bg-gray-50 border-gray-200 opacity-60' 
                            : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          position === 1 ? 'bg-yellow-500 text-white' :
                          position === 2 ? 'bg-gray-400 text-white' :
                          position === 3 ? 'bg-orange-600 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {position}
                        </div>
                        <div>
                          <div className={`font-semibold ${isCurrentPlayer ? 'text-blue-800' : 'text-gray-900'}`}>
                            {participant.playerName} {isCurrentPlayer && '(You)'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {participant.isEliminated ? 'Eliminated' : 'Active'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${isCurrentPlayer ? 'text-blue-600' : 'text-gray-900'}`}>
                          ${participant.chips}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.floor((Date.now() - participant.lastActiveAt) / 1000 / 60)}m ago
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {isFinished && (
              <div className="border-t bg-gray-50 p-4">
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={handleExit}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Return to Lobby
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}