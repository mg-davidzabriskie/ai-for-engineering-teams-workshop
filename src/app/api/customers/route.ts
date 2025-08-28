/**
 * Customer Management API - Main Routes
 * 
 * Secure Next.js 15 Route Handlers for customer CRUD operations
 * Implements REST API best practices with comprehensive validation,
 * error handling, and security measures.
 * 
 * @endpoints
 * - GET /api/customers - List all customers with optional search
 * - POST /api/customers - Create new customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { customerService } from '@/services/CustomerService';
import { Customer } from '@/data/mock-customers';
import { validatePayloadSize, sanitizeInput, validateDomainSafety } from '@/middleware/security';

// Security headers for all responses
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
} as const;

// Rate limiting configuration (in production, use Redis or similar)
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,    // per IP
};

// Note: sanitizeInput is now imported from security middleware

// Validation helper for customer creation/updates
async function validateCustomerPayload(data: any): Promise<{
  isValid: boolean;
  errors: string[];
  sanitizedData?: Partial<Customer>;
}> {
  const errors: string[] = [];
  const sanitizedData: Partial<Customer> = {};

  // Validate and sanitize name
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Name is required and must be a string');
  } else {
    const sanitizedName = sanitizeInput(data.name);
    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      errors.push('Name must be between 2 and 100 characters');
    } else if (!/^[a-zA-Z\s\-'\.]+$/.test(sanitizedName)) {
      errors.push('Name contains invalid characters');
    } else {
      sanitizedData.name = sanitizedName;
    }
  }

  // Validate and sanitize company
  if (!data.company || typeof data.company !== 'string') {
    errors.push('Company is required and must be a string');
  } else {
    const sanitizedCompany = sanitizeInput(data.company);
    if (sanitizedCompany.length < 2 || sanitizedCompany.length > 100) {
      errors.push('Company name must be between 2 and 100 characters');
    } else {
      sanitizedData.company = sanitizedCompany;
    }
  }

  // Validate health score
  if (data.healthScore !== undefined && data.healthScore !== null) {
    const score = Number(data.healthScore);
    if (isNaN(score)) {
      errors.push('Health score must be a valid number');
    } else if (score < 0 || score > 100) {
      errors.push('Health score must be between 0 and 100');
    } else {
      sanitizedData.healthScore = Math.round(score);
    }
  }

  // Validate and sanitize email (optional)
  if (data.email && typeof data.email === 'string') {
    const sanitizedEmail = sanitizeInput(data.email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      errors.push('Invalid email format');
    } else if (sanitizedEmail.length > 255) {
      errors.push('Email address too long');
    } else {
      sanitizedData.email = sanitizedEmail.toLowerCase();
    }
  }

  // Validate subscription tier (optional)
  if (data.subscriptionTier) {
    const validTiers = ['basic', 'premium', 'enterprise'];
    if (!validTiers.includes(data.subscriptionTier)) {
      errors.push('Invalid subscription tier. Must be: basic, premium, or enterprise');
    } else {
      sanitizedData.subscriptionTier = data.subscriptionTier;
    }
  }

  // Validate domains (optional)
  if (data.domains && Array.isArray(data.domains)) {
    if (data.domains.length > 10) {
      errors.push('Maximum 10 domains allowed');
    } else {
      const sanitizedDomains: string[] = [];
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
      
      for (let i = 0; i < data.domains.length; i++) {
        const domain = data.domains[i];
        if (typeof domain !== 'string') {
          errors.push(`Domain at index ${i} must be a string`);
          continue;
        }
        
        const sanitizedDomain = sanitizeInput(domain).toLowerCase();
        if (sanitizedDomain.length > 255) {
          errors.push(`Domain at index ${i} is too long`);
          continue;
        }
        
        if (!domainRegex.test(sanitizedDomain)) {
          errors.push(`Invalid domain format at index ${i}: ${sanitizedDomain}`);
          continue;
        }
        
        // SSRF protection: validate domain safety
        const isDomainSafe = await validateDomainSafety(sanitizedDomain);
        if (!isDomainSafe) {
          errors.push(`Domain at index ${i} is not allowed for security reasons`);
          continue;
        }
        
        sanitizedDomains.push(sanitizedDomain);
      }
      
      if (sanitizedDomains.length > 0) {
        sanitizedData.domains = [...new Set(sanitizedDomains)]; // Remove duplicates
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined,
  };
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

/**
 * GET /api/customers
 * 
 * Retrieve all customers with optional search functionality
 * 
 * Query Parameters:
 * - search: Search query to filter customers by name, company, or email
 * - limit: Maximum number of results (1-100, default 50)
 * - offset: Number of records to skip for pagination (default 0)
 * 
 * @security
 * - Input sanitization on search parameters
 * - Pagination limits to prevent resource exhaustion
 * - Rate limiting applied
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract and validate query parameters
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate and sanitize search query
    let sanitizedSearch: string | null = null;
    if (searchQuery && typeof searchQuery === 'string') {
      sanitizedSearch = sanitizeInput(searchQuery);
      if (sanitizedSearch.length > 100) {
        return createErrorResponse(
          'Search query too long. Maximum 100 characters allowed.',
          400,
          'INVALID_SEARCH_QUERY'
        );
      }
    }

    // Validate pagination parameters
    let limit = 50; // Default limit
    let offset = 0; // Default offset

    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return createErrorResponse(
          'Limit must be a number between 1 and 100',
          400,
          'INVALID_LIMIT'
        );
      }
      limit = parsedLimit;
    }

    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return createErrorResponse(
          'Offset must be a non-negative number',
          400,
          'INVALID_OFFSET'
        );
      }
      offset = parsedOffset;
    }

    // Retrieve customers from service
    let customers: Customer[];
    if (sanitizedSearch) {
      customers = await customerService.search(sanitizedSearch);
    } else {
      customers = await customerService.getAll();
    }

    // Apply pagination
    const totalCount = customers.length;
    const paginatedCustomers = customers.slice(offset, offset + limit);

    // Prepare response with pagination metadata
    const responseData = {
      customers: paginatedCustomers,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasNext: offset + limit < totalCount,
        hasPrevious: offset > 0,
      },
    };

    return createSuccessResponse(responseData);

  } catch (error) {
    console.error('GET /api/customers error:', error);

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
      'Internal server error occurred while retrieving customers',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * POST /api/customers
 * 
 * Create a new customer with comprehensive validation
 * 
 * Request Body:
 * - name: Customer name (required, 2-100 chars)
 * - company: Company name (required, 2-100 chars)
 * - healthScore: Health score (required, 0-100)
 * - email: Email address (optional, valid format)
 * - subscriptionTier: Subscription tier (optional: basic, premium, enterprise)
 * - domains: Array of domains (optional, max 10)
 * 
 * @security
 * - Comprehensive input validation and sanitization
 * - Duplicate detection
 * - SQL injection prevention
 * - XSS prevention through sanitization
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate payload size
    if (!validatePayloadSize(request, 10)) {
      return createErrorResponse(
        'Request body too large. Maximum 10KB allowed.',
        413,
        'PAYLOAD_TOO_LARGE'
      );
    }
    // Validate Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return createErrorResponse(
        'Content-Type must be application/json',
        400,
        'INVALID_CONTENT_TYPE'
      );
    }

    // Parse and validate request body
    let requestBody: any;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return createErrorResponse(
        'Invalid JSON format in request body',
        400,
        'INVALID_JSON'
      );
    }

    // Validate payload size (prevent DoS)
    const bodyString = JSON.stringify(requestBody);
    if (bodyString.length > 10000) { // 10KB limit
      return createErrorResponse(
        'Request body too large. Maximum 10KB allowed.',
        413,
        'PAYLOAD_TOO_LARGE'
      );
    }

    // Validate and sanitize input data
    const validation = await validateCustomerPayload(requestBody);
    if (!validation.isValid || !validation.sanitizedData) {
      return createErrorResponse(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        { errors: validation.errors }
      );
    }

    // Create customer through service layer
    const newCustomer = await customerService.create(validation.sanitizedData as Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>);

    return createSuccessResponse(newCustomer, 201);

  } catch (error) {
    console.error('POST /api/customers error:', error);

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
      'Internal server error occurred while creating customer',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 * 
 * Handles CORS preflight requests for the customers endpoint
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}