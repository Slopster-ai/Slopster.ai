'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { Label, Input, Textarea, Select } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { IdeaAssistant } from '@/components/IdeaAssistant'

type Idea = {
  title: string
  hook: string
  outline: string[]
  angle: string
  durationSec: number
  reasoning?: string
}

export default function StrategyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const projectId = params.id

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Brand/profile context
  const [brandVoice, setBrandVoice] = React.useState('')
  const [channelSummary, setChannelSummary] = React.useState('')

  // Strategy fields
  const [purpose, setPurpose] = React.useState('education')
  const [audienceDesc, setAudienceDesc] = React.useState('')
  const [platform, setPlatform] = React.useState<'tiktok' | 'youtube-shorts' | 'instagram-reels'>('tiktok')
  const [constraints, setConstraints] = React.useState<Record<string, any>>({
    maxSeconds: 45,
    orientation: 'vertical',
    requireQuickHook: true,
  })
  const [selectedIdea, setSelectedIdea] = React.useState<Idea | null>(null)

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const strategyRes = await fetch(`/api/projects/${projectId}/strategy`)
        const strategy = await strategyRes.json()

        if (!strategyRes.ok) throw new Error(strategy.error || 'Failed to load strategy')

        const sc = strategy.strategy_context || {}
        
        // Only load brand context from strategy, not from profile (reset per project)
        if (sc.brandVoice) setBrandVoice(sc.brandVoice)
        if (sc.channelSummary) setChannelSummary(sc.channelSummary)
        
        // Load strategy-specific fields
        if (sc.purpose) setPurpose(sc.purpose)
        if (sc.audience?.description) setAudienceDesc(sc.audience.description)
        if (sc.platform) setPlatform(sc.platform)
        if (sc.constraints) setConstraints(sc.constraints)
        if (sc.selectedIdea) setSelectedIdea(sc.selectedIdea)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      // Save strategy (including brand context per project)
      const strategy_context = {
        brandVoice,
        channelSummary,
        platform,
        purpose,
        audience: { description: audienceDesc },
        constraints,
        selectedIdea: selectedIdea || undefined,
      }
      const res = await fetch(`/api/projects/${projectId}/strategy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy_context }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || 'Failed to save strategy')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleContinue = async () => {
    if (!selectedIdea) return
    setSaving(true)
    setError(null)
    try {
      // Save and advance flow stage
      const strategy_context = {
        platform,
        purpose,
        audience: { description: audienceDesc },
        constraints,
        selectedIdea,
      }
      const res = await fetch(`/api/projects/${projectId}/strategy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy_context, confirm: true }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || 'Failed to confirm strategy')
      }

      // Auto-generate initial script draft
      const parts: string[] = []
      if (brandVoice) parts.push(`Brand voice: ${brandVoice}`)
      if (channelSummary) parts.push(`Channel: ${channelSummary}`)
      parts.push(`Purpose: ${purpose}`)
      if (audienceDesc) parts.push(`Audience: ${audienceDesc}`)
      parts.push(`Idea: ${selectedIdea.title}`)
      if (selectedIdea.hook) parts.push(`Hook: ${selectedIdea.hook}`)
      if (Array.isArray(selectedIdea.outline)) {
        parts.push('Outline:')
        for (const b of selectedIdea.outline) parts.push(`- ${b}`)
      }
      const seedPrompt = parts.join('\n')

      const gen = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          prompt: seedPrompt,
          platform,
          duration: Math.max(15, Math.min(180, Number(selectedIdea.durationSec) || 30)),
          tone: 'casual',
        }),
      })
      const genJson = await gen.json()
      if (!gen.ok) throw new Error(genJson.error || 'Failed to generate script')

      router.push(`/projects/${projectId}/scripts/${genJson.script.id}`)
    } catch (e: any) {
      setError(e.message || 'Failed to continue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container>
      <div className="py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-medium">Stage 1: Idea & Strategy</h1>
          <p className="text-sm text-muted mt-1">Define your audience and purpose, then generate and select an idea.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl hairline p-3 text-sm text-red-500">{error}</div>
        )}

        {loading ? (
          <div className="text-sm text-muted">Loading…</div>
        ) : (
          <div className="space-y-8">
            <div className="flex gap-3 w-full">
              <Button onClick={handleSave} disabled={saving} className="flex-1">Save</Button>
              <Button onClick={handleContinue} disabled={saving || !selectedIdea} className="flex-1">
                Continue to Script
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-8">
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold">Brand context</h2>
                <div>
                  <Label className="mb-1" htmlFor="brandVoice">Brand voice</Label>
                  <Select id="brandVoice" value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)}>
                    <option value="">Select a brand voice</option>
                    <option value="friendly">Friendly</option>
                    <option value="formal">Formal</option>
                    <option value="expert">Expert</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="witty">Witty</option>
                    <option value="inspirational">Inspirational</option>
                    <option value="conversational">Conversational</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="playful">Playful</option>
                    <option value="empathetic">Empathetic</option>
                    <option value="confident">Confident</option>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1" htmlFor="channelSummary">Channel summary</Label>
                  <Textarea id="channelSummary" rows={3} value={channelSummary} onChange={(e) => setChannelSummary(e.target.value)} placeholder="What is your channel about?" />
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Audience & purpose</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1" htmlFor="purpose">Purpose</Label>
                    <Select id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                      <option value="education">Education</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="promotion">Promotion</option>
                      <option value="storytelling">Storytelling</option>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1" htmlFor="platform">Platform</Label>
                    <Select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
                      <option value="tiktok">TikTok</option>
                      <option value="youtube-shorts">YouTube Shorts</option>
                      <option value="instagram-reels">Instagram Reels</option>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="mb-1" htmlFor="audience">Who is this for?</Label>
                  <Textarea id="audience" rows={3} value={audienceDesc} onChange={(e) => setAudienceDesc(e.target.value)} placeholder="Describe your target audience, also add your main points. It would also be helpful to describe their level of understanding." />
                </div>
              </section>
              </div>

              <div className="lg:col-span-4 lg:border-l lg:border-white/10 lg:pl-8">
                <section className="space-y-4">
                  <IdeaAssistant
                    platform={platform}
                    brandContext={{ brandVoice, channelSummary }}
                    purpose={purpose}
                    audience={{ description: audienceDesc }}
                    constraints={constraints}
                    onSelect={(idea) => setSelectedIdea(idea as any)}
                    selectedIdea={selectedIdea}
                  />
                </section>
              </div>

              <div className="lg:col-span-4 lg:border-l lg:border-white/10 lg:pl-8">
                {selectedIdea && (
                  <div className="rounded-xl hairline p-4 bg-surface">
                    <div className="text-sm text-muted mb-2">Selected idea</div>
                    <div className="font-medium">{selectedIdea.title}</div>
                    <div className="text-sm text-muted mt-1">Hook: {selectedIdea.hook}</div>
                    {selectedIdea.angle && (
                      <div className="text-sm text-muted mt-1">Angle: {selectedIdea.angle}</div>
                    )}
                    {selectedIdea.durationSec && (
                      <div className="text-sm text-muted mt-1">Duration: {selectedIdea.durationSec}s</div>
                    )}
                    {Array.isArray(selectedIdea.outline) && selectedIdea.outline.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-muted mb-1">Outline:</div>
                        <ul className="list-disc list-inside text-xs text-muted space-y-0.5">
                          {selectedIdea.outline.map((b: string, i: number) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedIdea.reasoning && (
                      <div className="text-xs text-muted mt-3">{selectedIdea.reasoning}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}


