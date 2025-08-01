'use client'

import { useState } from 'react'
import { TableSettings } from '@/types/multiplayer'

interface CustomTableSettingsProps {
  settings: TableSettings
  onSettingsChange: (settings: TableSettings) => void
  onClose: () => void
  onSave: () => void
}

export function CustomTableSettings({
  settings,
  onSettingsChange,
  onClose,
  onSave
}: CustomTableSettingsProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'rules' | 'experience'>('basic')

  const updateSetting = <K extends keyof TableSettings>(
    key: K,
    value: TableSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value
    })
  }

  const loadPreset = (variant: 'vegas' | 'european' | 'atlantic_city') => {
    const presets: Record<string, Partial<TableSettings>> = {
      vegas: {
        gameVariant: 'vegas',
        dealerStandsOn17: true,
        doubleAfterSplit: true,
        surrenderAllowed: false,
        insuranceAllowed: true,
        blackjackPayout: 1.5,
        maxSplits: 3,
        doubleOnAnyTwoCards: true,
        doubleAfterSplitAces: false
      },
      european: {
        gameVariant: 'european',
        dealerStandsOn17: true,
        doubleAfterSplit: true,
        surrenderAllowed: false,
        insuranceAllowed: false,
        blackjackPayout: 1.5,
        maxSplits: 1,
        doubleOnAnyTwoCards: false,
        doubleAfterSplitAces: false
      },
      atlantic_city: {
        gameVariant: 'atlantic_city',
        dealerStandsOn17: true,
        doubleAfterSplit: true,
        surrenderAllowed: true,
        insuranceAllowed: true,
        blackjackPayout: 1.5,
        maxSplits: 3,
        doubleOnAnyTwoCards: true,
        doubleAfterSplitAces: false
      }
    }

    onSettingsChange({
      ...settings,
      ...presets[variant]
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Custom Table Settings</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-xl"
            >
              ×
            </button>
          </div>
          <p className="text-blue-100 mt-2">
            Customize your multiplayer table rules and settings
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b bg-gray-50">
          {[
            { id: 'basic', label: 'Basic Settings' },
            { id: 'rules', label: 'Game Rules' },
            { id: 'experience', label: 'Table Experience' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'basic' | 'rules' | 'experience')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Basic Settings Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Bet ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.minBet}
                    onChange={(e) => updateSetting('minBet', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Bet ($)
                  </label>
                  <input
                    type="number"
                    min={settings.minBet}
                    max="10000"
                    value={settings.maxBet}
                    onChange={(e) => updateSetting('maxBet', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Chips ($)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="50000"
                    step="100"
                    value={settings.startingChips}
                    onChange={(e) => updateSetting('startingChips', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Player Action Time Limit (seconds)
                  </label>
                  <select
                    value={settings.playerActionTimeLimit}
                    onChange={(e) => updateSetting('playerActionTimeLimit', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>No limit</option>
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={45}>45 seconds</option>
                    <option value={60}>60 seconds</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Game Duration (minutes)
                  </label>
                  <select
                    value={settings.maxGameDuration}
                    onChange={(e) => updateSetting('maxGameDuration', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>No limit</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Game Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              {/* Preset Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => loadPreset('vegas')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Vegas Rules
                  </button>
                  <button
                    onClick={() => loadPreset('european')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    European Rules
                  </button>
                  <button
                    onClick={() => loadPreset('atlantic_city')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Atlantic City Rules
                  </button>
                </div>
              </div>

              {/* Rule Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.dealerStandsOn17}
                    onChange={(e) => updateSetting('dealerStandsOn17', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Dealer stands on 17</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.doubleAfterSplit}
                    onChange={(e) => updateSetting('doubleAfterSplit', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Double after split</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.surrenderAllowed}
                    onChange={(e) => updateSetting('surrenderAllowed', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Surrender allowed</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.insuranceAllowed}
                    onChange={(e) => updateSetting('insuranceAllowed', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Insurance allowed</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.doubleOnAnyTwoCards}
                    onChange={(e) => updateSetting('doubleOnAnyTwoCards', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Double on any two cards</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.doubleAfterSplitAces}
                    onChange={(e) => updateSetting('doubleAfterSplitAces', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Double after split aces</span>
                </label>
              </div>

              {/* Numeric Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blackjack Payout
                  </label>
                  <select
                    value={settings.blackjackPayout}
                    onChange={(e) => updateSetting('blackjackPayout', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1.5}>3:2 (Traditional)</option>
                    <option value={1.2}>6:5 (Lower payout)</option>
                    <option value={1.0}>1:1 (Even money)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Splits
                  </label>
                  <select
                    value={settings.maxSplits}
                    onChange={(e) => updateSetting('maxSplits', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>No splitting</option>
                    <option value={1}>Split once</option>
                    <option value={2}>Split twice</option>
                    <option value={3}>Split three times</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Table Experience Tab */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dealer Speed
                  </label>
                  <select
                    value={settings.dealerSpeed}
                    onChange={(e) => updateSetting('dealerSpeed', e.target.value as 'slow' | 'normal' | 'fast')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="slow">Slow (3s delays)</option>
                    <option value="normal">Normal (2s delays)</option>
                    <option value="fast">Fast (1s delays)</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.showStrategyHints}
                      onChange={(e) => updateSetting('showStrategyHints', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Show strategy hints to players</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.allowSpectators}
                      onChange={(e) => updateSetting('allowSpectators', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Allow spectators</span>
                  </label>
                </div>
              </div>

              {/* Rules Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Rules Summary</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>• Betting: ${settings.minBet} - ${settings.maxBet}</p>
                  <p>• Starting chips: ${settings.startingChips}</p>
                  <p>• Blackjack pays: {settings.blackjackPayout === 1.5 ? '3:2' : settings.blackjackPayout === 1.2 ? '6:5' : '1:1'}</p>
                  <p>• Dealer {settings.dealerStandsOn17 ? 'stands' : 'hits'} on soft 17</p>
                  <p>• Surrender: {settings.surrenderAllowed ? 'Allowed' : 'Not allowed'}</p>
                  <p>• Insurance: {settings.insuranceAllowed ? 'Allowed' : 'Not allowed'}</p>
                  <p>• Maximum splits: {settings.maxSplits}</p>
                  {settings.playerActionTimeLimit > 0 && (
                    <p>• Action time limit: {settings.playerActionTimeLimit}s</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}