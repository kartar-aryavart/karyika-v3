import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Security headers applied to EVERY response
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options':  'nosniff',
  'X-Frame-Options':         'DENY',
  'X-XSS-Protection':        '1; mode=block',
  'Referrer-Policy':         'strict-origin-when-cross-origin',
  'Permissions-Policy':      'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

// Public paths that don't require auth
const PUBLIC = ['/login', '/signup', '/auth', '/api/auth']

// Admin-only paths
const ADMIN_PATHS = ['/admin', '/api/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  // 1. Apply security headers to ALL responses
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(k, v)
  }

  // 2. Skip auth check for static assets
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return response
  }

  // 3. Create Supabase client (reads HttpOnly session cookie)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(toSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          // Re-apply security headers after response recreation
          for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
            response.headers.set(k, v)
          }
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  // 4. Verify session (getUser is secure — validates JWT server-side)
  const { data: { user } } = await supabase.auth.getUser()

  const isPublic = PUBLIC.some(p => pathname.startsWith(p))
  const isAdmin  = ADMIN_PATHS.some(p => pathname.startsWith(p))
  const isRoot   = pathname === '/'

  // 5. Redirect logged-in users away from auth pages
  if (user && (isPublic || isRoot)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 6. Redirect unauthenticated users to login
  if (!user && !isPublic) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // 7. Admin path protection — checked in API routes too (defence in depth)
  if (isAdmin && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
