'use client'

import { useState, useRef } from 'react'
import { formatFileSize } from '@/lib/utils'
import { Button } from './ui/Button'
import { Progress } from './ui/Progress'
import { Upload } from 'lucide-react'

interface VideoUploaderProps {
  projectId: string
}

export default function VideoUploader({ projectId }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('video/')) {
        setError('Please select a valid video file')
        return
      }
      
      // Validate file size (2GB max)
      if (selectedFile.size > 2 * 1024 * 1024 * 1024) {
        setError('File too large. Maximum size is 2GB.')
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Step 1: Get pre-signed URL
      const urlResponse = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      })

      if (!urlResponse.ok) {
        const data = await urlResponse.json()
        throw new Error(data.error || 'Failed to get upload URL')
      }

      const { uploadUrl, key } = await urlResponse.json()

      // Step 2: Upload file to S3
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100)
          setProgress(percentComplete)
        }
      })

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          try {
            // Save video record
            const created = await fetch('/api/videos/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ projectId, key }),
            })
            const cj = await created.json()
            if (!created.ok) throw new Error(cj.error || 'Failed to save video')

            // Start processing
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

            setProgress(100)
            window.location.reload()
          } catch (e: any) {
            setError(e.message || 'Post-upload steps failed')
            setUploading(false)
          }
        } else {
          throw new Error('Upload failed')
        }
      })

      xhr.addEventListener('error', () => {
        throw new Error('Upload failed')
      })

      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    } catch (err: any) {
      setError(err.message)
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl hairline p-3">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border border-dashed border-[#2a2b2f] p-8 text-center hover:border-foreground cursor-pointer transition-colors"
        >
          <Upload className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-2 text-sm text-muted">Click to upload video</p>
          <p className="mt-1 text-xs text-muted">MP4, MOV, AVI up to 2GB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl hairline">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#1a1b1e]" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted">{formatFileSize(file.size)}</p>
                </div>
              </div>
              {!uploading && (
                <button onClick={() => setFile(null)} className="text-muted hover:text-foreground">✕</button>
              )}
            </div>

            {uploading && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>Uploading…</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </div>

          {!uploading && (
            <Button onClick={handleUpload} className="w-full">Upload video</Button>
          )}
        </div>
      )}
    </div>
  )
}

