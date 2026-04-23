'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, PRIORITY_CONFIG, STATUS_CONFIG } from '@/lib/utils'
import type { TaskFilters } from '@/types/tasks'
import type { TaskStatus, TaskPriority } from '@/types'

// ─── Filter Pill ─────────────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium',
        'transition-all duration-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]',
        active
          ? 'bg-[#6366F1] text-white shadow-sm'
          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
      )}
    >
      {label}
    </button>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

interface TaskFiltersProps {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
  taskCount: number
}

const STATUS_OPTIONS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_OPTIONS: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'urgent', label: '🔴 Urgent' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🔵 Medium' },
  { value: 'low', label: '🟢 Low' },
]

export function TaskFiltersBar({ filters, onChange, taskCount }: TaskFiltersProps) {
  const [showPriorityFilter, setShowPriorityFilter] = useState(false)

  const activeCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="flex flex-col gap-2">
      {/* Top row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status filters */}
        <div className="flex items-center gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <FilterPill
              key={opt.value}
              label={opt.label}
              active={
                opt.value === 'all'
                  ? !filters.status
                  : filters.status === opt.value
              }
              onClick={() =>
                onChange({
                  ...filters,
                  status: opt.value === 'all' ? undefined : (opt.value as TaskStatus),
                })
              }
            />
          ))}
        </div>

        <div className="w-px h-5 bg-[var(--border-default)] mx-1 hidden sm:block" />

        {/* Priority toggle */}
        <button
          onClick={() => setShowPriorityFilter((p) => !p)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium',
            'transition-all duration-100',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]',
            filters.priority
              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
          )}
        >
          ⚡ Priority
          {filters.priority && (
            <span className="ml-1 capitalize">{filters.priority}</span>
          )}
        </button>

        {/* Clear all */}
        <AnimatePresence>
          {activeCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => onChange({})}
              className="text-[12px] text-[var(--text-tertiary)] hover:text-[#EF4444] transition-colors duration-100 ml-1"
            >
              Clear ({activeCount})
            </motion.button>
          )}
        </AnimatePresence>

        {/* Task count */}
        <span className="ml-auto text-[12px] text-[var(--text-tertiary)]">
          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {/* Priority dropdown row */}
      <AnimatePresence>
        {showPriorityFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 overflow-hidden"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <FilterPill
                key={opt.value}
                label={opt.label}
                active={
                  opt.value === 'all'
                    ? !filters.priority
                    : filters.priority === opt.value
                }
                onClick={() => {
                  onChange({
                    ...filters,
                    priority:
                      opt.value === 'all' ? undefined : (opt.value as TaskPriority),
                  })
                  setShowPriorityFilter(false)
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
