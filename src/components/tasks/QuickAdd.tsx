'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useCreateTask } from '@/hooks/useTasks'
import type { ParsedTask, TaskCreateInput } from '@/types/tasks'

// ─── Icons ───────────────────────────────────────────────────────────────────

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.5 3.5l2 2M10.5 10.5l2 2M10.5 3.5l-2 2M5.5 10.5l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── AI Preview Card ─────────────────────────────────────────────────────────

function AIPreview({ parsed }: { parsed: ParsedTask }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'absolute bottom-full left-0 right-0 mb-1',
        'bg-[var(--bg-primary)] border border-[var(--border-default)]',
        'rounded-xl shadow-lg p-3',
        'flex items-start gap-3'
      )}
    >
      <div className="flex-shrink-0 w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
        <SparkleIcon className="w-3.5 h-3.5 text-[#6366F1]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-[var(--text-tertiary)] mb-1 font-medium">AI parsed</p>
        <p className="text-[14px] text-[var(--text-primary)] font-medium truncate">{parsed.title}</p>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {parsed.due_date && (
            <span className="text-[11px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
              📅 {parsed.due_date}
              {parsed.due_time && ` ${parsed.due_time}`}
            </span>
          )}
          {parsed.priority && parsed.priority !== 'none' && (
            <span className="text-[11px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full capitalize">
              ⚡ {parsed.priority}
            </span>
          )}
          {parsed.project_hint && (
            <span className="text-[11px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
              📁 {parsed.project_hint}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

interface QuickAddProps {
  defaultDueDate?: string
  onSuccess?: () => void
  autoFocus?: boolean
  placeholder?: string
}

const PARSE_DEBOUNCE_MS = 600

export function QuickAdd({
  defaultDueDate,
  onSuccess,
  autoFocus = false,
  placeholder = 'Add task... (try "Meeting kal 3pm urgent")',
}: QuickAddProps) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isParsingAI, setIsParsingAI] = useState(false)
  const [parsed, setParsed] = useState<ParsedTask | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const createTask = useCreateTask()

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // Parse with AI after debounce
  const triggerParse = useCallback(async (text: string) => {
    if (text.length < 4) {
      setParsed(null)
      return
    }

    // Only parse if text looks like it has datetime/priority hints
    const hasHints = /\b(kal|aaj|subah|shaam|tomorrow|today|pm|am|urgent|high|priority|\d{1,2}(:\d{2})?\s*(am|pm))\b/i.test(text)
    if (!hasHints) {
      setParsed(null)
      return
    }

    setIsParsingAI(true)
    try {
      const res = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text }),
      })
      if (res.ok) {
        const data: ParsedTask = await res.json()
        setParsed(data)
      }
    } catch {
      // Silently fail — user can still submit manually
    } finally {
      setIsParsingAI(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setValue(text)
    setParsed(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => triggerParse(text), PARSE_DEBOUNCE_MS)
  }

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim()
    if (!trimmed || isSubmitting) return

    setIsSubmitting(true)

    const taskInput: TaskCreateInput = parsed
      ? {
          title: parsed.title || trimmed,
          due_date: parsed.due_date ?? defaultDueDate,
          due_time: parsed.due_time,
          priority: parsed.priority ?? 'none',
          tags: parsed.tags ?? [],
        }
      : {
          title: trimmed,
          due_date: defaultDueDate,
          priority: 'none',
        }

    try {
      await createTask.mutateAsync(taskInput)
      setValue('')
      setParsed(null)
      onSuccess?.()
    } finally {
      setIsSubmitting(false)
    }
  }, [createTask, defaultDueDate, isSubmitting, onSuccess, parsed, value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setValue('')
      setParsed(null)
      inputRef.current?.blur()
    }
  }

  const showPreview = isFocused && parsed && value.length > 3

  return (
    <div className="relative">
      <AnimatePresence>{showPreview && <AIPreview parsed={parsed} />}</AnimatePresence>

      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2.5',
          'bg-[var(--bg-primary)] border rounded-xl',
          'transition-all duration-150',
          isFocused
            ? 'border-[#6366F1] shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
            : 'border-[var(--border-default)]'
        )}
      >
        {/* Left icon */}
        <div className="flex-shrink-0">
          {isParsingAI ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <SparkleIcon className="w-4 h-4 text-[#6366F1]" />
            </motion.div>
          ) : (
            <PlusIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            'flex-1 bg-transparent text-[14px] text-[var(--text-primary)]',
            'placeholder:text-[var(--text-tertiary)]',
            'outline-none border-none focus:ring-0'
          )}
          aria-label="Add new task"
          disabled={isSubmitting}
        />

        {/* Submit hint */}
        <AnimatePresence>
          {value.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.1 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                'flex-shrink-0 flex items-center justify-center',
                'w-7 h-7 rounded-lg',
                'bg-[#6366F1] text-white',
                'hover:bg-[#4F46E5] active:scale-95',
                'transition-all duration-100',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-1'
              )}
              aria-label="Add task"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowIcon className="w-3.5 h-3.5" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Helper text */}
      <AnimatePresence>
        {isFocused && value.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-[11px] text-[var(--text-tertiary)] px-1"
          >
            Press <kbd className="font-mono bg-[var(--bg-tertiary)] px-1 rounded text-[10px]">Enter</kbd> to add •{' '}
            AI parses dates, priority & Hinglish
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
