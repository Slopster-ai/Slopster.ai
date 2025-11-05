"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from './ui/Button'
import { Label, Input } from './ui/Form'

export default function ProjectSettings({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [nextTitle, setNextTitle] = useState(title)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  async function submitRename(e: React.FormEvent) {
    e.preventDefault()
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: nextTitle.trim() }),
    })
    setRenameOpen(false)
    router.refresh()
  }

  async function confirmDelete() {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-surface"
          aria-label="Project settings"
        >
          <Settings className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 rounded-xl surface hairline shadow-depth p-1 z-20">
            <button
              className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-surface/70"
              onClick={() => { setRenameOpen(true); setMenuOpen(false) }}
            >
              Rename
            </button>
            <button
              className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-surface/70 text-red-500"
              onClick={() => { setDeleteOpen(true); setMenuOpen(false) }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {renameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setRenameOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl surface hairline p-6">
            <h2 className="text-lg font-medium mb-4">Rename project</h2>
            <form className="space-y-4" onSubmit={submitRename}>
              <div>
                <Label htmlFor="rename-title" className="mb-1">Project title</Label>
                <Input id="rename-title" value={nextTitle} onChange={(e) => setNextTitle(e.target.value)} required />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setRenameOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!nextTitle.trim()}>Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl surface hairline p-6">
            <h2 className="text-lg font-medium mb-4">Delete project</h2>
            <p className="text-sm text-muted">This will permanently delete this project and its data. This cannot be undone.</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button type="button" className="bg-red-600 hover:bg-red-500" onClick={confirmDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


