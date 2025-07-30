import { Card as CardType } from '@/types/game'

interface CardProps {
  card: CardType
  className?: string
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

export function Card({ card, className = '' }: CardProps) {
  if (card.hidden) {
    return (
      <div className={`w-12 h-18 sm:w-16 sm:h-24 bg-blue-800 border border-blue-900 rounded-lg flex items-center justify-center shadow-md ${className}`}>
        <div className="w-8 h-12 sm:w-12 sm:h-20 bg-blue-600 rounded border-2 border-blue-400 flex items-center justify-center">
          <div className="text-white text-xs font-bold">🂠</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-12 h-18 sm:w-16 sm:h-24 bg-white border border-gray-300 rounded-lg shadow-md flex flex-col justify-between p-1 ${className}`}>
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