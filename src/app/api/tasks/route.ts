import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Coerce '' → null for optional number fields
const optNum = z.union([
  z.number(),
  z.string().transform(s => s === '' ? null : (Number(s) || null)),
  z.null(),
]).optional().nullable()

const schema = z.object({
  title:          z.string().min(1).max(500),
  desc:           z.string().optional().nullable(),
  status:         z.enum(['todo','in-progress','review','blocked','hold','done','cancelled']).default('todo'),
  priority:       z.enum(['urgent','high','medium','low','none']).default('none'),
  due:            z.string().optional().nullable(),
  due_time:       z.string().optional().nullable(),
  // Accept both camelCase (from form) and snake_case
  dueTime:        z.string().optional().nullable(),
  start_date:     z.string().optional().nullable(),
  startDate:      z.string().optional().nullable(),
  estimated_time: optNum,
  estimatedTime:  optNum,
  points:         z.union([z.number(), z.string().transform(s => Number(s) || 0)]).optional().default(0),
  project_id:     z.string().uuid().optional().nullable(),
  projectId:      z.string().optional().nullable(),
  tags:           z.array(z.string()).default([]),
  subtasks:       z.array(z.object({ id: z.string(), title: z.string(), done: z.boolean() })).default([]),
  custom_fields:  z.record(z.string()).optional().nullable(),
  customFields:   z.record(z.string()).optional().nullable(),
  sprint_id:      z.string().optional().nullable(),
  sprintId:       z.string().optional().nullable(),
  urgency:        z.string().optional().nullable(),
  importance:     z.string().optional().nullable(),
  cover_color:    z.string().optional().nullable(),
  coverColor:     z.string().optional().nullable(),
  recurring:      z.string().optional().nullable(),
  // Fields to strip
  category:       z.string().optional().nullable(),
  assignees:      z.array(z.any()).optional(),
  reminder:       z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: ae } = await supabase.auth.getUser()
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sp = req.nextUrl.searchParams
    let q = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (sp.get('status'))     q = q.eq('status', sp.get('status')!)
    if (sp.get('priority'))   q = q.eq('priority', sp.get('priority')!)
    if (sp.get('project_id')) q = q.eq('project_id', sp.get('project_id')!)
    if (sp.get('done') === 'true') q = q.eq('done', true)

    const { data, error } = await q
    if (error) {
      console.error('[GET /api/tasks]', error.message, error.details)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error('[GET /api/tasks] unexpected:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: ae } = await supabase.auth.getUser()
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      console.error('[POST /api/tasks] validation failed:', parsed.error.flatten())
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const d = parsed.data

    // Normalize camelCase → snake_case (accept either from client)
    const insertData = {
      title:          d.title,
      desc:           d.desc || null,
      status:         d.status,
      priority:       d.priority,
      due:            d.due || null,
      due_time:       d.due_time || d.dueTime || null,
      start_date:     d.start_date || d.startDate || null,
      estimated_time: d.estimated_time ?? d.estimatedTime ?? null,
      points:         d.points ?? 0,
      project_id:     d.project_id || d.projectId || null,
      tags:           d.tags ?? [],
      subtasks:       d.subtasks ?? [],
      custom_fields:  d.custom_fields || d.customFields || null,
      sprint_id:      d.sprint_id || d.sprintId || null,
      urgency:        d.urgency || 'not-urgent',
      importance:     d.importance || 'important',
      cover_color:    d.cover_color || d.coverColor || null,
      recurring:      d.recurring && d.recurring !== 'none' ? d.recurring : null,
      user_id:        user.id,
      done:           false,
    }

    // Get next sort_order
    const { data: maxRow } = await supabase
      .from('tasks')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...insertData, sort_order: (maxRow?.sort_order ?? 0) + 1 })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/tasks] DB error:', error.message, error.details, error.hint)
      return NextResponse.json({ error: error.message, hint: error.hint }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('[POST /api/tasks] unexpected:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
