import { TaskStatus } from './index'

// ─── Core Task Entity ────────────────────────────────────────────────────────

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  parent_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'none'
  due_date: string | null        // YYYY-MM-DD
  due_time: string | null        // HH:MM
  estimated_minutes: number | null
  actual_minutes: number | null
  tags: string[]
  sort_order: number
  is_recurring: boolean
  recurrence_rule: string | null // rrule string
  completed_at: string | null    // ISO datetime
  created_at: string
  updated_at: string
}

// ─── Input Types ────────────────────────────────────────────────────────────

export interface TaskCreateInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: 'urgent' | 'high' | 'medium' | 'low' | 'none'
  due_date?: string
  due_time?: string
  estimated_minutes?: number
  project_id?: string
  parent_id?: string
  tags?: string[]
}

export interface TaskUpdateInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: 'urgent' | 'high' | 'medium' | 'low' | 'none'
  due_date?: string | null
  due_time?: string | null
  estimated_minutes?: number | null
  actual_minutes?: number | null
  project_id?: string | null
  tags?: string[]
  sort_order?: number
  completed_at?: string | null
}

// ─── Filter Types ────────────────────────────────────────────────────────────

export interface TaskFilters {
  status?: TaskStatus
  priority?: 'urgent' | 'high' | 'medium' | 'low' | 'none'
  project_id?: string
  due_date?: string
}

// ─── AI Parse Types ──────────────────────────────────────────────────────────

export interface ParsedTask {
  title: string
  due_date?: string
  due_time?: string
  priority?: 'urgent' | 'high' | 'medium' | 'low' | 'none'
  project_hint?: string
  tags?: string[]
}

// Note: PRIORITY_CONFIG and STATUS_CONFIG are defined in @/lib/utils


