"use client"

import * as React from 'react'

export interface LiveGuidanceProps {
  stream: MediaStream | null
}

export function LiveGuidance({ stream }: LiveGuidanceProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [hints, setHints] = React.useState<string[]>([])

  React.useEffect(() => {
    let raf = 0
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.muted = true
      videoRef.current.play().catch(() => {})
    }
    const sample = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.videoWidth && video.videoHeight) {
        const ctx = canvas.getContext('2d')!
        canvas.width = 160
        canvas.height = Math.round((video.videoHeight / video.videoWidth) * 160)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        let sum = 0
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          // perceived luminance
          sum += 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        const avg = sum / (data.length / 4)
        const nextHints: string[] = []
        if (avg < 60) nextHints.push('Increase lighting')
        if (avg > 210) nextHints.push('Reduce exposure')
        // Orientation check
        if (video.videoHeight < video.videoWidth) nextHints.push('Rotate to vertical')
        setHints(nextHints)
      }
      raf = requestAnimationFrame(sample)
    }
    raf = requestAnimationFrame(sample)
    return () => cancelAnimationFrame(raf)
  }, [stream])

  return (
    <div className="absolute inset-0 pointer-events-none">
      <video ref={videoRef} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        {hints.map((h, i) => (
          <div key={i} className="px-2 py-1 rounded bg-black/60 text-xs">{h}</div>
        ))}
      </div>
      {/* Rule-of-thirds overlay */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        <g stroke="rgba(255,255,255,0.2)" strokeWidth="0.3">
          <line x1="33.33" y1="0" x2="33.33" y2="100" />
          <line x1="66.66" y1="0" x2="66.66" y2="100" />
          <line x1="0" y1="33.33" x2="100" y2="33.33" />
          <line x1="0" y1="66.66" x2="100" y2="66.66" />
        </g>
      </svg>
    </div>
  )
}


