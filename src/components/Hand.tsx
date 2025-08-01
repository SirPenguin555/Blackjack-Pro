import { Hand as HandType } from '@/types/game'
import { Card } from './Card'
import { useState, useEffect } from 'react'

interface HandProps {
  hand: HandType
  label: string
  className?: string
  isDealing?: boolean // Whether cards are being dealt
  dealingSpeed?: number // Speed of dealing animation in ms
}

export function Hand({ hand, label, className = '', isDealing = false, dealingSpeed = 500 }: HandProps) {
  // Check if any cards are hidden (for dealer's hole card)
  const hasHiddenCards = hand.cards.some(card => card.hidden)
  const [previousCardCount, setPreviousCardCount] = useState(hand.cards.length)
  const [valueChanged, setValueChanged] = useState(false)

  // Track when new cards are dealt
  useEffect(() => {
    if (hand.cards.length > previousCardCount) {
      setPreviousCardCount(hand.cards.length)
    }
  }, [hand.cards.length, previousCardCount])

  // Animate value changes
  useEffect(() => {
    if (!hasHiddenCards && hand.value !== undefined) {
      setValueChanged(true)
      const timer = setTimeout(() => setValueChanged(false), 400)
      return () => clearTimeout(timer)
    }
  }, [hand.value, hasHiddenCards])
  
  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      <div className="flex space-x-2">
        {hand.cards.map((card, index) => {
          const isNewCard = index >= previousCardCount - 1 && isDealing
          const dealDelay = isNewCard ? index * dealingSpeed : 0
          
          return (
            <Card 
              key={`${card.suit}-${card.rank}-${index}`} 
              card={card} 
              isNewCard={isNewCard}
              dealDelay={dealDelay}
            />
          )
        })}
      </div>
      <div className="text-center">
        {!hasHiddenCards && (
          <div className={`text-sm text-gray-800 transition-smooth ${valueChanged ? 'animate-valueUpdate' : ''}`}>
            Value: {hand.value}
            {hand.isSoft && <span className=" text-blue-600"> (Soft)</span>}
          </div>
        )}
        {hand.isBlackjack && !hasHiddenCards && (
          <div className="text-sm font-bold text-yellow-600 animate-slideInUp">Blackjack!</div>
        )}
        {hand.isBusted && (
          <div className="text-sm font-bold text-red-600 animate-slideInUp">Busted!</div>
        )}
      </div>
    </div>
  )
}