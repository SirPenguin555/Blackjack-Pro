import { Hand as HandType } from '@/types/game'
import { Card } from './Card'

interface HandProps {
  hand: HandType
  label: string
  className?: string
}

export function Hand({ hand, label, className = '' }: HandProps) {
  // Check if any cards are hidden (for dealer's hole card)
  const hasHiddenCards = hand.cards.some(card => card.hidden)
  
  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      <div className="flex space-x-2">
        {hand.cards.map((card, index) => (
          <Card key={index} card={card} />
        ))}
      </div>
      <div className="text-center">
        {!hasHiddenCards && (
          <div className="text-sm text-gray-800">
            Value: {hand.value}
            {hand.isSoft && <span className=" text-blue-600"> (Soft)</span>}
          </div>
        )}
        {hand.isBlackjack && !hasHiddenCards && (
          <div className="text-sm font-bold text-yellow-600">Blackjack!</div>
        )}
        {hand.isBusted && (
          <div className="text-sm font-bold text-red-600">Busted!</div>
        )}
      </div>
    </div>
  )
}