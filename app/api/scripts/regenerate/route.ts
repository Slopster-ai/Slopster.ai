import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { generateScript, ScriptParams } from '@/lib/openai'

function toTextFromGenerated(content: any): string {
  try {
    if (!content) return ''
    const parts: string[] = []
    if (content.hook) parts.push(`HOOK:\n${content.hook}\n`)
    if (Array.isArray(content.body)) {
      parts.push('BODY:')
      for (const line of content.body) parts.push(`- ${line}`)
      parts.push('')
    }
    if (content.cta) parts.push(`CTA:\n${content.cta}`)
    return parts.join('\n')
  } catch {
    return typeof content === 'string' ? content : JSON.stringify(content, null, 2)
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { prompt, platform, duration, tone } = (await req.json()) as ScriptParams
  if (!prompt || !platform || !duration) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const result = await generateScript({ prompt, platform, duration, tone })
  const text = toTextFromGenerated(result.script)
  return NextResponse.json({ text, content: result.script, usage: result.usage, cost: result.cost })
}











