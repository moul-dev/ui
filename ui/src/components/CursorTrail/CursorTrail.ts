import { html, LitElement, type PropertyValues } from 'lit'
import { CanvasColorController } from '../../controllers/canvas-color.controller'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import {
  CanvasPointerController,
  type CanvasPointerState,
} from '../../controllers/canvas-pointer.controller'
import { imageReady } from '../../utils/canvas-image'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { cursorTrailStyles } from './CursorTrail.styles'
import {
  type CursorTrailVariant,
  DEFAULT_TRAIL_SIZE,
  normalizeTrailVariant,
  springStep,
  stampPhase,
  stampsAlong,
  type TrailPoint,
} from './cursor-trail-motion'

export type { CursorTrailVariant } from './cursor-trail-motion'

interface Glyph {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  char: number
  /** Seconds until the character changes again. */
  scramble: number
}

interface Stamp {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  spin: number
  age: number
  life: number
  image: number
}

interface Dot {
  x: number
  y: number
  vx: number
  vy: number
}

const MAX_GLYPHS = 160
const MAX_STAMPS = 24
const GRAVITY = 520
/** Seconds an image stamp holds still before it falls. */
const STAMP_HOLD = 0.32
const STAMP_LIFE = 1.4

/**
 * Leaves a trail behind the pointer over an area, a hero or a card: glyphs
 * that drop from the pointer, flicker through characters and fall away
 * (`variant="glyphs"`, a matrix trail), a springy chain of dots that
 * follows it (`dots`), or the area's images stamped along the path that
 * hold for a moment, then tumble away under gravity (`images`, from
 * `<img slot="image">`). The trail is drawn on a canvas over the content
 * that lets every click through, so links and buttons underneath work as
 * usual. On a touch screen it follows a finger dragged across the area;
 * the page still scrolls with an up-and-down swipe.
 *
 * Keyboard and screen readers: never focusable itself, and the canvas is
 * hidden from screen readers; the content keeps its own semantics and tab
 * order. The trail follows only a pointer, so a keyboard user sees the area
 * without it, which loses nothing. Trail images are not announced either:
 * they are decoration, so give them `alt=""`.
 *
 * Reduced motion: no trail is drawn at all, and turning reduced motion on
 * mid-trail clears it.
 *
 * @slot - Content shown under the trail.
 * @slot image - Images stamped along the path with `variant="images"`; they are not shown otherwise.
 * @csspart canvas - The canvas the trail is drawn on, over the content.
 * @cssprop --cursor-trail-color - Colour of the glyphs and dots. Defaults to `--color-accent`; the `color` attribute wins over it.
 */
export class MoulCursorTrail extends LitElement {
  static override styles = cursorTrailStyles

  static override properties = {
    variant: { type: String, reflect: true },
    color: { type: String },
    glyphs: { type: String },
    size: { type: Number },
    count: { type: Number },
  }

  /** `glyphs` (default), `dots` or `images`. */
  declare variant: CursorTrailVariant
  /** Colour of the glyphs and dots, any CSS colour or token. Defaults to the accent colour. */
  declare color: string
  /** Characters the glyph trail draws from. Defaults to the digits and the letters A to F. */
  declare glyphs: string
  /** Glyph size, dot size or image height in pixels. Defaults to 16, 10 and 88. */
  declare size: number
  /** Dots in the chain, with `variant="dots"`. Defaults to 14, at most 40. */
  declare count: number

  private glyphPool: Glyph[] = []
  private glyphCount = 0
  private stamps: Stamp[] = []
  private dots: Dot[] = []
  private dotVisibility = 0
  private last: TrailPoint | null = null
  private carried = 0
  private nextImage = 0
  private images: HTMLImageElement[] = []
  private sprites = new Map<string, HTMLCanvasElement>()
  private spriteKey = ''
  private chars: string[] = []
  private isReduced = false
  private stopWatchingMotion: (() => void) | null = null

  private readonly palette = new CanvasColorController(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => {
      const main =
        this.color || 'var(--cursor-trail-color, var(--color-accent))'
      return {
        main,
        // The newest glyphs: the trail colour pushed toward the text colour,
        // lighter on a dark page and darker on a light one.
        head: `color-mix(in oklch, ${main} 45%, var(--color-foreground))`,
        edge: 'var(--color-border)',
      }
    },
    onChange: () => this.sprites.clear(),
  })

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot.querySelector('canvas'),
    autoStart: false,
    draw: (frame) => this.step(frame),
  })

  private readonly pointer = new CanvasPointerController(this, {
    onMove: (state) => this.follow(state),
    onDown: (state) => {
      // A finger lands without having moved there: start the trail from it.
      this.last = { x: state.x, y: state.y }
      this.carried = 0
      this.wake()
    },
    onLeave: () => {
      this.last = null
      this.wake()
    },
  })

  private readonly handleSlotChange = (): void => {
    this.images = [...this.children].filter(
      (child): child is HTMLImageElement =>
        child instanceof HTMLImageElement && child.slot === 'image',
    )
    for (const image of this.images) {
      imageReady(image).catch(() => {
        // A broken image is skipped when drawn.
      })
    }
  }

  constructor() {
    super()
    this.variant = 'glyphs'
    this.color = ''
    this.glyphs = '0123456789ABCDEF'
    this.size = 0
    this.count = 14
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      if (isReduced) this.clear()
    })
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.clear()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('variant')) {
      const normalized = normalizeTrailVariant(this.variant)
      if (normalized !== this.variant) this.variant = normalized
    }
    if (changed.has('glyphs')) {
      this.chars = [...(this.glyphs || '0123456789ABCDEF')].filter(
        (char) => char.trim() !== '',
      )
      this.sprites.clear()
    }
    if (changed.has('variant')) this.clear()
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('color')) this.palette.refresh()
    if (changed.has('size')) this.sprites.clear()
  }

  /** The trail size in pixels for the current variant. */
  private get trailSize(): number {
    return this.size > 0
      ? Math.min(400, this.size)
      : (DEFAULT_TRAIL_SIZE[this.variant] ?? 16)
  }

  private follow(state: CanvasPointerState): void {
    if (this.isReduced) return
    const point = { x: state.x, y: state.y }
    if (this.variant === 'dots') {
      this.last = point
      this.wake()
      return
    }
    if (!this.last) {
      this.last = point
      this.carried = 0
      return
    }
    const spacing =
      this.variant === 'images' ? this.trailSize * 0.8 : this.trailSize * 0.85
    const { points, carried } = stampsAlong(
      this.last,
      point,
      spacing,
      this.carried,
    )
    this.carried = carried
    this.last = point
    for (const at of points) {
      if (this.variant === 'images') this.addStamp(at)
      else this.addGlyph(at)
    }
    if (points.length > 0) this.wake()
  }

  private wake(): void {
    if (!this.isReduced) this.loop.start()
  }

  private addGlyph(at: TrailPoint): void {
    if (this.glyphCount >= MAX_GLYPHS) return
    if (this.glyphCount === this.glyphPool.length) {
      this.glyphPool.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        age: 0,
        life: 0,
        char: 0,
        scramble: 0,
      })
    }
    const glyph = this.glyphPool[this.glyphCount]
    this.glyphCount += 1
    glyph.x = at.x + (Math.random() - 0.5) * 4
    glyph.y = at.y
    glyph.vx = (Math.random() - 0.5) * 30
    glyph.vy = 10 + Math.random() * 40
    glyph.age = 0
    glyph.life = 0.8 + Math.random() * 0.6
    glyph.char = Math.floor(Math.random() * Math.max(1, this.chars.length))
    glyph.scramble = 0.06 + Math.random() * 0.08
  }

  private addStamp(at: TrailPoint): void {
    const usable = this.images.filter(
      (image) => image.complete && image.naturalWidth > 0,
    )
    if (usable.length === 0) return
    if (this.stamps.length >= MAX_STAMPS) this.stamps.shift()
    this.stamps.push({
      x: at.x,
      y: at.y,
      vx: (Math.random() - 0.5) * 120,
      vy: -40 - Math.random() * 60,
      rotation: ((Math.random() - 0.5) * 24 * Math.PI) / 180,
      spin: (Math.random() - 0.5) * 3,
      age: 0,
      life: STAMP_LIFE,
      image: this.nextImage++ % usable.length,
    })
  }

  /** Drops the whole trail and clears the canvas. */
  private clear(): void {
    this.glyphCount = 0
    this.stamps = []
    this.dots = []
    this.dotVisibility = 0
    this.last = null
    this.carried = 0
    this.loop.stop()
    const context = this.loop.context
    const canvas = this.renderRoot?.querySelector('canvas')
    if (context && canvas) {
      context.save()
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.restore()
    }
  }

  private step(frame: CanvasFrame): void {
    const dt = frame.delta / 1000
    let isAlive = false
    if (this.variant === 'glyphs') isAlive = this.stepGlyphs(dt)
    else if (this.variant === 'images') isAlive = this.stepStamps(dt)
    else isAlive = this.stepDots(dt)
    this.paint(frame)
    // The first frame after a start has no elapsed time, so nothing has moved
    // yet: only a frame with time in it can say the trail has settled.
    if (!isAlive && frame.delta > 0) this.loop.stop()
  }

  private stepGlyphs(dt: number): boolean {
    let write = 0
    for (let i = 0; i < this.glyphCount; i++) {
      const glyph = this.glyphPool[i]
      glyph.age += dt
      if (glyph.age >= glyph.life) continue
      glyph.vy += GRAVITY * 0.55 * dt
      glyph.x += glyph.vx * dt
      glyph.y += glyph.vy * dt
      glyph.scramble -= dt
      // Characters flicker while they are young, then settle as they fall.
      if (glyph.scramble <= 0 && glyph.age < glyph.life * 0.5) {
        glyph.char = Math.floor(Math.random() * Math.max(1, this.chars.length))
        glyph.scramble = 0.06 + Math.random() * 0.1
      }
      // Keep the pool packed: survivors move to the front.
      if (write !== i) {
        this.glyphPool[i] = this.glyphPool[write]
        this.glyphPool[write] = glyph
      }
      write++
    }
    this.glyphCount = write
    return write > 0
  }

  private stepStamps(dt: number): boolean {
    this.stamps = this.stamps.filter((stamp) => {
      stamp.age += dt
      if (stamp.age >= stamp.life) return false
      if (stamp.age > STAMP_HOLD) {
        stamp.vy += GRAVITY * 2.2 * dt
        stamp.x += stamp.vx * dt
        stamp.y += stamp.vy * dt
        stamp.rotation += stamp.spin * dt
      }
      return true
    })
    return this.stamps.length > 0
  }

  private stepDots(dt: number): boolean {
    const count = Math.min(40, Math.max(2, Math.round(this.count || 14)))
    const target = this.last
    const isShown = target !== null && this.pointer.state.isInside
    // Fade in quickly on entry, out more slowly on leave.
    const rate = isShown ? 8 : 3.5
    this.dotVisibility +=
      ((isShown ? 1 : 0) - this.dotVisibility) * (1 - Math.exp(-rate * dt))
    // A new chain, or one that had faded away, starts gathered at the pointer.
    if (target && (this.dots.length !== count || this.dotVisibility < 0.02)) {
      this.dots = Array.from({ length: count }, () => ({
        x: target.x,
        y: target.y,
        vx: 0,
        vy: 0,
      }))
    }
    let leader: TrailPoint | null = target
    let isMoving = false
    for (const dot of this.dots) {
      if (!leader) break
      springStep(dot, leader, dt)
      if (Math.abs(dot.vx) + Math.abs(dot.vy) > 2) isMoving = true
      leader = dot
    }
    const isFading = isShown
      ? this.dotVisibility < 0.99
      : this.dotVisibility > 0.01
    if (!isShown && this.dotVisibility <= 0.01) {
      this.dotVisibility = 0
      return false
    }
    return isMoving || isFading
  }

  private paint(frame: CanvasFrame): void {
    const context = frame.context
    if (!context) return
    context.clearRect(0, 0, frame.width, frame.height)
    if (this.variant === 'glyphs') this.paintGlyphs(context, frame.pixelRatio)
    else if (this.variant === 'images')
      this.paintStamps(context, frame.pixelRatio)
    else this.paintDots(context)
    context.globalAlpha = 1
  }

  private paintGlyphs(context: CanvasRenderingContext2D, ratio: number): void {
    const size = this.trailSize
    for (let i = 0; i < this.glyphCount; i++) {
      const glyph = this.glyphPool[i]
      const t = glyph.age / glyph.life
      const isHead = glyph.age < 0.14
      const sprite = this.glyphSprite(
        glyph.char,
        isHead ? 'head' : 'main',
        ratio,
      )
      if (!sprite) continue
      context.globalAlpha = (1 - t) ** 1.4
      const half = size * 0.6
      context.drawImage(
        sprite,
        glyph.x - half,
        glyph.y - half,
        half * 2,
        half * 2,
      )
    }
  }

  private paintDots(context: CanvasRenderingContext2D): void {
    if (this.dotVisibility <= 0) return
    const size = this.trailSize
    const count = this.dots.length
    context.fillStyle = this.palette.get('main')
    // Back to front, so the head is drawn on top.
    for (let i = count - 1; i >= 0; i--) {
      const dot = this.dots[i]
      const share = i / Math.max(1, count - 1)
      context.globalAlpha = this.dotVisibility * (1 - share * 0.85)
      context.beginPath()
      context.arc(dot.x, dot.y, (size / 2) * (1 - share * 0.7), 0, Math.PI * 2)
      context.fill()
    }
  }

  private paintStamps(context: CanvasRenderingContext2D, ratio: number): void {
    const usable = this.images.filter(
      (image) => image.complete && image.naturalWidth > 0,
    )
    if (usable.length === 0) return
    const height = this.trailSize
    const radius = Math.min(12, height * 0.12)
    context.lineWidth = 1
    context.strokeStyle = this.palette.get('edge')
    for (const stamp of this.stamps) {
      const image = usable[stamp.image % usable.length]
      const { scale, alpha } = stampPhase(stamp.age, stamp.life, STAMP_HOLD)
      if (scale <= 0 || alpha <= 0) continue
      const aspect = Math.min(
        1.6,
        Math.max(0.6, image.naturalWidth / image.naturalHeight),
      )
      const h = height * scale
      const w = h * aspect
      const cos = Math.cos(stamp.rotation) * ratio
      const sin = Math.sin(stamp.rotation) * ratio
      context.globalAlpha = alpha
      context.setTransform(
        cos,
        sin,
        -sin,
        cos,
        stamp.x * ratio,
        stamp.y * ratio,
      )
      context.save()
      context.beginPath()
      if (typeof context.roundRect === 'function') {
        context.roundRect(-w / 2, -h / 2, w, h, radius * scale)
      } else {
        context.rect(-w / 2, -h / 2, w, h)
      }
      context.clip()
      // Cover-fit the image into the stamp.
      const imageAspect = image.naturalWidth / image.naturalHeight
      const drawW = imageAspect > aspect ? h * imageAspect : w
      const drawH = imageAspect > aspect ? h : w / imageAspect
      context.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH)
      context.restore()
      context.stroke()
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
  }

  /** A glyph drawn once per colour at the current size and pixel ratio. */
  private glyphSprite(
    index: number,
    tone: 'main' | 'head',
    ratio: number,
  ): HTMLCanvasElement | null {
    const char = this.chars[index] ?? this.chars[0]
    if (!char) return null
    const size = this.trailSize
    const sizeKey = `${size}@${ratio}`
    if (this.spriteKey !== sizeKey) {
      this.sprites.clear()
      this.spriteKey = sizeKey
    }
    const key = `${tone}\u0000${char}`
    const cached = this.sprites.get(key)
    if (cached) return cached
    const side = Math.max(1, Math.ceil(size * 1.2 * ratio))
    const canvas = document.createElement('canvas')
    canvas.width = side
    canvas.height = side
    const context = canvas.getContext('2d')
    if (!context) return null
    const probe = this.renderRoot.querySelector<HTMLElement>('.font-probe')
    const family = probe ? getComputedStyle(probe).fontFamily : ''
    context.font = `600 ${Math.round(size * ratio)}px ${family || 'monospace'}`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = this.palette.get(tone)
    context.fillText(char, side / 2, side / 2)
    this.sprites.set(key, canvas)
    return canvas
  }

  protected override render() {
    return html`
      <div class="content"><slot></slot></div>
      <slot name="image" @slotchange=${this.handleSlotChange}></slot>
      <canvas part="canvas" aria-hidden="true"></canvas>
      <span class="color-probe"></span>
      <span class="font-probe" aria-hidden="true"></span>
    `
  }
}

defineElement('moul-cursor-trail', MoulCursorTrail)

declare global {
  interface HTMLElementTagNameMap {
    'moul-cursor-trail': MoulCursorTrail
  }
}
