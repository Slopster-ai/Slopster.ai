"use client"

import { Button } from './ui/Button'

export function ResumeBanner() {
  const handleClick = () => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('ai-content-resume'))
  }

  return (
    <div className="rounded-2xl border border-emerald-300/50 bg-emerald-500/10 shadow-[0_8px_30px_rgba(16,185,129,0.25)] p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-emerald-50/90">
        Resume your last AI content generation (voiceover, captions, storyboard).
      </div>
      <Button
        onClick={handleClick}
        variant="secondary"
        className="shadow-[0_8px_30px_rgba(16,185,129,0.35)] border-emerald-300/60"
        size="lg"
      >
        Resume last generation
      </Button>
    </div>
  )
}

