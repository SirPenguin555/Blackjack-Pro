import { ChipDenomination } from '@/types/game'
import { useState, useEffect } from 'react'

interface ChipSelectorProps {
  denominations: ChipDenomination[]
  selectedBet: number
  onBetChange: (amount: number) => void
  maxBet: number
  disabled?: boolean
  isWinning?: boolean // Add animation for winning chips
}

export function ChipSelector({ denominations, selectedBet, onBetChange, maxBet, disabled = false, isWinning = false }: ChipSelectorProps) {
  const [animatingChips, setAnimatingChips] = useState<Set<number>>(new Set())
  const [valueAnimation, setValueAnimation] = useState(false)

  const addToBet = (amount: number) => {
    const newBet = selectedBet + amount
    if (newBet <= maxBet) {
      // Trigger chip animation
      setAnimatingChips(prev => new Set(prev).add(amount))
      setTimeout(() => {
        setAnimatingChips(prev => {
          const next = new Set(prev)
          next.delete(amount)
          return next
        })
      }, 400)
      
      onBetChange(newBet)
      triggerValueAnimation()
    }
  }

  const clearBet = () => {
    onBetChange(0)
    triggerValueAnimation()
  }

  const triggerValueAnimation = () => {
    setValueAnimation(true)
    setTimeout(() => setValueAnimation(false), 400)
  }

  // Trigger winning animation when chips are won
  useEffect(() => {
    if (isWinning) {
      triggerValueAnimation()
    }
  }, [isWinning])

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className={`text-base sm:text-lg font-semibold text-white ${valueAnimation ? 'animate-valueUpdate' : ''}`}>
        Current Bet: <span className={`text-yellow-400 ${isWinning ? 'animate-winningChips' : ''}`}>${selectedBet}</span>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        {denominations.map((chip) => (
          <button
            key={chip.value}
            onClick={() => addToBet(chip.value)}
            disabled={disabled || selectedBet + chip.value > maxBet}
            className={`
              w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white shadow-lg
              flex flex-col items-center justify-center
              text-xs font-bold
              transition-smooth
              hover:scale-110 hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              active:animate-buttonPress
              ${animatingChips.has(chip.value) ? 'animate-chipStack' : ''}
              ${chip.color}
            `}
          >
            <span className="text-xs sm:text-sm">{chip.label}</span>
          </button>
        ))}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={clearBet}
          disabled={disabled || selectedBet === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth active:animate-buttonPress"
        >
          Clear
        </button>
      </div>
    </div>
  )
}