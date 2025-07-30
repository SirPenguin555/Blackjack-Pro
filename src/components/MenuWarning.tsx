interface MenuWarningProps {
  onConfirm: () => void
  onCancel: () => void
}

export function MenuWarning({ onConfirm, onCancel }: MenuWarningProps) {
  return (
    <div className="fixed top-4 left-4 z-50 max-w-sm w-full p-4">
      <div className="bg-white rounded-lg p-6 shadow-xl border-2 border-red-400">
        {/* Warning Header */}
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">⚠️</div>
          <h3 className="text-xl font-bold text-gray-800">Return to Menu?</h3>
        </div>

        {/* Warning Content */}
        <div className="mb-6">
          <p className="text-gray-700 text-center leading-relaxed">
            Going to the menu will end your current hand and count as a <strong className="text-red-600">loss</strong>.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <div className="text-red-800 text-sm text-center">
              Your current bet will be forfeited
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded transition-colors duration-200"
          >
            Stay in Game
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors duration-200"
          >
            Go to Menu
          </button>
        </div>
      </div>
    </div>
  )
}