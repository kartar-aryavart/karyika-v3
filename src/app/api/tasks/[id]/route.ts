import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: ae } = await supabase.auth.getUser()
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    // Strip undefined + convert '' to null for number fields
    const clean: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      if (v === undefined) continue
      if ((k === 'estimatedTime' || k === 'actualTime' || k === 'points') && v === '') {
        clean[k] = null
      } else {
        clean[k] = v
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
      console.error('[PATCH /api/tasks/[id]]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error('[PATCH /api/tasks/[id]] unexpected:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: ae } = await supabase.auth.getUser()
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[DELETE /api/tasks/[id]]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error('[DELETE /api/tasks/[id]] unexpected:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
