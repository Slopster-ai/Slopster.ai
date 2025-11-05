"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from './ui/Button'
import { Label, Input, Select, Textarea } from './ui/Form'

type Settings = {
  prompt?: string
  platform: 'tiktok' | 'youtube-shorts' | 'instagram-reels'
  duration: number
  tone: 'casual' | 'professional' | 'humorous' | 'inspirational'
}

export default function ScriptEditor({
  scriptId,
  initialText,
  initialSettings,
}: {
  scriptId: string
  initialText: string
  initialSettings: Settings
}) {
  const [text, setText] = useState(initialText)
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [sel, setSel] = useState<{ start: number; end: number } | null>(null)
  const [selText, setSelText] = useState('')

  useEffect(() => {
    if (saved === 'saved') {
      const t = setTimeout(() => setSaved('idle'), 1500)
      return () => clearTimeout(t)
    }
  }, [saved])

  function getSelectionRange() {
    const el = textareaRef.current
    if (!el) return null
    const start = el.selectionStart
    const end = el.selectionEnd
    if (start == null || end == null || start === end) return null
    return { start, end }
  }

  function snapshotSelection() {
    const range = getSelectionRange()
    if (range) {
      setSel(range)
      setSelText(text.slice(range.start, range.end))
    } else {
      setSel(null)
      setSelText('')
    }
  }

  async function rewriteSelection(e: React.FormEvent) {
    e.preventDefault()
    const range = sel ?? getSelectionRange()
    if (!range) return
    setLoading(true)
    try {
      const res = await fetch('/api/scripts/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          selectionStart: range.start,
          selectionEnd: range.end,
          instruction,
        }),
      })
      const data = await res.json()
      if (data?.text) {
        setText(data.text)
        setInstruction('')
        setSel(null)
        setSelText('')
      }
    } finally {
      setLoading(false)
    }
  }

  async function saveEdits() {
    setSaved('saving')
    try {
      const res = await fetch(`/api/scripts/${scriptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edited_text: text }),
      })
      if (!res.ok) throw new Error('Failed')
      setSaved('saved')
    } catch {
      setSaved('error')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="surface hairline rounded-2xl p-4 lg:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Script</h2>
          <div className="flex items-center gap-2">
            <Button onClick={saveEdits} disabled={saved === 'saving'}>
              {saved === 'saving' ? 'Saving…' : saved === 'saved' ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onSelect={snapshotSelection}
          rows={22}
          className="min-h-[60vh]"
        />

        {sel && selText && (
          <div className="mt-3 rounded-xl hairline p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted">Selected ({sel.end - sel.start} chars)</span>
              <button
                type="button"
                onClick={() => { setSel(null); setSelText('') }}
                className="text-muted hover:text-foreground"
              >
                Clear
              </button>
            </div>
            <div className="mt-2 max-h-28 overflow-auto rounded-lg bg-surface p-2 text-foreground whitespace-pre-wrap">
              {selText}
            </div>
          </div>
        )}

        <form onSubmit={rewriteSelection} className="mt-4 flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Ask AI to rewrite selection (e.g., make this more detailed)"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onMouseDown={snapshotSelection}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !instruction.trim()} onMouseDown={snapshotSelection}>
            {loading ? 'Rewriting…' : 'Rewrite selection'}
          </Button>
        </form>
      </div>

      <aside className="surface hairline rounded-2xl p-4 lg:p-6">
        <h3 className="text-base font-medium mb-3">Settings</h3>
        <div className="space-y-4">
          <div>
            <Label className="mb-1">Original prompt</Label>
            <Textarea value={settings.prompt || ''} onChange={(e) => setSettings(s => ({ ...s, prompt: e.target.value }))} rows={5} />
          </div>
          <div>
            <Label className="mb-1">Tone</Label>
            <Select value={settings.tone} onChange={(e) => setSettings(s => ({ ...s, tone: e.target.value as any }))}>
              <option value="casual">Casual</option>
              <option value="professional">Professional</option>
              <option value="humorous">Humorous</option>
              <option value="inspirational">Inspirational</option>
            </Select>
          </div>
          <div>
            <Label className="mb-1">Platform</Label>
            <Select value={settings.platform} onChange={(e) => setSettings(s => ({ ...s, platform: e.target.value as any }))}>
              <option value="tiktok">TikTok</option>
              <option value="youtube-shorts">YouTube Shorts</option>
              <option value="instagram-reels">Instagram Reels</option>
            </Select>
          </div>
          <div>
            <Label className="mb-1">Duration ({settings.duration}s)</Label>
            <input
              type="range"
              min={15}
              max={180}
              step={5}
              value={settings.duration}
              onChange={(e) => setSettings(s => ({ ...s, duration: parseInt(e.target.value) }))}
              className="w-full accent-foreground"
            />
          </div>
          <div className="pt-2">
            <Button
              type="button"
              disabled={!settings.prompt || loading}
              onClick={async () => {
                setLoading(true)
                try {
                  const res = await fetch('/api/scripts/regenerate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      prompt: settings.prompt,
                      platform: settings.platform,
                      duration: settings.duration,
                      tone: settings.tone,
                    }),
                  })
                  const data = await res.json()
                  if (data?.text) {
                    setText(data.text)
                    setSel(null)
                    setSelText('')
                    setSaved('idle')
                  }
                } finally {
                  setLoading(false)
                }
              }}
            >
              {loading ? 'Regenerating…' : 'Regenerate'}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  )
}


