import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { styleMap } from 'lit/directives/style-map.js'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { patternStyles } from './Pattern.styles'

/** `dots` and `grid` are the classic backgrounds, `hexagons` a honeycomb of outlines, `stripes` broad diagonal bands, `lines` fine diagonal hairlines. */
export type PatternVariant = 'dots' | 'grid' | 'hexagons' | 'stripes' | 'lines'

/** Where the pattern fades out: toward every edge from the centre (`radial`), toward the top or the bottom, or in a band along all four edges (`edges`). */
export type PatternFade = 'none' | 'radial' | 'top' | 'bottom' | 'edges'

const VARIANTS: readonly PatternVariant[] = [
  'dots',
  'grid',
  'hexagons',
  'stripes',
  'lines',
]

const FADES: readonly PatternFade[] = [
  'none',
  'radial',
  'top',
  'bottom',
  'edges',
]

/** Variants whose cells light up under `is-animated`; the others drift instead. */
const LIT_VARIANTS: readonly PatternVariant[] = ['dots', 'grid']

const DEFAULT_COUNT = 12
const MIN_COUNT = 1
const MAX_COUNT = 64

/** The stylesheet's default cell sizes, used when the cell cannot be measured. */
const DEFAULT_SIZES: Record<PatternVariant, number> = {
  dots: 24,
  grid: 40,
  hexagons: 40,
  stripes: 24,
  lines: 10,
}

/** Tries before a lit cell settles for a spot another lit cell already holds. */
const PLACEMENT_TRIES = 8

/** A lit cell, by column and row from the top left. */
interface LitCell {
  x: number
  y: number
}

function clampCount(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_COUNT
  return Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(value)))
}

/**
 * A quiet background pattern drawn behind whatever you put inside it: dots,
 * a grid, a honeycomb of hexagons, broad diagonal stripes, or fine diagonal
 * lines. Use it behind a hero heading, a feature panel or an empty state,
 * where a plain background looks unfinished. `fade` softens the pattern
 * toward the edges, the top or the bottom, so the content in front stays
 * readable. With `is-animated`, random cells of `grid` and `dots` light up
 * and fade out, each moving to a new cell when it goes dark (an animated or
 * flickering grid), while `stripes`, `lines` and `hexagons` drift slowly
 * sideways. Wrap content in it, or leave it empty and position it absolutely
 * as a layer behind a section's content. The pattern is drawn with CSS
 * gradients and a mask in the theme's foreground and accent colours, so it
 * reads on light and dark pages. The animation is CSS and pauses while the
 * pattern is off screen. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The pattern
 * is decorative and hidden from screen readers (`aria-hidden`); the content
 * inside is read and focused as usual. Where the system forces its own
 * colours (Windows high contrast) the pattern is not drawn.
 *
 * Reduced motion: nothing moves. The lit cells stay where they are at
 * different strengths, and the drifting patterns stand still.
 *
 * @slot - The content shown in front of the pattern. Leave it empty to use the element as a layer.
 *
 * @csspart background - The decorative layer behind the content; it holds the pattern and the lit cells, and carries the `fade` mask.
 *
 * @cssprop --pattern-size - The size of one cell, as a CSS length. For `hexagons` it is the width of one hexagon, corner to corner. Defaults to `24px` for `dots` and `stripes`, `40px` for `grid` and `hexagons`, and `10px` for `lines`.
 * @cssprop --pattern-color - The colour of the dots, lines and stripes. Defaults to `--color-fg` at 15%, at 25% for `dots` and at 6% for `stripes`.
 * @cssprop --pattern-line-width - The width of the lines in `grid` and `lines`. `hexagons` are always drawn with a one-pixel line. Defaults to `1px`.
 * @cssprop --pattern-dot-size - The diameter of each dot in `dots`. Defaults to `2px`.
 * @cssprop --pattern-highlight - The colour of a lit cell under `is-animated`. Defaults to `--color-accent` at 30%, at 85% for `dots`.
 * @cssprop --pattern-duration - Under `is-animated`, the time one lit cell takes to brighten and fade, or the time the pattern takes to drift by one cell. Defaults to `4s` for lit cells; the drift takes `6s` for `stripes`, `3s` for `lines` and `12s` for `hexagons`.
 */
export class MoulPattern extends LitElement {
  static override styles = patternStyles

  static override properties = {
    variant: { type: String, reflect: true },
    fade: { type: String, reflect: true },
    isAnimated: { type: Boolean, reflect: true, attribute: 'is-animated' },
    count: { type: Number },
    cells: { state: true },
  }

  /** The pattern drawn. Defaults to `dots`. */
  declare variant: PatternVariant
  /** Where the pattern fades out. Defaults to `none`. */
  declare fade: PatternFade
  /** Light up random cells (`grid`, `dots`) or let the pattern drift (`stripes`, `lines`, `hexagons`). */
  declare isAnimated: boolean
  /** How many cells are lit at once under `is-animated`, from 1 to 64. Defaults to 12. */
  declare count: number
  /** The lit cells, one per `count`, while any are shown. */
  private declare cells: LitCell[]

  /** Whole cells that fit across and down the host, from the last measurement. */
  private columns = 1
  private rows = 1
  private isMeasured = false
  private resizeObserver: ResizeObserver | null = null

  constructor() {
    super()
    this.variant = 'dots'
    this.fade = 'none'
    this.isAnimated = false
    this.count = DEFAULT_COUNT
    this.cells = []
    // Pauses the lit cells and the drift while the pattern is off screen (the controller's default).
    new InViewController(this)
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    // On a reconnect the shadow tree is already there; the first connect waits for firstUpdated.
    if (this.hasUpdated) this.observeSizes()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }

  /** Lit cells are shown: `is-animated` on a variant that lights cells. */
  private get hasLitCells(): boolean {
    return this.isAnimated && LIT_VARIANTS.includes(this.variant)
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('variant') && !VARIANTS.includes(this.variant)) {
      this.variant = 'dots'
    }
    if (changed.has('fade') && !FADES.includes(this.fade)) {
      this.fade = 'none'
    }
    if (changed.has('count')) {
      const count = clampCount(this.count)
      if (count !== this.count) this.count = count
    }
    if (
      changed.has('count') ||
      changed.has('variant') ||
      changed.has('isAnimated')
    ) {
      this.syncCells()
    }
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed)
    // The observer reports the host and the one-cell probe as soon as it
    // starts watching, and again whenever a variant's cell size differs, so
    // measuring happens outside an update (setting the lit cells inside one
    // would schedule a second update straight away).
    this.observeSizes()
  }

  private observeSizes(): void {
    if (this.resizeObserver || typeof ResizeObserver !== 'function') return
    this.resizeObserver = new ResizeObserver(() => this.measure())
    this.resizeObserver.observe(this)
    // The probe is one cell wide, so a change to --pattern-size reaches the observer too.
    const probe = this.renderRoot.querySelector('.probe')
    if (probe) this.resizeObserver.observe(probe)
  }

  /** Counts the whole cells that fit, and moves any lit cell that no longer fits. */
  private measure(): void {
    const probe = this.renderRoot?.querySelector('.probe')
    if (!probe) return
    const measured = probe.getBoundingClientRect().width
    const size =
      Number.isFinite(measured) && measured > 0
        ? measured
        : DEFAULT_SIZES[this.variant]
    const host = this.getBoundingClientRect()
    // A host with no size yet (not laid out, or inside a hidden parent) has no grid to place cells in.
    if (!(host.width > 0 && host.height > 0)) return
    const columns = Math.max(1, Math.floor(host.width / size))
    const rows = Math.max(1, Math.floor(host.height / size))
    const isFirst = !this.isMeasured
    this.isMeasured = true
    if (!isFirst && columns === this.columns && rows === this.rows) return
    this.columns = columns
    this.rows = rows
    if (this.cells.length === 0) return
    // The first measurement places every cell. Later ones move only the cells
    // left outside, and cells that share a spot while there is room apart.
    const hasRoom = columns * rows >= this.cells.length
    const kept: LitCell[] = []
    for (const cell of this.cells) {
      const isInside = cell.x < columns && cell.y < rows
      const isShared = kept.some(
        (other) => other.x === cell.x && other.y === cell.y,
      )
      kept.push(
        !isFirst && isInside && !(hasRoom && isShared)
          ? cell
          : this.pickCell(kept),
      )
    }
    this.cells = kept
  }

  /** Keeps one lit cell per `count` while cells are shown, holding on to the ones already placed. */
  private syncCells(): void {
    if (!this.hasLitCells) {
      if (this.cells.length > 0) this.cells = []
      return
    }
    const count = clampCount(this.count)
    if (count === this.cells.length) return
    const cells = this.cells.slice(0, count)
    while (cells.length < count) cells.push(this.pickCell(cells))
    this.cells = cells
  }

  /** A random cell inside the grid, away from the other lit cells when there is room. */
  private pickCell(others: readonly LitCell[]): LitCell {
    const isTaken = (x: number, y: number) =>
      others.some((other) => other.x === x && other.y === y)
    let cell = this.randomCell()
    for (let tries = 1; tries < PLACEMENT_TRIES; tries++) {
      if (!isTaken(cell.x, cell.y)) return cell
      cell = this.randomCell()
    }
    if (!isTaken(cell.x, cell.y)) return cell
    // A crowded grid: walk on from the last guess to the next free cell, if there is one.
    const total = this.columns * this.rows
    const start = cell.y * this.columns + cell.x
    for (let step = 1; step < total; step++) {
      const index = (start + step) % total
      const x = index % this.columns
      const y = Math.floor(index / this.columns)
      if (!isTaken(x, y)) return { x, y }
    }
    return cell
  }

  private randomCell(): LitCell {
    return {
      x: Math.floor(Math.random() * this.columns),
      y: Math.floor(Math.random() * this.rows),
    }
  }

  /** A lit cell has gone dark at the end of its cycle: it lights up somewhere else next. */
  private readonly handleIteration = (event: AnimationEvent): void => {
    if (event.animationName && event.animationName !== 'moul-pattern-flicker') {
      return
    }
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const index = Number(target.dataset.index)
    if (!Number.isInteger(index) || !this.cells[index]) return
    const cells = [...this.cells]
    cells[index] = this.pickCell(cells.filter((_, other) => other !== index))
    this.cells = cells
  }

  protected override render() {
    const total = this.cells.length
    return html`<div part="background" class="background" aria-hidden="true">
        <div class="pattern"></div>
        ${
          total > 0
            ? html`<div class="cells" @animationiteration=${this.handleIteration}>
              ${this.cells.map(
                (cell, index) =>
                  html`<span
                    class="cell"
                    data-index=${index}
                    style=${styleMap({
                      '--_pattern-x': String(cell.x),
                      '--_pattern-y': String(cell.y),
                      // Spreads the cells' cycles evenly, so they never all light at once.
                      '--_pattern-phase': String(index / total),
                    })}
                  ></span>`,
              )}
            </div>`
            : nothing
        }
        <span class="probe"></span>
      </div>
      <slot></slot>`
  }
}

defineElement('moul-pattern', MoulPattern)

declare global {
  interface HTMLElementTagNameMap {
    'moul-pattern': MoulPattern
  }
}
