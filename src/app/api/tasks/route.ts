import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).max(500),
  desc: z.string().optional().nullable(),
  status: z.enum(['todo','in-progress','review','blocked','hold','done','cancelled']).default('todo'),
  priority: z.enum(['urgent','high','medium','low','none']).default('none'),
  due: z.string().optional().nullable(),
  dueTime: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  estimatedTime: z.number().int().positive().optional().nullable(),
  points: z.number().int().optional().default(0),
  project_id: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  subtasks: z.array(z.object({ id: z.string(), title: z.string(), done: z.boolean() })).default([]),
  customFields: z.record(z.string()).optional().nullable(),
  sprintId: z.string().optional().nullable(),
  urgency: z.string().optional().nullable(),
  importance: z.string().optional().nullable(),
  coverColor: z.string().optional().nullable(),
  recurring: z.any().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: ae } = await supabase.auth.getUser()
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const sp = req.nextUrl.searchParams
    let q = supabase.from('tasks').select('*, projects(name,color,emoji)').eq('user_id', user.id).order('sort_order', { ascending: true }).order('created_at', { ascending: false })
    if (sp.get('status'))     q = q.eq('status', sp.get('status')!)
    if (sp.get('priority'))   q = q.eq('priority', sp.get('priority')!)
    if (sp.get('project_id')) q = q.eq('project_id', sp.get('project_id')!)
    if (sp.get('done') === 'true') q = q.eq('done', true)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: ae } = await supabase.auth.getUser()
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    const { data: maxRow } = await supabase.from('tasks').select('sort_order').eq('user_id', user.id).order('sort_order', { ascending: false }).limit(1).single()
    const { data, error } = await supabase.from('tasks').insert({ ...parsed.data, user_id: user.id, done: false, sort_order: (maxRow?.sort_order ?? 0) + 1 }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}
