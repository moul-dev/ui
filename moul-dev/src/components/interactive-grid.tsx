'use client'

import type React from 'react'
import { useEffect, useRef, useState } from 'react'

export function InteractiveGrid() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setCoords({ x, y })

      // Check if the cursor is within or close to the container bounds
      const isInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom

      setOpacity(isInside ? 1 : 0)
    }

    const handleMouseLeave = () => {
      setOpacity(0)
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 -z-10 overflow-hidden interactive-grid-container"
      style={
        {
          '--mouse-x': `${coords.x}px`,
          '--mouse-y': `${coords.y}px`,
          '--mouse-opacity': opacity,
        } as React.CSSProperties
      }
    >
      {/* Base Grid Layer */}
      <div className="absolute inset-0 interactive-grid-base" />

      {/* Spotlight Grid Layer */}
      <div className="absolute inset-0 interactive-grid-spotlight" />

      {/* Soft Background Glow following cursor */}
      <div className="absolute inset-0 interactive-grid-glow" />
    </div>
  )
}
