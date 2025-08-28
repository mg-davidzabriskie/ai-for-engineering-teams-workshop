# API Development Guide

## Overview

This guide documents the API patterns and implementation standards used in the Customer Intelligence Dashboard. All APIs follow REST principles with security-first design, comprehensive error handling, and TypeScript integration.

## API Architecture Patterns

### 1. Secure API Routes

All API routes implement a consistent security and validation layer:

```typescript
// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateRequest, authenticateUser } from '@/middleware/security'
import { CustomerService } from '@/services/CustomerService'

export async function GET(request: NextRequest) {
  try {
    // 1. Security validation
    const securityResult = await validateRequest(request)
    if (!securityResult.success) {
      return NextResponse.json(securityResult, { status: 401 })
    }

    // 2. Authentication
    const authResult = await authenticateUser(request)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 })
    }

    // 3. Business logic
    const customers = await CustomerService.getAll({
      search: request.nextUrl.searchParams.get('search'),
      userId: authResult.user.id
    })

    // 4. Formatted response
    return NextResponse.json({
      success: true,
      data: customers,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
```

### 2. Consistent Response Format

All API responses follow a standardized format:

```typescript
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

// Success Response Example
{
  "success": true,
  "data": {
    "customers": [...],
    "total": 42,
    "page": 1
  },
  "timestamp": "2024-01-15T10:30:00Z"
}

// Error Response Example
{
  "success": false,
  "error": {
    "message": "Invalid customer data",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. Service Layer Pattern

Business logic is separated into service classes:

```typescript
// src/services/CustomerService.ts
export class CustomerService {
  static async getAll(options: {
    search?: string | null
    userId: string
    page?: number
    limit?: number
  }) {
    // Input validation
    const { search, userId, page = 1, limit = 50 } = options
    
    if (!userId) {
      throw new Error('User ID is required')
    }

    // Business logic
    let customers = await this.loadCustomers(userId)
    
    if (search) {
      customers = this.filterCustomers(customers, search)
    }

    // Pagination
    const total = customers.length
    const startIndex = (page - 1) * limit
    const paginatedCustomers = customers.slice(startIndex, startIndex + limit)

    return {
      customers: paginatedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}
```

## Security Implementation

### 1. Middleware Security

```typescript
// src/middleware/security.ts
export async function validateRequest(request: NextRequest) {
  // Rate limiting
  if (!await checkRateLimit(request)) {
    return {
      success: false,
      error: {
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        statusCode: 429
      }
    }
  }

  // Input sanitization
  const sanitizedBody = sanitizeInput(await request.json())
  
  // SSRF protection
  if (!validateUrls(sanitizedBody)) {
    return {
      success: false,
      error: {
        message: 'Invalid URL detected',
        code: 'SSRF_PROTECTION',
        statusCode: 400
      }
    }
  }

  return { success: true, data: sanitizedBody }
}
```

### 2. Authentication Pattern

```typescript
export async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      error: {
        message: 'Missing or invalid authorization header',
        code: 'AUTH_REQUIRED',
        statusCode: 401
      }
    }
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    
    return {
      success: true,
      user: decoded as { id: string, role: string }
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN', 
        statusCode: 401
      }
    }
  }
}
```

## CRUD Operation Patterns

### 1. GET - List Resources

```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  // Validation
  if (page < 1 || limit < 1 || limit > 100) {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Invalid pagination parameters',
        code: 'INVALID_PARAMS',
        statusCode: 400
      }
    }, { status: 400 })
  }

  const result = await CustomerService.getAll({
    search, page, limit,
    userId: authResult.user.id
  })

  return NextResponse.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString()
  })
}
```

### 2. POST - Create Resource

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Input validation
  const validation = validateCustomerData(body)
  if (!validation.success) {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: validation.errors
      }
    }, { status: 400 })
  }

  // Business logic
  const customer = await CustomerService.create({
    ...validation.data,
    userId: authResult.user.id
  })

  return NextResponse.json({
    success: true,
    data: customer,
    timestamp: new Date().toISOString()
  }, { status: 201 })
}
```

### 3. PUT - Update Resource

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const customerId = params.id

  // Resource existence check
  const existingCustomer = await CustomerService.getById(customerId)
  if (!existingCustomer) {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Customer not found',
        code: 'NOT_FOUND',
        statusCode: 404
      }
    }, { status: 404 })
  }

  // Authorization check
  if (existingCustomer.userId !== authResult.user.id) {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
        statusCode: 403
      }
    }, { status: 403 })
  }

  const updatedCustomer = await CustomerService.update(customerId, body)
  
  return NextResponse.json({
    success: true,
    data: updatedCustomer,
    timestamp: new Date().toISOString()
  })
}
```

### 4. DELETE - Remove Resource

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = request.nextUrl.searchParams
  const confirm = searchParams.get('confirm')

  // Confirmation check
  if (confirm !== 'true') {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Deletion confirmation required',
        code: 'CONFIRMATION_REQUIRED',
        statusCode: 400
      }
    }, { status: 400 })
  }

  await CustomerService.delete(params.id, authResult.user.id)

  return NextResponse.json({
    success: true,
    data: { deleted: true, id: params.id },
    timestamp: new Date().toISOString()
  })
}
```

## Client Integration Patterns

### 1. API Request Helper

```typescript
// Custom hook for API integration
const apiRequest = useCallback(async (
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<unknown>> => {
  try {
    const response = await fetch(`/api/customers${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}, [token])
```

### 2. Optimistic Updates

```typescript
const updateCustomer = useCallback(async (
  id: string,
  updates: Partial<Customer>
): Promise<Customer> => {
  // Store original for rollback
  const originalCustomer = customers.find(c => c.id === id)!
  
  try {
    // Optimistic update
    const optimisticCustomer = { ...originalCustomer, ...updates }
    setCustomers(prev => prev.map(c => c.id === id ? optimisticCustomer : c))

    // API call
    const response = await apiRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })

    // Update with server response
    const updatedCustomer = response.data as Customer
    setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c))
    
    return updatedCustomer
  } catch (error) {
    // Rollback on error
    setCustomers(prev => prev.map(c => c.id === id ? originalCustomer : c))
    throw error
  }
}, [customers, apiRequest])
```

## Validation Patterns

### 1. Input Validation Schema

```typescript
interface CustomerCreateSchema {
  name: string
  company: string
  healthScore: number
  email?: string
  subscriptionTier?: 'basic' | 'premium' | 'enterprise'
  domains?: string[]
}

function validateCustomerData(data: unknown): {
  success: boolean
  data?: CustomerCreateSchema
  errors?: Record<string, string>
} {
  const errors: Record<string, string> = {}

  // Type guard
  if (!data || typeof data !== 'object') {
    return { success: false, errors: { general: 'Invalid data format' } }
  }

  const customer = data as Record<string, unknown>

  // Required field validation
  if (!customer.name || typeof customer.name !== 'string') {
    errors.name = 'Name is required and must be a string'
  } else if (customer.name.length < 2) {
    errors.name = 'Name must be at least 2 characters'
  }

  // Health score validation
  if (typeof customer.healthScore !== 'number') {
    errors.healthScore = 'Health score must be a number'
  } else if (customer.healthScore < 0 || customer.healthScore > 100) {
    errors.healthScore = 'Health score must be between 0 and 100'
  }

  // Email validation (optional)
  if (customer.email && typeof customer.email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customer.email)) {
      errors.email = 'Invalid email format'
    }
  }

  return Object.keys(errors).length === 0 
    ? { success: true, data: customer as CustomerCreateSchema }
    : { success: false, errors }
}
```

### 2. Runtime Type Checking

```typescript
function isCustomer(obj: unknown): obj is Customer {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Customer).id === 'string' &&
    typeof (obj as Customer).name === 'string' &&
    typeof (obj as Customer).company === 'string' &&
    typeof (obj as Customer).healthScore === 'number'
  )
}
```

## Error Handling Patterns

### 1. Centralized Error Handling

```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details
      },
      timestamp: new Date().toISOString()
    }, { status: error.statusCode })
  }

  // Unknown error - don't leak details
  return NextResponse.json({
    success: false,
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      statusCode: 500
    },
    timestamp: new Date().toISOString()
  }, { status: 500 })
}
```

### 2. Client Error Handling

```typescript
const useCustomers = () => {
  const [error, setError] = useState<string | null>(null)

  const handleApiError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError(error.message)
    } else {
      setError('An unexpected error occurred')
    }
  }, [])

  const createCustomer = useCallback(async (data: CustomerCreateSchema) => {
    try {
      setError(null)
      const response = await apiRequest('', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      return response.data as Customer
    } catch (error) {
      handleApiError(error)
      throw error
    }
  }, [apiRequest, handleApiError])

  return { createCustomer, error, clearError: () => setError(null) }
}
```

## Performance Optimization

### 1. Response Caching

```typescript
const cache = new Map<string, { data: unknown; timestamp: number }>()

function getCachedResponse(key: string, maxAge: number = 300000) { // 5 minutes
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < maxAge) {
    return cached.data
  }
  return null
}

function setCachedResponse(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() })
}
```

### 2. Request Deduplication

```typescript
const pendingRequests = new Map<string, Promise<unknown>>()

async function deduplicatedRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>
  }

  const promise = requestFn()
  pendingRequests.set(key, promise)

  try {
    const result = await promise
    pendingRequests.delete(key)
    return result
  } catch (error) {
    pendingRequests.delete(key)
    throw error
  }
}
```

## Testing Patterns

### 1. API Route Testing

```typescript
import { GET } from '@/app/api/customers/route'
import { NextRequest } from 'next/server'

describe('/api/customers', () => {
  it('should return customers for authenticated user', async () => {
    const request = new NextRequest('http://localhost:3000/api/customers', {
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data.customers)).toBe(true)
  })

  it('should return 401 for unauthenticated requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/customers')
    const response = await GET(request)
    
    expect(response.status).toBe(401)
  })
})
```

### 2. Service Layer Testing

```typescript
import { CustomerService } from '@/services/CustomerService'

describe('CustomerService', () => {
  it('should filter customers by search term', async () => {
    const result = await CustomerService.getAll({
      search: 'tech',
      userId: 'user-1'
    })

    expect(result.customers).toHaveLength(2)
    expect(result.customers[0].company).toContain('Tech')
  })

  it('should validate required fields', async () => {
    await expect(
      CustomerService.create({
        name: '',
        company: 'Test Corp',
        healthScore: 85
      })
    ).rejects.toThrow('Name is required')
  })
})
```

This API guide provides comprehensive patterns for building secure, scalable APIs with proper error handling, validation, and testing. All patterns are based on the implemented customer management system and follow industry best practices.