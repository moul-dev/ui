import { html, LitElement, type PropertyValues } from 'lit'
import {
  CanvasColorController,
  withAlpha,
} from '../../controllers/canvas-color.controller'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import { CanvasPointerController } from '../../controllers/canvas-pointer.controller'
import { defineElement } from '../../utils/define-element'
import { createRandom } from '../../utils/noise'
import { warpStyles } from './Warp.styles'

export type WarpVariant = 'streaks' | 'grid'
export type WarpBoost = 'none' | 'hover' | 'press'

const VARIANTS: readonly WarpVariant[] = ['streaks', 'grid']
const BOOSTS: readonly WarpBoost[] = ['none', 'hover', 'press']

/** Streaks per 10,000 px² when `density` is not set. */
const DEFAULT_DENSITY = 9
/** The most streaks a field draws, however large it is. */
export const MAX_STREAKS = 600
/** How much faster everything runs while boosted. */
export const BOOST_FACTOR = 5
/** Milliseconds for the speed to cover most of the way to a new target. */
const BOOST_EASE_MS = 220
/** Depth units a streak travels per second at speed 1 (it starts at depth 1). */
const STREAK_SPEED = 0.32
/** A streak's tail sits this much deeper than its head, at speed 1: a quarter of its distance from the centre. */
const STREAK_STRETCH = 0.32
/** Depth buckets, so all streaks take four strokes. */
const STREAK_BUCKETS = 4
/** The nearest a streak comes before it starts again far away. */
const NEAR = 0.03
/** Tunnel: the far end's depth, the gap between rings, ring speed and beams. */
const TUNNEL_FAR = 14
const RING_GAP = 0.9
const RING_SPEED = 1.4
const BEAMS = 7
/** Sprite resolution in device pixels. */
const GLOW_SIZE = 128
const BEAM_WIDTH = 256
const BEAM_HEIGHT = 16

interface Streak {
  /** Position across the field, -1 to 1 on the longer side. */
  x: number
  y: number
  /** Depth: 1 is far, NEAR is passing the viewer. */
  z: number
}

interface Beam {
  /** 0 top, 1 right, 2 bottom, 3 left. */
  wall: number
  /** Where along the wall, -1 to 1. */
  offset: number
  /** Depth of the beam's head. */
  z: number
  length: number
  /** Depth units per second. */
  speed: number
}

/** `boost` takes `hover` or `press`; anything else means none. */
export function parseBoost(value: unknown): WarpBoost {
  return BOOSTS.includes(value as WarpBoost) ? (value as WarpBoost) : 'none'
}

/** How many streaks a `width` × `height` field holds at `density` per 10,000 px². */
export function streakCount(
  width: number,
  height: number,
  density: number,
): number {
  if (!(width > 0) || !(height > 0) || !(density > 0)) return 0
  return Math.min(MAX_STREAKS, Math.round(((width * height) / 10000) * density))
}

/**
 * Where a point at (`x`, `y`) and depth `z` lands on screen, for a vanishing
 * point at (`cx`, `cy`) and a focal length in CSS pixels. Nearer points land
 * further from the centre.
 */
export function project(
  x: number,
  y: number,
  z: number,
  cx: number,
  cy: number,
  focal: number,
): { x: number; y: number } {
  const depth = Math.max(z, 0.0001)
  return { x: cx + (x / depth) * focal, y: cy + (y / depth) * focal }
}

/**
 * Moves `current` toward `target` over `delta` milliseconds, most of the way
 * in about `BOOST_EASE_MS`, so a boost speeds up and slows down smoothly.
 */
export function easeToward(
  current: number,
  target: number,
  delta: number,
): number {
  if (delta <= 0) return current
  return target + (current - target) * Math.exp(-delta / BOOST_EASE_MS)
}

const parseNumber = (value: unknown, fallback: number): number => {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) && number >= 0 ? number : fallback
}

/**
 * Light-speed motion behind a hero or a section, drawn on a canvas. With
 * `variant="streaks"` (the default) streaks of light rush out of the centre
 * toward the viewer, short and faint far away, long and bright as they pass.
 * `grid` draws a tunnel instead: rings flow out of a vanishing point along
 * four walls of lines, and beams of light run down the lines toward the
 * viewer. `boost="hover"` or `boost="press"` makes the whole field speed up
 * smoothly while the pointer is over it or pressed on it, and ease back
 * after. `speed` sets the pace, `density` how many streaks there are per
 * 10,000 px², and `color` their colour.
 *
 * Keyboard and screen readers: the element is never focusable and adds no
 * role. The canvas is decoration, hidden from screen readers and from the
 * pointer, so wrapped content is read, focused and clicked as it is. The
 * boost follows the pointer only; it changes nothing but the decoration.
 *
 * Reduced motion: one still frame is drawn, from a fixed seed: streaks as
 * short fixed lines out of the centre, or the tunnel with its beams held in
 * place. The boost does nothing.
 *
 * @slot - Content shown over the field. Leave it empty to use the element as a background layer.
 * @csspart canvas - The canvas the field is drawn on.
 */
export class MoulWarp extends LitElement {
  static override styles = warpStyles

  static override properties = {
    variant: { type: String, reflect: true },
    speed: { type: Number },
    density: { type: Number },
    boost: { type: String },
    color: { type: String },
    seed: { type: Number },
  }

  /** `streaks` (light-speed streaks) or `grid` (a tunnel of flowing rings and beams). Defaults to `streaks`. */
  declare variant: WarpVariant
  /** Multiplies the pace. Defaults to 1. */
  declare speed: number
  /** Streaks per 10,000 px². Defaults to 9; at most 600 streaks in all. */
  declare density: number
  /** Speeds the field up while the pointer is over it (`hover`) or pressed on it (`press`). Defaults to `none`. */
  declare boost: WarpBoost
  /** Colour of the streaks, lines and beams, any CSS colour or token. Defaults to the accent colour. */
  declare color: string
  /** Seed for the layout. Defaults to 1. */
  declare seed: number

  private streaks: Streak[] = []
  private beams: Beam[] = []
  private random: () => number = createRandom(1)
  private fieldWidth = 0
  private fieldHeight = 0
  /** The boost as it eases, from 1 to BOOST_FACTOR. */
  private pace = 1
  /** How far the rings have flowed, in depth units. */
  private flow = 0
  private glowSprite: HTMLCanvasElement | null = null
  private beamSprite: HTMLCanvasElement | null = null
  private spriteKey = ''
  private segments = new Float32Array(0)
  private segmentCounts = new Uint16Array(STREAK_BUCKETS)

  private readonly palette = new CanvasColorController(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => ({ main: this.color || 'var(--color-accent)' }),
    onChange: () => {
      this.spriteKey = ''
      this.loop.drawOnce()
    },
  })

  private readonly pointerState = new CanvasPointerController(this)

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot.querySelector('canvas'),
    resize: ({ width, height }) => this.layout(width, height),
    draw: (frame) => this.paint(frame),
  })

  constructor() {
    super()
    this.variant = 'streaks'
    this.speed = 1
    this.density = DEFAULT_DENSITY
    this.boost = 'none'
    this.color = ''
    this.seed = 1
  }

  /** Whether the boost is asked for right now (it eases in and out over a few frames). */
  public get isBoosted(): boolean {
    const boost = parseBoost(this.boost)
    const pointer = this.pointerState.state
    if (boost === 'hover') return pointer.isInside
    if (boost === 'press') return pointer.isDown && pointer.isInside
    return false
  }

  /** Streaks drawn right now (0 in the grid). */
  public get streakTotal(): number {
    return this.variant === 'streaks' ? this.streaks.length : 0
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('variant') && !VARIANTS.includes(this.variant)) {
      this.variant = 'streaks'
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('color')) this.palette.refresh()
    if (
      changed.has('variant') ||
      changed.has('density') ||
      changed.has('seed')
    ) {
      this.streaks = []
      this.beams = []
      this.layout(this.fieldWidth, this.fieldHeight)
      this.loop.drawOnce()
    } else if (changed.has('speed')) {
      this.loop.drawOnce()
    }
  }

  private layout(width: number, height: number): void {
    this.fieldWidth = width
    this.fieldHeight = height
    const seed = Math.round(parseNumber(this.seed, 1))
    if (this.variant === 'grid') {
      if (this.beams.length === 0) {
        this.random = createRandom(seed * 7919 + 5)
        for (let i = 0; i < BEAMS; i++) {
          const beam = this.newBeam()
          // Start spread along the tunnel, so the first frame already has beams in it.
          beam.z = 1.5 + this.random() * (TUNNEL_FAR * 0.45)
          this.beams.push(beam)
        }
      }
      return
    }
    const count = streakCount(
      width,
      height,
      parseNumber(this.density, DEFAULT_DENSITY),
    )
    if (this.streaks.length === 0) this.random = createRandom(seed * 7919 + 7)
    while (this.streaks.length < count) {
      const streak = this.newStreak()
      // Spread through the depth, so the field starts full rather than as a wave.
      streak.z = NEAR + this.random() * (1 - NEAR)
      this.streaks.push(streak)
    }
    if (this.streaks.length > count) this.streaks.length = count
    if (this.segments.length < count * 4 * STREAK_BUCKETS) {
      this.segments = new Float32Array(count * 4 * STREAK_BUCKETS)
    }
  }

  /** A new streak far away, placed so that it lands inside the field as it nears. */
  private newStreak(): Streak {
    const aspect =
      this.fieldWidth > 0 && this.fieldHeight > 0
        ? this.fieldHeight / this.fieldWidth
        : 1
    const wide = aspect <= 1
    // Keep clear of the dead centre, where a streak would never move.
    let x = 0
    let y = 0
    do {
      x = (this.random() * 2 - 1) * (wide ? 1 : 1 / aspect)
      y = (this.random() * 2 - 1) * (wide ? aspect : 1)
    } while (x * x + y * y < 0.0025)
    return { x, y, z: 1 }
  }

  private newBeam(): Beam {
    return {
      wall: Math.floor(this.random() * 4),
      offset: this.random() * 1.6 - 0.8,
      z: TUNNEL_FAR,
      length: 1.6 + this.random() * 2.4,
      speed: 2.5 + this.random() * 3,
    }
  }

  private ensureSprites(pixelRatio: number): boolean {
    const color = this.palette.get('main')
    const key = `${color}|${pixelRatio}`
    if (this.glowSprite && this.beamSprite && this.spriteKey === key) {
      return true
    }
    if (typeof document === 'undefined') return false
    const glow = this.glowSprite ?? document.createElement('canvas')
    glow.width = GLOW_SIZE
    glow.height = GLOW_SIZE
    const glowContext = glow.getContext('2d')
    const beam = this.beamSprite ?? document.createElement('canvas')
    beam.width = BEAM_WIDTH
    beam.height = BEAM_HEIGHT
    const beamContext = beam.getContext('2d')
    if (!glowContext || !beamContext) return false

    const c = GLOW_SIZE / 2
    glowContext.clearRect(0, 0, GLOW_SIZE, GLOW_SIZE)
    const gradient = glowContext.createRadialGradient(c, c, 0, c, c, c)
    gradient.addColorStop(0, withAlpha(color, 0.9))
    gradient.addColorStop(0.2, withAlpha(color, 0.35))
    gradient.addColorStop(1, withAlpha(color, 0))
    glowContext.fillStyle = gradient
    glowContext.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE)

    const mid = BEAM_HEIGHT / 2
    beamContext.clearRect(0, 0, BEAM_WIDTH, BEAM_HEIGHT)
    const line = beamContext.createLinearGradient(0, 0, BEAM_WIDTH, 0)
    line.addColorStop(0, withAlpha(color, 0))
    line.addColorStop(0.7, withAlpha(color, 0.55))
    line.addColorStop(1, withAlpha(color, 1))
    beamContext.fillStyle = line
    beamContext.fillRect(0, mid - 1.5, BEAM_WIDTH, 3)
    const halo = beamContext.createLinearGradient(0, 0, 0, BEAM_HEIGHT)
    halo.addColorStop(0, withAlpha(color, 0))
    halo.addColorStop(0.5, withAlpha(color, 0.3))
    halo.addColorStop(1, withAlpha(color, 0))
    beamContext.globalCompositeOperation = 'source-atop'
    beamContext.fillStyle = halo
    beamContext.fillRect(0, 0, BEAM_WIDTH, BEAM_HEIGHT)
    beamContext.globalCompositeOperation = 'destination-over'
    beamContext.globalAlpha = 0.35
    beamContext.fillStyle = line
    beamContext.fillRect(BEAM_WIDTH * 0.3, 0, BEAM_WIDTH * 0.7, BEAM_HEIGHT)
    beamContext.globalAlpha = 1
    beamContext.globalCompositeOperation = 'source-over'

    this.glowSprite = glow
    this.beamSprite = beam
    this.spriteKey = key
    return true
  }

  private paint(frame: CanvasFrame): void {
    const { context, width, height, pixelRatio, delta } = frame
    if (!context) return
    context.clearRect(0, 0, width, height)
    if (!this.ensureSprites(pixelRatio)) return
    this.pace = easeToward(this.pace, this.isBoosted ? BOOST_FACTOR : 1, delta)
    if (this.variant === 'grid') this.paintTunnel(context, frame)
    else this.paintStreaks(context, frame)
  }

  private paintStreaks(
    context: CanvasRenderingContext2D,
    { width, height, delta }: CanvasFrame,
  ): void {
    const cx = width / 2
    const cy = height / 2
    const focal = Math.max(width, height) / 2
    const velocity = STREAK_SPEED * parseNumber(this.speed, 1) * this.pace
    const travel = velocity * (delta / 1000)
    // Faster means longer streaks; the still frame shows them as at speed 1.
    const stretch =
      1 + STREAK_STRETCH * Math.max(1, velocity / STREAK_SPEED) ** 0.75
    const counts = this.segmentCounts
    counts.fill(0)
    const segments = this.segments
    const stride = this.streaks.length * 4

    // A soft glow where the streaks come from.
    const glow = this.glowSprite as HTMLCanvasElement
    const glowSize = Math.min(width, height) * (0.5 + 0.08 * this.pace)
    context.globalAlpha = 0.22 + 0.06 * this.pace
    context.drawImage(
      glow,
      cx - glowSize,
      cy - glowSize,
      glowSize * 2,
      glowSize * 2,
    )

    for (const streak of this.streaks) {
      streak.z -= travel
      let headX = cx + (streak.x / Math.max(streak.z, 0.0001)) * focal
      let headY = cy + (streak.y / Math.max(streak.z, 0.0001)) * focal
      if (
        streak.z <= NEAR ||
        headX < -40 ||
        headX > width + 40 ||
        headY < -40 ||
        headY > height + 40
      ) {
        const next = this.newStreak()
        streak.x = next.x
        streak.y = next.y
        streak.z = 1
        headX = cx + streak.x * focal
        headY = cy + streak.y * focal
      }
      const tailZ = Math.min(streak.z * stretch, 1.2)
      const tailX = cx + (streak.x / tailZ) * focal
      const tailY = cy + (streak.y / tailZ) * focal
      const bucket = Math.min(
        STREAK_BUCKETS - 1,
        Math.floor((1 - streak.z) * STREAK_BUCKETS),
      )
      const at = bucket * stride + counts[bucket] * 4
      segments[at] = tailX
      segments[at + 1] = tailY
      segments[at + 2] = headX
      segments[at + 3] = headY
      counts[bucket]++
    }

    context.strokeStyle = this.palette.get('main')
    context.lineCap = 'round'
    for (let bucket = 0; bucket < STREAK_BUCKETS; bucket++) {
      const count = counts[bucket]
      if (count === 0) continue
      const nearness = (bucket + 1) / STREAK_BUCKETS
      context.beginPath()
      const base = bucket * stride
      for (let i = 0; i < count; i++) {
        const at = base + i * 4
        context.moveTo(segments[at], segments[at + 1])
        context.lineTo(segments[at + 2], segments[at + 3])
      }
      context.lineWidth = 0.6 + nearness * nearness * 2.2
      context.globalAlpha = 0.15 + nearness * 0.75
      context.stroke()
    }
    context.globalAlpha = 1
  }

  /** The point on a tunnel wall at `offset` (-1 to 1 along the wall) and depth `z`. */
  private wallPoint(
    wall: number,
    offset: number,
    z: number,
    cx: number,
    cy: number,
  ): { x: number; y: number } {
    const halfW = cx / z
    const halfH = cy / z
    switch (wall) {
      case 0:
        return { x: cx + offset * halfW, y: cy - halfH }
      case 1:
        return { x: cx + halfW, y: cy + offset * halfH }
      case 2:
        return { x: cx + offset * halfW, y: cy + halfH }
      default:
        return { x: cx - halfW, y: cy + offset * halfH }
    }
  }

  private paintTunnel(
    context: CanvasRenderingContext2D,
    { width, height, delta, pixelRatio }: CanvasFrame,
  ): void {
    const cx = width / 2
    const cy = height / 2
    const seconds = delta / 1000
    const pace = parseNumber(this.speed, 1) * this.pace
    this.flow = (this.flow + RING_SPEED * pace * seconds) % RING_GAP
    const color = this.palette.get('main')
    context.strokeStyle = color
    context.lineWidth = 1

    // Rails: lines along the four walls, from the near edge to the far end.
    const railsAcross = Math.max(4, Math.round(width / 70))
    const railsDown = Math.max(3, Math.round(height / 70))
    context.globalAlpha = 0.22
    context.beginPath()
    for (let wall = 0; wall < 4; wall++) {
      const rails = wall % 2 === 0 ? railsAcross : railsDown
      for (let i = 0; i <= rails; i++) {
        const offset = (i / rails) * 2 - 1
        const near = this.wallPoint(wall, offset, 1, cx, cy)
        const far = this.wallPoint(wall, offset, TUNNEL_FAR, cx, cy)
        context.moveTo(near.x, near.y)
        context.lineTo(far.x, far.y)
      }
    }
    context.stroke()

    // Rings: rectangles at even depths, flowing toward the viewer, fainter far away.
    for (let z = 1 + RING_GAP - this.flow; z < TUNNEL_FAR; z += RING_GAP) {
      const fade = 1 - (z - 1) / (TUNNEL_FAR - 1)
      context.globalAlpha = 0.45 * fade * fade
      const halfW = cx / z
      const halfH = cy / z
      context.strokeRect(cx - halfW, cy - halfH, halfW * 2, halfH * 2)
    }

    // Beams run down the rails toward the viewer.
    const beam = this.beamSprite as HTMLCanvasElement
    for (let i = 0; i < this.beams.length; i++) {
      const item = this.beams[i]
      item.z -= item.speed * pace * seconds
      if (item.z + item.length < 1) {
        this.beams[i] = this.newBeam()
        continue
      }
      const headZ = Math.max(item.z, 1)
      const tailZ = Math.min(item.z + item.length, TUNNEL_FAR)
      if (tailZ <= headZ) continue
      const head = this.wallPoint(item.wall, item.offset, headZ, cx, cy)
      const tail = this.wallPoint(item.wall, item.offset, tailZ, cx, cy)
      const dx = head.x - tail.x
      const dy = head.y - tail.y
      const length = Math.sqrt(dx * dx + dy * dy)
      if (length < 1) continue
      const cos = (dx / length) * pixelRatio
      const sin = (dy / length) * pixelRatio
      const fade = 1 - (headZ - 1) / (TUNNEL_FAR - 1)
      const thickness = 2 + 6 * fade
      context.globalAlpha = 0.35 + 0.65 * fade
      context.setTransform(
        cos,
        sin,
        -sin,
        cos,
        tail.x * pixelRatio,
        tail.y * pixelRatio,
      )
      context.drawImage(beam, 0, -thickness / 2, length, thickness)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    // Fade everything into the background toward the vanishing point,
    // whatever colour the background is.
    const glow = this.glowSprite as HTMLCanvasElement
    const fadeSize = Math.min(width, height) * 0.42
    context.globalCompositeOperation = 'destination-out'
    context.globalAlpha = 1
    context.drawImage(
      glow,
      cx - fadeSize,
      cy - fadeSize,
      fadeSize * 2,
      fadeSize * 2,
    )
    context.globalCompositeOperation = 'source-over'
    context.globalAlpha = 1
  }

  protected override render() {
    return html`
      <canvas part="canvas" aria-hidden="true"></canvas>
      <span class="color-probe"></span>
      <div class="content"><slot></slot></div>
    `
  }
}

defineElement('moul-warp', MoulWarp)

declare global {
  interface HTMLElementTagNameMap {
    'moul-warp': MoulWarp
  }
}
