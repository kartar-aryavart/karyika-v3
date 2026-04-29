'use client'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from '@/store'
import { t, T } from '@/lib/i18n'
import { PRI_COLOR, PRI_BG, STATUSES, TASK_TEMPLATES, todayStr, fmt } from '@/types'
import type { Task, TaskView, TaskFilter } from '@/types'

// ─── STYLES ───────────────────────────────────────────────────────────────────
const INP: React.CSSProperties = {
  background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 9,
  color: 'var(--text)', fontSize: 13, padding: '9px 13px',
  fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
}
const LBL: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--text3)', display: 'block',
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px',
}
const uid = () => Math.random().toString(36).slice(2, 9)

// ─── API ──────────────────────────────────────────────────────────────────────
const safeArr = (d: unknown): any[] => (Array.isArray(d) ? d : [])
const apiFetch = (url: string) => fetch(url).then(r => r.json()).then(safeArr)

// ─── TOAST ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([])
  const add = useCallback((msg: string, type = 'info') => {
    const id = Date.now()
    setToasts(tt => [...tt, { id, msg, type }])
    setTimeout(() => setToasts(tt => tt.filter(x => x.id !== id)), 3500)
  }, [])
  return { toasts, toast: add }
}

function Toasts({ toasts }: { toasts: { id: number; msg: string; type: string }[] }) {
  if (!toasts.length) return null
  const col: Record<string, string> = { success: 'var(--teal)', error: 'var(--rose)', info: 'var(--indigo)', warning: 'var(--gold)' }
  return (
    <div className="toast-wrap">
      {toasts.map(tk => (
        <div key={tk.id} className="toast" style={{ borderLeft: `3px solid ${col[tk.type] ?? col.info}` }}>
          {tk.type === 'success' ? '✅' : tk.type === 'error' ? '❌' : 'ℹ️'} {tk.msg}
        </div>
      ))}
    </div>
  )
}

// ─── FORM STATE ───────────────────────────────────────────────────────────────
type FormState = {
  title: string; desc: string; due: string; dueTime: string
  priority: string; status: string; category: string
  tags: string[]; subtasks: { id: string; title: string; done: boolean }[]
  estimatedTime: string; points: number; recurring: string
  projectId: string; sprintId: string; urgency: string; importance: string
  coverColor: string; customFields: Record<string, string>
}
const EMPTY: FormState = {
  title: '', desc: '', due: '', dueTime: '', priority: 'medium', status: 'todo',
  category: 'work', tags: [], subtasks: [], estimatedTime: '', points: 0,
  recurring: 'none', projectId: '', sprintId: 'backlog',
  urgency: 'not-urgent', importance: 'important', coverColor: '', customFields: {},
}

// ─── TASK FORM MODAL ──────────────────────────────────────────────────────────
function TaskModal({ initial, onSave, onClose, projects }: {
  initial?: Task | null; onSave: (f: FormState) => Promise<void>
  onClose: () => void; projects: any[]
}) {
  const { lang } = useStore()
  const [form, setForm] = useState<FormState>(
    initial ? {
      ...EMPTY,
      title: initial.title ?? '',
      desc: (initial as any).description ?? '',
      due: initial.due ?? '',
      dueTime: initial.dueTime ?? '',
      priority: initial.priority ?? 'medium',
      status: initial.status ?? 'todo',
      tags: initial.tags ?? [],
      subtasks: initial.subtasks ?? [],
      estimatedTime: initial.estimatedTime != null ? String(initial.estimatedTime) : '',
      points: initial.points ?? 0,
      recurring: typeof initial.recurring === 'string' ? initial.recurring : 'none',
      projectId: initial.project_id ?? '',
      sprintId: initial.sprintId ?? 'backlog',
      urgency: initial.urgency ?? 'not-urgent',
      importance: initial.importance ?? 'important',
      coverColor: initial.coverColor ?? '',
      customFields: (initial.customFields as Record<string, string>) ?? {},
    } : EMPTY
  )
  const [tagInput, setTagInput] = useState('')
  const [stInput, setStInput]   = useState('')
  const [tab, setTab]           = useState('basic')
  const [saving, setSaving]     = useState(false)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  const TABS = [
    { id: 'basic',    label: t(T.form.tabBasic, lang) },
    { id: 'details',  label: t(T.form.tabDetails, lang) },
    { id: 'subtasks', label: `${t(T.form.tabSubtasks, lang)} (${form.subtasks.length})` },
    { id: 'custom',   label: t(T.form.tabCustom, lang) },
  ]
  const coverColors = ['', '#FF6B35', '#F43F5E', '#10B981', '#818CF8', '#F59E0B', '#06B6D4', '#8B5CF6']

  // Priority options from i18n
  const priOptions = [
    { val: 'urgent', label: t(T.priority.urgent, lang) },
    { val: 'high',   label: t(T.priority.high,   lang) },
    { val: 'medium', label: t(T.priority.medium, lang) },
    { val: 'low',    label: t(T.priority.low,    lang) },
    { val: 'none',   label: t(T.priority.none,   lang) },
  ]
  const statusOptions = STATUSES.map(s => ({
    val: s.id,
    label: t((T.status as any)[s.id] ?? { en: s.label, hi: s.label, hinglish: s.label }, lang)
  }))
  const recurringOptions = [
    { val: 'none',     label: lang === 'hi' ? 'दोहराव नहीं' : 'No repeat' },
    { val: 'daily',    label: lang === 'hi' ? 'प्रतिदिन' : lang === 'en' ? 'Daily' : 'Daily' },
    { val: 'weekdays', label: lang === 'hi' ? 'सप्ताहिक दिन' : 'Weekdays' },
    { val: 'weekly',   label: lang === 'hi' ? 'साप्ताहिक' : 'Weekly' },
    { val: 'monthly',  label: lang === 'hi' ? 'मासिक' : 'Monthly' },
  ]
  const urgencyOptions = [
    { val: 'urgent',     label: lang === 'hi' ? '🔥 अत्यावश्यक' : '🔥 Urgent' },
    { val: 'not-urgent', label: lang === 'hi' ? '🕐 अत्यावश्यक नहीं' : '🕐 Not Urgent' },
  ]
  const importanceOptions = [
    { val: 'important',     label: lang === 'hi' ? '⭐ महत्त्वपूर्ण' : '⭐ Important' },
    { val: 'not-important', label: lang === 'hi' ? '• महत्त्वहीन' : '• Not Important' },
  ]
  const sprintOptions = [
    { val: 'backlog',  label: t(T.sprint.backlog,  lang) },
    { val: 'sprint-1', label: t(T.sprint.sprint1,  lang) },
    { val: 'sprint-2', label: t(T.sprint.sprint2,  lang) },
  ]

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
              {initial?.id ? t(T.form.editTask, lang) : t(T.form.newTask, lang)}
            </div>
            <button onClick={onClose} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text3)', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {TABS.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{ padding: '9px 16px', border: 'none', borderBottom: `2px solid ${tab === tb.id ? 'var(--accent)' : 'transparent'}`, background: 'transparent', color: tab === tb.id ? 'var(--accent)' : 'var(--text3)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', borderRadius: '6px 6px 0 0' }}>{tb.label}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ── BASIC ── */}
          {tab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Templates */}
              {!initial?.id && (
                <div>
                  <label style={LBL}>{t(T.form.templates, lang)}</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {TASK_TEMPLATES.map(tpl => (
                      <button key={tpl.label} onClick={() => setForm(f => ({ ...f, ...tpl, estimatedTime: String(tpl.estimatedTime), tags: tpl.tags ?? [], title: f.title || tpl.label.split(' ').slice(1).join(' ') }))}
                        style={{ padding: '5px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}>
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label style={LBL}>{t(T.form.title, lang)}</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder={t(T.form.titlePh, lang)} autoFocus style={{ ...INP, fontSize: 15, fontWeight: 600, padding: '11px 14px' }} />
              </div>

              {/* Description */}
              <div>
                <label style={LBL}>{t(T.form.desc, lang)}</label>
                <textarea value={form.desc} onChange={e => set('desc', e.target.value)} placeholder={t(T.form.descPh, lang)} rows={3} style={{ ...INP, resize: 'vertical', lineHeight: 1.6 }} />
              </div>

              {/* Priority + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>{t(T.form.priority, lang)}</label>
                  <select value={form.priority ?? ''} onChange={e => set('priority', e.target.value)} style={INP}>
                    {priOptions.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>{t(T.form.status, lang)}</label>
                  <select value={form.status ?? ''} onChange={e => set('status', e.target.value)} style={INP}>
                    {statusOptions.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Due date + time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>{t(T.form.dueDate, lang)}</label>
                  <input type="date" value={form.due ?? ''} onChange={e => set('due', e.target.value)} style={{ ...INP, colorScheme: 'dark' as any }} />
                </div>
                <div>
                  <label style={LBL}>{t(T.form.dueTime, lang)}</label>
                  <input type="time" value={form.dueTime ?? ''} onChange={e => set('dueTime', e.target.value)} style={{ ...INP, colorScheme: 'dark' as any }} />
                </div>
              </div>

              {/* Project */}
              {projects.length > 0 && (
                <div>
                  <label style={LBL}>{t(T.form.project, lang)}</label>
                  <select value={form.projectId ?? ''} onChange={e => set('projectId', e.target.value)} style={INP}>
                    <option value="">{t(T.form.noProject, lang)}</option>
                    {projects.map((p: any) => <option key={p.id} value={p.id}>{p.emoji ?? '📁'} {p.name}</option>)}
                  </select>
                </div>
              )}

              {/* Tags */}
              <div>
                <label style={LBL}>{t(T.form.tags, lang)}</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {form.tags.map(tag => (
                    <span key={tag} style={{ padding: '4px 10px', background: 'rgba(255,107,53,0.12)', color: 'var(--accent)', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      #{tag}
                      <span onClick={() => set('tags', form.tags.filter(tg => tg !== tag))} style={{ cursor: 'pointer', opacity: 0.6, fontSize: 14 }}>×</span>
                    </span>
                  ))}
                </div>
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                      e.preventDefault()
                      const tag = tagInput.trim().toLowerCase()
                      if (!form.tags.includes(tag)) set('tags', [...form.tags, tag])
                      setTagInput('')
                    }
                  }}
                  placeholder={t(T.form.tagPh, lang)} style={INP} />
              </div>
            </div>
          )}

          {/* ── DETAILS ── */}
          {tab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>{t(T.form.estTime, lang)}</label>
                  <input type="number" value={form.estimatedTime ?? ''} onChange={e => set('estimatedTime', e.target.value)} placeholder="60" style={INP} />
                </div>
                <div>
                  <label style={LBL}>{t(T.form.points, lang)}</label>
                  <select value={form.points ?? 0} onChange={e => set('points', parseInt(e.target.value) || 0)} style={INP}>
                    {[0,1,2,3,5,8,13,21].map(p => <option key={p} value={p}>{p === 0 ? (lang === 'hi' ? 'कोई पॉइंट नहीं' : 'No points') : `${p} pts`}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>{t(T.form.urgency, lang)}</label>
                  <select value={form.urgency ?? ''} onChange={e => set('urgency', e.target.value)} style={INP}>
                    {urgencyOptions.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>{t(T.form.importance, lang)}</label>
                  <select value={form.importance ?? ''} onChange={e => set('importance', e.target.value)} style={INP}>
                    {importanceOptions.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>{t(T.form.recurring, lang)}</label>
                  <select value={form.recurring ?? 'none'} onChange={e => set('recurring', e.target.value)} style={INP}>
                    {recurringOptions.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>{t(T.form.sprint, lang)}</label>
                  <select value={form.sprintId ?? 'backlog'} onChange={e => set('sprintId', e.target.value)} style={INP}>
                    {sprintOptions.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={LBL}>{t(T.form.coverColor, lang)}</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {coverColors.map(c => (
                    <div key={c || 'none'} onClick={() => set('coverColor', c)}
                      style={{ width: 28, height: 28, borderRadius: 8, background: c || 'rgba(255,255,255,0.08)', cursor: 'pointer', outline: form.coverColor === c ? '2px solid var(--accent)' : '2px solid transparent', outlineOffset: 2, transition: 'outline 0.15s' }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SUBTASKS ── */}
          {tab === 'subtasks' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input value={stInput} onChange={e => setStInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && stInput.trim()) { set('subtasks', [...form.subtasks, { id: uid(), title: stInput.trim(), done: false }]); setStInput('') } }}
                  placeholder={t(T.form.addSubtask, lang)} style={{ ...INP, flex: 1 }} />
                <button onClick={() => { if (stInput.trim()) { set('subtasks', [...form.subtasks, { id: uid(), title: stInput.trim(), done: false }]); setStInput('') } }}
                  style={{ padding: '9px 18px', background: 'var(--accent)', border: 'none', borderRadius: 9, color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }}>+</button>
              </div>
              {form.subtasks.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '32px 0', fontSize: 13 }}>{t(T.form.noSubtasks, lang)}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {form.subtasks.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <input type="checkbox" checked={s.done} onChange={() => set('subtasks', form.subtasks.map(st => st.id === s.id ? { ...st, done: !st.done } : st))} style={{ accentColor: 'var(--accent)', width: 15, height: 15, cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 13, color: s.done ? 'var(--text3)' : 'var(--text)', textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</span>
                    <button onClick={() => set('subtasks', form.subtasks.filter(st => st.id !== s.id))} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--rose)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>×</button>
                  </div>
                ))}
              </div>
              {form.subtasks.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{lang === 'hi' ? 'प्रगति' : 'Progress'}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)' }}>{Math.round(form.subtasks.filter(s => s.done).length / form.subtasks.length * 100)}%</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--surface3)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg,var(--teal),var(--cyan))', borderRadius: 5, width: `${Math.round(form.subtasks.filter(s => s.done).length / form.subtasks.length * 100)}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CUSTOM FIELDS ── */}
          {tab === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[{ key: 'url', label: 'URL / Link', ph: 'https://...' }, { key: 'phone', label: 'Phone', ph: '+91 XXXXX XXXXX' }, { key: 'location', label: lang === 'hi' ? 'स्थान' : 'Location', ph: 'City, Country' }, { key: 'version', label: 'Version', ph: 'v1.0.0' }].map(f => (
                <div key={f.key}>
                  <label style={LBL}>{f.label}</label>
                  <input value={form.customFields[f.key] ?? ''} onChange={e => set('customFields', { ...form.customFields, [f.key]: e.target.value })} placeholder={f.ph} style={INP} />
                </div>
              ))}
              <div>
                <label style={LBL}>{lang === 'hi' ? 'कस्टम नोट' : 'Custom Note'}</label>
                <textarea value={form.customFields['note'] ?? ''} onChange={e => set('customFields', { ...form.customFields, note: e.target.value })} rows={3} style={{ ...INP, resize: 'vertical' }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--surface2)' }}>
          <button onClick={onClose} style={{ padding: '10px 22px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>{t(T.form.cancel, lang)}</button>
          <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{ padding: '10px 26px', background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 13, cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving || !form.title.trim() ? 0.6 : 1, boxShadow: '0 4px 16px rgba(255,107,53,0.3)' }}>
            {saving ? t(T.form.saving, lang) : initial?.id ? t(T.form.update, lang) : t(T.form.save, lang)}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── QUICK ADD (AI NLP) ───────────────────────────────────────────────────────
function QuickAdd({ onAdd, lang }: { onAdd: (data: any) => void; lang: string }) {
  const [val, setVal]       = useState('')
  const [parsing, setParsing] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [saving, setSaving]   = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const parse = useCallback(async (text: string) => {
    if (text.length < 4) { setPreview(null); return }
    const hasHints = /\b(kal|aaj|subah|shaam|tomorrow|today|pm|am|urgent|high|monday|tuesday|wednesday|thursday|friday|कल|आज|सुबह|शाम)\b/i.test(text)
    if (!hasHints) { setPreview(null); return }
    setParsing(true)
    try {
      const res = await fetch('/api/ai/parse-task', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input: text }) })
      if (res.ok) setPreview(await res.json())
    } catch { /* silent */ }
    setParsing(false)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVal(e.target.value); setPreview(null)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => parse(e.target.value), 700)
  }

  const submit = async () => {
    if (!val.trim() || saving) return
    setSaving(true)
    const data = preview
      ? { title: preview.title || val.trim(), due: preview.due || null, due_time: preview.dueTime || null, priority: preview.priority ?? 'none', tags: preview.tags ?? [] }
      : { title: val.trim(), priority: 'none', tags: [] }
    onAdd(data)
    setVal(''); setPreview(null); setSaving(false)
  }

  const ph = lang === 'hi'
    ? 'जल्दी जोड़ें... (जैसे "कल सुबह 9 बजे अत्यावश्यक मीटिंग")'
    : lang === 'en'
      ? 'Quick add... (try "urgent meeting tomorrow 9am")'
      : 'Quick add... (try "kal urgent meeting 9am")'

  return (
    <div style={{ position: 'relative', marginBottom: 14 }}>
      {preview && (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 8, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow)', zIndex: 10 }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{lang === 'hi' ? 'AI ने पहचाना →' : 'AI parsed →'}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{preview.title}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
              {preview.due && <span style={{ fontSize: 11, padding: '2px 9px', background: 'rgba(255,107,53,0.1)', color: 'var(--accent)', borderRadius: 20, fontWeight: 600 }}>📅 {preview.due}{preview.dueTime ? ` ${preview.dueTime}` : ''}</span>}
              {preview.priority && preview.priority !== 'none' && <span style={{ fontSize: 11, padding: '2px 9px', background: PRI_BG[preview.priority] ?? '', color: PRI_COLOR[preview.priority] ?? '', borderRadius: 20, fontWeight: 600 }}>⚡ {preview.priority}</span>}
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', zIndex: 1 }}>{parsing ? '🤖' : '⚡'}</span>
          <input value={val} onChange={handleChange} onKeyDown={e => e.key === 'Enter' && submit()} placeholder={ph} style={{ ...INP, paddingLeft: 40, fontSize: 13, height: 42 }} />
        </div>
        {val && (
          <button onClick={submit} disabled={saving} style={{ padding: '0 22px', background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: '0 2px 10px rgba(255,107,53,0.3)', height: 42, fontSize: 13 }}>
            {saving ? '...' : lang === 'hi' ? '+ जोड़ें' : '+ Add'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── TASK ROW ─────────────────────────────────────────────────────────────────
function TaskRow({ task, selected, onSelect, onToggle, onEdit, onDelete, lang }: {
  task: Task; selected: boolean; lang: string
  onSelect: (id: string) => void; onToggle: (t: Task) => void
  onEdit: (t: Task) => void; onDelete: (id: string) => void
}) {
  const [hov, setHov] = useState(false)
  const today     = todayStr()
  const isOverdue = !task.done && !!task.due && task.due < today
  const isToday   = task.due === today
  const status    = STATUSES.find(s => s.id === task.status) ?? STATUSES[0]
  const stDone    = (task.subtasks ?? []).filter(s => s.done).length
  const stTotal   = (task.subtasks ?? []).length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '32px 22px 1fr 120px 82px 88px 62px 52px', gap: 8, alignItems: 'center', padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', background: selected ? 'rgba(255,107,53,0.05)' : hov ? 'rgba(255,255,255,0.02)' : 'transparent', borderLeft: `3px solid ${selected ? 'var(--accent)' : 'transparent'}`, transition: 'all 0.1s' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>

      <input type="checkbox" checked={selected} onChange={() => onSelect(task.id)} style={{ accentColor: 'var(--accent)', width: 14, height: 14, cursor: 'pointer' }} />

      <div onClick={() => onToggle(task)} style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${task.done ? 'var(--teal)' : 'rgba(255,255,255,0.2)'}`, background: task.done ? 'var(--teal)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
        {task.done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
      </div>

      <div onClick={() => onEdit(task)} style={{ cursor: 'pointer', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {task.coverColor && <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.coverColor, flexShrink: 0 }} />}
          <span style={{ fontSize: 13, fontWeight: 600, color: task.done ? 'var(--text3)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
          {(task.points ?? 0) > 0 && <span style={{ fontSize: 9, padding: '1px 6px', background: 'rgba(129,140,248,0.15)', color: 'var(--indigo)', borderRadius: 10, fontWeight: 800, flexShrink: 0 }}>{task.points}pt</span>}
          {task.recurring && task.recurring !== 'none' && <span style={{ fontSize: 10, flexShrink: 0 }}>🔄</span>}
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
          {(task.tags ?? []).slice(0, 3).map(tag => <span key={tag} style={{ fontSize: 10, padding: '1px 7px', background: 'rgba(255,107,53,0.08)', color: 'var(--accent2)', borderRadius: 10 }}>#{tag}</span>)}
          {stTotal > 0 && <span style={{ fontSize: 10, color: 'var(--text3)' }}>☐ {stDone}/{stTotal}</span>}
        </div>
      </div>

      <span style={{ fontSize: 10, padding: '3px 9px', background: `${status.color}18`, color: status.color, borderRadius: 20, fontWeight: 700, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {t((T.status as any)[status.id] ?? { en: status.label, hi: status.label, hinglish: status.label }, lang as any)}
      </span>
      <span style={{ fontSize: 11, color: isOverdue ? 'var(--rose)' : isToday ? 'var(--gold)' : 'var(--text3)', fontWeight: isOverdue || isToday ? 700 : 400 }}>{task.due ? fmt(task.due) : '—'}</span>
      <span style={{ fontSize: 10, padding: '2px 9px', background: PRI_BG[task.priority] ?? 'rgba(107,114,128,0.1)', color: PRI_COLOR[task.priority] ?? 'var(--text3)', borderRadius: 20, fontWeight: 700, textAlign: 'center' }}>
        {t((T.priority as any)[task.priority] ?? { en: task.priority, hi: task.priority, hinglish: task.priority }, lang as any).replace(/🔴|🟠|🟡|🟢|⚪/g, '').trim()}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{task.estimatedTime ? `${task.estimatedTime}m` : '—'}</span>

      <div style={{ display: 'flex', gap: 4, opacity: hov ? 1 : 0, transition: 'opacity 0.1s' }}>
        <button onClick={() => onEdit(task)} style={{ background: 'var(--surface3)', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 11, padding: '4px 7px', borderRadius: 6, transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--indigo)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>✏️</button>
        <button onClick={() => onDelete(task.id)} style={{ background: 'var(--surface3)', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 11, padding: '4px 7px', borderRadius: 6, transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--rose)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>🗑</button>
      </div>
    </div>
  )
}

// ─── KANBAN ───────────────────────────────────────────────────────────────────
function KanbanView({ tasks, onEdit, onStatusChange, onToggle, lang }: { tasks: Task[]; onEdit: (t: Task) => void; onStatusChange: (t: Task, s: string) => void; onToggle: (t: Task) => void; lang: string }) {
  const [dragging, setDragging] = useState<Task | null>(null)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STATUSES.length},1fr)`, gap: 12, alignItems: 'start' }}>
      {STATUSES.map(status => {
        const cols = tasks.filter(tk => tk.status === status.id || (status.id === 'todo' && !tk.status))
        const stLabel = t((T.status as any)[status.id] ?? { en: status.label, hi: status.label, hinglish: status.label }, lang as any)
        return (
          <div key={status.id} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (dragging) onStatusChange(dragging, status.id) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 4px', marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: status.color }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', flex: 1 }}>{stLabel}</span>
              <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', color: 'var(--text3)', borderRadius: 20, padding: '1px 7px', fontWeight: 700 }}>{cols.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 60 }}>
              {cols.map(task => {
                const stDone = (task.subtasks ?? []).filter(s => s.done).length
                const stTotal = (task.subtasks ?? []).length
                return (
                  <div key={task.id} draggable onDragStart={() => setDragging(task)} onDragEnd={() => setDragging(null)} onClick={() => onEdit(task)}
                    style={{ background: 'var(--surface2)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderLeft: `3px solid ${PRI_COLOR[task.priority] ?? '#6B7280'}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', opacity: dragging?.id === task.id ? 0.4 : 1, transition: 'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface3)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'}>
                    {task.coverColor && <div style={{ height: 3, background: task.coverColor, margin: '-12px -14px 10px -14px', borderRadius: '10px 10px 0 0' }} />}
                    <div style={{ fontSize: 13, fontWeight: 600, color: task.done ? 'var(--text3)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', marginBottom: 8, lineHeight: 1.4 }}>{task.title}</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: stTotal ? 8 : 0 }}>
                      {(task.tags ?? []).slice(0, 2).map(tag => <span key={tag} style={{ fontSize: 10, padding: '1px 7px', background: 'rgba(255,107,53,0.08)', color: 'var(--accent2)', borderRadius: 10 }}>#{tag}</span>)}
                      {(task.points ?? 0) > 0 && <span style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(129,140,248,0.12)', color: 'var(--indigo)', borderRadius: 10, fontWeight: 700 }}>{task.points}pt</span>}
                    </div>
                    {stTotal > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: 10, color: 'var(--text3)' }}>{lang === 'hi' ? 'उप-कार्य' : 'Subtasks'}</span><span style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 700 }}>{stDone}/{stTotal}</span></div>
                        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', background: 'var(--teal)', borderRadius: 3, width: `${stTotal ? Math.round(stDone/stTotal*100) : 0}%` }} /></div>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: task.due && task.due < todayStr() ? 'var(--rose)' : task.due === todayStr() ? 'var(--gold)' : 'var(--text3)' }}>{task.due ? fmt(task.due) : '—'}</span>
                      <div onClick={e => { e.stopPropagation(); onToggle(task) }} style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${task.done ? 'var(--teal)' : 'rgba(255,255,255,0.2)'}`, background: task.done ? 'var(--teal)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        {task.done && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>✓</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
              {cols.length === 0 && <div style={{ height: 60, border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--surface3)', fontSize: 12 }}>{lang === 'hi' ? 'यहाँ छोड़ें' : 'Drop here'}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── SPRINT VIEW ──────────────────────────────────────────────────────────────
function SprintView({ tasks, onEdit, onToggle, lang }: { tasks: Task[]; onEdit: (t: Task) => void; onToggle: (t: Task) => void; lang: string }) {
  const sprints = [{ id: 'backlog', labelKey: 'backlog', color: '#6B7280' }, { id: 'sprint-1', labelKey: 'sprint1', color: '#FF6B35' }, { id: 'sprint-2', labelKey: 'sprint2', color: '#818CF8' }]
  const [open, setOpen] = useState<Record<string, boolean>>({ backlog: true, 'sprint-1': true, 'sprint-2': false })
  const pts = (arr: Task[]) => arr.reduce((s, tk) => s + (tk.points ?? 0), 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sprints.map(sprint => {
        const st = sprint.id === 'backlog' ? tasks.filter(tk => !tk.sprintId || tk.sprintId === 'backlog') : tasks.filter(tk => tk.sprintId === sprint.id)
        const done = st.filter(tk => tk.done); const tp = pts(st); const dp = pts(done)
        const label = t((T.sprint as any)[sprint.labelKey], lang as any)
        return (
          <div key={sprint.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div onClick={() => setOpen(o => ({ ...o, [sprint.id]: !o[sprint.id] }))} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
              <span style={{ fontSize: 11, color: 'var(--text3)', transition: 'transform 0.2s', display: 'inline-block', transform: open[sprint.id] ? 'rotate(90deg)' : 'none' }}>▶</span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: sprint.color }} />
              <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 800, flex: 1 }}>{label}</span>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text3)' }}>
                <span>{st.length} {lang === 'hi' ? 'कार्य' : 'tasks'}</span>
                {tp > 0 && <span style={{ color: 'var(--indigo)', fontWeight: 700 }}>{dp}/{tp} pts</span>}
                <span style={{ color: sprint.id !== 'backlog' ? 'var(--teal)' : 'var(--text3)' }}>{st.length ? Math.round(done.length/st.length*100) : 0}%</span>
              </div>
            </div>
            {open[sprint.id] && (
              <div>
                {st.length === 0 && <div style={{ padding: 18, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>{t(T.sprint.noTasks, lang as any)}</div>}
                {st.map(task => (
                  <div key={task.id} onClick={() => onEdit(task)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderTop: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <div onClick={e => { e.stopPropagation(); onToggle(task) }} style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${task.done ? 'var(--teal)' : 'rgba(255,255,255,0.2)'}`, background: task.done ? 'var(--teal)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      {task.done && <span style={{ color: '#fff', fontSize: 8, fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, flex: 1, color: task.done ? 'var(--text3)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                    {(task.points ?? 0) > 0 && <span style={{ fontSize: 10, padding: '1px 7px', background: 'rgba(129,140,248,0.12)', color: 'var(--indigo)', borderRadius: 10, fontWeight: 700, flexShrink: 0 }}>{task.points}pt</span>}
                    <span style={{ fontSize: 10, padding: '2px 8px', background: PRI_BG[task.priority] ?? '', color: PRI_COLOR[task.priority] ?? '', borderRadius: 12, fontWeight: 700, flexShrink: 0 }}>{task.priority}</span>
                    {task.due && <span style={{ fontSize: 11, color: task.due < todayStr() ? 'var(--rose)' : 'var(--text3)', flexShrink: 0 }}>{fmt(task.due)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── MATRIX VIEW ──────────────────────────────────────────────────────────────
function MatrixView({ tasks, onEdit, onToggle, lang }: { tasks: Task[]; onEdit: (t: Task) => void; onToggle: (t: Task) => void; lang: string }) {
  const Q = [
    { u: 'urgent',     i: 'important',     labelKey: 'doFirst',   color: '#F43F5E', bg: 'rgba(244,63,94,0.06)' },
    { u: 'not-urgent', i: 'important',     labelKey: 'schedule',  color: '#818CF8', bg: 'rgba(129,140,248,0.06)' },
    { u: 'urgent',     i: 'not-important', labelKey: 'delegate',  color: '#F59E0B', bg: 'rgba(245,158,11,0.06)' },
    { u: 'not-urgent', i: 'not-important', labelKey: 'eliminate', color: '#6B7280', bg: 'rgba(107,114,128,0.06)' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, height: 480 }}>
      {Q.map(q => {
        const qt = tasks.filter(tk => (tk.urgency ?? 'not-urgent') === q.u && (tk.importance ?? 'important') === q.i)
        const label = t((T.matrix as any)[q.labelKey], lang as any)
        return (
          <div key={q.labelKey} style={{ background: q.bg, border: `1px solid ${q.color}22`, borderRadius: 16, padding: 16, overflow: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: q.color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>{label} ({qt.length})</div>
            {qt.map(tk => (
              <div key={tk.id} onClick={() => onEdit(tk)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: 10, cursor: 'pointer', marginBottom: 6, transition: 'background 0.1s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.3)'}>
                <div onClick={e => { e.stopPropagation(); onToggle(tk) }} style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${tk.done ? q.color : 'rgba(255,255,255,0.2)'}`, background: tk.done ? q.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  {tk.done && <span style={{ color: '#fff', fontSize: 8, fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: 12, flex: 1, color: tk.done ? 'var(--text3)' : 'var(--text)', textDecoration: tk.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tk.title}</span>
                {tk.due && <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>{fmt(tk.due)}</span>}
              </div>
            ))}
            {qt.length === 0 && <div style={{ textAlign: 'center', color: q.color, opacity: 0.3, fontSize: 12, paddingTop: 20 }}>{lang === 'hi' ? 'खाली' : 'Empty'}</div>}
          </div>
        )
      })}
    </div>
  )
}

// ─── BULK BAR ─────────────────────────────────────────────────────────────────
function BulkBar({ count, onDone, onDelete, onPriority, onClear, lang }: { count: number; onDone: () => void; onDelete: () => void; onPriority: (p: string) => void; onClear: () => void; lang: string }) {
  return (
    <div className="bulk-bar">
      <span style={{ fontSize: 13, fontWeight: 700 }}>{t(T.bulk.selected, lang as any)(count)}</span>
      <div style={{ width: 1, height: 20, background: 'var(--border2)' }} />
      <button onClick={onDone} style={{ padding: '7px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: 'var(--teal)', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>{t(T.bulk.markDone, lang as any)}</button>
      <select onChange={e => { if (e.target.value) { onPriority(e.target.value); e.target.value = '' } }} defaultValue="" style={{ ...INP, width: 'auto', padding: '6px 10px', fontSize: 12, borderRadius: 8 }}>
        <option value="">{t(T.bulk.setPriority, lang as any)}</option>
        {[{ val: 'urgent', label: t(T.priority.urgent, lang as any) }, { val: 'high', label: t(T.priority.high, lang as any) }, { val: 'medium', label: t(T.priority.medium, lang as any) }, { val: 'low', label: t(T.priority.low, lang as any) }].map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
      </select>
      <button onClick={onDelete} style={{ padding: '7px 14px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, color: 'var(--rose)', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>{t(T.bulk.delete, lang as any)}</button>
      <button onClick={onClear} style={{ padding: '7px 11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>{t(T.bulk.clear, lang as any)}</button>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const qc = useQueryClient()
  const { lang } = useStore()
  const { toasts, toast } = useToast()

  const [showForm, setShowForm]     = useState(false)
  const [editTask, setEditTask]     = useState<Task | null>(null)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState<TaskFilter>('all')
  const [priFilter, setPriFilter]   = useState('all')
  const [projFilter, setProjFilter] = useState('all')
  const [tagFilter, setTagFilter]   = useState('')
  const [sortBy, setSortBy]         = useState('due')
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('asc')
  const [view, setView]             = useState<TaskView>('list')
  const [selected, setSelected]     = useState(new Set<string>())

  const { data: tasks    = [], isLoading } = useQuery<Task[]>({ queryKey: ['tasks'],    queryFn: () => apiFetch('/api/tasks') })
  const { data: projects = [] }            = useQuery<any[]>({ queryKey: ['projects'], queryFn: () => apiFetch('/api/projects') })

  // N = new task keyboard shortcut
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault(); setEditTask(null); setShowForm(true)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const mutCreate = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        // Show full DB error so we can debug
        const msg = json.hint ? `${json.error} — ${json.hint}` : json.error || 'Failed to create task'
        throw new Error(msg)
      }
      return json
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast('✅ Task added!', 'success') },
    onError: (e: any) => { console.error('Task create error:', e.message); toast(`❌ ${e.message}`, 'error') },
  })

  const mutUpdate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.status === 204) return {}
      const json = await res.json()
      if (!res.ok) throw new Error(json.hint ? `${json.error} — ${json.hint}` : json.error || 'Failed to update task')
      return json
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (e: any) => { console.error('Task update error:', e.message); toast(`❌ ${e.message}`, 'error') },
  })

  const mutDelete = useMutation({
    mutationFn: (id: string) => fetch(`/api/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast(t(T.toast.taskDeleted, lang as any)) },
  })

  const handleSave = async (form: FormState) => {
    const data = {
      title:          form.title,
      description:    form.desc || null,
      status:         form.status,
      priority:       form.priority,
      due:            form.due || null,
      due_time:       form.dueTime || null,
      estimated_time: form.estimatedTime ? parseInt(form.estimatedTime) : null,
      points:         form.points ?? 0,
      project_id:     form.projectId || null,
      tags:           form.tags,
      subtasks:       form.subtasks,
      custom_fields:  form.customFields,
      sprint_id:      form.sprintId,
      urgency:        form.urgency,
      importance:     form.importance,
      cover_color:    form.coverColor || null,
      recurring:      (form.recurring && form.recurring !== 'none') ? form.recurring : null,
    }
    if (editTask?.id) { await mutUpdate.mutateAsync({ id: editTask.id, data }); toast(t(T.toast.taskUpdated, lang as any), 'success') }
    else await mutCreate.mutateAsync(data)
  }

  const handleToggle      = (tk: Task) => mutUpdate.mutate({ id: tk.id, data: { done: !tk.done, status: !tk.done ? 'done' : 'todo', completed_at: !tk.done ? new Date().toISOString() : null } })
  const handleDelete      = (id: string) => { if (!window.confirm(t(T.confirm.deleteTask, lang as any))) return; mutDelete.mutate(id); setSelected(s => { const n = new Set(s); n.delete(id); return n }) }
  const handleStatusChange = (tk: Task, status: string) => mutUpdate.mutate({ id: tk.id, data: { status, done: status === 'done' } })

  const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const clearSelect  = () => setSelected(new Set())

  const bulkDone = async () => {
    await Promise.all([...selected].map(id => fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done: true, status: 'done' }) })))
    qc.invalidateQueries({ queryKey: ['tasks'] }); toast(t(T.toast.doneBulk, lang as any)(selected.size), 'success'); clearSelect()
  }
  const bulkDelete = async () => {
    if (!window.confirm(t(T.confirm.deleteBulk, lang as any)(selected.size))) return
    await Promise.all([...selected].map(id => fetch(`/api/tasks/${id}`, { method: 'DELETE' })))
    qc.invalidateQueries({ queryKey: ['tasks'] }); toast(t(T.toast.deletedBulk, lang as any)(selected.size)); clearSelect()
  }
  const bulkPriority = async (p: string) => {
    await Promise.all([...selected].map(id => fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priority: p }) })))
    qc.invalidateQueries({ queryKey: ['tasks'] }); toast(t(T.toast.priorUpdated, lang as any), 'success'); clearSelect()
  }

  const allTags = useMemo(() => [...new Set(tasks.flatMap(tk => tk.tags ?? []))], [tasks])

  let filtered = tasks.filter(tk => {
    const today = todayStr()
    if (filter === 'pending')   return !tk.done
    if (filter === 'completed') return tk.done
    if (filter === 'overdue')   return !tk.done && !!tk.due && tk.due < today
    if (filter === 'today')     return tk.due === today
    if (filter === 'tomorrow')  return tk.due === new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    if (filter === 'no-due')    return !tk.due
    return true
  })
  if (priFilter !== 'all')  filtered = filtered.filter(tk => tk.priority === priFilter)
  if (projFilter !== 'all') filtered = filtered.filter(tk => tk.project_id === projFilter)
  if (tagFilter)            filtered = filtered.filter(tk => (tk.tags ?? []).includes(tagFilter))
  if (search)               filtered = filtered.filter(tk => tk.title?.toLowerCase().includes(search.toLowerCase()) || (tk.tags ?? []).some(tg => tg.includes(search.toLowerCase())))

  filtered = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'due')      cmp = (a.due ?? 'zzzz').localeCompare(b.due ?? 'zzzz')
    if (sortBy === 'priority') cmp = ['urgent','high','medium','low','none'].indexOf(a.priority) - ['urgent','high','medium','low','none'].indexOf(b.priority)
    if (sortBy === 'title')    cmp = (a.title ?? '').localeCompare(b.title ?? '')
    if (sortBy === 'points')   cmp = (b.points ?? 0) - (a.points ?? 0)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const today = todayStr()
  const counts = {
    all: tasks.length, today: tasks.filter(tk => tk.due === today).length,
    pending: tasks.filter(tk => !tk.done).length, completed: tasks.filter(tk => tk.done).length,
    overdue: tasks.filter(tk => !tk.done && !!tk.due && tk.due < today).length,
    'no-due': tasks.filter(tk => !tk.due).length, tomorrow: tasks.filter(tk => tk.due === new Date(Date.now()+86400000).toISOString().slice(0,10)).length,
  }
  const donePct = tasks.length ? Math.round(tasks.filter(tk => tk.done).length / tasks.length * 100) : 0

  const VIEWS: { id: TaskView; icon: string; labelKey: string }[] = [
    { id: 'list',   icon: '☰',  labelKey: 'list' },
    { id: 'kanban', icon: '⬛', labelKey: 'kanban' },
    { id: 'sprint', icon: '🏃', labelKey: 'sprint' },
    { id: 'matrix', icon: '⊞', labelKey: 'matrix' },
  ]

  const FILTERS: { id: TaskFilter; labelKey: string; color: string }[] = [
    { id: 'all',       labelKey: 'all',       color: '#6B7280' },
    { id: 'today',     labelKey: 'today',     color: '#F59E0B' },
    { id: 'pending',   labelKey: 'pending',   color: '#818CF8' },
    { id: 'overdue',   labelKey: 'overdue',   color: '#F43F5E' },
    { id: 'completed', labelKey: 'completed', color: '#10B981' },
    { id: 'no-due',    labelKey: 'noDue',     color: '#4B5563' },
    { id: 'tomorrow',  labelKey: 'tomorrow',  color: '#06B6D4' },
  ]

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--surface3)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
          <input placeholder={t(T.searchTasks, lang as any)} value={search} onChange={e => setSearch(e.target.value)} style={{ ...INP, paddingLeft: 38, height: 42 }} />
        </div>
        <select value={priFilter} onChange={e => setPriFilter(e.target.value)} style={{ ...INP, width: 'auto', padding: '0 12px', height: 42, fontSize: 12 }}>
          <option value="all">{lang === 'hi' ? 'सभी प्राथमिकताएं' : 'All Priorities'}</option>
          {[{val:'urgent'},{val:'high'},{val:'medium'},{val:'low'}].map(o => <option key={o.val} value={o.val}>{t((T.priority as any)[o.val], lang as any)}</option>)}
        </select>
        {projects.length > 0 && (
          <select value={projFilter} onChange={e => setProjFilter(e.target.value)} style={{ ...INP, width: 'auto', padding: '0 12px', height: 42, fontSize: 12 }}>
            <option value="all">{lang === 'hi' ? 'सभी परियोजनाएं' : 'All Projects'}</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.emoji ?? '📁'} {p.name}</option>)}
          </select>
        )}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...INP, width: 'auto', padding: '0 12px', height: 42, fontSize: 12 }}>
          {(['dueDate','priority','title','points'] as const).map(k => <option key={k} value={k === 'dueDate' ? 'due' : k}>{t((T.sort as any)[k] ?? T.sort.dueDate, lang as any)}</option>)}
        </select>
        <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} style={{ padding: '0 12px', height: 42, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>{sortDir === 'asc' ? '↑' : '↓'}</button>
        <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 11, padding: 3, gap: 2, border: '1px solid var(--border)' }}>
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{ padding: '6px 13px', border: 'none', borderRadius: 8, cursor: 'pointer', background: view === v.id ? 'rgba(255,107,53,0.15)' : 'transparent', color: view === v.id ? 'var(--accent)' : 'var(--text3)', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {v.icon} {t((T.views as any)[v.id], lang as any)}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditTask(null); setShowForm(true) }} style={{ padding: '0 22px', height: 42, background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', border: 'none', borderRadius: 11, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(255,107,53,0.3)', whiteSpace: 'nowrap' }}>
          {t(T.newTask, lang as any)}
        </button>
      </div>

      {/* ── QUICK ADD ── */}
      <QuickAdd onAdd={data => mutCreate.mutate(data)} lang={lang} />

      {/* ── FILTER PILLS ── */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const label = t((T.filter as any)[f.labelKey], lang as any)
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '5px 13px', borderTop: `1px solid ${filter === f.id ? f.color : 'var(--border)'}`, borderRight: `1px solid ${filter === f.id ? f.color : 'var(--border)'}`, borderBottom: `1px solid ${filter === f.id ? f.color : 'var(--border)'}`, borderLeft: `1px solid ${filter === f.id ? f.color : 'var(--border)'}`, borderRadius: 20, background: filter === f.id ? `${f.color}14` : 'transparent', color: filter === f.id ? f.color : 'var(--text3)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {label} {(counts as any)[f.id] > 0 && <span style={{ opacity: 0.65 }}>({(counts as any)[f.id]})</span>}
            </button>
          )
        })}
        {allTags.slice(0, 5).map(tag => (
          <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? '' : tag)} style={{ padding: '5px 11px', borderTop: `1px solid ${tagFilter === tag ? 'var(--accent)' : 'var(--border)'}`, borderRight: `1px solid ${tagFilter === tag ? 'var(--accent)' : 'var(--border)'}`, borderBottom: `1px solid ${tagFilter === tag ? 'var(--accent)' : 'var(--border)'}`, borderLeft: `1px solid ${tagFilter === tag ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 20, background: tagFilter === tag ? 'rgba(255,107,53,0.1)' : 'transparent', color: tagFilter === tag ? 'var(--accent)' : 'var(--text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            #{tag}
          </button>
        ))}
      </div>

      {/* ── PROGRESS BAR ── */}
      {tasks.length > 0 && (
        <div style={{ marginBottom: 14, padding: '10px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, whiteSpace: 'nowrap' }}>{t(T.overallProgress, lang as any)}</span>
          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,var(--teal),var(--cyan))', borderRadius: 4, width: `${donePct}%`, transition: 'width 1s ease' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--teal)', flexShrink: 0 }}>{donePct}%</span>
          <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>{tasks.filter(tk => tk.done).length}/{tasks.length}</span>
          {view === 'list' && (
            <button onClick={() => selected.size === filtered.length ? clearSelect() : setSelected(new Set(filtered.map(tk => tk.id)))} style={{ padding: '3px 11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {selected.size === filtered.length ? t(T.deselectAll, lang as any) : t(T.selectAll, lang as any)}
            </button>
          )}
        </div>
      )}

      {/* ── TABLE HEADER ── */}
      {view === 'list' && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '32px 22px 1fr 120px 82px 88px 62px 52px', gap: 8, padding: '6px 16px', marginBottom: 4, fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          <div /><div />
          <div>{lang === 'hi' ? 'कार्य' : 'TASK'}</div>
          <div>{lang === 'hi' ? 'स्थिति' : 'STATUS'}</div>
          <div>{lang === 'hi' ? 'तिथि' : 'DUE'}</div>
          <div>{lang === 'hi' ? 'प्राथमिकता' : 'PRIORITY'}</div>
          <div>{lang === 'hi' ? 'समय' : 'EST'}</div>
          <div />
        </div>
      )}

      {/* ── VIEWS ── */}
      {view === 'list' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{t(T.empty.noTasks, lang as any)}</div>
              <div style={{ fontSize: 13 }}>{search ? t(T.empty.noSearch, lang as any) : t(T.empty.noTasksSub, lang as any)}</div>
            </div>
          )}
          {filtered.map(task => (
            <TaskRow key={task.id} task={task} selected={selected.has(task.id)} lang={lang} onSelect={toggleSelect} onToggle={handleToggle} onEdit={tk => { setEditTask(tk); setShowForm(true) }} onDelete={handleDelete} />
          ))}
        </div>
      )}
      {view === 'kanban' && <KanbanView tasks={filtered} lang={lang} onEdit={tk => { setEditTask(tk); setShowForm(true) }} onStatusChange={handleStatusChange} onToggle={handleToggle} />}
      {view === 'sprint' && <SprintView tasks={filtered} lang={lang} onEdit={tk => { setEditTask(tk); setShowForm(true) }} onToggle={handleToggle} />}
      {view === 'matrix' && <MatrixView tasks={filtered} lang={lang} onEdit={tk => { setEditTask(tk); setShowForm(true) }} onToggle={handleToggle} />}

      {/* ── BULK BAR ── */}
      {selected.size > 0 && <BulkBar count={selected.size} lang={lang} onDone={bulkDone} onDelete={bulkDelete} onPriority={bulkPriority} onClear={clearSelect} />}

      {/* ── FORM MODAL ── */}
      {showForm && <TaskModal initial={editTask} projects={projects} onSave={handleSave} onClose={() => { setShowForm(false); setEditTask(null) }} />}

      <Toasts toasts={toasts} />
    </div>
  )
}
