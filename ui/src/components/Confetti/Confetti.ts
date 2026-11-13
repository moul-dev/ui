import { html, LitElement } from 'lit'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { confettiStyles } from './Confetti.styles'

export type ConfettiShape = 'square' | 'circle' | 'strip'
export type ConfettiVariant = 'burst' | 'rocket'

export interface ConfettiPoint {
  x: number
  y: number
}

export interface ConfettiOptions {
  /** Where the burst starts: an element's centre, or a point in viewport pixels. Defaults to the element's own centre, or the middle of the viewport when it has no box. */
  origin?: Element | ConfettiPoint
  /** `burst` throws confetti from the origin; `rocket` launches a rocket that bursts at the top of its flight. Defaults to the `variant` attribute. */
  variant?: ConfettiVariant
  /** Pieces of confetti. Defaults to 80, at most 500. */
  count?: number
  /** Direction of the throw in degrees: 90 is straight up, 0 to the right. Defaults to 90. */
  angle?: number
  /** Width of the cone around `angle`, in degrees. Defaults to 70 (360 for a rocket's burst). */
  spread?: number
  /** Launch speed in pixels per second. Defaults to 900. */
  velocity?: number
  /** Downward pull in pixels per second squared. Defaults to 900. */
  gravity?: number
  /** Any CSS colours, `var(--token)` included. Defaults to the theme's accent, success, warning and danger colours. */
  colors?: string[]
  /** Defaults to all three. */
  shapes?: ConfettiShape[]
}

interface Burst {
  alive: number
  resolve: () => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  /** Downward pull, px/s². */
  gravity: number
  rotation: number
  spin: number
  /** Phase of the flip that makes a piece catch the light. */
  tilt: number
  tiltSpeed: number
  /** Phase of the side-to-side flutter. */
  wobble: number
  wobbleSpeed: number
  size: number
  color: string
  shape: ConfettiShape
  age: number
  life: number
  burst: Burst
  /** Set on a rocket: what it bursts into, and where it has been. */
  rocket?: { payload: ResolvedOptions; trail: ConfettiPoint[]; speed: number }
}

type ResolvedOptions = Required<Omit<ConfettiOptions, 'origin'>> & {
  origin: ConfettiPoint
}

const TOKEN_COLORS = [
  '--color-accent',
  '--color-success',
  '--color-warning',
  '--color-danger',
  '--color-chart-3',
  '--color-chart-5',
]
const SHAPES: ConfettiShape[] = ['square', 'circle', 'strip']
/** Air resistance, per second: confetti slows quickly, then flutters down. */
const DRAG = 2.4
/** Seconds a piece fades out over at the end of its life. */
const FADE = 0.6
/** Longest a rocket climbs before it bursts, in seconds. */
const ROCKET_FLIGHT = 0.75
const TRAIL_LENGTH = 10

/**
 * A burst of confetti, or a rocket that bursts into confetti, to celebrate a
 * success such as a payment going through. Call `fire()`: it draws on a
 * canvas that covers the viewport in the top layer, above dialogs, lets
 * clicks pass through, and runs only while confetti is in flight. Wrap a
 * button to burst from it by default, or pass any `origin`. It lives in the
 * effects entry: `import '@moul-dev/web-component/effects'`, which also
 * exports `fireConfetti(options)` for a one-off burst without markup.
 *
 * Keyboard and screen readers: never focusable, and the canvas is hidden from
 * screen readers; wrapped content keeps its own semantics. Confetti is
 * decoration only, so always say the success in words as well, for example
 * in a toast or a result card.
 *
 * Reduced motion: `fire()` draws nothing and resolves at once, and turning
 * reduced motion on while confetti is falling clears it.
 *
 * @slot - Optional content to burst from, such as a button.
 *
 * @csspart canvas - The full-viewport canvas the confetti is drawn on.
 */
export class MoulConfetti extends LitElement {
  static override styles = confettiStyles

  static override properties = {
    variant: { type: String, reflect: true },
  }

  /** What `fire()` does when its options give no `variant`. */
  declare variant: ConfettiVariant

  private particles: Particle[] = []
  private isActive = false
  private stopWatchingMotion: (() => void) | null = null
  private readonly loop: CanvasLoopController

  constructor() {
    super()
    this.variant = 'burst'
    this.loop = new CanvasLoopController(this, {
      canvas: () => this.canvasEl,
      autoStart: false,
      draw: (frame) => this.step(frame),
    })
  }

  private get canvasEl(): HTMLCanvasElement | null {
    return this.shadowRoot?.querySelector('canvas') ?? null
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      if (isReduced) this.clear()
    })
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.clear()
  }

  /**
   * Throws a burst of confetti, or launches a rocket that bursts. Resolves
   * when every piece of it has fallen away, or at once under reduced motion.
   */
  public async fire(options: ConfettiOptions = {}): Promise<void> {
    if (prefersReducedMotion() || !this.isConnected) return
    await this.updateComplete
    const resolved = this.resolveOptions(options)
    await new Promise<void>((resolve) => {
      const burst: Burst = { alive: 0, resolve }
      if (resolved.variant === 'rocket') this.launch(resolved, burst)
      else this.spawn(resolved, burst)
      this.activate()
    })
  }

  private resolveOptions(options: ConfettiOptions): ResolvedOptions {
    const variant = options.variant ?? this.variant
    return {
      variant: variant === 'rocket' ? 'rocket' : 'burst',
      origin: this.resolveOrigin(options.origin),
      count: Math.min(500, Math.max(1, Math.round(options.count ?? 80))),
      angle: options.angle ?? 90,
      spread: options.spread ?? 70,
      velocity: options.velocity ?? 900,
      gravity: options.gravity ?? 900,
      colors: this.resolveColors(options.colors),
      shapes: options.shapes?.length ? options.shapes : SHAPES,
    }
  }

  private resolveOrigin(origin: ConfettiOptions['origin']): ConfettiPoint {
    if (origin && !(origin instanceof Element)) return origin
    const box = (origin ?? this).getBoundingClientRect()
    if (box.width > 0 || box.height > 0) {
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  }

  /** Canvas takes no `var()` or `light-dark()`: resolve each colour through a probe. */
  private resolveColors(colors?: string[]): string[] {
    const probe = this.shadowRoot?.querySelector<HTMLElement>('.probe')
    const sources = colors?.length
      ? colors
      : TOKEN_COLORS.map((t) => `var(${t})`)
    const resolved: string[] = []
    for (const source of sources) {
      let value = source
      if (probe) {
        probe.style.color = ''
        probe.style.color = source
        value = getComputedStyle(probe).color || source
      }
      if (value && !value.includes('var(') && !resolved.includes(value)) {
        resolved.push(value)
      }
    }
    if (resolved.length > 0) return resolved
    return [getComputedStyle(this).color || 'currentColor']
  }

  private spawn(options: ResolvedOptions, burst: Burst): void {
    const { origin, count, angle, spread, velocity, gravity, colors, shapes } =
      options
    for (let i = 0; i < count; i++) {
      const direction =
        ((angle + (Math.random() - 0.5) * spread) * Math.PI) / 180
      const speed = velocity * (0.45 + Math.random() * 0.55)
      this.particles.push({
        x: origin.x,
        y: origin.y,
        vx: Math.cos(direction) * speed,
        vy: -Math.sin(direction) * speed,
        gravity,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 12,
        tilt: Math.random() * Math.PI * 2,
        tiltSpeed: 6 + Math.random() * 8,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 3 + Math.random() * 4,
        size: 6 + Math.random() * 5,
        color: colors[i % colors.length],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        age: 0,
        life: 2.4 + Math.random() * 1.2,
        burst,
      })
    }
    burst.alive += count
  }

  private launch(options: ResolvedOptions, burst: Burst): void {
    const direction = (options.angle * Math.PI) / 180
    // Climbs about 240 px at the default velocity before it slows and bursts.
    const speed = options.velocity * 0.75
    this.particles.push({
      x: options.origin.x,
      y: options.origin.y,
      vx: Math.cos(direction) * speed,
      vy: -Math.sin(direction) * speed,
      gravity: options.gravity,
      rotation: 0,
      spin: 0,
      tilt: 0,
      tiltSpeed: 0,
      wobble: 0,
      wobbleSpeed: 0,
      size: 4,
      color: options.colors[0],
      shape: 'strip',
      age: 0,
      life: ROCKET_FLIGHT,
      burst,
      rocket: {
        // At the top of its flight it bursts every way, a little slower.
        payload: {
          ...options,
          spread: 360,
          velocity: options.velocity * 0.6,
        },
        trail: [],
        speed,
      },
    })
    burst.alive += 1
  }

  private activate(): void {
    if (this.isActive) return
    this.isActive = true
    this.toggleAttribute('data-active', true)
    try {
      this.canvasEl?.showPopover?.()
    } catch {
      // Without the Popover API the fixed canvas still covers the viewport.
    }
    this.loop.start()
  }

  private deactivate(): void {
    if (!this.isActive) return
    this.isActive = false
    this.loop.stop()
    const canvas = this.canvasEl
    const context = this.loop.context
    context?.clearRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0)
    try {
      if (canvas?.matches(':popover-open')) canvas.hidePopover()
    } catch {
      // See activate().
    }
    this.removeAttribute('data-active')
  }

  /** Drops everything in flight and resolves every pending `fire()`. */
  private clear(): void {
    const bursts = new Set(this.particles.map((p) => p.burst))
    this.particles = []
    for (const burst of bursts) burst.resolve()
    this.deactivate()
  }

  /** Moves every piece by one frame, retires the finished ones, and draws the rest. */
  private step(frame: CanvasFrame): void {
    const dt = frame.delta / 1000
    const damping = Math.exp(-DRAG * dt)
    const bursting: Array<[ResolvedOptions, Burst]> = []
    const survivors: Particle[] = []

    for (const p of this.particles) {
      p.age += dt
      if (p.rocket) {
        p.vy += p.gravity * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rocket.trail.unshift({ x: p.x, y: p.y })
        p.rocket.trail.length = Math.min(p.rocket.trail.length, TRAIL_LENGTH)
        const isClimbing = Math.hypot(p.vx, p.vy) > p.rocket.speed * 0.25
        if (p.age < p.life && isClimbing) {
          survivors.push(p)
        } else {
          // Burst into this rocket's own promise, before it counts as done.
          bursting.push([
            { ...p.rocket.payload, origin: { x: p.x, y: p.y } },
            p.burst,
          ])
        }
        continue
      }
      p.vx *= damping
      p.vy = p.vy * damping + p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rotation += p.spin * dt
      p.tilt += p.tiltSpeed * dt
      p.wobble += p.wobbleSpeed * dt
      const isGone = p.age >= p.life || p.y > frame.height + 40
      if (isGone) this.retire(p.burst)
      else survivors.push(p)
    }

    this.particles = survivors
    for (const [options, burst] of bursting) {
      this.spawn(options, burst)
      this.retire(burst)
    }
    this.draw(frame)
    if (this.particles.length === 0) this.deactivate()
  }

  private retire(burst: Burst): void {
    burst.alive -= 1
    if (burst.alive <= 0) burst.resolve()
  }

  private draw(frame: CanvasFrame): void {
    const context = frame.context
    if (!context) return
    context.clearRect(0, 0, frame.width, frame.height)
    for (const p of this.particles) {
      context.save()
      context.fillStyle = p.color
      if (p.rocket) {
        // A bright head and a trail of sparks fading behind it.
        p.rocket.trail.forEach((point, index) => {
          context.globalAlpha = 1 - index / TRAIL_LENGTH
          context.beginPath()
          context.arc(
            point.x,
            point.y,
            2.5 * (1 - index / TRAIL_LENGTH),
            0,
            Math.PI * 2,
          )
          context.fill()
        })
        context.restore()
        continue
      }
      const remaining = p.life - p.age
      context.globalAlpha = remaining < FADE ? Math.max(0, remaining / FADE) : 1
      context.translate(p.x + Math.sin(p.wobble) * 4, p.y)
      context.rotate(p.rotation)
      context.scale(1, Math.cos(p.tilt))
      const size = p.size
      if (p.shape === 'circle') {
        context.beginPath()
        context.arc(0, 0, size / 2, 0, Math.PI * 2)
        context.fill()
      } else if (p.shape === 'strip') {
        context.fillRect(-size * 0.2, -size * 0.8, size * 0.4, size * 1.6)
      } else {
        context.fillRect(-size / 2, -size / 2, size, size)
      }
      context.restore()
    }
  }

  protected override render() {
    return html`
      <slot></slot>
      <canvas part="canvas" class="canvas" popover="manual" aria-hidden="true"></canvas>
      <span class="probe" aria-hidden="true"></span>
    `
  }
}

let shared: MoulConfetti | null = null

/**
 * Fires confetti without markup: creates one `<moul-confetti>` at the end of
 * `<body>` the first time, and reuses it. Resolves when the burst has fallen
 * away, or at once under reduced motion.
 */
export function fireConfetti(options: ConfettiOptions = {}): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()
  if (!shared?.isConnected) {
    shared = document.createElement('moul-confetti')
    document.body.append(shared)
  }
  return shared.fire(options)
}

defineElement('moul-confetti', MoulConfetti)

declare global {
  interface HTMLElementTagNameMap {
    'moul-confetti': MoulConfetti
  }
}
