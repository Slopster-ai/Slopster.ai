"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ProjectStepper({ projectId, flowStage }: { projectId: string; flowStage: number }) {
  const pathname = usePathname()

  const steps = [
    { step: 1, label: 'Idea & Strategy', href: `/projects/${projectId}/strategy` },
    { step: 2, label: 'Script', href: `/projects/${projectId}` },
    { step: 3, label: 'AI Content', href: `/projects/${projectId}/shoot` },
    { step: 4, label: 'Final Video', href: `/projects/${projectId}/final` },
  ]

  // Match the longest href first to avoid partial matches (e.g., /projects/[id] vs /projects/[id]/shoot)
  const current = steps.reduce((matchIdx, s, idx) => {
    const isMatch = pathname === s.href || pathname.startsWith(`${s.href}/`)
    if (!isMatch) return matchIdx
    const prevHref = matchIdx >= 0 ? steps[matchIdx].href : ''
    return s.href.length > prevHref.length ? idx : matchIdx
  }, -1)

  return (
    <div className="border-b border-white/10 bg-[rgba(255,255,255,0.02)]">
      <div className="mx-auto w-full max-w-[1280px] md:max-w-[1440px] px-4 md:px-8 lg:px-12 py-4">
        <nav className="flex items-center gap-4 text-sm">
          {steps.map((s, i) => (
            <div key={s.step} className="flex items-center gap-4">
              <Step href={s.href} step={s.step} label={s.label} active={current === i} enabled={true} />
              {i < steps.length - 1 && <span className="text-muted">/</span>}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}

function Step({ href, step, label, active, enabled }: { href: string; step: number; label: string; active: boolean; enabled: boolean }) {
  const content = (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 hover:border-white/30">
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
        active 
          ? 'bg-foreground text-background shadow-sm' 
          : 'bg-surface/50 text-muted'
      }`}>{step}</span>
      <span className={`text-sm ${active ? 'text-foreground font-medium' : 'text-muted'}`}>{label}</span>
    </div>
  )

  if (!enabled) {
    return (
      <div
        className="inline-block rounded-full border border-white/10 backdrop-blur-sm shadow-sm opacity-40 cursor-not-allowed select-none"
        title="Finish earlier stages to unlock"
      >
        {content}
      </div>
    )
  }
  return (
    <Link 
      href={href}
      className={`inline-block rounded-full border backdrop-blur-sm shadow-sm transition-all duration-200 ${
        active
          ? 'bg-foreground/10 border-white/20 shadow-md shadow-black/20'
          : 'bg-white/5 border-white/10 hover:bg-white/8 hover:shadow-sm'
      }`}
    >
      {content}
    </Link>
  )
}


