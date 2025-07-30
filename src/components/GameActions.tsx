import { Player, GameAction } from '@/types/game'

interface GameActionsProps {
  player: Player
  onAction: (action: GameAction) => void
  disabled?: boolean
}

export function GameActions({ player, onAction, disabled = false }: GameActionsProps) {
  const canHit = !player.hand.isBusted && !player.hand.isBlackjack
  const canStand = !player.hand.isBusted
  const canDouble = player.canDouble && player.chips >= player.bet
  const canSplit = player.canSplit && player.chips >= player.bet

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <button
        onClick={() => onAction('hit')}
        disabled={disabled || !canHit}
        className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Hit
      </button>
      
      <button
        onClick={() => onAction('stand')}
        disabled={disabled || !canStand}
        className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Stand
      </button>
      
      {canDouble && (
        <button
          onClick={() => onAction('double')}
          disabled={disabled}
          className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-yellow-500 text-black rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Double
        </button>
      )}
      
      {canSplit && (
        <button
          onClick={() => onAction('split')}
          disabled={disabled}
          className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-yellow-600 text-black rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Split
        </button>
      )}
    </div>
  )
}