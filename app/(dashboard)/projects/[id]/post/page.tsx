"use client"

import { Container } from '@/components/ui/Container'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function PostPage({ params }: { params: { id: string } }) {
  const projectId = params.id
  const [loading, setLoading] = useState(false)
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/posting/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Failed to generate')
      setCaption(j.caption || '')
      setHashtags(j.hashtags || [])
    } catch (e: any) {
      setError(e.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const copyAll = async () => {
    const text = caption + (hashtags.length ? '\n\n' + hashtags.map((h) => (h.startsWith('#') ? h : '#' + h)).join(' ') : '')
    await navigator.clipboard.writeText(text)
  }

  useEffect(() => { generate() }, [generate])

  return (
    <Container>
      <div className="py-10 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-medium">Stage 6: Caption & Post</h1>
          <p className="text-sm text-muted mt-1">Copy the generated caption and hashtags for your TikTok post.</p>
        </div>
        {error && <div className="text-sm text-red-500 mb-4">{error}</div>}
        <div className="space-y-3">
          <div className="rounded-xl hairline p-4 bg-surface">
            <div className="text-xs text-muted mb-1">Caption</div>
            <textarea className="w-full bg-transparent outline-none text-sm" rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>
          <div className="rounded-xl hairline p-4 bg-surface">
            <div className="text-xs text-muted mb-1">Hashtags</div>
            <div className="text-sm text-muted flex flex-wrap gap-2">
              {hashtags.map((h, i) => (
                <span key={i} className="px-2 py-1 rounded bg-black/30">#{h.replace(/^#/, '')}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={generate} disabled={loading}>{loading ? 'Generating…' : 'Regenerate'}</Button>
            <Button onClick={copyAll} variant="subtle">Copy caption + hashtags</Button>
          </div>
        </div>
      </div>
    </Container>
  )
}



