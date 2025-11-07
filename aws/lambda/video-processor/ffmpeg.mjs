import { spawnSync } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'

/**
 * Process video with FFmpeg
 * @param {Buffer} inputBuffer - Input video buffer
 * @param {Object} operations - Processing operations
 * @param {Function} progressCallback - Progress callback (0-1)
 * @returns {Promise<Buffer>} - Processed video buffer
 */
export async function processVideo(inputBuffer, operations, progressCallback, options = {}) {
  const tmpDir = '/tmp'
  const inputExt = (options.inputExt || 'mp4').replace(/[^a-z0-9]/gi, '')
  const outputExt = (options.outputExt || 'mp4').replace(/[^a-z0-9]/gi, '')
  const inputPath = join(tmpDir, `input-${Date.now()}.${inputExt}`)
  const outputPath = join(tmpDir, `output-${Date.now()}.${outputExt}`)

  try {
    // Write input buffer to file
    writeFileSync(inputPath, inputBuffer)

    // Build FFmpeg command
    const ffmpegArgs = buildFFmpegArgs(inputPath, outputPath, operations)

    console.log('FFmpeg command:', ffmpegArgs.join(' '))

    if (progressCallback) await progressCallback(0.1)

    // Run FFmpeg
    const result = spawnSync('/opt/bin/ffmpeg', ffmpegArgs, {
      stdio: 'pipe',
      timeout: 900000, // 15 minutes max
    })

    if (result.error) {
      throw new Error(`FFmpeg spawn error: ${result.error.message}`)
    }

    if (result.status !== 0) {
      const stderr = result.stderr?.toString() || 'Unknown error'
      throw new Error(`FFmpeg failed with status ${result.status}: ${stderr}`)
    }

    if (progressCallback) await progressCallback(0.9)

    // Read output file
    const outputBuffer = readFileSync(outputPath)

    if (progressCallback) await progressCallback(1.0)

    return outputBuffer
  } finally {
    // Cleanup
    try {
      unlinkSync(inputPath)
    } catch (e) {
      // Ignore
    }
    try {
      unlinkSync(outputPath)
    } catch (e) {
      // Ignore
    }
  }
}

/**
 * Build FFmpeg command arguments
 */
function buildFFmpegArgs(inputPath, outputPath, operations) {
  const args = ['-i', inputPath]

  // Trim video
  if (operations.trim) {
    args.push('-ss', operations.trim.start.toString())
    if (operations.trim.end) {
      args.push('-to', operations.trim.end.toString())
    }
  }

  // Video filters
  const filters = []

  // Auto-captions (hardcoded subtitles for MVP - Whisper integration post-launch)
  if (operations.captions) {
    // For MVP: Just add a simple text overlay
    // In production: Use Whisper API to generate SRT, then burn into video
    filters.push("drawtext=text='Auto-captions enabled':fontsize=24:fontcolor=white:x=(w-text_w)/2:y=h-100")
  }

  // Transitions (simple fade for MVP)
  if (operations.transitions && operations.transitions.length > 0) {
    // Add fade in/out
    filters.push('fade=t=in:st=0:d=1')
    filters.push('fade=t=out:st=28:d=2')
  }

  // Format: 9:16 aspect ratio for social media
  if (operations.format === 'social') {
    filters.push('scale=1080:1920:force_original_aspect_ratio=decrease')
    filters.push('pad=1080:1920:(ow-iw)/2:(oh-ih)/2')
  }

  // Apply filters
  if (filters.length > 0) {
    args.push('-vf', filters.join(','))
  }

  // Audio normalization
  args.push('-af', 'loudnorm')

  // Output settings
  args.push(
    '-c:v', 'libx264',        // H.264 codec
    '-preset', 'medium',       // Encoding speed
    '-crf', '23',              // Quality (lower = better)
    '-c:a', 'aac',             // AAC audio codec
    '-b:a', '128k',            // Audio bitrate
    '-movflags', '+faststart', // Web optimization
    '-y',                      // Overwrite output
    outputPath
  )

  return args
}

