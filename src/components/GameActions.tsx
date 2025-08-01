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
  const canSurrender = player.canSurrender
  const canInsurance = player.canInsurance && player.chips >= Math.floor(player.bet / 2)

  const buttonBaseClasses = "px-3 py-2 sm:px-4 text-sm sm:text-base rounded transition-smooth active:animate-buttonPress disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <button
        onClick={() => onAction('hit')}
        disabled={disabled || !canHit}
        className={`${buttonBaseClasses} bg-green-600 text-white hover:bg-green-700`}
      >
        🃏 Hit
      </button>
      
      <button
        onClick={() => onAction('stand')}
        disabled={disabled || !canStand}
        className={`${buttonBaseClasses} bg-blue-600 text-white hover:bg-blue-700`}
      >
        ✋ Stand
      </button>
      
      {canDouble && (
        <button
          onClick={() => onAction('double')}
          disabled={disabled}
          className={`${buttonBaseClasses} bg-yellow-500 text-black hover:bg-yellow-600`}
        >
          ⚡ Double
        </button>
      )}
      
      {canSplit && (
        <button
          onClick={() => onAction('split')}
          disabled={disabled}
          className={`${buttonBaseClasses} bg-yellow-600 text-black hover:bg-yellow-700`}
        >
          ✂️ Split
        </button>
      )}
      
      {canSurrender && (
        <button
          onClick={() => onAction('surrender')}
          disabled={disabled}
          className={`${buttonBaseClasses} bg-red-600 text-white hover:bg-red-700`}
        >
          🏳️ Surrender
        </button>
      )}
      
      {canInsurance && (
        <button
          onClick={() => onAction('insurance')}
          disabled={disabled}
          className={`${buttonBaseClasses} bg-purple-600 text-white hover:bg-purple-700`}
        >
          🛡️ Insurance
        </button>
      )}
    </div>
  )
}