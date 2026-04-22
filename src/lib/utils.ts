import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TaskPriority, TaskStatus } from '@/types'

// ─── cn() — merge Tailwind classes ───────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatDueDate(due_date: string | null): string {
  if (!due_date) return ''

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(due_date + 'T00:00:00')
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return due.toLocaleDateString('en-IN', { weekday: 'short' })

  return due.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export function isOverdue(due_date: string | null, status: TaskStatus): boolean {
  if (!due_date || status === 'done' || status === 'cancelled') return false
  return new Date(due_date + 'T23:59:59') < new Date()
}

export function isToday(due_date: string | null): boolean {
  if (!due_date) return false
  const today = new Date().toISOString().split('T')[0]
  return due_date === today
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

export function getGreeting(name?: string | null): string {
  const hour = new Date().getHours()
  const prefix =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    hour < 21 ? 'Good evening' :
    'Good night'

  return name ? `${prefix}, ${name.split(' ')[0]}` : prefix
}

// ─── Life Score calculator ────────────────────────────────────────────────────

export function calculateLifeScore({
  tasksCompleted,
  tasksTotal,
  habitsCompleted,
  habitsTotal,
  goalsActive,
}: {
  tasksCompleted: number
  tasksTotal: number
  habitsCompleted: number
  habitsTotal: number
  goalsActive: number
}): number {
  const taskScore   = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 40 : 0
  const habitScore  = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 40 : 0
  const goalScore   = Math.min(goalsActive * 4, 20)
  return Math.round(taskScore + habitScore + goalScore)
}

// ─── Priority config ──────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bg: string; dot: string; order: number }
> = {
  urgent: { label: 'Urgent', color: '#EF4444', bg: '#FEF2F2', dot: 'bg-red-500',    order: 0 },
  high:   { label: 'High',   color: '#F59E0B', bg: '#FFFBEB', dot: 'bg-amber-500',  order: 1 },
  medium: { label: 'Medium', color: '#6366F1', bg: '#EEF2FF', dot: 'bg-indigo-500', order: 2 },
  low:    { label: 'Low',    color: '#10B981', bg: '#ECFDF5', dot: 'bg-emerald-500',order: 3 },
  none:   { label: 'None',   color: '#A8A6A2', bg: '#F5F5F4', dot: 'bg-stone-400',  order: 4 },
}

// ─── Status config ────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string }
> = {
  todo:        { label: 'To Do',       color: '#6B6B69', bg: '#F5F5F4' },
  'in-progress': { label: 'In Progress', color: '#6366F1', bg: '#EEF2FF' },
  review:      { label: 'In Review',   color: '#F59E0B', bg: '#FFFBEB' },
  done:        { label: 'Done',        color: '#10B981', bg: '#ECFDF5' },
  blocked:     { label: 'Blocked',     color: '#EF4444', bg: '#FEF2F2' },
  hold:        { label: 'On Hold',     color: '#A8A6A2', bg: '#F5F5F4' },
  cancelled:   { label: 'Cancelled',   color: '#A8A6A2', bg: '#F5F5F4' },
}

// ─── Truncate text ────────────────────────────────────────────────────────────

export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

// ─── Generate a random ID (temp, for optimistic updates) ─────────────────────

export function tempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
