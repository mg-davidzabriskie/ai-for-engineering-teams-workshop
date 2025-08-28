/**
 * CustomerHealthDisplay Component
 * Displays comprehensive customer health scores with detailed breakdown
 * Integrates with health calculator to provide real-time scoring
 */

'use client';

import React, { useState } from 'react';
import { Customer } from '@/data/mock-customers';
import { HealthScoreResult } from '@/lib/types/healthScore';
import { useHealthScore } from '@/hooks/useHealthScore';
import { HealthScoreBreakdown } from './HealthScoreBreakdown';

interface CustomerHealthDisplayProps {
  customer: Customer;
  className?: string;
  showBreakdown?: boolean;
  onScoreChange?: (score: HealthScoreResult) => void;
}


export const CustomerHealthDisplay: React.FC<CustomerHealthDisplayProps> = ({
  customer,
  className = '',
  showBreakdown = false,
  onScoreChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(showBreakdown);

  // Use the custom hook for health score calculation
  const {
    healthScore: healthResult,
    isLoading,
    error,
    isCalculating,
    refreshScore
  } = useHealthScore({
    customer,
    autoCalculate: true,
    cacheTimeout: 300000 // 5 minutes
  });

  // Notify parent component when health score changes
  React.useEffect(() => {
    if (healthResult) {
      onScoreChange?.(healthResult);
    }
  }, [healthResult, onScoreChange]);

  if (!customer || !customer.name || !customer.company) {
    return null;
  }

  if (isLoading || isCalculating) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`} role="status" aria-live="polite">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/2"></div>
          <div className="h-20 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
        <span className="sr-only">Calculating health score...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`} role="alert">
        <div className="flex items-center text-red-600">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Unable to calculate health score</span>
        </div>
        <p className="text-gray-600 text-sm mt-2">
          {error}
        </p>
        <button
          onClick={refreshScore}
          className="mt-3 px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!healthResult) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            No health score available
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Unable to calculate health score for this customer
          </p>
          <button
            onClick={refreshScore}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Calculate Score
          </button>
        </div>
      </div>
    );
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'declining':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'stable':
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
      role="article"
      aria-labelledby="health-score-title"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 id="health-score-title" className="text-lg font-semibold text-gray-900">
              Customer Health Score
            </h3>
            <p className="text-sm text-gray-600">
              {customer.name} - {customer.company}
            </p>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-expanded={isExpanded}
            aria-controls="health-breakdown"
            aria-label={isExpanded ? 'Hide detailed breakdown' : 'Show detailed breakdown'}
          >
            <svg 
              className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Main Score Display */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div 
                className={`flex items-center justify-center w-16 h-16 rounded-full border-2 ${getRiskLevelColor(healthResult.riskLevel)}`}
                role="img"
                aria-label={`Health score: ${healthResult.overallScore} out of 100, ${healthResult.riskLevel} risk level`}
              >
                <span className="text-2xl font-bold">
                  {healthResult.overallScore}
                </span>
              </div>
              
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRiskLevelColor(healthResult.riskLevel)}`}>
                    {healthResult.riskLevel}
                  </span>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(healthResult.trend)}
                    <span className="text-sm text-gray-600 capitalize">
                      {healthResult.trend}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>
                    Confidence: {Math.round(healthResult.confidence * 100)}%
                  </span>
                  <span>
                    Data Quality: {Math.round(healthResult.dataQuality.completenessScore * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                healthResult.riskLevel === 'healthy' ? 'bg-green-500' :
                healthResult.riskLevel === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${healthResult.overallScore}%` }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={healthResult.overallScore}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>30</span>
            <span>70</span>
            <span>100</span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div 
          id="health-breakdown"
          className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
          aria-hidden={!isExpanded}
        >
          <div className="border-t border-gray-200 pt-6">
            <HealthScoreBreakdown 
              healthScore={healthResult}
              defaultExpanded={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};