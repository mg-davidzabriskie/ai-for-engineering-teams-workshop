/**
 * Security utilities for API protection
 * Includes SSRF protection, rate limiting, and input validation
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * SSRF Protection: Check if domain resolves to private/internal IP ranges
 */
export function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^10\./,                                    // 10.0.0.0/8
    /^192\.168\./,                             // 192.168.0.0/16
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,         // 172.16.0.0/12
    /^127\./,                                  // Loopback 127.0.0.0/8
    /^169\.254\./,                             // Link-local 169.254.0.0/16
    /^0\./,                                    // 0.0.0.0/8
    /^224\./,                                  // Multicast 224.0.0.0/4
    /^240\./,                                  // Reserved 240.0.0.0/4
    /^::1$/,                                   // IPv6 localhost
    /^fe80:/,                                  // IPv6 link-local
    /^fc00:/,                                  // IPv6 unique local
  ]
  
  return privateRanges.some(range => range.test(ip))
}

/**
 * Check if domain is potentially dangerous for SSRF
 */
export function isDangerousDomain(domain: string): boolean {
  const lowercaseDomain = domain.toLowerCase()
  
  // Block localhost variants
  const localhostVariants = [
    'localhost',
    'localhost.localdomain',
    '0.0.0.0',
    '127.0.0.1',
    '::1'
  ]
  
  if (localhostVariants.includes(lowercaseDomain)) {
    return true
  }
  
  // Block internal TLDs
  const dangerousTlds = [
    '.local',
    '.internal',
    '.corp',
    '.home',
    '.lan'
  ]
  
  if (dangerousTlds.some(tld => lowercaseDomain.endsWith(tld))) {
    return true
  }
  
  // Check if domain looks like an IP address
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  if (ipv4Regex.test(domain)) {
    return isPrivateIP(domain)
  }
  
  if (ipv6Regex.test(domain)) {
    return isPrivateIP(domain)
  }
  
  return false
}

/**
 * Validate domain for SSRF protection
 */
export async function validateDomainSafety(domain: string): Promise<boolean> {
  try {
    // Basic format validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/
    if (!domainRegex.test(domain)) {
      return false
    }
    
    // Check for obvious dangerous domains
    if (isDangerousDomain(domain)) {
      return false
    }
    
    // Check domain length (RFC limit)
    if (domain.length > 253) {
      return false
    }
    
    // Check for punycode attacks
    if (domain.includes('xn--')) {
      // Additional validation needed for internationalized domains
      // For now, we'll be conservative and block them
      return false
    }
    
    // Note: In a real implementation, you might want to do DNS resolution
    // to check if the domain resolves to private IPs, but that's complex
    // and could introduce timing attacks
    
    return true
  } catch (error) {
    // If validation fails, err on the side of caution
    return false
  }
}

/**
 * Enhanced input sanitization that preserves legitimate characters
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  return input
    .trim()
    // HTML entity encoding instead of removal
    .replace(/[<>"'&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }
      return entities[match] || match
    })
    // Remove null bytes and control characters but preserve legitimate punctuation
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Limit length to prevent DoS
    .substring(0, 1000)
}

/**
 * Rate limiting store (in-memory for development, use Redis in production)
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Rate limiting implementation
 */
export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  
  // Clean up expired entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime <= now) {
      rateLimitStore.delete(k)
    }
  }
  
  const entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetTime <= now) {
    // New window
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime
    }
  }
  
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }
  
  entry.count++
  rateLimitStore.set(key, entry)
  
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Get client IP from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }
  
  // Fallback for cases where no headers are present
  return 'unknown'
}

/**
 * Create rate limit exceeded response
 */
export function createRateLimitResponse(resetTime: number): NextResponse {
  return NextResponse.json({
      success: false,
      error: {
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        timestamp: new Date().toISOString(),
        details: {
          resetTime: new Date(resetTime).toISOString()
        }
      }
    },
    { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      }
    }
  )
}

/**
 * Validate request payload size
 */
export function validatePayloadSize(request: NextRequest, maxSizeKB: number = 10): boolean {
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const sizeKB = parseInt(contentLength) / 1024
    return sizeKB <= maxSizeKB
  }
  return true // If no content-length header, let it through (will be caught by JSON parsing)
}