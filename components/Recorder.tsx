"use client"

import * as React from 'react'
import { Button } from './ui/Button'

export default function Recorder({ projectId }: { projectId: string }) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null)
  const [chunks, setChunks] = React.useState<BlobPart[]>([])
  const [recording, setRecording] = React.useState(false)
  const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true })
        if (!mounted) return
        setStream(s)
        if (videoRef.current) {
          videoRef.current.srcObject = s
        }
      } catch (e: any) {
        setError(e.message || 'Camera/microphone access denied')
      }
    }
    init()
    return () => {
      mounted = false
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const startRecording = () => {
    if (!stream) return
    setError(null)
    setRecordedBlob(null)
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' })
    setChunks([])
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) setChunks((c) => [...c, e.data])
    }
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      setRecordedBlob(blob)
    }
    mr.start()
    setMediaRecorder(mr)
    setRecording(true)
  }

  const stopRecording = () => {
    if (!mediaRecorder) return
    mediaRecorder.stop()
    setRecording(false)
  }

  const download = () => {
    if (!recordedBlob) return
    const url = URL.createObjectURL(recordedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recording-${Date.now()}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }

  const upload = async () => {
    if (!recordedBlob) return
    setUploading(true)
    setError(null)
    try {
      const fileName = `recording-${Date.now()}.webm`
      const contentType = recordedBlob.type || 'video/webm'
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

      // Create video record
      const created = await fetch('/api/videos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, key }),
      })
      const cj = await created.json()
      if (!created.ok) throw new Error(cj.error || 'Failed to save video')

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
      <div className="rounded-xl overflow-hidden bg-black aspect-video">
        <video ref={videoRef} className="w-full h-full object-contain" autoPlay muted playsInline />
      </div>
      <div className="flex gap-3">
        {!recording ? (
          <Button onClick={startRecording} disabled={!stream}>Start recording</Button>
        ) : (
          <Button onClick={stopRecording} variant="subtle">Stop</Button>
        )}
        <Button onClick={download} disabled={!recordedBlob} variant="ghost">Download</Button>
        <Button onClick={upload} disabled={!recordedBlob || uploading}>{uploading ? 'Uploading…' : 'Upload to project'}</Button>
      </div>
      <div className="text-xs text-muted">
        Tip: Ensure good lighting, keep the lens at eye level, and deliver your hook in the first 2 seconds.
      </div>
    </div>
  )
}


