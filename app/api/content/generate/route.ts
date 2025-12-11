import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUser } from '@/lib/supabase/auth'
import { openai } from '@/lib/openai'

function cleanJsonString(input: string) {
  let str = input.trim()
  str = str.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  str = str.trim()
  return str
}

const requestSchema = z.object({
  projectId: z.string().uuid(),
  script: z.string().min(20, 'Script is too short'),
  frames: z.number().min(4).max(8).optional(),
})

const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY
const CARTESIA_API_URL = process.env.CARTESIA_API_URL || 'https://api.cartesia.ai/tts'
const CARTESIA_VOICE_ID = process.env.CARTESIA_VOICE_ID || 'alloy'

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { projectId, script, frames: rawFrames } = requestSchema.parse(body)
    const frames = Math.min(Math.max(rawFrames ?? 6, 4), 8)

    // Plan the outputs (voiceover script, caption, subtitles, storyboard prompts)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You generate production-ready assets from a video script. Respond with JSON only. Keys: voiceover_script (concise, natural), caption (social-friendly, includes CTA and hashtags), subtitles (array of {start,end,text} with SRT-like timestamps), storyboard (array of {title,prompt} for visual generation). Keep subtitles 8-14 lines, 6-10 words each.',
        },
        { role: 'user', content: script },
      ],
      max_tokens: 1000,
      temperature: 0.8,
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('No content from model')
    const parsed = JSON.parse(cleanJsonString(content)) as {
      voiceover_script?: string
      caption?: string
      subtitles?: Array<{ start: string; end: string; text: string }>
      storyboard?: Array<{ title?: string; prompt: string }>
    }

    const voiceoverScript = parsed.voiceover_script || script.slice(0, 1200)
    const caption = parsed.caption || 'New video drop — check it out!'
    const subtitles = Array.isArray(parsed.subtitles) && parsed.subtitles.length
      ? parsed.subtitles
      : [
          { start: '00:00:00,000', end: '00:00:03,000', text: 'New video coming soon.' },
          { start: '00:00:03,000', end: '00:00:06,000', text: 'Stay tuned!' },
        ]

    const storyboardPrompts =
      Array.isArray(parsed.storyboard) && parsed.storyboard.length
        ? parsed.storyboard.slice(0, frames)
        : Array.from({ length: frames }).map((_, i) => ({
            title: `Frame ${i + 1}`,
            prompt: `A cinematic storyboard frame ${i + 1} derived from the script: ${script.slice(0, 200)}`,
          }))

    // Generate TTS audio (Cartesia if configured, else OpenAI fallback)
    async function synthesizeWithCartesia() {
      const res = await fetch(CARTESIA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CARTESIA_API_KEY}`,
        },
        body: JSON.stringify({
          text: voiceoverScript,
          voice: CARTESIA_VOICE_ID,
          format: 'mp3',
        }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Cartesia TTS failed (${res.status})`)
      }
      const buffer = Buffer.from(await res.arrayBuffer())
      return buffer.toString('base64')
    }

    let audioBase64 = ''
    if (CARTESIA_API_KEY) {
      try {
        audioBase64 = await synthesizeWithCartesia()
      } catch (cartErr) {
        console.error('Cartesia TTS failed, falling back to OpenAI:', cartErr)
      }
    }

    if (!audioBase64) {
      const speech = await openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice: 'alloy',
        input: voiceoverScript,
        format: 'mp3',
      })
      const audioBuffer = Buffer.from(await speech.arrayBuffer())
      audioBase64 = audioBuffer.toString('base64')
    }

    // Generate images for each storyboard prompt
    const storyboard = []
    for (const frame of storyboardPrompts) {
      const imageRes = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: `${frame.prompt} -- cinematic, 16:9, high detail, no text overlay`,
        size: '1536x1024',
      })
      const imageBase64 = imageRes.data?.[0]?.b64_json
      if (!imageBase64) continue
      storyboard.push({
        title: frame.title || 'Frame',
        prompt: frame.prompt,
        imageBase64,
      })
    }

    return NextResponse.json({
      projectId,
      voiceoverScript,
      caption,
      subtitles,
      audioBase64,
      storyboard,
    })
  } catch (e: any) {
    console.error('content/generate error', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

