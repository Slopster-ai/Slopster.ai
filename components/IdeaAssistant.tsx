"use client"

import * as React from 'react'
import { Button } from './ui/Button'

type Idea = {
  title: string
  hook: string
  outline: string[]
  angle: string
  durationSec: number
  reasoning?: string
}

export interface IdeaAssistantProps {
  platform?: 'tiktok' | 'youtube-shorts' | 'instagram-reels'
  brandContext: Record<string, any>
  purpose: string
  audience: Record<string, any>
  constraints?: Record<string, any>
  onSelect: (idea: Idea) => void
}

export function IdeaAssistant({
  platform = 'tiktok',
  brandContext,
  purpose,
  audience,
  constraints = {},
  onSelect,
}: IdeaAssistantProps) {
  const [loading, setLoading] = React.useState(false)
  const [ideas, setIdeas] = React.useState<Idea[]>([])
  const [error, setError] = React.useState<string | null>(null)

  const generate = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          brand_context: brandContext,
          purpose,
          audience,
          constraints,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to generate ideas')
      setIdeas(json.ideas || [])
    } catch (e: any) {
      setError(e.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Idea Assistant</h3>
        <Button onClick={generate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate ideas'}
        </Button>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="grid gap-3">
        {ideas.map((idea, idx) => (
          <div key={idx} className="rounded-xl hairline p-4 bg-surface">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{idea.title}</div>
                <div className="text-sm text-muted mt-1">Hook: {idea.hook}</div>
                <div className="text-sm text-muted mt-1">Angle: {idea.angle} • {idea.durationSec}s</div>
              </div>
              <Button variant="subtle" onClick={() => onSelect(idea)}>Select</Button>
            </div>
            {Array.isArray(idea.outline) && idea.outline.length > 0 && (
              <ul className="list-disc list-inside text-sm text-muted mt-2">
                {idea.outline.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
            {idea.reasoning && (
              <div className="text-xs text-muted mt-2">{idea.reasoning}</div>
            )}
          </div>
        ))}
        {!loading && ideas.length === 0 && (
          <div className="text-sm text-muted">No ideas yet. Click "Generate ideas" to get started.</div>
        )}
      </div>
    </div>
  )}


