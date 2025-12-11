"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/Button'
import { Input, Label, Textarea } from './ui/Form'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'

// In-memory cache to persist results across client-side navigation without storage limits
const resultCache = new Map<string, Result>()
const scriptCache = new Map<string, string>()
const RESUME_EVENT = 'ai-content-resume'

type SubtitleLine = { start: string; end: string; text: string }
type StoryboardImage = { title: string; prompt: string; imageBase64: string }

type Result = {
  voiceoverScript: string
  caption: string
  subtitles: SubtitleLine[]
  audioBase64: string
  storyboard: StoryboardImage[]
}

export function AIContentGenerator({
  projectId,
  initialScript,
  showFinalStage = true,
  showResultBlocks = true,
  showScriptInput = true,
  enableResumeEventTrigger = false,
  autoRender = false,
  autoResume = false,
}: {
  projectId: string
  initialScript: string
  showFinalStage?: boolean
  showResultBlocks?: boolean
  showScriptInput?: boolean
  enableResumeEventTrigger?: boolean
  autoRender?: boolean
  autoResume?: boolean
}) {
  const [scriptText, setScriptText] = useState(initialScript || '')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)
  const [renderStatus, setRenderStatus] = useState<string>('Ready')
  const [renderError, setRenderError] = useState<string | null>(null)
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const [qualityPreset, setQualityPreset] = useState<'fast' | 'balanced' | 'best'>('balanced')
  const autoRenderTriggered = useRef(false)
  const [animating, setAnimating] = useState(false)
  const [animationStatus, setAnimationStatus] = useState<string>('Ready')
  const [animationError, setAnimationError] = useState<string | null>(null)
  const autoResumeTriggered = useRef(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [renderResolution, setRenderResolution] = useState<'desktop' | 'mobile'>('desktop')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const storageKey = typeof window !== 'undefined' ? `ai-gen-${projectId}` : ''
  const scriptStorageKey = typeof window !== 'undefined' ? `ai-gen-script-${projectId}` : ''

  useEffect(() => {
    return () => {
      if (finalVideoUrl) URL.revokeObjectURL(finalVideoUrl)
    }
  }, [finalVideoUrl])

  // Hydrate script text only (resume is opt-in via Resume button)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const cachedScript = scriptCache.get(projectId)
      if (cachedScript) setScriptText(cachedScript)
      else if (scriptStorageKey) {
        const savedScript = sessionStorage.getItem(scriptStorageKey)
        if (savedScript) {
          setScriptText(savedScript)
          scriptCache.set(projectId, savedScript)
        }
      }
    } catch {
      // ignore hydration errors
    }
  }, [scriptStorageKey, projectId])

  // Persist result and script locally so navigation does not wipe generated assets
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (result) {
        resultCache.set(projectId, result)
      }
      if (scriptStorageKey) {
        sessionStorage.setItem(scriptStorageKey, scriptText)
        scriptCache.set(projectId, scriptText)
      }
    } catch {
      // best-effort; ignore storage errors
    }
  }, [result, scriptText, storageKey, scriptStorageKey, projectId])

  useEffect(() => {
    // Reset final render when a new AI result replaces prior assets
    if (finalVideoUrl) {
      URL.revokeObjectURL(finalVideoUrl)
      setFinalVideoUrl(null)
    }
    setRenderError(null)
    setRenderStatus('Ready')
  }, [result?.audioBase64, result?.storyboard, result?.subtitles])

  useEffect(() => {
    if (!autoRender || autoRenderTriggered.current) return
    if (showFinalStage && result) {
      autoRenderTriggered.current = true
      renderFinalVideo()
    }
  }, [autoRender, showFinalStage, result])

  useEffect(() => {
    if (!autoResume || autoResumeTriggered.current) return
    if (!result) {
      autoResumeTriggered.current = true
      resumeGeneration().catch(() => {})
    }
  }, [autoResume, result])

  function clearGeneration() {
    setResult(null)
    setFinalVideoUrl(null)
    setRenderError(null)
    setRenderStatus('Ready')
    setAnimationError(null)
    setAnimationStatus('Ready')
    autoRenderTriggered.current = false
    if (storageKey && typeof window !== 'undefined') sessionStorage.removeItem(storageKey)
    if (scriptStorageKey && typeof window !== 'undefined') sessionStorage.removeItem(scriptStorageKey)
    resultCache.delete(projectId)
  }

  async function handleGenerate() {
    clearGeneration()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, script: scriptText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to generate')
      setResult({
        voiceoverScript: data.voiceoverScript,
        caption: data.caption,
        subtitles: data.subtitles,
        audioBase64: data.audioBase64,
        storyboard: data.storyboard,
      })
      // Persist to server
      try {
        fetch('/api/content/generation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            payload: {
              voiceoverScript: data.voiceoverScript,
              caption: data.caption,
              subtitles: data.subtitles,
              audioBase64: data.audioBase64,
              storyboard: data.storyboard,
              scriptText,
              qualityPreset,
            },
          }),
        }).catch(() => {})
      } catch {
        // ignore persistence errors
      }
    } catch (e: any) {
      setError(e?.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaveError(null)
    setSaveStatus('saving')
    try {
      const payload = result
        ? { ...result, scriptText, qualityPreset }
        : { scriptText }
      const res = await fetch('/api/content/generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to save')
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1200)
    } catch (e: any) {
      setSaveStatus('error')
      setSaveError(e?.message || 'Failed to save')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  async function resumeGeneration() {
    setResumeError(null)
    setResumeLoading(true)
    try {
      const res = await fetch(`/api/content/generation?projectId=${projectId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Could not load last generation')
      }
      const data = await res.json()
      const payload = data?.payload
      if (!payload || !payload.audioBase64 || !payload.storyboard || !payload.subtitles) {
        throw new Error('No previous generation found')
      }
      setResult({
        voiceoverScript: payload.voiceoverScript,
        caption: payload.caption,
        subtitles: payload.subtitles,
        audioBase64: payload.audioBase64,
        storyboard: payload.storyboard,
      })
      if (payload.scriptText) {
        setScriptText(payload.scriptText)
        scriptCache.set(projectId, payload.scriptText)
      }
      if (payload.qualityPreset) {
        setQualityPreset(payload.qualityPreset)
      }
      resultCache.set(projectId, payload)
      if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify(payload))
      if (scriptStorageKey && payload.scriptText) sessionStorage.setItem(scriptStorageKey, payload.scriptText)
    } catch (e: any) {
      setResumeError(e?.message || 'Failed to resume')
    } finally {
      setResumeLoading(false)
    }
  }

  useEffect(() => {
    if (!enableResumeEventTrigger || typeof window === 'undefined') return
    const handler = () => resumeGeneration()
    window.addEventListener(RESUME_EVENT, handler)
    return () => window.removeEventListener(RESUME_EVENT, handler)
  }, [enableResumeEventTrigger])

  function downloadAudio() {
    if (!result?.audioBase64) return
    const a = document.createElement('a')
    a.href = `data:audio/mpeg;base64,${result.audioBase64}`
    a.download = 'voiceover.mp3'
    a.click()
  }

  function downloadSrt() {
    if (!result?.subtitles?.length) return
    const srt = result.subtitles
      .map((line, idx) => `${idx + 1}\n${line.start} --> ${line.end}\n${line.text}\n`)
      .join('\n')
    const blob = new Blob([srt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subtitles.srt'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setScriptText((prev) => (prev ? `${prev}\n\n${text}` : text))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function parseTimestampToSeconds(ts: string) {
    const clean = ts.replace(',', '.')
    const parts = clean.split(':').map(Number)
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return Number(ts) || 0
  }

  function getResolution() {
    return renderResolution === 'desktop'
      ? { width: 1920, height: 1080, aspect: '16 / 9' }
      : { width: 1080, height: 1920, aspect: '9 / 16' }
  }

  async function createVideoFromAssets(current: Result, dims: { width: number; height: number }) {
    const canvas = document.createElement('canvas')
    canvas.width = dims.width
    canvas.height = dims.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    // Load storyboard images
    const images = await Promise.all(
      current.storyboard.map(
        (img) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image()
            i.onload = () => resolve(i)
            i.onerror = reject
            i.src = `data:image/png;base64,${img.imageBase64}`
          })
      )
    )

    // Prepare audio element and audio context
    const audio = new Audio(`data:audio/mpeg;base64,${current.audioBase64}`)
    await new Promise<void>((resolve, reject) => {
      audio.onloadedmetadata = () => resolve()
      audio.onerror = () => reject(new Error('Failed to load audio'))
      audio.load()
    })

    const audioCtx = new AudioContext()
    await audioCtx.resume()
    const source = audioCtx.createMediaElementSource(audio)
    const dest = audioCtx.createMediaStreamDestination()
    source.connect(dest)
    source.connect(audioCtx.destination)

    const canvasStream = canvas.captureStream(30)
    const mixedStream = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()])
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm'
    const recorder = new MediaRecorder(mixedStream, { mimeType })
    const chunks: BlobPart[] = []

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data)
    }

    const findSubtitle = (t: number) => {
      const match = current.subtitles.find((s) => {
        const start = parseTimestampToSeconds(s.start)
        const end = parseTimestampToSeconds(s.end)
        return t >= start && t <= end
      })
      return match?.text || ''
    }

    const frameDuration = Math.max(audio.duration / Math.max(images.length, 1), 0.75)
    let rafId = 0

    const drawFrame = () => {
      const t = audio.currentTime
      let img: HTMLImageElement | null = null
      if (images.length > 0) {
        const idx = Math.min(images.length - 1, Math.floor(t / frameDuration))
        img = images[idx] || images[images.length - 1] || null
      }

      ctx.fillStyle = '#020617'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (img) {
        const targetHeight = canvas.height
        const targetWidth = (img.width / img.height) * targetHeight
        const x = (canvas.width - targetWidth) / 2
        ctx.drawImage(img, x, 0, targetWidth, targetHeight)
      }

      // Subtitle overlay
      const subtitle = findSubtitle(t)
      if (subtitle) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(60, canvas.height - 220, canvas.width - 120, 140)
        ctx.fillStyle = '#F8FAFC'
        ctx.font = 'bold 42px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(subtitle, canvas.width / 2, canvas.height - 150)
      }

      rafId = requestAnimationFrame(drawFrame)
    }

    const recordingFinished = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
    })

    recorder.start(200)
    await audio.play()
    drawFrame()

    await new Promise<void>((resolve) => {
      audio.onended = () => {
        cancelAnimationFrame(rafId)
        recorder.stop()
        resolve()
      }
    })

    await recordingFinished

    const blob = new Blob(chunks, { type: mimeType })
    const url = URL.createObjectURL(blob)
    return url
  }

  async function renderFinalVideo() {
    if (!result) {
      setRenderError('Generate content first, then render the final video.')
      return
    }
    setRendering(true)
    setRenderError(null)
    setRenderStatus('Requesting render…')
    try {
      const res = await fetch('/api/content/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          audioBase64: result.audioBase64,
          storyboard: result.storyboard,
          subtitles: result.subtitles,
          feedback,
          qualityPreset,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Render request failed')
      }
      setRenderStatus('Composing preview locally…')
      const url = await createVideoFromAssets(result, getResolution())
      if (finalVideoUrl) URL.revokeObjectURL(finalVideoUrl)
      setFinalVideoUrl(url)
      setRenderStatus('Render complete')
    } catch (e: any) {
      setRenderError(e?.message || 'Render failed')
      setRenderStatus('Render failed')
    } finally {
      setRendering(false)
    }
  }

  return (
    <div className="relative space-y-6">
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-2xl bg-emerald-500/10 backdrop-blur-xl border border-emerald-300/20 shadow-[0_10px_60px_rgba(16,185,129,0.25)]">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-emerald-400/70 blur-[1px] animate-pulse shadow-[0_0_40px_rgba(16,185,129,0.35)]" />
            <div className="absolute inset-[-10px] rounded-full border-2 border-emerald-300/50 animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-[6px] rounded-full border border-emerald-200/40 animate-[spin_5s_linear_infinite_reverse]" />
            <div className="absolute inset-[12px] rounded-full bg-gradient-to-br from-emerald-200/60 to-emerald-500/50" />
          </div>
          <div className="text-lg font-semibold text-emerald-100 drop-shadow">Curating your Slopster AI magic…</div>
          <div className="text-xs text-emerald-50/80 text-center max-w-xs">
            This may take a moment — we&apos;re shaping your ideas into a crisp Slopster-ready cut. It can take up to 5–10 minutes.
          </div>
          <div className="w-64 h-3 rounded-full bg-white/10 border border-emerald-200/40 overflow-hidden glass-sheen">
            <div className="slime-bar h-full w-full rounded-full" />
          </div>
          <div className="text-xs text-emerald-50/80">Voiceover · Captions · Storyboard</div>
        </div>
      )}
      {showFinalStage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted mb-1">Stage 7</p>
                <span className="text-lg font-semibold">Final Video</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{renderStatus}</Badge>
                <Button onClick={renderFinalVideo} disabled={rendering || !result}>
                  {rendering ? 'Rendering…' : finalVideoUrl ? 'Regenerate video' : 'Render final video'}
                </Button>
              </div>
            </CardTitle>
            {rendering && (
              <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-100 text-xs px-3 py-2">
                {renderStatus || 'Rendering…'}
              </div>
            )}
            {renderError && (
              <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-100 text-xs px-3 py-2">
                {renderError}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="rounded-2xl bg-black/80 hairline overflow-hidden flex items-center justify-center relative"
              style={{ aspectRatio: renderResolution === 'desktop' ? '16 / 9' : '9 / 16' }}
            >
              {finalVideoUrl ? (
                <video controls className="w-full h-full object-contain bg-black" src={finalVideoUrl} />
              ) : (
                <div className="text-center space-y-2 p-6 text-sm text-emerald-50/80">
                  <div className="text-base font-medium text-emerald-100">Render a full preview</div>
                  <div>Run the render to stitch storyboard frames, voiceover, and subtitles.</div>
                </div>
              )}
              {renderError && (
                <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-red-900/70 text-red-50 text-xs p-3">
                  {renderError}
                </div>
              )}
            </div>
            <div className="rounded-2xl hairline bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Regenerate video</p>
                <Badge variant="subtle">Optional notes</Badge>
              </div>
              <p className="text-xs text-muted">
                Tell the AI what felt off (timing, captions, pacing, frames). Your note is sent with the regenerate request.
              </p>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="uppercase tracking-wide">Resolution:</span>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="render-resolution"
                      value="desktop"
                      checked={renderResolution === 'desktop'}
                      onChange={() => setRenderResolution('desktop')}
                    />
                    Desktop (1920x1080)
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="render-resolution"
                      value="mobile"
                      checked={renderResolution === 'mobile'}
                      onChange={() => setRenderResolution('mobile')}
                    />
                    Mobile (1080x1920)
                  </label>
                </div>
              </div>
              <Textarea
                placeholder="E.g., captions are late on Frame 2; pacing too slow; swap Frame 3 image."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
              />
              <Button onClick={renderFinalVideo} disabled={rendering || !result} className="w-full">
                {rendering ? 'Regenerating…' : finalVideoUrl ? 'Regenerate video' : 'Render video'}
              </Button>
              <div className="text-[11px] text-muted">
                We’ll try to apply your notes in this pass. If it still looks off, refine and regenerate again.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {showScriptInput && (
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>Script input</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button variant="ghost" size="sm" onClick={clearGeneration}>
                Start fresh
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={resumeGeneration}
                disabled={resumeLoading}
              >
                {resumeLoading ? 'Loading…' : 'Resume last generation'}
              </Button>
              {resumeError && <span className="text-destructive text-xs">{resumeError}</span>}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {resumeError && <span className="text-destructive text-xs">{resumeError}</span>}
            <Textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              rows={10}
              placeholder="Paste your script here..."
            />
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <Label className="text-sm">Or upload a text file</Label>
                <Input type="file" accept=".txt,.md" ref={fileInputRef} onChange={handleFileUpload} />
              </div>
              <div className="flex flex-1 flex-col gap-2 min-w-[240px]">
                <Label className="text-xs text-muted">Speed vs quality</Label>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted uppercase tracking-wide">Faster</span>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={1}
                    value={qualityPreset === 'fast' ? 0 : qualityPreset === 'balanced' ? 1 : 2}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setQualityPreset(v === 0 ? 'fast' : v === 1 ? 'balanced' : 'best')
                    }}
                    className="flex-1 accent-emerald-400"
                    aria-label="Speed versus quality"
                  />
                  <span className="text-[11px] text-muted uppercase tracking-wide">Quality</span>
                </div>
                <div className="text-xs text-muted">
                  {qualityPreset === 'fast'
                    ? 'Fastest, lower fidelity.'
                    : qualityPreset === 'balanced'
                    ? 'Balanced speed and quality.'
                    : 'Best quality, slower processing.'}
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={!scriptText.trim() || loading}>
                {loading ? 'Generating…' : 'Generate AI content'}
              </Button>
              {error && <span className="text-destructive text-sm">{error}</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {showResultBlocks && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Voiceover
                <Button variant="secondary" size="sm" onClick={downloadAudio} disabled={!result}>
                  Download MP3
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative group">
              {result?.audioBase64 ? (
                <>
                  <audio controls src={`data:audio/mpeg;base64,${result.audioBase64}`} className="w-full" />
                  <div className="rounded-xl bg-surface p-3 text-sm whitespace-pre-wrap hairline">
                    {result.voiceoverScript}
                  </div>
                </>
              ) : (
                <div className="rounded-xl bg-surface p-4 text-sm text-muted hairline min-h-[120px]">
                  <span className="sr-only">Nothing here yet — press Generate AI content.</span>
                </div>
              )}
              {!result && (
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity text-sm text-emerald-50 flex items-center justify-center text-center px-4">
                  Nothing here yet — press Generate AI content.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Captions & Subtitles
                <Button variant="secondary" size="sm" onClick={downloadSrt} disabled={!result}>
                  Download SRT
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative group">
              <div className="rounded-xl bg-surface p-3 hairline">
                <p className="text-sm font-medium mb-1">Social caption</p>
                <p className="text-sm whitespace-pre-wrap min-h-[48px]">
                  {result?.caption || ''}
                  {!result?.caption && <span className="sr-only">Nothing here yet — press Generate AI content.</span>}
                </p>
              </div>
              <div className="space-y-2 max-h-64 overflow-auto">
                {result?.subtitles?.length ? (
                  result.subtitles.map((line, idx) => (
                    <div key={`${line.start}-${idx}`} className="rounded-lg bg-surface p-2 text-xs hairline">
                      <div className="flex items-center justify-between text-muted mb-1">
                        <span>{idx + 1}</span>
                        <span>{line.start} → {line.end}</span>
                      </div>
                      <div className="text-foreground">{line.text}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-surface/70 p-3 text-xs text-muted hairline min-h-[72px]">
                    <span className="sr-only">Nothing here yet — press Generate AI content.</span>
                  </div>
                )}
              </div>
              {!result && (
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity text-sm text-emerald-50 flex items-center justify-center text-center px-4">
                  Nothing here yet — press Generate AI content.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Storyboard images</CardTitle>
            </CardHeader>
            <CardContent className="relative group">
              {result?.storyboard?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.storyboard.map((img, idx) => (
                    <div key={`${img.title}-${idx}`} className="rounded-xl overflow-hidden hairline bg-surface">
                      <img
                        src={`data:image/png;base64,${img.imageBase64}`}
                        alt={img.title || 'Storyboard frame'}
                        className="w-full aspect-video object-contain bg-black"
                      />
                      <div className="p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{img.title || `Frame ${idx + 1}`}</p>
                          <Badge variant="subtle">Frame {idx + 1}</Badge>
                        </div>
                        <p className="text-xs text-muted line-clamp-2">{img.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-surface p-4 text-sm text-muted hairline min-h-[200px]">
                  <span className="sr-only">Nothing here yet — press Generate AI content.</span>
                </div>
              )}
              {!result && (
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity text-sm text-emerald-50 flex items-center justify-center text-center px-4">
                  Nothing here yet — press Generate AI content.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs text-muted">
          Save your latest AI content (voiceover, captions, storyboard) for this project.
        </div>
        <div className="flex items-center gap-2">
          {saveError && <span className="text-destructive text-xs">{saveError}</span>}
          <Button onClick={handleSave} disabled={saveStatus === 'saving'} size="lg" className="px-6">
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

