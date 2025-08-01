import { Card as CardType } from '@/types/game'
import { useState, useEffect } from 'react'

interface CardProps {
  card: CardType
  className?: string
  dealDelay?: number // Delay in ms before card appears (for dealing animation)
  isNewCard?: boolean // Whether this is a freshly dealt card
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
}

const suitColors = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-black',
  spades: 'text-black'
}

export function Card({ card, className = '', dealDelay = 0, isNewCard = false }: CardProps) {
  const [isVisible, setIsVisible] = useState(!isNewCard)
  const [isFlipping, setIsFlipping] = useState(false)

  // Handle dealing animation
  useEffect(() => {
    if (isNewCard && dealDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, dealDelay)
      return () => clearTimeout(timer)
    } else if (isNewCard) {
      setIsVisible(true)
    }
  }, [isNewCard, dealDelay])

  // Handle card flip animation when hidden property changes
  useEffect(() => {
    if (!card.hidden && isVisible) {
      setIsFlipping(true)
      const timer = setTimeout(() => setIsFlipping(false), 600)
      return () => clearTimeout(timer)
    }
  }, [card.hidden, isVisible])

  if (!isVisible) {
    return (
      <div className={`w-12 h-18 sm:w-16 sm:h-24 ${className}`}>
        {/* Placeholder space for card */}
      </div>
    )
  }

  const cardClasses = `
    w-12 h-18 sm:w-16 sm:h-24 
    border border-gray-300 rounded-lg shadow-md flex flex-col justify-between p-1
    transition-all duration-500 ease-in-out
    ${isNewCard ? 'animate-slideInFromTop' : ''}
    ${isFlipping ? 'animate-flipCard' : ''}
    ${className}
  `

  if (card.hidden) {
    return (
      <div className={`${cardClasses} bg-blue-800 border-blue-900 flex items-center justify-center`}>
        <div className="w-8 h-12 sm:w-12 sm:h-20 bg-blue-600 rounded border-2 border-blue-400 flex items-center justify-center">
          <div className="text-white text-xs font-bold">🂠</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${cardClasses} bg-white hover:shadow-lg hover:scale-105`}>
      <div className={`text-xs font-bold ${suitColors[card.suit]} flex flex-col items-center`}>
        <span>{card.rank}</span>
        <span>{suitSymbols[card.suit]}</span>
      </div>
      <div className={`text-lg ${suitColors[card.suit]} self-center`}>
        {suitSymbols[card.suit]}
      </div>
      <div className={`text-xs font-bold ${suitColors[card.suit]} flex flex-col items-center rotate-180`}>
        <span>{card.rank}</span>
        <span>{suitSymbols[card.suit]}</span>
      </div>
    </div>
  )
}