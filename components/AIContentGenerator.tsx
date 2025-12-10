"use client"

import { useState, useRef } from 'react'
import { Button } from './ui/Button'
import { Input, Label, Textarea } from './ui/Form'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'

type SubtitleLine = { start: string; end: string; text: string }
type StoryboardImage = { title: string; prompt: string; imageBase64: string }

type Result = {
  voiceoverScript: string
  caption: string
  subtitles: SubtitleLine[]
  audioBase64: string
  storyboard: StoryboardImage[]
}

export function AIContentGenerator({ projectId, initialScript }: { projectId: string; initialScript: string }) {
  const [scriptText, setScriptText] = useState(initialScript || '')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function handleGenerate() {
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
    } catch (e: any) {
      setError(e?.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="relative space-y-6">
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-2xl bg-emerald-500/10 backdrop-blur-xl border border-emerald-300/20 shadow-[0_10px_60px_rgba(16,185,129,0.25)]">
          <div className="text-lg font-semibold text-emerald-100 drop-shadow">Brewing your AI content…</div>
          <div className="w-64 h-3 rounded-full bg-white/10 border border-emerald-200/40 overflow-hidden glass-sheen">
            <div className="slime-bar h-full w-full rounded-full" />
          </div>
          <div className="text-xs text-emerald-50/80">Voiceover · Captions · Storyboard</div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Script input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
            <Button onClick={handleGenerate} disabled={!scriptText.trim() || loading}>
              {loading ? 'Generating…' : 'Generate AI content'}
            </Button>
            {error && <span className="text-destructive text-sm">{error}</span>}
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Voiceover
                <Button variant="secondary" size="sm" onClick={downloadAudio}>
                  Download MP3
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <audio controls src={`data:audio/mpeg;base64,${result.audioBase64}`} className="w-full" />
              <div className="rounded-xl bg-surface p-3 text-sm whitespace-pre-wrap hairline">
                {result.voiceoverScript}
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Captions & Subtitles
                <Button variant="secondary" size="sm" onClick={downloadSrt}>
                  Download SRT
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl bg-surface p-3 hairline">
                <p className="text-sm font-medium mb-1">Social caption</p>
                <p className="text-sm whitespace-pre-wrap">{result.caption}</p>
              </div>
              <div className="space-y-2 max-h-64 overflow-auto">
                {result.subtitles.map((line, idx) => (
                  <div key={`${line.start}-${idx}`} className="rounded-lg bg-surface p-2 text-xs hairline">
                    <div className="flex items-center justify-between text-muted mb-1">
                      <span>{idx + 1}</span>
                      <span>{line.start} → {line.end}</span>
                    </div>
                    <div className="text-foreground">{line.text}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Storyboard images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.storyboard.map((img, idx) => (
                  <div key={`${img.title}-${idx}`} className="rounded-xl overflow-hidden hairline bg-surface">
                    <img
                      src={`data:image/png;base64,${img.imageBase64}`}
                      alt={img.title || 'Storyboard frame'}
                      className="w-full aspect-video object-cover"
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

