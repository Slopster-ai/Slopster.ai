"use client"

import * as React from 'react'
import { Button } from './ui/Button'

export default function VoiceRecorder({ projectId }: { projectId: string }) {
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null)
  const chunksRef = React.useRef<BlobPart[]>([])
  const [recording, setRecording] = React.useState(false)
  const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [duration, setDuration] = React.useState(0)

  React.useEffect(() => {
    let mounted = true
    let localStream: MediaStream | null = null
    const init = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (!mounted) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        localStream = s
        setStream(s)
      } catch (e: any) {
        console.error('Microphone access error:', e)
        let errorMessage = 'Microphone access failed'

        if (e.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow permissions and refresh.'
        } else if (e.name === 'NotFoundError') {
          errorMessage = 'No microphone found.'
        } else if (e.name === 'NotReadableError') {
          errorMessage = 'Microphone is already in use by another application.'
        } else if (e.name === 'OverconstrainedError') {
          errorMessage = 'Microphone doesn\'t meet requirements.'
        } else if (e.name === 'SecurityError') {
          errorMessage = 'Microphone access blocked for security reasons.'
        } else if (e.name === 'AbortError') {
          errorMessage = 'Microphone access was interrupted.'
        }

        setError(errorMessage)
      }
    }
    init()
    return () => {
      mounted = false
      if (localStream) localStream.getTracks().forEach((t) => t.stop())
    }
  }, [])

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (recording) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } else {
      setDuration(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [recording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = () => {
    if (!stream) return
    setError(null)
    setRecordedBlob(null)
    chunksRef.current = []
    setDuration(0)

    // Try different MIME types for audio
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      ''
    ]

    let mr: MediaRecorder | null = null
    let selectedMimeType = ''

    for (const mimeType of mimeTypes) {
      try {
        if (mimeType === '' || MediaRecorder.isTypeSupported(mimeType)) {
          mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
          selectedMimeType = mimeType || 'default'
          break
        }
      } catch (e) {
        continue
      }
    }

    if (!mr) {
      setError('Audio recording not supported in this browser')
      return
    }

    console.log('Using MIME type:', selectedMimeType)

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }
    mr.onstop = () => {
      if (!chunksRef.current || chunksRef.current.length === 0) {
        console.error('No audio data captured')
        setError('No audio data captured. Try recording for a few seconds or switch browser.')
        setRecordedBlob(null)
        return
      }
      const blob = new Blob(chunksRef.current, { type: selectedMimeType || 'audio/webm' })
      if (blob.size === 0) {
        setError('Recorded audio is empty. Try again and ensure permissions are allowed.')
        setRecordedBlob(null)
        return
      }
      setRecordedBlob(blob)
    }
    mr.onerror = (e) => {
      console.error('MediaRecorder error:', e)
      setError('Recording failed')
      setRecording(false)
    }

    try {
      mr.start(1000)
      setMediaRecorder(mr)
      setRecording(true)
    } catch (e: any) {
      console.error('Failed to start recording:', e)
      setError(`Failed to start recording: ${e.message}`)
    }
  }

  const stopRecording = () => {
    if (!mediaRecorder) return
    try {
      if (typeof mediaRecorder.requestData === 'function') {
        try { mediaRecorder.requestData() } catch {}
      }
      mediaRecorder.stop()
    } catch (e) {
      console.error('Failed to stop recorder', e)
    } finally {
      setRecording(false)
    }
  }

  const download = () => {
    if (!recordedBlob) return
    const url = URL.createObjectURL(recordedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recording-${Date.now()}.${recordedBlob.type.includes('mp4') ? 'm4a' : 'webm'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const upload = async () => {
    if (!recordedBlob) return
    setUploading(true)
    setError(null)
    try {
      const fileName = `recording-${Date.now()}.${recordedBlob.type.includes('mp4') ? 'm4a' : 'webm'}`
      const contentType = recordedBlob.type || 'audio/webm'
      const fileSize = recordedBlob.size
      const presign = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, fileName, contentType, fileSize }),
      })
      const { uploadUrl, key, error: err } = await presign.json()
      if (!presign.ok) throw new Error(err || 'Failed to get upload URL')

      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: recordedBlob,
      })
      if (!put.ok) {
        const bodyText = await put.text().catch(() => '')
        throw new Error(bodyText || 'Upload failed')
      }

      // Create video record (we'll use the same table for now, but it's audio)
      const created = await fetch('/api/videos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, key }),
      })
      const cj = await created.json()
      if (!created.ok) throw new Error(cj.error || 'Failed to save recording')

      // Kick off processing
      const proc = await fetch('/api/videos/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          videoId: cj.video.id,
          inputKey: key,
          operations: {},
        }),
      })
      if (!proc.ok) {
        const pj = await proc.json().catch(() => ({}))
        throw new Error(pj.error || 'Failed to start processing')
      }

      window.location.reload()
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-red-500">{error}</div>}
      
      <div className="rounded-xl hairline p-8 bg-surface flex flex-col items-center justify-center min-h-[200px]">
        {recording ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-mono font-medium">{formatTime(duration)}</div>
            <div className="text-sm text-muted">Recording in progress...</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-foreground/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="text-sm text-muted text-center">
              {recordedBlob ? 'Ready to upload' : 'Click record to start'}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {!recording ? (
          <Button onClick={startRecording} disabled={!stream} className="flex-1">
            {recordedBlob ? 'Record again' : 'Start recording'}
          </Button>
        ) : (
          <Button onClick={stopRecording} variant="subtle" className="flex-1">Stop recording</Button>
        )}
        <Button onClick={download} disabled={!recordedBlob} variant="ghost">Download</Button>
        <Button onClick={upload} disabled={!recordedBlob || uploading} className="flex-1">
          {uploading ? 'Uploading…' : 'Upload to project'}
        </Button>
      </div>
      
      <div className="text-xs text-muted">
        Tip: Speak clearly and ensure your microphone is working. You can record multiple takes.
      </div>
    </div>
  )
}

