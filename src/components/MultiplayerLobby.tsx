'use client'

import { useState, useEffect } from 'react'
import { useMultiplayerStore } from '@/store/multiplayerStore'
import { GameTable, TableSettings } from '@/types/multiplayer'
import { CustomTableSettings } from './CustomTableSettings'

interface MultiplayerLobbyProps {
  onBack: () => void
}

export function MultiplayerLobby({ onBack }: MultiplayerLobbyProps) {
  const {
    connectionStatus,
    availableTables,
    playerName,
    createTable,
    joinTable,
    joinTableByCode,
    findTableByCode,
    setPlayerName,
    setConnectionStatus,
    initialize
  } = useMultiplayerStore()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [showJoinByCodeForm, setShowJoinByCodeForm] = useState(false)
  const [showCustomSettings, setShowCustomSettings] = useState(false)
  const [selectedTable, setSelectedTable] = useState<GameTable | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    tableName: '',
    maxPlayers: 4,
    minBet: 5,
    maxBet: 500,
    isPrivate: false,
    password: ''
  })
  const [customSettings, setCustomSettings] = useState<TableSettings>({
    minBet: 5,
    maxBet: 500,
    startingChips: 1000,
    gameVariant: 'vegas',
    dealerStandsOn17: true,
    doubleAfterSplit: true,
    surrenderAllowed: false,
    insuranceAllowed: true,
    blackjackPayout: 1.5,
    maxSplits: 3,
    doubleOnAnyTwoCards: true,
    doubleAfterSplitAces: false,
    dealerSpeed: 'normal',
    showStrategyHints: false,
    allowSpectators: true,
    playerActionTimeLimit: 30,
    maxGameDuration: 0
  })

  // Sync form data with custom settings
  const handleCustomSettingsChange = (newSettings: TableSettings) => {
    setCustomSettings(newSettings)
    setFormData(prev => ({
      ...prev,
      minBet: newSettings.minBet,
      maxBet: newSettings.maxBet
    }))
  }
  const [tempPlayerName, setTempPlayerName] = useState(playerName)
  const [joinPassword, setJoinPassword] = useState('')
  const [joinByCodeData, setJoinByCodeData] = useState({
    tableCode: '',
    playerName: '',
    password: ''
  })

  // Keep join by code player name in sync
  useEffect(() => {
    setJoinByCodeData(prev => ({ ...prev, playerName: tempPlayerName }))
  }, [tempPlayerName])

  // Initialize authentication for demo purposes
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Dynamically import Firebase only when needed
        const { signInAnonymously } = await import('firebase/auth')
        const { auth } = await import('@/lib/firebase/config')
        
        if (!auth.currentUser) {
          await signInAnonymously(auth)
          console.log('Successfully signed in anonymously')
        }
      } catch (error) {
        console.error('Failed to initialize Firebase:', error)
        // Set connection status to error so user sees appropriate message
        setConnectionStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize multiplayer features')
      }
    }
    
    initAuth()
    initialize()
  }, [initialize])

  const handleCreateTable = async () => {
    if (!formData.tableName.trim() || !tempPlayerName.trim()) return

    setIsLoading(true)
    try {
      setPlayerName(tempPlayerName)
      
      const settings: TableSettings = {
        ...customSettings,
        minBet: formData.minBet,
        maxBet: formData.maxBet
      }

      const tableId = await createTable(
        formData.tableName,
        formData.maxPlayers,
        settings,
        formData.isPrivate,
        formData.password || undefined
      )

      console.log('Table created with ID:', tableId)
      // The component will automatically update when the store state changes
    } catch (error) {
      console.error('Failed to create table:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create table. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinTable = async () => {
    if (!selectedTable || !tempPlayerName.trim()) return

    setIsLoading(true)
    try {
      setPlayerName(tempPlayerName)
      
      await joinTable(
        selectedTable.id,
        tempPlayerName,
        selectedTable.isPrivate ? joinPassword : undefined
      )

      console.log('Joined table:', selectedTable.id)
    } catch (error) {
      console.error('Failed to join table:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to join table. Please try again.')
    } finally {
      setIsLoading(false)
      setShowJoinForm(false)
      setSelectedTable(null)
      setJoinPassword('')
    }
  }

  const handleJoinByCode = async () => {
    if (!joinByCodeData.tableCode.trim() || !joinByCodeData.playerName.trim()) return

    setIsLoading(true)
    try {
      setPlayerName(joinByCodeData.playerName)
      
      await joinTableByCode(
        joinByCodeData.tableCode.toUpperCase(),
        joinByCodeData.playerName,
        joinByCodeData.password || undefined
      )

      console.log('Joined table by code:', joinByCodeData.tableCode)
    } catch (error) {
      console.error('Failed to join table by code:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to join table. Please check the code and try again.')
    } finally {
      setIsLoading(false)
      setShowJoinByCodeForm(false)
      setJoinByCodeData({
        tableCode: '',
        playerName: joinByCodeData.playerName,
        password: ''
      })
    }
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-white rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Connecting to Multiplayer...</h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (connectionStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-red-600 text-center">Multiplayer Not Available</h2>
            
            <div className="mb-6 space-y-3">
              <p className="text-gray-700">
                <strong>Multiplayer features require Firebase setup.</strong>
              </p>
              
              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {errorMessage}
                  </p>
                  {errorMessage.includes('Anonymous authentication is disabled') && (
                    <div className="mt-2 text-sm text-red-700">
                      <p><strong>To fix this:</strong></p>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
                        <li>Select your project → Authentication → Sign-in method</li>
                        <li>Enable "Anonymous" authentication</li>
                        <li>Save and refresh this page</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-sm text-blue-800">
                  <strong>For developers:</strong> To enable multiplayer, you need to:
                </p>
                <ul className="list-disc list-inside mt-2 text-sm text-blue-700 space-y-1">
                  <li>Set up a Firebase project</li>
                  <li>Configure Firebase credentials in environment variables</li>
                  <li>Or run Firebase emulators locally</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
                <p className="text-sm text-gray-700">
                  <strong>For now:</strong> You can still enjoy the single-player game modes with all features including sound effects, tutorials, and strategy hints!
                </p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={onBack}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Back to Single Player
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Multiplayer Lobby</h1>
          <button
            onClick={onBack}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Back to Menu
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{errorMessage}</span>
            <button 
              onClick={() => setErrorMessage('')}
              className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
            {errorMessage.includes('Anonymous authentication is disabled') && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800 font-semibold">Quick Fix:</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Enable Anonymous authentication in your Firebase Console → Authentication → Sign-in method
                </p>
              </div>
            )}
          </div>
        )}

        {/* Player Name Input */}
        <div className="bg-white rounded-lg p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={tempPlayerName}
            onChange={(e) => setTempPlayerName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter your name"
            maxLength={20}
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={!tempPlayerName.trim() || isLoading}
            className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <h3 className="text-xl font-bold mb-2">Create Table</h3>
            <p>Host a new multiplayer game</p>
          </button>
          
          <button
            onClick={() => setShowJoinForm(true)}
            disabled={!tempPlayerName.trim() || isLoading}
            className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <h3 className="text-xl font-bold mb-2">Join Table</h3>
            <p>Join an existing game</p>
          </button>
          
          <button
            onClick={() => setShowJoinByCodeForm(true)}
            disabled={!tempPlayerName.trim() || isLoading}
            className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <h3 className="text-xl font-bold mb-2">Join by Code</h3>
            <p>Enter a 6-character table code</p>
          </button>
        </div>

        {/* Available Tables */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Available Tables</h3>
          {availableTables.length === 0 ? (
            <p className="text-gray-500">No tables available. Create one to get started!</p>
          ) : (
            <div className="space-y-2">
              {availableTables.map((table) => (
                <div
                  key={table.id}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{table.name}</h4>
                    <p className="text-sm text-gray-500">
                      {table.currentPlayers}/{table.maxPlayers} players
                      {table.isPrivate && ' • Private'}
                    </p>
                    <p className="text-xs text-blue-600 font-mono">
                      Code: {table.tableCode}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTable(table)
                      setShowJoinForm(true)
                    }}
                    disabled={table.currentPlayers >= table.maxPlayers || !tempPlayerName.trim()}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Table Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Create New Table</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Name
                  </label>
                  <input
                    type="text"
                    value={formData.tableName}
                    onChange={(e) => setFormData(prev => ({ ...prev, tableName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Enter table name"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Players
                  </label>
                  <select
                    value={formData.maxPlayers}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value={2}>2 Players</option>
                    <option value={3}>3 Players</option>
                    <option value={4}>4 Players</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Bet
                    </label>
                    <input
                      type="number"
                      value={formData.minBet}
                      onChange={(e) => setFormData(prev => ({ ...prev, minBet: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      min={1}
                      max={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Bet
                    </label>
                    <input
                      type="number"
                      value={formData.maxBet}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxBet: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      min={formData.minBet}
                      max={1000}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="private"
                    checked={formData.isPrivate}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="private" className="text-sm font-medium text-gray-700">
                    Private Table
                  </label>
                </div>

                {formData.isPrivate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Enter password"
                    />
                  </div>
                )}
              </div>

              {/* Custom Settings Button */}
              <div className="mt-4">
                <button
                  onClick={() => setShowCustomSettings(true)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                >
                  ⚙️ Advanced Game Rules
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Customize dealer rules, payouts, and more
                </p>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTable}
                  disabled={!formData.tableName.trim() || isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Table'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Table Modal */}
        {showJoinForm && selectedTable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Join Table</h3>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-900">{selectedTable.name}</h4>
                <p className="text-sm text-gray-500">
                  {selectedTable.currentPlayers}/{selectedTable.maxPlayers} players
                </p>
              </div>

              {selectedTable.isPrivate && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Enter table password"
                  />
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowJoinForm(false)
                    setSelectedTable(null)
                    setJoinPassword('')
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinTable}
                  disabled={isLoading || (selectedTable.isPrivate && !joinPassword.trim())}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Joining...' : 'Join Table'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join by Code Modal */}
        {showJoinByCodeForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Join Table by Code</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Code
                  </label>
                  <input
                    type="text"
                    value={joinByCodeData.tableCode}
                    onChange={(e) => setJoinByCodeData(prev => ({ 
                      ...prev, 
                      tableCode: e.target.value.toUpperCase().slice(0, 6) 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-center text-lg tracking-widest text-gray-900"
                    placeholder="ABC123"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the 6-character code shared by the host</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={joinByCodeData.playerName}
                    onChange={(e) => setJoinByCodeData(prev => ({ ...prev, playerName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    placeholder="Enter your name"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password (if private)
                  </label>
                  <input
                    type="password"
                    value={joinByCodeData.password}
                    onChange={(e) => setJoinByCodeData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    placeholder="Leave blank if not required"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowJoinByCodeForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinByCode}
                  disabled={isLoading || !joinByCodeData.tableCode.trim() || !joinByCodeData.playerName.trim()}
                  className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Joining...' : 'Join Table'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Settings Modal */}
        {showCustomSettings && (
          <CustomTableSettings
            settings={customSettings}
            onSettingsChange={handleCustomSettingsChange}
            onClose={() => setShowCustomSettings(false)}
            onSave={() => setShowCustomSettings(false)}
          />
        )}
      </div>
    </div>
  )
}