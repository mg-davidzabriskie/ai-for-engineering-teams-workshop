import { MarketIntelligenceService, MarketIntelligenceError } from './MarketIntelligenceService'
import { MarketIntelligenceData, MarketIntelligenceCacheEntry } from './MarketIntelligenceService'

// Mock the mock data import
jest.mock('@/data/mock-market-intelligence', () => ({
  generateMarketIntelligence: jest.fn()
}))

import { generateMarketIntelligence } from '@/data/mock-market-intelligence'

const mockGenerateMarketIntelligence = generateMarketIntelligence as jest.MockedFunction<typeof generateMarketIntelligence>

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

describe('MarketIntelligenceService', () => {
  let service: MarketIntelligenceService

  beforeEach(() => {
    service = new MarketIntelligenceService()
    jest.clearAllMocks()
    mockGenerateMarketIntelligence.mockResolvedValue(mockMarketData)
    
    // Mock timers for cache testing
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15T10:30:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  describe('Company name validation', () => {
    it('validates company name correctly for valid input', () => {
      expect(() => service.validateCompanyName('TechCorp')).not.toThrow()
      expect(() => service.validateCompanyName('Tech Corp Inc')).not.toThrow()
      expect(() => service.validateCompanyName('ABC-123 Corp.')).not.toThrow()
    })

    it('throws error for empty company name', () => {
      expect(() => service.validateCompanyName('')).toThrow(MarketIntelligenceError)
      expect(() => service.validateCompanyName('')).toThrow('Company name is required')
    })

    it('throws error for null or undefined company name', () => {
      expect(() => service.validateCompanyName(null as any)).toThrow(MarketIntelligenceError)
      expect(() => service.validateCompanyName(undefined as any)).toThrow(MarketIntelligenceError)
    })

    it('throws error for company name too short', () => {
      expect(() => service.validateCompanyName('A')).toThrow(MarketIntelligenceError)
      expect(() => service.validateCompanyName('A')).toThrow('Company name must be at least 2 characters')
    })

    it('throws error for company name too long', () => {
      const longName = 'A'.repeat(101)
      expect(() => service.validateCompanyName(longName)).toThrow(MarketIntelligenceError)
      expect(() => service.validateCompanyName(longName)).toThrow('Company name must be less than 100 characters')
    })

    it('throws error for invalid characters in company name', () => {
      expect(() => service.validateCompanyName('Company<script>')).toThrow(MarketIntelligenceError)
      expect(() => service.validateCompanyName('Company">')).toThrow(MarketIntelligenceError)
      expect(() => service.validateCompanyName("Company'; DROP TABLE")).toThrow(MarketIntelligenceError)
    })

    it('allows valid special characters', () => {
      expect(() => service.validateCompanyName('AT&T')).not.toThrow()
      expect(() => service.validateCompanyName('Johnson & Johnson')).not.toThrow()
      expect(() => service.validateCompanyName('Coca-Cola Co.')).not.toThrow()
      expect(() => service.validateCompanyName('3M Company')).not.toThrow()
    })
  })

  describe('Market intelligence fetching', () => {
    it('fetches market intelligence for valid company', async () => {
      const result = await service.getMarketIntelligence('TechCorp')
      
      expect(result).toEqual(mockMarketData)
      expect(mockGenerateMarketIntelligence).toHaveBeenCalledWith('TechCorp')
    })

    it('returns data with correct interface structure', async () => {
      const result = await service.getMarketIntelligence('TechCorp')
      
      // Check required properties
      expect(result).toHaveProperty('sentiment')
      expect(result).toHaveProperty('headlines')
      expect(result).toHaveProperty('articleCount')
      expect(result).toHaveProperty('lastUpdated')
      expect(result).toHaveProperty('company')
      
      // Check sentiment structure
      expect(result.sentiment).toHaveProperty('score')
      expect(result.sentiment).toHaveProperty('label')
      expect(result.sentiment).toHaveProperty('confidence')
      
      // Check headlines structure
      expect(Array.isArray(result.headlines)).toBe(true)
      expect(result.headlines).toHaveLength(3)
      
      result.headlines.forEach(headline => {
        expect(headline).toHaveProperty('title')
        expect(headline).toHaveProperty('source')
        expect(headline).toHaveProperty('publishedAt')
      })
    })

    it('handles API delay simulation', async () => {
      const startTime = Date.now()
      
      // Mock delay in the data generation
      mockGenerateMarketIntelligence.mockImplementation(async (company) => {
        await new Promise(resolve => setTimeout(resolve, 300))
        return mockMarketData
      })
      
      await service.getMarketIntelligence('TechCorp')
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(300)
    })

    it('throws MarketIntelligenceError for invalid input', async () => {
      await expect(service.getMarketIntelligence('')).rejects.toThrow(MarketIntelligenceError)
      await expect(service.getMarketIntelligence('<script>')).rejects.toThrow(MarketIntelligenceError)
    })

    it('handles service errors gracefully', async () => {
      mockGenerateMarketIntelligence.mockRejectedValue(new Error('Service failure'))
      
      await expect(service.getMarketIntelligence('TechCorp')).rejects.toThrow(MarketIntelligenceError)
    })
  })

  describe('Caching mechanism', () => {
    it('caches successful responses', async () => {
      // First call
      const result1 = await service.getMarketIntelligence('TechCorp')
      
      // Second call should use cache
      const result2 = await service.getMarketIntelligence('TechCorp')
      
      expect(result1).toEqual(result2)
      expect(mockGenerateMarketIntelligence).toHaveBeenCalledTimes(1)
    })

    it('returns cached data within TTL window', async () => {
      // First call
      await service.getMarketIntelligence('TechCorp')
      
      // Advance time by 5 minutes (less than 10-minute TTL)
      jest.advanceTimersByTime(5 * 60 * 1000)
      
      // Second call should use cache
      const result = await service.getMarketIntelligence('TechCorp')
      
      expect(result).toEqual(mockMarketData)
      expect(mockGenerateMarketIntelligence).toHaveBeenCalledTimes(1)
    })

    it('refreshes cache after TTL expiration', async () => {
      // First call
      await service.getMarketIntelligence('TechCorp')
      
      // Advance time by 11 minutes (past 10-minute TTL)
      jest.advanceTimersByTime(11 * 60 * 1000)
      
      // Mock fresh data
      const freshData = { ...mockMarketData, lastUpdated: '2024-01-15T10:41:00Z' }
      mockGenerateMarketIntelligence.mockResolvedValueOnce(freshData)
      
      // Second call should fetch fresh data
      const result = await service.getMarketIntelligence('TechCorp')
      
      expect(result.lastUpdated).toBe('2024-01-15T10:41:00Z')
      expect(mockGenerateMarketIntelligence).toHaveBeenCalledTimes(2)
    })

    it('handles concurrent requests safely', async () => {
      const promises = Array(5).fill(null).map(() => 
        service.getMarketIntelligence('TechCorp')
      )
      
      const results = await Promise.all(promises)
      
      // All results should be the same
      results.forEach(result => {
        expect(result).toEqual(mockMarketData)
      })
      
      // Should only call the generator once due to caching
      expect(mockGenerateMarketIntelligence).toHaveBeenCalledTimes(1)
    })

    it('caches different companies separately', async () => {
      const techCorpData = mockMarketData
      const acmeData = { ...mockMarketData, company: 'AcmeCorp' }
      
      mockGenerateMarketIntelligence
        .mockResolvedValueOnce(techCorpData)
        .mockResolvedValueOnce(acmeData)
      
      const result1 = await service.getMarketIntelligence('TechCorp')
      const result2 = await service.getMarketIntelligence('AcmeCorp')
      
      expect(result1.company).toBe('TechCorp')
      expect(result2.company).toBe('AcmeCorp')
      expect(mockGenerateMarketIntelligence).toHaveBeenCalledTimes(2)
    })

    it('clears expired cache entries', () => {
      // Create cache entries with different expiration times
      const cache = (service as any).cache
      const now = Date.now()
      
      cache.set('ExpiredCompany', {
        data: mockMarketData,
        timestamp: now - 11 * 60 * 1000,
        expiresAt: now - 1 * 60 * 1000
      })
      
      cache.set('ValidCompany', {
        data: mockMarketData,
        timestamp: now - 5 * 60 * 1000,
        expiresAt: now + 5 * 60 * 1000
      })
      
      service.clearExpiredCache()
      
      expect(cache.has('ExpiredCompany')).toBe(false)
      expect(cache.has('ValidCompany')).toBe(true)
    })

    it('provides cache size information', async () => {
      expect(service.getCacheSize()).toBe(0)
      
      await service.getMarketIntelligence('TechCorp')
      expect(service.getCacheSize()).toBe(1)
      
      await service.getMarketIntelligence('AcmeCorp')
      expect(service.getCacheSize()).toBe(2)
    })
  })

  describe('Error handling', () => {
    it('throws MarketIntelligenceError with proper error codes', async () => {
      try {
        await service.getMarketIntelligence('')
      } catch (error) {
        expect(error).toBeInstanceOf(MarketIntelligenceError)
        expect((error as MarketIntelligenceError).code).toBe('INVALID_INPUT')
        expect((error as MarketIntelligenceError).statusCode).toBe(400)
      }
    })

    it('handles rate limiting scenarios', async () => {
      mockGenerateMarketIntelligence.mockRejectedValue(
        new Error('Rate limit exceeded')
      )
      
      try {
        await service.getMarketIntelligence('TechCorp')
      } catch (error) {
        expect(error).toBeInstanceOf(MarketIntelligenceError)
        expect((error as MarketIntelligenceError).message).toContain('Failed to fetch market intelligence')
      }
    })

    it('preserves original error context for debugging', async () => {
      const originalError = new Error('Network timeout')
      mockGenerateMarketIntelligence.mockRejectedValue(originalError)
      
      try {
        await service.getMarketIntelligence('TechCorp')
      } catch (error) {
        expect(error).toBeInstanceOf(MarketIntelligenceError)
        expect((error as MarketIntelligenceError).message).toContain('Failed to fetch market intelligence')
      }
    })

    it('handles malformed data responses', async () => {
      mockGenerateMarketIntelligence.mockResolvedValue(null as any)
      
      await expect(service.getMarketIntelligence('TechCorp')).rejects.toThrow(MarketIntelligenceError)
    })

    it('validates response data structure', async () => {
      const invalidData = {
        sentiment: { score: 'invalid' }, // Invalid score type
        headlines: [],
        articleCount: -1, // Invalid count
        lastUpdated: 'invalid-date',
        company: ''
      }
      
      mockGenerateMarketIntelligence.mockResolvedValue(invalidData as any)
      
      await expect(service.getMarketIntelligence('TechCorp')).rejects.toThrow(MarketIntelligenceError)
    })
  })

  describe('Data consistency and reliability', () => {
    it('generates consistent sentiment scores for same company', async () => {
      const results = await Promise.all([
        service.getMarketIntelligence('TechCorp'),
        service.getMarketIntelligence('TechCorp'),
        service.getMarketIntelligence('TechCorp')
      ])
      
      const scores = results.map(r => r.sentiment.score)
      expect(scores.every(score => score === scores[0])).toBe(true)
    })

    it('ensures sentiment scores are within valid range', async () => {
      const result = await service.getMarketIntelligence('TechCorp')
      
      expect(result.sentiment.score).toBeGreaterThanOrEqual(-1)
      expect(result.sentiment.score).toBeLessThanOrEqual(1)
      expect(result.sentiment.confidence).toBeGreaterThanOrEqual(0)
      expect(result.sentiment.confidence).toBeLessThanOrEqual(1)
    })

    it('generates exactly 3 headlines consistently', async () => {
      const result = await service.getMarketIntelligence('TechCorp')
      
      expect(result.headlines).toHaveLength(3)
      expect(result.headlines.every(h => h.title && h.source && h.publishedAt)).toBe(true)
    })

    it('creates company-specific headlines', async () => {
      const result = await service.getMarketIntelligence('TechCorp')
      
      expect(result.company).toBe('TechCorp')
      // Check that at least some headlines mention the company
      const hasCompanyMention = result.headlines.some(headline => 
        headline.title.toLowerCase().includes('techcorp')
      )
      expect(hasCompanyMention).toBe(true)
    })

    it('provides valid ISO timestamps', async () => {
      const result = await service.getMarketIntelligence('TechCorp')
      
      expect(() => new Date(result.lastUpdated)).not.toThrow()
      expect(result.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)
      
      result.headlines.forEach(headline => {
        expect(() => new Date(headline.publishedAt)).not.toThrow()
        expect(headline.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)
      })
    })

    it('provides reasonable article counts', async () => {
      const result = await service.getMarketIntelligence('TechCorp')
      
      expect(result.articleCount).toBeGreaterThan(0)
      expect(result.articleCount).toBeLessThan(1000) // Reasonable upper bound
      expect(Number.isInteger(result.articleCount)).toBe(true)
    })
  })

  describe('Memory management', () => {
    it('limits cache size to prevent memory leaks', async () => {
      // Generate many different company requests
      const companies = Array(100).fill(null).map((_, i) => `Company${i}`)
      
      for (const company of companies.slice(0, 50)) {
        mockGenerateMarketIntelligence.mockResolvedValueOnce({
          ...mockMarketData,
          company
        })
        await service.getMarketIntelligence(company)
      }
      
      const cacheSize = service.getCacheSize()
      expect(cacheSize).toBeLessThanOrEqual(50) // Should not exceed reasonable limits
    })

    it('cleans up expired entries automatically', async () => {
      await service.getMarketIntelligence('TechCorp')
      
      // Advance time past TTL
      jest.advanceTimersByTime(11 * 60 * 1000)
      
      // Clear expired entries
      service.clearExpiredCache()
      
      expect(service.getCacheSize()).toBe(0)
    })
  })

  describe('Performance characteristics', () => {
    it('responds quickly for cached data', async () => {
      // First call to populate cache
      await service.getMarketIntelligence('TechCorp')
      
      // Second call should be fast (cached)
      const startTime = Date.now()
      await service.getMarketIntelligence('TechCorp')
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(50) // Should be very fast for cached data
    })

    it('handles high concurrency without data corruption', async () => {
      const concurrentRequests = 20
      const promises = Array(concurrentRequests).fill(null).map(() => 
        service.getMarketIntelligence('TechCorp')
      )
      
      const results = await Promise.all(promises)
      
      // All results should be identical and valid
      results.forEach(result => {
        expect(result).toEqual(mockMarketData)
        expect(result.sentiment.score).toBeGreaterThanOrEqual(-1)
        expect(result.sentiment.score).toBeLessThanOrEqual(1)
      })
    })
  })
})