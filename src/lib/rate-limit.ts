/**
 * Simple in-memory rate limiter for serverless environments.
 * No external dependencies required.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a given key (usually IP + endpoint).
 * Returns { success: true } if under limit, { success: false } if rate limited.
 */
export function rateLimit(
  key: string,
  options: {
    limit?: number      // max requests per window (default: 10)
    windowMs?: number   // window duration in ms (default: 60000 = 1 min)
  } = {}
): RateLimitResult {
  const { limit = 10, windowMs = 60000 } = options
  const now = Date.now()
  
  let entry = store.get(key)
  
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs }
    store.set(key, entry)
  }
  
  entry.count++
  
  return {
    success: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  }
}

/**
 * Get client IP from request headers (works behind proxies).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}
