'use client'

import type React from 'react'
import { useRef } from 'react'

interface LiquidGlassCardProps {
  children: React.ReactNode
  className?: string
}

export function LiquidGlassCard({
  children,
  className = '',
}: LiquidGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return

    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    card.style.setProperty('--mouse-x', `${x}px`)
    card.style.setProperty('--mouse-y', `${y}px`)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`liquid-glass-card group ${className}`}
    >
      <div className="liquid-glass-inner p-6 h-full">
        {/* Hover background spotlight glow */}
        <div className="liquid-glass-glow" />
        {/* Content container */}
        <div className="relative z-10 flex gap-4 h-full">{children}</div>
      </div>
    </div>
  )
}
