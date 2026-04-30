import { NextResponse } from 'next/server'

// Debug endpoint disabled in production
export async function GET() {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' })

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('id, email, role').eq('id', user.id).single()

    const { data: testTask, error: insertError } = await supabase
      .from('tasks')
      .insert({ user_id: user.id, title: '__debug_test__', status: 'todo', priority: 'none', tags: [], subtasks: [], done: false, sort_order: 9999 })
      .select().single()

    if (testTask) await supabase.from('tasks').delete().eq('id', testTask.id)

    return NextResponse.json({
      auth: { userId: user.id, email: user.email },
      profile,
      profileError: profileError?.message ?? null,
      testInsert: testTask ? '✅ INSERT works!' : '❌ INSERT failed',
      insertError: insertError ? { message: insertError.message, hint: insertError.hint, code: insertError.code } : null,
    })
  } catch (e: any) {
    return NextResponse.json({ fatal: e.message })
  }
}
