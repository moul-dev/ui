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

const TRANSFORM_KEYS = new Set([
  'x',
  'y',
  'scale',
  'scaleX',
  'scaleY',
  'rotate',
  'transform',
])

function isRestValue(key: string, value: unknown): boolean {
  if (key === 'opacity' || key.startsWith('scale')) return Number(value) === 1
  if (key === 'transform') {
    return /^(\s*translate[XYZ3d]*\((\s*0(px|%)?\s*,?)+\)\s*)+$/.test(
      String(value),
    )
  }
  return parseFloat(String(value)) === 0
}

/**
 * True when every keyframe is an explicit `[from, …, to]` track that ends at the
 * element's resting pose (opacity 1, scale 1, zero offset/rotation). These are
 * one-shot entrance/pulse effects whose inline styles must be dropped afterwards,
 * otherwise motion's leftover `transform`/`opacity` overrides CSS state rules
 * (e.g. a deselected radio dot that keeps `transform: none` and stays visible).
 */
function settlesAtRest(keyframes: DOMKeyframesDefinition): string[] | null {
  const props: string[] = []
  for (const [key, track] of Object.entries(keyframes)) {
    if (!Array.isArray(track)) return null
    if (key !== 'opacity' && !TRANSFORM_KEYS.has(key)) return null
    if (!isRestValue(key, track[track.length - 1])) return null
    props.push(key === 'opacity' ? 'opacity' : 'transform')
  }
  return props.length > 0 ? [...new Set(props)] : null
}

function toElements(
  target: Element | Element[] | NodeListOf<Element>,
): Element[] {
  return target instanceof Element ? [target] : Array.from(target)
}

/**
 * Runs a subtle motion.dev animation on one or more elements/SVG nodes,
 * automatically collapsing duration to 0 when `prefers-reduced-motion: reduce` is active.
 * Entrance animations that land on the resting pose hand control back to CSS when done.
 */
export function subtleAnimate(
  target: Element | Element[] | NodeListOf<Element>,
  keyframes: DOMKeyframesDefinition,
  options: AnimationOptions = SPRING_GENTLE,
): AnimationPlaybackControls {
  const controls = animate(
    target,
    keyframes,
    prefersReducedMotion() ? { duration: 0 } : options,
  )
  const restProps = settlesAtRest(keyframes)
  if (restProps) {
    const elements = toElements(target)
    controls.then(() => {
      for (const el of elements) {
        const style = (el as HTMLElement | SVGElement).style
        for (const prop of restProps) style?.removeProperty(prop)
      }
    })
  }
  return controls
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
  // FLIP deltas are measured from the top-left edge, so scale from there too.
  indicator.style.transformOrigin = '0 0'
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

/**
 * Moves a shared selection indicator (segmented-control thumb, tab underline) onto
 * `target`, sized and offset relative to `container`. Geometry lives in the independent
 * `translate`/`width`/`height` properties so the CSS transition in the component styles
 * glides it like an iOS segmented control and nothing else can clobber it. Pass
 * `instant` for the first placement so the thumb doesn't slide in from the corner.
 */
export function placeIndicator(
  indicator: HTMLElement,
  container: HTMLElement,
  target: HTMLElement | null,
  instant = false,
): void {
  if (!target) {
    indicator.removeAttribute('data-visible')
    return
  }
  const box = container.getBoundingClientRect()
  const rect = target.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return

  const shouldSnap = instant || !indicator.hasAttribute('data-visible')
  if (shouldSnap) indicator.style.transition = 'none'

  // Offsets are in the container's scrolling content box (it may overflow-scroll).
  const x = rect.left - box.left - container.clientLeft + container.scrollLeft
  const y = rect.top - box.top - container.clientTop + container.scrollTop
  indicator.style.translate = `${x}px ${y}px`
  indicator.style.width = `${rect.width}px`
  indicator.style.height = `${rect.height}px`
  indicator.setAttribute('data-visible', '')

  if (shouldSnap) {
    // Commit the snapped geometry before restoring the stylesheet transition.
    void indicator.offsetWidth
    indicator.style.removeProperty('transition')
  }
}

export { stagger }
