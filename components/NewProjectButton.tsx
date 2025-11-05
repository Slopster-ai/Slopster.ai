"use client"

import { useState } from 'react'
import { Button } from './ui/Button'
import { Plus } from 'lucide-react'
import { Label, Input } from './ui/Form'

export default function NewProjectButton() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
        <Plus className="h-4 w-4" /> New project
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !submitting && setOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl surface hairline p-6">
            <h2 className="text-lg font-medium mb-4">Create new project</h2>
            <form
              method="POST"
              action="/api/projects/create"
              onSubmit={() => setSubmitting(true)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="project-title" className="mb-1">Project title</Label>
                <Input
                  id="project-title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My awesome project"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !title.trim()}>
                  {submitting ? 'Creating…' : 'Create project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}


