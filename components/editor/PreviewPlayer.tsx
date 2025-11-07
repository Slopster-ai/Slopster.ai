'use client'

import * as React from 'react'
import { Button } from '@/components/ui/Button'

type VideoItem = {
  id: string
  original_url?: string | null
  processed_url?: string | null
}

export type PreviewPlayerHandle = {
  seekToFraction: (fraction: number) => void
  seekToClipId: (clipId: string) => void
}

export default React.forwardRef(function PreviewPlayer(
  {
    videos,
    timeline,
    selectedClipId,
    onPlayheadFractionChange,
  }: {
    videos: VideoItem[]
    timeline: string[]
    selectedClipId?: string | null
    onPlayheadFractionChange?: (fraction: number) => void
  },
  ref: React.Ref<PreviewPlayerHandle>
) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [durations, setDurations] = React.useState<Record<string, number>>({})
  const [totalDuration, setTotalDuration] = React.useState(0)
  const [playheadFraction, setPlayheadFraction] = React.useState(0)

  const idToSrc = React.useMemo(() => {
    const map: Record<string, string | null> = {}
    for (const v of videos) {
      map[v.id] = (v.processed_url || v.original_url || null) as string | null
    }
    return map
  }, [videos])

  const sources = React.useMemo(() => timeline.map((id) => ({ id, src: idToSrc[id] || null })), [timeline, idToSrc])

  // Preload durations for each clip in the timeline
  React.useEffect(() => {
    let cancelled = false
    const loadDurations = async () => {
      const next: Record<string, number> = {}
      // Keep existing known durations
      for (const key of Object.keys(durations)) next[key] = durations[key]
      for (const { id, src } of sources) {
        if (!src) continue
        if (next[id] != null) continue
        next[id] = 0
        try {
          const el = document.createElement('video')
          el.preload = 'metadata'
          el.src = src
          await new Promise<void>((resolve, reject) => {
            const onLoaded = () => resolve()
            const onError = () => reject(new Error('Failed to load metadata'))
            el.addEventListener('loadedmetadata', onLoaded, { once: true })
            el.addEventListener('error', onError, { once: true })
          })
          if (!cancelled) next[id] = isFinite(el.duration) ? el.duration : 0
        } catch {
          // keep as 0 if failed
        }
      }
      if (!cancelled) setDurations(next)
    }
    loadDurations()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources.map((s) => s.id + ':' + (s.src || '')).join('|')])

  // Compute total duration when durations or timeline change
  React.useEffect(() => {
    const total = timeline.reduce((acc, id) => acc + (durations[id] || 0), 0)
    setTotalDuration(total)
  }, [timeline, durations])

  // Update the actual <video> src when currentIndex changes
  React.useEffect(() => {
    const src = sources[currentIndex]?.src || ''
    const el = videoRef.current
    if (!el) return
    if (!src) return
    const wasPlaying = !el.paused
    const onCanPlay = () => {
      if (wasPlaying) el.play().catch(() => {})
    }
    el.src = src
    el.currentTime = 0
    el.addEventListener('canplay', onCanPlay, { once: true })
    return () => {
      el.removeEventListener('canplay', onCanPlay)
    }
  }, [currentIndex, sources])

  // Handle playhead fraction updates while playing
  React.useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const onTimeUpdate = () => {
      const before = timeline.slice(0, currentIndex).reduce((acc, id) => acc + (durations[id] || 0), 0)
      const total = totalDuration || 1
      const frac = Math.max(0, Math.min(1, (before + el.currentTime) / total))
      setPlayheadFraction(frac)
      onPlayheadFractionChange?.(frac)
    }
    const onEnded = () => {
      if (currentIndex < sources.length - 1) {
        setCurrentIndex((i) => i + 1)
      } else {
        setIsPlaying(false)
      }
    }
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('ended', onEnded)
    }
  }, [currentIndex, durations, timeline, totalDuration, onPlayheadFractionChange, sources.length])

  // Keyboard: space toggles
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const togglePlay = () => {
    const el = videoRef.current
    if (!el) return
    if (isPlaying) {
      el.pause()
      setIsPlaying(false)
    } else {
      el.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  const seekToFraction = (fraction: number) => {
    const f = Math.max(0, Math.min(1, fraction))
    // Determine which clip based on cumulative durations
    const target = f * (totalDuration || 1)
    let acc = 0
    let idx = 0
    for (let i = 0; i < timeline.length; i++) {
      const dur = durations[timeline[i]] || 0
      if (acc + dur >= target) {
        idx = i
        break
      }
      acc += dur
      idx = i
    }
    const within = Math.max(0, target - acc)
    const el = videoRef.current
    setCurrentIndex(idx)
    // wait next tick for src update if index changed
    requestAnimationFrame(() => {
      const v = videoRef.current
      if (!v) return
      try {
        v.currentTime = isFinite(within) ? within : 0
      } catch {}
      setPlayheadFraction(f)
      onPlayheadFractionChange?.(f)
      if (isPlaying) v.play().catch(() => {})
    })
  }

  const seekToClipId = (clipId: string) => {
    const idx = timeline.indexOf(clipId)
    if (idx < 0) return
    setCurrentIndex(idx)
    requestAnimationFrame(() => {
      const v = videoRef.current
      if (!v) return
      v.currentTime = 0
      if (isPlaying) v.play().catch(() => {})
    })
  }

  React.useImperativeHandle(ref, () => ({ seekToFraction, seekToClipId }), [seekToFraction])

  // If selected clip changes externally, seek to it
  React.useEffect(() => {
    if (selectedClipId) seekToClipId(selectedClipId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClipId])

  // Simple scrub bar click handler
  const onScrubClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const frac = (e.clientX - rect.left) / rect.width
    seekToFraction(frac)
  }

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '00:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const currentGlobalSeconds = React.useMemo(() => (totalDuration || 0) * playheadFraction, [totalDuration, playheadFraction])

  return (
    <div className="space-y-3">
      <div className="rounded-xl hairline overflow-hidden">
        <div className="bg-black aspect-video w-full flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full" controls={false} preload="metadata" />
        </div>
        <div className="p-3 flex items-center gap-3">
          <Button size="sm" variant="secondary" onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</Button>
          <div className="text-xs tabular-nums text-muted">{formatTime(currentGlobalSeconds)} / {formatTime(totalDuration || 0)}</div>
          <div className="flex-1">
            <div className="h-2 w-full rounded-full bg-[#1a1b1e] cursor-pointer" onClick={onScrubClick}>
              <div className="h-2 rounded-full bg-foreground" style={{ width: `${(playheadFraction || 0) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})


