import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { openai } from '@/lib/openai'

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any = {}
  try {
    body = await req.json()
  } catch (_) {}

  const platform = (body?.platform === 'tiktok' || body?.platform === 'youtube-shorts' || body?.platform === 'instagram-reels')
    ? body.platform
    : 'tiktok'

  const purpose = String(body?.purpose || '').trim()
  const audience = body?.audience && typeof body.audience === 'object' ? body.audience : {}
  const constraints = body?.constraints && typeof body.constraints === 'object' ? body.constraints : {}
  const brand_context = body?.brand_context && typeof body.brand_context === 'object' ? body.brand_context : {}

  if (!purpose) {
    return NextResponse.json({ error: 'purpose is required' }, { status: 400 })
  }

  const system = `You are a TikTok content strategist. Output a JSON object with an array field \"ideas\" containing 5-10 short-form video ideas optimized for ${platform}. Each idea must include: title, hook, outline (4-6 beats), angle, durationSec (15-45), reasoning. Prioritize a strong hook in first 2 seconds, vertical framing, native trends. Consider brand_context, purpose, audience, constraints.`

  const userPrompt = JSON.stringify({ brand_context, purpose, audience, constraints, platform })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    max_completion_tokens: 1200,
    temperature: 0.9,
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0].message.content
  if (!content) return NextResponse.json({ error: 'Failed to generate ideas' }, { status: 500 })

  let parsed: any
  try {
    parsed = JSON.parse(content)
  } catch (_e) {
    return NextResponse.json({ error: 'Invalid JSON from model' }, { status: 502 })
  }

  const ideas = Array.isArray(parsed?.ideas) ? parsed.ideas : []
  return NextResponse.json({ ideas })
}












