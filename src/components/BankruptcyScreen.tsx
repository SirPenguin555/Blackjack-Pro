interface BankruptcyScreenProps {
  onReset: () => void
  onLoan: () => void
}

export function BankruptcyScreen({ onReset, onLoan }: BankruptcyScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Bankruptcy Card */}
        <div className="bg-red-800 bg-opacity-90 rounded-lg p-8 shadow-xl border-2 border-red-600">
          {/* Bankruptcy Icon */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">💸</div>
            <h2 className="text-3xl font-bold text-white mb-2">Bankrupt!</h2>
            <p className="text-red-200">You're out of chips</p>
          </div>

          {/* Message */}
          <div className="bg-red-900 bg-opacity-50 rounded-lg p-4 mb-6">
            <div className="text-white text-center">
              <p className="mb-2">Don't worry, it happens to the best of us!</p>
              <p className="text-sm text-red-200">Choose how you'd like to continue:</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onLoan}
              className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-black font-bold rounded-lg transition-colors duration-200"
            >
              <div className="text-lg">💰 Take a $100 Loan</div>
              <div className="text-sm opacity-80">Continue playing with borrowed chips</div>
            </button>
            
            <button
              onClick={onReset}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-200"
            >
              <div className="text-lg">🔄 Start Fresh</div>
              <div className="text-sm opacity-90">Reset everything and start over</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}