'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/callback` } })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true); setLoading(false)
  }

  if (success) return (
    <div style={{ textAlign: 'center', maxWidth: 380 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>Email check karo!</div>
      <div style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.6 }}>Humne <strong style={{ color: 'var(--text)' }}>{email}</strong> pe ek confirmation link bheja hai. Click karke account activate karo.</div>
      <Link href="/login" style={{ display: 'inline-block', marginTop: 20, color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>← Login pe wapas jao</Link>
    </div>
  )

  return (
    <div style={{ width: '100%', maxWidth: 380 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', marginBottom: 12 }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-head)' }}>K</span>
        </div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>Account banao</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Free forever. No credit card needed.</div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 20, padding: 24, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[{ label: 'Aapka naam', type: 'text', val: name, set: setName, ph: 'Kartar Singh', req: true }, { label: 'Email', type: 'email', val: email, set: setEmail, ph: 'aap@example.com', req: true }, { label: 'Password', type: 'password', val: password, set: setPassword, ph: 'Min 8 characters', req: true }].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
              <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} required={f.req} minLength={f.type === 'password' ? 8 : undefined} style={inp} />
            </div>
          ))}
          {error && <div style={{ fontSize: 12, color: 'var(--rose)', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 8, padding: '8px 12px' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px 20px', background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(255,107,53,0.3)', marginTop: 4 }}>
            {loading ? 'Creating...' : 'Account Banao 🚀'}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text3)' }}>
        Already account hai?{' '}
        <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>Sign in</Link>
      </p>
    </div>
  )
}
