import { html, LitElement, type PropertyValues } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { InViewController } from '../../controllers/in-view.controller'
import { ScrollController } from '../../controllers/scroll.controller'
import { defineElement } from '../../utils/define-element'
import { findScrollRoot } from '../../utils/scroll-root'
import { scrollParallaxStyles } from './ScrollParallax.styles'

/** `rows` stacks the tracks and slides them sideways; `columns` sets them side by side and slides them up and down. */
export type ScrollParallaxOrientation = 'rows' | 'columns'

const ORIENTATIONS: readonly ScrollParallaxOrientation[] = ['rows', 'columns']
const DEFAULT_SPEED = 300

const PROGRESS_PROPERTY = '--_scroll-parallax-progress'
const FACTOR_PROPERTY = '--_scroll-parallax-factor'

/**
 * Rows or columns of cards and images that slide at different speeds as the
 * page scrolls past them, as in a hero wall of product shots or a gallery of
 * three columns. Each child is a track: a row (the default) that slides
 * sideways, the rows alternating left and right, or with
 * `orientation="columns"` a column that slides up or down, the columns
 * alternating. `speed` is how far, in pixels, a track travels while the
 * element crosses the screen, and `data-speed` on a track multiplies it for
 * that track alone (a negative number reverses it, `0` holds it still). A
 * track is centred when the element is in the middle of the screen, so let
 * rows overflow on both sides (centre their content) and the edges never show
 * an empty gap. The element clips what slides outside it. Where the browser
 * has scroll-driven animations a native view timeline drives every track, and
 * no script runs while the reader scrolls; elsewhere a passive scroll
 * listener writes one variable per frame. Tracks move by the individual
 * `translate` property alone, so their own transforms are kept and nothing
 * is laid out again. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role; the tracks
 * and their content are read and reached with Tab in their order. The
 * movement is decoration, so nothing is announced.
 *
 * Reduced motion: the tracks hold still in their centred place and the
 * element is an ordinary set of rows or columns.
 *
 * @slot - The tracks: one element per row or column, each holding its cards or images.
 *
 * @csspart tracks - The box that lays the tracks out in rows or columns.
 *
 * @cssprop --scroll-parallax-gap - Space between the tracks. Defaults to `var(--spacing-4)`.
 */
export class MoulScrollParallax extends LitElement {
  static override styles = scrollParallaxStyles

  static override properties = {
    orientation: { type: String, reflect: true },
    speed: { type: Number },
  }

  /** Rows that slide sideways, or columns that slide up and down. Defaults to `rows`; an unknown value falls back to it. */
  declare orientation: ScrollParallaxOrientation
  /** Pixels a track travels while the element crosses the screen. Defaults to 300. */
  declare speed: number

  private readonly inView: InViewController
  private scrollRoot: Element | null | undefined = undefined
  private styled = new Set<HTMLElement>()
  private mutationObserver: MutationObserver | null = null

  constructor() {
    super()
    this.orientation = 'rows'
    this.speed = DEFAULT_SPEED
    new ScrollController(this, {
      timeline: 'view',
      property: PROGRESS_PROPERTY,
      source: () => this.resolveScrollRoot(),
    })
    // Only for `will-change`: the tracks get their own layers while near the screen.
    this.inView = new InViewController(this, {
      rootMargin: '50% 0px',
      pauseOffscreen: false,
    })
  }

  private get tracks(): HTMLElement[] {
    return [...this.children].filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    )
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (typeof MutationObserver === 'function') {
      // A track's own `data-speed` may change after it is slotted.
      this.mutationObserver = new MutationObserver(() => this.syncTracks())
      this.mutationObserver.observe(this, {
        subtree: true,
        attributeFilter: ['data-speed'],
      })
    }
    // Moved elsewhere: the tracks lost their factors when it disconnected.
    if (this.hasUpdated) this.syncTracks()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.mutationObserver?.disconnect()
    this.mutationObserver = null
    this.scrollRoot = undefined
    for (const track of this.styled) track.style.removeProperty(FACTOR_PROPERTY)
    this.styled.clear()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (
      changed.has('orientation') &&
      !ORIENTATIONS.includes(this.orientation)
    ) {
      this.orientation = 'rows'
    }
    if (changed.has('speed')) {
      const speed = Number(this.speed)
      this.style.setProperty(
        '--_scroll-parallax-speed',
        `${Number.isFinite(speed) ? speed : DEFAULT_SPEED}px`,
      )
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('orientation')) this.syncTracks()
  }

  private resolveScrollRoot(): Element | null {
    if (this.scrollRoot === undefined) this.scrollRoot = findScrollRoot(this)
    return this.scrollRoot
  }

  /** Writes each track's share of the travel once; scrolling only moves the shared progress. */
  private syncTracks(): void {
    const tracks = this.tracks
    for (const track of this.styled) {
      if (tracks.includes(track)) continue
      track.style.removeProperty(FACTOR_PROPERTY)
      this.styled.delete(track)
    }
    tracks.forEach((track, index) => {
      const factor = trackFactor(this.orientation, index, track.dataset.speed)
      const value = String(factor)
      if (track.style.getPropertyValue(FACTOR_PROPERTY) !== value) {
        track.style.setProperty(FACTOR_PROPERTY, value)
      }
      this.styled.add(track)
    })
  }

  protected override render() {
    return html`<div
      part="tracks"
      class=${classMap({ tracks: true, near: this.inView.isInView })}
    >
      <slot @slotchange=${() => this.syncTracks()}></slot>
    </div>`
  }
}

/**
 * How much of `speed` a track travels, and which way. Rows alternate, the
 * first sliding toward the inline end; columns alternate, the first rising.
 * A finite `data-speed` replaces the pattern for that track.
 */
export function trackFactor(
  orientation: ScrollParallaxOrientation,
  index: number,
  override?: string,
): number {
  if (override !== undefined && override.trim() !== '') {
    const value = Number(override)
    if (Number.isFinite(value)) return value
  }
  const isEven = index % 2 === 0
  if (orientation === 'columns') return isEven ? -1 : 1
  return isEven ? 1 : -1
}

defineElement('moul-scroll-parallax', MoulScrollParallax)

declare global {
  interface HTMLElementTagNameMap {
    'moul-scroll-parallax': MoulScrollParallax
  }
}
