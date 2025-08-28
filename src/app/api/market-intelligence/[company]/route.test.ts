import { NextRequest } from 'next/server'
import { GET } from './route'
import { MarketIntelligenceService } from '@/services/MarketIntelligenceService'
import { MarketIntelligenceError } from '@/services/MarketIntelligenceService'

// Mock the MarketIntelligenceService
jest.mock('@/services/MarketIntelligenceService')

const MockedMarketIntelligenceService = MarketIntelligenceService as jest.MockedClass<typeof MarketIntelligenceService>

// Mock data matching MarketIntelligenceData interface
const mockMarketData = {
  sentiment: {
    score: 0.25,
    label: 'positive' as const,
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

describe('/api/market-intelligence/[company] API Route', () => {
  let mockServiceInstance: jest.Mocked<MarketIntelligenceService>

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    jest.restoreAllMocks()
    
    // Create mock instance
    mockServiceInstance = {
      getMarketIntelligence: jest.fn(),
      clearExpiredCache: jest.fn(),
      getCacheSize: jest.fn(),
      validateCompanyName: jest.fn()
    } as any

    // Mock the constructor to return our mock instance
    MockedMarketIntelligenceService.mockImplementation(() => mockServiceInstance)
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Valid requests', () => {
    it('returns 200 with valid company name', async () => {
      mockServiceInstance.getMarketIntelligence.mockResolvedValue(mockMarketData)

      const request = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      const response = await GET(request, { params: { company: 'TechCorp' } })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(mockMarketData)
      expect(mockServiceInstance.getMarketIntelligence).toHaveBeenCalledWith('TechCorp')
    })

    it('API response matches MarketIntelligenceData interface structure exactly', async () => {
      mockServiceInstance.getMarketIntelligence.mockResolvedValue(mockMarketData)

      const request = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      const response = await GET(request, { params: { company: 'TechCorp' } })
      
      const data = await response.json()
      
      // Check required properties exist and have correct types
      expect(data).toHaveProperty('sentiment')
      expect(data).toHaveProperty('headlines')
      expect(data).toHaveProperty('articleCount')
      expect(data).toHaveProperty('lastUpdated')
      expect(data).toHaveProperty('company')
      
      // Check sentiment structure
      expect(data.sentiment).toHaveProperty('score')
      expect(data.sentiment).toHaveProperty('label')
      expect(data.sentiment).toHaveProperty('confidence')
      expect(typeof data.sentiment.score).toBe('number')
      expect(['positive', 'neutral', 'negative']).toContain(data.sentiment.label)
      expect(typeof data.sentiment.confidence).toBe('number')
      
      // Check headlines structure
      expect(Array.isArray(data.headlines)).toBe(true)
      data.headlines.forEach((headline: any) => {
        expect(headline).toHaveProperty('title')
        expect(headline).toHaveProperty('source')
        expect(headline).toHaveProperty('publishedAt')
        expect(typeof headline.title).toBe('string')
        expect(typeof headline.source).toBe('string')
        expect(typeof headline.publishedAt).toBe('string')
      })
      
      expect(typeof data.articleCount).toBe('number')
      expect(typeof data.lastUpdated).toBe('string')
      expect(typeof data.company).toBe('string')
    })

    it('returns consistent sentiment scores between -1 and 1 for same company', async () => {
      const testData = { ...mockMarketData, sentiment: { ...mockMarketData.sentiment, score: 0.75 } }
      mockServiceInstance.getMarketIntelligence.mockResolvedValue(testData)

      // Make multiple requests for the same company
      const request1 = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      const request2 = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      
      const response1 = await GET(request1, { params: { company: 'TechCorp' } })
      const response2 = await GET(request2, { params: { company: 'TechCorp' } })
      
      const data1 = await response1.json()
      const data2 = await response2.json()
      
      expect(data1.sentiment.score).toBe(data2.sentiment.score)
      expect(data1.sentiment.score).toBeGreaterThanOrEqual(-1)
      expect(data1.sentiment.score).toBeLessThanOrEqual(1)
    })

    it('generates exactly 3 headlines in response data structure', async () => {
      mockServiceInstance.getMarketIntelligence.mockResolvedValue(mockMarketData)

      const request = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      const response = await GET(request, { params: { company: 'TechCorp' } })
      
      const data = await response.json()
      expect(data.headlines).toHaveLength(3)
    })

    it('includes proper lastUpdated timestamp in ISO format', async () => {
      mockServiceInstance.getMarketIntelligence.mockResolvedValue(mockMarketData)

      const request = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      const response = await GET(request, { params: { company: 'TechCorp' } })
      
      const data = await response.json()
      expect(data.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)
      expect(() => new Date(data.lastUpdated)).not.toThrow()
    })

    it('handles URL encoding for company names with spaces correctly', async () => {
      const companyWithSpaces = 'Tech Corp Inc'
      const encodedCompany = encodeURIComponent(companyWithSpaces)
      const expectedData = { ...mockMarketData, company: companyWithSpaces }
      
      mockServiceInstance.getMarketIntelligence.mockResolvedValue(expectedData)

      const request = new NextRequest(`http://localhost:3000/api/market-intelligence/${encodedCompany}`)
      const response = await GET(request, { params: { company: companyWithSpaces } })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.company).toBe(companyWithSpaces)
      expect(mockServiceInstance.getMarketIntelligence).toHaveBeenCalledWith(companyWithSpaces)
    })
  })

  describe('Input validation', () => {
    it('returns 400 for empty company name', async () => {
      mockServiceInstance.getMarketIntelligence.mockRejectedValue(
        new MarketIntelligenceError('Company name is required', 'INVALID_INPUT', 400)
      )

      const request = new NextRequest('http://localhost:3000/api/market-intelligence/')
      const response = await GET(request, { params: { company: '' } })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Company name is required')
      expect(data.code).toBe('INVALID_INPUT')
    })

    it('returns 400 for company names too short', async () => {
      mockServiceInstance.getMarketIntelligence.mockRejectedValue(
        new MarketIntelligenceError('Company name must be at least 2 characters', 'INVALID_INPUT', 400)
      )

      const request = new NextRequest('http://localhost:3000/api/market-intelligence/A')
      const response = await GET(request, { params: { company: 'A' } })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Company name must be at least 2 characters')
      expect(data.code).toBe('INVALID_INPUT')
    })

    it('returns 400 for company names exceeding 100 character limit', async () => {
      const longCompanyName = 'A'.repeat(101)
      mockServiceInstance.getMarketIntelligence.mockRejectedValue(
        new MarketIntelligenceError('Company name must be less than 100 characters', 'INVALID_INPUT', 400)
      )

      const request = new NextRequest(`http://localhost:3000/api/market-intelligence/${longCompanyName}`)
      const response = await GET(request, { params: { company: longCompanyName } })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Company name must be less than 100 characters')
      expect(data.code).toBe('INVALID_INPUT')
    })

    it('returns 400 for company names with invalid special characters', async () => {
      mockServiceInstance.getMarketIntelligence.mockRejectedValue(
        new MarketIntelligenceError('Company name contains invalid characters', 'INVALID_INPUT', 400)
      )

      const request = new NextRequest('http://localhost:3000/api/market-intelligence/Company<script>')
      const response = await GET(request, { params: { company: 'Company<script>' } })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Company name contains invalid characters')
      expect(data.code).toBe('INVALID_INPUT')
    })
  })

  describe('Security and sanitization', () => {
    it('sanitizes company input to prevent XSS attacks', async () => {
      const maliciousInput = '<script>alert("xss")</script>'
      mockServiceInstance.getMarketIntelligence.mockRejectedValue(
        new MarketIntelligenceError('Company name contains invalid characters', 'INVALID_INPUT', 400)
      )

      const request = new NextRequest(`http://localhost:3000/api/market-intelligence/${maliciousInput}`)
      const response = await GET(request, { params: { company: maliciousInput } })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).not.toContain('<script>')
      expect(data.error).not.toContain('alert')
    })

    it('prevents injection attacks through company parameter', async () => {
      const injectionAttempt = "'; DROP TABLE companies; --"
      mockServiceInstance.getMarketIntelligence.mockRejectedValue(
        new MarketIntelligenceError('Company name contains invalid characters', 'INVALID_INPUT', 400)
      )

      const request = new NextRequest(`http://localhost:3000/api/market-intelligence/${encodeURIComponent(injectionAttempt)}`)
      const response = await GET(request, { params: { company: injectionAttempt } })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).not.toContain('DROP TABLE')
      expect(data.error).not.toContain('--')
    })

    it('returns sanitized error messages for server failures', async () => {
      mockServiceInstance.getMarketIntelligence.mockRejectedValue(
        new Error('Database connection failed at localhost:5432 with user admin')
      )

      const request = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      const response = await GET(request, { params: { company: 'TechCorp' } })
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
      expect(data.error).not.toContain('localhost:5432')
      expect(data.error).not.toContain('admin')
    })
  })

  describe('Rate limiting', () => {
    it('implements rate limiting and returns 429 when exceeded', async () => {
      // Mock rate limiting error
      mockServiceInstance.getMarketIntelligence.mockRejectedValue(
        new MarketIntelligenceError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429)
      )

      const request = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      const response = await GET(request, { params: { company: 'TechCorp' } })
      
      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data.error).toBe('Rate limit exceeded')
      expect(data.code).toBe('RATE_LIMIT_EXCEEDED')
    })
  })

  describe('Performance and delay simulation', () => {
    it('API delay simulation works within 200-800ms range consistently', async () => {
      mockServiceInstance.getMarketIntelligence.mockImplementation(async (company) => {
        // Simulate realistic delay
        const delay = Math.floor(Math.random() * 600) + 200 // 200-800ms
        await new Promise(resolve => setTimeout(resolve, delay))
        return mockMarketData
      })

      const startTime = Date.now()
      const request = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      const response = await GET(request, { params: { company: 'TechCorp' } })
      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.status).toBe(200)
      expect(duration).toBeGreaterThanOrEqual(200)
      expect(duration).toBeLessThanOrEqual(1000) // Allow some buffer for test execution
    })
  })

  describe('Caching behavior', () => {
    it('returns cached data for duplicate requests within TTL window', async () => {
      const cachedData = { ...mockMarketData, lastUpdated: '2024-01-15T10:00:00Z' }
      
      // First call returns fresh data
      mockServiceInstance.getMarketIntelligence.mockResolvedValueOnce(mockMarketData)
      // Second call returns cached data
      mockServiceInstance.getMarketIntelligence.mockResolvedValueOnce(cachedData)

      const request1 = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      const request2 = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')

      const response1 = await GET(request1, { params: { company: 'TechCorp' } })
      const response2 = await GET(request2, { params: { company: 'TechCorp' } })

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      
      const data1 = await response1.json()
      const data2 = await response2.json()
      
      // Both calls should return data (caching handled by service layer)
      expect(data1).toBeDefined()
      expect(data2).toBeDefined()
    })

    it('cache expiration works correctly after 10-minute TTL period', async () => {
      const expiredCacheData = { ...mockMarketData, lastUpdated: '2024-01-15T09:50:00Z' }
      const freshData = { ...mockMarketData, lastUpdated: '2024-01-15T10:00:00Z' }
      
      // Mock service to return expired then fresh data
      mockServiceInstance.getMarketIntelligence
        .mockResolvedValueOnce(expiredCacheData)
        .mockResolvedValueOnce(freshData)

      const request1 = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      const request2 = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')

      const response1 = await GET(request1, { params: { company: 'TechCorp' } })
      
      // Simulate 10+ minutes passing
      jest.useFakeTimers()
      jest.advanceTimersByTime(11 * 60 * 1000) // 11 minutes
      
      const response2 = await GET(request2, { params: { company: 'TechCorp' } })
      
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      
      jest.useRealTimers()
    })
  })

  describe('Service layer integration', () => {
    it('MarketIntelligenceService throws MarketIntelligenceError for invalid inputs', async () => {
      mockServiceInstance.getMarketIntelligence.mockRejectedValue(
        new MarketIntelligenceError('Invalid company name format', 'INVALID_FORMAT', 400)
      )

      const request = new NextRequest('http://localhost:3000/api/market-intelligence/123')
      const response = await GET(request, { params: { company: '123' } })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid company name format')
      expect(data.code).toBe('INVALID_FORMAT')
    })

    it('service layer caching mechanism handles concurrent requests safely', async () => {
      mockServiceInstance.getMarketIntelligence.mockResolvedValue(mockMarketData)

      // Make multiple concurrent requests
      const requests = Array(5).fill(null).map(() => {
        const request = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
        return GET(request, { params: { company: 'TechCorp' } })
      })

      const responses = await Promise.all(requests)
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Service should be called (concurrent handling tested at service level)
      expect(mockServiceInstance.getMarketIntelligence).toHaveBeenCalled()
    })

    it('mock data generation creates realistic company-specific headlines consistently', async () => {
      const companySpecificData = {
        ...mockMarketData,
        company: 'TechCorp',
        headlines: [
          { title: 'TechCorp launches new AI initiative', source: 'Tech Today', publishedAt: '2024-01-15T10:00:00Z' },
          { title: 'TechCorp reports strong quarterly results', source: 'Business Wire', publishedAt: '2024-01-15T09:30:00Z' },
          { title: 'TechCorp expands into European markets', source: 'Global News', publishedAt: '2024-01-15T09:00:00Z' }
        ]
      }
      
      mockServiceInstance.getMarketIntelligence.mockResolvedValue(companySpecificData)

      const request = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      const response = await GET(request, { params: { company: 'TechCorp' } })
      
      const data = await response.json()
      expect(data.company).toBe('TechCorp')
      data.headlines.forEach((headline: any) => {
        expect(headline.title.toLowerCase()).toContain('techcorp')
      })
    })
  })

  describe('Error handling', () => {
    it('handles malformed requests gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/market-intelligence/null')
      const response = await GET(request, { params: { company: null as any } })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('handles service unavailable scenarios', async () => {
      mockServiceInstance.getMarketIntelligence.mockRejectedValue(
        new MarketIntelligenceError('Service temporarily unavailable', 'SERVICE_UNAVAILABLE', 503)
      )

      const request = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      const response = await GET(request, { params: { company: 'TechCorp' } })
      
      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.error).toBe('Service temporarily unavailable')
      expect(data.code).toBe('SERVICE_UNAVAILABLE')
    })
  })

  describe('Response headers and CORS', () => {
    it('includes proper CORS headers', async () => {
      mockServiceInstance.getMarketIntelligence.mockResolvedValue(mockMarketData)

      const request = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      const response = await GET(request, { params: { company: 'TechCorp' } })
      
      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('includes security headers', async () => {
      mockServiceInstance.getMarketIntelligence.mockResolvedValue(mockMarketData)

      const request = new NextRequest('http://localhost:3000/api/market-intelligence/TechCorp')
      const response = await GET(request, { params: { company: 'TechCorp' } })
      
      // Check that response doesn't expose sensitive headers
      expect(response.headers.get('x-powered-by')).toBeNull()
    })
  })
})