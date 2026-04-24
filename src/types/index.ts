// ─── TASK ────────────────────────────────────────────────────────────────────
export type TaskStatus   = 'todo' | 'in-progress' | 'review' | 'blocked' | 'hold' | 'done' | 'cancelled'
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  user_id: string
  project_id?: string | null
  parent_id?: string | null
  title: string
  desc?: string | null
  status: TaskStatus
  priority: TaskPriority
  due?: string | null          // YYYY-MM-DD
  dueTime?: string | null      // HH:MM
  startDate?: string | null
  estimatedTime?: number | null // minutes
  actualTime?: number | null
  points?: number              // story points: 0,1,2,3,5,8,13,21
  assigneeId?: string | null
  tags: string[]
  subtasks: Subtask[]
  customFields?: Record<string, string>
  dependencies?: { blocks: string[]; waitingOn: string[]; relatesTo: string[] }
  recurring?: string | null  // 'none'|'daily'|'weekdays'|'weekly'|'monthly'
  sprintId?: string | null     // 'backlog' | 'sprint-1' | 'sprint-2'
  urgency?: 'urgent' | 'not-urgent'
  importance?: 'important' | 'not-important'
  coverColor?: string
  done: boolean
  completedAt?: string | null
  sort_order?: number
  created_at: string
  updated_at: string
  // from join
  projectName?: string
  projectColor?: string
  projectEmoji?: string
}

export interface TaskCreateInput {
  title: string
  desc?: string
  status?: TaskStatus
  priority?: TaskPriority
  due?: string
  dueTime?: string
  startDate?: string
  estimatedTime?: number
  points?: number
  project_id?: string
  tags?: string[]
  subtasks?: Subtask[]
  customFields?: Record<string, string>
  recurring?: string | null
  sprintId?: string
  urgency?: string
  importance?: string
  coverColor?: string
}

export interface TaskUpdateInput extends Partial<TaskCreateInput> {
  done?: boolean
  status?: TaskStatus
  completedAt?: string | null
  actualTime?: number
}

// ─── PROJECT ──────────────────────────────────────────────────────────────────
export interface Project {
  id: string
  user_id: string
  name: string
  description?: string | null
  color: string
  emoji?: string | null
  status: 'active' | 'archived' | 'done'
  sort_order: number
  created_at: string
  updated_at: string
}

// ─── HABIT ────────────────────────────────────────────────────────────────────
export interface Habit {
  id: string
  user_id: string
  name: string
  emoji?: string | null
  color: string
  frequency: 'daily' | 'weekly' | 'custom'
  targetDays: number[]           // 0=Sun..6=Sat
  targetType: 'boolean' | 'count' | 'duration'
  targetValue: number
  targetUnit?: string | null
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime'
  currentStreak: number
  longestStreak: number
  logs: Record<string, boolean | number>  // { 'YYYY-MM-DD': true | count }
  skipProtection: boolean
  isArchived: boolean
  created_at: string
  updated_at: string
}

// ─── GOAL ─────────────────────────────────────────────────────────────────────
export type GoalLifeArea = 'career' | 'health' | 'finance' | 'relationships' | 'learning' | 'fun' | 'spiritual' | 'home'
export type GoalType = 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'project' | 'personal'
export type GoalStatus = 'on-track' | 'at-risk' | 'behind' | 'completed' | 'paused'

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string | null
  type: GoalType
  lifeArea: GoalLifeArea
  status: GoalStatus
  target: number
  current: number
  unit?: string | null
  color: string
  emoji?: string | null
  dueDate?: string | null
  linkedTaskIds: string[]
  milestones: { id: string; title: string; done: boolean; dueDate?: string }[]
  checkIns: { date: string; note: string; value: number }[]
  created_at: string
  updated_at: string
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  name?: string | null
  avatar_url?: string | null
  theme: 'dark' | 'light' | 'system'
  timezone: string
  onboarding_completed: boolean
  life_score: number
  lang: 'en' | 'hi'
  created_at: string
  updated_at: string
}

// ─── NOTIFICATION ──────────────────────────────────────────────────────────────
export interface AppNotification {
  id: string
  user_id: string
  title: string
  body?: string | null
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  link?: string | null
  created_at: string
}

// ─── UI STATE ─────────────────────────────────────────────────────────────────
export type TaskView = 'list' | 'kanban' | 'sprint' | 'matrix'
export type TaskFilter = 'all' | 'today' | 'pending' | 'overdue' | 'completed' | 'no-due' | 'tomorrow'

export interface Toast {
  id: number
  msg: string
  type: 'success' | 'error' | 'info' | 'warning'
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
export const PRI_COLOR: Record<string, string> = {
  urgent: '#F97316', high: '#F43F5E', medium: '#F59E0B', low: '#10B981', none: '#6B7280'
}
export const PRI_BG: Record<string, string> = {
  urgent: 'rgba(249,115,22,0.1)', high: 'rgba(244,63,94,0.1)',
  medium: 'rgba(245,158,11,0.1)', low: 'rgba(16,185,129,0.1)', none: 'rgba(107,114,128,0.1)'
}
export const STATUS_COLOR: Record<string, string> = {
  'todo': '#6B7280', 'in-progress': '#F59E0B', 'review': '#818CF8',
  'blocked': '#F43F5E', 'hold': '#F97316', 'done': '#10B981', 'cancelled': '#4B5563'
}
export const STATUS_LABEL: Record<string, string> = {
  'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'In Review',
  'blocked': 'Blocked', 'hold': 'On Hold', 'done': 'Done', 'cancelled': 'Cancelled'
}
export const STATUSES = Object.entries(STATUS_LABEL).map(([id, label]) => ({ id, label, color: STATUS_COLOR[id] }))
export const TASK_TEMPLATES: { label: string; priority: string; tags: string[]; estimatedTime: string; desc: string }[] = [
  { label: '🐛 Bug Report',    priority: 'high',   tags: ['bug'],       estimatedTime: '60',  desc: 'Steps to reproduce:\n1. \n\nExpected:\nActual:' },
  { label: '✨ Feature',        priority: 'medium', tags: ['feature'],   estimatedTime: '120', desc: 'User story: As a user, I want to...' },
  { label: '📝 Documentation', priority: 'low',    tags: ['docs'],      estimatedTime: '30',  desc: 'Document the following:' },
  { label: '🔍 Research',      priority: 'medium', tags: ['research'],  estimatedTime: '90',  desc: 'Research goal:\nKey questions:' },
  { label: '📞 Meeting',       priority: 'medium', tags: ['meeting'],   estimatedTime: '45',  desc: 'Agenda:\n1. \n\nAction items:' },
  { label: '🚀 Release',       priority: 'urgent', tags: ['release'],   estimatedTime: '180', desc: 'Version:\nChangelog:' },
]
export const todayStr = () => new Date().toISOString().split('T')[0]
export const fmt = (d?: string | null) => {
  if (!d) return ''
  try { return new Date(d + 'T00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) }
  catch { return d }
}
export const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ')
