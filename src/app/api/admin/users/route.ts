import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth'
import { LIMITS } from '@/lib/security/rate-limit'
import { secureJson } from '@/lib/security/headers'
import { adminGetAllUsers, adminUpdateUserRole } from '@/lib/dal'

// GET /api/admin/users — list all users (super_admin only)
export async function GET() {
  const auth = await requireRole('super_admin')
  if (!auth.ok) return auth.response

  const rl = LIMITS.adminApi(auth.user.id)
  if (!rl.allowed) return secureJson({ error: 'Too many requests' }, { status: 429, retryAfter: rl.retryAfter })

  try {
    const users = await adminGetAllUsers()
    return secureJson(users)
  } catch { return secureJson({ error: 'Failed to fetch users' }, { status: 500 }) }
}

// PATCH /api/admin/users — update user role (super_admin only)
export async function PATCH(req: NextRequest) {
  const auth = await requireRole('super_admin')
  if (!auth.ok) return auth.response

  const rl = LIMITS.adminApi(auth.user.id)
  if (!rl.allowed) return secureJson({ error: 'Too many requests' }, { status: 429, retryAfter: rl.retryAfter })

  let body: any
  try { body = await req.json() }
  catch { return secureJson({ error: 'Invalid JSON' }, { status: 400 }) }

  const { userId, role } = body
  if (!userId || !['user', 'admin', 'super_admin'].includes(role)) {
    return secureJson({ error: 'userId and valid role required' }, { status: 400 })
  }

  // Prevent self-demotion
  if (userId === auth.user.id) {
    return secureJson({ error: 'Cannot change your own role' }, { status: 400 })
  }

  try {
    const updated = await adminUpdateUserRole(userId, role)
    return secureJson(updated)
  } catch { return secureJson({ error: 'Failed to update role' }, { status: 500 }) }
}
