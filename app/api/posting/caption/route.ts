import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({})) as any
    const projectId = String(body.projectId || '')
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    const supabase = await createClient()
    const [{ data: project }, { data: scripts }] = await Promise.all([
      supabase.from('projects').select('strategy_context').eq('id', projectId).single(),
      supabase.from('scripts').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1),
    ])
    const strategy = project?.strategy_context || {}
    const script = scripts?.[0]?.content || {}

    const system = 'You are a TikTok copywriter. Generate a high-performing caption and 10–15 hashtags.'
    const userPrompt = JSON.stringify({ platform: 'tiktok', strategy, script })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.9,
    })

    const content = completion.choices[0].message.content
    if (!content) return NextResponse.json({ error: 'Model error' }, { status: 500 })
    let parsed: any = {}
    try {
      const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
      parsed = JSON.parse(cleaned)
    } catch {}
    const caption = parsed.caption || ''
    const hashtags: string[] = Array.isArray(parsed.hashtags) ? parsed.hashtags : []
    return NextResponse.json({ caption, hashtags })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}



