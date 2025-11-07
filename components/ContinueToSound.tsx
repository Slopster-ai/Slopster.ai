"use client"

import { useState } from 'react'
import { Button } from './ui/Button'
import { useRouter } from 'next/navigation'

export default function ContinueToSound({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const onClick = async () => {
    setLoading(true)
    setError(null)
    try {
      // Try to kick off render but do not block
      fetch('/api/videos/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      }).catch(() => {})

      // Advance flow to Stage 5
      const res = await fetch(`/api/projects/${projectId}/flow`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow_stage: 5 }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Failed to update flow')
      router.push(`/projects/${projectId}/sound`)
    } catch (e: any) {
      setError(e.message || 'Failed to continue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={onClick} disabled={loading}>{loading ? 'Continuing…' : 'Render & Continue to Sound'}</Button>
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  )
}


