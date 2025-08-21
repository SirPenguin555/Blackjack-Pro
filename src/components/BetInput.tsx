import { useState, useEffect } from 'react'
import { TableLevel } from '@/types/game'
import { TABLE_CONFIGURATIONS } from '@/lib/tableSystem'

interface BetInputProps {
  selectedBet: number
  onBetChange: (amount: number) => void
  playerChips: number
  tableLevel: TableLevel
  disabled?: boolean
  isWinning?: boolean
}

export function BetInput({ 
  selectedBet, 
  onBetChange, 
  playerChips, 
  tableLevel, 
  disabled = false,
  isWinning = false 
}: BetInputProps) {
  const [inputValue, setInputValue] = useState(selectedBet.toString())
  const [error, setError] = useState('')
  const [valueAnimation, setValueAnimation] = useState(false)

  const tableConfig = TABLE_CONFIGURATIONS[tableLevel]
  const minBet = tableLevel === TableLevel.BEGINNER && playerChips < tableConfig.minBet ? 
    Math.min(playerChips, 1) : // Allow $1 minimum or all chips if less than $1
    tableConfig.minBet
  const maxBet = Math.min(tableConfig.maxBet, playerChips)

  // Update input when selectedBet changes externally
  useEffect(() => {
    setInputValue(selectedBet.toString())
  }, [selectedBet])

  // Trigger winning animation when chips are won
  useEffect(() => {
    if (isWinning) {
      triggerValueAnimation()
    }
  }, [isWinning])

  const triggerValueAnimation = () => {
    setValueAnimation(true)
    setTimeout(() => setValueAnimation(false), 400)
  }

  const validateAndSetBet = (value: string) => {
    const num = parseFloat(value)
    
    // Clear error first
    setError('')
    
    // Handle empty or invalid input
    if (value === '' || isNaN(num) || num < 0) {
      onBetChange(0)
      return
    }

    // Round to 2 decimal places and convert to integer cents, then back to dollars
    const roundedNum = Math.round(num * 100) / 100

    // Check if player has enough chips
    if (roundedNum > playerChips) {
      setError(`You only have $${playerChips}`)
      return
    }

    // Special case for beginner table with low chips
    if (tableLevel === TableLevel.BEGINNER && playerChips < tableConfig.minBet) {
      // Allow any bet up to player's total chips
      if (roundedNum <= playerChips && roundedNum > 0) {
        onBetChange(roundedNum)
        triggerValueAnimation()
        return
      }
    }

    // Check minimum bet
    if (roundedNum > 0 && roundedNum < minBet) {
      setError(`Minimum bet is $${minBet}`)
      return
    }

    // Check maximum bet
    if (roundedNum > maxBet) {
      setError(`Maximum bet is $${maxBet}`)
      return
    }

    // Valid bet
    onBetChange(roundedNum)
    triggerValueAnimation()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    validateAndSetBet(value)
  }

  const handleQuickBet = (amount: number) => {
    setInputValue(amount.toString())
    onBetChange(amount)
    triggerValueAnimation()
    setError('')
  }

  const handleAllIn = () => {
    handleQuickBet(playerChips)
  }

  const handleClear = () => {
    setInputValue('0')
    onBetChange(0)
    setError('')
    triggerValueAnimation()
  }

  const canAllIn = playerChips > 0
  const canMinBet = playerChips >= minBet
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className={`text-base sm:text-lg font-semibold text-white ${valueAnimation ? 'animate-valueUpdate' : ''}`}>
        Current Bet: <span className={`text-yellow-400 ${isWinning ? 'animate-winningChips' : ''}`}>${selectedBet}</span>
      </div>
      
      {/* Bet Input */}
      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-white text-sm">$</span>
          <input
            type="number"
            min="0"
            max={maxBet}
            step="0.01"
            value={inputValue}
            onChange={handleInputChange}
            disabled={disabled}
            className="w-24 px-3 py-2 text-center bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-yellow-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="0"
          />
        </div>
        
        {/* Error message */}
        {error && (
          <div className="text-red-400 text-sm font-medium">
            {error}
          </div>
        )}
        
        {/* Bet limits info */}
        <div className="text-gray-400 text-xs text-center">
          {tableLevel === TableLevel.BEGINNER && playerChips < tableConfig.minBet ? (
            <span>All-in allowed (You have ${playerChips})</span>
          ) : (
            <span>Min: ${minBet} | Max: ${maxBet}</span>
          )}
        </div>
      </div>

      {/* Quick bet buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {/* All In button */}
        {canAllIn && (
          <button
            onClick={handleAllIn}
            disabled={disabled}
            className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth active:animate-buttonPress"
          >
            All In (${playerChips})
          </button>
        )}
        
        {/* Minimum bet button */}
        {canMinBet && (
          <button
            onClick={() => handleQuickBet(minBet)}
            disabled={disabled}
            className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth active:animate-buttonPress"
          >
            Min (${minBet})
          </button>
        )}
        
        {/* Half chips button */}
        {playerChips >= 2 && (
          <button
            onClick={() => handleQuickBet(Math.floor(playerChips / 2))}
            disabled={disabled}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth active:animate-buttonPress"
          >
            Half (${Math.floor(playerChips / 2)})
          </button>
        )}
        
        {/* Clear button */}
        <button
          onClick={handleClear}
          disabled={disabled || selectedBet === 0}
          className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth active:animate-buttonPress"
        >
          Clear
        </button>
      </div>
    </div>
  )
}