'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, PRIORITY_CONFIG } from '@/lib/utils'
import type { Task } from '@/types'
import { useCompleteTask, useDeleteTask } from '@/hooks/useTasks'

// ─── Icons (inline SVG for zero-dep) ────────────────────────────────────────

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 1v3M11 1v3M1.5 6h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDueDate(due_date: string | null | undefined): { label: string; isOverdue: boolean; isToday: boolean } {
  if (!due_date) return { label: '', isOverdue: false, isToday: false }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(due_date + 'T00:00:00')

  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isToday: false }
  if (diffDays === 0) return { label: 'Today', isOverdue: false, isToday: true }
  if (diffDays === 1) return { label: 'Tomorrow', isOverdue: false, isToday: false }
  if (diffDays < 7) return { label: due.toLocaleDateString('en-IN', { weekday: 'short' }), isOverdue: false, isToday: false }

  return {
    label: due.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    isOverdue: false,
    isToday: false,
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task
  onEdit?: (task: Task) => void
  index?: number
}

export function TaskRow({ task, onEdit, index = 0 }: TaskRowProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const deleteConfirmRef = useRef(false)

  const completeTask = useCompleteTask()
  const deleteTask = useDeleteTask()

  const isDone = task.status === 'done'
  const priority = PRIORITY_CONFIG[task.priority]
  const { label: dueDateLabel, isOverdue, isToday } = formatDueDate(task.due)

  const handleComplete = useCallback(async () => {
    if (isCompleting) return
    setIsCompleting(true)

    await completeTask.mutateAsync({ id: task.id, done: !isDone })

    // Small delay before resetting so animation plays
    setTimeout(() => setIsCompleting(false), 400)
  }, [completeTask, isCompleting, isDone, task.id])

  const handleDelete = useCallback(() => {
    deleteTask.mutate(task.id)
  }, [deleteTask, task.id])

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
      transition={{ duration: 0.15, delay: index * 0.03 }}
      className={cn(
        'task-row group relative flex items-center gap-3 px-4 py-[11px]',
        'border-b border-[var(--border-subtle)] last:border-0',
        'cursor-pointer select-none',
        'transition-colors duration-[50ms]',
        isDone && 'opacity-50',
        isHovered && 'bg-[var(--bg-hover)]'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit?.(task)}
    >
      {/* Checkbox */}
      <button
        className={cn(
          'task-checkbox flex-shrink-0 w-[18px] h-[18px] rounded-full border-2',
          'flex items-center justify-center',
          'transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-1',
          isDone
            ? 'bg-[#10B981] border-[#10B981]'
            : 'border-[var(--border-strong)] hover:border-[#6366F1]',
          isCompleting && 'scale-110'
        )}
        style={{
          animation: isCompleting ? 'taskComplete 350ms var(--ease-spring) forwards' : undefined,
        }}
        onClick={(e) => {
          e.stopPropagation()
          handleComplete()
        }}
        aria-label={isDone ? 'Mark as incomplete' : 'Mark as complete'}
      >
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <CheckIcon className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Priority dot */}
      {task.priority !== 'none' && (
        <span
          className={cn('flex-shrink-0 w-[6px] h-[6px] rounded-full', priority.dot)}
          aria-label={`Priority: ${priority.label}`}
        />
      )}

      {/* Title */}
      <span
        className={cn(
          'flex-1 text-[14px] leading-snug text-[var(--text-primary)]',
          'transition-all duration-150',
          isDone && 'line-through text-[var(--text-tertiary)]'
        )}
      >
        {task.title}
      </span>

      {/* Metadata (due date + tags) */}
      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        {dueDateLabel && (
          <span
            className={cn(
              'flex items-center gap-1 text-[11px] font-medium tracking-wide',
              'transition-colors duration-100',
              isOverdue
                ? 'text-[#EF4444]'
                : isToday
                ? 'text-[#6366F1]'
                : 'text-[var(--text-tertiary)]'
            )}
          >
            <CalendarIcon className="w-3 h-3" />
            {dueDateLabel}
          </span>
        )}

        {task.tags.length > 0 && (
          <span className="text-[11px] text-[var(--text-tertiary)] hidden sm:inline">
            {task.tags[0]}
            {task.tags.length > 1 && ` +${task.tags.length - 1}`}
          </span>
        )}
      </div>

      {/* Hover actions */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex items-center gap-1 ml-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDelete}
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-md',
                'text-[var(--text-tertiary)] hover:text-[#EF4444]',
                'hover:bg-[#FEF2F2] transition-colors duration-100',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444]'
              )}
              aria-label="Delete task"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
