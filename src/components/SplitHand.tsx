import { Hand as HandType } from '@/types/game'
import { Hand } from './Hand'

interface SplitHandProps {
  mainHand: HandType
  splitHand?: HandType
  label: string
  className?: string
  isPlayingMainHand?: boolean
}

export function SplitHand({ mainHand, splitHand, label, className = '', isPlayingMainHand = true }: SplitHandProps) {
  if (!splitHand) {
    // No split hand, display normally
    return (
      <Hand 
        hand={mainHand} 
        label={label}
        className={className}
      />
    )
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white">{label}</h3>
      
      <div className="flex space-x-8 justify-center">
        {/* Main Hand */}
        <div className={`flex flex-col items-center space-y-2 ${
          isPlayingMainHand ? 'ring-2 ring-yellow-400 ring-opacity-75 rounded-lg p-2' : ''
        }`}>
          <div className="text-sm font-medium text-white">
            Hand 1 {isPlayingMainHand ? '(Active)' : ''}
          </div>
          <div className="flex space-x-2">
            {mainHand.cards.map((card, index) => (
              <div key={index} className="transform scale-90">
                <div className={`w-16 h-24 rounded-lg border-2 ${
                  card.hidden ? 'bg-blue-800 border-blue-600' : 'bg-white border-gray-400'
                } flex flex-col items-center justify-center shadow-md`}>
                  {!card.hidden && (
                    <>
                      <div className={`text-lg font-bold ${
                        card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
                      }`}>
                        {card.rank}
                      </div>
                      <div className={`text-xl ${
                        card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
                      }`}>
                        {card.suit === 'hearts' ? '♥' : 
                         card.suit === 'diamonds' ? '♦' : 
                         card.suit === 'clubs' ? '♣' : '♠'}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <div className="text-sm text-white">
              Value: {mainHand.value}
              {mainHand.isSoft && <span className="text-blue-300"> (Soft)</span>}
            </div>
            {mainHand.isBlackjack && (
              <div className="text-sm font-bold text-yellow-600">Blackjack!</div>
            )}
            {mainHand.isBusted && (
              <div className="text-sm font-bold text-red-600">Busted!</div>
            )}
          </div>
        </div>

        {/* Split Hand */}
        <div className={`flex flex-col items-center space-y-2 ${
          !isPlayingMainHand ? 'ring-2 ring-yellow-400 ring-opacity-75 rounded-lg p-2' : ''
        }`}>
          <div className="text-sm font-medium text-white">
            Hand 2 {!isPlayingMainHand ? '(Active)' : ''}
          </div>
          <div className="flex space-x-2">
            {splitHand.cards.map((card, index) => (
              <div key={index} className="transform scale-90">
                <div className={`w-16 h-24 rounded-lg border-2 ${
                  card.hidden ? 'bg-blue-800 border-blue-600' : 'bg-white border-gray-400'
                } flex flex-col items-center justify-center shadow-md`}>
                  {!card.hidden && (
                    <>
                      <div className={`text-lg font-bold ${
                        card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
                      }`}>
                        {card.rank}
                      </div>
                      <div className={`text-xl ${
                        card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
                      }`}>
                        {card.suit === 'hearts' ? '♥' : 
                         card.suit === 'diamonds' ? '♦' : 
                         card.suit === 'clubs' ? '♣' : '♠'}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <div className="text-sm text-white">
              Value: {splitHand.value}
              {splitHand.isSoft && <span className="text-blue-300"> (Soft)</span>}
            </div>
            {splitHand.isBlackjack && (
              <div className="text-sm font-bold text-yellow-600">Blackjack!</div>
            )}
            {splitHand.isBusted && (
              <div className="text-sm font-bold text-red-600">Busted!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}