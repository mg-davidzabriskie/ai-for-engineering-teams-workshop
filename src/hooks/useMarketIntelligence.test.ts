import { renderHook, act, waitFor } from '@testing-library/react'
import { useMarketIntelligence } from './useMarketIntelligence'
import { MarketIntelligenceData } from '@/services/MarketIntelligenceService'

// Mock the fetch function
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

const mockMarketData: MarketIntelligenceData = {
  sentiment: {
    score: 0.25,
    label: 'positive',
    confidence: 0.82
  },
  headlines: [
    {
      title: 'TechCorp announces new product line',
      source: 'TechNews',
      publishedAt: '2024-01-15T10:30:00Z',
      url: 'https://technews.com/article/1'
    },
    {
      title: 'Market analysis shows strong growth',
      source: 'Business Daily',
      publishedAt: '2024-01-15T09:15:00Z',
      url: 'https://businessdaily.com/analysis'
    },
    {
      title: 'Industry trends favor innovation',
      source: 'Innovation Weekly',
      publishedAt: '2024-01-15T08:00:00Z'
    }
  ],
  articleCount: 42,
  lastUpdated: '2024-01-15T10:30:00Z',
  company: 'TechCorp'
}

describe('useMarketIntelligence hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
    
    // Mock console methods to reduce test noise
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Initial state', () => {
    it('returns initial state correctly', () => {
      const { result } = renderHook(() => useMarketIntelligence())
      
      expect(result.current.data).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.lastFetched).toBeNull()
      expect(typeof result.current.fetchMarketIntelligence).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
    })
  })

  describe('Fetching market intelligence', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMarketData)
      } as Response)
    })

    it('fetches market intelligence successfully', async () => {
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.data).toEqual(mockMarketData)
      expect(result.current.error).toBeNull()
      expect(result.current.lastFetched).toBeTruthy()
      expect(mockFetch).toHaveBeenCalledWith('/api/market-intelligence/TechCorp')
    })

    it('handles URL encoding for company names with spaces', async () => {
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('Tech Corp Inc')
      })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(mockFetch).toHaveBeenCalledWith('/api/market-intelligence/Tech%20Corp%20Inc')
    })

    it('updates lastFetched timestamp', async () => {
      const { result } = renderHook(() => useMarketIntelligence())
      const beforeFetch = Date.now()
      
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.lastFetched).toBeGreaterThanOrEqual(beforeFetch)
      expect(result.current.lastFetched).toBeLessThanOrEqual(Date.now())
    })

    it('handles concurrent requests safely', async () => {
      const { result } = renderHook(() => useMarketIntelligence())
      
      // Start multiple concurrent requests
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
        result.current.fetchMarketIntelligence('TechCorp')
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.data).toEqual(mockMarketData)
      expect(result.current.error).toBeNull()
      // Should only make one actual fetch call due to debouncing/race condition handling
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('cancels previous request when new request is made', async () => {
      const { result } = renderHook(() => useMarketIntelligence())
      
      // Start first request
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      expect(result.current.isLoading).toBe(true)
      
      // Start second request immediately
      act(() => {
        result.current.fetchMarketIntelligence('AnotherCorp')
      })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      // Should have data for the second request
      expect(result.current.data?.company).toBe('TechCorp') // Mock data always returns TechCorp
      expect(mockFetch).toHaveBeenLastCalledWith('/api/market-intelligence/AnotherCorp')
    })
  })

  describe('Error handling', () => {
    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.data).toBeNull()
      expect(result.current.error).toBe('Failed to fetch market intelligence data')
    })

    it('handles HTTP error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Company not found', code: 'NOT_FOUND' })
      } as Response)
      
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('NonexistentCorp')
      })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.data).toBeNull()
      expect(result.current.error).toBe('Company not found')
    })

    it('handles 400 validation errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid company name', code: 'INVALID_INPUT' })
      } as Response)
      
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('')
      })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.data).toBeNull()
      expect(result.current.error).toBe('Invalid company name')
    })

    it('handles 429 rate limiting errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' })
      } as Response)
      
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.data).toBeNull()
      expect(result.current.error).toBe('Rate limit exceeded')
    })

    it('handles 500 server errors with fallback message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' })
      } as Response)
      
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.data).toBeNull()
      expect(result.current.error).toBe('Internal server error')
    })

    it('handles malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON'))
      } as Response)
      
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.data).toBeNull()
      expect(result.current.error).toBe('Failed to fetch market intelligence data')
    })

    it('clears errors successfully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })
      
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.error).toBeNull()
    })
  })

  describe('Loading states', () => {
    it('manages loading state correctly', async () => {
      let resolvePromise: (value: any) => void
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      mockFetch.mockReturnValue(slowPromise as any)
      
      const { result } = renderHook(() => useMarketIntelligence())
      
      // Before fetch
      expect(result.current.isLoading).toBe(false)
      
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      // During fetch
      expect(result.current.isLoading).toBe(true)
      
      // Resolve the promise
      resolvePromise!({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMarketData)
      })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('resets loading state on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      expect(result.current.isLoading).toBe(true)
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.error).toBeTruthy()
    })
  })

  describe('Data persistence and updates', () => {
    it('preserves data across component re-renders', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMarketData)
      } as Response)
      
      const { result, rerender } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      await waitFor(() => {
        expect(result.current.data).toEqual(mockMarketData)
      })
      
      // Re-render the hook
      rerender()
      
      // Data should still be there
      expect(result.current.data).toEqual(mockMarketData)
    })

    it('updates data when fetching new company', async () => {
      const techCorpData = mockMarketData
      const acmeData = { ...mockMarketData, company: 'AcmeCorp' }
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(techCorpData)
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(acmeData)
        } as Response)
      
      const { result } = renderHook(() => useMarketIntelligence())
      
      // Fetch first company
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      await waitFor(() => {
        expect(result.current.data?.company).toBe('TechCorp')
      })
      
      // Fetch second company
      act(() => {
        result.current.fetchMarketIntelligence('AcmeCorp')
      })
      
      await waitFor(() => {
        expect(result.current.data?.company).toBe('AcmeCorp')
      })
    })

    it('clears error when starting new request', async () => {
      // First request fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })
      
      // Second request succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMarketData)
      } as Response)
      
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      // Error should be cleared immediately when starting new request
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(true)
      
      await waitFor(() => {
        expect(result.current.data).toEqual(mockMarketData)
      })
    })
  })

  describe('Memory leaks and cleanup', () => {
    it('cleans up on unmount', async () => {
      let resolvePromise: (value: any) => void
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      mockFetch.mockReturnValue(slowPromise as any)
      
      const { result, unmount } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      expect(result.current.isLoading).toBe(true)
      
      // Unmount while request is pending
      unmount()
      
      // Resolve the promise after unmount
      resolvePromise!({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMarketData)
      })
      
      // Should not cause any warnings or errors
      await waitFor(() => {
        // Just wait for the promise to resolve
      }, { timeout: 100 })
    })

    it('handles cleanup when AbortController is available', async () => {
      // Mock AbortController
      const mockAbortController = {
        abort: jest.fn(),
        signal: { aborted: false }
      }
      
      global.AbortController = jest.fn().mockImplementation(() => mockAbortController)
      
      let resolvePromise: (value: any) => void
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      mockFetch.mockReturnValue(slowPromise as any)
      
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      // Start another request to cancel the first one
      act(() => {
        result.current.fetchMarketIntelligence('AnotherCorp')
      })
      
      // Should call abort on the previous request
      expect(mockAbortController.abort).toHaveBeenCalled()
    })
  })

  describe('Edge cases and robustness', () => {
    it('handles empty company name gracefully', async () => {
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence('')
      })
      
      // Should not make a fetch request for empty company name
      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.isLoading).toBe(false)
    })

    it('handles null/undefined company name gracefully', async () => {
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence(null as any)
      })
      
      expect(mockFetch).not.toHaveBeenCalled()
      
      act(() => {
        result.current.fetchMarketIntelligence(undefined as any)
      })
      
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('handles very long company names', async () => {
      const longCompanyName = 'A'.repeat(150)
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Company name too long' })
      } as Response)
      
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence(longCompanyName)
      })
      
      await waitFor(() => {
        expect(result.current.error).toBe('Company name too long')
      })
    })

    it('handles special characters in company names', async () => {
      const specialCharCompany = 'AT&T Inc.'
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ...mockMarketData, company: specialCharCompany })
      } as Response)
      
      const { result } = renderHook(() => useMarketIntelligence())
      
      act(() => {
        result.current.fetchMarketIntelligence(specialCharCompany)
      })
      
      await waitFor(() => {
        expect(result.current.data?.company).toBe(specialCharCompany)
      })
      
      expect(mockFetch).toHaveBeenCalledWith('/api/market-intelligence/AT%26T%20Inc.')
    })

    it('preserves state consistency during rapid successive calls', async () => {
      const { result } = renderHook(() => useMarketIntelligence())
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMarketData)
      } as Response)
      
      // Make multiple rapid calls
      act(() => {
        result.current.fetchMarketIntelligence('TechCorp')
        result.current.fetchMarketIntelligence('TechCorp')
        result.current.fetchMarketIntelligence('TechCorp')
      })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      // Should end up in a consistent state
      expect(result.current.data).toEqual(mockMarketData)
      expect(result.current.error).toBeNull()
      expect(result.current.lastFetched).toBeTruthy()
    })
  })
})