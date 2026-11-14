/**
 * The motion of a cursor trail, kept apart from the element so it can be
 * tested without a canvas.
 */

export type CursorTrailVariant = 'glyphs' | 'dots' | 'images'

/** Normalises a `variant` attribute; anything unknown is `glyphs`. */
export function normalizeTrailVariant(value: unknown): CursorTrailVariant {
  return value === 'dots' || value === 'images' ? value : 'glyphs'
}

/** Size in pixels each variant uses when `size` is not set. */
export const DEFAULT_TRAIL_SIZE: Record<CursorTrailVariant, number> = {
  glyphs: 16,
  dots: 10,
  images: 88,
}

export interface TrailPoint {
  x: number
  y: number
}

/**
 * Points every `spacing` pixels along the segment from `from` to `to`,
 * after `carried` pixels already travelled since the last stamp. Returns
 * the points and the distance carried over to the next segment, so a fast
 * flick leaves an even trail instead of a few far-apart stamps. At most
 * `limit` points per segment.
 */
export function stampsAlong(
  from: TrailPoint,
  to: TrailPoint,
  spacing: number,
  carried: number,
  limit = 8,
): { points: TrailPoint[]; carried: number } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  const points: TrailPoint[] = []
  if (spacing <= 0 || length === 0) return { points, carried }
  let travelled = spacing - carried
  while (travelled <= length && points.length < limit) {
    const t = travelled / length
    points.push({ x: from.x + dx * t, y: from.y + dy * t })
    travelled += spacing
  }
  const left = length - (travelled - spacing)
  return {
    points,
    carried: points.length >= limit ? 0 : Math.max(0, Math.min(spacing, left)),
  }
}

/**
 * One step of a damped spring pulling `position` (with `velocity`) toward
 * `target`, for `dt` seconds. Mutates and returns the pair. Each link lags
 * its leader by about `damping / stiffness` seconds (40 ms by default), and
 * is damped just under critical so the chain overshoots a little.
 */
export function springStep(
  state: { x: number; y: number; vx: number; vy: number },
  target: TrailPoint,
  dt: number,
  stiffness = 2000,
  damping = 80,
): { x: number; y: number; vx: number; vy: number } {
  // Small sub-steps keep the spring stable when a frame runs long.
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)))
  const h = dt / steps
  for (let i = 0; i < steps; i++) {
    const ax = (target.x - state.x) * stiffness - state.vx * damping
    const ay = (target.y - state.y) * stiffness - state.vy * damping
    state.vx += ax * h
    state.vy += ay * h
    state.x += state.vx * h
    state.y += state.vy * h
  }
  return state
}

/**
 * How an image stamp looks `age` seconds into a `life`-second life: it pops
 * up to full size, holds, then falls away and fades. Returns its scale and
 * opacity, and whether it has started to fall.
 */
export function stampPhase(
  age: number,
  life: number,
  hold: number,
): { scale: number; alpha: number; isFalling: boolean } {
  const pop = Math.min(1, age / 0.14)
  // Ease out with a touch of overshoot, so the stamp lands with a little bounce.
  const scale = pop >= 1 ? 1 : 1 + 1.7 * (pop - 1) ** 3 + 0.7 * (pop - 1) ** 2
  const isFalling = age > hold
  const fadeStart = hold + (life - hold) * 0.35
  const alpha =
    age <= fadeStart
      ? 1
      : Math.max(0, 1 - (age - fadeStart) / Math.max(0.001, life - fadeStart))
  return { scale: Math.max(0, scale), alpha, isFalling }
}
