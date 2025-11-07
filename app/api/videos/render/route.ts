import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { enqueueVideoJob } from '@/lib/aws/sqs'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({})) as any
    const projectId = String(body.projectId || '')
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    const supabase = await createClient()

    // Load edit (EDL) and latest video
    const [{ data: edit }, { data: video }] = await Promise.all([
      supabase.from('edits').select('*').eq('project_id', projectId).single(),
      supabase.from('videos').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).single(),
    ])

    if (!edit) return NextResponse.json({ error: 'No edit found' }, { status: 404 })
    if (!video) return NextResponse.json({ error: 'No video found' }, { status: 404 })

    // Create job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        video_id: video.id,
        status: 'queued',
        progress: 0,
      })
      .select()
      .single()
    if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 })

    const inputKey = (video.metadata?.key as string) || ''
    const outputKey = inputKey ? inputKey.replace('uploads/', 'outputs/').replace(/\.[^.]+$/, '-rendered.mp4') : `outputs/${user.id}/${projectId}/${job.id}-rendered.mp4`

    await enqueueVideoJob({
      jobId: job.id,
      inputKey,
      outputKey,
      operations: {
        format: 'mp4',
      },
    })

    return NextResponse.json({ jobId: job.id, outputKey })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}


