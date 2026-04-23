'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn, PRIORITY_CONFIG } from '@/lib/utils'
import type { Task } from '@/types'
import { useCompleteTask, useDeleteTask } from '@/hooks/useTasks'

// ─── Drag Handle Icon ─────────────────────────────────────────────────────────

function DragHandle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="4" r="1.2" />
      <circle cx="11" cy="4" r="1.2" />
      <circle cx="5" cy="8" r="1.2" />
      <circle cx="11" cy="8" r="1.2" />
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="11" cy="12" r="1.2" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const completeTask = useCompleteTask()
  const deleteTask = useDeleteTask()

  const isDone = task.status === 'done'
  const priority = PRIORITY_CONFIG[task.priority]

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dueDateDisplay = task.due
    ? new Date(task.due + 'T00:00:00').toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      })
    : null

  const isOverdue = task.due
    ? new Date(task.due + 'T23:59:59') < new Date() && !isDone
    : false

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'task-card group relative',
        'bg-[var(--bg-primary)] rounded-xl',
        'border border-[var(--border-subtle)]',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
        'p-3 cursor-pointer',
        'transition-all duration-150',
        isDragging && 'shadow-xl scale-[1.02] rotate-[1.5deg] opacity-95 z-50',
        isHovered && !isDragging && 'shadow-md border-[var(--border-default)]',
        isDone && 'opacity-60'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit?.(task)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute left-1.5 top-1/2 -translate-y-1/2',
          'w-5 h-5 flex items-center justify-center',
          'text-[var(--text-tertiary)] opacity-0 cursor-grab active:cursor-grabbing',
          'transition-opacity duration-100',
          isHovered && 'opacity-100'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <DragHandle className="w-3 h-3" />
      </div>

      {/* Content */}
      <div className="pl-2">
        {/* Priority + tags row */}
        <div className="flex items-center gap-1.5 mb-2">
          {task.priority !== 'none' && (
            <span
              className="text-[11px] font-medium px-1.5 py-0.5 rounded"
              style={{ color: priority.color, backgroundColor: priority.bg }}
            >
              {priority.label}
            </span>
          )}
          {task.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[11px] text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <p
          className={cn(
            'text-[14px] text-[var(--text-primary)] leading-snug',
            isDone && 'line-through text-[var(--text-tertiary)]'
          )}
        >
          {task.title}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5">
          {dueDateDisplay ? (
            <span
              className={cn(
                'text-[11px] font-medium',
                isOverdue ? 'text-[#EF4444]' : 'text-[var(--text-tertiary)]'
              )}
            >
              {isOverdue ? '⚠ ' : ''}
              {dueDateDisplay}
            </span>
          ) : (
            <span />
          )}

          {/* Complete toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              completeTask.mutate({ id: task.id, done: !isDone })
            }}
            className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
              'transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]',
              isDone
                ? 'bg-[#10B981] border-[#10B981]'
                : 'border-[var(--border-strong)] hover:border-[#6366F1]'
            )}
            aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
          >
            {isDone && (
              <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none">
                <path d="M1.5 5l2.5 2.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
