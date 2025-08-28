'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface MarketSentiment {
  score: number // -1 to 1
  label: 'positive' | 'neutral' | 'negative'
  confidence: number // 0 to 1
}

interface NewsHeadline {
  title: string
  source: string
  publishedAt: string
  url?: string
}

interface MarketIntelligenceData {
  sentiment: MarketSentiment
  headlines: NewsHeadline[]
  articleCount: number
  lastUpdated: string
  company: string
}

interface MarketIntelligenceCacheEntry {
  data: MarketIntelligenceData
  timestamp: number
  expiresAt: number
}

class MarketIntelligenceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'MarketIntelligenceError'
  }
}

interface UseMarketIntelligenceOptions {
  autoFetch?: boolean
  company?: string
  cacheTimeout?: number // in milliseconds, defaults to 10 minutes
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    statusCode: number
    details?: unknown
  }
  timestamp: string
}

/**
 * useMarketIntelligence Hook - Integration with market intelligence API
 * 
 * Features:
 * - Integration with market intelligence API endpoints
 * - Client-side caching with TTL expiration for performance optimization
 * - Loading states and comprehensive error handling
 * - Company name management with validation
 * - Manual refresh functionality
 * - Debounced search capabilities
 */
export const useMarketIntelligence = (options: UseMarketIntelligenceOptions = {}) => {
  const { autoFetch = true, company, cacheTimeout = 10 * 60 * 1000 } = options // 10 minutes default

  const [marketData, setMarketData] = useState<MarketIntelligenceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentCompany, setCurrentCompany] = useState<string>(company || '')

  // Client-side cache with TTL
  const cacheRef = useRef<Map<string, MarketIntelligenceCacheEntry>>(new Map())
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // API request helper
  const apiRequest = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<unknown>> => {
    try {
      const response = await fetch(`/api/market-intelligence${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new MarketIntelligenceError(
          data.error?.message || `HTTP error! status: ${response.status}`,
          data.error?.code || 'API_ERROR',
          response.status
        )
      }

      return data
    } catch (error) {
      console.error('Market intelligence API request failed:', error)
      
      if (error instanceof MarketIntelligenceError) {
        throw error
      }
      
      throw new MarketIntelligenceError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        'NETWORK_ERROR',
        500
      )
    }
  }, [])

  // Cache management helpers
  const getCachedData = useCallback((companyName: string): MarketIntelligenceData | null => {
    const cacheKey = companyName.toLowerCase().trim()
    const cached = cacheRef.current.get(cacheKey)
    
    if (!cached) return null
    
    // Check if cache entry has expired
    if (Date.now() > cached.expiresAt) {
      cacheRef.current.delete(cacheKey)
      return null
    }
    
    return cached.data
  }, [])

  const setCachedData = useCallback((companyName: string, data: MarketIntelligenceData) => {
    const cacheKey = companyName.toLowerCase().trim()
    const now = Date.now()
    
    cacheRef.current.set(cacheKey, {
      data,
      timestamp: now,
      expiresAt: now + cacheTimeout
    })
  }, [cacheTimeout])

  const clearExpiredCache = useCallback(() => {
    const now = Date.now()
    
    for (const [key, entry] of cacheRef.current.entries()) {
      if (now > entry.expiresAt) {
        cacheRef.current.delete(key)
      }
    }
  }, [])

  // Fetch market intelligence data
  const fetchMarketIntelligence = useCallback(async (companyName?: string) => {
    const targetCompany = companyName || currentCompany
    
    if (!targetCompany || targetCompany.trim().length < 2) {
      setError('Company name must be at least 2 characters long')
      return null
    }

    // Clean up expired cache entries
    clearExpiredCache()

    // Check cache first
    const cachedData = getCachedData(targetCompany)
    if (cachedData) {
      setMarketData(cachedData)
      setError(null)
      return cachedData
    }

    setIsLoading(true)
    setError(null)

    try {
      const encodedCompany = encodeURIComponent(targetCompany.trim())
      const response = await apiRequest(`/${encodedCompany}`)
      
      if (response.success && response.data) {
        const data = response.data as MarketIntelligenceData
        
        // Update cache
        setCachedData(targetCompany, data)
        
        // Update state
        setMarketData(data)
        setCurrentCompany(targetCompany)
        
        return data
      } else {
        throw new MarketIntelligenceError(
          response.error?.message || 'Failed to fetch market intelligence',
          response.error?.code || 'FETCH_ERROR',
          response.error?.statusCode || 500
        )
      }
    } catch (error) {
      let errorMessage = 'An unexpected error occurred'
      
      if (error instanceof MarketIntelligenceError) {
        errorMessage = error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      console.error('Error fetching market intelligence:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, currentCompany, getCachedData, setCachedData, clearExpiredCache])

  // Debounced search functionality
  const searchMarketIntelligence = useCallback((companyName: string) => {
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Validate input
    if (!companyName || companyName.trim().length < 2) {
      setCurrentCompany(companyName)
      setMarketData(null)
      setError(null)
      return
    }

    // Update current company immediately for UI feedback
    setCurrentCompany(companyName)

    // Debounce the API call
    debounceRef.current = setTimeout(() => {
      fetchMarketIntelligence(companyName)
    }, 300) // 300ms debounce delay
  }, [fetchMarketIntelligence])

  // Refresh data (force bypass cache)
  const refreshData = useCallback(async () => {
    if (!currentCompany || currentCompany.trim().length < 2) {
      return null
    }

    // Clear cache for current company
    const cacheKey = currentCompany.toLowerCase().trim()
    cacheRef.current.delete(cacheKey)

    // Fetch fresh data
    return await fetchMarketIntelligence(currentCompany)
  }, [currentCompany, fetchMarketIntelligence])

  // Clear error state
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Clear all data and reset state
  const clearData = useCallback(() => {
    setMarketData(null)
    setError(null)
    setCurrentCompany('')
  }, [])

  // Cache utilities
  const clearCache = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  const getCacheInfo = useCallback(() => {
    const cache = cacheRef.current
    const entries = Array.from(cache.entries()).map(([key, entry]) => ({
      company: key,
      cached: new Date(entry.timestamp).toISOString(),
      expires: new Date(entry.expiresAt).toISOString(),
      isExpired: Date.now() > entry.expiresAt
    }))
    
    return {
      totalEntries: cache.size,
      entries
    }
  }, [])

  // Auto-fetch on mount and when company changes
  useEffect(() => {
    if (autoFetch && company && company.trim().length >= 2) {
      setCurrentCompany(company)
      fetchMarketIntelligence(company)
    }
  }, [autoFetch, company, fetchMarketIntelligence])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Periodic cache cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(clearExpiredCache, 5 * 60 * 1000) // Every 5 minutes
    
    return () => {
      clearInterval(cleanupInterval)
    }
  }, [clearExpiredCache])

  return {
    // Data state
    marketData,
    currentCompany,
    
    // Loading state
    isLoading,
    
    // Error state
    error,
    clearError,
    
    // Actions
    fetchMarketIntelligence,
    searchMarketIntelligence,
    refreshData,
    clearData,
    
    // Company management
    setCompany: setCurrentCompany,
    
    // Cache management
    clearCache,
    getCacheInfo,
    
    // Computed values
    hasData: !!marketData,
    isValidCompany: currentCompany.trim().length >= 2,
    cacheTimeout,
    
    // Helper functions
    isDataFresh: (thresholdMinutes = 5) => {
      if (!marketData) return false
      const dataAge = Date.now() - new Date(marketData.lastUpdated).getTime()
      return dataAge < (thresholdMinutes * 60 * 1000)
    }
  }
}

export default useMarketIntelligence
export { MarketIntelligenceError }
export type { 
  MarketIntelligenceData, 
  MarketSentiment, 
  NewsHeadline, 
  UseMarketIntelligenceOptions,
  MarketIntelligenceCacheEntry
}