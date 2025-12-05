"use client"

import { useState } from 'react'
import { Button } from './ui/Button'
import { useRouter } from 'next/navigation'

export default function ContinueToShoot({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const onClick = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/flow`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow_stage: 3 }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Failed to update flow')
      router.push(`/projects/${projectId}/shoot`)
    } catch (e: any) {
      setError(e.message || 'Failed to continue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 space-y-2">
      <Button onClick={onClick} disabled={loading}>{loading ? 'Continuing…' : 'Continue to Record'}</Button>
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  )
}












