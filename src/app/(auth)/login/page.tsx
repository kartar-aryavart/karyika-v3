'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { t, T, LANG_LABELS, type Lang } from '@/lib/i18n'

const INP: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'var(--surface2)', border: '1px solid var(--border2)',
  borderRadius: 11, color: 'var(--text)', fontSize: 14,
  fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
}

function LangBar({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const langs: Lang[] = ['en', 'hi', 'hinglish']
  const icons: Record<Lang, string> = { en: '🇬🇧', hi: '🇮🇳', hinglish: '🔀' }
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
      {langs.map(l => (
        <button key={l} onClick={() => setLang(l)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', border: `1px solid ${lang === l ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 20, background: lang === l ? 'rgba(255,107,53,0.1)' : 'transparent', color: lang === l ? 'var(--accent)' : 'var(--text3)', cursor: 'pointer', fontSize: 12, fontWeight: lang === l ? 700 : 400, fontFamily: 'inherit', transition: 'all 0.15s' }}>
          <span style={{ fontSize: 14 }}>{icons[l]}</span>{LANG_LABELS[l]}
        </button>
      ))}
    </div>
  )
}

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [lang, setLang]       = useState<Lang>('hinglish')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [error, setError]       = useState('')

  // Load lang preference from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('karyika-store') ?? '{}')
      if (stored.state?.lang) setLang(stored.state.lang)
    } catch {}
  }, [])

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  const handleGoogle = async () => {
    setGLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <LangBar lang={lang} setLang={setLang} />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', marginBottom: 14, boxShadow: '0 8px 24px rgba(255,107,53,0.35)' }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-head)' }}>K</span>
        </div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', background: 'linear-gradient(135deg,var(--text),rgba(255,107,53,0.8))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
          {t(T.auth.welcome, lang)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>{t(T.auth.sub, lang)}</div>
      </div>

      {/* Card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: '28px 28px', boxShadow: 'var(--shadow-xl)' }}>

        {/* Google */}
        <button onClick={handleGoogle} disabled={gLoading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px 18px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: gLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 20, transition: 'all 0.15s', opacity: gLoading ? 0.7 : 1 }}
          onMouseEnter={e => { if (!gLoading) e.currentTarget.style.borderColor = 'var(--accent)' }}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}>
          {gLoading
            ? <div style={{ width: 18, height: 18, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          }
          {t(T.auth.google, lang)}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{t(T.auth.or, lang)}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t(T.auth.email, lang)}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="aap@example.com" required style={INP}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.12)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.boxShadow = 'none' }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t(T.auth.password, lang)}</label>
              <button type="button" style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>{t(T.auth.forgot, lang)}</button>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={INP}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.12)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.boxShadow = 'none' }} />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'var(--rose)', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 10, padding: '10px 14px', lineHeight: 1.5 }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px 20px', background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.75 : 1, boxShadow: '0 4px 16px rgba(255,107,53,0.35)', marginTop: 4, transition: 'all 0.15s' }}>
            {loading ? t(T.auth.signingIn, lang) : t(T.auth.signin, lang)}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text3)' }}>
        {t(T.auth.noAccount, lang)}{' '}
        <Link href="/signup" style={{ color: 'var(--accent)', fontWeight: 700 }}>{t(T.auth.signupLink, lang)}</Link>
      </p>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
