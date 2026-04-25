/**
 * KARYIKA — Core Auth Helper
 * Every API route MUST call getAuthUser() first.
 * Zero Trust: verify every request, never trust cookies alone.
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export type AuthUser = {
  id: string
  email: string
  role: 'user' | 'admin' | 'super_admin'
}

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse }

/**
 * Verifies session via Supabase JWT (HttpOnly cookie).
 * Returns typed user or a ready-to-return error response.
 *
 * Usage in every API route:
 *   const auth = await getAuthUser()
 *   if (!auth.ok) return auth.response
 *   const { user } = auth
 */
export async function getAuthUser(): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
          { status: 401 }
        ),
      }
    }

    // Get role from profiles table (single source of truth for RBAC)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profile?.role ?? 'user') as AuthUser['role']

    return { ok: true, user: { id: user.id, email: user.email!, role } }
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Internal server error', code: 'SERVER_ERROR' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Requires a minimum role level.
 * Role hierarchy: user < admin < super_admin
 */
export async function requireRole(
  minRole: AuthUser['role']
): Promise<AuthResult> {
  const auth = await getAuthUser()
  if (!auth.ok) return auth

  const hierarchy: Record<AuthUser['role'], number> = {
    user: 1,
    admin: 2,
    super_admin: 3,
  }

  if (hierarchy[auth.user.role] < hierarchy[minRole]) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden', code: 'INSUFFICIENT_ROLE' },
        { status: 403 }
      ),
    }
  }

  return auth
}

/**
 * Sanitizes error messages before sending to client.
 * Never expose internal DB errors, stack traces, etc.
 */
export function safeError(error: unknown, fallback = 'Something went wrong'): string {
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    return error.message
  }
  return fallback
}
