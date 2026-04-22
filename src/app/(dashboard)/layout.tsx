'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { createClient } from '@/lib/supabase/client'

// ─── NAV ─────────────────────────────────────────────────────────────────────
const NAV = [
  { title: 'MAIN', items: [
    { href: '/dashboard',    label: 'Home',           emoji: '🏠', color: '#FF6B35' },
    { href: '/tasks',        label: 'Tasks',          emoji: '📋', color: '#818CF8' },
    { href: '/projects',     label: 'Projects',       emoji: '📁', color: '#06B6D4' },
    { href: '/team',         label: 'Team',           emoji: '👥', color: '#10B981' },
    { href: '/workload',     label: 'Workload',       emoji: '📊', color: '#F59E0B', badge: 'NEW' },
  ]},
  { title: 'PLAN', items: [
    { href: '/goals',        label: 'Goals & OKRs',  emoji: '🎯', color: '#F43F5E' },
    { href: '/gantt',        label: 'Gantt',          emoji: '📅', color: '#F59E0B' },
    { href: '/calendar',     label: 'Calendar',       emoji: '📆', color: '#8B5CF6' },
    { href: '/analytics',    label: 'Analytics',      emoji: '📈', color: '#06B6D4' },
  ]},
  { title: 'CREATE', items: [
    { href: '/notes',        label: 'Pages',          emoji: '📄', color: '#E5E7EB', badge: 'NOTION' },
    { href: '/habits',       label: 'Habits',         emoji: '🌱', color: '#10B981' },
    { href: '/timer',        label: 'Focus Timer',    emoji: '⏱',  color: '#F43F5E' },
  ]},
  { title: 'AI & AUTO', items: [
    { href: '/ai',           label: 'AI Assistant',   emoji: '🤖', color: '#8B5CF6', badge: 'AI' },
    { href: '/automations',  label: 'Automations',    emoji: '⚡', color: '#F43F5E' },
    { href: '/integrations', label: 'Integrations',   emoji: '🔌', color: '#06B6D4' },
  ]},
  { title: 'SYSTEM', items: [
    { href: '/unique',       label: 'Unique ✨',      emoji: '🌟', color: '#F59E0B', badge: 'NEW' },
    { href: '/settings',     label: 'Settings',       emoji: '⚙️', color: '#6B7280' },
  ]},
]

const BADGE: Record<string, { bg: string; color: string }> = {
  NEW:    { bg: 'rgba(16,185,129,0.15)',  color: '#10B981' },
  AI:     { bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6' },
  NOTION: { bg: 'rgba(255,255,255,0.06)', color: '#9CA3AF' },
}

const PAGE_TITLE: Record<string, string> = {
  '/dashboard': 'Home', '/tasks': 'Tasks', '/habits': 'Habits',
  '/calendar': 'Calendar', '/timer': 'Focus Timer', '/notes': 'Pages',
  '/projects': 'Projects', '/goals': 'Goals & OKRs', '/settings': 'Settings',
  '/ai': 'AI Assistant', '/analytics': 'Analytics', '/gantt': 'Gantt',
  '/team': 'Team', '/workload': 'Workload', '/integrations': 'Integrations',
  '/unique': '✨ Unique Features', '/automations': 'Automations',
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ isMobile }: { isMobile: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, setSidebarOpen, theme, setTheme } = useStore()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [hov, setHov] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ name: data.user.user_metadata?.name ?? data.user.email?.split('@')[0] ?? 'User', email: data.user.email ?? '' })
    })
  }, [])

  const logout = async () => { await supabase.auth.signOut(); router.push('/login'); router.refresh() }
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const visible = isMobile ? sidebarOpen : true

  return (
    <>
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99, backdropFilter: 'blur(4px)' }} />
      )}
      <nav style={{ width: 220, display: 'flex', flexDirection: 'column', zIndex: 100, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid rgba(255,255,255,0.04)', position: isMobile ? 'fixed' : 'relative', top: 0, left: 0, bottom: 0, transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none', transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)', boxShadow: isMobile && sidebarOpen ? '0 0 60px rgba(0,0,0,0.8)' : 'none' }}>
        {/* Logo */}
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-head)' }}>K</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 900, letterSpacing: '-0.5px', background: 'linear-gradient(135deg,#FFFFFF,rgba(255,107,53,0.9))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Karyika</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.12)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>v3 · AI-First</div>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 7px' }}>
          {NAV.map(section => (
            <div key={section.title} style={{ marginBottom: 2 }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.1)', letterSpacing: '2px', padding: '8px 9px 3px', textTransform: 'uppercase' }}>{section.title}</div>
              {section.items.map(item => {
                const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
                const hovered = hov === item.href
                const bs = BADGE[item.badge ?? '']
                return (
                  <Link key={item.href} href={item.href} onClick={() => isMobile && setSidebarOpen(false)}
                    onMouseEnter={() => setHov(item.href)} onMouseLeave={() => setHov(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 9px', borderRadius: 8, background: active ? `${item.color}12` : hovered ? 'rgba(255,255,255,0.04)' : 'transparent', transition: 'all 0.12s', position: 'relative', textDecoration: 'none' }}>
                    {active && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 2.5, borderRadius: '0 3px 3px 0', background: item.color, boxShadow: `0 0 8px ${item.color}88` }} />}
                    <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: active ? `${item.color}18` : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{item.emoji}</div>
                    <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? item.color : hovered ? 'var(--text)' : 'var(--text3)', flex: 1, transition: 'color 0.12s' }}>{item.label}</span>
                    {bs && <span style={{ fontSize: 7, padding: '2px 5px', borderRadius: 6, fontWeight: 900, letterSpacing: '0.3px', background: bs.bg, color: bs.color }}>{item.badge}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '8px 9px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 5, marginBottom: 7 }}>
            <button onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} style={{ flex: 1, padding: 6, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 7, background: 'rgba(255,255,255,0.03)', cursor: 'pointer', fontSize: 14, color: '#9CA3AF', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#FF6B35,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {(user?.name ?? 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name ?? '...'}</div>
              <div style={{ fontSize: 8, color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pro · v3</div>
            </div>
            <button onClick={logout} title="Logout" style={{ background: 'transparent', border: 'none', color: '#4B5563', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#F43F5E')} onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}>↩</button>
          </div>
        </div>
      </nav>
    </>
  )
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ onMenuClick, onCmdOpen }: { onMenuClick: () => void; onCmdOpen: () => void }) {
  const pathname = usePathname()
  const title = PAGE_TITLE[pathname] ?? pathname.slice(1)
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--topbar-bg)', borderBottom: '1px solid var(--border)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onMenuClick} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontSize: 16, color: 'var(--text3)' }}>☰</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Karyika</span>
          <span style={{ color: 'var(--text3)', fontSize: 12 }}>›</span>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{title}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onCmdOpen} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', border: '1px solid var(--border2)', borderRadius: 20, background: 'var(--surface2)', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--text3)', fontFamily: 'inherit' }}>
          🔍 Search <kbd style={{ padding: '1px 5px', background: 'var(--kbd-bg)', borderRadius: 4, fontSize: 10, fontFamily: 'monospace', border: '1px solid var(--border)' }}>⌘K</kbd>
        </button>
        <div style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--surface2)', padding: '5px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>{today}</div>
      </div>
    </div>
  )
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar, setCmdOpen } = useStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(true) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [setCmdOpen])

  return (
    <div className="app-layout">
      <Sidebar isMobile={isMobile} />
      <div className="main-area">
        <Topbar onMenuClick={toggleSidebar} onCmdOpen={() => setCmdOpen(true)} />
        <div className="page-scroll" style={{ padding: '20px 22px' }}>{children}</div>
      </div>
    </div>
  )
}
