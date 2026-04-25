import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { LIMITS } from '@/lib/security/rate-limit'
import { secureJson } from '@/lib/security/headers'
import { getGoals, createGoal } from '@/lib/dal'

export async function GET() {
  const auth = await getAuthUser()
  if (!auth.ok) return auth.response
  const rl = LIMITS.api(auth.user.id)
  if (!rl.allowed) return secureJson({ error: 'Too many requests' }, { status: 429, retryAfter: rl.retryAfter })
  try {
    return secureJson(await getGoals(auth.user.id))
  } catch { return secureJson({ error: 'Failed to fetch goals' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser()
  if (!auth.ok) return auth.response
  const rl = LIMITS.api(auth.user.id)
  if (!rl.allowed) return secureJson({ error: 'Too many requests' }, { status: 429, retryAfter: rl.retryAfter })
  let body: any
  try { body = await req.json() }
  catch { return secureJson({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.title?.trim()) return secureJson({ error: 'Title is required' }, { status: 400 })
  try {
    return secureJson(await createGoal(auth.user.id, body), { status: 201 })
  } catch { return secureJson({ error: 'Failed to create goal' }, { status: 500 }) }
}
