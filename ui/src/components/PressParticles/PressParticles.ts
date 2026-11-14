import { html, LitElement, type PropertyValues } from 'lit'
import { CanvasColorController } from '../../controllers/canvas-color.controller'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { pressParticlesStyles } from './PressParticles.styles'
import {
  type BurstSettings,
  emptyParticle,
  launchParticle,
  MAX_PRESS_PARTICLES,
  type PressParticle,
  type PressParticleShape,
  particleAlpha,
  particleGrowth,
  splitColorList,
  splitGlyphs,
  stepParticle,
} from './press-particles-physics'

export type { PressParticleShape } from './press-particles-physics'

/** A point in viewport pixels, as `clientX` and `clientY` give it. */
export interface PressParticlesPoint {
  x: number
  y: number
}

interface Burst {
  alive: number
  resolve: () => void
}

/** The theme colours a burst uses when `colors` is empty. */
const TOKEN_COLORS = [
  'var(--color-accent)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-danger)',
  'var(--color-chart-3)',
  'var(--color-chart-5)',
]
const MAX_COLORS = 8
const COLOR_NAMES = Array.from({ length: MAX_COLORS }, (_, i) => `c${i}`)

/** Emoji fonts first, so a glyph draws in colour wherever the system has one. */
const GLYPH_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif'

/**
 * Wraps a button, a like control or any target and throws a small burst of
 * particles from the point where it is pressed: they arc out, fall under
 * gravity and fade, like sparks off a press. Shapes are circles, squares,
 * stars or glyphs (`glyphs="🎉 ✨"`, emoji or any characters), in the
 * theme's colours or your own `colors`. The particles are drawn on a canvas
 * that covers the viewport in the top layer, so they can fly past the
 * element's box and over dialogs; it exists only while particles are in
 * flight, and clicks pass straight through it. The press itself is never
 * delayed or stopped. Call `burst()` to throw one from code.
 *
 * Keyboard and screen readers: never focusable itself, and the canvas is
 * hidden from screen readers; the wrapped control keeps its own role, name
 * and keys. A keyboard press (Enter or Space on a wrapped button, which
 * fires a click without a pointer) bursts from the centre of the control.
 * Disabled controls (`disabled`, `aria-disabled="true"` or `is-disabled`)
 * throw nothing. The particles are decoration: say what the press did in
 * words as well.
 *
 * Reduced motion: no particles are thrown and `burst()` resolves at once;
 * turning reduced motion on mid-burst clears the particles in flight. The
 * press works as usual.
 *
 * @slot - The button or target that throws particles when pressed.
 * @csspart canvas - The full-viewport canvas the particles are drawn on.
 */
export class MoulPressParticles extends LitElement {
  static override styles = pressParticlesStyles

  static override properties = {
    count: { type: Number, reflect: true },
    shape: { type: String, reflect: true },
    glyphs: { type: String },
    colors: {
      converter: {
        fromAttribute: (value: string | null) => splitColorList(value),
      },
    },
    angle: { type: Number },
    spread: { type: Number },
    velocity: { type: Number },
    gravity: { type: Number },
    size: { type: Number },
  }

  /** Particles per press. Defaults to 14, at most 120. */
  declare count: number
  /** `circle`, `square`, `star` or `glyph`. Defaults to `glyph` when `glyphs` is set, otherwise `circle`. */
  declare shape: PressParticleShape | ''
  /** Emoji or characters for the `glyph` shape, separated by spaces (or written together). */
  declare glyphs: string
  /** CSS colours or tokens, as an array or a comma-separated attribute. Defaults to the theme's accent, success, warning and danger colours. */
  declare colors: string[]
  /** Direction of the throw in degrees: 90 (default) is straight up, 0 to the right. */
  declare angle: number
  /** Width of the cone around `angle`, in degrees. Defaults to 140; 360 throws every way. */
  declare spread: number
  /** Launch speed in pixels per second. Defaults to 480. */
  declare velocity: number
  /** Downward pull in pixels per second squared. Defaults to 1200; 0 lets particles drift. */
  declare gravity: number
  /** Particle size in pixels. Defaults to 8. */
  declare size: number

  private readonly pool: PressParticle[] = []
  private readonly owners: Array<Burst | null> = []
  private cursor = 0
  private aliveCount = 0
  private isActive = false
  private sprites = new Map<string, HTMLCanvasElement>()
  private spriteRatio = 0
  private starPath: Path2D | null = null
  private glyphCache: { source: string; glyphs: string[] } | null = null
  private stopWatchingMotion: (() => void) | null = null

  private readonly palette = new CanvasColorController(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => {
      const sources = (this.colors?.length ? this.colors : TOKEN_COLORS).slice(
        0,
        MAX_COLORS,
      )
      return Object.fromEntries(
        sources.map((color, index) => [COLOR_NAMES[index], color]),
      )
    },
    onChange: () => this.sprites.clear(),
  })

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot.querySelector('canvas'),
    autoStart: false,
    draw: (frame) => this.step(frame),
  })

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (this.isPressDisabled(event)) return
    void this.burst({ x: event.clientX, y: event.clientY })
  }

  private readonly handleClick = (event: MouseEvent): void => {
    // A pointer press already burst on pointerdown; detail 0 is a keyboard
    // press (or a click from script), which has no point to burst from.
    if (event.detail !== 0 || this.isPressDisabled(event)) return
    const target = this.pressTarget(event)
    void this.burst(target)
  }

  constructor() {
    super()
    this.count = 14
    this.shape = ''
    this.glyphs = ''
    this.colors = []
    this.angle = 90
    this.spread = 140
    this.velocity = 480
    this.gravity = 1200
    this.size = 8
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('pointerdown', this.handlePointerDown, {
      passive: true,
    })
    this.addEventListener('click', this.handleClick)
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      if (isReduced) this.clear()
    })
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('pointerdown', this.handlePointerDown)
    this.removeEventListener('click', this.handleClick)
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.clear()
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('colors')) this.palette.refresh()
    if (changed.has('glyphs') || changed.has('size')) this.sprites.clear()
  }

  /**
   * Throws one burst from `origin`: a point in viewport pixels, an element's
   * centre, or this element's centre when left out. Resolves once every
   * particle of the burst has gone, or at once under reduced motion.
   */
  public async burst(
    origin?: PressParticlesPoint | Element | null,
  ): Promise<void> {
    if (prefersReducedMotion() || !this.isConnected) return
    const point = this.resolveOrigin(origin)
    await new Promise<void>((resolve) => {
      const owner: Burst = { alive: 0, resolve }
      this.spawn(point, owner)
      if (owner.alive === 0) resolve()
      else this.activate()
    })
  }

  private resolveOrigin(
    origin: PressParticlesPoint | Element | null | undefined,
  ): PressParticlesPoint {
    if (origin && !(origin instanceof Element)) return origin
    const box = (origin ?? this).getBoundingClientRect()
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
  }

  /** The slotted element a click landed on, so a keyboard press bursts from the control. */
  private pressTarget(event: Event): Element {
    for (const node of event.composedPath()) {
      if (node === this) break
      if (node instanceof Element && node.parentElement === this) return node
    }
    return this
  }

  private isPressDisabled(event: Event): boolean {
    for (const node of event.composedPath()) {
      if (!(node instanceof Element)) continue
      if (
        (node as Element & { disabled?: unknown }).disabled === true ||
        node.getAttribute('aria-disabled') === 'true' ||
        node.hasAttribute('is-disabled')
      ) {
        return true
      }
      if (node === this) break
    }
    return false
  }

  private settings(): BurstSettings {
    const finite = (value: number, fallback: number) =>
      Number.isFinite(value) ? value : fallback
    return {
      count: Math.min(120, Math.max(1, Math.round(finite(this.count, 14)))),
      angle: finite(this.angle, 90),
      spread: Math.min(360, Math.max(0, finite(this.spread, 140))),
      velocity: Math.max(0, finite(this.velocity, 480)),
      size: Math.min(64, Math.max(2, finite(this.size, 8))),
      colorCount: Math.min(
        MAX_COLORS,
        (this.colors?.length ? this.colors : TOKEN_COLORS).length,
      ),
      glyphCount: this.glyphList().length,
    }
  }

  private glyphList(): string[] {
    if (this.glyphCache?.source !== this.glyphs) {
      this.glyphCache = {
        source: this.glyphs,
        glyphs: splitGlyphs(this.glyphs ?? ''),
      }
    }
    return this.glyphCache.glyphs
  }

  /** The shape drawn: `shape` when it is one of the four, else glyphs when there are any. */
  private get resolvedShape(): PressParticleShape {
    const shape = this.shape
    if (shape === 'circle' || shape === 'square' || shape === 'star') {
      return shape
    }
    return this.glyphList().length > 0 ? 'glyph' : 'circle'
  }

  private spawn(point: PressParticlesPoint, owner: Burst): void {
    const settings = this.settings()
    for (let i = 0; i < settings.count; i++) {
      const slot = this.takeSlot()
      launchParticle(
        this.pool[slot],
        point.x,
        point.y,
        settings,
        Math.random,
        i,
      )
      this.owners[slot] = owner
      owner.alive += 1
    }
  }

  /**
   * A dead slot in the pool, a new one while the pool is below its cap, or
   * the oldest slot when every one is in flight.
   */
  private takeSlot(): number {
    if (this.aliveCount < this.pool.length) {
      for (let n = 0; n < this.pool.length; n++) {
        const slot = (this.cursor + n) % this.pool.length
        if (!this.pool[slot].alive) {
          this.cursor = (slot + 1) % this.pool.length
          this.aliveCount += 1
          return slot
        }
      }
    }
    if (this.pool.length < MAX_PRESS_PARTICLES) {
      this.pool.push(emptyParticle())
      this.owners.push(null)
      this.aliveCount += 1
      return this.pool.length - 1
    }
    const slot = this.cursor
    this.cursor = (slot + 1) % this.pool.length
    this.retire(slot)
    this.aliveCount += 1
    return slot
  }

  private retire(slot: number): void {
    const particle = this.pool[slot]
    if (!particle.alive) return
    particle.alive = false
    this.aliveCount -= 1
    const owner = this.owners[slot]
    this.owners[slot] = null
    if (!owner) return
    owner.alive -= 1
    if (owner.alive <= 0) owner.resolve()
  }

  private activate(): void {
    if (this.isActive) return
    this.isActive = true
    this.toggleAttribute('data-active', true)
    const canvas = this.renderRoot.querySelector('canvas')
    try {
      canvas?.showPopover?.()
    } catch {
      // Without the Popover API the fixed canvas still covers the viewport.
    }
    this.loop.start()
  }

  private deactivate(): void {
    if (!this.isActive) return
    this.isActive = false
    this.loop.stop()
    const canvas = this.renderRoot.querySelector('canvas')
    const context = this.loop.context
    if (context && canvas) {
      context.save()
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.restore()
    }
    try {
      if (canvas?.matches(':popover-open')) canvas.hidePopover()
    } catch {
      // See activate().
    }
    this.removeAttribute('data-active')
  }

  /** Drops every particle in flight and resolves every pending burst. */
  private clear(): void {
    for (let slot = 0; slot < this.pool.length; slot++) this.retire(slot)
    this.deactivate()
  }

  private step(frame: CanvasFrame): void {
    const dt = frame.delta / 1000
    const gravity = Number.isFinite(this.gravity) ? this.gravity : 1200
    for (let slot = 0; slot < this.pool.length; slot++) {
      const particle = this.pool[slot]
      if (!particle.alive) continue
      if (!stepParticle(particle, dt, gravity, frame.height)) this.retire(slot)
    }
    this.paint(frame)
    if (this.aliveCount <= 0) this.deactivate()
  }

  private paint(frame: CanvasFrame): void {
    const context = frame.context
    if (!context) return
    const ratio = frame.pixelRatio
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, frame.width, frame.height)
    const shape = this.resolvedShape
    const glyphs = shape === 'glyph' ? this.glyphList() : []
    if (shape === 'glyph' && this.spriteRatio !== ratio) {
      this.sprites.clear()
      this.spriteRatio = ratio
    }
    let lastColor = -1
    for (const particle of this.pool) {
      if (!particle.alive) continue
      const scale = particle.size * particleGrowth(particle)
      if (scale <= 0) continue
      context.globalAlpha = particleAlpha(particle)
      const cos = Math.cos(particle.rotation) * ratio
      const sin = Math.sin(particle.rotation) * ratio
      context.setTransform(
        cos,
        sin,
        -sin,
        cos,
        particle.x * ratio,
        particle.y * ratio,
      )
      if (shape === 'glyph') {
        const sprite = this.sprite(
          glyphs[particle.glyph] ?? '',
          particle.color,
          ratio,
        )
        if (!sprite) continue
        // Sprites are drawn at the largest size; shrink to this particle's.
        const drawn = (scale * sprite.width) / (this.spriteSize() * ratio)
        const half = drawn / 2
        context.drawImage(sprite, -half, -half, drawn, drawn)
        continue
      }
      if (particle.color !== lastColor) {
        context.fillStyle = this.palette.get(
          COLOR_NAMES[particle.color] ?? 'c0',
        )
        lastColor = particle.color
      }
      if (shape === 'square') {
        context.fillRect(-scale / 2, -scale / 2, scale, scale)
      } else if (shape === 'star') {
        const path = this.star()
        // A star's points reach out of a smaller body: draw it larger so it reads at the same size.
        context.scale(scale * 1.7, scale * 1.7)
        if (path) context.fill(path)
        else context.fillRect(-0.5, -0.5, 1, 1)
      } else {
        context.beginPath()
        context.arc(0, 0, scale / 2, 0, Math.PI * 2)
        context.fill()
      }
    }
    context.globalAlpha = 1
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
  }

  /** A five-pointed star one unit across, centred on the origin. */
  private star(): Path2D | null {
    if (this.starPath || typeof Path2D !== 'function') return this.starPath
    const path = new Path2D()
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? 0.5 : 0.22
      const angle = (i * Math.PI) / 5 - Math.PI / 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      if (i === 0) path.moveTo(x, y)
      else path.lineTo(x, y)
    }
    path.closePath()
    this.starPath = path
    return path
  }

  /** The largest particle size, in CSS pixels, that glyph sprites are drawn at. */
  private spriteSize(): number {
    return Math.ceil(this.settings().size * 1.3 * 1.25)
  }

  /** A glyph drawn once, in one colour, at the largest particle size. */
  private sprite(
    glyph: string,
    color: number,
    ratio: number,
  ): HTMLCanvasElement | null {
    if (!glyph) return null
    const key = `${glyph}\u0000${color}`
    const cached = this.sprites.get(key)
    if (cached) return cached
    const side = Math.max(1, Math.ceil(this.spriteSize() * ratio))
    const canvas = document.createElement('canvas')
    canvas.width = side
    canvas.height = side
    const context = canvas.getContext('2d')
    if (!context) return null
    context.font = `${Math.round(side * 0.8)}px ${GLYPH_FONT}`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = this.palette.get(COLOR_NAMES[color] ?? 'c0')
    context.fillText(glyph, side / 2, side / 2 + side * 0.04)
    this.sprites.set(key, canvas)
    return canvas
  }

  protected override render() {
    return html`
      <slot></slot>
      <canvas part="canvas" popover="manual" aria-hidden="true"></canvas>
      <span class="color-probe"></span>
    `
  }
}

defineElement('moul-press-particles', MoulPressParticles)

declare global {
  interface HTMLElementTagNameMap {
    'moul-press-particles': MoulPressParticles
  }
}
