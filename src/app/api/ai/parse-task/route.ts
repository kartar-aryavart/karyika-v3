import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SYSTEM = `You are a task parser for Karyika, an Indian productivity app. Parse natural language task descriptions — including Hinglish (Hindi + English mix) — into structured JSON.

RULES:
1. Return ONLY valid JSON, no markdown, no explanation
2. "title" is required — clean, professional task name  
3. "due" format: YYYY-MM-DD (compute from relative terms using today's date)
4. "dueTime" format: HH:MM (24-hour)
5. "priority": "urgent" | "high" | "medium" | "low" | "none"
6. "tags": array of relevant strings extracted from context

HINGLISH EXAMPLES:
- "kal subah 9 baje meeting urgent" → {"title":"Meeting","due":"tomorrow","dueTime":"09:00","priority":"urgent","tags":["meeting"]}
- "aaj shaam ko report finish karni hai" → {"title":"Finish report","due":"today","dueTime":"18:00","priority":"none","tags":[]}
- "next week gym membership renew karna" → {"title":"Renew gym membership","due":"next-monday","priority":"low","tags":["health"]}

Always output exactly this shape:
{"title":"string","due":"YYYY-MM-DD or null","dueTime":"HH:MM or null","priority":"urgent|high|medium|low|none","tags":[]}`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { input } = await req.json()
    if (!input?.trim()) return NextResponse.json({ error: 'Input required' }, { status: 400 })

    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const nextMonday = (() => { const d = new Date(); d.setDate(d.getDate() + (8 - d.getDay()) % 7 || 7); return d.toISOString().split('T')[0] })()

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 200,
        temperature: 0.1,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Today is ${today} (tomorrow=${tomorrow}, next-monday=${nextMonday}). Parse: "${input}"` }
        ],
      }),
    })

    if (!groqRes.ok) {
      console.error('Groq error:', await groqRes.text())
      return NextResponse.json({ title: input, due: null, dueTime: null, priority: 'none', tags: [] })
    }

    const groqData = await groqRes.json()
    const raw = groqData.choices?.[0]?.message?.content ?? '{}'
    let parsed: any
    try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) }
    catch { parsed = { title: input, due: null, dueTime: null, priority: 'none', tags: [] } }

    return NextResponse.json(parsed)
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
