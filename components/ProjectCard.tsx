"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function ProjectCard({ 
  id, 
  title, 
  description, 
  created_at 
}: { 
  id: string
  title: string
  description?: string | null
  created_at: string
}) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Failed to delete project')
      }
      router.refresh()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project. Please try again.')
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="surface hairline rounded-xl p-6 hover:shadow-depth transition-shadow relative group">
      <Link href={`/projects/${id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium truncate">{title}</h3>
            {description && (
              <p className="mt-2 text-sm text-muted line-clamp-2">{description}</p>
            )}
            <div className="mt-4">
              <p className="text-xs text-muted">Created {new Date(created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`flex-shrink-0 p-2 rounded-lg transition-all ${
              showConfirm
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 hover:bg-red-500/10'
            }`}
            title={showConfirm ? 'Click again to confirm' : 'Delete project'}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </Link>
      {showConfirm && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="bg-surface border border-white/10 rounded-lg p-4 m-4">
            <p className="text-sm mb-3">Delete this project?</p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowConfirm(false)
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-white/10 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



