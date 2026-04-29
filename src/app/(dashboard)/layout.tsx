'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { createClient } from '@/lib/supabase/client'
import { t, T, LANG_LABELS, type Lang } from '@/lib/i18n'

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV = [
  { title: 'MAIN', items: [
    { href: '/dashboard',    key: 'home',         emoji: '🏠', color: '#FF6B35' },
    { href: '/tasks',        key: 'tasks',        emoji: '📋', color: '#818CF8' },
    { href: '/projects',     key: 'projects',     emoji: '📁', color: '#06B6D4' },
    { href: '/team',         key: 'team',         emoji: '👥', color: '#10B981' },
    { href: '/workload',     key: 'workload',     emoji: '📊', color: '#F59E0B', badge: 'NEW' },
  ]},
  { title: 'PLAN', items: [
    { href: '/goals',        key: 'goals',        emoji: '🎯', color: '#F43F5E' },
    { href: '/gantt',        key: 'gantt',        emoji: '📅', color: '#F59E0B' },
    { href: '/calendar',     key: 'calendar',     emoji: '📆', color: '#8B5CF6' },
    { href: '/analytics',    key: 'analytics',    emoji: '📈', color: '#06B6D4' },
  ]},
  { title: 'CREATE', items: [
    { href: '/notes',        key: 'notes',        emoji: '📄', color: '#E5E7EB', badge: 'NOTION' },
    { href: '/habits',       key: 'habits',       emoji: '🌱', color: '#10B981' },
    { href: '/timer',        key: 'timer',        emoji: '⏱',  color: '#F43F5E' },
  ]},
  { title: 'AI & AUTO', items: [
    { href: '/ai',           key: 'ai',           emoji: '🤖', color: '#8B5CF6', badge: 'AI' },
    { href: '/automations',  key: 'automations',  emoji: '⚡', color: '#F43F5E' },
    { href: '/integrations', key: 'integrations', emoji: '🔌', color: '#06B6D4' },
  ]},
  { title: 'SYSTEM', items: [
    { href: '/unique',       key: 'unique',       emoji: '🌟', color: '#F59E0B', badge: 'NEW' },
    { href: '/settings',     key: 'settings',     emoji: '⚙️', color: '#6B7280' },
  ]},
] as const

const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  NEW:    { bg: 'rgba(16,185,129,0.15)',  color: '#10B981' },
  AI:     { bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6' },
  NOTION: { bg: 'rgba(255,255,255,0.06)', color: '#9CA3AF' },
}

const PAGE_TITLE_KEY: Record<string, string> = {
  '/dashboard': 'home', '/tasks': 'tasks', '/habits': 'habits',
  '/calendar': 'calendar', '/timer': 'timer', '/notes': 'notes',
  '/projects': 'projects', '/goals': 'goals', '/settings': 'settings',
  '/ai': 'ai', '/analytics': 'analytics', '/gantt': 'gantt',
  '/team': 'team', '/workload': 'workload', '/integrations': 'integrations',
  '/unique': 'unique', '/automations': 'automations',
}

// ─── LANGUAGE SWITCHER ────────────────────────────────────────────────────────
function LangSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const [open, setOpen] = useState(false)
  const langs: Lang[] = ['en', 'hi', 'hinglish']
  const icons: Record<Lang, string> = { en: '🇬🇧', hi: '🇮🇳', hinglish: '🔀' }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'var(--surface3)', border: '1px solid var(--border2)', borderRadius: 20, cursor: 'pointer', fontSize: 12, color: 'var(--text2)', fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.15s' }} title="Switch language">
        <span style={{ fontSize: 14 }}>{icons[lang]}</span>
        <span style={{ fontSize: 11 }}>{LANG_LABELS[lang]}</span>
        <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
          <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-xl)', zIndex: 999, minWidth: 150, animation: 'popIn 0.15s ease' }}>
            {langs.map(l => (
              <button key={l} onClick={() => { setLang(l); setOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: lang === l ? 'rgba(255,107,53,0.08)' : 'transparent', color: lang === l ? 'var(--accent)' : 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: lang === l ? 700 : 400, textAlign: 'left', transition: 'background 0.1s' }}>
                <span style={{ fontSize: 16 }}>{icons[l]}</span>
                {LANG_LABELS[l]}
                {lang === l && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent)' }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ isMobile, lang }: { isMobile: boolean; lang: Lang }) {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, setSidebarOpen, theme, setTheme, setLang } = useStore()
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null)
  const [hov, setHov] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ name: data.user.user_metadata?.name ?? data.user.email?.split('@')[0] ?? 'User', email: data.user.email ?? '' })
    })
  }, [])

  const logout = async () => { await supabase.auth.signOut(); router.push('/login'); router.refresh() }

  return (
    <>
      {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 99, backdropFilter: 'blur(4px)' }} />}

      <nav style={{ width: 224, display: 'flex', flexDirection: 'column', zIndex: 100, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid rgba(255,255,255,0.04)', position: isMobile ? 'fixed' : 'relative', top: 0, left: 0, bottom: 0, transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none', transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)', boxShadow: isMobile && sidebarOpen ? '0 0 60px rgba(0,0,0,0.8)' : 'none' }}>

        {/* Logo */}
        <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,107,53,0.35)', flexShrink: 0 }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-head)' }}>K</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 900, letterSpacing: '-0.5px', background: 'linear-gradient(135deg,#FFFFFF,rgba(255,107,53,0.9))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t(T.appName, lang)}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>v3 · AI-First</div>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 0' }}>
          {NAV.map(section => (
            <div key={section.title} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.1)', letterSpacing: '2px', padding: '10px 10px 4px', textTransform: 'uppercase' }}>{section.title}</div>
              {section.items.map(item => {
                const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
                const isHov = hov === item.href
                const navLabel = (T.nav as any)[item.key]
                const label = navLabel ? t(navLabel, lang) : item.key
                const bs = BADGE_STYLE[(item as any).badge ?? '']

                return (
                  <Link key={item.href} href={item.href} onClick={() => isMobile && setSidebarOpen(false)}
                    onMouseEnter={() => setHov(item.href)} onMouseLeave={() => setHov(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 10px', borderRadius: 9, background: active ? `${item.color}14` : isHov ? 'rgba(255,255,255,0.04)' : 'transparent', transition: 'all 0.12s', position: 'relative', textDecoration: 'none', marginBottom: 1 }}>
                    {active && <div style={{ position: 'absolute', left: 0, top: '22%', bottom: '22%', width: 3, borderRadius: '0 3px 3px 0', background: item.color, boxShadow: `0 0 8px ${item.color}88` }} />}
                    <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: active ? `${item.color}20` : isHov ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.12s' }}>{item.emoji}</div>
                    <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? item.color : isHov ? 'var(--text)' : 'var(--text3)', flex: 1, transition: 'color 0.12s', lineHeight: 1 }}>{label}</span>
                    {bs && <span style={{ fontSize: 7, padding: '2px 6px', borderRadius: 6, fontWeight: 900, letterSpacing: '0.3px', background: bs.bg, color: bs.color }}>{(item as any).badge}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 10px 12px', flexShrink: 0 }}>
          {/* Language + Theme row */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
            <LangSwitcher lang={lang} setLang={setLang} />
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} style={{ padding: '5px 8px', border: '1px solid var(--border2)', borderRadius: 20, background: 'var(--surface3)', cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          {/* User card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 11, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#FF6B35,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {(user?.name ?? 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name ?? '...'}</div>
              <div style={{ fontSize: 8, color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pro · v3</div>
            </div>
            <button onClick={logout} title={t(T.logout, lang)} style={{ background: 'transparent', border: 'none', color: '#4B5563', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s', flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.color = '#F43F5E')} onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}>↩</button>
          </div>
        </div>
      </nav>
    </>
  )
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ onMenuClick, onCmdOpen, lang }: { onMenuClick: () => void; onCmdOpen: () => void; lang: Lang }) {
  const pathname = usePathname()
  const key = PAGE_TITLE_KEY[pathname] ?? ''
  const navLabel = key ? (T.nav as any)[key] : null
  const title = navLabel ? t(navLabel, lang) : pathname.slice(1)
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    const tick = () => setDateStr(new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }))
    tick()
    const i = setInterval(tick, 60000)
    return () => clearInterval(i)
  }, [])

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--topbar-bg)', borderBottom: '1px solid var(--border)', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(20px)', flexShrink: 0, height: 56 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onMenuClick} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, padding: '7px 11px', cursor: 'pointer', fontSize: 16, color: 'var(--text3)', lineHeight: 1, transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
          ☰
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{t(T.appName, lang)}</span>
          <span style={{ color: 'var(--text3)', fontSize: 12 }}>›</span>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{title}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onCmdOpen} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', border: '1px solid var(--border2)', borderRadius: 22, background: 'var(--surface2)', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--text3)', fontFamily: 'inherit', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}>
          🔍 {t(T.search, lang)} <kbd style={{ padding: '1px 6px', background: 'var(--kbd-bg)', borderRadius: 5, fontSize: 10, fontFamily: 'monospace', border: '1px solid var(--border)' }}>⌘K</kbd>
        </button>
        {dateStr && <div style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--surface2)', padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)' }}>{dateStr}</div>}
      </div>
    </div>
  )
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar, setCmdOpen, lang } = useStore()
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
      <Sidebar isMobile={isMobile} lang={lang} />
      <div className="main-area">
        <Topbar onMenuClick={toggleSidebar} onCmdOpen={() => setCmdOpen(true)} lang={lang} />
        <div className="page-scroll" style={{ padding: '22px 24px' }}>{children}</div>
      </div>
    </div>
  )
}
