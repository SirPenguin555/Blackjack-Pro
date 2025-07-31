import { useState } from 'react'
import { playerProfileService } from '@/lib/PlayerProfileService'

interface SaveLoadScreenProps {
  onBack: () => void
  onProfileLoaded: () => void
}

export function SaveLoadScreen({ onBack, onProfileLoaded }: SaveLoadScreenProps) {
  const [saveCode, setSaveCode] = useState('')
  const [loadCode, setLoadCode] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  const handleExport = () => {
    try {
      const exportData = playerProfileService.exportProfile()
      // Generate a shorter, user-friendly save code
      const saveCode = btoa(exportData).replace(/[+/=]/g, match => {
        switch (match) {
          case '+': return '-'
          case '/': return '_'
          case '=': return ''
          default: return match
        }
      })
      
      setSaveCode(saveCode)
      setMessage('Save code generated successfully!')
      setMessageType('success')
    } catch (error) {
      setMessage('Failed to generate save code')
      setMessageType('error')
    }
  }

  const handleImport = () => {
    if (!loadCode.trim()) {
      setMessage('Please enter a save code')
      setMessageType('error')
      return
    }

    try {
      // Convert save code back to JSON
      let jsonData: string
      try {
        // Handle the URL-safe base64 format
        const base64 = loadCode.replace(/[-_]/g, match => {
          switch (match) {
            case '-': return '+'
            case '_': return '/'
            default: return match
          }
        })
        // Add padding if needed
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
        jsonData = atob(padded)
      } catch {
        // If base64 decoding fails, assume it's already JSON
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
    } catch (error) {
      setMessage('Failed to load progress')
      setMessageType('error')
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

        {/* Export Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Save Your Progress</h2>
          <p className="text-gray-600 mb-4">
            Generate a save code to backup your current progress, stats, and unlocked content.
          </p>
          
          <button
            onClick={handleExport}
            className="mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate Save Code
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
            Enter a save code to restore your progress, stats, and unlocked content.
          </p>
          
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
              disabled={!loadCode.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load Progress
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Loading progress will overwrite your current game data</li>
            <li>• Save codes are portable between devices and browsers</li>
            <li>• Keep your save codes private and secure</li>
            <li>• Invalid or corrupted codes will not load</li>
          </ul>
        </div>
      </div>
    </div>
  )
}