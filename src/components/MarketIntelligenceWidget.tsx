'use client'

import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react'
import { generateMockMarketData, calculateMockSentiment, MockHeadline } from '@/data/mock-market-intelligence'
import { mockCustomers } from '@/data/mock-customers'

interface MarketIntelligenceWidgetProps {
  company?: string
  onCompanySelect?: (company: string) => void
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface SentimentData {
  score: number
  label: 'positive' | 'neutral' | 'negative'
  confidence: number
}

interface MarketIntelligenceData {
  sentiment: SentimentData
  headlines: MockHeadline[]
  articleCount: number
  lastUpdated: string
}

/**
 * MarketIntelligenceWidget - Displays market intelligence data for a company
 * 
 * Features:
 * - Company name input with autocomplete suggestions and validation
 * - Color-coded sentiment indicators (green/yellow/red)
 * - News headlines list with source, date, and content
 * - Loading skeleton and error states matching existing patterns
 * - Responsive design for all breakpoints
 * - WCAG 2.1 AA accessibility compliance
 * - Manual refresh functionality
 */
export const MarketIntelligenceWidget = ({
  company = '',
  onCompanySelect,
  className = '',
  autoRefresh = false,
  refreshInterval = 300000 // 5 minutes
}: MarketIntelligenceWidgetProps) => {
  const [selectedCompany, setSelectedCompany] = useState(company || '')
  const [inputValue, setInputValue] = useState(company || '')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [data, setData] = useState<MarketIntelligenceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLUListElement>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Get unique company names from mock customers for autocomplete
  const availableCompanies = Array.from(new Set(mockCustomers.map(c => c.company))).sort()

  // Add some additional popular companies for better demonstration
  const popularCompanies = [
    'Apple Inc',
    'Microsoft Corporation', 
    'Google',
    'Amazon',
    'Tesla',
    'Meta Platforms',
    'Netflix',
    'Salesforce',
    'Adobe',
    'Intel Corporation'
  ]
  
  const allCompanies = [...availableCompanies, ...popularCompanies].sort()

  // Input validation
  const validateCompanyInput = (value: string): string | null => {
    if (!value.trim()) {
      return 'Company name is required'
    }
    if (value.length < 2) {
      return 'Company name must be at least 2 characters'
    }
    if (value.length > 100) {
      return 'Company name must be no more than 100 characters'
    }
    if (!/^[a-zA-Z0-9\s\-'&.,()]+$/.test(value)) {
      return 'Company name contains invalid characters'
    }
    return null
  }

  // Generate autocomplete suggestions
  const generateSuggestions = useCallback((query: string): string[] => {
    if (!query.trim() || query.length < 2) return []
    
    const normalizedQuery = query.toLowerCase()
    return allCompanies
      .filter(company => 
        company.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 8)
  }, [allCompanies])

  // Fetch market intelligence data
  const fetchMarketData = useCallback(async (companyName: string) => {
    if (!companyName.trim()) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate API delay for realistic loading experience
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockData = generateMockMarketData(companyName)
      const sentiment = calculateMockSentiment(mockData.headlines)
      
      const marketData: MarketIntelligenceData = {
        sentiment,
        headlines: mockData.headlines,
        articleCount: mockData.articleCount,
        lastUpdated: new Date().toISOString()
      }
      
      setData(marketData)
    } catch (err) {
      console.error('Failed to fetch market data:', err)
      setError('Failed to load market intelligence data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle input change with real-time validation and suggestions
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Clear previous validation error
    setValidationError(null)
    
    // Generate suggestions
    const newSuggestions = generateSuggestions(value)
    setSuggestions(newSuggestions)
    setShowSuggestions(newSuggestions.length > 0)
  }

  // Handle input blur
  const handleInputBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
    
    // Validate input
    const error = validateCompanyInput(value)
    setValidationError(error)
  }

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    setSelectedCompany(suggestion)
    setShowSuggestions(false)
    setValidationError(null)
    onCompanySelect?.(suggestion)
    fetchMarketData(suggestion)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedValue = inputValue.trim()
    const error = validateCompanyInput(trimmedValue)
    
    if (error) {
      setValidationError(error)
      return
    }
    
    setSelectedCompany(trimmedValue)
    setValidationError(null)
    onCompanySelect?.(trimmedValue)
    fetchMarketData(trimmedValue)
  }

  // Handle manual refresh
  const handleRefresh = () => {
    if (selectedCompany) {
      fetchMarketData(selectedCompany)
    }
  }

  // Get sentiment color classes
  const getSentimentColor = (sentiment: SentimentData): string => {
    switch (sentiment.label) {
      case 'positive':
        return 'bg-green-500 text-green-50'
      case 'negative':
        return 'bg-red-500 text-red-50'
      default:
        return 'bg-yellow-500 text-yellow-50'
    }
  }

  // Get sentiment icon
  const getSentimentIcon = (sentiment: SentimentData) => {
    switch (sentiment.label) {
      case 'positive':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.73 10.205a.75.75 0 00-1.06 1.59l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
        )
      case 'negative':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown date'
    }
  }

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefresh && selectedCompany && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchMarketData(selectedCompany)
      }, refreshInterval)
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current)
        }
      }
    }
  }, [autoRefresh, selectedCompany, refreshInterval, fetchMarketData])

  // Initialize with company prop when component first mounts
  useEffect(() => {
    if (company && !selectedCompany && !data) {
      fetchMarketData(company)
    }
  }, []) // Only run on mount

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'Escape':
        setShowSuggestions(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        // Focus first suggestion
        if (suggestionsRef.current?.firstElementChild) {
          (suggestionsRef.current.firstElementChild as HTMLElement).focus()
        }
        break
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Market Intelligence</h2>
            <p className="text-sm text-gray-600 mt-1">
              Get insights and news sentiment for any company
            </p>
          </div>
          {data && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="
                inline-flex items-center px-3 py-2 text-sm font-medium 
                text-gray-600 bg-white border border-gray-300 rounded-md
                hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
              "
              aria-label="Refresh market intelligence data"
            >
              <svg 
                className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          )}
        </div>

        {/* Company Input Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <label htmlFor="company-input" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                id="company-input"
                name="company-input"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onFocus={() => {
                  const newSuggestions = generateSuggestions(inputValue)
                  setSuggestions(newSuggestions)
                  setShowSuggestions(newSuggestions.length > 0)
                }}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className={`
                  block w-full pl-3 pr-12 py-3 border rounded-md shadow-sm
                  text-gray-900 placeholder-gray-400
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  disabled:bg-gray-50 disabled:text-gray-500
                  ${validationError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}
                `}
                placeholder="Enter company name (e.g., Apple Inc, Microsoft)"
                maxLength={100}
                aria-describedby={validationError ? 'company-input-error' : 'company-input-help'}
                aria-invalid={!!validationError}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="
                  absolute inset-y-0 right-0 px-4 py-2
                  text-blue-600 hover:text-blue-700
                  disabled:text-gray-400 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
                  transition-colors duration-200
                "
                aria-label="Search for company"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Validation Error */}
            {validationError && (
              <p className="mt-2 text-sm text-red-600" id="company-input-error" role="alert">
                {validationError}
              </p>
            )}

            {/* Help Text */}
            {!validationError && (
              <p className="mt-2 text-sm text-gray-500" id="company-input-help">
                {selectedCompany ? 
                  `Currently showing data for: ${selectedCompany}` : 
                  'Type to search for companies and get market intelligence'
                }
              </p>
            )}

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <ul
                  ref={suggestionsRef}
                  className="py-1"
                  role="listbox"
                  aria-label="Company suggestions"
                >
                  {suggestions.map((suggestion, index) => (
                    <li key={index} role="option" aria-selected="false">
                      <button
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="
                          w-full px-4 py-2 text-left text-sm text-gray-900 
                          hover:bg-blue-50 focus:bg-blue-50 focus:outline-none
                          border-none bg-transparent cursor-pointer
                        "
                        tabIndex={-1}
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </form>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4" role="status" aria-live="polite">
            <div className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex space-x-4">
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            <span className="sr-only">Loading market intelligence data...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading data
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:bg-red-100"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market Intelligence Data */}
        {data && !isLoading && !error && (
          <div className="space-y-6">
            {/* Sentiment Analysis */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                News Sentiment for {selectedCompany}
              </h3>
              <div className="flex items-center space-x-4">
                <div
                  className={`
                    inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold min-w-[7rem] justify-center
                    ${getSentimentColor(data.sentiment)}
                  `}
                  aria-label={`Sentiment: ${data.sentiment.label} with ${Math.round(data.sentiment.confidence * 100)}% confidence`}
                >
                  {getSentimentIcon(data.sentiment)}
                  <span className="ml-2 capitalize">{data.sentiment.label}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Confidence:</span>{' '}
                    {Math.round(data.sentiment.confidence * 100)}%
                  </div>
                  <div>
                    <span className="font-medium">Score:</span>{' '}
                    {data.sentiment.score > 0 ? '+' : ''}{data.sentiment.score.toFixed(3)}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Based on {data.articleCount} article{data.articleCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* News Headlines */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent News</h3>
              {data.headlines.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <p>No recent news found for {selectedCompany}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.headlines.map((headline, index) => (
                    <div 
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                            {headline.title}
                          </h4>
                          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                            <span className="font-medium">{headline.source}</span>
                            <span>•</span>
                            <span>{formatDate(headline.publishedAt)}</span>
                          </div>
                        </div>
                        {headline.url && (
                          <a
                            href={headline.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 text-blue-600 hover:text-blue-500 flex-shrink-0"
                            aria-label={`Read full article: ${headline.title}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
              Last updated: {formatDate(data.lastUpdated)}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!data && !isLoading && !error && (
          <div className="text-center py-12 text-gray-500">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400 mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z" />
            </svg>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Enter a company name to get started
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Search for any company to view market intelligence and news sentiment
            </p>
            
            {/* Quick Start Suggestions */}
            <div className="mt-6">
              <p className="text-xs text-gray-400 mb-3">Try these popular companies:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Apple Inc', 'Microsoft Corporation', 'Google', 'Tesla'].map((company) => (
                  <button
                    key={company}
                    type="button"
                    onClick={() => handleSuggestionClick(company)}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors duration-200"
                  >
                    {company}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}