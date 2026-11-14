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
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { interactiveGridStyles } from './InteractiveGrid.styles'
import {
  cellAt,
  DEFAULT_CELL_SIZE,
  dotInfluence,
  type GridLayout,
  gridLayout,
  type InteractiveGridFade,
  type InteractiveGridVariant,
  normalizeGridVariant,
  RIPPLE_SPEED,
  RIPPLE_WIDTH,
  rippleLifetime,
  rippleStrength,
  splitColors,
  tileMask,
} from './interactive-grid-geometry'

export type {
  InteractiveGridFade,
  InteractiveGridVariant,
} from './interactive-grid-geometry'

interface Ripple {
  x: number
  y: number
  age: number
  lifetime: number
}

const MAX_COLORS = 8
const COLOR_NAMES = Array.from({ length: MAX_COLORS }, (_, i) => `c${i}`)
const MAX_RIPPLES = 6
/** Seconds a lit cell takes to fade once the pointer has left it. */
const HIGHLIGHT_FADE = 0.9
const RIPPLE_FADE = 0.45

/**
 * A grid of cells behind a hero, a section or a card that answers the
 * pointer: cells light up under it and fade behind it (`variant="highlight"`),
 * a press sends a ripple through the cells (`ripple`), or a dot matrix whose
 * dots swell and brighten around the pointer (`dots`, which also ripples on
 * a press). The pattern itself is drawn in CSS, so it costs nothing at rest
 * and is still there without script; only the cells that are lit are drawn
 * on a canvas, and the drawing loop stops as soon as nothing is moving.
 * `gap` turns the lines into separate rounded tiles, `fade` softens the
 * pattern toward the edges, and `colors` lights cells in one colour or a
 * random pick of several.
 *
 * Keyboard and screen readers: never focusable, and the grid is hidden from
 * screen readers; the content over it keeps its own semantics and tab order.
 * The grid answers only a pointer: it is decoration and carries nothing a
 * keyboard user needs.
 *
 * Reduced motion: the grid stays still; the pattern shows but no cell lights
 * up, fades or ripples. Turning reduced motion on clears anything lit.
 *
 * @slot - Content shown over the grid.
 * @csspart canvas - The canvas the lit cells and dots are drawn on.
 * @csspart pattern - The CSS pattern of lines, tiles or dots behind the canvas.
 * @cssprop --interactive-grid-line - Colour of the lines. Defaults to `--color-border`.
 * @cssprop --interactive-grid-tile - Colour of the tiles, with `gap`. Defaults to `--color-surface-secondary`.
 * @cssprop --interactive-grid-dot - Colour of the dots at rest. Defaults to `--color-border`.
 */
export class MoulInteractiveGrid extends LitElement {
  static override styles = interactiveGridStyles

  static override properties = {
    variant: { type: String, reflect: true },
    cellSize: { type: Number, attribute: 'cell-size' },
    gap: { type: Number },
    colors: {
      converter: {
        fromAttribute: (value: string | null) => splitColors(value),
      },
    },
    radius: { type: Number },
    fade: { type: String, reflect: true },
  }

  /** `highlight` (default), `ripple` or `dots`. */
  declare variant: InteractiveGridVariant
  /** Cell size in pixels. Defaults to 40, or 20 for `dots`. */
  declare cellSize: number
  /** Pixels between cells; above 0 the lines become separate tiles. Defaults to 0. Not used by `dots`. */
  declare gap: number
  /** Colours cells light up in, as an array or a comma-separated attribute; several are picked at random. Defaults to the accent colour. */
  declare colors: string[]
  /** How far the pointer reaches with `dots`, in pixels. Defaults to 120. */
  declare radius: number
  /** Softens the pattern toward its edges: `radial`, `top`, `bottom`, `edges` or `none` (default). */
  declare fade: InteractiveGridFade

  private layout: GridLayout = { columns: 0, rows: 0, cell: 40 }
  private width = 0
  private height = 0
  private intensity = new Float32Array(0)
  private goal = new Float32Array(0)
  private tint = new Uint8Array(0)
  private flags = new Uint8Array(0)
  private active: number[] = []
  private touched: number[] = []
  private ripples: Ripple[] = []
  private held = -1
  private isReduced = false
  private stopWatchingMotion: (() => void) | null = null

  private readonly palette = new CanvasColorController(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => {
      const sources = (
        this.colors?.length ? this.colors : ['var(--color-accent)']
      ).slice(0, MAX_COLORS)
      return Object.fromEntries(
        sources.map((color, index) => [COLOR_NAMES[index], color]),
      )
    },
    onChange: () => this.loop.drawOnce(),
  })

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot.querySelector('canvas'),
    autoStart: false,
    resize: (frame) => this.relayout(frame.width, frame.height),
    draw: (frame) => this.step(frame),
  })

  private readonly pointer = new CanvasPointerController(this, {
    onMove: (state) => this.track(state),
    onDown: (state) => this.press(state),
    onLeave: () => {
      this.held = -1
      this.wake()
    },
  })

  constructor() {
    super()
    this.variant = 'highlight'
    this.cellSize = 0
    this.gap = 0
    this.colors = []
    this.radius = 120
    this.fade = 'none'
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
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('variant')) {
      const normalized = normalizeGridVariant(this.variant)
      if (normalized !== this.variant) this.variant = normalized
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('colors')) this.palette.refresh()
    if (
      changed.has('variant') ||
      changed.has('cellSize') ||
      changed.has('gap')
    ) {
      this.applyPattern()
      this.relayout(this.width, this.height)
    }
  }

  /** Cell size in pixels for the current variant. */
  private get cell(): number {
    const size = Number(this.cellSize)
    return size > 0
      ? Math.min(400, Math.max(6, size))
      : (DEFAULT_CELL_SIZE[this.variant] ?? 40)
  }

  private get hasTiles(): boolean {
    return this.variant !== 'dots' && Number(this.gap) > 0
  }

  /** Writes the cell size, dot size and tile mask the CSS pattern is drawn from. */
  private applyPattern(): void {
    const pattern = this.renderRoot.querySelector<HTMLElement>('.pattern')
    if (!pattern) return
    const cell = this.cell
    pattern.style.setProperty('--_cell', `${cell}px`)
    pattern.style.setProperty(
      '--_dot',
      `${Math.min(2, Math.max(1, cell * 0.06)).toFixed(2)}px`,
    )
    if (this.hasTiles) {
      const gap = Math.min(cell - 2, Math.max(0, Number(this.gap)))
      pattern.style.setProperty('--_tile-mask', tileMask(cell, gap))
    } else {
      pattern.style.removeProperty('--_tile-mask')
    }
  }

  /** Builds the cell arrays for a box of `width` × `height` pixels. */
  private relayout(width: number, height: number): void {
    this.width = width
    this.height = height
    this.layout = gridLayout(width, height, this.cell)
    const cells = this.layout.columns * this.layout.rows
    this.intensity = new Float32Array(cells)
    this.goal = new Float32Array(cells)
    this.tint = new Uint8Array(cells)
    this.flags = new Uint8Array(cells)
    this.active = []
    this.touched = []
    this.ripples = []
    this.held = -1
  }

  private colorCount(): number {
    return Math.min(MAX_COLORS, Math.max(1, this.colors?.length ?? 0))
  }

  private track(state: CanvasPointerState): void {
    if (this.isReduced) return
    if (this.variant !== 'dots') {
      const cell = state.isInside ? cellAt(this.layout, state.x, state.y) : -1
      if (cell !== this.held && cell !== -1) {
        this.tint[cell] = Math.floor(Math.random() * this.colorCount())
      }
      this.held = cell
    }
    this.wake()
  }

  private press(state: CanvasPointerState): void {
    if (this.isReduced) return
    if (this.variant === 'highlight') {
      this.track(state)
      return
    }
    if (this.ripples.length >= MAX_RIPPLES) this.ripples.shift()
    const cell = cellAt(this.layout, state.x, state.y)
    if (cell !== -1) {
      this.tint[cell] = Math.floor(Math.random() * this.colorCount())
    }
    this.ripples.push({
      x: state.x,
      y: state.y,
      age: 0,
      lifetime: rippleLifetime(
        state.x,
        state.y,
        this.width,
        this.height,
        this.layout.cell,
      ),
    })
    this.wake()
  }

  private wake(): void {
    if (!this.isReduced) this.loop.start()
  }

  /** Puts every cell out and draws the still grid. */
  private clear(): void {
    this.intensity.fill(0)
    this.flags.fill(0)
    this.active = []
    this.ripples = []
    this.held = -1
    this.loop.stop()
    this.loop.drawOnce()
  }

  /** Raises a cell's goal for this frame, keeping the strongest. */
  private aim(cell: number, value: number): void {
    if (value <= 0) return
    if (this.goal[cell] === 0) this.touched.push(cell)
    if (value > this.goal[cell]) this.goal[cell] = value
  }

  private step(frame: CanvasFrame): void {
    const dt = frame.delta / 1000
    const { columns, rows, cell } = this.layout
    const isDots = this.variant === 'dots'
    const state = this.pointer.state

    // 1. What each cell is aiming for this frame: the pointer, then the ripples.
    if (isDots) {
      if (state.isInside && !this.isReduced) {
        const radius = Math.max(cell, Number(this.radius) || 120)
        const c0 = Math.max(0, Math.floor((state.x - radius) / cell))
        const c1 = Math.min(columns - 1, Math.floor((state.x + radius) / cell))
        const r0 = Math.max(0, Math.floor((state.y - radius) / cell))
        const r1 = Math.min(rows - 1, Math.floor((state.y + radius) / cell))
        for (let r = r0; r <= r1; r++) {
          for (let c = c0; c <= c1; c++) {
            const dx = (c + 0.5) * cell - state.x
            const dy = (r + 0.5) * cell - state.y
            this.aim(r * columns + c, dotInfluence(Math.hypot(dx, dy), radius))
          }
        }
      }
    } else if (this.held !== -1) {
      this.aim(this.held, this.variant === 'ripple' ? 0.25 : 1)
    }
    this.ripples = this.ripples.filter((ripple) => {
      ripple.age += dt
      if (ripple.age > ripple.lifetime) return false
      const front = ripple.age * RIPPLE_SPEED
      const reach = front + (RIPPLE_WIDTH * cell) / 2
      const c0 = Math.max(0, Math.floor((ripple.x - reach) / cell))
      const c1 = Math.min(columns - 1, Math.floor((ripple.x + reach) / cell))
      const r0 = Math.max(0, Math.floor((ripple.y - reach) / cell))
      const r1 = Math.min(rows - 1, Math.floor((ripple.y + reach) / cell))
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const dx = (c + 0.5) * cell - ripple.x
          const dy = (r + 0.5) * cell - ripple.y
          const strength = rippleStrength(
            Math.hypot(dx, dy),
            ripple.age,
            cell,
            ripple.lifetime,
          )
          if (strength > 0) this.aim(r * columns + c, strength)
        }
      }
      return true
    })

    // 2. Every lit or aimed-at cell moves toward its goal.
    for (const index of this.touched) {
      if (!this.flags[index]) {
        this.flags[index] = 1
        this.active.push(index)
        if (this.intensity[index] === 0 && isDots) {
          this.tint[index] = Math.floor(Math.random() * this.colorCount())
        }
      }
    }
    let isMoving = this.ripples.length > 0
    const fade = this.variant === 'ripple' ? RIPPLE_FADE : HIGHLIGHT_FADE
    const rise = 1 - Math.exp(-dt * 16)
    const fall = 1 - Math.exp(-dt * 5)
    let write = 0
    for (let n = 0; n < this.active.length; n++) {
      const index = this.active[n]
      const goal = this.goal[index]
      const before = this.intensity[index]
      let next: number
      if (isDots) {
        next = before + (goal - before) * (goal > before ? rise : fall)
        if (Math.abs(goal - next) < 0.003) next = goal
      } else {
        // Lit at once, then fading behind the pointer.
        next = Math.max(goal, before - dt / fade)
      }
      this.intensity[index] = next
      if (Math.abs(next - before) > 0.0005) isMoving = true
      if (next > 0.003 || goal > 0) {
        this.active[write++] = index
      } else {
        this.intensity[index] = 0
        this.flags[index] = 0
      }
    }
    this.active.length = write
    for (const index of this.touched) this.goal[index] = 0
    this.touched.length = 0

    this.paint(frame)
    // The first frame after a start has no elapsed time, so nothing has moved
    // yet: only a frame with time in it can say the grid has settled.
    if (!isMoving && dt > 0) this.loop.stop()
  }

  private paint(frame: CanvasFrame): void {
    const context = frame.context
    if (!context) return
    context.clearRect(0, 0, frame.width, frame.height)
    if (this.active.length === 0) return
    const { columns, cell } = this.layout
    const isDots = this.variant === 'dots'
    const tiles = this.hasTiles
    const gap = tiles ? Math.min(cell - 2, Math.max(0, Number(this.gap))) : 0
    const tileRadius = Math.min(8, (cell - gap) * 0.18)
    const restDot = Math.min(2, Math.max(1, cell * 0.06))
    const fullDot = cell * 0.3
    const colors = this.colorCount()
    // One colour at a time, so the fill changes a handful of times per frame.
    for (let color = 0; color < colors; color++) {
      context.fillStyle = this.palette.get(COLOR_NAMES[color] ?? 'c0')
      for (const index of this.active) {
        if (this.tint[index] % colors !== color) continue
        const value = this.intensity[index]
        if (value <= 0) continue
        const column = index % columns
        const row = (index - column) / columns
        const x = column * cell
        const y = row * cell
        if (isDots) {
          context.globalAlpha = 0.3 + 0.7 * value
          context.beginPath()
          context.arc(
            x + cell / 2,
            y + cell / 2,
            restDot + (fullDot - restDot) * value,
            0,
            Math.PI * 2,
          )
          context.fill()
        } else if (tiles) {
          context.globalAlpha = value * 0.9
          context.beginPath()
          if (typeof context.roundRect === 'function') {
            context.roundRect(
              x + gap / 2,
              y + gap / 2,
              cell - gap,
              cell - gap,
              tileRadius,
            )
          } else {
            context.rect(x + gap / 2, y + gap / 2, cell - gap, cell - gap)
          }
          context.fill()
        } else {
          // Inside the lines, which sit on each cell's top and left edges.
          context.globalAlpha = value * 0.85
          context.fillRect(x + 1, y + 1, cell - 1, cell - 1)
        }
      }
    }
    context.globalAlpha = 1
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed)
    this.applyPattern()
  }

  protected override render() {
    return html`
      <div class="grid" aria-hidden="true">
        <div class="pattern ${this.hasTiles ? 'tiles' : ''}" part="pattern"></div>
        <canvas part="canvas" aria-hidden="true"></canvas>
      </div>
      <span class="color-probe"></span>
      <div class="content"><slot></slot></div>
    `
  }
}

defineElement('moul-interactive-grid', MoulInteractiveGrid)

declare global {
  interface HTMLElementTagNameMap {
    'moul-interactive-grid': MoulInteractiveGrid
  }
}
