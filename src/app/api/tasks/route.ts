import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { LIMITS } from '@/lib/security/rate-limit'
import { secureJson } from '@/lib/security/headers'
import { createClient } from '@/lib/supabase/server'

function toInt(v: any): number | null {
  if (v == null || v === '') return null
  const n = parseInt(String(v), 10)
  return isNaN(n) ? null : n
}

export async function GET() {
  const auth = await getAuthUser()
  if (!auth.ok) return auth.response

  const rl = LIMITS.api(auth.user.id)
  if (!rl.allowed) return secureJson({ error: 'Too many requests' }, { status: 429, retryAfter: rl.retryAfter })

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET tasks] DB error:', error)
      return secureJson({ error: error.message }, { status: 500 })
    }
    return secureJson(Array.isArray(data) ? data : [])
  } catch (e: any) {
    console.error('[GET tasks] unexpected:', e)
    return secureJson({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser()
  if (!auth.ok) return auth.response

  const rl = LIMITS.api(auth.user.id)
  if (!rl.allowed) return secureJson({ error: 'Too many requests' }, { status: 429, retryAfter: rl.retryAfter })

  let body: any
  try { body = await req.json() }
  catch { return secureJson({ error: 'Invalid JSON body' }, { status: 400 }) }

  const title = body?.title?.trim()
  if (!title) return secureJson({ error: 'Title is required' }, { status: 400 })

  try {
    const supabase = await createClient()

    // Get next sort_order
    const { data: maxRow } = await supabase
      .from('tasks')
      .select('sort_order')
      .eq('user_id', auth.user.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Build insert — ONLY columns that exist in DB (snake_case)
    const insert = {
      user_id:        auth.user.id,
      title,
      description:    body.description   ?? body.desc         ?? null,
      status:         body.status        ?? 'todo',
      priority:       body.priority      ?? 'none',
      due:            body.due           ?? null,
      due_time:       body.due_time      ?? body.dueTime       ?? null,
      estimated_time: toInt(body.estimated_time ?? body.estimatedTime),
      points:         toInt(body.points) ?? 0,
      project_id:     body.project_id    ?? body.projectId     ?? null,
      tags:           Array.isArray(body.tags) ? body.tags : [],
      subtasks:       Array.isArray(body.subtasks) ? body.subtasks : [],
      custom_fields:  body.custom_fields ?? body.customFields  ?? null,
      sprint_id:      body.sprint_id     ?? body.sprintId      ?? null,
      urgency:        body.urgency       ?? 'not-urgent',
      importance:     body.importance    ?? 'important',
      cover_color:    body.cover_color   ?? body.coverColor    ?? null,
      recurring:      (body.recurring && body.recurring !== 'none') ? body.recurring : null,
      done:           false,
      sort_order:     (maxRow?.sort_order ?? 0) + 1,
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(insert)
      .select()
      .single()

    if (error) {
      // Return full DB error so we can debug
      console.error('[POST tasks] DB error:', error.message, '| hint:', error.hint, '| details:', error.details)
      return secureJson({ error: error.message, hint: error.hint, details: error.details }, { status: 500 })
    }

    return secureJson(data, { status: 201 })
  } catch (e: any) {
    console.error('[POST tasks] unexpected:', e.message)
    return secureJson({ error: e.message || 'Server error' }, { status: 500 })
  }
}
