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
  selectedIdea?: Idea | null
}

export function IdeaAssistant({
  platform = 'tiktok',
  brandContext,
  purpose,
  audience,
  constraints = {},
  onSelect,
  selectedIdea,
}: IdeaAssistantProps) {
  const [loading, setLoading] = React.useState(false)
  const [ideas, setIdeas] = React.useState<Idea[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [progress, setProgress] = React.useState(0)
  const [showSlime, setShowSlime] = React.useState(false)

  const generate = async () => {
    setError(null)
    setLoading(true)
    setProgress(0)
    setShowSlime(false)
    
    // Simulate progress (since we don't have actual progress from the API)
    let progressInterval: NodeJS.Timeout | null = null
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          if (progressInterval) clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 200)

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
      const text = await res.text()
      let json: any = null
      try {
        json = text ? JSON.parse(text) : null
      } catch (_) {}
      if (!res.ok) {
        const message = json?.error || text || `Request failed (${res.status})`
        throw new Error(message)
      }
      if (!json) throw new Error('No response from server')
      const ideas = json.ideas || []
      if (ideas.length === 0) {
        throw new Error('Ideas are empty. Please try again.')
      }
      
      // Complete the progress bar and trigger slime effect
      if (progressInterval) clearInterval(progressInterval)
      setProgress(100)
      setShowSlime(true)
      
      // Wait a moment for the slime effect, then set ideas
      setTimeout(() => {
        setIdeas(ideas)
        setLoading(false)
        setShowSlime(false)
        setProgress(0)
      }, 800)
    } catch (e: any) {
      if (progressInterval) clearInterval(progressInterval)
      setError(e.message || 'Unexpected error')
      setLoading(false)
      setProgress(0)
      setShowSlime(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Idea Assistant</h3>
        <Button onClick={generate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate ideas'}
        </Button>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {loading && (
        <div className="space-y-3 rounded-xl hairline p-4 bg-surface">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground mb-2">Generating ideas...</div>
              <div className="relative h-6 w-full rounded-full bg-surface/50 overflow-visible">
                {/* Background track */}
                <div className="absolute inset-0 rounded-full bg-foreground/10" />
                
                {/* Slime progress bar */}
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out ${
                    showSlime 
                      ? 'bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500' 
                      : 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600'
                  }`}
                  style={{ 
                    width: `${Math.min(100, progress)}%`,
                    transition: showSlime ? 'width 0.3s ease-out' : 'width 0.2s linear'
                  }}
                >
                  {/* Slime texture/blobs */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 left-1/4 w-3 h-3 rounded-full bg-white/40 blur-sm animate-pulse" />
                    <div className="absolute bottom-0 right-1/3 w-2 h-2 rounded-full bg-white/30 blur-sm animate-pulse" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
                
                {/* Slime overflow effect when complete */}
                {showSlime && (
                  <>
                    <div 
                      className="absolute top-full left-[calc(100%-8px)] w-4 h-4 rounded-full bg-emerald-400/60 animate-[drip_0.6s_ease-out]"
                      style={{ 
                        animationDelay: '0.1s',
                        boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
                      }}
                    />
                    <div 
                      className="absolute top-full left-[calc(100%-16px)] w-3 h-3 rounded-full bg-green-400/50 animate-[drip_0.5s_ease-out]"
                      style={{ 
                        animationDelay: '0.2s',
                        boxShadow: '0 0 6px rgba(34, 197, 94, 0.4)'
                      }}
                    />
                    <div 
                      className="absolute top-full left-[calc(100%-4px)] w-2 h-2 rounded-full bg-emerald-300/40 animate-[drip_0.7s_ease-out]"
                      style={{ 
                        animationDelay: '0.3s',
                        boxShadow: '0 0 4px rgba(16, 185, 129, 0.3)'
                      }}
                    />
                    {/* Overflow blob at the end */}
                    <div 
                      className="absolute top-0 right-0 h-full w-8 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 animate-[overflow_0.6s_ease-out]"
                      style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 60% 100%, 40% 80%, 0 100%)'
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {ideas.map((idea, idx) => {
          const isSelected = selectedIdea && 
            selectedIdea.title === idea.title && 
            selectedIdea.hook === idea.hook
          return (
            <div 
              key={idx} 
              className={`rounded-xl p-3 transition-all ${
                isSelected 
                  ? 'border-2 border-foreground bg-foreground/10 shadow-md' 
                  : 'hairline bg-surface'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{idea.title}</div>
                  <div className="text-xs text-muted mt-1">Hook: {idea.hook}</div>
                  <div className="text-xs text-muted mt-0.5">Angle: {idea.angle} • {idea.durationSec}s</div>
                  {Array.isArray(idea.outline) && idea.outline.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-muted mt-1.5 space-y-0.5">
                      {idea.outline.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {idea.reasoning && (
                    <div className="text-xs text-muted mt-1.5 line-clamp-2">{idea.reasoning}</div>
                  )}
                </div>
                <Button 
                  variant={isSelected ? "primary" : "subtle"} 
                  size="sm" 
                  onClick={() => onSelect(idea)} 
                  className="flex-shrink-0"
                >
                  {isSelected ? 'Selected' : 'Select'}
                </Button>
              </div>
            </div>
          )
        })}
        {!loading && ideas.length === 0 && (
          <div className="text-sm text-muted">No ideas yet. Click &quot;Generate ideas&quot; to get started.</div>
        )}
      </div>
    </div>
  )}



