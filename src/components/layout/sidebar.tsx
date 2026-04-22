'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import { createClient } from '@/lib/supabase/client'

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: '/tasks',
    label: 'Tasks',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
        <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="13" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 12l.8.8 1.5-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/habits',
    label: 'Habits',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
        <path d="M8 2C5.24 2 3 4.24 3 7c0 2.1 1.23 3.9 3 4.73V14h4v-2.27C11.77 10.9 13 9.1 13 7c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M6 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/goals',
    label: 'Goals',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8" cy="8" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: '/ai',
    label: 'AI Assistant',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
        <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.5 3.5l2 2M10.5 10.5l2 2M10.5 3.5l-2 2M5.5 10.5l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    badge: 'AI',
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
        <path d="M2 12l3.5-4 3 3L12 5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

const BOTTOM_ITEMS = [
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

// ─── Nav Link ─────────────────────────────────────────────────────────────────

function NavLink({
  item,
  collapsed,
  active,
}: {
  item: (typeof NAV_ITEMS)[number]
  collapsed: boolean
  active: boolean
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-2.5 px-2 py-2 rounded-lg',
        'transition-all duration-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]',
        active
          ? 'bg-[#6366F1] text-white shadow-sm'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
        collapsed ? 'justify-center' : ''
      )}
      title={collapsed ? item.label : undefined}
    >
      <span className={cn('flex-shrink-0', active ? 'text-white' : '')}>
        {item.icon}
      </span>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {'badge' in item && item.badge && !collapsed && (
        <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#6366F1]/10 text-[#6366F1]">
          {item.badge}
        </span>
      )}

      {/* Tooltip on collapsed */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-[var(--text-primary)] text-[var(--bg-primary)] text-[12px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
          {item.label}
        </div>
      )}
    </Link>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, toggleSidebar } = useStore()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 56 : 220 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'flex flex-col flex-shrink-0 h-screen',
        'bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)]',
        'overflow-hidden z-20'
      )}
    >
      {/* Logo + collapse toggle */}
      <div className={cn(
        'flex items-center h-[52px] px-3 flex-shrink-0',
        'border-b border-[var(--border-subtle)]',
        sidebarOpen ? 'justify-center' : 'justify-between'
      )}>
        {!sidebarOpen && (
          <Link href="/dashboard" className="flex items-center gap-2 focus:outline-none">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none">
                <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">
              Karyika
            </span>
          </Link>
        )}

        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-md',
            'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            'hover:bg-[var(--bg-hover)] transition-colors duration-100',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]'
          )}
          aria-label={sidebarOpen ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
            {sidebarOpen ? (
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={sidebarOpen}
            active={
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            }
          />
        ))}
      </nav>

      {/* Bottom items */}
      <div className="px-2 py-3 border-t border-[var(--border-subtle)] space-y-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={sidebarOpen}
            active={pathname.startsWith(item.href)}
          />
        ))}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className={cn(
            'group relative w-full flex items-center gap-2.5 px-2 py-2 rounded-lg',
            'text-[var(--text-tertiary)] hover:text-[#EF4444] hover:bg-[#FEF2F2]',
            'transition-all duration-100',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444]',
            sidebarOpen ? 'justify-center' : ''
          )}
          title={sidebarOpen ? 'Sign out' : undefined}
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4 flex-shrink-0" fill="none">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!sidebarOpen && (
            <span className="text-[13px] font-medium">Sign out</span>
          )}
          {sidebarOpen && (
            <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-[var(--text-primary)] text-[var(--bg-primary)] text-[12px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
              Sign out
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  )
}
