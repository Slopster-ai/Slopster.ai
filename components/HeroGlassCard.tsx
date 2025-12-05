"use client"

import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

export default function HeroGlassCard({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const mvX = useMotionValue(0)
  const mvY = useMotionValue(0)
  const x = useSpring(mvX, { stiffness: 200, damping: 14, mass: 0.25 })
  const y = useSpring(mvY, { stiffness: 200, damping: 14, mass: 0.25 })
  const rotateX = useTransform(y, [-0.5, 0.5], [4, -4])
  const rotateY = useTransform(x, [-0.5, 0.5], [-4, 4])
  // Use spring values for smooth reflection animation
  const reflectX = useTransform(x, [-0.5, 0.5], [-20, 20])
  const reflectY = useTransform(y, [-0.5, 0.5], [-20, 20])
  // Background glow uses raw values for immediate response
  const bgX = useTransform(mvX, [-0.5, 0.5], [-14, 14])
  const bgY = useTransform(mvY, [-0.5, 0.5], [-14, 14])

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const nx = (e.clientX - rect.left) / rect.width - 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5
    mvX.set(nx)
    mvY.set(ny)
  }

  const onPointerLeave = () => {
    mvX.set(0)
    mvY.set(0)
  }

  return (
    <div className="relative w-full max-w-5xl px-4">
      {/* Glow backdrop */}
      <motion.div
        aria-hidden
        style={prefersReducedMotion ? {} : { x: bgX, y: bgY }}
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[34px] bg-[radial-gradient(520px_320px_at_25%_10%,rgba(255,255,255,0.06),transparent_60%)] blur-2xl"
      />
      <motion.div
        ref={cardRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_25px_60px_rgba(0,0,0,0.55)] transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{ ...(prefersReducedMotion ? {} as any : { rotateX, rotateY }), transformStyle: 'preserve-3d' } as any}
      >
        <div className="absolute inset-0 rounded-[28px] transition duration-300 group-hover:bg-white/[0.02]" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
          <motion.div
            aria-hidden
            style={prefersReducedMotion ? {} : { x: reflectX, y: reflectY, opacity: 0.18 }}
            className="absolute inset-0 blur-[80px]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.08),transparent_85%)]" />
          </motion.div>
        </div>
        <div className="relative p-10 md:p-12 flex flex-col items-center gap-8 text-center">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

