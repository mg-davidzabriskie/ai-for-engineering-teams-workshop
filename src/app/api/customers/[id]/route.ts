/**
 * Customer Management API - Individual Customer Routes
 * 
 * Secure Next.js 15 Route Handlers for individual customer operations
 * Implements REST API best practices with comprehensive validation,
 * error handling, and security measures.
 * 
 * @endpoints
 * - GET /api/customers/[id] - Retrieve customer by ID
 * - PUT /api/customers/[id] - Update customer by ID
 * - DELETE /api/customers/[id] - Delete customer by ID
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

// Note: sanitizeInput is now imported from security middleware

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,    // per IP
};

// ID validation helper
function validateCustomerId(id: string): { isValid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { isValid: false, error: 'Customer ID is required' };
  }

  const sanitizedId = sanitizeInput(id);
  
  if (sanitizedId !== id) {
    return { isValid: false, error: 'Customer ID contains invalid characters' };
  }

  if (sanitizedId.length === 0 || sanitizedId.length > 50) {
    return { isValid: false, error: 'Customer ID must be between 1 and 50 characters' };
  }

  // Additional pattern validation (alphanumeric, hyphens, underscores)
  if (!/^[a-zA-Z0-9\-_]+$/.test(sanitizedId)) {
    return { isValid: false, error: 'Customer ID contains invalid characters' };
  }

  return { isValid: true };
}

// Validation helper for customer updates
async function validateCustomerUpdatePayload(data: any): Promise<{
  isValid: boolean;
  errors: string[];
  sanitizedData?: Partial<Customer>;
}> {
  const errors: string[] = [];
  const sanitizedData: Partial<Customer> = {};

  // Validate and sanitize name (if provided)
  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Name must be a non-empty string');
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
  }

  // Validate and sanitize company (if provided)
  if (data.company !== undefined) {
    if (!data.company || typeof data.company !== 'string') {
      errors.push('Company must be a non-empty string');
    } else {
      const sanitizedCompany = sanitizeInput(data.company);
      if (sanitizedCompany.length < 2 || sanitizedCompany.length > 100) {
        errors.push('Company name must be between 2 and 100 characters');
      } else {
        sanitizedData.company = sanitizedCompany;
      }
    }
  }

  // Validate health score (if provided)
  if (data.healthScore !== undefined) {
    const score = Number(data.healthScore);
    if (isNaN(score)) {
      errors.push('Health score must be a valid number');
    } else if (score < 0 || score > 100) {
      errors.push('Health score must be between 0 and 100');
    } else {
      sanitizedData.healthScore = Math.round(score);
    }
  }

  // Validate and sanitize email (if provided)
  if (data.email !== undefined) {
    if (data.email === null || data.email === '') {
      sanitizedData.email = undefined; // Allow clearing email
    } else if (typeof data.email === 'string') {
      const sanitizedEmail = sanitizeInput(data.email);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        errors.push('Invalid email format');
      } else if (sanitizedEmail.length > 255) {
        errors.push('Email address too long');
      } else {
        sanitizedData.email = sanitizedEmail.toLowerCase();
      }
    } else {
      errors.push('Email must be a string or null');
    }
  }

  // Validate subscription tier (if provided)
  if (data.subscriptionTier !== undefined) {
    if (data.subscriptionTier === null || data.subscriptionTier === '') {
      sanitizedData.subscriptionTier = undefined; // Allow clearing subscription tier
    } else {
      const validTiers = ['basic', 'premium', 'enterprise'];
      if (!validTiers.includes(data.subscriptionTier)) {
        errors.push('Invalid subscription tier. Must be: basic, premium, or enterprise');
      } else {
        sanitizedData.subscriptionTier = data.subscriptionTier;
      }
    }
  }

  // Validate domains (if provided)
  if (data.domains !== undefined) {
    if (data.domains === null || (Array.isArray(data.domains) && data.domains.length === 0)) {
      sanitizedData.domains = undefined; // Allow clearing domains
    } else if (Array.isArray(data.domains)) {
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
    } else {
      errors.push('Domains must be an array or null');
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
 * GET /api/customers/[id]
 * 
 * Retrieve a specific customer by ID
 * 
 * Path Parameters:
 * - id: Customer ID (required, alphanumeric)
 * 
 * @security
 * - ID validation and sanitization
 * - Proper error handling for not found
 * - No information leakage in error responses
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await params (Next.js 15 requirement)
    const resolvedParams = await params;
    
    // Validate customer ID
    const idValidation = validateCustomerId(resolvedParams.id);
    if (!idValidation.isValid) {
      return createErrorResponse(
        idValidation.error || 'Invalid customer ID',
        400,
        'INVALID_CUSTOMER_ID'
      );
    }

    // Retrieve customer from service
    const customer = await customerService.getById(resolvedParams.id);

    if (!customer) {
      return createErrorResponse(
        'Customer not found',
        404,
        'CUSTOMER_NOT_FOUND'
      );
    }

    return createSuccessResponse(customer);

  } catch (error) {
    console.error('GET /api/customers/[id] error:', error);

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
      'Internal server error occurred while retrieving customer',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * PUT /api/customers/[id]
 * 
 * Update a specific customer by ID
 * 
 * Path Parameters:
 * - id: Customer ID (required, alphanumeric)
 * 
 * Request Body: Partial customer data to update
 * - name: Customer name (optional, 2-100 chars)
 * - company: Company name (optional, 2-100 chars)
 * - healthScore: Health score (optional, 0-100)
 * - email: Email address (optional, valid format or null to clear)
 * - subscriptionTier: Subscription tier (optional or null to clear)
 * - domains: Array of domains (optional or null to clear)
 * 
 * @security
 * - Comprehensive input validation and sanitization
 * - ID validation and protection against ID manipulation
 * - Duplicate detection
 * - Optimistic locking consideration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await params (Next.js 15 requirement)
    const resolvedParams = await params;
    
    // Validate payload size
    if (!validatePayloadSize(request, 10)) {
      return createErrorResponse(
        'Request body too large. Maximum 10KB allowed.',
        413,
        'PAYLOAD_TOO_LARGE'
      );
    }
    
    // Validate customer ID
    const idValidation = validateCustomerId(resolvedParams.id);
    if (!idValidation.isValid) {
      return createErrorResponse(
        idValidation.error || 'Invalid customer ID',
        400,
        'INVALID_CUSTOMER_ID'
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

    // Prevent ID manipulation in request body
    if (requestBody.id !== undefined && requestBody.id !== resolvedParams.id) {
      return createErrorResponse(
        'Cannot modify customer ID',
        400,
        'ID_MODIFICATION_NOT_ALLOWED'
      );
    }

    // Prevent timestamp manipulation
    if (requestBody.createdAt !== undefined || requestBody.updatedAt !== undefined) {
      return createErrorResponse(
        'Cannot modify timestamp fields',
        400,
        'TIMESTAMP_MODIFICATION_NOT_ALLOWED'
      );
    }

    // Check if request body is empty
    if (Object.keys(requestBody).length === 0) {
      return createErrorResponse(
        'Request body cannot be empty',
        400,
        'EMPTY_REQUEST_BODY'
      );
    }

    // Validate and sanitize input data
    const validation = await validateCustomerUpdatePayload(requestBody);
    if (!validation.isValid || !validation.sanitizedData) {
      return createErrorResponse(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        { errors: validation.errors }
      );
    }

    // Update customer through service layer
    const updatedCustomer = await customerService.update(resolvedParams.id, validation.sanitizedData);

    return createSuccessResponse(updatedCustomer);

  } catch (error) {
    console.error('PUT /api/customers/[id] error:', error);

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
      'Internal server error occurred while updating customer',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * DELETE /api/customers/[id]
 * 
 * Delete a specific customer by ID
 * 
 * Path Parameters:
 * - id: Customer ID (required, alphanumeric)
 * 
 * Query Parameters:
 * - confirm: Confirmation flag (optional, must be 'true' for production safety)
 * 
 * @security
 * - ID validation and sanitization
 * - Confirmation requirement for safety
 * - Proper audit logging (in production)
 * - Soft delete consideration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await params (Next.js 15 requirement)
    const resolvedParams = await params;
    
    // Validate customer ID
    const idValidation = validateCustomerId(resolvedParams.id);
    if (!idValidation.isValid) {
      return createErrorResponse(
        idValidation.error || 'Invalid customer ID',
        400,
        'INVALID_CUSTOMER_ID'
      );
    }

    // Check for confirmation parameter (safety measure)
    const { searchParams } = new URL(request.url);
    const confirmParam = searchParams.get('confirm');
    
    if (confirmParam !== 'true') {
      return createErrorResponse(
        'Deletion must be confirmed. Add ?confirm=true to the request.',
        400,
        'DELETION_NOT_CONFIRMED'
      );
    }

    // Delete customer through service layer
    await customerService.delete(resolvedParams.id);

    // Return success response with no content
    return createSuccessResponse(
      { message: 'Customer successfully deleted', id: resolvedParams.id },
      200
    );

  } catch (error) {
    console.error('DELETE /api/customers/[id] error:', error);

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
      'Internal server error occurred while deleting customer',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 * 
 * Handles CORS preflight requests for individual customer endpoints
 * with appropriate security headers and allowed methods.
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...SECURITY_HEADERS,
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGIN || 'https://yourdomain.com'
        : 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}