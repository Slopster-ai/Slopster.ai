'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
	import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => {
    try {
      return createClient()
    } catch (error) {
      // During build, env vars might not be available
      // Return null and handle in useEffect
      return null
    }
  }, [])

  // Form state
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Motion values for tilt
  const prefersReducedMotion = useReducedMotion()
  const mvX = useMotionValue(0)
  const mvY = useMotionValue(0)
  const x = useSpring(mvX, { stiffness: 120, damping: 15, mass: 0.3 })
  const y = useSpring(mvY, { stiffness: 120, damping: 15, mass: 0.3 })
  const rotateX = useTransform(y, [-0.5, 0.5], [5, -5])
  const rotateY = useTransform(x, [-0.5, 0.5], [-5, 5])
		// Reflection shifts opposite tilt direction (keep within 10-20px)
		const reflectX = useTransform(x, [-0.5, 0.5], [16, -16])
		const reflectY = useTransform(y, [-0.5, 0.5], [16, -16])
		// Opacity subtly increases with tilt magnitude
		const reflectOpacity = useTransform([x, y], ([vx, vy]: number[]) => {
			const mag = Math.min(Math.abs(vx) + Math.abs(vy), 1)
			return 0.18 + mag * 0.12
		})
		// Text illumination: brighten when tilting toward top-left (light source)
		const textBrightnessValue = useTransform([x, y], ([vx, vy]: number[]) => {
			const towardTL = Math.max(0, (-vx + -vy) * 0.6)
			return 0.95 + Math.min(towardTL, 0.15)
		})
		const textBrightness = useTransform(textBrightnessValue, (b) => `brightness(${b})`)
		const textOpacity = useTransform([x, y], ([vx, vy]: number[]) => {
			const mag = Math.min(Math.abs(vx) + Math.abs(vy), 1)
			return 0.85 + mag * 0.1
		})
		// Background illumination transforms
		const bgX = useTransform(x, (v) => v * 12)
		const bgY = useTransform(y, (v) => v * 12)

  const cardRef = useRef<HTMLDivElement | null>(null)

  const onPointerMove = (e: React.PointerEvent) => {
    if (!cardRef.current || prefersReducedMotion) return
    const rect = cardRef.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    mvX.set(px)
    mvY.set(py)
  }
  const onPointerLeave = () => {
    mvX.set(0)
    mvY.set(0)
  }

  // Get the site URL from environment variable or fallback to current origin
  const getSiteUrl = () => {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    }
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }

  // Supabase handlers (email magic link + OAuth)
  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      setError('Supabase client not available. Please refresh the page.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const siteUrl = getSiteUrl()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${siteUrl}/auth/callback` },
      })
      if (error) throw error
      router.push('/welcome')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    if (!supabase) {
      setError('Supabase client not available. Please refresh the page.')
      return
    }
    setLoading(true)
    setError(null)
    const siteUrl = getSiteUrl()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleX = async () => {
    if (!supabase) {
      setError('Supabase client not available. Please refresh the page.')
      return
    }
    setLoading(true)
    setError(null)
    const siteUrl = getSiteUrl()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter', // X
      options: { redirectTo: `${siteUrl}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
		<div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0a0c]">
      {/* Background gradient + vignette */}
			<div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0c] via-[#121216] to-[#1a1b20]" />
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(1200px_700px_at_50%_30%,rgba(255,255,255,0.04),transparent_60%),radial-gradient(900px_600px_at_50%_70%,rgba(0,0,0,0.45),transparent_60%)]" />
      {/* Moving bloom */}
			<div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_60%)] blur-2xl opacity-50 motion-safe:animate-bloom motion-reduce:animate-none" />

      {/* Center container */}
      <div className="relative z-10 flex items-center justify-center px-4 py-16 sm:py-24">
				<div className="relative w-full max-w-md perspective-[1000px]">
					{/* Subtle radial illumination behind the card that nudges with tilt */}
					<motion.div
						aria-hidden
						style={prefersReducedMotion ? {} : { x: bgX, y: bgY }}
						className="pointer-events-none absolute -inset-8 -z-10 rounded-[28px] bg-[radial-gradient(380px_220px_at_20%_10%,rgba(255,255,255,0.06),transparent_60%)] blur-2xl"
					/>
          <motion.div
            ref={cardRef}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
						className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_25px_60px_rgba(0,0,0,0.55)] transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] will-change-transform"
						style={{ ...(prefersReducedMotion ? {} as any : { rotateX, rotateY }), transformStyle: 'preserve-3d' } as any}
          >
            {/* Ambient hover brightness */}
            <div className="absolute inset-0 rounded-2xl transition duration-300 group-hover:bg-white/[0.02]" />

						{/* Reflection layer contained within the glass card */}
						<div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
							<motion.div
								aria-hidden
								style={prefersReducedMotion ? {} : { x: reflectX, y: reflectY, opacity: reflectOpacity }}
								className="absolute inset-0 blur-2xl mix-blend-lighten"
							>
								<div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(255,255,255,0.08),transparent_70%)]" />
							</motion.div>
						</div>

            {/* Content */}
            <div className="relative p-8 sm:p-10">
              <div className="mb-8 text-center">
								<motion.h1
									className="text-3xl font-semibold tracking-tight text-gray-200 drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] mix-blend-overlay"
									style={prefersReducedMotion ? {} : { filter: textBrightness, opacity: textOpacity }}
								>
									Welcome back
								</motion.h1>
								<motion.p
									className="mt-2 text-sm text-gray-300/80 mix-blend-overlay"
									style={prefersReducedMotion ? {} : { filter: textBrightness, opacity: textOpacity }}
								>
									Sign in to your account
								</motion.p>
              </div>

              <form onSubmit={handleEmail} className="space-y-6">
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                {/* Email input with inline primary button */}
                <div className="flex items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <input
                    type="email"
                    required
                    placeholder="you@studio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
										className="w-full bg-transparent px-4 py-3 text-gray-200 placeholder:text-gray-400/50 focus:outline-none focus:ring-2 focus:ring-[rgba(113,90,90,0.35)]"
                    autoComplete="email"
                  />
                  <button
                    type="submit"
                    disabled={loading}
										className="m-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#715A5A] to-[#9B7E7E] text-white transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:scale-105 hover:shadow-[0_8px_30px_rgba(113,90,90,0.35)] disabled:opacity-60"
                    aria-label="Send magic link"
                    title="Send magic link"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Divider */}
                <div className="relative py-1">
                  <div className="h-px w-full bg-white/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60 backdrop-blur-sm">
                      OR
                    </span>
                  </div>
                </div>

                {/* OAuth buttons */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 transition-all duration-300 hover:bg-white/10"
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
                      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.942 32.91 29.345 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.869 6.053 29.728 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
                      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.817C14.655 16.094 18.961 14 24 14c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.869 6.053 29.728 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                      <path fill="#4CAF50" d="M24 44c5.258 0 10.064-2.016 13.662-5.292l-6.299-5.318C29.345 36 24 36 24 36c-5.317 0-9.9-3.064-11.651-7.469l-6.579 5.066C8.096 39.556 15.467 44 24 44z"/>
                      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.008 2.91-3.273 5.245-6.34 6.39l6.299 5.318C35.691 41.129 44 36 44 24c0-1.341-.138-2.651-.389-3.917z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleX}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 transition-all duration-300 hover:bg-white/10"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0" fill="currentColor" aria-hidden>
                      <path d="M18.244 3H21l-6.58 7.51L22 21h-5.5l-4.3-5.2L7.2 21H4.445l6.98-7.965L3 3h5.62l3.89 4.86L18.244 3Zm-.963 16h1.318L7.8 5H6.39l10.891 14Z"/>
                    </svg>
                    <span>Continue with X</span>
                  </button>
                </div>

                <p className="pt-2 text-center text-sm text-slate-300/70">
                  Don’t have an account?{' '}
									<Link href="/signup" className="font-medium text-[#B08F8F] hover:text-[#D3DAD9]">
                    Sign up
                  </Link>
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Local keyframes for bloom */}
      <style jsx global>{`
        @keyframes bloom {
          0% { transform: translate3d(0,0,0) }
          50% { transform: translate3d(40px,30px,0) }
          100% { transform: translate3d(0,0,0) }
        }
        .animate-bloom { animation: bloom 16s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
