import { html, LitElement, type PropertyValues } from 'lit'
import { CanvasColorController } from '../../controllers/canvas-color.controller'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import { CanvasPointerController } from '../../controllers/canvas-pointer.controller'
import { defineElement } from '../../utils/define-element'
import { createNoise, createRandom, type Noise } from '../../utils/noise'
import { flowFieldStyles } from './FlowField.styles'

export type FlowFieldVariant = 'waves' | 'vortex'

/** The theme's accent and chart colours, used when `colors` is not set. */
export const DEFAULT_FLOW_COLORS = [
  'var(--color-accent)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

/** Colours kept from `colors`; the colour controller resolves up to ten. */
const MAX_COLORS = 8
/** Trail points kept per vortex particle. */
const HISTORY = 16
/** Milliseconds of motion between two trail points, whatever the frame rate. */
const HISTORY_STEP = 1000 / 30
/** Opacity steps the vortex trails are drawn in, one stroke per colour and step. */
const LEVELS = 5

/**
 * Reads a colour list: a JSON array, or colours separated by commas outside
 * brackets, so `color-mix(in oklch, red, blue), var(--a)` is two colours.
 * Keeps at most eight.
 */
export function parseColorList(value: string | null | undefined): string[] {
  const text = (value ?? '').trim()
  if (!text) return []
  if (text.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, MAX_COLORS)
      }
    } catch {
      // Not JSON after all: read it as a plain list below.
    }
  }
  const colors: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i <= text.length; i++) {
    const char = text[i]
    if (char === '(') depth++
    else if (char === ')') depth = Math.max(0, depth - 1)
    if ((char === ',' && depth === 0) || i === text.length) {
      const color = text.slice(start, i).trim()
      if (color) colors.push(color)
      start = i + 1
    }
  }
  return colors.slice(0, MAX_COLORS)
}

/**
 * Direction, in radians, a vortex particle at (`x`, `y`) moves in: around
 * the centre (`cx`, `cy`) counter-clockwise on screen, drawn slightly inward,
 * and bent by `turbulence` (-1 to 1, from noise). Coordinates are scaled by
 * the half-width and half-height first, so the swirl fills a wide box as an
 * ellipse rather than a circle.
 */
export function vortexAngle(
  x: number,
  y: number,
  cx: number,
  cy: number,
  halfWidth: number,
  halfHeight: number,
  turbulence: number,
): number {
  const dx = (x - cx) / Math.max(1, halfWidth)
  const dy = (y - cy) / Math.max(1, halfHeight)
  // Tangent to the circle, with a little inward lean so particles spiral in.
  return Math.atan2(dy, dx) - Math.PI / 2 - 0.2 + turbulence * 0.75
}

/** Opacity over a particle's life, 0 to 1: it fades in, holds, and fades out. */
export function lifeAlpha(age: number, life: number): number {
  if (life <= 0 || age <= 0 || age >= life) return 0
  const t = age / life
  return Math.min(1, t * 6, (1 - t) * 4)
}

/**
 * Flowing waves of light, or a swirling vortex of particles, drawn from
 * smooth noise on a canvas behind its content: a living background for a
 * hero, a sign-up panel or an empty state.
 *
 * `variant="waves"` (the default) draws `count` translucent bands (5 by
 * default) that ripple across the area, softened by `blur`. `vortex` sends
 * particles circling the centre through a noise field, each leaving a short,
 * fading trail. `colors` takes a list of CSS colours or tokens (the accent
 * and chart colours by default) and `speed` sets the pace. With
 * `follow-pointer`, the waves lean toward a mouse or pen and the vortex
 * drifts to circle it.
 *
 * Keyboard and screen readers: the canvas is decorative and hidden from
 * screen readers (`aria-hidden`). The element takes no focus; content in its
 * slot is read and reached by Tab as usual, above the field.
 *
 * Reduced motion: the field is drawn once and stays still: the waves where
 * they begin, the vortex caught mid-swirl with its trails, and it no longer
 * follows the pointer.
 *
 * @slot - Content shown over the field.
 * @csspart canvas - The canvas the field is drawn on.
 * @cssprop --flow-field-opacity - Opacity of the field. Defaults to 1.
 */
export class MoulFlowField extends LitElement {
  static override styles = flowFieldStyles

  static override properties = {
    variant: { type: String, reflect: true },
    colors: {
      converter: {
        fromAttribute: (value: string | null) => parseColorList(value),
        toAttribute: (value: string[]) => value.join(', '),
      },
    },
    count: { type: Number },
    speed: { type: Number },
    blurRadius: { type: Number, attribute: 'blur' },
    followPointer: { type: Boolean, attribute: 'follow-pointer' },
  }

  /** `waves` (default): bands of light. `vortex`: particles circling the centre. */
  declare variant: FlowFieldVariant
  /** CSS colours or tokens, as an array or a comma-separated attribute. Defaults to the accent and chart colours. */
  declare colors: string[]
  /** Waves drawn (default 5, at most 12), or vortex particles (default from the area, at most 1200). */
  declare count: number | undefined
  /** Pace of the flow, as a multiple of the default. Defaults to 1. */
  declare speed: number
  /** Blur in CSS pixels (the `blur` attribute). Defaults to 12 for waves and 0 for the vortex. */
  declare blurRadius: number | undefined
  /** Lean the waves toward a mouse or pen, or move the vortex to circle it. */
  declare followPointer: boolean

  private noise: Noise = createNoise(11)
  private random = createRandom(11)
  private flowTime = 0
  /** Eased centre of the vortex, and how strongly the waves lean to the pointer. */
  private centerX = 0
  private centerY = 0
  private lean = 0
  private particleCount = 0
  /** Per particle: position, age and life in ms, and colour index. */
  private xs = new Float32Array(0)
  private ys = new Float32Array(0)
  private ages = new Float32Array(0)
  private lives = new Float32Array(0)
  private speeds = new Float32Array(0)
  private hues = new Uint8Array(0)
  /** Trail points, `HISTORY` (x, y) pairs per particle, written as a ring. */
  private trail = new Float32Array(0)
  private ring = 0
  private historyDebt = 0
  /** Segments sorted into colour × opacity buckets before stroking. */
  private segments = new Float32Array(0)
  private segmentBuckets = new Uint16Array(0)
  private bucketStarts = new Uint32Array(0)
  private bucketFill = new Uint32Array(0)
  private lastWidth = 0
  private lastHeight = 0

  private readonly palette = new CanvasColorController(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => {
      const list = this.colorList
      return Object.fromEntries(list.map((color, i) => [`c${i}`, color]))
    },
    onChange: () => this.loop.drawOnce(),
  })

  // Measured against the canvas, which reaches past the box when blurred.
  private readonly pointer = new CanvasPointerController(this, {
    pointerTypes: ['mouse', 'pen'],
    target: () => this.renderRoot.querySelector('canvas'),
  })

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot.querySelector('canvas'),
    draw: (frame) => this.paint(frame),
    resize: (frame) => this.layout(frame.width, frame.height),
  })

  constructor() {
    super()
    this.variant = 'waves'
    this.colors = []
    this.count = undefined
    this.speed = 1
    this.blurRadius = undefined
    this.followPointer = false
  }

  /** The colours in use: `colors`, or the theme defaults. */
  private get colorList(): string[] {
    const list = (Array.isArray(this.colors) ? this.colors : []).slice(
      0,
      MAX_COLORS,
    )
    return list.length > 0 ? list : DEFAULT_FLOW_COLORS
  }

  private get resolvedSpeed(): number {
    const speed = Number(this.speed)
    return Number.isFinite(speed) ? Math.min(10, Math.max(0, speed)) : 1
  }

  private get resolvedBlur(): number {
    const blur = Number(this.blurRadius)
    if (this.blurRadius == null || !Number.isFinite(blur)) {
      return this.variant === 'vortex' ? 0 : 12
    }
    return Math.min(80, Math.max(0, blur))
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('variant') && this.variant !== 'vortex') {
      this.variant = 'waves'
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('colors')) this.palette.refresh()
    if (
      (changed.has('variant') || changed.has('count')) &&
      this.loop.width > 0
    ) {
      this.layout(this.loop.width, this.loop.height)
      this.loop.drawOnce()
    }
  }

  private get waveCount(): number {
    const count = Number(this.count)
    return this.count != null && Number.isFinite(count)
      ? Math.min(12, Math.max(1, Math.round(count)))
      : 5
  }

  /** Particles for a box this size: about one per 1,200 square pixels, 120 to 900. */
  private vortexCount(width: number, height: number): number {
    const count = Number(this.count)
    if (this.count != null && Number.isFinite(count)) {
      return Math.min(1200, Math.max(1, Math.round(count)))
    }
    return Math.round(Math.min(900, Math.max(120, (width * height) / 1200)))
  }

  /** Seeds the field for this size, the same way every time, so the still frame is stable. */
  private layout(width: number, height: number): void {
    this.lastWidth = width
    this.lastHeight = height
    this.noise = createNoise(11)
    this.random = createRandom(11)
    this.flowTime = 0
    this.centerX = width / 2
    this.centerY = height / 2
    this.lean = 0
    if (this.variant !== 'vortex') {
      this.particleCount = 0
      return
    }
    const count = this.vortexCount(width, height)
    this.particleCount = count
    this.xs = new Float32Array(count)
    this.ys = new Float32Array(count)
    this.ages = new Float32Array(count)
    this.lives = new Float32Array(count)
    this.speeds = new Float32Array(count)
    this.hues = new Uint8Array(count)
    this.trail = new Float32Array(count * HISTORY * 2)
    this.segments = new Float32Array(count * HISTORY * 4)
    this.segmentBuckets = new Uint16Array(count * HISTORY)
    this.bucketStarts = new Uint32Array(MAX_COLORS * LEVELS + 1)
    this.bucketFill = new Uint32Array(MAX_COLORS * LEVELS)
    this.ring = 0
    this.historyDebt = 0
    for (let i = 0; i < count; i++) {
      this.spawn(i, width, height)
      // Spread ages so particles do not all fade at once.
      this.ages[i] = this.random() * this.lives[i] * 0.8
    }
    // Run the field a little so the first frame, and the still one, has trails.
    for (let step = 0; step < HISTORY + 2; step++) {
      this.stepVortex(HISTORY_STEP, width, height)
      this.pushHistory()
    }
  }

  /** Places particle `i` somewhere in the swirl and resets its trail there. */
  private spawn(i: number, width: number, height: number): void {
    const random = this.random
    const angle = random() * Math.PI * 2
    const radius = 0.15 + Math.sqrt(random()) * 0.95
    const x = this.centerX + Math.cos(angle) * radius * width * 0.5
    const y = this.centerY + Math.sin(angle) * radius * height * 0.5
    this.xs[i] = x
    this.ys[i] = y
    this.ages[i] = 0
    this.lives[i] = 2400 + random() * 4200
    this.speeds[i] = 0.55 + random() * 0.9
    this.hues[i] = Math.floor(random() * 255)
    const base = i * HISTORY * 2
    for (let k = 0; k < HISTORY; k++) {
      this.trail[base + k * 2] = x
      this.trail[base + k * 2 + 1] = y
    }
  }

  private stepVortex(delta: number, width: number, height: number): void {
    const noise = this.noise
    const halfWidth = width / 2
    const halfHeight = height / 2
    const time = this.flowTime * 0.00006
    // Pixels a particle covers per millisecond at speed 1, scaled to the box.
    const pace = Math.max(0.05, Math.min(width, height) / 3600)
    const reach = Math.max(width, height) * 0.08
    for (let i = 0; i < this.particleCount; i++) {
      const x = this.xs[i]
      const y = this.ys[i]
      const turbulence = noise.noise3(x * 0.0022, y * 0.0022, time)
      const angle = vortexAngle(
        x,
        y,
        this.centerX,
        this.centerY,
        halfWidth,
        halfHeight,
        turbulence,
      )
      const step = this.speeds[i] * pace * delta
      this.xs[i] = x + Math.cos(angle) * step
      this.ys[i] = y + Math.sin(angle) * step
      this.ages[i] += delta
      const dx = this.xs[i] - this.centerX
      const dy = this.ys[i] - this.centerY
      const outside =
        this.xs[i] < -reach ||
        this.xs[i] > width + reach ||
        this.ys[i] < -reach ||
        this.ys[i] > height + reach
      if (this.ages[i] >= this.lives[i] || outside || dx * dx + dy * dy < 36) {
        this.spawn(i, width, height)
      }
    }
  }

  private pushHistory(): void {
    this.ring = (this.ring + 1) % HISTORY
    const slot = this.ring * 2
    for (let i = 0; i < this.particleCount; i++) {
      const base = i * HISTORY * 2 + slot
      this.trail[base] = this.xs[i]
      this.trail[base + 1] = this.ys[i]
    }
  }

  private paint({ context, width, height, delta }: CanvasFrame): void {
    if (!context) return
    context.clearRect(0, 0, width, height)
    if (width !== this.lastWidth || height !== this.lastHeight) {
      this.layout(width, height)
    }
    const elapsed = delta * this.resolvedSpeed
    this.flowTime += elapsed
    const following = this.followPointer && this.pointer.state.isInside
    const ease = 1 - Math.exp(-delta / 500)
    this.lean += ((following ? 1 : 0) - this.lean) * ease
    const targetX = following ? this.pointer.state.x : width / 2
    const targetY = following ? this.pointer.state.y : height / 2
    this.centerX += (targetX - this.centerX) * ease
    this.centerY += (targetY - this.centerY) * ease
    if (this.variant === 'vortex') {
      this.paintVortex(context, width, height, elapsed)
    } else {
      this.paintWaves(context, width, height)
    }
    context.globalAlpha = 1
  }

  private paintWaves(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    const count = this.waveCount
    const colors = this.colorList.length
    const noise = this.noise
    const time = this.flowTime * 0.00011
    const amplitude = height * 0.2
    const thickness = Math.max(14, Math.min(72, height * 0.13))
    const step = Math.max(6, width / 160)
    const pointerX = this.pointer.state.x
    const pointerY = this.pointer.state.y
    const leanWidth = Math.max(80, width * 0.16)
    const lean = this.lean
    context.lineWidth = thickness
    context.lineJoin = 'round'
    context.lineCap = 'round'
    context.globalAlpha = 0.5
    for (let wave = 0; wave < count; wave++) {
      const offset = (wave - (count - 1) / 2) * (height * 0.045)
      context.strokeStyle = this.palette.get(`c${wave % colors}`)
      context.beginPath()
      for (let x = -thickness; x <= width + thickness; x += step) {
        let y =
          height / 2 +
          offset +
          noise.noise3(x / 720, wave * 0.31, time) * amplitude
        if (lean > 0.001) {
          const d = (x - pointerX) / leanWidth
          y += (pointerY - y) * 0.4 * lean * Math.exp(-d * d)
        }
        if (x === -thickness) context.moveTo(x, y)
        else context.lineTo(x, y)
      }
      context.stroke()
    }
  }

  private paintVortex(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    elapsed: number,
  ): void {
    if (elapsed > 0) {
      this.stepVortex(elapsed, width, height)
      this.historyDebt += elapsed
      while (this.historyDebt >= HISTORY_STEP) {
        this.historyDebt -= HISTORY_STEP
        this.pushHistory()
      }
    }
    const colors = this.colorList.length
    const buckets = colors * LEVELS
    const starts = this.bucketStarts
    const fill = this.bucketFill
    starts.fill(0)
    // First pass: count segments per colour and opacity step.
    let total = 0
    for (let i = 0; i < this.particleCount; i++) {
      const alpha = lifeAlpha(this.ages[i], this.lives[i])
      if (alpha <= 0) continue
      const color = this.hues[i] % colors
      for (let k = 0; k < HISTORY - 1; k++) {
        const level = Math.floor(alpha * (1 - k / (HISTORY - 1)) * LEVELS)
        if (level <= 0) continue
        const bucket = color * LEVELS + Math.min(LEVELS, level) - 1
        this.segmentBuckets[total++] = bucket
        starts[bucket + 1]++
      }
    }
    for (let b = 0; b < buckets; b++) starts[b + 1] += starts[b]
    fill.set(starts.subarray(0, buckets))
    // Second pass: write each segment into its bucket's slice, newest first.
    let index = 0
    for (let i = 0; i < this.particleCount; i++) {
      const alpha = lifeAlpha(this.ages[i], this.lives[i])
      if (alpha <= 0) continue
      const base = i * HISTORY * 2
      let headX = this.xs[i]
      let headY = this.ys[i]
      for (let k = 0; k < HISTORY - 1; k++) {
        const level = Math.floor(alpha * (1 - k / (HISTORY - 1)) * LEVELS)
        const slot = ((this.ring - k + HISTORY) % HISTORY) * 2
        const tailX = this.trail[base + slot]
        const tailY = this.trail[base + slot + 1]
        if (level > 0) {
          const at = fill[this.segmentBuckets[index++]]++ * 4
          this.segments[at] = headX
          this.segments[at + 1] = headY
          this.segments[at + 2] = tailX
          this.segments[at + 3] = tailY
        }
        headX = tailX
        headY = tailY
      }
    }
    context.lineCap = 'round'
    context.lineWidth = Math.max(1.2, Math.min(width, height) / 300)
    for (let b = 0; b < buckets; b++) {
      const from = starts[b]
      const to = starts[b + 1]
      if (to <= from) continue
      const color = Math.floor(b / LEVELS)
      const level = (b % LEVELS) + 1
      context.strokeStyle = this.palette.get(`c${color}`)
      context.globalAlpha = (level / LEVELS) * 0.9
      context.beginPath()
      for (let s = from; s < to; s++) {
        const at = s * 4
        context.moveTo(this.segments[at], this.segments[at + 1])
        context.lineTo(this.segments[at + 2], this.segments[at + 3])
      }
      context.stroke()
    }
  }

  protected override render() {
    return html`
      <div
        class=${this.resolvedBlur > 0 ? 'field is-blurred' : 'field'}
        style=${`--_blur: ${this.resolvedBlur}px`}
      >
        <canvas part="canvas" aria-hidden="true"></canvas>
      </div>
      <span class="color-probe"></span>
      <div class="content"><slot></slot></div>
    `
  }
}

defineElement('moul-flow-field', MoulFlowField)

declare global {
  interface HTMLElementTagNameMap {
    'moul-flow-field': MoulFlowField
  }
}
