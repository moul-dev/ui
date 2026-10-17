import {
  type AnimationOptions,
  type AnimationPlaybackControls,
  animate,
  type DOMKeyframesDefinition,
  stagger,
} from 'motion'

export const SPRING_SNAPPY: AnimationOptions = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
  mass: 0.8,
}

export const SPRING_GENTLE: AnimationOptions = {
  type: 'spring',
  stiffness: 320,
  damping: 28,
  mass: 1,
}

export const IOS_SHEET_CURVE = [0.32, 0.72, 0, 1] as const

export const CHART_EASE = [0.22, 1, 0.36, 1] as const

/**
 * Checks whether the user has requested reduced motion via the OS accessibility settings.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Runs a subtle motion.dev animation on one or more elements/SVG nodes,
 * automatically collapsing duration to 0 when `prefers-reduced-motion: reduce` is active.
 */
export function subtleAnimate(
  target: Element | Element[] | NodeListOf<Element>,
  keyframes: DOMKeyframesDefinition,
  options: AnimationOptions = SPRING_GENTLE,
): AnimationPlaybackControls {
  if (prefersReducedMotion()) {
    return animate(target, keyframes, { duration: 0 })
  }
  return animate(target, keyframes, options)
}

/**
 * Animates a shared active indicator pill/underline between two elements using FLIP deltas
 * (replaces React's `layoutId` in `moul-tabs`, `moul-toggle-button-group`, and `moul-sidebar`).
 */
export function animateActiveIndicator(
  indicator: HTMLElement,
  previousRect: DOMRect | null,
  nextRect: DOMRect,
): AnimationPlaybackControls | null {
  if (!previousRect || prefersReducedMotion()) return null
  const dx = previousRect.left - nextRect.left
  const dy = previousRect.top - nextRect.top
  const scaleX = previousRect.width / Math.max(nextRect.width, 1)
  const scaleY = previousRect.height / Math.max(nextRect.height, 1)
  return animate(
    indicator,
    {
      x: [dx, 0],
      y: [dy, 0],
      scaleX: [scaleX, 1],
      scaleY: [scaleY, 1],
    },
    SPRING_SNAPPY,
  )
}

export { stagger }
