import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// TEMPORARY debug endpoint — remove after fixing
// GET /api/debug → shows auth + DB state
export async function GET() {
  try {
    const supabase = await createClient()
    
    // 1. Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated', detail: authError?.message })
    }

    // 2. Check if profiles table has user + role column
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', user.id)
      .single()

    // 3. Try a simple task INSERT to get exact DB error
    const { data: testTask, error: insertError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: '__debug_test__',
        status: 'todo',
        priority: 'none',
        tags: [],
        subtasks: [],
        done: false,
        sort_order: 9999,
      })
      .select()
      .single()

    // 4. If insert succeeded, delete it
    if (testTask) {
      await supabase.from('tasks').delete().eq('id', testTask.id)
    }

    return NextResponse.json({
      auth: { userId: user.id, email: user.email },
      profile: profile ?? null,
      profileError: profileError?.message ?? null,
      testInsert: testTask ? '✅ INSERT works!' : '❌ INSERT failed',
      insertError: insertError ? {
        message: insertError.message,
        hint: insertError.hint,
        details: insertError.details,
        code: insertError.code,
      } : null,
    })
  } catch (e: any) {
    return NextResponse.json({ fatal: e.message })
  }
}
