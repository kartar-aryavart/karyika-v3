import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Map camelCase keys from client → snake_case DB columns
const toSnake: Record<string, string> = {
  dueTime: 'due_time', startDate: 'start_date', estimatedTime: 'estimated_time',
  actualTime: 'actual_time', customFields: 'custom_fields', sprintId: 'sprint_id',
  coverColor: 'cover_color', completedAt: 'completed_at', assigneeId: 'assignee_id',
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: ae } = await supabase.auth.getUser()
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    // Normalize keys + clean empty strings
    const clean: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      if (v === undefined) continue
      const col = toSnake[k] ?? k  // remap camelCase → snake_case
      // Convert '' → null for numeric/optional fields
      if (['estimated_time', 'actual_time', 'points'].includes(col) && v === '') {
        clean[col] = null
      } else {
        clean[col] = v
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(clean)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[PATCH /api/tasks/[id]]', error.message, error.hint)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error('[PATCH /api/tasks/[id]] unexpected:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: ae } = await supabase.auth.getUser()
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id)

    if (error) {
      console.error('[DELETE /api/tasks/[id]]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error('[DELETE /api/tasks/[id]] unexpected:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
