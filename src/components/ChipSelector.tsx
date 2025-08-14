import { ChipDenomination, TableLevel } from '@/types/game'
import { useState, useEffect } from 'react'
import { TABLE_CONFIGURATIONS } from '@/lib/tableSystem'

interface ChipSelectorProps {
  denominations: ChipDenomination[]
  selectedBet: number
  onBetChange: (amount: number) => void
  maxBet: number
  disabled?: boolean
  isWinning?: boolean // Add animation for winning chips
  tableLevel?: TableLevel // Add table level for quick bet buttons
  playerChips?: number // Add player chips for all-in logic
}

export function ChipSelector({ denominations, selectedBet, onBetChange, maxBet, disabled = false, isWinning = false, tableLevel, playerChips }: ChipSelectorProps) {
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

  const setBet = (amount: number) => {
    if (amount <= maxBet) {
      onBetChange(amount)
      triggerValueAnimation()
    }
  }

  const getTableConfig = () => {
    return tableLevel ? TABLE_CONFIGURATIONS[tableLevel] : null
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

      <div className="flex flex-wrap gap-2 justify-center">
        {/* Quick bet buttons based on table level */}
        {(() => {
          const tableConfig = getTableConfig()
          if (!tableConfig) return null
          
          const quickBets = []
          
          // Show All In button if player has less than minimum bet but more than 0 chips
          if (playerChips && playerChips > 0 && playerChips < tableConfig.minBet) {
            quickBets.push(
              <button
                key="all-in"
                onClick={() => setBet(playerChips)}
                disabled={disabled}
                className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth active:animate-buttonPress"
              >
                All In (${playerChips})
              </button>
            )
          } else {
            // Only show minimum bet button if player can afford it
            quickBets.push(
              <button
                key="min-bet"
                onClick={() => setBet(tableConfig.minBet)}
                disabled={disabled || tableConfig.minBet > maxBet}
                className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth active:animate-buttonPress"
              >
                Min (${tableConfig.minBet})
              </button>
            )
          }
          
          // For beginner table, add $1 increment button if not already available as chip
          if (tableLevel === TableLevel.BEGINNER) {
            const hasOneChip = denominations.some(chip => chip.value === 1)
            if (!hasOneChip) {
              quickBets.push(
                <button
                  key="one-dollar"
                  onClick={() => addToBet(1)}
                  disabled={disabled || selectedBet + 1 > maxBet}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth active:animate-buttonPress"
                >
                  +$1
                </button>
              )
            }
          }
          
          return quickBets
        })()}
        
        <button
          onClick={clearBet}
          disabled={disabled || selectedBet === 0}
          className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth active:animate-buttonPress"
        >
          Clear
        </button>
      </div>
    </div>
  )
}