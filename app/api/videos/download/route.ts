import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { generateDownloadUrl } from '@/lib/aws/s3'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const videoId = String(searchParams.get('videoId') || '')
    if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 })

    const supabase = await createClient()
    const { data: video } = await supabase
      .from('videos')
      .select('id, project_id, metadata, projects!inner(user_id)')
      .eq('id', videoId)
      .single()

    if (!video || (video as any).projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const meta = (video as any).metadata || {}
    const inputKey = String(meta.key || '')
    if (!inputKey) return NextResponse.json({ error: 'Missing input key' }, { status: 400 })

    // Derive processed output key to match Lambda
    const outputKey = inputKey.replace('uploads/', 'outputs/').replace(/\.[^.]+$/, '-processed.mp4')

    const url = await generateDownloadUrl(outputKey)
    return NextResponse.json({ url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}


