'use client'

import React from 'react'
import { Button } from './ui/Button'
import { Trash2 } from 'lucide-react'

interface Recording {
  id: string
  url: string | null
  status: string
}

interface RecentRecordingsProps {
  recordings: Recording[]
  onDelete?: (id: string) => void
}

export default function RecentRecordings({ recordings, onDelete }: RecentRecordingsProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      return
    }

    setDeletingId(id)
    setError(null)

    try {
      const response = await fetch(`/api/videos/delete?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete recording')
      }

      // Call the onDelete callback to refresh the list
      if (onDelete) {
        onDelete(id)
      } else {
        // Fallback: reload the page
        window.location.reload()
      }
    } catch (e: any) {
      setError(e.message || 'Failed to delete recording')
      setDeletingId(null)
    }
  }

  if (recordings.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Recent recordings</h2>
        <div className="text-sm text-muted">No recordings yet.</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Recent recordings</h2>
      {error && (
        <div className="rounded-xl hairline p-3 text-sm text-red-500 bg-red-500/10">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {recordings.map((recording) => (
          <div key={recording.id} className="p-3 rounded-xl hairline group relative">
            <div className="text-xs text-muted mb-2 flex items-center justify-between">
              <span>Recording {recording.id.slice(0, 8)}</span>
              <span className="capitalize">{recording.status}</span>
            </div>
            {recording.url ? (
              <audio
                src={recording.url}
                controls
                preload="metadata"
                className="w-full mb-2"
                onLoadedMetadata={(e) => {
                  // Ensure the progress bar updates when metadata loads
                  const audio = e.currentTarget
                  if (audio.duration && isFinite(audio.duration)) {
                    // Metadata loaded, controls should now show correct progress
                  }
                }}
                style={{
                  height: '36px',
                }}
              />
            ) : (
              <div className="text-sm text-muted mb-2">Preview unavailable</div>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(recording.id)}
              disabled={deletingId === recording.id}
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              {deletingId === recording.id ? (
                'Deleting...'
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

