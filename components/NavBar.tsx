"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import FullLogo from '../slopsterlogo.webp'
import IconLogo from '../slopOtransparent.webp'
import { createClient as createSupabaseClient } from '../lib/supabase/client'

// Simple top navigation with generous spacing and minimal chrome.
export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => {
    try {
      return createSupabaseClient()
    } catch (error) {
      // During build, env vars might not be available
      return null
    }
  }, [])
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    if (!supabase) {
      setIsAuthed(false)
      return
    }
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setIsAuthed(!!user)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSignOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/')
  }
  const linkBase = 'text-sm text-muted hover:text-foreground transition-colors'

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/40">
      {/* Full-bleed header; nav is absolutely centered to viewport */}
      <div className="relative flex h-16 w-full items-center justify-between px-3 md:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Slopster home">
          {/* Full wordmark on md+, icon on small screens */}
          <Image src={IconLogo} alt="Slopster icon" className="h-7 w-auto md:hidden" priority />
          <Image src={IconLogo} alt="Slopster" className="h-7 w-auto hidden md:block" priority />
          <span className="sr-only">Slopster</span>
        </Link>

        <nav className="pointer-events-auto absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex items-center gap-8">
          <Link href="/" className={linkBase + (pathname === '/' ? ' text-foreground' : '')}>Home</Link>
          <Link href="/dashboard" className={linkBase}>Tools</Link>
          <Link href="/pricing" className={linkBase}>Pricing</Link>
          <Link href="/about" className={linkBase}>About</Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthed ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm text-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="hidden md:inline-flex h-10 items-center rounded-xl px-4 text-sm text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:inline-flex h-10 items-center rounded-xl px-4 text-sm text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm text-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}


