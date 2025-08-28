/**
 * Market Intelligence API - Company-specific Route
 * 
 * Secure Next.js 15 Route Handler for market intelligence data retrieval
 * Implements REST API best practices with comprehensive validation,
 * error handling, and security measures following established patterns.
 * 
 * @endpoints
 * - GET /api/market-intelligence/[company] - Retrieve market data for company
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateMockMarketData, calculateMockSentiment } from '@/data/mock-market-intelligence';
import { validatePayloadSize, sanitizeInput, getClientIP, checkRateLimit, createRateLimitResponse } from '@/middleware/security';

// Security headers for all responses
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
} as const;

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,     // Reduced limit for market intelligence API
};

// TypeScript interfaces matching the specification
interface MarketSentiment {
  score: number; // -1 to 1
  label: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0 to 1
}

interface NewsHeadline {
  title: string;
  source: string;
  publishedAt: string;
  url?: string;
}

interface MarketIntelligenceData {
  sentiment: MarketSentiment;
  headlines: NewsHeadline[];
  articleCount: number;
  lastUpdated: string;
  company: string;
}

// Company name validation helper
function validateCompanyName(company: string): { isValid: boolean; error?: string } {
  if (!company || typeof company !== 'string') {
    return { isValid: false, error: 'Company name is required' };
  }

  const sanitizedCompany = sanitizeInput(decodeURIComponent(company));
  
  if (sanitizedCompany.length === 0) {
    return { isValid: false, error: 'Company name cannot be empty' };
  }

  if (sanitizedCompany.length < 2) {
    return { isValid: false, error: 'Company name must be at least 2 characters' };
  }

  if (sanitizedCompany.length > 100) {
    return { isValid: false, error: 'Company name must not exceed 100 characters' };
  }

  // Allow alphanumeric characters, spaces, hyphens, apostrophes, periods, and common punctuation
  if (!/^[a-zA-Z0-9\s\-'\.&,()]+$/.test(sanitizedCompany)) {
    return { isValid: false, error: 'Company name contains invalid characters' };
  }

  return { isValid: true };
}

// Standard API error response format
function createErrorResponse(
  message: string,
  statusCode: number,
  errorCode?: string,
  details?: any
): NextResponse {
  const errorResponse = {
    success: false,
    error: {
      message,
      code: errorCode || 'UNKNOWN_ERROR',
      statusCode,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    },
  };

  return NextResponse.json(errorResponse, {
    status: statusCode,
    headers: SECURITY_HEADERS,
  });
}

// Success response helper
function createSuccessResponse(data: any, statusCode: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    {
      status: statusCode,
      headers: SECURITY_HEADERS,
    }
  );
}

// Simulate realistic API delay
async function simulateAPIDelay(): Promise<void> {
  const delay = Math.floor(Math.random() * 600) + 200; // 200-800ms
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * GET /api/market-intelligence/[company]
 * 
 * Retrieve market intelligence data for a specific company
 * 
 * Path Parameters:
 * - company: Company name (required, 2-100 chars, URL encoded)
 * 
 * Response Format:
 * - success: boolean
 * - data: MarketIntelligenceData
 * - timestamp: ISO string
 * 
 * @security
 * - Company name validation and sanitization
 * - Rate limiting per client IP
 * - Input sanitization to prevent XSS and injection attacks
 * - URL decoding for company names with spaces
 * - Proper error handling without information leakage
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ company: string }> }
): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(
      `market-intelligence:${clientIP}`,
      RATE_LIMIT.maxRequests,
      RATE_LIMIT.windowMs
    );

    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    // Await params (Next.js 15 requirement)
    const resolvedParams = await params;
    
    // Validate company name
    const companyValidation = validateCompanyName(resolvedParams.company);
    if (!companyValidation.isValid) {
      return createErrorResponse(
        companyValidation.error || 'Invalid company name',
        400,
        'INVALID_COMPANY_NAME'
      );
    }

    // Sanitize and decode company name
    const sanitizedCompany = sanitizeInput(decodeURIComponent(resolvedParams.company));

    // Simulate realistic API delay for workshop experience
    await simulateAPIDelay();

    try {
      // Generate mock market data
      const mockData = generateMockMarketData(sanitizedCompany);
      const sentiment = calculateMockSentiment(mockData.headlines);

      // Construct response data matching MarketIntelligenceData interface
      const marketIntelligenceData: MarketIntelligenceData = {
        sentiment: {
          score: Number(sentiment.score.toFixed(3)), // Round to 3 decimal places
          label: sentiment.label,
          confidence: Number(sentiment.confidence.toFixed(3))
        },
        headlines: mockData.headlines.map(headline => ({
          title: headline.title,
          source: headline.source,
          publishedAt: headline.publishedAt,
          url: headline.url
        })),
        articleCount: mockData.articleCount,
        lastUpdated: new Date().toISOString(),
        company: sanitizedCompany
      };

      // Log successful request for monitoring
      const responseTime = Date.now() - startTime;
      console.log(`Market intelligence request successful - Company: ${sanitizedCompany}, Response time: ${responseTime}ms, IP: ${clientIP}`);

      return createSuccessResponse(marketIntelligenceData);

    } catch (dataError) {
      console.error('Market intelligence data generation error:', dataError);
      return createErrorResponse(
        'Failed to generate market intelligence data',
        500,
        'DATA_GENERATION_ERROR'
      );
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`GET /api/market-intelligence/[company] error (${responseTime}ms):`, error);

    // Handle service errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const serviceError = error as any;
      return createErrorResponse(
        serviceError.message || 'Service error occurred',
        serviceError.statusCode || 500,
        serviceError.code || 'SERVICE_ERROR',
        serviceError.details
      );
    }

    // Handle unexpected errors
    return createErrorResponse(
      'Internal server error occurred while retrieving market intelligence',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 * 
 * Handles CORS preflight requests for the market intelligence endpoint
 * with appropriate security headers and allowed methods.
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...SECURITY_HEADERS,
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGIN || 'https://yourdomain.com'
        : 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}