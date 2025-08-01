'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { 
  BankrollChallenge, 
  ChallengeProgress, 
  bankrollChallengeEngine
} from '@/lib/bankrollChallenges'
import { statsTracker } from '@/lib/StatsTracker'

interface BankrollChallengesProps {
  onClose: () => void
}

export default function BankrollChallenges({ onClose }: BankrollChallengesProps) {
  const { stats } = useGameStore()
  const [availableChallenges, setAvailableChallenges] = useState<BankrollChallenge[]>([])
  const [allChallenges, setAllChallenges] = useState<BankrollChallenge[]>([])
  const [activeChallenge, setActiveChallenge] = useState<{
    challenge: BankrollChallenge
    progress: ChallengeProgress
  } | null>(null)
  const [selectedChallenge, setSelectedChallenge] = useState<BankrollChallenge | null>(null)
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([])

  useEffect(() => {
    const playerStats = {
      ...stats,
      maxChips: statsTracker.getStatisticsSummary().maxBankroll,
      currentTableLevel: useGameStore.getState().currentTableLevel,
      achievements: [] // This would come from achievement system
    }
    
    setAvailableChallenges(bankrollChallengeEngine.getAvailableChallenges(playerStats))
    setAllChallenges(bankrollChallengeEngine.getAllChallenges())
    setActiveChallenge(bankrollChallengeEngine.getActiveChallenge())
    setCompletedChallenges(bankrollChallengeEngine.getCompletedChallenges())
  }, [stats])

  const handleStartChallenge = (challengeId: string) => {
    const challenge = bankrollChallengeEngine.startChallenge(challengeId)
    if (challenge) {
      // Set player chips to challenge starting amount
      const currentPlayers = useGameStore.getState().players
      const updatedPlayers = currentPlayers.map((player, index) => {
        if (index === 0) {
          return { ...player, chips: challenge.startingChips }
        }
        return player
      })
      
      useGameStore.setState({ players: updatedPlayers })
      setActiveChallenge({
        challenge,
        progress: bankrollChallengeEngine.getChallengeProgress(challengeId)!
      })
      onClose()
    }
  }

  const handleAbandonChallenge = () => {
    if (activeChallenge) {
      bankrollChallengeEngine.abandonChallenge(activeChallenge.challenge.id)
      setActiveChallenge(null)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'hard': return 'text-orange-600'
      case 'expert': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-orange-100 text-orange-800'
      case 'expert': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (minutes: number) => {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`
  }

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const getUnlockRequirementText = (unlockRequirement: { type: string; value: number | string }) => {
    switch (unlockRequirement.type) {
      case 'chips':
        return `Reach $${unlockRequirement.value} max chips`
      case 'wins':
        return `Win ${unlockRequirement.value} hands total`
      case 'level':
        const levelNames = ['Beginner', 'Intermediate', 'Advanced', 'Professional', 'High Roller']
        return `Reach ${levelNames[unlockRequirement.value - 1] || `Level ${unlockRequirement.value}`} table`
      case 'achievement':
        return `Earn "${unlockRequirement.value}" achievement`
      default:
        return 'Always available'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Bankroll Challenges</h2>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              ← Back to Menu
            </button>
          </div>
          <p className="text-green-100 mt-2">
            Test your skills with special betting scenarios and earn rewards
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {activeChallenge ? (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Active Challenge: {activeChallenge.challenge.name}
                  </h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getDifficultyBadgeColor(activeChallenge.challenge.difficulty)}`}>
                    {activeChallenge.challenge.difficulty.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleAbandonChallenge}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Abandon
                </button>
              </div>
              
              <p className="text-gray-700 mb-3">{activeChallenge.challenge.description}</p>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress: ${activeChallenge.progress.currentChips} / ${activeChallenge.challenge.targetAmount}</span>
                    <span>{getProgressPercentage(activeChallenge.progress.currentChips, activeChallenge.challenge.targetAmount).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(activeChallenge.progress.currentChips, activeChallenge.challenge.targetAmount)}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Hands Played: {activeChallenge.progress.handsPlayed}</span>
                  {activeChallenge.challenge.timeLimit && activeChallenge.progress.startTime && (
                    <span>
                      Time Remaining: {Math.max(0, activeChallenge.challenge.timeLimit - Math.floor((Date.now() - activeChallenge.progress.startTime) / 1000 / 60))} mins
                    </span>
                  )}
                </div>
              </div>
              
              {activeChallenge.challenge.specialRules && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-medium text-yellow-800">Special Rules:</p>
                  <ul className="text-xs text-yellow-700 mt-1">
                    {activeChallenge.challenge.specialRules.map((rule, index) => (
                      <li key={index}>• {rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 mb-6">No active challenge. Select one below to get started!</p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {allChallenges.map((challenge) => {
              const isCompleted = completedChallenges.includes(challenge.id)
              const isAvailable = availableChallenges.some(avail => avail.id === challenge.id)
              const progress = bankrollChallengeEngine.getChallengeProgress(challenge.id)
              
              return (
                <div key={challenge.id} className={`border rounded-lg p-4 ${
                  !isAvailable ? 'bg-gray-50 border-gray-300 opacity-75' :
                  isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-black">{challenge.name}</h3>
                    <div className="flex items-center space-x-2">
                      {!isAvailable && (
                        <span className="text-red-600 text-sm">🔒 Locked</span>
                      )}
                      {isCompleted && (
                        <span className="text-green-600 text-sm">✓ Completed</span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyBadgeColor(challenge.difficulty)}`}>
                        {challenge.difficulty.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-3">{challenge.description}</p>
                  
                  {!isAvailable && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs font-medium text-red-800">🔒 Unlock Requirement:</p>
                      <p className="text-xs text-red-700">{getUnlockRequirementText(challenge.unlockRequirement)}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-medium text-black">${challenge.targetAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Starting Chips:</span>
                      <span className="font-medium text-black">${challenge.startingChips}</span>
                    </div>
                    {challenge.timeLimit && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Limit:</span>
                        <span className="font-medium text-black">{formatTime(challenge.timeLimit)}</span>
                      </div>
                    )}
                    {challenge.minBet && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min Bet:</span>
                        <span className="font-medium text-black">${challenge.minBet}</span>
                      </div>
                    )}
                    {challenge.maxBet && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Bet:</span>
                        <span className="font-medium text-black">${challenge.maxBet}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reward:</span>
                      <span className="font-medium text-green-600">${challenge.reward.chips}</span>
                    </div>
                  </div>
                  
                  {progress && progress.bestAttempt > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Best Attempt: ${progress.bestAttempt}
                    </div>
                  )}
                  
                  {challenge.allowedActions && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <span className="font-medium">Allowed Actions:</span> {challenge.allowedActions.join(', ')}
                    </div>
                  )}
                  
                  {challenge.specialRules && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs font-medium text-yellow-800">Special Rules:</p>
                      <ul className="text-xs text-yellow-700 mt-1">
                        {challenge.specialRules.map((rule, index) => (
                          <li key={index}>• {rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={() => setSelectedChallenge(challenge)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      View Details
                    </button>
                    {!activeChallenge && (
                      <button
                        onClick={() => handleStartChallenge(challenge.id)}
                        disabled={!isAvailable}
                        className={`px-4 py-2 rounded text-sm ${
                          !isAvailable 
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                            : isCompleted 
                              ? 'bg-green-500 hover:bg-green-600 text-white' 
                              : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }`}
                      >
                        {!isAvailable ? 'Locked' : isCompleted ? 'Retry' : 'Start'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {availableChallenges.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No challenges available yet!</p>
              <p className="text-sm text-gray-400">
                Keep playing to unlock more challenges. Requirements vary by challenge.
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedChallenge && (
        <div className="fixed inset-0 bg-green-900 bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-black">{selectedChallenge.name}</h3>
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3 text-sm">
                <p className="text-gray-700">{selectedChallenge.description}</p>
                
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-2 text-black">Challenge Details:</h4>
                  <ul className="space-y-1 text-xs text-black">
                    <li><strong>Target:</strong> ${selectedChallenge.targetAmount}</li>
                    <li><strong>Starting Chips:</strong> ${selectedChallenge.startingChips}</li>
                    <li><strong>Difficulty:</strong> <span className={getDifficultyColor(selectedChallenge.difficulty)}>{selectedChallenge.difficulty}</span></li>
                    {selectedChallenge.timeLimit && (
                      <li><strong>Time Limit:</strong> {formatTime(selectedChallenge.timeLimit)}</li>
                    )}
                    {selectedChallenge.minBet && (
                      <li><strong>Minimum Bet:</strong> ${selectedChallenge.minBet}</li>
                    )}
                    {selectedChallenge.maxBet && (
                      <li><strong>Maximum Bet:</strong> ${selectedChallenge.maxBet}</li>
                    )}
                  </ul>
                </div>
                
                {selectedChallenge.allowedActions && (
                  <div className="bg-blue-50 p-3 rounded">
                    <h4 className="font-medium mb-2 text-black">Allowed Actions:</h4>
                    <p className="text-xs text-black">{selectedChallenge.allowedActions.join(', ')}</p>
                  </div>
                )}
                
                {selectedChallenge.specialRules && (
                  <div className="bg-yellow-50 p-3 rounded">
                    <h4 className="font-medium mb-2 text-black">Special Rules:</h4>
                    <ul className="text-xs space-y-1 text-black">
                      {selectedChallenge.specialRules.map((rule, index) => (
                        <li key={index}>• {rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="bg-green-50 p-3 rounded">
                  <h4 className="font-medium mb-2 text-black">Reward:</h4>
                  <ul className="text-xs space-y-1 text-black">
                    <li>• ${selectedChallenge.reward.chips} bonus chips</li>
                    {selectedChallenge.reward.achievement && (
                      <li>• &quot;{selectedChallenge.reward.achievement}&quot; achievement</li>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
                {!activeChallenge && (() => {
                  const isAvailable = availableChallenges.some(avail => avail.id === selectedChallenge.id)
                  const isCompleted = completedChallenges.includes(selectedChallenge.id)
                  
                  return (
                    <div className="flex flex-col items-end space-y-2">
                      {!isAvailable && (
                        <div className="text-xs text-red-600 text-right">
                          🔒 {getUnlockRequirementText(selectedChallenge.unlockRequirement)}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          handleStartChallenge(selectedChallenge.id)
                          setSelectedChallenge(null)
                        }}
                        disabled={!isAvailable}
                        className={`px-4 py-2 rounded ${
                          !isAvailable 
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }`}
                      >
                        {!isAvailable ? 'Locked' : isCompleted ? 'Retry Challenge' : 'Start Challenge'}
                      </button>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}