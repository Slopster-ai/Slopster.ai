import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { projectId, audioBase64, storyboard, subtitles } = body || {}

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    }
    if (!audioBase64 || !Array.isArray(storyboard) || !Array.isArray(subtitles)) {
      return NextResponse.json({ error: 'audioBase64, storyboard, and subtitles are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // MVP: acknowledge request. Rendering is composed on the client for now.
    return NextResponse.json({
      status: 'accepted',
      message: 'Client-side render requested; server pipeline pending.',
      frames: storyboard.length,
      subtitles: subtitles.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Render failed' }, { status: 500 })
  }
}

