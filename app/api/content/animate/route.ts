import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'

const PIKA_API_KEY = process.env.PIKA_API_KEY
const PIKA_API_URL = process.env.PIKA_API_URL || 'https://api.pika.art/v1/video'

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!PIKA_API_KEY) return NextResponse.json({ error: 'PIKA_API_KEY not set' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const { prompt, imageBase64, aspect = '9:16', fps = 24, duration = 4 } = body || {}

    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    // Submit to Pika
    const createRes = await fetch(PIKA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PIKA_API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        image: imageBase64,
        aspect_ratio: aspect,
        fps,
        duration,
      }),
    })

    const createJson = await createRes.json().catch(() => ({}))
    if (!createRes.ok) {
      return NextResponse.json({ error: createJson?.error || createJson?.message || 'Failed to start animation' }, { status: createRes.status })
    }

    const jobId = createJson.id || createJson.job_id
    if (!jobId) {
      return NextResponse.json({ error: 'Missing job id from Pika' }, { status: 500 })
    }

    // Poll for completion (short, simple poll)
    let attempts = 0
    let videoUrl: string | null = null
    while (attempts < 20) {
      attempts += 1
      await new Promise((r) => setTimeout(r, 2000))
      const statusRes = await fetch(`${PIKA_API_URL}/${jobId}`, {
        headers: { Authorization: `Bearer ${PIKA_API_KEY}` },
      })
      const statusJson = await statusRes.json().catch(() => ({}))
      if (!statusRes.ok) {
        return NextResponse.json({ error: statusJson?.error || statusJson?.message || 'Animation status failed' }, { status: statusRes.status })
      }
      const state = statusJson.status || statusJson.state
      if (state === 'completed' || state === 'succeeded') {
        videoUrl = statusJson.video_url || statusJson.url || null
        break
      }
      if (state === 'failed' || state === 'error') {
        return NextResponse.json({ error: statusJson?.error || statusJson?.message || 'Animation failed' }, { status: 500 })
      }
    }

    if (!videoUrl) {
      return NextResponse.json({ error: 'Animation timed out' }, { status: 504 })
    }

    return NextResponse.json({ jobId, videoUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Animation failed' }, { status: 500 })
  }
}

