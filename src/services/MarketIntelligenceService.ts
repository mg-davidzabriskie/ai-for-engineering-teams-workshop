/**
 * MarketIntelligenceService - Service layer for market intelligence operations
 * 
 * Provides market sentiment analysis and news intelligence with caching mechanism,
 * error handling, and integration with mock data generation. Designed for testability
 * with pure functions and comprehensive error tracking.
 * 
 * @implements MarketIntelligenceServiceInterface
 */

import { generateMockMarketData, calculateMockSentiment, MockHeadline } from '@/data/mock-market-intelligence';

// Service-specific types and interfaces
export interface MarketSentiment {
  score: number; // -1 to 1
  label: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0 to 1
}

export interface NewsHeadline {
  title: string;
  source: string;
  publishedAt: string;
  url?: string;
}

export interface MarketIntelligenceData {
  sentiment: MarketSentiment;
  headlines: NewsHeadline[];
  articleCount: number;
  lastUpdated: string;
  company: string;
}

export interface MarketIntelligenceCacheEntry {
  data: MarketIntelligenceData;
  timestamp: number;
  expiresAt: number;
}

export interface MarketIntelligenceServiceInterface {
  getMarketIntelligence(company: string): Promise<MarketIntelligenceData>;
  clearCache(company?: string): Promise<void>;
  getCacheStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    cacheHitRate: number;
  }>;
  validateCompanyName(company: string): ValidationResult;
  getCacheSize(): number;
  clearExpiredCache(): void;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Custom error class for market intelligence operations
export class MarketIntelligenceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MarketIntelligenceError';
  }
}

// Market intelligence service implementation
export class MarketIntelligenceService implements MarketIntelligenceServiceInterface {
  private cache: Map<string, MarketIntelligenceCacheEntry> = new Map();
  private readonly TTL_MINUTES = 10;
  private readonly TTL_MS = this.TTL_MINUTES * 60 * 1000;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private requestCount = 0;
  private cacheHits = 0;

  constructor() {
    // Start automatic cache cleanup
    this.startCacheCleanup();
  }

  /**
   * Start automatic cache cleanup process
   */
  private startCacheCleanup(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCacheCleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop automatic cache cleanup (for testing or cleanup)
   */
  public stopCacheCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Perform cache cleanup by removing expired entries
   */
  private performCacheCleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Use Array.from to convert iterator to array for compatibility
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.expiresAt <= now) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.cache.delete(key);
    });

    if (expiredKeys.length > 0) {
      console.debug(`MarketIntelligenceService: Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Generate a cache key for a company
   */
  private generateCacheKey(company: string): string {
    return company.toLowerCase().trim();
  }

  /**
   * Check if cache entry is valid and not expired
   */
  private isCacheValid(entry: MarketIntelligenceCacheEntry): boolean {
    return entry.expiresAt > Date.now();
  }

  /**
   * Create ISO timestamp string
   */
  private createTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Simulate realistic API delay (200-800ms)
   */
  private async simulateApiDelay(): Promise<void> {
    const delay = Math.floor(Math.random() * 600) + 200; // 200-800ms
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Convert MockHeadline to NewsHeadline format
   */
  private convertMockHeadline(mockHeadline: MockHeadline): NewsHeadline {
    return {
      title: mockHeadline.title,
      source: mockHeadline.source,
      publishedAt: mockHeadline.publishedAt,
      url: mockHeadline.url
    };
  }

  /**
   * Generate market intelligence data using pure functions
   */
  private generateMarketIntelligenceData(company: string): MarketIntelligenceData {
    // Generate mock market data
    const mockData = generateMockMarketData(company);
    
    // Calculate sentiment from headlines
    const sentimentAnalysis = calculateMockSentiment(mockData.headlines);
    
    // Convert headlines to proper format
    const headlines = mockData.headlines.map(headline => this.convertMockHeadline(headline));
    
    return {
      sentiment: {
        score: sentimentAnalysis.score,
        label: sentimentAnalysis.label,
        confidence: sentimentAnalysis.confidence
      },
      headlines: headlines.slice(0, 3), // Ensure exactly 3 headlines
      articleCount: mockData.articleCount,
      lastUpdated: this.createTimestamp(),
      company
    };
  }

  /**
   * Validate company name input
   */
  validateCompanyName(company: string): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if company name is provided
    if (!company || typeof company !== 'string') {
      errors.push({
        field: 'company',
        message: 'Company name is required and must be a string',
        code: 'REQUIRED_FIELD'
      });
      return { isValid: false, errors };
    }

    const trimmedCompany = company.trim();

    // Check length constraints
    if (trimmedCompany.length < 2) {
      errors.push({
        field: 'company',
        message: 'Company name must be at least 2 characters long',
        code: 'MIN_LENGTH'
      });
    } else if (trimmedCompany.length > 100) {
      errors.push({
        field: 'company',
        message: 'Company name must not exceed 100 characters',
        code: 'MAX_LENGTH'
      });
    }

    // Check for valid characters (alphanumeric and common punctuation)
    const validPattern = /^[a-zA-Z0-9\s\-'&.,()]+$/;
    if (!validPattern.test(trimmedCompany)) {
      errors.push({
        field: 'company',
        message: 'Company name contains invalid characters',
        code: 'INVALID_CHARACTERS'
      });
    }

    // Check for potentially malicious content
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /<\/?\w+>/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(trimmedCompany))) {
      errors.push({
        field: 'company',
        message: 'Company name contains potentially unsafe content',
        code: 'SECURITY_VIOLATION'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get market intelligence data for a company with caching
   */
  async getMarketIntelligence(company: string): Promise<MarketIntelligenceData> {
    this.requestCount++;

    try {
      // Validate company name
      const validation = this.validateCompanyName(company);
      if (!validation.isValid) {
        throw new MarketIntelligenceError(
          `Company name validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          'VALIDATION_FAILED',
          400,
          validation.errors
        );
      }

      const trimmedCompany = company.trim();
      const cacheKey = this.generateCacheKey(trimmedCompany);

      // Check cache first
      const cachedEntry = this.cache.get(cacheKey);
      if (cachedEntry && this.isCacheValid(cachedEntry)) {
        this.cacheHits++;
        console.debug(`MarketIntelligenceService: Cache hit for company "${trimmedCompany}"`);
        return { ...cachedEntry.data }; // Return a copy
      }

      // Simulate API delay
      await this.simulateApiDelay();

      // Generate fresh market intelligence data
      const marketData = this.generateMarketIntelligenceData(trimmedCompany);

      // Cache the result
      const now = Date.now();
      const cacheEntry: MarketIntelligenceCacheEntry = {
        data: marketData,
        timestamp: now,
        expiresAt: now + this.TTL_MS
      };

      this.cache.set(cacheKey, cacheEntry);

      console.debug(`MarketIntelligenceService: Generated and cached new data for company "${trimmedCompany}"`);

      // Trigger cleanup if cache is getting large
      if (this.cache.size > 100) {
        this.performCacheCleanup();
      }

      return { ...marketData }; // Return a copy

    } catch (error) {
      // Re-throw MarketIntelligenceError instances
      if (error instanceof MarketIntelligenceError) {
        throw error;
      }

      // Wrap other errors
      throw new MarketIntelligenceError(
        `Failed to get market intelligence for company "${company}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_MARKET_INTELLIGENCE_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Clear cache entries (optionally for a specific company)
   */
  async clearCache(company?: string): Promise<void> {
    try {
      if (company) {
        // Clear cache for specific company
        const cacheKey = this.generateCacheKey(company.trim());
        const deleted = this.cache.delete(cacheKey);
        console.debug(`MarketIntelligenceService: ${deleted ? 'Cleared' : 'No'} cache entry for company "${company}"`);
      } else {
        // Clear all cache entries
        const entriesBefore = this.cache.size;
        this.cache.clear();
        console.debug(`MarketIntelligenceService: Cleared ${entriesBefore} cache entries`);
      }

      // Reset cache statistics if clearing all
      if (!company) {
        this.requestCount = 0;
        this.cacheHits = 0;
      }

    } catch (error) {
      throw new MarketIntelligenceError(
        `Failed to clear cache${company ? ` for company "${company}"` : ''}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CACHE_CLEAR_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Get cache statistics for monitoring and debugging
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    cacheHitRate: number;
  }> {
    try {
      const now = Date.now();
      let expiredCount = 0;

      // Use Array.from to convert iterator to array for compatibility
      Array.from(this.cache.values()).forEach(entry => {
        if (entry.expiresAt <= now) {
          expiredCount++;
        }
      });

      const cacheHitRate = this.requestCount > 0 ? this.cacheHits / this.requestCount : 0;

      return {
        totalEntries: this.cache.size,
        expiredEntries: expiredCount,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100 // Round to 2 decimal places
      };

    } catch (error) {
      throw new MarketIntelligenceError(
        `Failed to get cache statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CACHE_STATS_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Get cache size for monitoring
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get service health information for monitoring
   */
  async getServiceInfo(): Promise<{
    cacheSize: number;
    requestCount: number;
    cacheHitRate: number;
    ttlMinutes: number;
    isCleanupActive: boolean;
  }> {
    try {
      const cacheHitRate = this.requestCount > 0 ? this.cacheHits / this.requestCount : 0;

      return {
        cacheSize: this.cache.size,
        requestCount: this.requestCount,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        ttlMinutes: this.TTL_MINUTES,
        isCleanupActive: this.cleanupInterval !== null
      };

    } catch (error) {
      throw new MarketIntelligenceError(
        `Failed to get service information: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SERVICE_INFO_FAILED',
        500,
        error
      );
    }
  }
}

// Export singleton instance for use throughout the application
export const marketIntelligenceService = new MarketIntelligenceService();

// Export default as the singleton instance
export default marketIntelligenceService;