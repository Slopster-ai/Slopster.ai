import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({})) as any
    const projectId = String(body.projectId || '')
    const key = String(body.key || '')
    if (!projectId || !key) return NextResponse.json({ error: 'projectId and key are required' }, { status: 400 })

    const bucket = process.env.AWS_S3_BUCKET!
    const original_url = `s3://${bucket}/${key}`

    const supabase = await createClient()

    // Verify ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single()
    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: video, error } = await supabase
      .from('videos')
      .insert({
        project_id: projectId,
        original_url,
        processed_url: null,
        status: 'uploaded',
        metadata: { key },
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ video })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}



