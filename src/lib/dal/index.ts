/**
 * KARYIKA — Data Access Layer (DAL)
 *
 * ALL database queries go through here — never raw Supabase calls in routes.
 * Benefits:
 *   - Single place to enforce user_id isolation
 *   - Easy to audit/test
 *   - Consistent error handling
 *   - RLS is a backup, DAL is the primary guard
 */
import { createClient } from '@/lib/supabase/server'

// ─── TASKS ───────────────────────────────────────────────────────────────────

export async function getTasks(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)        // ← ALWAYS filter by user_id
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createTask(userId: string, payload: Record<string, any>) {
  const supabase = await createClient()

  // Get next sort_order
  const { data: maxRow } = await supabase
    .from('tasks').select('sort_order').eq('user_id', userId)
    .order('sort_order', { ascending: false }).limit(1).maybeSingle()

  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...payload, user_id: userId, done: false, sort_order: (maxRow?.sort_order ?? 0) + 1 })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateTask(userId: string, taskId: string, payload: Record<string, any>) {
  const supabase = await createClient()

  // Double-check ownership before update (RLS is backup)
  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .eq('user_id', userId)        // ← CRITICAL: user can only update own tasks
    .select()
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Task not found or access denied')
  return data
}

export async function deleteTask(userId: string, taskId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId)        // ← CRITICAL: user can only delete own tasks

  if (error) throw new Error(error.message)
}

// ─── PROJECTS ────────────────────────────────────────────────────────────────

export async function getProjects(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'archived')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createProject(userId: string, payload: Record<string, any>) {
  const supabase = await createClient()
  const { data: last } = await supabase
    .from('projects').select('sort_order').eq('user_id', userId)
    .order('sort_order', { ascending: false }).limit(1).maybeSingle()

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...payload, user_id: userId, status: 'active', sort_order: (last?.sort_order ?? 0) + 1 })
    .select().single()

  if (error) throw new Error(error.message)
  return data
}

// ─── HABITS ──────────────────────────────────────────────────────────────────

export async function getHabits(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createHabit(userId: string, payload: Record<string, any>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('habits')
    .insert({ ...payload, user_id: userId, logs: {}, current_streak: 0, longest_streak: 0, is_archived: false })
    .select().single()

  if (error) throw new Error(error.message)
  return data
}

// ─── GOALS ───────────────────────────────────────────────────────────────────

export async function getGoals(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createGoal(userId: string, payload: Record<string, any>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('goals')
    .insert({ ...payload, user_id: userId, current: 0, linked_task_ids: [], milestones: [], check_ins: [] })
    .select().single()

  if (error) throw new Error(error.message)
  return data
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, avatar_url, role, theme, timezone, created_at')
    .eq('id', userId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ─── ADMIN ONLY — uses service role ──────────────────────────────────────────

export async function adminGetAllUsers() {
  // Service role client — bypasses RLS
  // ONLY called from admin routes after requireRole('super_admin')
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function adminUpdateUserRole(
  targetUserId: string,
  role: 'user' | 'admin' | 'super_admin'
) {
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', targetUserId)
    .select().single()

  if (error) throw new Error(error.message)
  return data
}
