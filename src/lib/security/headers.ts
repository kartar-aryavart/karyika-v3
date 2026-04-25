/**
 * KARYIKA — Security Headers
 * Applied to every API response via middleware and route handlers.
 * Based on OWASP recommendations.
 */
import { NextResponse } from 'next/server'

export const SECURITY_HEADERS: Record<string, string> = {
  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // XSS protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',
  // HSTS — only over HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // CSP — tight for API routes
  'Content-Security-Policy': "default-src 'none'",
  // Remove server fingerprint
  'X-Powered-By': '',
}

/**
 * Adds security headers to an existing NextResponse.
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (value) response.headers.set(key, value)
    else response.headers.delete(key)
  }
  return response
}

/**
 * Creates a JSON response with security headers + rate limit info.
 */
export function secureJson(
  body: unknown,
  init: { status?: number; remaining?: number; retryAfter?: number } = {}
): NextResponse {
  const res = NextResponse.json(body, { status: init.status ?? 200 })
  withSecurityHeaders(res)
  if (init.remaining !== undefined)
    res.headers.set('X-RateLimit-Remaining', String(init.remaining))
  if (init.retryAfter !== undefined) {
    res.headers.set('Retry-After', String(init.retryAfter))
    res.headers.set('X-RateLimit-Reset', String(Date.now() + init.retryAfter * 1000))
  }
  return res
}
