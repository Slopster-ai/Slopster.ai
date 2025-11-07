'use client'

import * as React from 'react'

export default function Timeline({
  videos,
  timeline,
  setTimeline,
  onSelect,
}: {
  videos: Array<{ id: string }>
  timeline: string[]
  setTimeline: (next: string[]) => void
  onSelect: (videoId: string) => void
}) {
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id)
  }
  const onDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    const next = [...timeline]
    const from = next.indexOf(id)
    if (from >= 0) next.splice(from, 1)
    next.splice(index, 0, id)
    setTimeline(next)
  }
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault()

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Timeline</h2>
      <div className="rounded-xl hairline p-3 min-h-[96px] flex gap-2 items-center overflow-x-auto">
        {timeline.length === 0 && (
          <div className="text-sm text-muted">Drag videos here to build your edit</div>
        )}
        {timeline.map((id, idx) => (
          <div
            key={id + idx}
            className="h-16 min-w-[140px] rounded-lg bg-[#1a1b1e] flex items-center justify-center cursor-move select-none"
            draggable
            onDragStart={(e) => onDragStart(e, id)}
            onDrop={(e) => onDrop(e, idx)}
            onDragOver={onDragOver}
            onClick={() => onSelect(id)}
          >
            Clip {id.slice(0, 6)}
          </div>
        ))}
        <div className="h-16 min-w-[40px]" onDrop={(e) => onDrop(e, timeline.length)} onDragOver={onDragOver} />
      </div>
    </div>
  )
}


