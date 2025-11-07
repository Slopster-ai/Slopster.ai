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

    const system = 'You are a TikTok sound supervisor. Suggest trending background music and SFX ideas.'
    const userPrompt = JSON.stringify({ platform: 'tiktok', strategy, script })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      max_completion_tokens: 800,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0].message.content
    if (!content) return NextResponse.json({ error: 'Model error' }, { status: 500 })
    let parsed: any = {}
    try { parsed = JSON.parse(content) } catch { parsed = {} }
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : parsed.tracks || []
    return NextResponse.json({ suggestions })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}


