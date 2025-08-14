'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { 
  Tournament, 
  TournamentResult,
  tournamentEngine,
  TOURNAMENT_TEMPLATES 
} from '@/lib/tournamentSystem'

interface TournamentLobbyProps {
  onBack: () => void
  onJoinTournament: (tournament: Tournament) => void
}

export default function TournamentLobby({ onBack, onJoinTournament }: TournamentLobbyProps) {
  const { players, stats } = useGameStore()
  const [availableTournaments, setAvailableTournaments] = useState<Tournament[]>([])
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [tournamentHistory, setTournamentHistory] = useState<TournamentResult[]>([])
  const [selectedTab, setSelectedTab] = useState<'available' | 'create' | 'history' | 'stats'>('available')
  const [selectedTemplate, setSelectedTemplate] = useState<Tournament | null>(null)
  const [confirmingTournament, setConfirmingTournament] = useState<Tournament | null>(null)
  const [playerStats, setPlayerStats] = useState({
    tournamentsPlayed: 0,
    wins: 0,
    topThree: 0,
    totalPrizes: 0,
    bestFinish: 0
  })

  const mainPlayer = players[0]
  const playerId = mainPlayer?.id || 'player-1'
  const playerName = mainPlayer?.name || 'Player 1'
  const playerChips = mainPlayer?.chips || 0

  useEffect(() => {
    refreshTournamentData()
    const interval = setInterval(refreshTournamentData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [playerId])

  const refreshTournamentData = () => {
    setAvailableTournaments(tournamentEngine.getAvailableTournaments(playerChips))
    setActiveTournament(tournamentEngine.getActiveTournament())
    setTournamentHistory(tournamentEngine.getTournamentHistory().slice(0, 10)) // Last 10 tournaments
    setPlayerStats(tournamentEngine.getPlayerTournamentStats(playerId))
  }

  const handleCreateTournament = (template: Tournament) => {
    setConfirmingTournament(template)
  }
  
  const confirmCreateTournament = (template: Tournament) => {
    try {
      const newTournament = tournamentEngine.createTournament(template)
      if (newTournament) {
        // Successfully created, now join it
        const success = tournamentEngine.joinTournament(newTournament.id, playerId, playerName, playerChips)
        if (success) {
          // Deduct entry fee from player chips
          const currentPlayers = useGameStore.getState().players
          const updatedPlayers = currentPlayers.map((player, index) => {
            if (index === 0) {
              return { ...player, chips: player.chips - template.entryFee }
            }
            return player
          })
          useGameStore.setState({ players: updatedPlayers })
          
          refreshTournamentData()
          setSelectedTemplate(null)
          setConfirmingTournament(null)
          onJoinTournament(newTournament)
        } else {
          alert('Created tournament but failed to join. Check requirements and try again.')
          setConfirmingTournament(null)
        }
      } else {
        alert('Failed to create tournament. Please try again.')
        setConfirmingTournament(null)
      }
    } catch (error) {
      console.error('Tournament creation error:', error)
      alert('Failed to create tournament. Please try again.')
      setConfirmingTournament(null)
    }
  }

  const handleJoinTournament = (tournament: Tournament) => {
    setConfirmingTournament(tournament)
  }
  
  const confirmJoinTournament = (tournament: Tournament) => {
    console.log('Attempting to join tournament:', {
      tournamentId: tournament.id,
      playerId,
      playerName,
      playerChips,
      entryFee: tournament.entryFee,
      canAfford: playerChips >= tournament.entryFee,
      tournamentStatus: tournament.status,
      currentParticipants: tournament.participants?.length || 0,
      maxParticipants: tournament.maxParticipants
    })
    
    const success = tournamentEngine.joinTournament(tournament.id, playerId, playerName, playerChips)
    if (success) {
      // Deduct entry fee from player chips
      const currentPlayers = useGameStore.getState().players
      const updatedPlayers = currentPlayers.map((player, index) => {
        if (index === 0) {
          return { ...player, chips: player.chips - tournament.entryFee }
        }
        return player
      })
      useGameStore.setState({ players: updatedPlayers })
      
      refreshTournamentData()
      setConfirmingTournament(null)
      onJoinTournament(tournament)
    } else {
      console.error('Failed to join tournament')
      const reasons = []
      if (playerChips < tournament.entryFee) reasons.push(`Insufficient chips (need $${tournament.entryFee}, have $${playerChips})`)
      if (tournament.participants?.length >= tournament.maxParticipants) reasons.push('Tournament is full')
      if (tournament.status !== 'waiting') reasons.push(`Tournament status is ${tournament.status}, not waiting`)
      if (tournament.participants?.some(p => p.playerId === playerId)) reasons.push('Already joined this tournament')
      
      const errorMsg = reasons.length > 0 
        ? `Unable to join tournament: ${reasons.join(', ')}` 
        : 'Unable to join tournament. Check requirements and try again.'
      
      alert(errorMsg)
      setConfirmingTournament(null)
    }
  }

  const canAffordTournament = (entryFee: number) => {
    return playerChips >= entryFee
  }

  const getDifficultyColor = (maxParticipants: number, entryFee: number) => {
    if (entryFee >= 400) return 'text-red-600'
    if (entryFee >= 200) return 'text-orange-600'
    if (entryFee >= 100) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getDifficultyBadgeColor = (maxParticipants: number, entryFee: number) => {
    if (entryFee >= 400) return 'bg-red-100 text-red-800'
    if (entryFee >= 200) return 'bg-orange-100 text-orange-800'
    if (entryFee >= 100) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const formatPrize = (amount: number) => {
    return amount >= 1000 ? `$${(amount / 1000).toFixed(1)}k` : `$${amount}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">Tournament Lobby</h1>
              <p className="text-gray-700">
                Compete against other players in organized tournaments
              </p>
            </div>
            <div className="text-right">
              <div className="text-gray-600 text-sm">Your Balance</div>
              <div className="text-2xl font-bold text-green-600">${playerChips}</div>
              <button
                onClick={onBack}
                className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                ← Back to Menu
              </button>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className="text-yellow-600 text-xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800">Development Notice</h3>
              <p className="text-yellow-700 text-sm">
                Feature in development, not currently working.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6">
          {[
            { id: 'available', label: 'Available', count: availableTournaments.length },
            { id: 'create', label: 'Create New', count: null },
            { id: 'history', label: 'Recent Results', count: tournamentHistory.length },
            { id: 'stats', label: 'My Stats', count: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 px-2 py-1 bg-blue-500 bg-opacity-50 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Available Tournaments Tab */}
        {selectedTab === 'available' && (
          <div className="space-y-4">
            {activeTournament && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-green-800">🏆 Active Tournament</h3>
                    <p className="text-green-700">{activeTournament.name}</p>
                    <p className="text-sm text-green-600">
                      {activeTournament.participants.length} / {activeTournament.maxParticipants} players
                    </p>
                  </div>
                  <button
                    onClick={() => onJoinTournament(activeTournament)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    View Tournament
                  </button>
                </div>
              </div>
            )}

            {availableTournaments.length === 0 ? (
              <div className="bg-white border rounded-lg p-8 text-center">
                <p className="text-gray-800 text-lg mb-4">No tournaments available right now</p>
                <p className="text-gray-600 mb-4">Create a new tournament to get started!</p>
                <button
                  onClick={() => setSelectedTab('create')}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Create Tournament
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {availableTournaments.map((tournament) => (
                  <div key={tournament.id} className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-gray-900">{tournament.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyBadgeColor(tournament.maxParticipants, tournament.entryFee)}`}>
                        {tournament.entryFee >= 400 ? 'ELITE' : tournament.entryFee >= 200 ? 'ADVANCED' : tournament.entryFee >= 100 ? 'INTERMEDIATE' : 'BEGINNER'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{tournament.description}</p>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="text-gray-900 capitalize">{tournament.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Players:</span>
                        <span className="text-gray-900">{tournament.participants.length} / {tournament.maxParticipants}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entry Fee:</span>
                        <span className={`font-medium ${canAffordTournament(tournament.entryFee) ? 'text-green-600' : 'text-red-600'}`}>
                          ${tournament.entryFee}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prize Pool:</span>
                        <span className="text-yellow-600 font-medium">{formatPrize(tournament.prizePool)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="text-gray-900">{formatDuration(tournament.duration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Starting Chips:</span>
                        <span className="text-gray-900">${tournament.rules.startingChips}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {tournament.rules.gameVariant.toUpperCase()} • {tournament.rules.tableLevel}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <button
                          onClick={() => handleJoinTournament(tournament)}
                          disabled={!canAffordTournament(tournament.entryFee) || tournament.participants.length >= tournament.maxParticipants}
                          className={`px-4 py-2 rounded font-medium transition-colors ${
                            canAffordTournament(tournament.entryFee) && tournament.participants.length < tournament.maxParticipants
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          {tournament.participants.length >= tournament.maxParticipants ? 'Full' : 'Join Tournament'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Tournament Tab */}
        {selectedTab === 'create' && (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Tournament</h2>
              <p className="text-gray-600 mb-4">
                Choose from pre-designed tournament formats below.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {TOURNAMENT_TEMPLATES.map((template) => (
                <div key={template.id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyBadgeColor(template.maxParticipants, template.entryFee)}`}>
                      {template.entryFee >= 400 ? 'ELITE' : template.entryFee >= 200 ? 'ADVANCED' : template.entryFee >= 100 ? 'INTERMEDIATE' : 'BEGINNER'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="text-gray-900 capitalize">{template.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Players:</span>
                      <span className="text-gray-900">{template.maxParticipants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entry Fee:</span>
                      <span className="text-gray-900">${template.entryFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prize Pool:</span>
                      <span className="text-yellow-600 font-medium">{formatPrize(template.prizePool)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="text-gray-900">{formatDuration(template.duration)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                    >
                      View Details
                    </button>
                    <div className="flex flex-col items-end space-y-1">
                      <button
                        onClick={() => handleCreateTournament(template)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                      >
                        Create Tournament
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tournament History Tab */}
        {selectedTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Recent Tournament Results</h2>
              <p className="text-gray-600">View the results of recently completed tournaments</p>
            </div>

            {tournamentHistory.length === 0 ? (
              <div className="bg-white border rounded-lg p-8 text-center">
                <p className="text-gray-800 text-lg">No tournament history yet</p>
                <p className="text-gray-600">Participate in tournaments to see results here!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tournamentHistory.map((result, index) => (
                  <div key={index} className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Tournament #{result.tournamentId.slice(-8)}</h3>
                        <p className="text-gray-600">Winner: {result.winner}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-600 font-bold">{formatPrize(result.totalPrizePool)}</div>
                        <div className="text-gray-500 text-sm">{result.duration.toFixed(1)} minutes</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {result.participantResults.slice(0, 3).map((participant) => (
                        <div key={participant.playerId} className={`p-2 rounded ${
                          participant.finalPosition === 1 ? 'bg-yellow-600 bg-opacity-30' :
                          participant.finalPosition === 2 ? 'bg-gray-600 bg-opacity-30' :
                          'bg-orange-600 bg-opacity-30'
                        }`}>
                          <div className="font-medium text-gray-900">
                            #{participant.finalPosition} {participant.playerName}
                          </div>
                          <div className="text-xs text-gray-600">
                            Prize: ${participant.prize}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Player Stats Tab */}
        {selectedTab === 'stats' && (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Tournament Statistics</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-100 border border-blue-200 rounded-lg">
                  <div className="text-2xl font-bold text-black">{playerStats.tournamentsPlayed}</div>
                  <div className="text-blue-700 text-sm">Tournaments Played</div>
                </div>
                <div className="text-center p-4 bg-yellow-100 border border-yellow-200 rounded-lg">
                  <div className="text-2xl font-bold text-black">{playerStats.wins}</div>
                  <div className="text-yellow-700 text-sm">Wins</div>
                </div>
                <div className="text-center p-4 bg-green-100 border border-green-200 rounded-lg">
                  <div className="text-2xl font-bold text-black">{playerStats.topThree}</div>
                  <div className="text-green-700 text-sm">Top 3 Finishes</div>
                </div>
                <div className="text-center p-4 bg-purple-100 border border-purple-200 rounded-lg">
                  <div className="text-2xl font-bold text-black">${playerStats.totalPrizes}</div>
                  <div className="text-purple-700 text-sm">Total Prizes Won</div>
                </div>
                <div className="text-center p-4 bg-red-100 border border-red-200 rounded-lg">
                  <div className="text-2xl font-bold text-black">
                    {playerStats.bestFinish > 0 ? `#${playerStats.bestFinish}` : 'N/A'}
                  </div>
                  <div className="text-red-700 text-sm">Best Finish</div>
                </div>
              </div>

              {playerStats.tournamentsPlayed > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h3 className="text-gray-900 font-medium mb-2">Win Rate</h3>
                    <div className="text-2xl font-bold text-yellow-600">
                      {((playerStats.wins / playerStats.tournamentsPlayed) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h3 className="text-gray-900 font-medium mb-2">Top 3 Rate</h3>
                    <div className="text-2xl font-bold text-green-600">
                      {((playerStats.topThree / playerStats.tournamentsPlayed) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}

              {playerStats.tournamentsPlayed === 0 && (
                <div className="mt-6 text-center">
                  <p className="text-gray-600 mb-4">You haven't participated in any tournaments yet!</p>
                  <button
                    onClick={() => setSelectedTab('available')}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Join Your First Tournament
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Template Details Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-green-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-black">{selectedTemplate.name}</h3>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ×
                  </button>
                </div>
                
                <p className="text-gray-700 mb-4">{selectedTemplate.description}</p>
                
                <div className="space-y-2 text-sm mb-4">
                  <h4 className="font-medium text-black">Tournament Details:</h4>
                  <div className="bg-gray-50 p-3 rounded space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="capitalize text-black">{selectedTemplate.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Players:</span>
                      <span className="text-black">{selectedTemplate.maxParticipants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entry Fee:</span>
                      <span className="text-black">${selectedTemplate.entryFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prize Pool:</span>
                      <span className="text-black">${selectedTemplate.prizePool}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="text-black">{formatDuration(selectedTemplate.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Starting Chips:</span>
                      <span className="text-black">${selectedTemplate.rules.startingChips}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Game Rules:</span>
                      <span className="text-black">{selectedTemplate.rules.gameVariant}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleCreateTournament(selectedTemplate)
                      setSelectedTemplate(null)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create Tournament
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Tournament Confirmation Dialog */}
        {confirmingTournament && (
          <div className="fixed inset-0 bg-green-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-black">Confirm Tournament</h3>
                  <button
                    onClick={() => setConfirmingTournament(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ×
                  </button>
                </div>
                
                <p className="text-gray-700 mb-4">
                  Are you sure you want to {confirmingTournament.participants ? 'join' : 'create'} this tournament?
                </p>
                
                <div className="bg-gray-50 p-3 rounded mb-4">
                  <h4 className="font-medium text-black mb-2">{confirmingTournament.name}</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entry Fee:</span>
                      <span className="text-black font-medium">${confirmingTournament.entryFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prize Pool:</span>
                      <span className="text-yellow-600 font-medium">{formatPrize(confirmingTournament.prizePool)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="text-black">{formatDuration(confirmingTournament.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your Balance After:</span>
                      <span className={`font-medium ${
                        playerChips - confirmingTournament.entryFee >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${playerChips - confirmingTournament.entryFee}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setConfirmingTournament(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (confirmingTournament.participants) {
                        confirmJoinTournament(confirmingTournament)
                      } else {
                        confirmCreateTournament(confirmingTournament)
                      }
                    }}
                    disabled={playerChips < confirmingTournament.entryFee}
                    className={`px-4 py-2 rounded font-medium ${
                      playerChips >= confirmingTournament.entryFee
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {confirmingTournament.participants ? 'Join Tournament' : 'Create Tournament'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}