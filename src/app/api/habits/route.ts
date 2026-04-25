import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { LIMITS } from '@/lib/security/rate-limit'
import { secureJson } from '@/lib/security/headers'
import { getHabits, createHabit } from '@/lib/dal'

export async function GET() {
  const auth = await getAuthUser()
  if (!auth.ok) return auth.response
  const rl = LIMITS.api(auth.user.id)
  if (!rl.allowed) return secureJson({ error: 'Too many requests' }, { status: 429, retryAfter: rl.retryAfter })
  try {
    return secureJson(await getHabits(auth.user.id))
  } catch { return secureJson({ error: 'Failed to fetch habits' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser()
  if (!auth.ok) return auth.response
  const rl = LIMITS.api(auth.user.id)
  if (!rl.allowed) return secureJson({ error: 'Too many requests' }, { status: 429, retryAfter: rl.retryAfter })
  let body: any
  try { body = await req.json() }
  catch { return secureJson({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.name?.trim()) return secureJson({ error: 'Name is required' }, { status: 400 })
  try {
    return secureJson(await createHabit(auth.user.id, body), { status: 201 })
  } catch (e: any) {
    return secureJson({ error: 'Failed to create habit' }, { status: 500 })
  }
}
