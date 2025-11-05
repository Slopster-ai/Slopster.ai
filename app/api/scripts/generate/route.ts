import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { generateScript, ScriptParams } from '@/lib/openai'
import { z } from 'zod'

const generateSchema = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().min(1),
  platform: z.enum(['tiktok', 'youtube-shorts', 'instagram-reels']),
  duration: z.number().min(15).max(180),
  tone: z.enum(['casual', 'professional', 'humorous', 'inspirational']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, prompt, platform, duration, tone } = generateSchema.parse(body)

    // Generate script with OpenAI
    const result = await generateScript({ prompt, platform, duration, tone } as ScriptParams)

    if (!result.script) {
      return NextResponse.json({ error: 'Failed to generate script' }, { status: 500 })
    }

    // Save script to database
    const supabase = await createClient()
    const { data: script, error } = await supabase
      .from('scripts')
      .insert({
        project_id: projectId,
        content: { ...result.script, original_prompt: prompt },
        platform,
        duration,
        tone: tone || 'casual',
        cost: result.cost,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      script,
      usage: result.usage,
      cost: result.cost,
    })
  } catch (error: any) {
    console.error('Script generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

