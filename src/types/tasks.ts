

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

// ─── Config Maps ─────────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<
  'urgent' | 'high' | 'medium' | 'low' | 'none',
  { label: string; color: string; bg: string; dot: string; order: number }
> = {
  urgent: { label: 'Urgent', color: '#EF4444', bg: '#FEF2F2', dot: 'bg-red-500',   order: 0 },
  high:   { label: 'High',   color: '#F59E0B', bg: '#FFFBEB', dot: 'bg-amber-500', order: 1 },
  medium: { label: 'Medium', color: '#6366F1', bg: '#EEF2FF', dot: 'bg-indigo-500',order: 2 },
  low:    { label: 'Low',    color: '#10B981', bg: '#ECFDF5', dot: 'bg-emerald-500',order: 3 },
  none:   { label: 'None',   color: '#A8A6A2', bg: '#F5F5F4', dot: 'bg-stone-400', order: 4 },
}

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string }
> = {
  todo:        { label: 'To Do',      color: '#6B6B69', bg: '#F5F5F4' },
  'in-progress': { label: 'In Progress',color: '#6366F1', bg: '#EEF2FF' },
  review:      { label: 'In Review',  color: '#F59E0B', bg: '#FFFBEB' },
  done:        { label: 'Done',       color: '#10B981', bg: '#ECFDF5' },
  blocked:     { label: 'Blocked',    color: '#EF4444', bg: '#FEF2F2' },
  hold:        { label: 'On Hold',    color: '#A8A6A2', bg: '#F5F5F4' },
  cancelled:   { label: 'Cancelled',  color: '#6B6B69', bg: '#F5F5F4' },
}

// ─── Core Task Entity ────────────────────────────────────────────────────────

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  parent_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
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
  priority?: TaskPriority
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
  priority?: TaskPriority
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
  priority?: TaskPriority
  project_id?: string
  due_date?: string
}

// ─── View Types ─────────────────────────────────────────────────────────────




  | 'overdue'
  | 'today'
  | 'tomorrow'
  | 'this_week'
  | 'later'
  | 'no_date'
  | 'done'


  key: TaskGroupKey
  label: string
  tasks: Task[]
  isOverdue?: boolean
}

// ─── AI Parse Types ──────────────────────────────────────────────────────────

export interface ParsedTask {
  title: string
  due_date?: string
  due_time?: string
  priority?: TaskPriority
  project_hint?: string
  tags?: string[]
}

// ─── Config Maps ─────────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bg: string; dot: string; order: number }
> = {
  urgent: { label: 'Urgent', color: '#EF4444', bg: '#FEF2F2', dot: 'bg-red-500',   order: 0 },
  high:   { label: 'High',   color: '#F59E0B', bg: '#FFFBEB', dot: 'bg-amber-500', order: 1 },
  medium: { label: 'Medium', color: '#6366F1', bg: '#EEF2FF', dot: 'bg-indigo-500',order: 2 },
  low:    { label: 'Low',    color: '#10B981', bg: '#ECFDF5', dot: 'bg-emerald-500',order: 3 },
  none:   { label: 'None',   color: '#A8A6A2', bg: '#F5F5F4', dot: 'bg-stone-400', order: 4 },
}

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string }
> = {
  todo:        { label: 'To Do',      color: '#6B6B69', bg: '#F5F5F4' },
  'in-progress': { label: 'In Progress',color: '#6366F1', bg: '#EEF2FF' },
  review:      { label: 'In Review',  color: '#F59E0B', bg: '#FFFBEB' },
  done:        { label: 'Done',       color: '#10B981', bg: '#ECFDF5' },
  blocked:     { label: 'Blocked',    color: '#EF4444', bg: '#FEF2F2' },
  hold:        { label: 'On Hold',    color: '#A8A6A2', bg: '#F5F5F4' },
  cancelled:   { label: 'Cancelled',  color: '#6B6B69', bg: '#F5F5F4' },
}// ─── Enums / Union Types ────────────────────────────────────────────────────

// TaskStatus and TaskPriority are imported from '@/types'

// ─── Core Task Entity ────────────────────────────────────────────────────────

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  parent_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
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
  priority?: TaskPriority
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
  priority?: TaskPriority
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
  priority?: TaskPriority
  project_id?: string
  due_date?: string
}

// ─── View Types ─────────────────────────────────────────────────────────────




  | 'overdue'
  | 'today'
  | 'tomorrow'
  | 'this_week'
  | 'later'
  | 'no_date'
  | 'done'


  key: TaskGroupKey
  label: string
  tasks: Task[]
  isOverdue?: boolean
}

// ─── AI Parse Types ──────────────────────────────────────────────────────────

export interface ParsedTask {
  title: string
  due_date?: string
  due_time?: string
  priority?: TaskPriority
  project_hint?: string
  tags?: string[]
}

// ─── Config Maps ─────────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bg: string; dot: string; order: number }
> = {
  urgent: { label: 'Urgent', color: '#EF4444', bg: '#FEF2F2', dot: 'bg-red-500',   order: 0 },
  high:   { label: 'High',   color: '#F59E0B', bg: '#FFFBEB', dot: 'bg-amber-500', order: 1 },
  medium: { label: 'Medium', color: '#6366F1', bg: '#EEF2FF', dot: 'bg-indigo-500',order: 2 },
  low:    { label: 'Low',    color: '#10B981', bg: '#ECFDF5', dot: 'bg-emerald-500',order: 3 },
  none:   { label: 'None',   color: '#A8A6A2', bg: '#F5F5F4', dot: 'bg-stone-400', order: 4 },
}

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string }
> = {
  todo:        { label: 'To Do',      color: '#6B6B69', bg: '#F5F5F4' },
  'in-progress': { label: 'In Progress',color: '#6366F1', bg: '#EEF2FF' },
  review:      { label: 'In Review',  color: '#F59E0B', bg: '#FFFBEB' },
  done:        { label: 'Done',       color: '#10B981', bg: '#ECFDF5' },
  blocked:     { label: 'Blocked',    color: '#EF4444', bg: '#FEF2F2' },
  hold:        { label: 'On Hold',    color: '#A8A6A2', bg: '#F5F5F4' },
  cancelled:   { label: 'Cancelled',  color: '#6B6B69', bg: '#F5F5F4' },
}// ─── Enums / Union Types ────────────────────────────────────────────────────

// TaskStatus and TaskPriority are imported from '@/types'

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'

// ─── Core Task Entity ────────────────────────────────────────────────────────

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  parent_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
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
  priority?: TaskPriority
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
  priority?: TaskPriority
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
  priority?: TaskPriority
  project_id?: string
  due_date?: string
}

// ─── View Types ─────────────────────────────────────────────────────────────




  | 'overdue'
  | 'today'
  | 'tomorrow'
  | 'this_week'
  | 'later'
  | 'no_date'
  | 'done'


  key: TaskGroupKey
  label: string
  tasks: Task[]
  isOverdue?: boolean
}

// ─── AI Parse Types ──────────────────────────────────────────────────────────

export interface ParsedTask {
  title: string
  due_date?: string
  due_time?: string
  priority?: TaskPriority
  project_hint?: string
  tags?: string[]
}

// ─── Config Maps ─────────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bg: string; dot: string; order: number }
> = {
  urgent: { label: 'Urgent', color: '#EF4444', bg: '#FEF2F2', dot: 'bg-red-500',   order: 0 },
  high:   { label: 'High',   color: '#F59E0B', bg: '#FFFBEB', dot: 'bg-amber-500', order: 1 },
  medium: { label: 'Medium', color: '#6366F1', bg: '#EEF2FF', dot: 'bg-indigo-500',order: 2 },
  low:    { label: 'Low',    color: '#10B981', bg: '#ECFDF5', dot: 'bg-emerald-500',order: 3 },
  none:   { label: 'None',   color: '#A8A6A2', bg: '#F5F5F4', dot: 'bg-stone-400', order: 4 },
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = \{ todo: \{ label: 'To Do', color: '#6B6B69', bg: '#F5F5F4' \}, 'in-progress': \{ label: 'In Progress', color: '#6366F1', bg: '#EEF2FF' \}, review: \{ label: 'In Review', color: '#F59E0B', bg: '#FFFBEB' \}, done: \{ label: 'Done', color: '#10B981', bg: '#ECFDF5' \}, blocked: \{ label: 'Blocked', color: '#EF4444', bg: '#FEF2F2' \}, hold: \{ label: 'On Hold', color: '#A8A6A2', bg: '#F5F5F4' \}, cancelled: \{ label: 'Cancelled', color: '#6B6B69', bg: '#F5F5F4' \} \} ;
  TaskStatus,
  { label: string; color: string; bg: string }
> = {
  todo:        { label: 'To Do',      color: '#6B6B69', bg: '#F5F5F4' },
  'in-progress': \{ label: 'In Progress', color: '#6366F1', bg: '#EEF2FF' \},
  review:   { label: 'In Review',  color: '#F59E0B', bg: '#FFFBEB' },
  done:        { label: 'Done',       color: '#10B981', bg: '#ECFDF5' },
  cancelled:   { label: 'Cancelled',  color: '#A8A6A2', bg: '#F5F5F4' },
}
