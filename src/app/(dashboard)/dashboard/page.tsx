'use client'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useStore } from '@/store'
import { t, T } from '@/lib/i18n'
import { todayStr, PRI_COLOR } from '@/types'

const safeArr = (d: unknown): any[] => (Array.isArray(d) ? d : [])
const safeFetch = (url: string) => fetch(url).then(r => r.json()).then(safeArr)

// ─── QUOTES: trilingual ───────────────────────────────────────────────────────
const QUOTES = [
  { en: "The secret of getting ahead is getting started.", hi: "आगे बढ़ने का रहस्य शुरुआत करना है।", hinglish: "Shuru karo — bas yahi raaz hai.", author: "Mark Twain", emoji: "🚀" },
  { en: "Done is better than perfect.", hi: "पूर्णता से बेहतर है काम करना।", hinglish: "Karo pehle, perfect baad mein.", author: "Sheryl Sandberg", emoji: "✅" },
  { en: "It always seems impossible until it's done.", hi: "हर काम असंभव लगता है — जब तक हो न जाए।", hinglish: "Mushkil lagta hai — jab tak ho nahi jaata.", author: "Nelson Mandela", emoji: "🏆" },
  { en: "Focus on being productive instead of busy.", hi: "व्यस्त नहीं, उत्पादक बनें।", hinglish: "Busy nahi, productive bano.", author: "Tim Ferriss", emoji: "⚡" },
  { en: "Your future is created by what you do today.", hi: "आपका भविष्य आज के कार्यों से बनता है।", hinglish: "Aaj ka kaam kal ka future banata hai.", author: "Robert Kiyosaki", emoji: "🎯" },
  { en: "Small steps every day lead to big results.", hi: "रोज़ छोटे कदम बड़े नतीजे देते हैं।", hinglish: "Roz thoda thoda — bade nateeje milenge.", author: "Unknown", emoji: "🌱" },
  { en: "Energy and persistence conquer all things.", hi: "ऊर्जा और दृढ़ता से सब कुछ संभव है।", hinglish: "Himmat aur mehnat se sab milta hai.", author: "Benjamin Franklin", emoji: "🔥" },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!to) { setV(0); return }
    let c = 0; const step = Math.max(1, Math.ceil(to / 30))
    const i = setInterval(() => { c = Math.min(c + step, to); setV(c); if (c >= to) clearInterval(i) }, 30)
    return () => clearInterval(i)
  }, [to])
  return <>{v}{suffix}</>
}

function Ring({ pct, color, size = 68, stroke = 7 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface3)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${(pct/100)*c} ${c}`} style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)' }} />
    </svg>
  )
}

function StatCard({ icon, label, value, sub, color, trend, suffix }: {
  icon: string; label: string; value: number; sub?: string; color: string; trend?: number; suffix?: string
}) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ background: 'var(--surface)', borderTop: `3px solid ${color}`, borderRight: `1px solid ${hov ? color + '44' : 'var(--border)'}`, borderBottom: `1px solid ${hov ? color + '44' : 'var(--border)'}`, borderLeft: `1px solid ${hov ? color + '44' : 'var(--border)'}`, borderRadius: 18, padding: '18px 20px', transition: 'all 0.22s', transform: hov ? 'translateY(-3px)' : 'none', boxShadow: hov ? `0 12px 32px ${color}18` : 'none', cursor: 'default' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>{icon} {label}</span>
        {trend !== undefined && <span style={{ fontSize: 10, fontWeight: 800, color: trend >= 0 ? 'var(--teal)' : 'var(--rose)', background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', padding: '2px 8px', borderRadius: 20 }}>{trend >= 0 ? '↑' : '↓'}{Math.abs(trend)}%</span>}
      </div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 40, fontWeight: 900, color: hov ? color : 'var(--text)', letterSpacing: '-2px', lineHeight: 1 }}>
        <Counter to={value} suffix={suffix} />
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 7 }}>{sub}</div>}
    </div>
  )
}

function WeekBar({ tasks }: { tasks: any[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i)
    const str = d.toISOString().slice(0, 10)
    return { label: d.toLocaleDateString('en-IN', { weekday: 'short' }), str, done: tasks.filter(t => t.done && t.completed_at?.slice(0, 10) === str).length, isToday: str === todayStr() }
  })
  const max = Math.max(...days.map(d => d.done), 1)
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 56 }}>
      {days.map(d => (
        <div key={d.str} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: '100%', borderRadius: 5, background: d.isToday ? 'var(--accent)' : 'var(--indigo)', opacity: d.isToday ? 1 : 0.35, height: `${Math.max((d.done / max) * 44, 4)}px`, transition: 'height 1s ease' }} />
          <div style={{ fontSize: 9, color: d.isToday ? 'var(--accent)' : 'var(--text3)', fontWeight: d.isToday ? 800 : 400 }}>{d.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { lang } = useStore()
  const [qIdx, setQIdx]   = useState(0)
  const [tIdx, setTIdx]   = useState(0)
  const [qVis, setQVis]   = useState(true)
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [userName, setUserName] = useState('Yaar')

  useEffect(() => {
    setQIdx(Math.floor(Math.random() * QUOTES.length))
    setTIdx(Math.floor(Math.random() * T.thoughts.en.length))
    const tick = () => {
      const now = new Date()
      setTimeStr(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }))
      setDateStr(now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))
    }
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    const i = setInterval(() => {
      setQVis(false)
      setTimeout(() => { setQIdx(idx => (idx + 1) % QUOTES.length); setQVis(true) }, 400)
    }, 8000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => {
        if (data.user) setUserName(data.user.user_metadata?.name ?? data.user.email?.split('@')[0] ?? 'Yaar')
      })
    })
  }, [])

  const { data: tasks    = [] } = useQuery<any[]>({ queryKey: ['tasks'],    queryFn: () => safeFetch('/api/tasks') })
  const { data: habits   = [] } = useQuery<any[]>({ queryKey: ['habits'],   queryFn: () => safeFetch('/api/habits') })
  const { data: goals    = [] } = useQuery<any[]>({ queryKey: ['goals'],    queryFn: () => safeFetch('/api/goals') })
  const { data: projects = [] } = useQuery<any[]>({ queryKey: ['projects'], queryFn: () => safeFetch('/api/projects') })

  const today       = todayStr()
  const pending     = tasks.filter(t => !t.done)
  const doneToday   = tasks.filter(t => t.done && t.completed_at?.slice(0, 10) === today)
  const overdue     = pending.filter(t => t.due && t.due < today)
  const todayTasks  = pending.filter(t => t.due === today)
  const highPri     = pending.filter(t => t.priority === 'urgent' || t.priority === 'high').slice(0, 5)
  const donePct     = tasks.length ? Math.round(tasks.filter(t => t.done).length / tasks.length * 100) : 0
  const habitsToday = habits.filter((h: any) => h.logs && h.logs[today])
  const habitPct    = habits.length ? Math.round(habitsToday.length / habits.length * 100) : 0
  const goalAvg     = goals.length ? Math.round(goals.reduce((s: number, g: any) => s + Math.min(Math.round((g.current / Math.max(g.target, 1)) * 100), 100), 0) / goals.length) : 0
  const projDone    = projects.length ? Math.round(projects.filter((p: any) => p.status === 'done').length / projects.length * 100) : 0

  const q = QUOTES[qIdx]
  const thoughts = T.thoughts[lang]
  const thought  = thoughts[tIdx % thoughts.length]

  // Greeting based on time + language
  const hour = new Date().getHours()
  const greetFn = hour < 5 ? T.greetNight : hour < 12 ? T.greetMorning : hour < 17 ? T.greetAfternoon : hour < 21 ? T.greetEvening : T.greetNight
  const greeting = t(greetFn, lang)(userName.split(' ')[0])

  // Motivation
  const mot = (() => {
    if (doneToday.length >= 5) return { msg: t(T.motiveDone, lang)(doneToday.length), color: 'var(--teal)' }
    if (overdue.length > 3)    return { msg: t(T.motiveOverdue, lang)(overdue.length), color: 'var(--rose)' }
    if (todayTasks.length > 0) return { msg: t(T.motiveToday, lang)(todayTasks.length), color: 'var(--accent)' }
    return { msg: t(T.motiveDefault, lang), color: 'var(--indigo)' }
  })()

  const QA = [
    { icon: '📋', label: t(T.qa.addTask, lang),    sub: '→ Tasks',  color: 'var(--indigo)', bg: 'rgba(129,140,248,0.08)', href: '/tasks' },
    { icon: '🌱', label: t(T.qa.trackHabit, lang), sub: '→ Habits', color: 'var(--teal)',   bg: 'rgba(16,185,129,0.08)',  href: '/habits' },
    { icon: '🎯', label: t(T.qa.setGoal, lang),    sub: '→ Goals',  color: 'var(--rose)',   bg: 'rgba(244,63,94,0.08)',   href: '/goals' },
    { icon: '🤖', label: t(T.qa.askAI, lang),      sub: '→ AI',     color: 'var(--purple)', bg: 'rgba(139,92,246,0.08)',  href: '/ai' },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 32 }}>

      {/* ── HERO ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: '24px 28px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,107,53,0.08),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, letterSpacing: '-1px', color: 'var(--text)', marginBottom: 4 }}>{greeting}</h1>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>{dateStr}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: mot.color + '10', border: `1px solid ${mot.color}25`, borderRadius: 12, fontSize: 13, color: mot.color, fontWeight: 700, marginBottom: 12 }}>{mot.msg}</div>
            {thought && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.12)', borderRadius: 12, maxWidth: 480 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>💭</span>
                <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>{thought}</span>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 40, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', lineHeight: 1 }}>{timeStr}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6, marginBottom: 10 }}>{doneToday.length > 0 ? `🎉 ${doneToday.length} ${t(T.done, lang)}` : ''}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {overdue.length > 0 && <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(244,63,94,0.1)', color: 'var(--rose)', borderRadius: 20, fontWeight: 700 }}>⚠️ {overdue.length}</span>}
              {todayTasks.length > 0 && <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(245,158,11,0.1)', color: 'var(--gold)', borderRadius: 20, fontWeight: 700 }}>📅 {todayTasks.length}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── QUOTE ── */}
      <div style={{ background: 'linear-gradient(135deg,rgba(255,107,53,0.05),rgba(139,92,246,0.04))', border: '1px solid rgba(255,107,53,0.12)', borderRadius: 16, padding: '16px 20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 28, flexShrink: 0, opacity: qVis ? 1 : 0, transition: 'opacity 0.4s' }}>{q.emoji}</span>
        <div style={{ flex: 1, opacity: qVis ? 1 : 0, transform: qVis ? 'none' : 'translateY(6px)', transition: 'all 0.4s ease' }}>
          <div style={{ fontSize: 'clamp(13px,1.8vw,15px)', fontWeight: 700, color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.55 }}>
            &ldquo;{lang === 'hi' ? q.hi : lang === 'en' ? q.en : q.hinglish}&rdquo;
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, fontWeight: 600 }}>— {q.author}</div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
        <StatCard icon="📋" label={t(T.pending, lang)}  value={pending.length}              sub={todayTasks.length > 0 ? `${todayTasks.length} ${t(T.todayTasks, lang)}` : ''} color="var(--indigo)" />
        <StatCard icon="✅" label={t(T.done, lang)}     value={tasks.filter(tt => tt.done).length} sub={`${donePct}%`} color="var(--teal)" trend={donePct > 50 ? 8 : -3} />
        <StatCard icon="🌱" label={t(T.habits, lang)}   value={habitsToday.length}           sub={`${habitPct}%`} color="var(--gold)" suffix={`/${habits.length}`} />
        <StatCard icon="🎯" label={t(T.goals, lang)}    value={goalAvg}                      sub={`${goals.length} active`} color="var(--rose)" suffix="%" />
      </div>

      {/* ── 3 COLS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>

        {/* Today tasks */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>📅 {t(T.todayTasks, lang)}</span>
            <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(245,158,11,0.1)', color: 'var(--gold)', borderRadius: 20, fontWeight: 700 }}>{todayTasks.length}</span>
          </div>
          {todayTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
              <div style={{ fontSize: 13 }}>{t(T.noTasksToday, lang)}</div>
              <div style={{ fontSize: 11, marginTop: 3 }}>{t(T.noTasksSub, lang)}</div>
            </div>
          ) : (
            <>
              {todayTasks.slice(0, 5).map((tk: any) => (
                <div key={tk.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', background: 'var(--surface2)', borderRadius: 10, borderLeft: `3px solid ${PRI_COLOR[tk.priority] ?? '#6B7280'}`, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tk.title}</span>
                </div>
              ))}
              {todayTasks.length > 5 && <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 4 }}>+{todayTasks.length - 5}</div>}
            </>
          )}
        </div>

        {/* Progress */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>📊 {t(T.progress, lang)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[{ label: t(T.done, lang), pct: donePct, color: 'var(--teal)', emoji: '✅' }, { label: t(T.habits, lang), pct: habitPct, color: 'var(--gold)', emoji: '🌱' }, { label: t(T.goals, lang), pct: goalAvg, color: 'var(--rose)', emoji: '🎯' }, { label: 'Projects', pct: projDone, color: 'var(--indigo)', emoji: '📁' }].map(r => (
              <div key={r.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ring pct={r.pct} color={r.color} size={64} stroke={6} />
                  <div style={{ position: 'absolute', fontFamily: 'var(--font-head)', fontSize: 12, fontWeight: 900, color: r.color }}>{r.pct}%</div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700 }}>{r.emoji} {r.label}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t(T.thisWeek, lang)}</div>
            <WeekBar tasks={tasks} />
          </div>
        </div>

        {/* High priority */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>🔥 {t(T.highPriority, lang)}</span>
            <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(244,63,94,0.1)', color: 'var(--rose)', borderRadius: 20, fontWeight: 700 }}>{highPri.length}</span>
          </div>
          {highPri.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)' }}><div style={{ fontSize: 28, marginBottom: 6 }}>✅</div><div style={{ fontSize: 13 }}>{t(T.noUrgent, lang)}</div></div>
          ) : highPri.map((tk: any) => (
            <div key={tk.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', background: tk.priority === 'urgent' ? 'rgba(249,115,22,0.06)' : 'rgba(244,63,94,0.05)', border: `1px solid ${tk.priority === 'urgent' ? 'rgba(249,115,22,0.15)' : 'rgba(244,63,94,0.1)'}`, borderRadius: 10, marginBottom: 7 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{tk.priority === 'urgent' ? '🚨' : '❗'}</span>
              <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tk.title}</span>
              {tk.due && <span style={{ fontSize: 10, color: tk.due < today ? 'var(--rose)' : 'var(--text3)', flexShrink: 0, fontWeight: 700 }}>{tk.due === today ? '•' : tk.due.slice(5)}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {QA.map(item => (
          <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, textDecoration: 'none', transition: 'all 0.18s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = item.color; el.style.background = item.bg; el.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.background = 'var(--surface)'; el.style.transform = 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{item.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>{item.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
