/**
 * The magnification arithmetic of `moul-dock`, kept free of the DOM so it can
 * be tested on its own and run once per frame without touching layout.
 *
 * Items never change their layout box. Each one is scaled from its base,
 * and moved along the dock by the growth of the items before it, so the row
 * spreads out evenly on both sides of its resting middle, the way a desktop
 * dock does, while the browser only composites transforms.
 */

export interface DockLayoutInput {
  /** The resting centre of each child along the dock, in pixels from the dock's start edge. */
  centres: readonly number[]
  /** The resting size of each child along the dock, in pixels. */
  sizes: readonly number[]
  /** Whether each child grows: items do, separators do not. */
  grows: readonly boolean[]
  /** Where the pointer (or the focused item's centre) is along the dock, or null to rest. */
  focus: number | null
  /** The largest scale, for the item right under the pointer. */
  magnification: number
  /** How far from the pointer, in pixels, an item still grows. */
  distance: number
}

export interface DockLayout {
  /** The scale of each child, 1 at rest. */
  scales: number[]
  /** How far each child moves along the dock, in pixels, so the grown row stays evenly spaced. */
  shifts: number[]
  /** The total growth of the row, in pixels; it spreads half to each side. */
  grow: number
}

/**
 * A raised cosine: 1 at the pointer, falling smoothly to 0 at `distance`,
 * so the growth has no visible edge where it stops.
 */
export function dockFalloff(offset: number, distance: number): number {
  if (!(distance > 0)) return 0
  const d = Math.abs(offset)
  if (d >= distance) return 0
  return (1 + Math.cos((Math.PI * d) / distance)) / 2
}

/** Scales and shifts for each child of the dock. */
export function dockLayout(input: DockLayoutInput): DockLayout {
  const { centres, sizes, grows, focus, magnification, distance } = input
  const count = centres.length
  const scales = new Array<number>(count).fill(1)
  const shifts = new Array<number>(count).fill(0)
  if (focus === null || !(magnification > 1) || count === 0) {
    return { scales, shifts, grow: 0 }
  }

  const growth = new Array<number>(count).fill(0)
  for (let i = 0; i < count; i++) {
    if (!grows[i]) continue
    const scale =
      1 + (magnification - 1) * dockFalloff(focus - centres[i], distance)
    scales[i] = round(scale, 4)
    growth[i] = (sizes[i] ?? 0) * (scale - 1)
  }
  const total = growth.reduce((sum, value) => sum + value, 0)

  // Walk the children in the order they sit on screen (right to left text
  // reverses the DOM order), so each moves by the growth of those before it.
  const order = centres
    .map((centre, index) => ({ centre, index }))
    .sort((a, b) => a.centre - b.centre)
  let before = 0
  for (const { index } of order) {
    shifts[index] = round(-total / 2 + before + growth[index] / 2, 2)
    before += growth[index]
  }
  return { scales, shifts, grow: round(total, 2) }
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
