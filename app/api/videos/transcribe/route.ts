import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { openai } from '@/lib/openai'
import { createReadStream, writeFileSync } from 'fs'
import { Readable } from 'stream'
import { join } from 'path'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream as Readable) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const projectId = String(body.projectId || '')
    const videoId = String(body.videoId || '')
    if (!projectId || !videoId) return NextResponse.json({ error: 'projectId and videoId required' }, { status: 400 })

    const supabase = await createClient()
    const { data: video } = await supabase
      .from('videos')
      .select('id, project_id, original_url, processed_url, metadata, projects!inner(user_id)')
      .eq('id', videoId)
      .single()

    if (!video || (video as any).projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Choose source: processed output if available, else original key
    let key = ''
    if (video.metadata?.key) key = String(video.metadata.key)
    if (!key && video.original_url?.startsWith('s3://')) {
      key = video.original_url.replace(`s3://${process.env.AWS_S3_BUCKET!}/`, '')
    }
    if (!key) return NextResponse.json({ error: 'Missing S3 key' }, { status: 400 })

    // Download from S3
    const obj = await s3.send(new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }))
    const buffer = await streamToBuffer(obj.Body)

    // Write to tmp file with extension
    const isWebm = key.toLowerCase().endsWith('.webm')
    const tmpPath = join('/tmp', `transcribe-${Date.now()}.${isWebm ? 'webm' : 'mp4'}`)
    writeFileSync(tmpPath, buffer)

    // Transcribe via OpenAI
    const file = createReadStream(tmpPath)
    const model = 'whisper-1'
    const resp: any = await openai.audio.transcriptions.create({ model, file })

    // Build segments if available, else single block
    const text: string = resp.text || ''
    const segments = Array.isArray(resp.segments)
      ? resp.segments.map((s: any) => ({ start: s.start || 0, end: s.end || 0, text: s.text || '' }))
      : [{ start: 0, end: 0, text }]

    const transcript = { text, segments }

    // Save into videos.metadata.transcript
    const { error: upErr } = await supabase
      .from('videos')
      .update({ metadata: { ...(video.metadata || {}), transcript } })
      .eq('id', videoId)

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    return NextResponse.json({ transcript })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Transcription failed' }, { status: 500 })
  }
}


