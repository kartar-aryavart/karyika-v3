import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { LIMITS } from '@/lib/security/rate-limit'
import { secureJson } from '@/lib/security/headers'
import { getTasks, createTask } from '@/lib/dal'

// camelCase from form → snake_case DB columns
const COL: Record<string, string> = {
  dueTime: 'due_time', estimatedTime: 'estimated_time',
  customFields: 'custom_fields', sprintId: 'sprint_id',
  coverColor: 'cover_color', projectId: 'project_id',
}
function normalize(b: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(b)) {
    out[COL[k] ?? k] = v === '' ? null : v
  }
  return out
}
function toInt(v: any): number | null {
  if (v == null || v === '') return null
  const n = parseInt(String(v), 10)
  return isNaN(n) ? null : n
}

export async function GET(req: NextRequest) {
  // 1. Auth
  const auth = await getAuthUser()
  if (!auth.ok) return auth.response

  // 2. Rate limit
  const rl = LIMITS.api(auth.user.id)
  if (!rl.allowed) return secureJson(
    { error: 'Too many requests', code: 'RATE_LIMITED' },
    { status: 429, retryAfter: rl.retryAfter }
  )

  // 3. Fetch — DAL enforces user_id isolation
  try {
    const tasks = await getTasks(auth.user.id)
    return secureJson(tasks, { remaining: rl.remaining })
  } catch (e: any) {
    return secureJson({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const auth = await getAuthUser()
  if (!auth.ok) return auth.response

  // 2. Rate limit
  const rl = LIMITS.api(auth.user.id)
  if (!rl.allowed) return secureJson(
    { error: 'Too many requests', code: 'RATE_LIMITED' },
    { status: 429, retryAfter: rl.retryAfter }
  )

  // 3. Parse + validate
  let body: any
  try { body = await req.json() }
  catch { return secureJson({ error: 'Invalid JSON' }, { status: 400 }) }

  const title = body.title?.trim()
  if (!title) return secureJson({ error: 'Title is required' }, { status: 400 })

  // 4. Build clean insert object — only allowed fields
  const raw = normalize(body)
  const payload = {
    title,
    description:    raw.description || raw.desc || null,
    status:         raw.status      || 'todo',
    priority:       raw.priority    || 'none',
    due:            raw.due         || null,
    due_time:       raw.due_time    || null,
    estimated_time: toInt(raw.estimated_time),
    points:         toInt(raw.points) ?? 0,
    project_id:     raw.project_id  || null,
    tags:           Array.isArray(raw.tags) ? raw.tags : [],
    subtasks:       Array.isArray(raw.subtasks) ? raw.subtasks : [],
    custom_fields:  raw.custom_fields || null,
    sprint_id:      raw.sprint_id   || null,
    urgency:        raw.urgency     || 'not-urgent',
    importance:     raw.importance  || 'important',
    cover_color:    raw.cover_color || null,
    recurring:      (raw.recurring && raw.recurring !== 'none') ? raw.recurring : null,
  }

  // 5. Create via DAL
  try {
    const task = await createTask(auth.user.id, payload)
    return secureJson(task, { status: 201, remaining: rl.remaining })
  } catch (e: any) {
    console.error('[POST /api/tasks]', e.message)
    return secureJson({ error: 'Failed to create task' }, { status: 500 })
  }
}
