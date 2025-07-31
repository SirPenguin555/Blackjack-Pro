/**
 * Analytics Dashboard Component
 * 
 * Comprehensive statistics display including:
 * - Overall performance metrics
 * - Table and variant comparisons
 * - Strategy accuracy analysis
 * - Performance trends
 * - Session tracking
 */

import React, { useState, useEffect, useMemo } from 'react'
import { statsTracker, StatisticsSummary, PerformanceTrend } from '../lib/StatsTracker'
import { TableLevel, TABLE_CONFIGURATIONS } from '../lib/tableSystem'
import { GameVariant, RULE_CONFIGURATIONS } from '../lib/ruleVariations'
import { GameAction } from '../types/game'

interface AnalyticsDashboardProps {
  onClose: () => void
}

type TabType = 'overview' | 'tables' | 'variants' | 'strategy' | 'trends' | 'sessions'

export function AnalyticsDashboard({ onClose }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [summary, setSummary] = useState<StatisticsSummary | null>(null)
  const [trends, setTrends] = useState<PerformanceTrend[]>([])
  const [trendDays, setTrendDays] = useState(7)

  useEffect(() => {
    const loadData = () => {
      setSummary(statsTracker.getStatisticsSummary())
      setTrends(statsTracker.getPerformanceTrends(trendDays))
    }

    loadData()
    
    // Refresh data every 5 seconds while dashboard is open
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [trendDays])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`
  }

  if (!summary) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="bg-blue-800 bg-opacity-70 rounded-lg shadow-xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-700">
          <h2 className="text-2xl font-bold text-yellow-400">
            Advanced Statistics
          </h2>
          <button
            onClick={onClose}
            className="text-yellow-400 hover:text-yellow-300 text-2xl font-bold w-8 h-8 flex items-center justify-center
                       hover:bg-blue-700 rounded"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-blue-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'tables', label: 'Tables' },
              { id: 'variants', label: 'Variants' },
              { id: 'strategy', label: 'Strategy' },
              { id: 'trends', label: 'Trends' },
              { id: 'sessions', label: 'Sessions' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-yellow-400 text-yellow-400'
                    : 'border-transparent text-blue-200 hover:text-yellow-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {activeTab === 'overview' && <OverviewTab summary={summary} formatCurrency={formatCurrency} formatPercentage={formatPercentage} />}
          {activeTab === 'tables' && <TablesTab summary={summary} formatCurrency={formatCurrency} formatPercentage={formatPercentage} />}
          {activeTab === 'variants' && <VariantsTab summary={summary} formatCurrency={formatCurrency} formatPercentage={formatPercentage} />}
          {activeTab === 'strategy' && <StrategyTab summary={summary} formatPercentage={formatPercentage} />}
          {activeTab === 'trends' && <TrendsTab trends={trends} trendDays={trendDays} setTrendDays={setTrendDays} formatCurrency={formatCurrency} formatPercentage={formatPercentage} />}
          {activeTab === 'sessions' && <SessionsTab summary={summary} formatCurrency={formatCurrency} />}
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ 
  summary, 
  formatCurrency, 
  formatPercentage 
}: { 
  summary: StatisticsSummary
  formatCurrency: (amount: number) => string
  formatPercentage: (value: number) => string
}) {
  const { basic } = summary

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Hands Played"
          value={basic.handsPlayed.toLocaleString()}
          subtitle={`${basic.roundsPlayed} rounds`}
          color="blue"
        />
        <MetricCard
          title="Win Rate"
          value={formatPercentage(summary.winRate)}
          subtitle={`${basic.handsWon}W ${basic.handsLost}L ${basic.handsPushed}P`}
          color="green"
        />
        <MetricCard
          title="Net Winnings"
          value={formatCurrency(basic.totalWinnings)}
          subtitle={`Avg bet: ${formatCurrency(summary.averageBetSize)}`}
          color={basic.totalWinnings >= 0 ? 'green' : 'red'}
        />
        <MetricCard
          title="Blackjacks"
          value={basic.blackjacks.toString()}
          subtitle={`${((basic.blackjacks / Math.max(basic.handsPlayed, 1)) * 100).toFixed(1)}% rate`}
          color="yellow"
        />
      </div>

      {/* Performance Highlights */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Highlights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
              Strategy Performance
            </h4>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatPercentage(summary.strategyAccuracy.accuracyPercentage)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {summary.strategyAccuracy.optimalDecisions} of {summary.strategyAccuracy.totalDecisions} optimal decisions
            </p>
          </div>

          {summary.bestTable && (
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Best Table Performance
              </h4>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {TABLE_CONFIGURATIONS[summary.bestTable.level].name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatPercentage(summary.bestTable.winRate)} win rate
              </p>
            </div>
          )}

          {summary.bestVariant && (
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Best Variant Performance
              </h4>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {RULE_CONFIGURATIONS[summary.bestVariant.variant].name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatPercentage(summary.bestVariant.winRate)} win rate
              </p>
            </div>
          )}

          {basic.loansTaken > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bankruptcy Recovery
              </h4>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {basic.loansTaken} loans
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total recovery instances
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Current Session */}
      {summary.currentSession && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Current Session
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Table</p>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {TABLE_CONFIGURATIONS[summary.currentSession.tableLevel].name}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Variant</p>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {RULE_CONFIGURATIONS[summary.currentSession.variant].name}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Hands</p>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {summary.currentSession.handsPlayed}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Net</p>
              <p className={`font-medium ${
                summary.currentSession.netWinnings >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(summary.currentSession.netWinnings)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TablesTab({ 
  summary, 
  formatCurrency, 
  formatPercentage 
}: { 
  summary: StatisticsSummary
  formatCurrency: (amount: number) => string
  formatPercentage: (value: number) => string
}) {
  const tableStats = useMemo(() => {
    return Object.values(TableLevel).map(level => {
      const stats = statsTracker.getTableStats(level)
      const config = TABLE_CONFIGURATIONS[level]
      const winRate = stats.handsPlayed > 0 ? (stats.handsWon / stats.handsPlayed) * 100 : 0
      
      return {
        level,
        config,
        stats,
        winRate
      }
    }).filter(item => item.stats.handsPlayed > 0)
  }, [])

  if (tableStats.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No table statistics available yet. Play some hands to see performance by table level.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Performance by Table Level
      </h3>
      
      <div className="space-y-4">
        {tableStats.map(({ level, config, stats, winRate }) => (
          <div key={level} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {config.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {config.description}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${
                  winRate >= 50 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(winRate)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hands</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {stats.handsPlayed}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Won</p>
                <p className="font-medium text-green-600">
                  {stats.handsWon}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Lost</p>
                <p className="font-medium text-red-600">
                  {stats.handsLost}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Blackjacks</p>
                <p className="font-medium text-yellow-600">
                  {stats.blackjacks}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Net Winnings</p>
                <p className={`font-medium ${
                  stats.totalWinnings >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(stats.totalWinnings)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VariantsTab({ 
  summary, 
  formatCurrency, 
  formatPercentage 
}: { 
  summary: StatisticsSummary
  formatCurrency: (amount: number) => string
  formatPercentage: (value: number) => string
}) {
  const variantStats = useMemo(() => {
    return Object.values(GameVariant).map(variant => {
      const stats = statsTracker.getVariantStats(variant)
      const config = RULE_CONFIGURATIONS[variant]
      const winRate = stats.handsPlayed > 0 ? (stats.handsWon / stats.handsPlayed) * 100 : 0
      
      return {
        variant,
        config,
        stats,
        winRate
      }
    }).filter(item => item.stats.handsPlayed > 0)
  }, [])

  if (variantStats.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No variant statistics available yet. Try different rule variations to see comparative performance.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Performance by Game Variant
      </h3>
      
      <div className="space-y-4">
        {variantStats.map(({ variant, config, stats, winRate }) => (
          <div key={variant} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {config.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {config.description}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${
                  winRate >= 50 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(winRate)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hands</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {stats.handsPlayed}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Won</p>
                <p className="font-medium text-green-600">
                  {stats.handsWon}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Lost</p>
                <p className="font-medium text-red-600">
                  {stats.handsLost}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Blackjacks</p>
                <p className="font-medium text-yellow-600">
                  {stats.blackjacks}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Net Winnings</p>
                <p className={`font-medium ${
                  stats.totalWinnings >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(stats.totalWinnings)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StrategyTab({ 
  summary, 
  formatPercentage 
}: { 
  summary: StatisticsSummary
  formatPercentage: (value: number) => string
}) {
  const { strategyAccuracy } = summary

  if (strategyAccuracy.totalDecisions === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No strategy decisions recorded yet. Play in Easy Mode or with strategy hints enabled to track accuracy.
        </p>
      </div>
    )
  }

  const actionData = Object.entries(strategyAccuracy.byAction).map(([action, data]) => ({
    action: action as GameAction,
    ...data,
    accuracy: data.total > 0 ? (data.optimal / data.total) * 100 : 0
  }))

  const handTotalData = Object.entries(strategyAccuracy.byHandTotal)
    .map(([total, data]) => ({
      handTotal: parseInt(total),
      ...data,
      accuracy: data.total > 0 ? (data.optimal / data.total) * 100 : 0
    }))
    .sort((a, b) => a.handTotal - b.handTotal)

  return (
    <div className="space-y-6">
      {/* Overall Strategy Accuracy */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Overall Strategy Accuracy
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatPercentage(strategyAccuracy.accuracyPercentage)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {strategyAccuracy.optimalDecisions} of {strategyAccuracy.totalDecisions} decisions were optimal
            </p>
          </div>
          <div className="w-24 h-24">
            <div className="relative w-full h-full">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-300 dark:text-gray-600"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - strategyAccuracy.accuracyPercentage / 100)}`}
                  className="text-blue-600 dark:text-blue-400"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Accuracy by Action */}
      {actionData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Accuracy by Action Type
          </h3>
          <div className="space-y-3">
            {actionData.map(({ action, total, optimal, accuracy }) => (
              <div key={action} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 text-center">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm font-medium uppercase">
                      {action}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {optimal} of {total} optimal
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${
                    accuracy >= 80 ? 'text-green-600' : 
                    accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(accuracy)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accuracy by Hand Total */}
      {handTotalData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Accuracy by Hand Total
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {handTotalData.map(({ handTotal, total, optimal, accuracy }) => (
              <div key={handTotal} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {handTotal}
                </p>
                <p className={`text-sm font-medium ${
                  accuracy >= 80 ? 'text-green-600' : 
                  accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {formatPercentage(accuracy)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {optimal}/{total}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TrendsTab({ 
  trends, 
  trendDays, 
  setTrendDays, 
  formatCurrency, 
  formatPercentage 
}: { 
  trends: PerformanceTrend[]
  trendDays: number
  setTrendDays: (days: number) => void
  formatCurrency: (amount: number) => string
  formatPercentage: (value: number) => string
}) {
  if (trends.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No trend data available yet. Play more hands to see performance trends over time.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Performance Trends
        </h3>
        <select
          value={trendDays}
          onChange={(e) => setTrendDays(Number(e.target.value))}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      <div className="space-y-4">
        {trends.map((trend) => (
          <div key={trend.date} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {new Date(trend.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </h4>
              <div className="flex items-center space-x-4">
                <span className={`text-sm font-medium ${
                  trend.winRate >= 50 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(trend.winRate)} WR
                </span>
                <span className={`text-sm font-medium ${
                  trend.netWinnings >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(trend.netWinnings)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{trend.handsPlayed} hands</span>
              <span>Avg bet: {formatCurrency(trend.averageBetSize)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SessionsTab({ 
  summary, 
  formatCurrency 
}: { 
  summary: StatisticsSummary
  formatCurrency: (amount: number) => string
}) {
  const recentSessions = useMemo(() => {
    return statsTracker.getStatisticsSummary().currentSession 
      ? [statsTracker.getStatisticsSummary().currentSession!]
      : []
  }, [])

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Session History
      </h3>

      {summary.currentSession && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Current Session (Active)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Table</p>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {TABLE_CONFIGURATIONS[summary.currentSession.tableLevel].name}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Variant</p>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {RULE_CONFIGURATIONS[summary.currentSession.variant].name}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Performance</p>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {summary.currentSession.handsWon}W-{summary.currentSession.handsLost}L-{summary.currentSession.handsPushed}P
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Net Winnings</p>
              <p className={`font-medium ${
                summary.currentSession.netWinnings >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(summary.currentSession.netWinnings)}
              </p>
            </div>
          </div>
        </div>
      )}

      {!summary.currentSession && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No active session. Start playing to begin tracking session statistics.
          </p>
        </div>
      )}
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  color 
}: { 
  title: string
  value: string
  subtitle: string
  color: 'blue' | 'green' | 'red' | 'yellow'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
  }

  const textColorClasses = {
    blue: 'text-blue-900 dark:text-blue-100',
    green: 'text-green-900 dark:text-green-100',
    red: 'text-red-900 dark:text-red-100',
    yellow: 'text-yellow-900 dark:text-yellow-100'
  }

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <h3 className={`text-sm font-medium ${textColorClasses[color]} opacity-75`}>
        {title}
      </h3>
      <p className={`text-2xl font-bold ${textColorClasses[color]} mt-1`}>
        {value}
      </p>
      <p className={`text-sm ${textColorClasses[color]} opacity-60 mt-1`}>
        {subtitle}
      </p>
    </div>
  )
}