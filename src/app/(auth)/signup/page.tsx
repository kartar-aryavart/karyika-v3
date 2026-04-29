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
const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.12)' }
const blurStyle  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'var(--border2)'; e.target.style.boxShadow = 'none' }

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

export default function SignupPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [lang, setLang]       = useState<Lang>('hinglish')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('karyika-store') ?? '{}')
      if (stored.state?.lang) setLang(stored.state.lang)
    } catch {}
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError(lang === 'hi' ? 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए' : 'Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true); setLoading(false)
  }

  if (success) return (
    <div style={{ textAlign: 'center', maxWidth: 380, padding: '0 16px' }}>
      <div style={{ fontSize: 56, marginBottom: 16, animation: 'float 3s ease infinite' }}>📬</div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 10 }}>
        {lang === 'hi' ? 'ईमेल देखें!' : lang === 'en' ? 'Check your email!' : 'Email check karo!'}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.7, marginBottom: 24 }}>
        {lang === 'hi' ? `हमने ` : lang === 'en' ? `We sent a confirmation link to ` : `Humne `}
        <strong style={{ color: 'var(--text)' }}>{email}</strong>
        {lang === 'hi' ? ` पर एक पुष्टिकरण लिंक भेजा है।` : lang === 'en' ? `. Click it to activate.` : ` pe link bheja hai. Click karke activate karo.`}
      </div>
      <Link href="/login" style={{ display: 'inline-block', padding: '11px 24px', background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(255,107,53,0.3)' }}>
        {t(T.auth.loginLink, lang)} →
      </Link>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </div>
  )

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <LangBar lang={lang} setLang={setLang} />

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', marginBottom: 14, boxShadow: '0 8px 24px rgba(255,107,53,0.35)' }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-head)' }}>K</span>
        </div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', background: 'linear-gradient(135deg,var(--text),rgba(255,107,53,0.8))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
          {lang === 'hi' ? 'खाता बनाएं' : lang === 'en' ? 'Create Account' : 'Account Banao'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>
          {lang === 'hi' ? 'मुफ़्त। कोई क्रेडिट कार्ड नहीं।' : lang === 'en' ? 'Free. No credit card needed.' : 'Free hai. Card nahi chahiye.'}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: '28px 28px', boxShadow: 'var(--shadow-xl)' }}>
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: t(T.auth.name, lang), type: 'text',     val: name,     set: setName,     ph: lang === 'hi' ? 'कार्तर सिंह' : 'Kartar Singh', req: true,  min: undefined },
            { label: t(T.auth.email, lang), type: 'email',   val: email,    set: setEmail,    ph: 'aap@example.com',                               req: true,  min: undefined },
            { label: t(T.auth.password, lang), type: 'password', val: password, set: setPassword, ph: lang === 'hi' ? 'कम से कम 8 अक्षर' : 'Min 8 characters', req: true, min: 8 },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
              <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} required={f.req} minLength={f.min} style={INP} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          ))}

          {error && (
            <div style={{ fontSize: 12, color: 'var(--rose)', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 10, padding: '10px 14px' }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px 20px', background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.75 : 1, boxShadow: '0 4px 16px rgba(255,107,53,0.35)', marginTop: 4, transition: 'all 0.15s' }}>
            {loading ? t(T.auth.creating, lang) : t(T.auth.create, lang)}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text3)' }}>
        {t(T.auth.hasAccount, lang)}{' '}
        <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>{t(T.auth.loginLink, lang)}</Link>
      </p>
    </div>
  )
}
