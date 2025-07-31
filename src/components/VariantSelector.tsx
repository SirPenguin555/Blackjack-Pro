import React from 'react'
import { GameVariant, RULE_CONFIGURATIONS } from '@/lib/ruleVariations'

interface VariantSelectorProps {
  currentVariant: GameVariant
  onVariantSelect: (variant: GameVariant) => void
  onClose: () => void
}

const getVariantIcon = (variant: GameVariant) => {
  switch (variant) {
    case GameVariant.VEGAS:
      return '🎰'
    case GameVariant.EUROPEAN:
      return '🏛️'
    case GameVariant.ATLANTIC_CITY:
      return '🏙️'
    default:
      return '🃏'
  }
}

const getVariantColor = (variant: GameVariant) => {
  switch (variant) {
    case GameVariant.VEGAS:
      return 'from-red-800 to-red-900 border-red-600'
    case GameVariant.EUROPEAN:
      return 'from-blue-800 to-blue-900 border-blue-600'
    case GameVariant.ATLANTIC_CITY:
      return 'from-purple-800 to-purple-900 border-purple-600'
    default:
      return 'from-gray-800 to-gray-900 border-gray-600'
  }
}

export function VariantSelector({ 
  currentVariant, 
  onVariantSelect, 
  onClose 
}: VariantSelectorProps) {
  const variants = [GameVariant.VEGAS, GameVariant.EUROPEAN, GameVariant.ATLANTIC_CITY]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-green-900 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Select Game Variant</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-400 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {variants.map((variant) => {
            const config = RULE_CONFIGURATIONS[variant]
            const isCurrentVariant = variant === currentVariant
            const colorClasses = getVariantColor(variant)

            return (
              <div
                key={variant}
                className={`
                  bg-gradient-to-br ${colorClasses}
                  border-2 rounded-lg p-6 transition-all duration-200
                  hover:scale-105 cursor-pointer
                  ${isCurrentVariant ? 'ring-4 ring-yellow-400' : ''}
                `}
                onClick={() => onVariantSelect(variant)}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">
                    {getVariantIcon(variant)}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">
                    {config.name}
                    {isCurrentVariant && (
                      <span className="ml-2 text-yellow-400 text-sm">(Current)</span>
                    )}
                  </h3>
                  
                  <p className="text-sm text-gray-200 mb-4">
                    {config.description}
                  </p>

                  {/* Key Rules */}
                  <div className="space-y-2 text-xs text-left">
                    <div className="bg-black bg-opacity-30 rounded p-3">
                      <h4 className="text-white font-semibold mb-2">Key Rules:</h4>
                      
                      <div className="space-y-1 text-gray-300">
                        <div className="flex justify-between">
                          <span>Dealer hits soft 17:</span>
                          <span className={config.dealerHitsSoft17 ? 'text-red-300' : 'text-green-300'}>
                            {config.dealerHitsSoft17 ? 'Yes' : 'No'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Dealer peeks:</span>
                          <span className={config.dealerPeeksForBlackjack ? 'text-green-300' : 'text-red-300'}>
                            {config.dealerPeeksForBlackjack ? 'Yes' : 'No'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Double after split:</span>
                          <span className={config.doubleAfterSplit ? 'text-green-300' : 'text-red-300'}>
                            {config.doubleAfterSplit ? 'Yes' : 'No'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Surrender:</span>
                          <span className={config.surrenderAllowed ? 'text-green-300' : 'text-red-300'}>
                            {config.surrenderAllowed ? 'Yes' : 'No'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Blackjack payout:</span>
                          <span className="text-white">
                            {config.blackjackPayout === 1.5 ? '3:2' : 
                             config.blackjackPayout === 1.2 ? '6:5' : 
                             `${config.blackjackPayout}:1`}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Number of decks:</span>
                          <span className="text-white">{config.numberOfDecks}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strategy Note */}
                  <div className="mt-3 p-2 bg-yellow-900 bg-opacity-50 rounded text-xs text-yellow-200">
                    {variant === GameVariant.VEGAS && "Most aggressive rules favor the house"}
                    {variant === GameVariant.EUROPEAN && "Conservative rules with no hole card"}
                    {variant === GameVariant.ATLANTIC_CITY && "Player-friendly with surrender option"}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 p-4 bg-black bg-opacity-30 rounded-lg">
          <h3 className="text-white font-bold mb-2">About Game Variants</h3>
          <p className="text-sm text-gray-300">
            Each variant offers different rules that affect basic strategy. The strategy hints in Easy Mode 
            will automatically adjust based on your selected variant. Choose the variant that matches your 
            preferred playing style or the rules you want to practice for real casino play.
          </p>
        </div>
      </div>
    </div>
  )
}