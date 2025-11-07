import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { projectId, videoId, transcript } = body || {}
    if (!projectId || !videoId || !transcript) {
      return NextResponse.json({ error: 'projectId, videoId, transcript required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: video } = await supabase
      .from('videos')
      .select('id, project_id, projects!inner(user_id), metadata')
      .eq('id', videoId)
      .single()

    if (!video || (video as any).projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase
      .from('videos')
      .update({ metadata: { ...(video.metadata || {}), transcript } })
      .eq('id', videoId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ transcript })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}


