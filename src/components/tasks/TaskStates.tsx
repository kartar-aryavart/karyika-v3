'use client'

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ─── Empty State ──────────────────────────────────────────────────────────────

interface TaskEmptyStateProps {
  onAddTask?: () => void
  filter?: string
}

export function TaskEmptyState({ onAddTask, filter }: TaskEmptyStateProps) {
  const isFiltered = Boolean(filter)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center py-16 px-6 max-w-xs mx-auto text-center"
    >
      {/* Illustration */}
      <div className="relative w-20 h-20 mb-6">
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Background circle */}
          <circle cx="40" cy="40" r="36" fill="var(--bg-tertiary)" />
          {/* Check lines */}
          <rect x="24" y="28" width="32" height="4" rx="2" fill="var(--border-strong)" opacity="0.4" />
          <rect x="24" y="37" width="24" height="4" rx="2" fill="var(--border-strong)" opacity="0.3" />
          <rect x="24" y="46" width="28" height="4" rx="2" fill="var(--border-strong)" opacity="0.2" />
          {/* Sparkle */}
          <circle cx="58" cy="22" r="6" fill="#6366F1" opacity="0.8" />
          <path d="M58 19v6M55 22h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-2">
        {isFiltered ? 'No tasks match filters' : 'Abhi koi task nahi'}
      </h3>

      <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-6">
        {isFiltered
          ? 'Try adjusting your filters to see more tasks.'
          : "Add your first task and start being productive. Ek kadam se hi safar shuru hota hai."}
      </p>

      {!isFiltered && onAddTask && (
        <button
          onClick={onAddTask}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg',
            'bg-[#6366F1] text-white text-[14px] font-medium',
            'shadow-[0_1px_2px_rgba(99,102,241,0.3)]',
            'hover:bg-[#4F46E5] hover:shadow-[0_4px_14px_rgba(99,102,241,0.35)]',
            'active:scale-[0.98] transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2'
          )}
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Pehla task banao
        </button>
      )}
    </motion.div>
  )
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonLine({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn(
        'h-3 rounded-full bg-[var(--bg-tertiary)]',
        'animate-[shimmer_1.5s_ease-in-out_infinite]',
        className
      )}
      style={style}
    />
  )
}

function TaskRowSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-[13px] border-b border-[var(--border-subtle)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Checkbox */}
      <div className="w-[18px] h-[18px] rounded-full bg-[var(--bg-tertiary)] flex-shrink-0 animate-pulse" />
      {/* Title */}
      <SkeletonLine className="flex-1" style={{ width: `${55 + Math.random() * 30}%` } as React.CSSProperties} />
      {/* Date */}
      <SkeletonLine className="w-12 flex-shrink-0" />
    </div>
  )
}

export function TaskListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--border-subtle)]',
        'bg-[var(--bg-primary)] overflow-hidden'
      )}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <TaskRowSkeleton key={i} delay={i * 50} />
      ))}
    </div>
  )
}
