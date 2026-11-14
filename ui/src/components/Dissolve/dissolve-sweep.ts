/**
 * The geometry of a dissolve, kept apart from the element so it can be
 * tested without a canvas: where the sweeping edge is, which strip of the
 * item it uncovered this frame, and how many particles that strip sheds.
 */

export type DissolveDirection = 'right' | 'left' | 'up' | 'down'

/** Width of the soft edge, as a share of the item's length along the sweep. */
export const DISSOLVE_EDGE = 0.2

/** Particles per square pixel of the item; fewer for big items, see `particleBudget`. */
export const DISSOLVE_DENSITY = 1 / 26

/** Most particles one dissolve sheds, however large the item. */
export const MAX_DISSOLVE_PARTICLES = 1400

/** Normalises a `direction` attribute; anything unknown sweeps right. */
export function normalizeDirection(value: unknown): DissolveDirection {
  return value === 'left' || value === 'up' || value === 'down'
    ? value
    : 'right'
}

/** The CSS gradient direction that sweeps the mask the given way. */
export function maskDirection(direction: DissolveDirection): string {
  switch (direction) {
    case 'left':
      return 'to left'
    case 'up':
      return 'to top'
    case 'down':
      return 'to bottom'
    default:
      return 'to right'
  }
}

/**
 * Sweep progress from 0 to 1 after `elapsed` of `duration` milliseconds,
 * eased in and out so the item starts to go gently and finishes cleanly.
 */
export function sweepProgress(elapsed: number, duration: number): number {
  if (duration <= 0) return 1
  const t = Math.min(1, Math.max(0, elapsed / duration))
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

/**
 * The strip of the item, as fractions from 0 to 1 along the sweep, that
 * turned transparent between progress `from` and `to`. The mask's soft
 * edge runs from `p * (1 + edge) - edge` (gone) to `p * (1 + edge)` (whole).
 */
export function uncoveredBand(
  from: number,
  to: number,
  edge = DISSOLVE_EDGE,
): [number, number] {
  const start = Math.max(0, Math.min(1, from * (1 + edge) - edge / 2))
  const end = Math.max(0, Math.min(1, to * (1 + edge) - edge / 2))
  return [start, end]
}

/** How many particles an item of `width` × `height` pixels sheds in all. */
export function particleBudget(width: number, height: number): number {
  const area = Math.max(0, width) * Math.max(0, height)
  return Math.min(MAX_DISSOLVE_PARTICLES, Math.round(area * DISSOLVE_DENSITY))
}

/**
 * Turns a point along and across the sweep (each 0 to 1) into a point in the
 * item's box, in pixels from its top-left corner.
 */
export function bandPoint(
  direction: DissolveDirection,
  along: number,
  across: number,
  width: number,
  height: number,
): { x: number; y: number } {
  switch (direction) {
    case 'left':
      return { x: (1 - along) * width, y: across * height }
    case 'up':
      return { x: across * width, y: (1 - along) * height }
    case 'down':
      return { x: across * width, y: along * height }
    default:
      return { x: along * width, y: across * height }
  }
}

/** A unit vector pointing the way the sweep travels, in screen axes (y down). */
export function sweepVector(direction: DissolveDirection): {
  x: number
  y: number
} {
  switch (direction) {
    case 'left':
      return { x: -1, y: 0 }
    case 'up':
      return { x: 0, y: -1 }
    case 'down':
      return { x: 0, y: 1 }
    default:
      return { x: 1, y: 0 }
  }
}
