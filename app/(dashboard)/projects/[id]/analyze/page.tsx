"use client"

import { Container } from '@/components/ui/Container'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function AnalyzePage({ params }: { params: { id: string } }) {
  const [views, setViews] = useState('')
  const [likes, setLikes] = useState('')
  const [watchTime, setWatchTime] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <Container>
      <div className="py-10 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-medium">Stage 7: Analyze</h1>
          <p className="text-sm text-muted mt-1">Enter basic stats and notes. Insights integration can be added later.</p>
        </div>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input className="rounded-xl hairline bg-transparent px-3 py-2" placeholder="Views" value={views} onChange={(e) => setViews(e.target.value)} />
            <input className="rounded-xl hairline bg-transparent px-3 py-2" placeholder="Likes" value={likes} onChange={(e) => setLikes(e.target.value)} />
            <input className="rounded-xl hairline bg-transparent px-3 py-2" placeholder="Avg watch time (s)" value={watchTime} onChange={(e) => setWatchTime(e.target.value)} />
          </div>
          <textarea className="rounded-xl hairline bg-transparent px-3 py-2" rows={5} placeholder="Notes: what went well / to improve" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div>
            <Button disabled>Save (coming soon)</Button>
          </div>
        </div>
      </div>
    </Container>
  )
}


