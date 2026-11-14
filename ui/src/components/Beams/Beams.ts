import { html, LitElement, nothing, type PropertyValues, svg } from 'lit'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { beamsStyles } from './Beams.styles'

/** `beams` sweeps curved paths from the top-left corner, `lines` runs waves across the width, `rain` drops beams that flash where they land. */
export type BeamsVariant = 'beams' | 'lines' | 'rain'

const VARIANTS: readonly BeamsVariant[] = ['beams', 'lines', 'rain']

/** Paths drawn when `count` is unset. */
const DEFAULT_COUNTS: Record<BeamsVariant, number> = {
  beams: 24,
  lines: 12,
  rain: 12,
}

const MIN_COUNT = 1
const MAX_COUNT = 48

/** The frame the paths are drawn in until the element has been measured. */
const DEFAULT_WIDTH = 1000
const DEFAULT_HEIGHT = 600

/** One path, the pulse of light that travels along it, and where it rests. */
export interface BeamTrack {
  /** The SVG path data, in pixels of a box `width` by `height`. */
  d: string
  /** Multiplies `--beams-duration` for this path's pulse. */
  speed: number
  /** How far into its cycle the pulse starts, from 0 to 1. */
  phase: number
  /** Length of the pulse's tail, as a share of the path. */
  tail: number
  /** Where the pulse's head rests under reduced motion, as a share of the path; below 0 it is hidden. */
  rest: number
  /** Where the path meets the bottom edge, as a percentage of the width (`rain`; 0 otherwise). */
  x: number
}

type Point = readonly [number, number]
type Cubic = readonly [Point, Point, Point, Point]

/** A number from 0 to 1 that depends only on its inputs, so the paths are the same on every render. */
function seeded(index: number, salt: number): number {
  let t = Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b)
  t = (t + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const between = (min: number, max: number, unit: number) =>
  min + (max - min) * unit

const round = (value: number) => Math.round(value * 10) / 10

const lerp = (a: Point, b: Point, t: number): Point => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
]

function pointOn(curve: Cubic, t: number): Point {
  const [p0, p1, p2, p3] = curve
  const a = lerp(p0, p1, t)
  const b = lerp(p1, p2, t)
  const c = lerp(p2, p3, t)
  return lerp(lerp(a, b, t), lerp(b, c, t), t)
}

/** Splits a cubic Bézier curve at `t` (de Casteljau). */
function splitCubic(curve: Cubic, t: number): [Cubic, Cubic] {
  const [p0, p1, p2, p3] = curve
  const a = lerp(p0, p1, t)
  const b = lerp(p1, p2, t)
  const c = lerp(p2, p3, t)
  const ab = lerp(a, b, t)
  const bc = lerp(b, c, t)
  const mid = lerp(ab, bc, t)
  return [
    [p0, a, ab, mid],
    [mid, bc, c, p3],
  ]
}

/** The part of a cubic curve between `from` and `to`. */
function trimCubic(curve: Cubic, from: number, to: number): Cubic {
  let part = curve
  if (to < 1) part = splitCubic(part, to)[0]
  if (from > 0) part = splitCubic(part, from / to)[1]
  return part
}

const scale = (point: Point, width: number, height: number): string =>
  `${round(point[0] * width)} ${round(point[1] * height)}`

const cubicData = (curve: Cubic, width: number, height: number): string =>
  `C${scale(curve[1], width, height)} ${scale(curve[2], width, height)} ${scale(curve[3], width, height)}`

/** True for a point inside the box, with a small margin, in shares of its width and height. */
const isInside = ([u, v]: Point) =>
  u > -0.02 && u < 1.02 && v > -0.02 && v < 1.02

/**
 * A sheaf of S-curves, each the same shape moved along the diagonal, that
 * sweep in from beyond the top-left corner and leave by the bottom or right
 * edge. Each is trimmed to the stretch that crosses the box, so its pulse
 * spends its time where it can be seen.
 */
function beamPath(share: number, width: number, height: number): string {
  const dx = 0.04 + 0.5 * share
  const dy = -1.27 * share
  const at = (u: number, v: number): Point => [u + dx, v + dy]
  const start = at(-0.55, -0.6)
  const bend = at(-0.45, 0.68)
  const middle = at(0.22, 1.09)
  const end = at(0.98, 2.77)
  // The second half mirrors the first bend through the middle, as SVG's S command does.
  const mirror: Point = [2 * middle[0] - bend[0], 2 * middle[1] - bend[1]]
  const halves: Cubic[] = [
    [start, start, bend, middle],
    [middle, mirror, end, end],
  ]

  const steps = 48
  let first = -1
  let last = -1
  for (let index = 0; index <= steps * 2; index++) {
    const along = index / steps
    const half = halves[Math.min(1, Math.floor(along))]
    if (isInside(pointOn(half, along >= 2 ? 1 : along % 1))) {
      if (first < 0) first = along
      last = along
    }
  }
  const from = first < 0 ? 0 : Math.max(0, first - 1 / steps)
  const to = last < 0 ? 2 : Math.min(2, last + 1 / steps)

  const parts: Cubic[] = []
  if (from < 1) parts.push(trimCubic(halves[0], from, Math.min(1, to)))
  if (to > 1) parts.push(trimCubic(halves[1], Math.max(0, from - 1), to - 1))
  return `M${scale(parts[0][0], width, height)}${parts
    .map((part) => cubicData(part, width, height))
    .join('')}`
}

/** A gentle wave across the whole width, through sampled points joined smoothly (Catmull-Rom). */
function linePath(index: number, count: number, width: number, height: number) {
  const baseline =
    ((index + 0.5 + (seeded(index, 1) - 0.5) * 0.5) / count) * height
  const amplitude = between(0.025, 0.07, seeded(index, 2)) * height
  const wavelength = between(0.55, 1.15, seeded(index, 3)) * width
  const offset = seeded(index, 4) * Math.PI * 2
  const step = wavelength / 6
  const points: Point[] = []
  for (let x = -0.05 * width - step; x <= 1.05 * width + 2 * step; x += step) {
    points.push([
      x,
      baseline + amplitude * Math.sin((2 * Math.PI * x) / wavelength + offset),
    ])
  }
  let data = `M${round(points[1][0])} ${round(points[1][1])}`
  for (let k = 1; k < points.length - 2; k++) {
    const [a, b, c, d] = [
      points[k - 1],
      points[k],
      points[k + 1],
      points[k + 2],
    ]
    data += `C${round(b[0] + (c[0] - a[0]) / 6)} ${round(b[1] + (c[1] - a[1]) / 6)} ${round(c[0] - (d[0] - b[0]) / 6)} ${round(c[1] - (d[1] - b[1]) / 6)} ${round(c[0])} ${round(c[1])}`
  }
  return data
}

/** Per variant: the range of speeds (as multiples of the duration) and of tail lengths. */
const PULSES: Record<
  BeamsVariant,
  { speed: [number, number]; tail: [number, number] }
> = {
  beams: { speed: [0.8, 1.6], tail: [0.14, 0.24] },
  lines: { speed: [0.75, 1.5], tail: [0.1, 0.18] },
  rain: { speed: [0.7, 1.3], tail: [0.16, 0.32] },
}

/**
 * The paths for `count` tracks of a variant in a box `width` by `height`
 * pixels, with each pulse's speed, starting point and tail. The result
 * depends only on its arguments.
 */
export function beamTracks(
  variant: BeamsVariant,
  count: number,
  width: number,
  height: number,
): BeamTrack[] {
  const { speed, tail } = PULSES[variant]
  return Array.from({ length: count }, (_, index) => {
    const pulseTail =
      round(between(tail[0], tail[1], seeded(index, 6)) * 100) / 100
    // Every third pulse stays in sight, mid-path, when nothing may move.
    const rest =
      index % 3 === 0
        ? round((pulseTail + between(0.2, 0.55, seeded(index, 7))) * 100) / 100
        : -1
    let d: string
    let x = 0
    if (variant === 'lines') {
      d = linePath(index, count, width, height)
    } else if (variant === 'rain') {
      x = (index + 0.5 + (seeded(index, 1) - 0.5) * 0.6) / count
      d = `M${round(x * width)} -2V${round(height)}`
    } else {
      const share =
        count === 1
          ? 0.5
          : Math.min(
              1,
              Math.max(
                0,
                index / (count - 1) +
                  (seeded(index, 1) - 0.5) * (0.6 / (count - 1)),
              ),
            )
      d = beamPath(share, width, height)
    }
    return {
      d,
      speed: round(between(speed[0], speed[1], seeded(index, 5)) * 100) / 100,
      phase: round(seeded(index, 8) * 100) / 100,
      tail: pulseTail,
      rest,
      x: round(x * 100),
    }
  })
}

/**
 * A background of faint lines with light travelling along them, for a hero
 * or a feature section: `beams` (the default) sweeps long curved paths in
 * from the top-left corner with pulses of light running along them,
 * `lines` runs gentle waves across the width with dashes of light flowing
 * along them, and `rain` drops beams of light from the top that flash where
 * they land on the bottom edge. Wrap the section's content in it: the paths
 * are drawn behind the content, fill the element and scale to any size, and
 * `count` sets how many there are. It adds no padding or background colour,
 * so give the element (or its parent) those. An empty one with `position:
 * absolute; inset: 0` is a layer of its own. The paths are SVG and the light
 * is CSS; it stops while off screen. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The paths
 * are decorative and hidden from assistive technology; the wrapped content
 * is read and reached as if the element were not there. Where the system
 * forces its own colours (Windows high contrast) and when printing, the
 * paths are not drawn.
 *
 * Reduced motion: the faint paths stay and no light travels; every third
 * pulse rests partway along its path, so the picture still looks lit.
 *
 * @slot - The content shown over the paths.
 *
 * @csspart background - The layer behind the content that holds the paths. It ignores the pointer.
 *
 * @cssprop --beams-color - The faint paths. Defaults to `--color-fg` at about 10%.
 * @cssprop --beams-light - The head of each pulse, and the glow round it. Defaults to `var(--color-accent)`.
 * @cssprop --beams-light-tail - The colour each pulse fades into towards its tail. Defaults to `var(--color-chart-4)`.
 * @cssprop --beams-duration - The base cycle of a pulse; each path runs a little faster or slower. Defaults to `10s` for `beams` and `8s` for `lines` and `rain`.
 */
export class MoulBeams extends LitElement {
  static override styles = beamsStyles

  static override properties = {
    variant: { type: String, reflect: true },
    count: { type: Number },
    box: { state: true },
  }

  /** Which paths are drawn and how the light moves. Defaults to `beams`. */
  declare variant: BeamsVariant
  /** How many paths, from 1 to 48. Defaults to 24 for `beams` and 12 for `lines` and `rain`. */
  declare count: number | undefined
  /** The measured size of the background, in whole pixels. */
  private declare box: { width: number; height: number }

  private readonly inView: InViewController
  private resizeObserver: ResizeObserver | null = null

  constructor() {
    super()
    this.variant = 'beams'
    this.count = undefined
    this.box = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
    // Pausing goes through a class, so pulses drawn while off screen start paused too.
    this.inView = new InViewController(this, { pauseOffscreen: false })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    // On a reconnect the shadow tree is already there; the first connect waits for firstUpdated.
    if (this.hasUpdated) this.observeSize()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('variant') && !VARIANTS.includes(this.variant)) {
      this.variant = 'beams'
    }
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed)
    this.observeSize()
  }

  /** The number of paths drawn: `count` rounded and kept from 1 to 48, or the variant's default. */
  private get pathCount(): number {
    const count = Number(this.count)
    if (this.count == null || !Number.isFinite(count)) {
      return DEFAULT_COUNTS[this.variant] ?? DEFAULT_COUNTS.beams
    }
    return Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(count)))
  }

  private observeSize(): void {
    if (this.resizeObserver || typeof ResizeObserver !== 'function') return
    const background = this.renderRoot.querySelector('[part="background"]')
    if (!background) return
    this.resizeObserver = new ResizeObserver((entries) => {
      const box = entries[entries.length - 1]?.contentRect
      if (!box) return
      const width = Math.round(box.width)
      const height = Math.round(box.height)
      if (width <= 0 || height <= 0) return
      if (width === this.box.width && height === this.box.height) return
      this.box = { width, height }
    })
    this.resizeObserver.observe(background)
  }

  protected override render() {
    const { width, height } = this.box
    const variant = VARIANTS.includes(this.variant) ? this.variant : 'beams'
    const tracks = beamTracks(variant, this.pathCount, width, height)
    const viewBox = `0 0 ${width} ${height}`
    // Each layer is redrawn at the measured size, so strokes stay one pixel
    // wide; until then the default frame stretches to fit.
    return html`<div
        part="background"
        class=${this.inView.isInView ? '' : 'is-offscreen'}
        aria-hidden="true"
      >
        <svg class="tracks" viewBox=${viewBox} preserveAspectRatio="none">
          ${tracks.map((track) => svg`<path d=${track.d}></path>`)}
        </svg>
        <svg class="lights" viewBox=${viewBox} preserveAspectRatio="none">
          ${tracks.map(
            (track) => svg`<g
              class="light"
              style=${`--_beams-speed: ${track.speed}; --_beams-phase: ${track.phase}; --_beams-tail: ${track.tail}; --_beams-rest: ${track.rest}`}
            >
              <path class="pulse tail" d=${track.d} pathLength="1"></path>
              <path class="pulse body" d=${track.d} pathLength="1"></path>
              <path class="pulse head" d=${track.d} pathLength="1"></path>
            </g>`,
          )}
        </svg>
        ${
          variant === 'rain'
            ? tracks.map(
                (track) =>
                  html`<span
                    class="flash"
                    style=${`left: ${track.x}%; --_beams-speed: ${track.speed}; --_beams-phase: ${track.phase}`}
                  ></span>`,
              )
            : nothing
        }
      </div>
      <slot></slot>`
  }
}

defineElement('moul-beams', MoulBeams)

declare global {
  interface HTMLElementTagNameMap {
    'moul-beams': MoulBeams
  }
}
