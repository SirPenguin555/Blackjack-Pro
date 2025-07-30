import { TutorialStep } from '@/types/tutorial'

interface TutorialOverlayProps {
  step: TutorialStep
  onNext: () => void
  onSkip: () => void
  canAdvance: boolean
}

export function TutorialOverlay({ step, onNext, onSkip, canAdvance }: TutorialOverlayProps) {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full p-4">
      <div className="bg-white rounded-lg p-6 shadow-xl border-2 border-yellow-400">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{step.title}</h3>
          <button
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Skip Tutorial
          </button>
        </div>

        {/* Content */}
        <p className="text-gray-700 mb-6 leading-relaxed">
          {step.content}
        </p>

        {/* Action Instruction */}
        {step.action && !step.autoAdvance && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="text-blue-800 text-sm font-semibold">
              {step.action === 'bet' && '👆 Click on chips below to place your bet'}
              {step.action === 'deal' && '👆 Click "Deal Cards" to start the hand'}
              {step.action === 'hit' && '👆 Click "Hit" or "Stand" to play your hand'}
              {step.action === 'observe' && '👀 Watch the dealer play their hand'}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <div></div> {/* Spacer */}
          
          <button
            onClick={onNext}
            disabled={!canAdvance}
            className={`px-4 py-2 rounded font-semibold ${
              canAdvance
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {step.action ? 'Continue' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}