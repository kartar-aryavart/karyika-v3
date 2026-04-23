'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, PRIORITY_CONFIG, STATUS_CONFIG } from '@/lib/utils'
import type { Task, TaskPriority, TaskStatus } from '@/types'
import { useUpdateTask, useDeleteTask } from '@/hooks/useTasks'

// ─── Icons ───────────────────────────────────────────────────────────────────

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Select Field ─────────────────────────────────────────────────────────────

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(
          'h-9 px-3 rounded-lg text-[13px] text-[var(--text-primary)]',
          'bg-[var(--bg-tertiary)] border border-[var(--border-default)]',
          'focus:outline-none focus:border-[#6366F1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]',
          'cursor-pointer transition-all duration-150'
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TaskDetailProps {
  task: Task | null
  onClose: () => void
}

const PRIORITY_OPTIONS = (Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((k) => ({
  value: k,
  label: PRIORITY_CONFIG[k].label,
}))

const STATUS_OPTIONS = (Object.keys(STATUS_CONFIG) as TaskStatus[]).map((k) => ({
  value: k,
  label: STATUS_CONFIG[k].label,
}))

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('none')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  // Sync form state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.desc ?? '')
      setPriority(task.priority)
      setStatus(task.status)
      setDueDate(task.due ?? '')
      setDueTime(task.dueTime ?? '')
      setIsDirty(false)
    }
  }, [task])

  const handleSave = async () => {
    if (!task || !isDirty) return
    await updateTask.mutateAsync({
      id: task.id,
      title: title.trim() || task.title,
      desc: description || undefined,
      priority,
      status,
      due: dueDate || undefined,
      dueTime: dueTime || undefined,
    })
    setIsDirty(false)
  }

  const handleDelete = async () => {
    if (!task) return
    await deleteTask.mutateAsync(task.id)
    onClose()
  }

  const handleFieldChange = <T,>(setter: (v: T) => void, value: T) => {
    setter(value)
    setIsDirty(true)
  }

  return (
    <AnimatePresence>
      {task && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={cn(
              'fixed right-0 top-0 bottom-0 z-50',
              'w-full max-w-[420px]',
              'bg-[var(--bg-primary)]',
              'border-l border-[var(--border-default)]',
              'shadow-xl',
              'flex flex-col'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Task Details</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-tertiary)] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444]"
                  aria-label="Delete task"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
                  aria-label="Close"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {/* Title */}
              <div>
                <textarea
                  value={title}
                  onChange={(e) => handleFieldChange(setTitle, e.target.value)}
                  onBlur={handleSave}
                  className={cn(
                    'w-full text-[18px] font-semibold text-[var(--text-primary)]',
                    'bg-transparent border-none outline-none resize-none',
                    'placeholder:text-[var(--text-tertiary)]',
                    'leading-snug'
                  )}
                  rows={2}
                  placeholder="Task title"
                />
              </div>

              <div className="h-px bg-[var(--border-subtle)]" />

              {/* Status + Priority grid */}
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Status"
                  value={status}
                  options={STATUS_OPTIONS}
                  onChange={(v) => {
                    handleFieldChange(setStatus, v)
                    // auto-save on select change
                    setTimeout(handleSave, 50)
                  }}
                />
                <SelectField
                  label="Priority"
                  value={priority}
                  options={PRIORITY_OPTIONS}
                  onChange={(v) => {
                    handleFieldChange(setPriority, v)
                    setTimeout(handleSave, 50)
                  }}
                />
              </div>

              {/* Due date + time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => handleFieldChange(setDueDate, e.target.value)}
                    onBlur={handleSave}
                    className={cn(
                      'h-9 px-3 rounded-lg text-[13px] text-[var(--text-primary)]',
                      'bg-[var(--bg-tertiary)] border border-[var(--border-default)]',
                      'focus:outline-none focus:border-[#6366F1]',
                      'transition-all duration-150'
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                    Time
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => handleFieldChange(setDueTime, e.target.value)}
                    onBlur={handleSave}
                    className={cn(
                      'h-9 px-3 rounded-lg text-[13px] text-[var(--text-primary)]',
                      'bg-[var(--bg-tertiary)] border border-[var(--border-default)]',
                      'focus:outline-none focus:border-[#6366F1]',
                      'transition-all duration-150'
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                  Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => handleFieldChange(setDescription, e.target.value)}
                  onBlur={handleSave}
                  placeholder="Add notes, links, or context..."
                  rows={5}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg text-[14px] text-[var(--text-primary)]',
                    'bg-[var(--bg-tertiary)] border border-[var(--border-default)]',
                    'focus:outline-none focus:border-[#6366F1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]',
                    'placeholder:text-[var(--text-tertiary)]',
                    'resize-none transition-all duration-150'
                  )}
                />
              </div>

              {/* Metadata */}
              <div className="flex flex-col gap-1 pt-2 border-t border-[var(--border-subtle)]">
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  Created{' '}
                  {new Date(task.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                {task.completedAt && (
                  <p className="text-[11px] text-[#10B981]">
                    Completed{' '}
                    {new Date(task.completedAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            {isDirty && (
              <div className="px-5 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-[12px] text-[var(--text-tertiary)]">Unsaved changes</span>
                <button
                  onClick={handleSave}
                  disabled={updateTask.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6366F1] text-white text-[13px] font-medium hover:bg-[#4F46E5] active:scale-[0.98] transition-all duration-100 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-1"
                >
                  {updateTask.isPending ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  Save changes
                </button>
              </div>
            )}

            {/* Delete confirmation */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4 p-8"
                >
                  <div className="text-4xl">🗑</div>
                  <h3 className="text-[16px] font-semibold text-[var(--text-primary)] text-center">
                    Delete this task?
                  </h3>
                  <p className="text-[14px] text-[var(--text-secondary)] text-center">
                    "{task.title}" will be permanently deleted.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-5 py-2.5 rounded-lg text-[14px] font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-colors duration-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleteTask.isPending}
                      className="px-5 py-2.5 rounded-lg text-[14px] font-medium text-white bg-[#EF4444] hover:bg-[#DC2626] active:scale-[0.98] transition-all duration-100 disabled:opacity-50"
                    >
                      {deleteTask.isPending ? 'Deleting...' : 'Delete task'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
