'use client'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

// ─── SAFE FETCH (always returns []) ───────────────────────────────────────────
const safeArr = (d: unknown): any[] => (Array.isArray(d) ? d : [])
const apiFetch  = (url: string) => fetch(url).then(r => r.json()).then(safeArr)
const apiPost   = (url: string, data: any) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json())
const apiPatch  = (url: string, data: any) => fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json())
const apiDelete = (url: string) => fetch(url, { method: 'DELETE' })

// ─── TOAST ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([])
  const add = useCallback((msg: string, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])
  return { toasts, toast: add }
}

function Toasts({ toasts }: { toasts: { id: number; msg: string; type: string }[] }) {
  if (!toasts.length) return null
  const col: Record<string, string> = { success: 'var(--teal)', error: 'var(--rose)', info: 'var(--indigo)', warning: 'var(--gold)' }
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className="toast" style={{ borderLeft: `3px solid ${col[t.type] ?? col.info}` }}>
          {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'} {t.msg}
        </div>
      ))}
    </div>
  )
}

// ─── TASK FORM MODAL ──────────────────────────────────────────────────────────
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

function TaskModal({ initial, onSave, onClose, projects }: {
  initial?: Task | null; onSave: (f: FormState) => Promise<void>
  onClose: () => void; projects: any[]
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          ...EMPTY,
          title: initial.title ?? '',
          desc: initial.desc ?? '',
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
        }
      : EMPTY
  )
  const [tagInput, setTagInput] = useState('')
  const [stInput, setStInput] = useState('')
  const [tab, setTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  const TABS = [
    { id: 'basic', label: 'Basic' },
    { id: 'details', label: 'Details' },
    { id: 'subtasks', label: `Subtasks (${form.subtasks.length})` },
    { id: 'custom', label: 'Fields' },
  ]

  const coverColors = ['', '#FF6B35', '#F43F5E', '#10B981', '#818CF8', '#F59E0B', '#06B6D4', '#8B5CF6']

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        {/* Header */}
        <div style={{ padding: '18px 22px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 800 }}>
              {initial?.id ? 'Edit Task' : '+ New Task'}
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 22 }}>×</button>
          </div>
          <div style={{ display: 'flex' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '8px 16px', border: 'none',
                borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
                background: 'transparent', color: tab === t.id ? 'var(--accent)' : 'var(--text3)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>

          {/* ── BASIC TAB ── */}
          {tab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Templates */}
              {!initial?.id && (
                <div>
                  <div style={LBL}>Quick Templates</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {TASK_TEMPLATES.map(tpl => (
                      <button key={tpl.label} onClick={() => setForm(f => ({ ...f, ...tpl, estimatedTime: tpl.estimatedTime?.toString() ?? '', tags: tpl.tags ?? [], title: f.title || tpl.label.split(' ').slice(1).join(' ') }))}
                        style={{ padding: '4px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label style={LBL}>Title *</label>
                <input value={form.title ?? ""} onChange={e => set('title', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder="What needs to be done?" autoFocus style={{ ...INP, fontSize: 15, fontWeight: 600 }} />
              </div>
              <div>
                <label style={LBL}>Description</label>
                <textarea value={form.desc ?? ""} onChange={e => set('desc', e.target.value)} placeholder="Add details, steps, notes..." rows={3} style={{ ...INP, resize: 'vertical', lineHeight: 1.6 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>Priority</label>
                  <select value={form.priority ?? ""} onChange={e => set('priority', e.target.value)} style={INP}>
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                    <option value="none">⚪ None</option>
                  </select>
                </div>
                <div>
                  <label style={LBL}>Status</label>
                  <select value={form.status ?? ""} onChange={e => set('status', e.target.value)} style={INP}>
                    {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>Due Date</label>
                  <input type="date" value={form.due ?? ""} onChange={e => set('due', e.target.value)} style={{ ...INP, colorScheme: 'dark' as any }} />
                </div>
                <div>
                  <label style={LBL}>Due Time</label>
                  <input type="time" value={form.dueTime ?? ""} onChange={e => set('dueTime', e.target.value)} style={{ ...INP, colorScheme: 'dark' as any }} />
                </div>
              </div>
              {projects.length > 0 && (
                <div>
                  <label style={LBL}>Project</label>
                  <select value={form.projectId ?? ""} onChange={e => set('projectId', e.target.value)} style={INP}>
                    <option value="">No project</option>
                    {projects.map((p: any) => <option key={p.id} value={p.id}>{p.emoji ?? '📁'} {p.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={LBL}>Tags</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {form.tags.map(tag => (
                    <span key={tag} style={{ padding: '3px 10px', background: 'rgba(255,107,53,0.12)', color: 'var(--accent)', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      #{tag}
                      <span onClick={() => set('tags', form.tags.filter(t => t !== tag))} style={{ cursor: 'pointer', opacity: 0.6 }}>×</span>
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
                  placeholder="Add tag + Enter" style={INP} />
              </div>
            </div>
          )}

          {/* ── DETAILS TAB ── */}
          {tab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>Est. Time (min)</label>
                  <input type="number" value={form.estimatedTime ?? ""} onChange={e => set('estimatedTime', e.target.value)} placeholder="e.g. 60" style={INP} />
                </div>
                <div>
                  <label style={LBL}>Story Points</label>
                  <select value={form.points ?? 0} onChange={e => set('points', parseInt(e.target.value) || 0)} style={INP}>
                    {[0, 1, 2, 3, 5, 8, 13, 21].map(p => <option key={p} value={p}>{p === 0 ? 'No points' : `${p} pts`}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>Urgency</label>
                  <select value={form.urgency ?? ""} onChange={e => set('urgency', e.target.value)} style={INP}>
                    <option value="urgent">🔥 Urgent</option>
                    <option value="not-urgent">🕐 Not Urgent</option>
                  </select>
                </div>
                <div>
                  <label style={LBL}>Importance</label>
                  <select value={form.importance ?? ""} onChange={e => set('importance', e.target.value)} style={INP}>
                    <option value="important">⭐ Important</option>
                    <option value="not-important">• Not Important</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>Recurring</label>
                  <select value={form.recurring ?? ""} onChange={e => set('recurring', e.target.value)} style={INP}>
                    <option value="none">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label style={LBL}>Sprint</label>
                  <select value={form.sprintId ?? ""} onChange={e => set('sprintId', e.target.value)} style={INP}>
                    <option value="backlog">📦 Backlog</option>
                    <option value="sprint-1">🏃 Sprint 1</option>
                    <option value="sprint-2">🏃 Sprint 2</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={LBL}>Cover Color</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {coverColors.map(c => (
                    <div key={c || 'none'} onClick={() => set('coverColor', c)}
                      style={{ width: 24, height: 24, borderRadius: 6, background: c || 'rgba(255,255,255,0.08)', cursor: 'pointer', outline: form.coverColor === c ? '2px solid #fff' : 'none' }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SUBTASKS TAB ── */}
          {tab === 'subtasks' && (
            <div>
              <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
                <input value={stInput} onChange={e => setStInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && stInput.trim()) {
                      set('subtasks', [...form.subtasks, { id: uid(), title: stInput.trim(), done: false }])
                      setStInput('')
                    }
                  }}
                  placeholder="Add subtask + Enter" style={{ ...INP, flex: 1 }} />
                <button onClick={() => { if (stInput.trim()) { set('subtasks', [...form.subtasks, { id: uid(), title: stInput.trim(), done: false }]); setStInput('') } }}
                  style={{ padding: '9px 16px', background: 'var(--accent)', border: 'none', borderRadius: 9, color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>+</button>
              </div>
              {form.subtasks.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '24px 0', fontSize: 13 }}>No subtasks yet</div>}
              {form.subtasks.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, marginBottom: 6 }}>
                  <input type="checkbox" checked={s.done} onChange={() => set('subtasks', form.subtasks.map(st => st.id === s.id ? { ...st, done: !st.done } : st))} style={{ accentColor: 'var(--accent)', width: 15, height: 15, cursor: 'pointer' }} />
                  <span style={{ flex: 1, fontSize: 13, color: s.done ? 'var(--text3)' : 'var(--text)', textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</span>
                  <button onClick={() => set('subtasks', form.subtasks.filter(st => st.id !== s.id))} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--rose)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>×</button>
                </div>
              ))}
              {form.subtasks.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>Progress</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)' }}>{Math.round(form.subtasks.filter(s => s.done).length / form.subtasks.length * 100)}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--teal)', borderRadius: 4, width: `${Math.round(form.subtasks.filter(s => s.done).length / form.subtasks.length * 100)}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CUSTOM FIELDS TAB ── */}
          {tab === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{ key: 'url', label: 'URL / Link', ph: 'https://...' }, { key: 'phone', label: 'Phone', ph: '+91 XXXXX XXXXX' }, { key: 'location', label: 'Location', ph: 'City, Country' }, { key: 'version', label: 'Version', ph: 'v1.0.0' }].map(f => (
                <div key={f.key}>
                  <label style={LBL}>{f.label}</label>
                  <input value={form.customFields[f.key] ?? ''} onChange={e => set('customFields', { ...form.customFields, [f.key]: e.target.value })} placeholder={f.ph} style={INP} />
                </div>
              ))}
              <div>
                <label style={LBL}>Custom Note</label>
                <textarea value={form.customFields['note'] ?? ''} onChange={e => set('customFields', { ...form.customFields, note: e.target.value })} rows={3} placeholder="Any additional info..." style={{ ...INP, resize: 'vertical' }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{ padding: '9px 24px', background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving || !form.title.trim() ? 0.6 : 1, boxShadow: '0 4px 16px rgba(255,107,53,0.3)' }}>
            {saving ? 'Saving...' : initial?.id ? 'Update Task' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── QUICK ADD (AI NLP) ───────────────────────────────────────────────────────
function QuickAdd({ onAdd }: { onAdd: (data: any) => void }) {
  const [val, setVal] = useState('')
  const [parsing, setParsing] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const parse = useCallback(async (text: string) => {
    if (text.length < 4) { setPreview(null); return }
    const hasHints = /\b(kal|aaj|subah|shaam|tomorrow|today|pm|am|urgent|high|monday|tuesday|wednesday|thursday|friday)\b/i.test(text)
    if (!hasHints) { setPreview(null); return }
    setParsing(true)
    try {
      const res = await fetch('/api/ai/parse-task', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input: text }) })
      if (res.ok) setPreview(await res.json())
    } catch { /* silent */ }
    setParsing(false)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVal(e.target.value)
    setPreview(null)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => parse(e.target.value), 700)
  }

  const submit = async () => {
    if (!val.trim() || saving) return
    setSaving(true)
    const data = preview
      ? { title: preview.title || val.trim(), due: preview.due || null, dueTime: preview.dueTime || null, priority: preview.priority ?? 'none', tags: preview.tags ?? [] }
      : { title: val.trim(), priority: 'none', tags: [] }
    onAdd(data)
    setVal(''); setPreview(null); setSaving(false)
  }

  return (
    <div style={{ position: 'relative', marginBottom: 14 }}>
      {preview && (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow)' }}>
          <span style={{ fontSize: 14 }}>✨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>AI parsed →</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{preview.title}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
              {preview.due && <span style={{ fontSize: 11, padding: '1px 8px', background: 'rgba(255,107,53,0.1)', color: 'var(--accent)', borderRadius: 20 }}>📅 {preview.due}</span>}
              {preview.priority && preview.priority !== 'none' && <span style={{ fontSize: 11, padding: '1px 8px', background: PRI_BG[preview.priority] ?? '', color: PRI_COLOR[preview.priority] ?? '', borderRadius: 20 }}>⚡ {preview.priority}</span>}
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' }}>{parsing ? '🤖' : '+'}</span>
          <input value={val} onChange={handleChange} onKeyDown={e => e.key === 'Enter' && submit()} placeholder='Quick add... (try "kal urgent meeting 9am")' style={{ ...INP, paddingLeft: 36 }} />
        </div>
        {val && <button onClick={submit} disabled={saving} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', border: 'none', borderRadius: 9, color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{saving ? '...' : '+ Add'}</button>}
      </div>
    </div>
  )
}

// ─── TASK ROW (list view) ─────────────────────────────────────────────────────
function TaskRow({ task, selected, onSelect, onToggle, onEdit, onDelete }: {
  task: Task; selected: boolean
  onSelect: (id: string) => void; onToggle: (t: Task) => void
  onEdit: (t: Task) => void; onDelete: (id: string) => void
}) {
  const [hov, setHov] = useState(false)
  const today = todayStr()
  const isOverdue = !task.done && !!task.due && task.due < today
  const isToday   = task.due === today
  const status    = STATUSES.find(s => s.id === task.status) ?? STATUSES[0]
  const stDone    = (task.subtasks ?? []).filter(s => s.done).length
  const stTotal   = (task.subtasks ?? []).length

  const rowBg    = selected ? 'rgba(255,107,53,0.05)' : hov ? 'rgba(255,255,255,0.02)' : 'transparent'
  const borderLft = `2px solid ${selected ? 'var(--accent)' : 'transparent'}`

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '32px 20px 1fr 110px 80px 80px 60px 48px', gap: 8, alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', background: rowBg, borderLeft: borderLft, transition: 'background 0.1s' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      <input type="checkbox" checked={selected} onChange={() => onSelect(task.id)} style={{ accentColor: 'var(--accent)', width: 14, height: 14, cursor: 'pointer' }} />
      <div onClick={() => onToggle(task)} style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${task.done ? 'var(--teal)' : 'rgba(255,255,255,0.2)'}`, background: task.done ? 'var(--teal)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
        {task.done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>}
      </div>
      <div onClick={() => onEdit(task)} style={{ cursor: 'pointer', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {task.coverColor && <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.coverColor, flexShrink: 0 }} />}
          <span style={{ fontSize: 13, fontWeight: 600, color: task.done ? 'var(--text3)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
          {(task.points ?? 0) > 0 && <span style={{ fontSize: 9, padding: '1px 5px', background: 'rgba(129,140,248,0.15)', color: 'var(--indigo)', borderRadius: 10, fontWeight: 800, flexShrink: 0 }}>{task.points}pt</span>}
          {task.recurring && task.recurring !== 'none' && <span style={{ fontSize: 9, color: 'var(--text3)' }}>🔄</span>}
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
          {(task.tags ?? []).slice(0, 3).map(tag => <span key={tag} style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(255,107,53,0.08)', color: 'var(--accent2)', borderRadius: 10 }}>#{tag}</span>)}
          {stTotal > 0 && <span style={{ fontSize: 10, color: 'var(--text3)' }}>☐ {stDone}/{stTotal}</span>}
        </div>
      </div>
      <span style={{ fontSize: 10, padding: '3px 8px', background: `${status.color}18`, color: status.color, borderRadius: 20, fontWeight: 700, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{status.label}</span>
      <span style={{ fontSize: 11, color: isOverdue ? 'var(--rose)' : isToday ? 'var(--gold)' : 'var(--text3)', fontWeight: isOverdue || isToday ? 700 : 400 }}>{task.due ? fmt(task.due) : '—'}</span>
      <span style={{ fontSize: 10, padding: '2px 8px', background: PRI_BG[task.priority] ?? 'rgba(107,114,128,0.1)', color: PRI_COLOR[task.priority] ?? 'var(--text3)', borderRadius: 20, fontWeight: 700, textAlign: 'center' }}>{task.priority}</span>
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{task.estimatedTime ? `${task.estimatedTime}m` : '—'}</span>
      <div style={{ display: 'flex', gap: 3, opacity: hov ? 1 : 0, transition: 'opacity 0.1s' }}>
        <button onClick={() => onEdit(task)} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12, padding: 2, borderRadius: 4 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--indigo)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>✏️</button>
        <button onClick={() => onDelete(task.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12, padding: 2, borderRadius: 4 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--rose)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>🗑</button>
      </div>
    </div>
  )
}

// ─── KANBAN VIEW ──────────────────────────────────────────────────────────────
function KanbanView({ tasks, onEdit, onStatusChange, onToggle }: {
  tasks: Task[]; onEdit: (t: Task) => void
  onStatusChange: (t: Task, s: string) => void; onToggle: (t: Task) => void
}) {
  const [dragging, setDragging] = useState<Task | null>(null)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STATUSES.length},1fr)`, gap: 12, alignItems: 'start' }}>
      {STATUSES.map(status => {
        const cols = tasks.filter(t => t.status === status.id || (status.id === 'todo' && !t.status))
        return (
          <div key={status.id} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (dragging) onStatusChange(dragging, status.id) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: status.color }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{status.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, background: 'rgba(255,255,255,0.06)', color: 'var(--text3)', borderRadius: 20, padding: '1px 7px', fontWeight: 700 }}>{cols.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 60 }}>
              {cols.map(task => {
                const stDone = (task.subtasks ?? []).filter(s => s.done).length
                const stTotal = (task.subtasks ?? []).length
                const cardStyle: React.CSSProperties = {
                  background: 'var(--surface2)',
                  borderTop: `1px solid var(--border)`,
                  borderRight: `1px solid var(--border)`,
                  borderBottom: `1px solid var(--border)`,
                  borderLeft: `3px solid ${PRI_COLOR[task.priority] ?? '#6B7280'}`,
                  borderRadius: 11,
                  padding: '11px 13px',
                  cursor: 'pointer',
                  opacity: dragging?.id === task.id ? 0.4 : 1,
                }
                return (
                  <div key={task.id} draggable onDragStart={() => setDragging(task)} onDragEnd={() => setDragging(null)} onClick={() => onEdit(task)} style={cardStyle}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface3)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface2)' }}>
                    {task.coverColor && (
                      <div style={{ height: 3, background: task.coverColor, margin: '-11px -13px 8px -13px', borderRadius: '9px 9px 0 0' }} />
                    )}
                    <div style={{ fontSize: 13, fontWeight: 600, color: task.done ? 'var(--text3)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', marginBottom: 8, lineHeight: 1.4 }}>{task.title}</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: stTotal ? 8 : 0 }}>
                      {(task.tags ?? []).slice(0, 2).map(tag => <span key={tag} style={{ fontSize: 10, padding: '1px 7px', background: 'rgba(255,107,53,0.08)', color: 'var(--accent2)', borderRadius: 10 }}>#{tag}</span>)}
                      {(task.points ?? 0) > 0 && <span style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(129,140,248,0.12)', color: 'var(--indigo)', borderRadius: 10, fontWeight: 700 }}>{task.points}pt</span>}
                    </div>
                    {stTotal > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: 'var(--text3)' }}>Subtasks</span>
                          <span style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 700 }}>{stDone}/{stTotal}</span>
                        </div>
                        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'var(--teal)', borderRadius: 3, width: `${stTotal ? Math.round(stDone / stTotal * 100) : 0}%` }} />
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: task.due && task.due < todayStr() ? 'var(--rose)' : task.due === todayStr() ? 'var(--gold)' : 'var(--text3)' }}>{task.due ? fmt(task.due) : 'No due'}</span>
                      <div onClick={e => { e.stopPropagation(); onToggle(task) }} style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${task.done ? 'var(--teal)' : 'rgba(255,255,255,0.2)'}`, background: task.done ? 'var(--teal)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        {task.done && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>✓</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
              {cols.length === 0 && <div style={{ height: 60, border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 12 }}>Drop here</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── SPRINT VIEW ──────────────────────────────────────────────────────────────
function SprintView({ tasks, onEdit, onToggle }: { tasks: Task[]; onEdit: (t: Task) => void; onToggle: (t: Task) => void }) {
  const sprints = [{ id: 'backlog', label: '📦 Backlog', color: '#6B7280' }, { id: 'sprint-1', label: '🏃 Sprint 1', color: '#FF6B35' }, { id: 'sprint-2', label: '🏃 Sprint 2', color: '#818CF8' }]
  const [open, setOpen] = useState<Record<string, boolean>>({ backlog: true, 'sprint-1': true, 'sprint-2': false })
  const pts = (arr: Task[]) => arr.reduce((s, t) => s + (t.points ?? 0), 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sprints.map(sprint => {
        const st = sprint.id === 'backlog' ? tasks.filter(t => !t.sprintId || t.sprintId === 'backlog') : tasks.filter(t => t.sprintId === sprint.id)
        const done = st.filter(t => t.done); const tp = pts(st); const dp = pts(done)
        return (
          <div key={sprint.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div onClick={() => setOpen(o => ({ ...o, [sprint.id]: !o[sprint.id] }))} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}>
              <span style={{ fontSize: 12, color: 'var(--text3)', transform: open[sprint.id] ? 'rotate(90deg)' : 'none', display: 'inline-block' }}>▶</span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: sprint.color }} />
              <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 800, flex: 1 }}>{sprint.label}</span>
              <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text3)' }}>
                <span>{st.length} tasks</span>
                {tp > 0 && <span style={{ color: 'var(--indigo)', fontWeight: 700 }}>{dp}/{tp} pts</span>}
              </div>
            </div>
            {open[sprint.id] && (
              <div>
                {st.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>No tasks</div>}
                {st.map(task => (
                  <div key={task.id} onClick={() => onEdit(task)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderTop: '1px solid var(--border)', cursor: 'pointer' }} onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)')} onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '')}>
                    <div onClick={e => { e.stopPropagation(); onToggle(task) }} style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${task.done ? 'var(--teal)' : 'rgba(255,255,255,0.2)'}`, background: task.done ? 'var(--teal)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      {task.done && <span style={{ color: '#fff', fontSize: 8, fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, flex: 1, color: task.done ? 'var(--text3)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                    {(task.points ?? 0) > 0 && <span style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(129,140,248,0.12)', color: 'var(--indigo)', borderRadius: 10, fontWeight: 700, flexShrink: 0 }}>{task.points}pt</span>}
                    <span style={{ fontSize: 10, padding: '2px 7px', background: PRI_BG[task.priority] ?? '', color: PRI_COLOR[task.priority] ?? '', borderRadius: 12, fontWeight: 700, flexShrink: 0 }}>{task.priority}</span>
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

// ─── MATRIX VIEW ─────────────────────────────────────────────────────────────
function MatrixView({ tasks, onEdit, onToggle }: { tasks: Task[]; onEdit: (t: Task) => void; onToggle: (t: Task) => void }) {
  const Q = [
    { u: 'urgent',     i: 'important',     label: 'DO FIRST 🔥',   color: '#F43F5E', bg: 'rgba(244,63,94,0.06)' },
    { u: 'not-urgent', i: 'important',     label: 'SCHEDULE 📅',   color: '#818CF8', bg: 'rgba(129,140,248,0.06)' },
    { u: 'urgent',     i: 'not-important', label: 'DELEGATE 👥',   color: '#F59E0B', bg: 'rgba(245,158,11,0.06)' },
    { u: 'not-urgent', i: 'not-important', label: 'ELIMINATE 🗑',  color: '#6B7280', bg: 'rgba(107,114,128,0.06)' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, height: 480 }}>
      {Q.map(q => {
        const qt = tasks.filter(t => (t.urgency ?? 'not-urgent') === q.u && (t.importance ?? 'important') === q.i)
        return (
          <div key={q.label} style={{ background: q.bg, border: `1px solid ${q.color}22`, borderRadius: 14, padding: 14, overflow: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: q.color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>{q.label} ({qt.length})</div>
            {qt.map(t => (
              <div key={t.id} onClick={() => onEdit(t)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: 9, cursor: 'pointer', marginBottom: 6 }} onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')} onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.3)')}>
                <div onClick={e => { e.stopPropagation(); onToggle(t) }} style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${t.done ? q.color : 'rgba(255,255,255,0.2)'}`, background: t.done ? q.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  {t.done && <span style={{ color: '#fff', fontSize: 8, fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: 12, flex: 1, color: t.done ? 'var(--text3)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                {t.due && <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>{fmt(t.due)}</span>}
              </div>
            ))}
            {qt.length === 0 && <div style={{ textAlign: 'center', color: q.color, opacity: 0.3, fontSize: 12, padding: '12px 0' }}>Empty</div>}
          </div>
        )
      })}
    </div>
  )
}

// ─── BULK BAR ─────────────────────────────────────────────────────────────────
function BulkBar({ count, onDone, onDelete, onPriority, onClear }: { count: number; onDone: () => void; onDelete: () => void; onPriority: (p: string) => void; onClear: () => void }) {
  return (
    <div className="bulk-bar">
      <span style={{ fontSize: 13, fontWeight: 700 }}>{count} selected</span>
      <div style={{ width: 1, height: 20, background: 'var(--border2)' }} />
      <button onClick={onDone} style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: 'var(--teal)', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>✓ Done</button>
      <select onChange={e => { if (e.target.value) { onPriority(e.target.value); e.target.value = '' } }} defaultValue="" style={{ ...INP, width: 'auto', padding: '6px 10px', fontSize: 12, borderRadius: 8 }}>
        <option value="">Set Priority...</option>
        <option value="urgent">🔴 Urgent</option><option value="high">🟠 High</option>
        <option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
      </select>
      <button onClick={onDelete} style={{ padding: '6px 12px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, color: 'var(--rose)', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>🗑 Delete</button>
      <button onClick={onClear} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✕</button>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const qc = useQueryClient()
  const { toasts, toast } = useToast()
  const [showForm, setShowForm]   = useState(false)
  const [editTask, setEditTask]   = useState<Task | null>(null)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState<TaskFilter>('all')
  const [priFilter, setPriFilter] = useState('all')
  const [projFilter, setProjFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [sortBy, setSortBy]       = useState('due')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc')
  const [view, setView]           = useState<TaskView>('list')
  const [selected, setSelected]   = useState(new Set<string>())

  const { data: tasks = [], isLoading } = useQuery<Task[]>({ queryKey: ['tasks'],    queryFn: () => apiFetch('/api/tasks') })
  const { data: projects = [] }         = useQuery<any[]>({ queryKey: ['projects'], queryFn: () => apiFetch('/api/projects') })

  // Keyboard: N = new task
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
    mutationFn: (data: any) => apiPost('/api/tasks', data),
    onSuccess: async () => { 
      await qc.invalidateQueries({ queryKey: ['tasks'] })
      toast('Task added! 🎉', 'success') 
    },
    onError: (err: any) => toast(err?.message || 'Failed to create task', 'error'),
  })
  const mutUpdate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiPatch(`/api/tasks/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
  const mutDelete = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/tasks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast('Deleted!') },
  })

  const handleSave = async (form: FormState) => {
    const data = {
      title: form.title,
      desc: form.desc || null,
      status: form.status,
      priority: form.priority,
      due: form.due || null,
      dueTime: form.dueTime || null,
      estimatedTime: form.estimatedTime ? parseInt(form.estimatedTime) : null,
      points: form.points,
      project_id: form.projectId || null,
      tags: form.tags,
      subtasks: form.subtasks,
      customFields: form.customFields,
      sprintId: form.sprintId,
      urgency: form.urgency,
      importance: form.importance,
      coverColor: form.coverColor || null,
      recurring: form.recurring !== 'none' ? form.recurring : null,
    }
    if (editTask?.id) {
      await mutUpdate.mutateAsync({ id: editTask.id, data })
      toast('Updated! ✅')
      setShowForm(false)
      setEditTask(null)
    } else {
      try {
        await mutCreate.mutateAsync(data)
        setShowForm(false)
        setEditTask(null)
      } catch (err: any) {
        console.error('Create task error:', err)
        toast('Failed: ' + (err?.message || 'Unknown error'), 'error')
      }
    }
  }

  const handleToggle = (t: Task) => mutUpdate.mutate({ id: t.id, data: { done: !t.done, status: !t.done ? 'done' : 'todo', completedAt: !t.done ? new Date().toISOString() : null } })
  const handleDelete = (id: string) => { if (!window.confirm('Delete this task?')) return; mutDelete.mutate(id); setSelected(s => { const n = new Set(s); n.delete(id); return n }) }
  const handleStatusChange = (t: Task, status: string) => mutUpdate.mutate({ id: t.id, data: { status, done: status === 'done' } })

  const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const clearSelect  = () => setSelected(new Set())

  const bulkDone = async () => {
    await Promise.all([...selected].map(id => apiPatch(`/api/tasks/${id}`, { done: true, status: 'done' })))
    qc.invalidateQueries({ queryKey: ['tasks'] }); toast(`✅ ${selected.size} done!`, 'success'); clearSelect()
  }
  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} tasks?`)) return
    await Promise.all([...selected].map(id => apiDelete(`/api/tasks/${id}`)))
    qc.invalidateQueries({ queryKey: ['tasks'] }); toast(`🗑 ${selected.size} deleted!`); clearSelect()
  }
  const bulkPriority = async (p: string) => {
    await Promise.all([...selected].map(id => apiPatch(`/api/tasks/${id}`, { priority: p })))
    qc.invalidateQueries({ queryKey: ['tasks'] }); toast('Priority updated!', 'success'); clearSelect()
  }

  const allTags = useMemo(() => [...new Set(tasks.flatMap(t => t.tags ?? []))], [tasks])

  let filtered = tasks.filter(t => {
    const today = todayStr()
    if (filter === 'pending')   return !t.done
    if (filter === 'completed') return t.done
    if (filter === 'overdue')   return !t.done && !!t.due && t.due < today
    if (filter === 'today')     return t.due === today
    if (filter === 'tomorrow')  return t.due === new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    if (filter === 'no-due')    return !t.due
    return true
  })
  if (priFilter !== 'all')  filtered = filtered.filter(t => t.priority === priFilter)
  if (projFilter !== 'all') filtered = filtered.filter(t => t.project_id === projFilter)
  if (tagFilter)            filtered = filtered.filter(t => (t.tags ?? []).includes(tagFilter))
  if (search)               filtered = filtered.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()) || (t.tags ?? []).some(tg => tg.includes(search.toLowerCase())))

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
    all: tasks.length, today: tasks.filter(t => t.due === today).length,
    pending: tasks.filter(t => !t.done).length, completed: tasks.filter(t => t.done).length,
    overdue: tasks.filter(t => !t.done && !!t.due && t.due < today).length,
    'no-due': tasks.filter(t => !t.due).length, tomorrow: tasks.filter(t => t.due === new Date(Date.now()+86400000).toISOString().slice(0,10)).length,
  }
  const donePct = tasks.length ? Math.round(tasks.filter(t => t.done).length / tasks.length * 100) : 0

  const VIEWS: { id: TaskView; icon: string; label: string }[] = [
    { id: 'list', icon: '☰', label: 'List' }, { id: 'kanban', icon: '⬛', label: 'Board' },
    { id: 'sprint', icon: '🏃', label: 'Sprint' }, { id: 'matrix', icon: '⊞', label: 'Matrix' },
  ]

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--surface3)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
          <input placeholder="Search tasks... (press N for new)" value={search} onChange={e => setSearch(e.target.value)} style={{ ...INP, paddingLeft: 36 }} />
        </div>
        <select value={priFilter} onChange={e => setPriFilter(e.target.value)} style={{ ...INP, width: 'auto', padding: '9px 12px', fontSize: 12 }}>
          <option value="all">All Priorities</option>
          <option value="urgent">🔴 Urgent</option><option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
        </select>
        {projects.length > 0 && (
          <select value={projFilter} onChange={e => setProjFilter(e.target.value)} style={{ ...INP, width: 'auto', padding: '9px 12px', fontSize: 12 }}>
            <option value="all">All Projects</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.emoji ?? '📁'} {p.name}</option>)}
          </select>
        )}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...INP, width: 'auto', padding: '9px 12px', fontSize: 12 }}>
          <option value="due">Due Date</option><option value="priority">Priority</option>
          <option value="title">Title</option><option value="points">Points</option>
        </select>
        <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} style={{ padding: '9px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }}>
          {sortDir === 'asc' ? '↑' : '↓'}
        </button>
        <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 10, padding: 3, gap: 2, border: '1px solid var(--border)' }}>
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{ padding: '6px 12px', border: 'none', borderRadius: 7, cursor: 'pointer', background: view === v.id ? 'rgba(255,107,53,0.15)' : 'transparent', color: view === v.id ? 'var(--accent)' : 'var(--text3)', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditTask(null); setShowForm(true) }} style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(255,107,53,0.25)', whiteSpace: 'nowrap' }}>
          + New Task
        </button>
      </div>

      {/* ── QUICK ADD ── */}
      <QuickAdd onAdd={data => mutCreate.mutate(data)} />

      {/* ── FILTER PILLS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {([
          { id: 'all', label: 'All', color: '#6B7280' },
          { id: 'today', label: '⏰ Today', color: '#F59E0B' },
          { id: 'pending', label: '⏳ Pending', color: '#818CF8' },
          { id: 'overdue', label: '⚠️ Overdue', color: '#F43F5E' },
          { id: 'completed', label: '✅ Done', color: '#10B981' },
          { id: 'no-due', label: '📭 No Due', color: '#4B5563' },
          { id: 'tomorrow', label: '🔜 Tomorrow', color: '#06B6D4' },
        ] as { id: TaskFilter; label: string; color: string }[]).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '5px 12px', borderTop: `1px solid ${filter === f.id ? f.color : 'var(--border)'}`, borderRight: `1px solid ${filter === f.id ? f.color : 'var(--border)'}`, borderBottom: `1px solid ${filter === f.id ? f.color : 'var(--border)'}`, borderLeft: `1px solid ${filter === f.id ? f.color : 'var(--border)'}`, borderRadius: 20, background: filter === f.id ? `${f.color}14` : 'transparent', color: filter === f.id ? f.color : 'var(--text3)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {f.label} {counts[f.id] > 0 && <span style={{ opacity: 0.7 }}>({counts[f.id]})</span>}
          </button>
        ))}
        {allTags.slice(0, 5).map(tag => (
          <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? '' : tag)} style={{ padding: '5px 10px', borderTop: `1px solid ${tagFilter === tag ? 'var(--accent)' : 'var(--border)'}`, borderRight: `1px solid ${tagFilter === tag ? 'var(--accent)' : 'var(--border)'}`, borderBottom: `1px solid ${tagFilter === tag ? 'var(--accent)' : 'var(--border)'}`, borderLeft: `1px solid ${tagFilter === tag ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 20, background: tagFilter === tag ? 'rgba(255,107,53,0.1)' : 'transparent', color: tagFilter === tag ? 'var(--accent)' : 'var(--text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            #{tag}
          </button>
        ))}
      </div>

      {/* ── PROGRESS BAR ── */}
      {tasks.length > 0 && (
        <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>Overall Progress</span>
          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,var(--teal),var(--cyan))', borderRadius: 4, width: `${donePct}%`, transition: 'width 1s ease' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--teal)' }}>{donePct}%</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{tasks.filter(t => t.done).length}/{tasks.length}</span>
          {view === 'list' && (
            <button onClick={() => selected.size === filtered.length ? clearSelect() : setSelected(new Set(filtered.map(t => t.id)))} style={{ padding: '3px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              {selected.size === filtered.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
      )}

      {/* ── TABLE HEADER ── */}
      {view === 'list' && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '32px 20px 1fr 110px 80px 80px 60px 48px', gap: 8, padding: '6px 14px', marginBottom: 4, fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          <div /><div /><div>TASK</div><div>STATUS</div><div>DUE</div><div>PRIORITY</div><div>EST</div><div />
        </div>
      )}

      {/* ── VIEWS ── */}
      {view === 'list' && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14 }}>No tasks found</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{search ? 'Try a different search' : 'Add your first task!'}</div>
            </div>
          )}
          {filtered.map(task => (
            <TaskRow key={task.id} task={task} selected={selected.has(task.id)} onSelect={toggleSelect} onToggle={handleToggle} onEdit={t => { setEditTask(t); setShowForm(true) }} onDelete={handleDelete} />
          ))}
        </div>
      )}
      {view === 'kanban' && <KanbanView tasks={filtered} onEdit={t => { setEditTask(t); setShowForm(true) }} onStatusChange={handleStatusChange} onToggle={handleToggle} />}
      {view === 'sprint' && <SprintView tasks={filtered} onEdit={t => { setEditTask(t); setShowForm(true) }} onToggle={handleToggle} />}
      {view === 'matrix' && <MatrixView tasks={filtered} onEdit={t => { setEditTask(t); setShowForm(true) }} onToggle={handleToggle} />}

      {/* ── BULK BAR ── */}
      {selected.size > 0 && <BulkBar count={selected.size} onDone={bulkDone} onDelete={bulkDelete} onPriority={bulkPriority} onClear={clearSelect} />}

      {/* ── FORM MODAL ── */}
      {showForm && <TaskModal initial={editTask} projects={projects} onSave={handleSave} onClose={() => { setShowForm(false); setEditTask(null) }} />}

      <Toasts toasts={toasts} />
    </div>
  )
}
