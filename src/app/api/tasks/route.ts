import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: ae } = await supabase.auth.getUser()
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: ae } = await supabase.auth.getUser()
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const b = await req.json()
    if (!b.title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    // Get next sort_order
    const { data: maxRow } = await supabase
      .from('tasks').select('sort_order').eq('user_id', user.id)
      .order('sort_order', { ascending: false }).limit(1).maybeSingle()

    // Build insert — only columns that exist in DB (all snake_case)
    const insert: Record<string, any> = {
      user_id:        user.id,
      title:          b.title.trim(),
      description:    b.desc || b.description           || null,
      status:         b.status         || 'todo',
      priority:       b.priority       || 'none',
      due:            b.due            || null,
      due_time:       b.dueTime        || b.due_time        || null,
      estimated_time: toInt(b.estimatedTime ?? b.estimated_time),
      points:         toInt(b.points) ?? 0,
      project_id:     b.project_id     || b.projectId       || null,
      tags:           Array.isArray(b.tags) ? b.tags : [],
      subtasks:       Array.isArray(b.subtasks) ? b.subtasks : [],
      custom_fields:  b.customFields   || b.custom_fields   || null,
      sprint_id:      b.sprintId       || b.sprint_id       || null,
      urgency:        b.urgency        || 'not-urgent',
      importance:     b.importance     || 'important',
      cover_color:    b.coverColor     || b.cover_color     || null,
      recurring:      (b.recurring && b.recurring !== 'none') ? b.recurring : null,
      done:           false,
      sort_order:     (maxRow?.sort_order ?? 0) + 1,
    }

    const { data, error } = await supabase
      .from('tasks').insert(insert).select().single()

    if (error) {
      console.error('POST /api/tasks error:', error.message, error.details)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/tasks unexpected:', e?.message)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

function toInt(v: any): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = parseInt(String(v), 10)
  return isNaN(n) ? null : n
}
