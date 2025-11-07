'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Progress } from './ui/Progress'

interface Job {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  error: string | null
  output_url: string | null
}

interface JobProgressProps {
  jobId: string
  videoId?: string
  onComplete?: (outputUrl: string) => void
}

export default function JobProgress({ jobId, videoId, onComplete }: JobProgressProps) {
  const [job, setJob] = useState<Job | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial job status
    const fetchJob = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()
      
        if (data) {
          setJob(data)
          if (data.status === 'completed') {
            if (onComplete && data.output_url) onComplete(data.output_url)
            if (videoId) {
              // Fetch a presigned download URL from the server
              try {
                const res = await fetch(`/api/videos/download?videoId=${videoId}`)
                if (res.ok) {
                  const j = await res.json()
                  if (j.url) setDownloadUrl(j.url)
                }
              } catch {}
            }
          }
        }
    }

    fetchJob()

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const updatedJob = payload.new as Job
          setJob(updatedJob)
          
          if (updatedJob.status === 'completed') {
            if (onComplete && updatedJob.output_url) onComplete(updatedJob.output_url)
            if (videoId) {
              fetch(`/api/videos/download?videoId=${videoId}`)
                .then(r => r.ok ? r.json() : null)
                .then(j => { if (j?.url) setDownloadUrl(j.url) })
                .catch(() => {})
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [jobId, supabase, onComplete])

  if (!job) {
    return (
      <div className="animate-pulse">
        <div className="h-4 rounded bg-[#1a1b1e] w-3/4 mb-2"></div>
        <div className="h-2 rounded bg-[#1a1b1e]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          {job.status === 'queued' && 'Queued'}
          {job.status === 'processing' && 'Processing'}
          {job.status === 'completed' && 'Completed'}
          {job.status === 'failed' && 'Failed'}
        </span>
        <span className="text-sm text-muted">
          {job.progress}%
        </span>
      </div>

      <Progress value={job.progress} />

      {job.error && (
        <p className="text-sm">{job.error}</p>
      )}

      {job.status === 'completed' && downloadUrl && (
        <a href={downloadUrl} download className="inline-flex items-center text-sm hover:underline">
          Download video
        </a>
      )}
    </div>
  )
}

