import { useState, useEffect } from 'react'
import { playerProfileService } from '@/lib/PlayerProfileService'
import { authService, AuthUser } from '@/lib/supabase/auth'
import { gameDataService } from '@/lib/supabase/gameDataService'

interface SaveLoadScreenProps {
  onBack: () => void
  onProfileLoaded: () => void
}

export function SaveLoadScreen({ onBack, onProfileLoaded }: SaveLoadScreenProps) {
  const [saveCode, setSaveCode] = useState('')
  const [loadCode, setLoadCode] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
  }, [])

  const handleExport = async () => {
    setIsLoading(true)
    try {
      let exportData: string
      let saveCode: string

      if (user) {
        // Export from account data
        const result = await gameDataService.exportAccountAsSaveCode(user.id)
        if (result.success && result.saveCode) {
          saveCode = result.saveCode.replace(/[+/=]/g, match => {
            switch (match) {
              case '+': return '-'
              case '/': return '_'
              case '=': return ''
              default: return match
            }
          })
        } else {
          throw new Error(result.error || 'Failed to export account data')
        }
      } else {
        // Export from localStorage (original functionality)
        exportData = playerProfileService.exportProfile()
        saveCode = btoa(exportData).replace(/[+/=]/g, match => {
          switch (match) {
            case '+': return '-'
            case '/': return '_'
            case '=': return ''
            default: return match
          }
        })
      }
      
      setSaveCode(saveCode)
      setMessage('Save code generated successfully!')
      setMessageType('success')
    } catch (error: any) {
      setMessage(error.message || 'Failed to generate save code')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!loadCode.trim()) {
      setMessage('Please enter a save code')
      setMessageType('error')
      return
    }

    if (user && !showOverwriteWarning) {
      setShowOverwriteWarning(true)
      return
    }

    setIsLoading(true)
    try {
      // Convert save code back to original format
      const base64 = loadCode.replace(/[-_]/g, match => {
        switch (match) {
          case '-': return '+'
          case '_': return '/'
          default: return match
        }
      })
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)

      if (user) {
        // Import to account
        const result = await gameDataService.importSaveCodeToAccount(user.id, padded, true)
        if (result.success) {
          setMessage('Progress imported to your account successfully!')
          setMessageType('success')
          setTimeout(() => {
            onProfileLoaded()
          }, 1500)
        } else {
          throw new Error(result.error || 'Failed to import to account')
        }
      } else {
        // Import to localStorage (original functionality)
        let jsonData: string
        try {
          jsonData = atob(padded)
        } catch {
          jsonData = loadCode
        }

        const success = playerProfileService.importProfile(jsonData)
        if (success) {
          setMessage('Progress loaded successfully!')
          setMessageType('success')
          setTimeout(() => {
            onProfileLoaded()
          }, 1500)
        } else {
          setMessage('Invalid save code or data')
          setMessageType('error')
        }
      }
    } catch (error: any) {
      setMessage(error.message || 'Failed to load progress')
      setMessageType('error')
    } finally {
      setIsLoading(false)
      setShowOverwriteWarning(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(saveCode)
      setMessage('Save code copied to clipboard!')
      setMessageType('success')
    } catch (error) {
      setMessage('Failed to copy to clipboard')
      setMessageType('error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Save & Load Progress</h1>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Back
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Account Info */}
        {user && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">👤 Account Data</h3>
            <p className="text-sm text-blue-800">
              You're signed in as <strong>{user.profile?.username}</strong>. Your progress is automatically saved to your account.
              Save codes can still be used for backup or sharing progress.
            </p>
          </div>
        )}

        {/* Export Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Save Your Progress</h2>
          <p className="text-gray-600 mb-4">
            {user 
              ? 'Generate a save code to backup your account data or share with other devices.'
              : 'Generate a save code to backup your current progress, stats, and unlocked content.'
            }
          </p>
          
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating...' : 'Generate Save Code'}
          </button>

          {saveCode && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Your Save Code:</label>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Copy
                </button>
              </div>
              <textarea
                value={saveCode}
                readOnly
                className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none"
                onClick={(e) => e.currentTarget.select()}
              />
              <p className="text-xs text-gray-500 mt-2">
                Keep this code safe! You can use it to restore your progress on any device.
              </p>
            </div>
          )}
        </div>

        {/* Import Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Load Your Progress</h2>
          <p className="text-gray-600 mb-4">
            {user 
              ? 'Enter a save code to import data into your account. This will overwrite your current account data.'
              : 'Enter a save code to restore your progress, stats, and unlocked content.'
            }
          </p>

          {user && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Warning:</strong> Importing a save code will completely replace all data in your account.
                This action cannot be undone.
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Save Code:
              </label>
              <textarea
                value={loadCode}
                onChange={(e) => setLoadCode(e.target.value)}
                placeholder="Paste your save code here..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none"
              />
            </div>
            
            <button
              onClick={handleImport}
              disabled={!loadCode.trim() || isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : (showOverwriteWarning ? 'Confirm Import' : 'Load Progress')}
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• {user ? 'Loading progress will overwrite your account data' : 'Loading progress will overwrite your current game data'}</li>
            <li>• Save codes are portable between devices and browsers</li>
            <li>• {user ? 'Account data is automatically saved' : 'Keep your save codes private and secure'}</li>
            <li>• Invalid or corrupted codes will not load</li>
          </ul>
        </div>

        {/* Overwrite Warning Modal */}
        {showOverwriteWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Confirm Data Overwrite</h3>
              <p className="text-gray-700 mb-6">
                This action will <strong>completely replace</strong> all data in your account including:
              </p>
              <ul className="text-sm text-gray-600 mb-6 space-y-1">
                <li>• Current chip balance and progress</li>
                <li>• All statistics and achievements</li>
                <li>• Unlocked tables and variants</li>
                <li>• Tutorial progress</li>
              </ul>
              <p className="text-red-600 font-semibold mb-6">
                This action cannot be undone!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowOverwriteWarning(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Confirm Overwrite
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}