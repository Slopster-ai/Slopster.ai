import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'
import { processVideo } from './ffmpeg.mjs'

const s3 = new S3Client({ region: process.env.AWS_REGION })
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export const handler = async (event) => {
  console.log('Processing video job:', JSON.stringify(event))

  for (const record of event.Records) {
    const message = JSON.parse(record.body)
    const { jobId, inputKey, outputKey, operations } = message

    // Lookup job to get video_id for updating videos table on completion
    let videoId = null
    try {
      const { data: jobRow, error: jobFetchError } = await supabase
        .from('jobs')
        .select('video_id')
        .eq('id', jobId)
        .single()
      if (jobFetchError) {
        console.warn(`Job ${jobId}: Could not fetch job row for video_id`, jobFetchError)
      } else {
        videoId = jobRow?.video_id || null
      }
    } catch (e) {
      console.warn(`Job ${jobId}: Failed to lookup video_id`, e)
    }

    try {
      // Update job status: processing
      await supabase
        .from('jobs')
        .update({ status: 'processing', progress: 0 })
        .eq('id', jobId)

      console.log(`Job ${jobId}: Downloading from S3...`)

      // Download from S3
      const inputStream = await s3.send(
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: inputKey,
        })
      )

      // Convert stream to buffer
      const chunks = []
      for await (const chunk of inputStream.Body) {
        chunks.push(chunk)
      }
      const inputBuffer = Buffer.concat(chunks)

      console.log(`Job ${jobId}: Processing with FFmpeg...`)

      // Update progress: 30%
      await supabase
        .from('jobs')
        .update({ progress: 30 })
        .eq('id', jobId)

      // Process with FFmpeg
      const outputBuffer = await processVideo(inputBuffer, operations, async (progress) => {
        // Update progress during processing
        await supabase
          .from('jobs')
          .update({ progress: 30 + Math.floor(progress * 0.6) })
          .eq('id', jobId)
      })

      console.log(`Job ${jobId}: Uploading to S3...`)

      // Update progress: 90%
      await supabase
        .from('jobs')
        .update({ progress: 90 })
        .eq('id', jobId)

      // Upload to S3
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: outputKey,
          Body: outputBuffer,
          ContentType: 'video/mp4',
        })
      )

      const outputUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${outputKey}`

      // Update job: completed
      await supabase
        .from('jobs')
        .update({
          status: 'completed',
          progress: 100,
          output_url: outputUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      // Also update related video if we have the id
      if (videoId) {
        await supabase
          .from('videos')
          .update({
            status: 'completed',
            processed_url: outputUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', videoId)
      }

      console.log(`Job ${jobId}: Completed successfully`)
    } catch (error) {
      console.error(`Job ${jobId}: Failed`, error)
      
      await supabase
        .from('jobs')
        .update({
          status: 'failed',
          error: error.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Processing complete' }),
  }
}

