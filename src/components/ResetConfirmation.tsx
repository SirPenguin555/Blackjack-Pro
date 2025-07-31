interface ResetConfirmationProps {
  onConfirm: () => void
  onCancel: () => void
}

export function ResetConfirmation({ onConfirm, onCancel }: ResetConfirmationProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Warning Card */}
        <div className="bg-red-800 bg-opacity-90 rounded-lg p-8 shadow-xl border-2 border-red-600">
          {/* Warning Icon */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Reset Progress</h2>
            <p className="text-red-200">This action cannot be undone!</p>
          </div>

          {/* Warning Details */}
          <div className="bg-red-900 bg-opacity-50 rounded-lg p-4 mb-6">
            <div className="text-white text-sm">
              <div className="mb-2 font-semibold">This will reset:</div>
              <ul className="space-y-1 ml-4">
                <li>• All statistics (wins, losses, games played)</li>
                <li>• Your chip balance back to $250</li>
                <li>• All achievements and progress</li>
                <li>• Current game progress</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Reset Everything
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}