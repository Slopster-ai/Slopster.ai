'use client'

import * as React from 'react'
import ProjectBin from './ProjectBin'
import Timeline from './Timeline'
import TranscriptEditor from './TranscriptEditor'
import PreviewPlayer, { PreviewPlayerHandle } from './PreviewPlayer'

interface VideoItem {
  id: string
  original_url: string
  processed_url: string | null
  status: string
  metadata: any
}

export default function EditorClient({ projectId, initialVideos }: { projectId: string, initialVideos: VideoItem[] }) {
  const [videos, setVideos] = React.useState<VideoItem[]>(initialVideos)
  const [timeline, setTimeline] = React.useState<string[]>([])
  const [selectedVideoId, setSelectedVideoId] = React.useState<string | null>(null)
  const [playheadFraction, setPlayheadFraction] = React.useState(0)
  const previewRef = React.useRef<PreviewPlayerHandle | null>(null)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <ProjectBin
          projectId={projectId}
          videos={videos}
          onRefresh={(v) => setVideos(v)}
          onTranscribed={(vid, transcript) => {
            setVideos((prev) => prev.map((v) => v.id === vid ? { ...v, metadata: { ...(v.metadata||{}), transcript } } : v))
            setSelectedVideoId(vid)
          }}
          onAddToTimeline={(vid) => setTimeline((t) => [...t, vid])}
        />
      </div>
      <div className="lg:col-span-2 space-y-6">
        <PreviewPlayer
          ref={previewRef}
          videos={videos}
          timeline={timeline}
          selectedClipId={selectedVideoId}
          onPlayheadFractionChange={setPlayheadFraction}
        />
        <Timeline
          videos={videos}
          timeline={timeline}
          setTimeline={setTimeline}
          onSelect={(vid) => {
            setSelectedVideoId(vid)
            previewRef.current?.seekToClipId(vid)
          }}
          playheadFraction={playheadFraction}
          onSeekFraction={(f) => previewRef.current?.seekToFraction(f)}
        />
        {selectedVideoId && (
          <TranscriptEditor
            projectId={projectId}
            video={videos.find(v => v.id === selectedVideoId)!}
            onSaved={(t) => setVideos((prev) => prev.map((v) => v.id === selectedVideoId ? { ...v, metadata: { ...(v.metadata||{}), transcript: t } } : v))}
          />
        )}
      </div>
    </div>
  )
}


