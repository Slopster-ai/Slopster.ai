"use client"

import { useRouter } from 'next/navigation'

export default function ProjectActions({ id, title }: { id: string; title: string }) {
  const router = useRouter()

  async function rename() {
    const next = typeof window !== 'undefined' ? window.prompt('Rename project', title) : null
    if (!next || next.trim() === title) return
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: next.trim() }),
    })
    router.refresh()
  }

  async function remove() {
    const ok = typeof window !== 'undefined' ? window.confirm('Delete this project? This cannot be undone.') : false
    if (!ok) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={rename} className="text-xs text-muted hover:text-foreground underline-offset-2 hover:underline">
        Rename
      </button>
      <button onClick={remove} className="text-xs text-muted hover:text-red-500 underline-offset-2 hover:underline">
        Delete
      </button>
    </div>
  )
}


