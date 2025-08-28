/**
 * HealthScoreBreakdown Component
 * Displays detailed breakdown of health score factors with interactive visualization
 */

import { useState } from 'react'
import { HealthScoreResult, FactorBreakdown } from '@/lib/types/healthScore'

interface HealthScoreBreakdownProps {
  healthScore: HealthScoreResult
  className?: string
  defaultExpanded?: boolean
}

interface FactorDisplayProps {
  title: string
  icon: React.ReactNode
  score: number
  confidence: number
  weight: number
  isExpanded: boolean
  onToggle: () => void
}

/**
 * Individual factor display component
 */
const FactorDisplay = ({ 
  title, 
  icon, 
  score, 
  confidence, 
  weight,
  isExpanded, 
  onToggle 
}: FactorDisplayProps) => {
  const getScoreColor = (score: number): string => {
    if (score >= 71) return 'text-green-600'
    if (score >= 31) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number): string => {
    if (score >= 71) return 'bg-green-50 border-green-200'
    if (score >= 31) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const getProgressColor = (score: number): string => {
    if (score >= 71) return 'bg-green-500'
    if (score >= 31) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className={`border rounded-lg p-4 ${getScoreBgColor(score)} transition-all duration-200`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded"
        aria-expanded={isExpanded}
        aria-controls={`${title.toLowerCase()}-details`}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-sm text-gray-600">
              Confidence: {Math.round(confidence * 100)}% • Weight: {Math.round(weight * 100)}%
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className={`text-xl font-bold ${getScoreColor(score)}`}>
              {Math.round(score)}
            </div>
            <div className="text-xs text-gray-500">/ 100</div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Progress bar */}
      <div className="mt-3 mb-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getProgressColor(score)} transition-all duration-500`}
            style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div 
          id={`${title.toLowerCase()}-details`}
          className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="p-3 bg-white bg-opacity-50 rounded text-sm text-gray-700">
            <p><strong>Score:</strong> {Math.round(score)}/100</p>
            <p><strong>Confidence:</strong> {Math.round(confidence * 100)}%</p>
            <p><strong>Weight:</strong> {Math.round(weight * 100)}%</p>
            <p><strong>Contribution:</strong> {Math.round(score * weight)}/100</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * HealthScoreBreakdown main component
 */
export const HealthScoreBreakdown = ({ 
  healthScore, 
  className = '',
  defaultExpanded = false
}: HealthScoreBreakdownProps) => {
  const [expandedFactors, setExpandedFactors] = useState<Set<string>>(
    defaultExpanded ? new Set(['payment', 'engagement', 'contract', 'support']) : new Set()
  )

  const toggleFactor = (factorName: string) => {
    const newExpanded = new Set(expandedFactors)
    if (newExpanded.has(factorName)) {
      newExpanded.delete(factorName)
    } else {
      newExpanded.add(factorName)
    }
    setExpandedFactors(newExpanded)
  }

  const toggleAll = () => {
    if (expandedFactors.size === 4) {
      setExpandedFactors(new Set())
    } else {
      setExpandedFactors(new Set(['payment', 'engagement', 'contract', 'support']))
    }
  }

  // Factor configurations with icons and labels
  const factorConfigs = [
    {
      key: 'payment' as keyof FactorBreakdown,
      title: 'Payment Health',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      key: 'engagement' as keyof FactorBreakdown,
      title: 'Engagement Health',
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      key: 'contract' as keyof FactorBreakdown,
      title: 'Contract Health',
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      key: 'support' as keyof FactorBreakdown,
      title: 'Support Health',
      icon: (
        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with expand/collapse all */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Health Score Breakdown
        </h3>
        <button
          onClick={toggleAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
        >
          {expandedFactors.size === 4 ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Overall metrics */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">Overall Score</div>
            <div className="text-2xl font-bold text-gray-900">{healthScore.overallScore}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">Confidence</div>
            <div className="text-2xl font-bold text-blue-600">{Math.round(healthScore.confidence * 100)}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">Data Quality</div>
            <div className="text-2xl font-bold text-green-600">{Math.round(healthScore.dataQuality.completenessScore * 100)}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">Trend</div>
            <div className={`text-2xl font-bold capitalize ${
              healthScore.trend === 'improving' ? 'text-green-600' : 
              healthScore.trend === 'declining' ? 'text-red-600' : 
              'text-yellow-600'
            }`}>
              {healthScore.trend === 'improving' ? '↗' : healthScore.trend === 'declining' ? '↘' : '→'} 
              {healthScore.trend}
            </div>
          </div>
        </div>
      </div>

      {/* Individual factor breakdowns */}
      <div className="space-y-3">
        {factorConfigs.map((config) => {
          const factorData = healthScore.factorScores[config.key]
          return (
            <FactorDisplay
              key={config.key}
              title={config.title}
              icon={config.icon}
              score={factorData.score}
              confidence={factorData.confidence}
              weight={factorData.weight}
              isExpanded={expandedFactors.has(config.key)}
              onToggle={() => toggleFactor(config.key)}
            />
          )
        })}
      </div>

      {/* Footer with calculation info */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t">
        <p>
          Calculated on {new Date(healthScore.lastCalculated).toLocaleString()}
        </p>
        <p className="mt-1">
          Weights: Payment 40% • Engagement 30% • Contract 20% • Support 10%
        </p>
      </div>
    </div>
  )
}