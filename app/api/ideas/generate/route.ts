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

  const system = `You are a TikTok content strategist. You MUST output ONLY valid JSON (no markdown, no code blocks, no extra text). The JSON must have this exact structure: {"ideas": [{"title": "...", "hook": "...", "outline": ["...", "..."], "angle": "...", "durationSec": 30, "reasoning": "..."}]}. Generate 3-5 short-form video ideas for ${platform}. Each idea needs: title, hook, outline (2-3 beats), angle, durationSec (15-45), reasoning.`

  const userPrompt = JSON.stringify({ brand_context, purpose, audience, constraints, platform })

  let completion
  try {
    completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.7,
    })
  } catch (error: any) {
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      return NextResponse.json({ error: 'OpenAI API quota exceeded. Please check your billing or try again later.' }, { status: 429 })
    }
    if (error?.status === 401) {
      return NextResponse.json({ error: 'OpenAI API key is invalid or missing.' }, { status: 500 })
    }
    return NextResponse.json({ error: error?.message || 'Failed to generate ideas. Please try again.' }, { status: 500 })
  }

  const content = completion.choices[0].message.content
  if (!content) return NextResponse.json({ error: 'Failed to generate ideas' }, { status: 500 })

  // Clean content - remove markdown code blocks if present
  let cleanedContent = content.trim()
  
  // Remove markdown code blocks
  cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  cleanedContent = cleanedContent.trim()
  
  // Remove any leading/trailing whitespace or newlines
  cleanedContent = cleanedContent.replace(/^\s+|\s+$/g, '')

  let parsed: any
  try {
    parsed = JSON.parse(cleanedContent)
  } catch (parseError: any) {
    // Try to find and extract JSON object from the content
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        // Try to fix common JSON issues
        let jsonStr = jsonMatch[0]
        // Remove trailing commas before closing braces/brackets
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1')
        parsed = JSON.parse(jsonStr)
      } catch (e2) {
        // Last resort: try to extract just the ideas array
        const ideasMatch = cleanedContent.match(/"ideas"\s*:\s*\[[\s\S]*?\]/i)
        if (ideasMatch) {
          try {
            const ideasStr = `{${ideasMatch[0]}}`
            const temp = JSON.parse(ideasStr)
            parsed = { ideas: temp.ideas || [] }
          } catch (e3) {
            console.error('JSON parse error:', parseError?.message, 'Content:', cleanedContent.substring(0, 200))
            return NextResponse.json({ 
              error: 'Failed to parse ideas. Please try generating again.' 
            }, { status: 502 })
          }
        } else {
          console.error('JSON parse error:', parseError?.message, 'Content:', cleanedContent.substring(0, 200))
          return NextResponse.json({ 
            error: 'Failed to parse ideas. Please try generating again.' 
          }, { status: 502 })
        }
      }
    } else {
      console.error('No JSON found in content:', cleanedContent.substring(0, 200))
      return NextResponse.json({ 
        error: 'Failed to parse ideas. Please try generating again.' 
      }, { status: 502 })
    }
  }

  const ideas = Array.isArray(parsed?.ideas) ? parsed.ideas : []
  if (ideas.length === 0) {
    return NextResponse.json({ 
      error: 'No ideas were generated. Please try again.' 
    }, { status: 502 })
  }
  
  return NextResponse.json({ ideas })
}












