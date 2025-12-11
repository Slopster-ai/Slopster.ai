'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/Button'
import { Input, Textarea, Label, Select } from './ui/Form'

interface ScriptGeneratorProps {
  projectId: string
}

export default function ScriptGenerator({ projectId }: ScriptGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [platform, setPlatform] = useState<'tiktok' | 'youtube-shorts' | 'instagram-reels'>('tiktok')
  const [duration, setDuration] = useState(45)
  const [tone, setTone] = useState<'casual' | 'professional' | 'humorous' | 'inspirational'>('casual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedScript, setGeneratedScript] = useState<any>(null)
  const router = useRouter()

  // Prefill platform/duration from strategy when available (leave prompt empty)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [strategyRes, profileRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/strategy`),
          fetch('/api/profile/context'),
        ])
        const strategy = await strategyRes.json()
        const profile = await profileRes.json()
        if (!strategyRes.ok) throw new Error(strategy.error || 'Failed to load strategy')
        if (!profileRes.ok) throw new Error(profile.error || 'Failed to load profile')

        const sc = strategy.strategy_context || {}

        if (sc.platform) setPlatform(sc.platform)
        if (sc.selectedIdea?.durationSec) {
          const d = Math.max(15, Math.min(180, Number(sc.selectedIdea.durationSec) || 30))
          setDuration(d)
        }
      } catch (_) {
        // Ignore prefill errors; keep defaults
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setGeneratedScript(null)

    try {
      const response = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, prompt, platform, duration, tone }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate script')
      }

      const data = await response.json()
      setGeneratedScript(data.script)
      router.push(`/projects/${projectId}/scripts/${data.script.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleGenerate} className="space-y-4">
        {error && (
          <div className="rounded-xl hairline p-3">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div>
          <Label htmlFor="prompt" className="mb-1">Your video idea</Label>
          <Textarea
            id="prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., A quick tutorial on how to make sourdough bread for beginners"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="platform" className="mb-1">Platform</Label>
            <Select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
              <option value="tiktok">TikTok</option>
              <option value="youtube-shorts">YouTube Shorts</option>
              <option value="instagram-reels">Instagram Reels</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="duration" className="mb-1">Duration ({duration}s)</Label>
            <input
              type="range"
              id="duration"
              min="15"
              max="180"
              step="5"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full accent-foreground"
            />
          </div>

          <div>
            <Label htmlFor="tone" className="mb-1">Tone</Label>
            <Select id="tone" value={tone} onChange={(e) => setTone(e.target.value as any)}>
              <option value="casual">Casual</option>
              <option value="professional">Professional</option>
              <option value="humorous">Humorous</option>
              <option value="inspirational">Inspirational</option>
            </Select>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Generating…' : 'Generate script'}
        </Button>
      </form>

      {generatedScript && (
        <div className="mt-4 rounded-xl hairline p-3 text-sm">
          Script generated. Refresh to see it in the list.
        </div>
      )}
    </div>
  )
}

