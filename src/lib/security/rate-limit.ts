/**
 * KARYIKA — Rate Limiter
 * In-memory implementation (works on Vercel Edge/Serverless).
 * Drop-in Redis upgrade: replace store with ioredis calls.
 *
 * Limits:
 *   Auth endpoints  → 10 req / 15 min per IP
 *   API endpoints   → 100 req / 1 min per user
 *   AI endpoints    → 20 req / 1 min per user
 */

type RateLimitEntry = { count: number; resetAt: number }

// In-memory store — resets on cold start (acceptable for serverless)
// For production persistence: swap with Redis INCR + EXPIRE
const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of store.entries()) {
      if (val.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000)
}

export type RateLimitConfig = {
  key: string        // unique key: `${type}:${identifier}`
  limit: number      // max requests
  windowMs: number   // window in milliseconds
}

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfter: number } // seconds until reset

export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = store.get(config.key)

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(config.key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.limit - 1 }
  }

  if (entry.count >= config.limit) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return { allowed: true, remaining: config.limit - entry.count }
}

// Pre-configured limiters
export const LIMITS = {
  auth: (ip: string) =>
    checkRateLimit({ key: `auth:${ip}`, limit: 10, windowMs: 15 * 60 * 1000 }),

  api: (userId: string) =>
    checkRateLimit({ key: `api:${userId}`, limit: 100, windowMs: 60 * 1000 }),

  ai: (userId: string) =>
    checkRateLimit({ key: `ai:${userId}`, limit: 20, windowMs: 60 * 1000 }),

  adminApi: (userId: string) =>
    checkRateLimit({ key: `admin:${userId}`, limit: 50, windowMs: 60 * 1000 }),
}
