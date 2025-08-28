/**
 * Custom hook for Customer Health Score management
 * Provides health score calculation, caching, and state management
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Customer } from '@/data/mock-customers'
import { 
  HealthScoreResult, 
  HealthScoreInput, 
  HealthCalculatorConfig,
  HealthScoreError 
} from '@/lib/types/healthScore'
import { 
  calculateHealthScore, 
  generateMockHealthData,
  validateHealthScoreInput 
} from '@/lib/healthCalculator'

interface UseHealthScoreOptions {
  customer?: Customer
  autoCalculate?: boolean
  cacheTimeout?: number // Cache timeout in milliseconds
  config?: HealthCalculatorConfig
}

interface UseHealthScoreReturn {
  healthScore: HealthScoreResult | null
  isLoading: boolean
  error: string | null
  isCalculating: boolean
  calculateScore: (input?: HealthScoreInput) => Promise<void>
  refreshScore: () => Promise<void>
  clearCache: () => void
  lastUpdated: Date | null
}

// Cache for health scores to avoid recalculation
const healthScoreCache = new Map<string, {
  result: HealthScoreResult
  timestamp: number
  input: HealthScoreInput
}>()

/**
 * Custom hook for managing customer health scores
 */
export function useHealthScore({
  customer,
  autoCalculate = true,
  cacheTimeout = 300000, // 5 minutes default
  config
}: UseHealthScoreOptions = {}): UseHealthScoreReturn {
  const [healthScore, setHealthScore] = useState<HealthScoreResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const calculateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (calculateTimeoutRef.current) {
        clearTimeout(calculateTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Gets cache key for a customer
   */
  const getCacheKey = useCallback((customerId: string): string => {
    return `health_score_${customerId}`
  }, [])

  /**
   * Checks if cached result is still valid
   */
  const isCacheValid = useCallback((cacheEntry: any, timeout: number): boolean => {
    return Date.now() - cacheEntry.timestamp < timeout
  }, [])

  /**
   * Validates input data before calculation
   */
  const validateInput = useCallback((input: HealthScoreInput): HealthScoreError[] => {
    const validation = validateHealthScoreInput(input)
    
    // Convert ValidationResult to HealthScoreError[]
    return validation.errors.map((error, index) => ({
      field: 'unknown',
      message: error,
      code: `E${index + 1}`
    }))
  }, [])

  /**
   * Calculates health score with error handling and caching
   */
  const calculateScore = useCallback(async (input?: HealthScoreInput) => {
    if (!customer && !input) {
      setError('Customer or input data is required for health score calculation')
      return
    }

    setIsCalculating(true)
    setError(null)

    try {
      // Use provided input or generate mock data for customer
      const calculationInput = input || (customer ? generateMockHealthData(customer) : null)
      
      if (!calculationInput) {
        throw new Error('No input data available for calculation')
      }

      // Validate input data
      const validationErrors = validateInput(calculationInput)
      if (validationErrors.length > 0) {
        throw new Error(`Invalid input data: ${validationErrors.map(e => e.message).join(', ')}`)
      }

      // Simulate calculation delay for realistic UX
      const calculationDelay = Math.random() * 500 + 200 // 200-700ms

      await new Promise(resolve => {
        calculateTimeoutRef.current = setTimeout(resolve, calculationDelay)
      })

      // Check if component is still mounted
      if (!mountedRef.current) return

      // Calculate health score
      const result = calculateHealthScore(calculationInput, config)

      // Cache the result if we have a customer
      if (customer) {
        const cacheKey = getCacheKey(customer.id)
        healthScoreCache.set(cacheKey, {
          result,
          timestamp: Date.now(),
          input: calculationInput
        })
      }

      setHealthScore(result)
      setLastUpdated(new Date())
      setError(null)

    } catch (err) {
      if (!mountedRef.current) return
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate health score'
      console.error('Health score calculation error:', err)
      setError(errorMessage)
      setHealthScore(null)
    } finally {
      if (mountedRef.current) {
        setIsCalculating(false)
        setIsLoading(false)
      }
    }
  }, [customer, config, getCacheKey, validateInput])

  /**
   * Refreshes health score by clearing cache and recalculating
   */
  const refreshScore = useCallback(async () => {
    if (!customer) return

    // Clear cache for this customer
    const cacheKey = getCacheKey(customer.id)
    healthScoreCache.delete(cacheKey)

    // Recalculate
    await calculateScore()
  }, [customer, getCacheKey, calculateScore])

  /**
   * Clears all cached health scores
   */
  const clearCache = useCallback(() => {
    healthScoreCache.clear()
    setHealthScore(null)
    setLastUpdated(null)
  }, [])

  /**
   * Loads health score from cache or calculates new one
   */
  const loadHealthScore = useCallback(async () => {
    if (!customer) {
      setHealthScore(null)
      setLastUpdated(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const cacheKey = getCacheKey(customer.id)
      const cachedResult = healthScoreCache.get(cacheKey)

      // Check if we have valid cached data
      if (cachedResult && isCacheValid(cachedResult, cacheTimeout)) {
        setHealthScore(cachedResult.result)
        setLastUpdated(new Date(cachedResult.timestamp))
        setIsLoading(false)
        return
      }

      // No valid cache, calculate new score
      await calculateScore()

    } catch (err) {
      if (!mountedRef.current) return
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load health score'
      console.error('Health score loading error:', err)
      setError(errorMessage)
      setHealthScore(null)
      setIsLoading(false)
    }
  }, [customer, getCacheKey, isCacheValid, cacheTimeout, calculateScore])

  /**
   * Effect to automatically calculate/load health score when customer changes
   */
  useEffect(() => {
    if (autoCalculate) {
      loadHealthScore()
    }
  }, [autoCalculate, loadHealthScore])

  /**
   * Effect to handle customer changes
   */
  useEffect(() => {
    if (!customer) {
      setHealthScore(null)
      setError(null)
      setLastUpdated(null)
      return
    }

    // Reset state when customer changes
    setError(null)
    
    if (autoCalculate) {
      loadHealthScore()
    }
  }, [customer?.id]) // Only depend on customer ID to avoid infinite loops

  return {
    healthScore,
    isLoading,
    error,
    isCalculating,
    calculateScore,
    refreshScore,
    clearCache,
    lastUpdated
  }
}