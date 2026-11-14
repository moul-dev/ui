import { html, LitElement, type PropertyValues } from 'lit'
import { CanvasColorController } from '../../controllers/canvas-color.controller'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import { CanvasPointerController } from '../../controllers/canvas-pointer.controller'
import { defineElement } from '../../utils/define-element'
import { createRandom } from '../../utils/noise'
import { glyphRainStyles } from './GlyphRain.styles'

export type GlyphRainVariant = 'rain' | 'shift'

/** Digits, capital letters and a few symbols: readable at any size in any monospace font. */
export const DEFAULT_GLYPHS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-*=<>:/$#%&'

/** Distinct glyphs kept from `glyphs`; more would make the atlas large for little gain. */
const MAX_GLYPHS = 256
/** Marks an empty cell in the `shift` grid. */
const EMPTY = 0xffff
/** Cells per second, per cell, whose glyph changes on its own. */
const FLICKER_RATE = 0.12
/** Radius of the pointer's glow, in cells. */
const GLOW_RADIUS = 5

/**
 * Splits a glyph set into the characters a reader sees (grapheme clusters),
 * so Khmer letters with their vowel signs or an emoji stay whole, and drops
 * repeats and spaces. Falls back to `DEFAULT_GLYPHS` when nothing is left.
 */
export function splitGlyphs(text: string | null | undefined): string[] {
  const source = text ?? ''
  let parts: string[]
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    })
    parts = Array.from(segmenter.segment(source), (s) => s.segment)
  } else {
    parts = Array.from(source)
  }
  const unique = [...new Set(parts.filter((part) => part.trim() !== ''))]
  if (unique.length === 0) return splitGlyphs(DEFAULT_GLYPHS)
  return unique.slice(0, MAX_GLYPHS)
}

/**
 * Opacity of a glyph `distance` cells behind a falling head, for a trail
 * `length` cells long: 1 at the head, easing to 0 at the end of the trail.
 */
export function trailAlpha(distance: number, length: number): number {
  if (distance < 0 || length <= 0 || distance > length) return 0
  const t = 1 - distance / length
  return t * t * (3 - 2 * t)
}

/**
 * Brightness from 0 to 1 of a `shift` cell at column `x`, row `y`: a dim
 * base, lifted where a slow diagonal band passes. `phase` is the band's
 * travel in radians; `jitter` (0 to 1, per cell) keeps the band ragged.
 */
export function shiftBrightness(
  x: number,
  y: number,
  phase: number,
  jitter: number,
): number {
  const wave = 0.5 + 0.5 * Math.sin((x * 0.8 + y) * 0.16 - phase + jitter * 0.7)
  const band = wave ** 5
  return Math.min(1, 0.08 + jitter * 0.1 + band * 0.92)
}

interface Atlas {
  canvas: HTMLCanvasElement
  /** Side of one glyph cell in the atlas, in device pixels. */
  cell: number
  columns: number
  /** Atlas rows taken by one colour; the head colour starts below them. */
  rows: number
}

/**
 * Columns of glyphs that fall like rain, or a grid of glyphs that shift in
 * place, drawn on a canvas behind its content: a code-flavoured background
 * for a hero, a terminal-styled section or a loading screen.
 *
 * `variant="rain"` (the default) drops a bright head down each column,
 * leaving a trail that fades behind it while the glyphs flicker. `shift`
 * fills the area with glyphs that change in place, with a slow band of light
 * passing through. `glyphs` sets the characters (letters, digits, Khmer, any
 * text), `font-size` their size, `speed` the pace and `density` how full the
 * area is. With `pointer-glow`, glyphs near a mouse or pen light up.
 *
 * Keyboard and screen readers: the canvas is decorative and hidden from
 * screen readers (`aria-hidden`), so the glyphs are never read out. The
 * element takes no focus; content in its slot is read and reached by Tab as
 * usual, above the glyphs.
 *
 * Reduced motion: the glyphs are drawn once and stay still: rain shows its
 * columns caught mid-fall, a shift grid shows the band of light where it
 * starts, and the pointer glow is off.
 *
 * @slot - Content shown over the glyphs.
 * @csspart canvas - The canvas the glyphs are drawn on.
 * @cssprop --glyph-rain-font-family - Font for the glyphs. Defaults to the monospace token.
 */
export class MoulGlyphRain extends LitElement {
  static override styles = glyphRainStyles

  static override properties = {
    variant: { type: String, reflect: true },
    glyphs: { type: String },
    fontSize: { type: Number, attribute: 'font-size' },
    speed: { type: Number },
    density: { type: Number },
    color: { type: String },
    headColor: { type: String, attribute: 'head-color' },
    pointerGlow: { type: Boolean, attribute: 'pointer-glow' },
  }

  /** `rain` (default): columns that fall. `shift`: a grid of glyphs that change in place. */
  declare variant: GlyphRainVariant
  /** The characters to draw, as one string. Defaults to digits, capital letters and symbols. */
  declare glyphs: string
  /** Size of each glyph in CSS pixels, from 8 to 64. Defaults to 16. */
  declare fontSize: number
  /** Pace of the fall or the band, as a multiple of the default. Defaults to 1. */
  declare speed: number
  /** How full the area is, from 0.05 to 1: rain columns falling at once, or grid cells holding a glyph. Defaults to 0.7. */
  declare density: number
  /** Colour of the glyphs, any CSS colour or token. Defaults to the accent colour. */
  declare color: string
  /** Colour of each falling head and the brightest cells. Defaults to the accent mixed toward the text colour. */
  declare headColor: string
  /** Light the glyphs around a mouse or pen. */
  declare pointerGlow: boolean

  private glyphList: string[] = splitGlyphs(DEFAULT_GLYPHS)
  private atlas: Atlas | null = null
  private atlasRatio = 0
  private random = createRandom(7)
  private columns = 0
  private rows = 0
  private cell = 16
  /** Glyph index per cell, column by column; `EMPTY` for a blank `shift` cell. */
  private grid = new Uint16Array(0)
  /** Per-cell offset of the band, 0 to 1, so it is not a ruler-straight line. */
  private jitter = new Float32Array(0)
  /** Per column: the head's row (fractional), its fall speed in rows a second, and its trail length. */
  private heads = new Float32Array(0)
  private fallSpeeds = new Float32Array(0)
  private trails = new Float32Array(0)
  private flickerDebt = 0
  private phase = 0
  private glow = 0

  private readonly palette = new CanvasColorController(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => ({
      main: this.color || 'var(--color-accent)',
      head:
        this.headColor ||
        'color-mix(in oklch, var(--color-accent) 35%, var(--color-foreground))',
    }),
    onChange: () => {
      this.atlas = null
      this.loop.drawOnce()
    },
  })

  private readonly pointer = new CanvasPointerController(this, {
    pointerTypes: ['mouse', 'pen'],
  })

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot.querySelector('canvas'),
    draw: (frame) => this.paint(frame),
    resize: (frame) => this.layout(frame.width, frame.height),
  })

  constructor() {
    super()
    this.variant = 'rain'
    this.glyphs = ''
    this.fontSize = 16
    this.speed = 1
    this.density = 0.7
    this.color = ''
    this.headColor = ''
    this.pointerGlow = false
  }

  override connectedCallback(): void {
    super.connectedCallback()
    // A web font may arrive after the first atlas was drawn with a fallback.
    document.fonts?.ready?.then(() => {
      if (!this.isConnected) return
      this.atlas = null
      this.loop.drawOnce()
    })
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('variant') && this.variant !== 'shift') {
      this.variant = 'rain'
    }
    if (changed.has('glyphs')) {
      this.glyphList = splitGlyphs(this.glyphs || DEFAULT_GLYPHS)
      this.atlas = null
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('color') || changed.has('headColor')) {
      this.palette.refresh()
    }
    const relayout =
      changed.has('variant') ||
      changed.has('glyphs') ||
      changed.has('fontSize') ||
      changed.has('density')
    if (relayout && this.loop.width > 0) {
      if (changed.has('fontSize')) this.atlas = null
      this.layout(this.loop.width, this.loop.height)
      this.loop.drawOnce()
    }
  }

  private get resolvedFontSize(): number {
    const size = Number(this.fontSize)
    return Number.isFinite(size) ? Math.min(64, Math.max(8, size)) : 16
  }

  private get resolvedDensity(): number {
    const density = Number(this.density)
    return Number.isFinite(density) ? Math.min(1, Math.max(0.05, density)) : 0.7
  }

  private get resolvedSpeed(): number {
    const speed = Number(this.speed)
    return Number.isFinite(speed) ? Math.min(10, Math.max(0, speed)) : 1
  }

  /** Builds the grid and the columns for a canvas of this size, the same way every time. */
  private layout(width: number, height: number): void {
    this.random = createRandom(7)
    const random = this.random
    this.cell = this.resolvedFontSize
    this.columns = Math.max(1, Math.ceil(width / this.cell))
    this.rows = Math.max(1, Math.ceil(height / this.cell))
    const count = this.columns * this.rows
    const glyphCount = this.glyphList.length
    const density = this.resolvedDensity
    const isShift = this.variant === 'shift'
    this.grid = new Uint16Array(count)
    this.jitter = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      this.grid[i] =
        isShift && random() > density
          ? EMPTY
          : Math.floor(random() * glyphCount)
      this.jitter[i] = random()
    }
    this.heads = new Float32Array(this.columns)
    this.fallSpeeds = new Float32Array(this.columns)
    this.trails = new Float32Array(this.columns)
    for (let column = 0; column < this.columns; column++) {
      this.resetColumn(column, true)
    }
    this.phase = 0
  }

  /**
   * Starts a column's next drop. The first drop of each column is spread over
   * the whole area, so the very first (and the reduced-motion) frame already
   * shows rain; later drops start above the top after a gap that grows as
   * `density` falls.
   */
  private resetColumn(column: number, initial: boolean): void {
    const random = this.random
    const rows = this.rows
    const trail = Math.round(rows * (0.35 + random() * 0.5)) + 4
    this.trails[column] = trail
    this.fallSpeeds[column] = 7 + random() * 11
    const gap = rows * (1 / this.resolvedDensity - 1) * (0.5 + random() * 1.5)
    this.heads[column] = initial
      ? random() * (rows + trail) * 1.1 - gap * random()
      : -random() * rows * 0.25 - gap
  }

  private ensureAtlas(ratio: number): Atlas | null {
    if (this.atlas && this.atlasRatio === ratio) return this.atlas
    const canvas = this.renderRoot.querySelector('canvas')
    if (!canvas) return null
    const glyphs = this.glyphList
    const cell = Math.ceil(this.resolvedFontSize * ratio)
    const columns = Math.min(glyphs.length, 32)
    const rows = Math.ceil(glyphs.length / columns)
    const atlasCanvas = document.createElement('canvas')
    atlasCanvas.width = columns * cell
    atlasCanvas.height = rows * 2 * cell
    const context = atlasCanvas.getContext('2d')
    if (!context) return null
    const family =
      getComputedStyle(canvas).fontFamily || 'ui-monospace, monospace'
    context.font = `${Math.round(cell * 0.82)}px ${family}`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    const fills = [this.palette.get('main'), this.palette.get('head')]
    fills.forEach((fill, block) => {
      context.fillStyle = fill
      glyphs.forEach((glyph, index) => {
        const x = (index % columns) * cell + cell / 2
        const y = (Math.floor(index / columns) + block * rows) * cell + cell / 2
        context.fillText(glyph, x, y + cell * 0.04)
      })
    })
    this.atlas = { canvas: atlasCanvas, cell, columns, rows }
    this.atlasRatio = ratio
    return this.atlas
  }

  private paint({
    context,
    width,
    height,
    pixelRatio,
    delta,
  }: CanvasFrame): void {
    if (!context) return
    context.clearRect(0, 0, width, height)
    if (this.grid.length !== this.columns * this.rows || this.columns === 0) {
      this.layout(width, height)
    }
    const atlas = this.ensureAtlas(pixelRatio)
    if (!atlas) return
    const seconds = (delta / 1000) * this.resolvedSpeed
    this.flicker(delta / 1000)
    const target = this.pointerGlow && this.pointer.state.isInside ? 1 : 0
    this.glow += (target - this.glow) * (1 - Math.exp(-delta / 160))
    if (this.variant === 'shift') {
      this.phase += seconds * 1.6
      this.paintShift(context, atlas)
    } else {
      this.paintRain(context, atlas, seconds)
    }
    context.globalAlpha = 1
  }

  /** Changes a share of the glyphs at random, as the glyphs of a terminal flicker. */
  private flicker(seconds: number): void {
    const glyphCount = this.glyphList.length
    if (glyphCount < 2) return
    this.flickerDebt += this.grid.length * FLICKER_RATE * seconds
    const random = this.random
    while (this.flickerDebt >= 1) {
      this.flickerDebt -= 1
      const index = Math.floor(random() * this.grid.length)
      if (this.grid[index] !== EMPTY) {
        this.grid[index] = Math.floor(random() * glyphCount)
      }
    }
  }

  private drawGlyph(
    context: CanvasRenderingContext2D,
    atlas: Atlas,
    glyph: number,
    isHead: boolean,
    column: number,
    row: number,
    alpha: number,
  ): void {
    const source = atlas.cell
    const sx = (glyph % atlas.columns) * source
    const sy =
      (Math.floor(glyph / atlas.columns) + (isHead ? atlas.rows : 0)) * source
    context.globalAlpha = alpha
    context.drawImage(
      atlas.canvas,
      sx,
      sy,
      source,
      source,
      column * this.cell,
      row * this.cell,
      this.cell,
      this.cell,
    )
  }

  /** Brightness the pointer adds to a cell, 0 to 1. */
  private glowAt(column: number, row: number): number {
    if (this.glow < 0.01) return 0
    const cx = this.pointer.state.x / this.cell - 0.5
    const cy = this.pointer.state.y / this.cell - 0.5
    const dx = column - cx
    const dy = row - cy
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance > GLOW_RADIUS) return 0
    const t = 1 - distance / GLOW_RADIUS
    return t * t * this.glow
  }

  private paintRain(
    context: CanvasRenderingContext2D,
    atlas: Atlas,
    seconds: number,
  ): void {
    const rows = this.rows
    const glyphCount = this.glyphList.length
    for (let column = 0; column < this.columns; column++) {
      const before = Math.floor(this.heads[column])
      this.heads[column] += this.fallSpeeds[column] * seconds
      const head = this.heads[column]
      const trail = this.trails[column]
      if (head - trail > rows) {
        this.resetColumn(column, false)
        continue
      }
      const headRow = Math.floor(head)
      if (headRow !== before && headRow >= 0 && headRow < rows) {
        // The head writes a fresh glyph into each cell it enters.
        this.grid[column * rows + headRow] = Math.floor(
          this.random() * glyphCount,
        )
      }
      const first = Math.max(0, Math.ceil(head - trail))
      const last = Math.min(rows - 1, headRow)
      for (let row = first; row <= last; row++) {
        const distance = head - row
        const isHead = distance < 1
        const alpha = isHead ? 1 : trailAlpha(distance, trail) * 0.85
        if (alpha < 0.02) continue
        this.drawGlyph(
          context,
          atlas,
          this.grid[column * rows + row],
          isHead,
          column,
          row,
          alpha,
        )
      }
    }
    this.paintGlow(context, atlas)
  }

  /** Glyphs around the pointer, lit like a torch over the grid. */
  private paintGlow(context: CanvasRenderingContext2D, atlas: Atlas): void {
    if (this.glow < 0.01) return
    const cx = Math.floor(this.pointer.state.x / this.cell)
    const cy = Math.floor(this.pointer.state.y / this.cell)
    for (let column = cx - GLOW_RADIUS; column <= cx + GLOW_RADIUS; column++) {
      if (column < 0 || column >= this.columns) continue
      for (let row = cy - GLOW_RADIUS; row <= cy + GLOW_RADIUS; row++) {
        if (row < 0 || row >= this.rows) continue
        const glyph = this.grid[column * this.rows + row]
        const alpha = this.glowAt(column, row) * 0.75
        if (glyph === EMPTY || alpha < 0.02) continue
        this.drawGlyph(context, atlas, glyph, alpha > 0.55, column, row, alpha)
      }
    }
  }

  private paintShift(context: CanvasRenderingContext2D, atlas: Atlas): void {
    const rows = this.rows
    const phase = this.phase
    for (let column = 0; column < this.columns; column++) {
      for (let row = 0; row < rows; row++) {
        const index = column * rows + row
        const glyph = this.grid[index]
        if (glyph === EMPTY) continue
        const brightness = Math.min(
          1,
          shiftBrightness(column, row, phase, this.jitter[index]) +
            this.glowAt(column, row) * 0.8,
        )
        this.drawGlyph(
          context,
          atlas,
          glyph,
          brightness > 0.82,
          column,
          row,
          brightness,
        )
      }
    }
  }

  protected override render() {
    return html`
      <canvas part="canvas" aria-hidden="true"></canvas>
      <span class="color-probe"></span>
      <div class="content"><slot></slot></div>
    `
  }
}

defineElement('moul-glyph-rain', MoulGlyphRain)

declare global {
  interface HTMLElementTagNameMap {
    'moul-glyph-rain': MoulGlyphRain
  }
}
