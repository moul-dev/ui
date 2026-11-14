/**
 * Grid geometry and ripple timing for `<moul-interactive-grid>`, kept apart
 * from the element so they can be tested without a canvas.
 */

export type InteractiveGridVariant = 'highlight' | 'ripple' | 'dots'
export type InteractiveGridFade = 'radial' | 'top' | 'bottom' | 'edges' | 'none'

/** Normalises a `variant` attribute; anything unknown is `highlight`. */
export function normalizeGridVariant(value: unknown): InteractiveGridVariant {
  return value === 'ripple' || value === 'dots' ? value : 'highlight'
}

/** Cell size in pixels each variant uses when `cell-size` is not set. */
export const DEFAULT_CELL_SIZE: Record<InteractiveGridVariant, number> = {
  highlight: 40,
  ripple: 40,
  dots: 20,
}

/** A ripple's speed outward, in pixels per second. */
export const RIPPLE_SPEED = 560
/** Width of a ripple's ring, in cells. */
export const RIPPLE_WIDTH = 1.6

export interface GridLayout {
  columns: number
  rows: number
  cell: number
}

/** Columns and rows of `cell`-pixel cells that cover a `width` × `height` box, from its top-left corner. */
export function gridLayout(
  width: number,
  height: number,
  cell: number,
): GridLayout {
  const size = Math.max(4, cell)
  return {
    columns: Math.max(0, Math.ceil(width / size)),
    rows: Math.max(0, Math.ceil(height / size)),
    cell: size,
  }
}

/** Index of the cell under (`x`, `y`), or -1 outside the grid. */
export function cellAt(layout: GridLayout, x: number, y: number): number {
  if (x < 0 || y < 0) return -1
  const column = Math.floor(x / layout.cell)
  const row = Math.floor(y / layout.cell)
  if (column >= layout.columns || row >= layout.rows) return -1
  return row * layout.columns + column
}

/**
 * How lit a cell is, from 0 to 1, by a ripple that started `age` seconds ago
 * at (`originX`, `originY`): a ring travelling outward at `RIPPLE_SPEED`,
 * brightest at its centre line and fading as it spreads.
 */
export function rippleStrength(
  distance: number,
  age: number,
  cell: number,
  lifetime: number,
): number {
  if (age < 0 || age > lifetime) return 0
  const front = age * RIPPLE_SPEED
  const half = (RIPPLE_WIDTH * cell) / 2
  const offset = Math.abs(distance - front)
  if (offset > half) return 0
  const ring = 1 - offset / half
  const fade = 1 - age / lifetime
  return ring * ring * fade
}

/** Seconds until a ripple from (`x`, `y`) has crossed the whole `width` × `height` box. */
export function rippleLifetime(
  x: number,
  y: number,
  width: number,
  height: number,
  cell: number,
): number {
  const far = Math.max(
    Math.hypot(x, y),
    Math.hypot(width - x, y),
    Math.hypot(x, height - y),
    Math.hypot(width - x, height - y),
  )
  return (far + RIPPLE_WIDTH * cell) / RIPPLE_SPEED
}

/** How strongly the pointer pulls a dot `distance` pixels away, within `radius`: 1 under it, 0 at the edge, smooth between. */
export function dotInfluence(distance: number, radius: number): number {
  if (radius <= 0 || distance >= radius) return 0
  const t = 1 - distance / radius
  return t * t * (3 - 2 * t)
}

/**
 * A mask image for tiles with gaps between them: one rounded square per
 * cell, as an SVG data URL. The mask only reads alpha, so the square is
 * drawn in the default fill.
 */
export function tileMask(cell: number, gap: number): string {
  const size = Math.max(1, cell - gap)
  const radius = Math.min(8, size * 0.18)
  const offset = gap / 2
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${cell}' height='${cell}'><rect x='${offset}' y='${offset}' width='${size}' height='${size}' rx='${radius}'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/**
 * Splits a list of CSS colours on its top-level commas, so
 * `rgb(1, 2, 3), var(--color-accent)` is two colours. A JSON array works too.
 */
export function splitColors(value: string | null | undefined): string[] {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return []
  if (trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      }
    } catch {
      // Not JSON: read it as a comma-separated list.
    }
  }
  const colors: string[] = []
  let depth = 0
  let current = ''
  for (const char of trimmed) {
    if (char === '(') depth += 1
    else if (char === ')') depth = Math.max(0, depth - 1)
    if (char === ',' && depth === 0) {
      if (current.trim()) colors.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) colors.push(current.trim())
  return colors
}
