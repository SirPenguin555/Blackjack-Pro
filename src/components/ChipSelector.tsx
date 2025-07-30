import { ChipDenomination } from '@/types/game'

interface ChipSelectorProps {
  denominations: ChipDenomination[]
  selectedBet: number
  onBetChange: (amount: number) => void
  maxBet: number
  disabled?: boolean
}

export function ChipSelector({ denominations, selectedBet, onBetChange, maxBet, disabled = false }: ChipSelectorProps) {
  const addToBet = (amount: number) => {
    const newBet = selectedBet + amount
    if (newBet <= maxBet) {
      onBetChange(newBet)
    }
  }

  const clearBet = () => {
    onBetChange(0)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-base sm:text-lg font-semibold">
        Current Bet: <span className="text-yellow-400">${selectedBet}</span>
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
              transition-all duration-200
              hover:scale-110 hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
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
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
    </div>
  )
}