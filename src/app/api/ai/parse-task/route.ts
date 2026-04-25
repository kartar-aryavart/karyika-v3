import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { LIMITS } from '@/lib/security/rate-limit'
import { secureJson } from '@/lib/security/headers'

const SYSTEM = `You are a task parser for Karyika, an Indian productivity app. Parse natural language — including Hinglish (Hindi + English) — into structured JSON.
Return ONLY valid JSON, no markdown. Shape: {"title":"string","due":"YYYY-MM-DD or null","dueTime":"HH:MM or null","priority":"urgent|high|medium|low|none","tags":[]}`

export async function POST(req: NextRequest) {
  const auth = await getAuthUser()
  if (!auth.ok) return auth.response

  // AI endpoints get stricter rate limit
  const rl = LIMITS.ai(auth.user.id)
  if (!rl.allowed) return secureJson(
    { error: 'AI rate limit exceeded', code: 'AI_RATE_LIMITED' },
    { status: 429, retryAfter: rl.retryAfter }
  )

  let body: any
  try { body = await req.json() }
  catch { return secureJson({ error: 'Invalid JSON' }, { status: 400 }) }

  const input = body.input?.trim()
  if (!input) return secureJson({ error: 'Input required' }, { status: 400 })
  // Limit input length to prevent prompt injection / abuse
  if (input.length > 500) return secureJson({ error: 'Input too long (max 500 chars)' }, { status: 400 })

  if (!process.env.GROQ_API_KEY) {
    return secureJson({ title: input, due: null, dueTime: null, priority: 'none', tags: [] })
  }

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 200,
        temperature: 0.1,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Today=${today}, tomorrow=${tomorrow}. Parse: "${input}"` },
        ],
      }),
    })

    const groqData = await groqRes.json()
    const raw = groqData.choices?.[0]?.message?.content ?? '{}'
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      return secureJson(parsed, { remaining: rl.remaining })
    } catch {
      return secureJson({ title: input, due: null, dueTime: null, priority: 'none', tags: [] })
    }
  } catch {
    return secureJson({ title: input, due: null, dueTime: null, priority: 'none', tags: [] })
  }
}
