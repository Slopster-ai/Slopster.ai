"use client"

import * as React from 'react'
import { Button } from './ui/Button'

export default function SoundPicker({ projectId }: { projectId: string }) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [suggestions, setSuggestions] = React.useState<any[]>([])

  const fetchSuggestions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sounds/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Failed to fetch suggestions')
      setSuggestions(Array.isArray(j.suggestions) ? j.suggestions : [])
    } catch (e: any) {
      setError(e.message || 'Failed to fetch suggestions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Sound suggestions</h3>
        <Button onClick={fetchSuggestions} disabled={loading}>{loading ? 'Loading…' : 'Suggest sounds'}</Button>
      </div>
      {error && <div className="text-xs text-red-500">{error}</div>}
      <ul className="space-y-2 text-sm">
        {suggestions.map((s, i) => (
          <li key={i} className="p-2 rounded hairline flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium">{s.title || s.name || `Track ${i + 1}`}</div>
              {s.description && <div className="text-xs text-muted">{s.description}</div>}
            </div>
            <Button variant="subtle">Add to EDL</Button>
          </li>
        ))}
      </ul>
      {suggestions.length === 0 && !loading && (
        <div className="text-xs text-muted">No suggestions yet.</div>
      )}
    </div>
  )
}



