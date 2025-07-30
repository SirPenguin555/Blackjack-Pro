import { StrategyAdvice } from '@/lib/strategy'

interface StrategyHintProps {
  advice: StrategyAdvice | null
  isVisible: boolean
}

export function StrategyHint({ advice, isVisible }: StrategyHintProps) {
  if (!isVisible || !advice) {
    return null
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 border-green-400 text-green-800'
      case 'medium': return 'bg-yellow-100 border-yellow-400 text-yellow-800'
      case 'low': return 'bg-orange-100 border-orange-400 text-orange-800'
      default: return 'bg-gray-100 border-gray-400 text-gray-800'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'hit': return '👆'
      case 'stand': return '✋'
      case 'double': return '💰'
      case 'split': return '✂️'
      default: return '🤔'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'hit': return 'text-green-600'
      case 'stand': return 'text-blue-600'
      case 'double': return 'text-yellow-600'
      case 'split': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full p-4">
      <div className={`rounded-lg p-4 shadow-lg border-2 ${getConfidenceColor(advice.confidence)}`}>
        {/* Header */}
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">{getActionIcon(advice.action)}</span>
          <div>
            <div className={`font-bold text-lg capitalize ${getActionColor(advice.action)}`}>
              {advice.action}
            </div>
            <div className="text-xs opacity-75 capitalize">
              {advice.confidence} confidence
            </div>
          </div>
        </div>

        {/* Advice Text */}
        <p className="text-sm leading-relaxed">
          {advice.reason}
        </p>

        {/* Helper Text */}
        <div className="mt-2 text-xs opacity-60">
          💡 Strategy suggestion for optimal play
        </div>
      </div>
    </div>
  )
}