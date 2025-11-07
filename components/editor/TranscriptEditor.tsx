'use client'

import * as React from 'react'
import { Button } from '@/components/ui/Button'

type Segment = { start: number; end: number; text: string }

export default function TranscriptEditor({
  projectId,
  video,
  onSaved,
}: {
  projectId: string
  video: { id: string; metadata: any }
  onSaved: (transcript: { segments: Segment[]; text: string }) => void
}) {
  const initial = (video.metadata?.transcript as any) || { segments: [], text: '' }
  const [segments, setSegments] = React.useState<Segment[]>(initial.segments || [])
  const [saving, setSaving] = React.useState(false)

  const updateSeg = (i: number, patch: Partial<Segment>) => {
    setSegments((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/videos/transcript', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, videoId: video.id, transcript: { segments, text: segments.map(s => s.text).join(' ') } }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save transcript')
      onSaved(json.transcript)
    } catch (e: any) {
      alert(e.message || 'Failed to save transcript')
    } finally {
      setSaving(false)
    }
  }

  if (!segments.length) {
    return (
      <div className="p-3 rounded-xl hairline text-sm">No transcript yet. Use Transcribe in the Project bin.</div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Transcript</h2>
      <div className="space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="p-2 rounded-lg hairline grid grid-cols-12 gap-2 items-center">
            <input className="col-span-2 input" type="number" step="0.1" value={s.start} onChange={(e) => updateSeg(i, { start: parseFloat(e.target.value) })} />
            <input className="col-span-2 input" type="number" step="0.1" value={s.end} onChange={(e) => updateSeg(i, { end: parseFloat(e.target.value) })} />
            <input className="col-span-8 input" value={s.text} onChange={(e) => updateSeg(i, { text: e.target.value })} />
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save transcript'}</Button>
    </div>
  )
}


