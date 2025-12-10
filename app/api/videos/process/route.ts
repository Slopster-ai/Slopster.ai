import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { enqueueVideoJob } from '@/lib/aws/sqs'
import { z } from 'zod'

const processSchema = z.object({
  projectId: z.string().uuid(),
  videoId: z.string().uuid(),
  inputKey: z.string(),
  operations: z.object({
    trim: z
      .object({
        start: z.number(),
        end: z.number(),
      })
      .optional(),
    captions: z.boolean().optional(),
    transitions: z.array(z.string()).optional(),
    format: z.string().optional(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, videoId, inputKey, operations } = processSchema.parse(body)

    const supabase = await createClient()

    // Verify user owns this video
    const { data: video } = await supabase
      .from('videos')
      .select('*, projects!inner(user_id)')
      .eq('id', videoId)
      .single()

    if (!video || video.projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        video_id: videoId,
        status: 'queued',
        progress: 0,
      })
      .select()
      .single()

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 })
    }

    // Generate output key
    const outputKey = inputKey.replace('uploads/', 'outputs/').replace(/\.[^.]+$/, '-processed.mp4')

    // Enqueue job to SQS (if configured)
    try {
      await enqueueVideoJob({
        jobId: job.id,
        inputKey,
        outputKey,
        operations,
      })
    } catch (error: any) {
      // If SQS is not configured, mark job as failed with helpful error
      if (error.message?.includes('AWS_SQS_QUEUE_URL') || error.message?.includes('queue does not exist')) {
        await supabase
          .from('jobs')
          .update({ 
            status: 'failed', 
            error: 'SQS queue not configured. Please set up AWS_SQS_QUEUE_URL environment variable.' 
          })
          .eq('id', job.id)
        return NextResponse.json(
          { 
            error: 'SQS queue not configured. Please create an SQS queue and set AWS_SQS_QUEUE_URL in your environment variables.',
            jobId: job.id 
          },
          { status: 500 }
        )
      }
      throw error
    }

    // Update video status
    await supabase
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', videoId)

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
    })
  } catch (error: any) {
    console.error('Video processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

