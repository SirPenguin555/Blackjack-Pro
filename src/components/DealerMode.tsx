'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Hand, Card, GameAction } from '@/types/game'
import { createHand, addCardToHand, shouldPlayerHit } from '@/lib/blackjack'
import { createDeck, shuffleDeck, dealCard } from '@/lib/deck'
import { determineWinner } from '@/lib/blackjack'

interface DealerModeProps {
  onExit: () => void
}

interface AIPlayer {
  id: string
  name: string
  chips: number
  hand: Hand
  bet: number
  strategy: 'basic' | 'aggressive' | 'conservative'
  hasBusted: boolean
  hasStood: boolean
}

export default function DealerMode({ onExit }: DealerModeProps) {
  const { stats } = useGameStore()
  const [deck, setDeck] = useState(shuffleDeck(createDeck()))
  const [dealerHand, setDealerHand] = useState<Hand>(createHand())
  const [aiPlayers, setAiPlayers] = useState<AIPlayer[]>([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [phase, setPhase] = useState<'betting' | 'dealing' | 'playing' | 'dealer' | 'finished'>('betting')
  const [round, setRound] = useState(1)
  const [houseChips, setHouseChips] = useState(10000)
  const [gameSpeed, setGameSpeed] = useState<'slow' | 'normal' | 'fast'>('normal')

  // Initialize AI players
  useEffect(() => {
    const players: AIPlayer[] = [
      {
        id: 'ai-1',
        name: 'Sarah',
        chips: 500,
        hand: createHand(),
        bet: 0,
        strategy: 'basic',
        hasBusted: false,
        hasStood: false
      },
      {
        id: 'ai-2', 
        name: 'Mike',
        chips: 750,
        hand: createHand(),
        bet: 0,
        strategy: 'conservative',
        hasBusted: false,
        hasStood: false
      },
      {
        id: 'ai-3',
        name: 'Alex',
        chips: 300,
        hand: createHand(),
        bet: 0,
        strategy: 'aggressive',
        hasBusted: false,
        hasStood: false
      }
    ]
    setAiPlayers(players)
  }, [])

  const getSpeedDelay = () => {
    switch (gameSpeed) {
      case 'slow': return 2000
      case 'fast': return 500
      default: return 1000
    }
  }

  const generateAIBet = (player: AIPlayer): number => {
    const minBet = 5
    const maxBet = Math.min(50, player.chips)
    
    switch (player.strategy) {
      case 'conservative':
        return Math.max(minBet, Math.min(maxBet * 0.1, 10))
      case 'aggressive':
        return Math.max(minBet, Math.min(maxBet * 0.2, 25))
      case 'basic':
      default:
        return Math.max(minBet, Math.min(maxBet * 0.15, 15))
    }
  }

  const startBettingPhase = () => {
    // AI players place bets automatically
    setTimeout(() => {
      setAiPlayers(prev => prev.map(player => {
        const bet = generateAIBet(player)
        return {
          ...player,
          bet,
          chips: player.chips - bet,
          hand: createHand(),
          hasBusted: false,
          hasStood: false
        }
      }))
      setPhase('dealing')
    }, getSpeedDelay())
  }

  const dealInitialCards = () => {
    let currentDeck = [...deck]
    const updatedPlayers = [...aiPlayers]
    let newDealerHand = createHand()

    // Deal first card to each player
    for (let i = 0; i < updatedPlayers.length; i++) {
      const { card, remainingDeck } = dealCard(currentDeck)
      currentDeck = remainingDeck
      updatedPlayers[i].hand = addCardToHand(updatedPlayers[i].hand, card)
    }

    // Deal first card to dealer (face down)
    const { card: dealerCard1, remainingDeck: deck1 } = dealCard(currentDeck)
    currentDeck = deck1
    newDealerHand = addCardToHand(newDealerHand, { ...dealerCard1, hidden: true })

    // Deal second card to each player
    for (let i = 0; i < updatedPlayers.length; i++) {
      const { card, remainingDeck } = dealCard(currentDeck)
      currentDeck = remainingDeck
      updatedPlayers[i].hand = addCardToHand(updatedPlayers[i].hand, card)
    }

    // Deal second card to dealer (face up)
    const { card: dealerCard2, remainingDeck: deck2 } = dealCard(currentDeck)
    currentDeck = deck2
    newDealerHand = addCardToHand(newDealerHand, dealerCard2)

    setDeck(currentDeck)
    setAiPlayers(updatedPlayers)
    setDealerHand(newDealerHand)
    setPhase('playing')
    setCurrentPlayerIndex(0)
  }

  const makeAIDecision = (player: AIPlayer, dealerUpCard: Card): GameAction => {
    const playerValue = player.hand.value
    const dealerUpValue = dealerUpCard.rank === 'A' ? 11 : 
                          ['J', 'Q', 'K'].includes(dealerUpCard.rank) ? 10 : 
                          parseInt(dealerUpCard.rank)

    // Basic strategy decisions based on player strategy
    if (player.strategy === 'aggressive') {
      if (playerValue < 17 && dealerUpValue >= 7) return 'hit'
      if (playerValue <= 11) return 'hit'
      if (playerValue >= 17) return 'stand'
      if (playerValue >= 12 && dealerUpValue <= 6) return 'stand'
      return 'hit'
    } else if (player.strategy === 'conservative') {
      if (playerValue >= 12) return 'stand'
      return 'hit'
    } else {
      // Basic strategy
      if (playerValue >= 17) return 'stand'
      if (playerValue <= 11) return 'hit'
      if (playerValue >= 12 && playerValue <= 16) {
        return dealerUpValue <= 6 ? 'stand' : 'hit'
      }
      return 'hit'
    }
  }

  const processAITurn = () => {
    console.log(`\n=== processAITurn START ===`)
    console.log(`currentPlayerIndex=${currentPlayerIndex}, totalPlayers=${aiPlayers.length}`)
    
    if (currentPlayerIndex >= aiPlayers.length) {
      console.log('All players finished, moving to dealer phase')
      setPhase('dealer')
      setTimeout(() => {
        playDealerHand()
      }, getSpeedDelay())
      return
    }

    const player = aiPlayers[currentPlayerIndex]
    
    console.log(`Processing ${player.name}: busted=${player.hasBusted}, stood=${player.hasStood}, hand value=${player.hand.value}`)
    console.log(`Player hand:`, player.hand.cards.map(c => `${c.rank}${c.suit}`).join(', '))
    
    if (player.hasBusted || player.hasStood) {
      console.log(`${player.name} already finished, skipping to next player`)
      setCurrentPlayerIndex(prev => prev + 1)
      setTimeout(processAITurn, getSpeedDelay() / 2)
      return
    }

    const dealerUpCard = dealerHand.cards.find(card => !card.hidden)!
    const action = makeAIDecision(player, dealerUpCard)

    console.log(`${player.name} (${player.strategy}) has ${player.hand.value}, dealer shows ${dealerUpCard.rank}, decision: ${action}`)

    if (action === 'hit') {
      const { card, remainingDeck } = dealCard(deck)
      const newHand = addCardToHand(player.hand, card)
      const playerBusted = newHand.isBusted
      
      console.log(`${player.name} drew ${card.rank}${card.suit}, new total: ${newHand.value}, busted: ${playerBusted}`)
      
      // Update deck
      setDeck(remainingDeck)
      
      // Update player with new hand - use functional update to avoid stale state
      setAiPlayers(prevPlayers => {
        return prevPlayers.map((p, index) => {
          if (index === currentPlayerIndex) {
            return {
              ...p,
              hand: newHand,
              hasBusted: playerBusted
            }
          }
          return p
        })
      })
      
      // Schedule next action
      setTimeout(() => {
        if (playerBusted) {
          console.log(`${player.name} busted! Advancing to next player`)
          setCurrentPlayerIndex(prev => prev + 1)
        }
        setTimeout(processAITurn, getSpeedDelay() / 2)
      }, getSpeedDelay())
      
    } else if (action === 'stand') {
      console.log(`${player.name} stands with ${player.hand.value}! Advancing to next player`)
      
      // Mark player as stood
      setAiPlayers(prevPlayers => {
        return prevPlayers.map((p, index) => {
          if (index === currentPlayerIndex) {
            return { ...p, hasStood: true }
          }
          return p
        })
      })
      
      // Advance to next player
      setTimeout(() => {
        setCurrentPlayerIndex(prev => prev + 1)
        setTimeout(processAITurn, getSpeedDelay() / 2)
      }, getSpeedDelay())
    }
    
    console.log(`=== processAITurn END ===\n`)
  }

  const playDealerHand = () => {
    console.log('playDealerHand called!')
    console.log('Dealer hand before reveal:', dealerHand)
    
    // Reveal dealer's hidden card
    const revealedHand = createHand(dealerHand.cards.map(card => ({ ...card, hidden: false })))
    console.log('Revealed dealer hand:', revealedHand)
    setDealerHand(revealedHand)

    setTimeout(() => {
      let currentDealerHand = revealedHand
      let currentDeck = [...deck]

      const dealNextCard = () => {
        console.log(`Dealer has ${currentDealerHand.value}, checking if < 17`)
        if (currentDealerHand.value < 17) {
          console.log('Dealer hits (< 17)')
          const { card, remainingDeck } = dealCard(currentDeck)
          currentDeck = remainingDeck
          currentDealerHand = addCardToHand(currentDealerHand, card)
          console.log(`Dealer drew ${card.rank} of ${card.suit}, new total: ${currentDealerHand.value}`)
          setDealerHand(currentDealerHand)
          setDeck(currentDeck)
          
          setTimeout(dealNextCard, getSpeedDelay())
        } else {
          console.log(`Dealer stands on ${currentDealerHand.value}, finishing round`)
          setTimeout(finishRound, getSpeedDelay())
        }
      }

      dealNextCard()
    }, getSpeedDelay())
  }

  const finishRound = () => {
    let totalPayout = 0
    
    const results = aiPlayers.map(player => {
      if (player.hasBusted) {
        // Player busted, house wins
        totalPayout -= player.bet
        return { ...player, result: 'lose', payout: 0 }
      }
      
      const winner = determineWinner(player.hand, dealerHand)
      let payout = 0
      
      if (winner === 'player') {
        if (player.hand.isBlackjack) {
          payout = Math.floor(player.bet * 2.5) // 3:2 payout
        } else {
          payout = player.bet * 2
        }
        totalPayout -= payout
      } else if (winner === 'push') {
        payout = player.bet // Return bet
        totalPayout -= player.bet
      }
      // If dealer wins, no payout (house keeps the bet)
      
      return { ...player, result: winner, payout }
    })

    // Update AI players with winnings
    setAiPlayers(prev => prev.map((player, index) => ({
      ...player,
      chips: player.chips + results[index].payout
    })))

    // Update house chips
    setHouseChips(prev => prev - totalPayout)
    
    setPhase('finished')
  }

  const startNewRound = () => {
    if (deck.length < 20) {
      setDeck(shuffleDeck(createDeck()))
    }
    
    setDealerHand(createHand())
    setCurrentPlayerIndex(0)
    setPhase('betting')
    setRound(prev => prev + 1)
    
    setTimeout(startBettingPhase, 500)
  }

  // Auto-start betting phase
  useEffect(() => {
    if (phase === 'betting' && aiPlayers.length > 0) {
      startBettingPhase()
    }
  }, [phase, aiPlayers.length])

  // Auto-deal cards
  useEffect(() => {
    if (phase === 'dealing') {
      setTimeout(dealInitialCards, getSpeedDelay())
    }
  }, [phase])

  // Auto-process AI turns
  useEffect(() => {
    if (phase === 'playing') {
      setTimeout(processAITurn, getSpeedDelay())
    }
  }, [phase])

  const formatCard = (card: Card) => {
    const suitSymbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    }
    
    if (card.hidden) {
      return '🂠'
    }
    
    return `${card.rank}${suitSymbols[card.suit]}`
  }

  const getCardColor = (card: Card) => {
    if (card.hidden) return 'text-blue-600'
    return card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dealer Mode</h1>
              <p className="text-gray-600">You are the house! Watch AI players and collect their bets.</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-sm text-gray-600">House Bankroll</div>
                  <div className="text-2xl font-bold text-green-600">${houseChips}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Round</div>
                  <div className="text-xl font-bold text-gray-900">{round}</div>
                </div>
                <div className="flex flex-col space-y-2">
                  <select
                    value={gameSpeed}
                    onChange={(e) => setGameSpeed(e.target.value as 'slow' | 'normal' | 'fast')}
                    className="px-3 py-1 border border-gray-300 bg-white text-gray-900 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="slow">Slow</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast</option>
                  </select>
                  <button
                    onClick={onExit}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Exit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Table */}
        <div className="bg-green-900 rounded-lg p-8 shadow-2xl">
          {/* Dealer Area */}
          <div className="text-center mb-8">
            <h2 className="text-white text-xl mb-4">Dealer (You)</h2>
            <div className="flex justify-center space-x-2 mb-2">
              {dealerHand.cards.map((card, index) => (
                <div
                  key={index}
                  className={`w-16 h-24 bg-white rounded-lg flex items-center justify-center text-2xl font-bold border-2 border-gray-300 ${getCardColor(card)}`}
                >
                  {formatCard(card)}
                </div>
              ))}
            </div>
            <div className="text-white text-lg">
              {dealerHand.cards.some(c => c.hidden) ? '?' : `Value: ${dealerHand.value}`}
              {dealerHand.isBusted && <span className="text-red-400 ml-2">BUSTED!</span>}
              {dealerHand.isBlackjack && <span className="text-yellow-400 ml-2">BLACKJACK!</span>}
            </div>
          </div>

          {/* Players Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`bg-white rounded-lg p-4 ${
                  currentPlayerIndex === index && phase === 'playing' 
                    ? 'ring-4 ring-yellow-400' 
                    : ''
                }`}
              >
                <div className="text-center">
                  <h3 className="font-bold text-lg mb-1 text-black">{player.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {player.strategy.charAt(0).toUpperCase() + player.strategy.slice(1)} Player
                  </p>
                  <div className="text-sm mb-3">
                    <span className="text-green-600 font-medium">${player.chips}</span>
                    {player.bet > 0 && (
                      <span className="text-blue-600 ml-2">Bet: ${player.bet}</span>
                    )}
                  </div>
                  
                  {/* Player's Cards */}
                  <div className="flex justify-center space-x-1 mb-2">
                    {player.hand.cards.map((card, cardIndex) => (
                      <div
                        key={cardIndex}
                        className={`w-12 h-16 bg-white rounded border text-sm font-bold flex items-center justify-center ${getCardColor(card)}`}
                      >
                        {formatCard(card)}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-800">
                    {player.hand.cards.length > 0 && (
                      <>
                        <div>Value: {player.hand.value}</div>
                        {player.hasBusted && <div className="text-red-600 font-bold">BUSTED!</div>}
                        {player.hasStood && <div className="text-blue-600 font-bold">STOOD</div>}
                        {player.hand.isBlackjack && <div className="text-yellow-600 font-bold">BLACKJACK!</div>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Game Status */}
          <div className="text-center mt-8">
            <div className="text-white text-xl font-bold mb-4">
              {phase === 'betting' && 'Players are placing bets...'}
              {phase === 'dealing' && 'Dealing cards...'}
              {phase === 'playing' && currentPlayerIndex < aiPlayers.length && aiPlayers[currentPlayerIndex] 
                ? `${aiPlayers[currentPlayerIndex].name}'s turn` 
                : phase === 'playing' ? 'Moving to dealer...' : ''}
              {phase === 'dealer' && 'Dealer playing...'}
              {phase === 'finished' && 'Round finished!'}
            </div>
            
            {phase === 'finished' && (
              <button
                onClick={startNewRound}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
              >
                Next Round
              </button>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">💡 Dealer Mode Tips</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Watch as AI players make decisions based on their strategies</li>
            <li>• Conservative players stand early, aggressive players hit more often</li>
            <li>• As the house, you win when players bust or have lower hands</li>
            <li>• Adjust game speed to your preference using the speed selector</li>
            <li>• Your house bankroll grows when players lose their bets</li>
          </ul>
        </div>
      </div>
    </div>
  )
}