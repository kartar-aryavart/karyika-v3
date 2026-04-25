import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { LIMITS } from '@/lib/security/rate-limit'
import { secureJson } from '@/lib/security/headers'
import { updateTask, deleteTask } from '@/lib/dal'

const COL: Record<string, string> = {
  dueTime: 'due_time', estimatedTime: 'estimated_time', completedAt: 'completed_at',
  customFields: 'custom_fields', sprintId: 'sprint_id', coverColor: 'cover_color',
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser()
  if (!auth.ok) return auth.response

  const rl = LIMITS.api(auth.user.id)
  if (!rl.allowed) return secureJson({ error: 'Too many requests' }, { status: 429, retryAfter: rl.retryAfter })

  let body: any
  try { body = await req.json() }
  catch { return secureJson({ error: 'Invalid JSON' }, { status: 400 }) }

  const { id } = await params

  // Normalize camelCase → snake_case + strip nulls
  const clean: Record<string, any> = {}
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue
    const col = COL[k] ?? k
    clean[col] = (['estimated_time', 'actual_time', 'points'].includes(col) && v === '') ? null : v
  }

  try {
    const task = await updateTask(auth.user.id, id, clean)
    return secureJson(task)
  } catch (e: any) {
    return secureJson({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser()
  if (!auth.ok) return auth.response

  const rl = LIMITS.api(auth.user.id)
  if (!rl.allowed) return secureJson({ error: 'Too many requests' }, { status: 429, retryAfter: rl.retryAfter })

  const { id } = await params

  try {
    await deleteTask(auth.user.id, id)
    return new Response(null, { status: 204 })
  } catch (e: any) {
    return secureJson({ error: 'Failed to delete task' }, { status: 500 })
  }
}
