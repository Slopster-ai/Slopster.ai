"use client"

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import ContinueToShoot from './ContinueToShoot'
import { Button } from './ui/Button'

const ScriptEditor = dynamic(() => import('./ScriptEditor'), { ssr: false })

type ScriptRecord = {
  id: string
  platform: string
  duration: number
  tone: string
  cost?: number
  content: any
}

function toText(content: any): string {
  try {
    if (!content) return ''
    if (typeof content.edited_text === 'string') return content.edited_text
    const parts: string[] = []
    if (content.hook) parts.push(`HOOK:\n${content.hook}\n`)
    if (Array.isArray(content.body)) {
      parts.push('BODY:')
      for (const line of content.body) parts.push(`- ${line}`)
      parts.push('')
    }
    if (content.cta) parts.push(`CTA:\n${content.cta}`)
    return parts.join('\n')
  } catch {
    return typeof content === 'string' ? content : JSON.stringify(content, null, 2)
  }
}

export default function InlineScriptEditor({ scripts, projectId }: { scripts: ScriptRecord[]; projectId: string }) {
  const [scriptList, setScriptList] = useState<ScriptRecord[]>(scripts)
  const [selectedId, setSelectedId] = useState<string | null>(scripts?.[0]?.id || null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const selected = useMemo(
    () => scriptList.find(s => s.id === selectedId) || scriptList[0] || null,
    [scriptList, selectedId]
  )

  if (!scriptList || scriptList.length === 0 || !selected) return null

  const initialText = toText(selected.content)
  const initialSettings = {
    prompt: selected.content?.original_prompt || '',
    platform: selected.platform,
    duration: selected.duration,
    tone: selected.tone,
  } as const

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {scriptList.map((s) => {
          const content: any = s.content || {}
          const raw = typeof content.edited_text === 'string'
            ? content.edited_text as string
            : toText(content)
          const preview = raw.length > 120 ? raw.slice(0, 120) + '…' : raw
          const active = s.id === selected.id
          return (
            <div
              key={s.id}
              className={`w-full text-left p-3 rounded-xl border transition ${
                active
                  ? 'border-emerald-400 bg-emerald-400/10 shadow-[0_8px_30px_rgba(16,185,129,0.2)]'
                  : 'border-white/10 bg-surface hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span className="capitalize">{s.platform} • {s.duration}s • {s.tone}</span>
                {typeof s.cost === 'number' && <span>${s.cost.toFixed(4)}</span>}
              </div>
              <div className="text-sm whitespace-pre-wrap text-foreground/80 mb-2">{preview || 'No preview available.'}</div>
              <div className="flex gap-2">
                <Button
                  variant={active ? 'secondary' : 'subtle'}
                  size="sm"
                  onClick={() => setSelectedId(s.id)}
                  className={`flex-1 ${active ? 'bg-emerald-500/90 text-white hover:bg-emerald-500' : ''}`}
                >
                  {active ? 'Editing' : 'Edit here'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    setDeleteError(null)
                    setDeletingId(s.id)
                    try {
                      const res = await fetch(`/api/scripts/${s.id}`, { method: 'DELETE' })
                      const body = await res.json().catch(() => ({}))
                      if (!res.ok) throw new Error(body?.error || 'Delete failed')
                      setScriptList((prev) => prev.filter((x) => x.id !== s.id))
                      if (selectedId === s.id) {
                        const next = scriptList.find((x) => x.id !== s.id)
                        setSelectedId(next ? next.id : null)
                      }
                    } catch (err: any) {
                      setDeleteError(err?.message || 'Delete failed')
                    } finally {
                      setDeletingId(null)
                    }
                  }}
                  disabled={deletingId === s.id}
                >
                  {deletingId === s.id ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </div>
          )
        })}
        {deleteError && <div className="text-xs text-red-500">{deleteError}</div>}
      </div>

      <div className="rounded-2xl border border-white/10 bg-surface p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-sm font-medium">Inline script editor</div>
          <ContinueToShoot projectId={projectId} />
        </div>
        <ScriptEditor
          key={selected.id}
          scriptId={selected.id}
          initialText={initialText}
          initialSettings={initialSettings as any}
        />
      </div>
    </div>
  )
}

