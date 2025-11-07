'use client'

import * as React from 'react'
import { Button } from '@/components/ui/Button'

export default function ProjectBin({
  projectId,
  videos,
  onRefresh,
  onTranscribed,
  onAddToTimeline,
}: {
  projectId: string
  videos: Array<{ id: string; status: string; metadata: any; processed_url: string | null }>
  onRefresh: (videos: any[]) => void
  onTranscribed: (videoId: string, transcript: any) => void
  onAddToTimeline: (videoId: string) => void
}) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null)

  const transcribe = async (videoId: string) => {
    setLoadingId(videoId)
    try {
      const res = await fetch('/api/videos/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, videoId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Transcription failed')
      onTranscribed(videoId, json.transcript)
    } catch (e: any) {
      alert(e.message || 'Transcription failed')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Project bin</h2>
      <div className="space-y-2">
        {videos.map((v) => (
          <div key={v.id} className="p-3 rounded-xl hairline flex items-center justify-between">
            <div className="text-sm">
              <div>Video {v.id.slice(0,8)}</div>
              <div className="text-xs text-muted">{v.status}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="subtle" onClick={() => onAddToTimeline(v.id)}>Add to timeline</Button>
              <Button size="sm" onClick={() => transcribe(v.id)} disabled={loadingId === v.id}>
                {loadingId === v.id ? 'Transcribing…' : (v.metadata?.transcript ? 'Re-transcribe' : 'Transcribe')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


