'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

// ─── Page title map ───────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/tasks':      'Tasks',
  '/habits':     'Habits',
  '/goals':      'Goals',
  '/ai':         'AI Assistant',
  '/analytics':  'Analytics',
  '/settings':   'Settings',
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useStore()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-lg',
        'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
        'hover:bg-[var(--bg-hover)] transition-colors duration-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]'
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
          <path d="M13.5 9A6 6 0 017 2.5 6 6 0 1013.5 9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const pathname = usePathname()
  const { } = useStore() // TODO: Add command palette and quick add functions

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname.startsWith(key)
  )?.[1] ?? 'Karyika'

  return (
    <header className={cn(
      'flex items-center justify-between px-4 h-[52px] flex-shrink-0',
      'bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]',
      'z-10'
    )}>
      {/* Left: page context (hidden — sidebar shows this) */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-[var(--text-tertiary)] hidden sm:inline">
          {pageTitle}
        </span>
      </div>

      {/* Center: Search trigger */}
      <button
        onClick={() => {}} // TODO: Implement command palette
        className={cn(
          'flex items-center gap-2 px-3 h-8 rounded-lg w-full max-w-[280px]',
          'bg-[var(--bg-secondary)] border border-[var(--border-default)]',
          'text-[13px] text-[var(--text-tertiary)]',
          'hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]',
          'transition-all duration-100',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]'
        )}
        aria-label="Open command palette"
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[10px] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded font-mono hidden sm:inline">
          ⌘K
        </kbd>
      </button>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Quick add */}
        <button
          onClick={() => {}} // TODO: Implement quick add
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg',
            'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            'hover:bg-[var(--bg-hover)] transition-colors duration-100',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]'
          )}
          aria-label="Quick add task (N)"
          title="New task (N)"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <ThemeToggle />
      </div>
    </header>
  )
}
