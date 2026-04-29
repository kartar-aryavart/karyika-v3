import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { LIMITS } from '@/lib/security/rate-limit'
import { secureJson } from '@/lib/security/headers'
import { createClient } from '@/lib/supabase/server'

// camelCase → snake_case column mapping
const COL: Record<string, string> = {
  dueTime: 'due_time', startDate: 'start_date',
  estimatedTime: 'estimated_time', actualTime: 'actual_time',
  customFields: 'custom_fields', sprintId: 'sprint_id',
  coverColor: 'cover_color', completedAt: 'completed_at',
  assigneeId: 'assignee_id', projectId: 'project_id',
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

  // Remap camelCase → snake_case, clean empty strings
  const clean: Record<string, any> = {}
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue
    const col = COL[k] ?? k
    const numCols = ['estimated_time', 'actual_time', 'points']
    clean[col] = (numCols.includes(col) && v === '') ? null : v
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tasks')
      .update(clean)
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .select()
      .single()

    if (error) {
      console.error('[PATCH tasks/id] DB error:', error.message, error.hint)
      return secureJson({ error: error.message, hint: error.hint }, { status: 500 })
    }
    if (!data) return secureJson({ error: 'Task not found' }, { status: 404 })
    return secureJson(data)
  } catch (e: any) {
    console.error('[PATCH tasks/id] unexpected:', e.message)
    return secureJson({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser()
  if (!auth.ok) return auth.response

  const rl = LIMITS.api(auth.user.id)
  if (!rl.allowed) return secureJson({ error: 'Too many requests' }, { status: 429, retryAfter: rl.retryAfter })

  const { id } = await params

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id)

    if (error) {
      console.error('[DELETE tasks/id] DB error:', error.message)
      return secureJson({ error: error.message }, { status: 500 })
    }
    return new Response(null, { status: 204 })
  } catch (e: any) {
    console.error('[DELETE tasks/id] unexpected:', e.message)
    return secureJson({ error: e.message }, { status: 500 })
  }
}
