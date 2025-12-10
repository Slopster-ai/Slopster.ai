import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { deleteS3Object } from '@/lib/aws/s3'

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('id')
    if (!videoId) return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })

    const supabase = await createClient()

    // Verify user owns this video
    const { data: video } = await supabase
      .from('videos')
      .select('id, metadata, original_url, processed_url, projects!inner(user_id)')
      .eq('id', videoId)
      .single()

    if (!video || (video as any).projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete from S3 if key exists and AWS is configured
    const key = (video as any).metadata?.key as string | undefined
    if (key && process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
      try {
        await deleteS3Object(key)
      } catch (e: any) {
        // Log but don't fail if S3 delete fails (file might not exist)
        console.warn('Failed to delete S3 object:', e.message)
      }
    }

    // Also try to delete processed file if it exists
    if ((video as any).processed_url && process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
      try {
        const processedKey = (video as any).processed_url.replace(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`, '')
        if (processedKey && processedKey !== key) {
          await deleteS3Object(processedKey)
        }
      } catch (e: any) {
        console.warn('Failed to delete processed S3 object:', e.message)
      }
    }

    // Delete from database (this will cascade delete related jobs)
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Delete video error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

