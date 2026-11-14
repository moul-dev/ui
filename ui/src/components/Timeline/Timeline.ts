import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { timelineStyles } from './Timeline.styles'
import {
  isTimelineItem,
  type MoulTimelineItem,
  type TimelineDensity,
  type TimelineProgress,
} from './TimelineItem'

const DENSITIES: TimelineDensity[] = ['comfortable', 'compact']
const PROGRESS: TimelineProgress[] = ['scroll', 'status', 'none']

/** Where the scroll-linked fill's leading edge sits, as a fraction of the viewport height. */
const PROGRESS_LINE = 0.5

/** True where the browser runs CSS scroll-driven animations, which then fill the rail with no script. */
function supportsScrollTimelines(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('animation-timeline', 'view()')
  )
}

/**
 * A vertical timeline of `<moul-timeline-item>` milestones on a rail, for
 * changelogs, roadmaps, order tracking and a record's history. In the
 * default `comfortable` density a wide timeline puts each heading in a
 * column beside its content, where it stays stuck to the top of the viewport
 * while the content scrolls past; a narrow one stacks the heading above the
 * content. `compact` density is a tight, non-sticky list of small dots for
 * side panels and audit logs. The rail fills as the reader scrolls through
 * the timeline (`progress="scroll"`, the default), up to the current item
 * (`progress="status"`), or not at all (`progress="none"`).
 *
 * Keyboard and screen readers: the timeline takes no focus and handles no
 * keys; the items' content keeps its own. The host has `role="list"`, named
 * by `label` or your own `aria-label`, and each item is a `listitem`, so
 * screen readers announce how many milestones there are. The rail and the
 * markers are decorative and hidden. With `heading-level`, each item's
 * heading becomes a heading of that level, so readers can jump between
 * milestones.
 *
 * Reduced motion: the current item's marker does not pulse, and status
 * changes fill the rail and recolour markers at once. The scroll-linked fill
 * keeps following the scroll position, because it moves only as far and as
 * fast as the reader scrolls.
 *
 * @slot - The `moul-timeline-item` elements (direct children only).
 * @csspart base - The column that holds the items.
 * @cssprop --moul-timeline-heading-width - The heading column in the roomy layout. Defaults to `12rem`.
 * @cssprop --moul-timeline-sticky-top - How far below the top of the viewport headings stick. Defaults to `var(--spacing-4)`.
 * @cssprop --moul-timeline-gap - Space after each item. Defaults to `var(--spacing-8)`, or `var(--spacing-4)` when compact.
 * @cssprop --moul-timeline-rail-color - The unfilled rail. Defaults to `var(--color-border)`.
 * @cssprop --moul-timeline-progress-color - The filled rail. Defaults to `var(--color-accent)`.
 */
export class MoulTimeline extends LitElement {
  static override styles = timelineStyles

  static override properties = {
    density: { type: String, reflect: true },
    progress: { type: String, reflect: true },
    headingLevel: { type: Number, attribute: 'heading-level' },
    label: { type: String },
  }

  /** `comfortable` (sticky headings beside the content when wide) or `compact`. */
  declare density: TimelineDensity
  /** What fills the rail: `scroll` position, item `status`, or `none`. */
  declare progress: TimelineProgress
  /** 1 to 6 makes every item heading a heading of that level; 0 leaves them plain. */
  declare headingLevel: number
  /** The list's accessible name, set as `aria-label`. */
  declare label: string

  private observer: MutationObserver | null = null
  private resizeObserver: ResizeObserver | null = null
  private isTracking = false
  private frame = 0
  /** The `aria-label` the timeline last wrote, to leave an author's own alone. */
  private writtenLabel: string | null = null

  constructor() {
    super()
    this.density = 'comfortable'
    this.progress = 'scroll'
    this.headingLevel = 0
    this.label = ''
  }

  /** The visible items, in order. */
  public get items(): MoulTimelineItem[] {
    return Array.from(this.children).filter(
      (child): child is MoulTimelineItem =>
        isTimelineItem(child) && !child.hidden,
    )
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'list')
    this.observer = new MutationObserver(() => this.requestUpdate())
    this.observer.observe(this, {
      childList: true,
      attributes: true,
      attributeFilter: ['hidden'],
      subtree: true,
    })
    this.requestUpdate()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.observer?.disconnect()
    this.observer = null
    this.stopTracking()
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (!DENSITIES.includes(this.density)) this.density = 'comfortable'
    if (!PROGRESS.includes(this.progress)) this.progress = 'scroll'
    if (changed.has('label')) {
      const current = this.getAttribute('aria-label')
      if (current === null || current === this.writtenLabel) {
        this.writtenLabel = this.label || null
        if (this.label) this.setAttribute('aria-label', this.label)
        else this.removeAttribute('aria-label')
      }
    }
    const level = Math.round(Number(this.headingLevel))
    const headingLevel = level >= 1 && level <= 6 ? level : 0
    const items = this.items
    items.forEach((item, index) => {
      item.density = this.density
      item.progress = this.progress
      item.headingLevel = headingLevel
      item.isFirst = index === 0
      item.isLast = index === items.length - 1
    })
  }

  protected override updated(): void {
    const shouldTrack = this.progress === 'scroll' && !supportsScrollTimelines()
    if (shouldTrack) this.startTracking()
    else this.stopTracking()
    if (this.isTracking) this.scheduleMeasure()
  }

  /** Follows the scroll with a listener, where CSS scroll timelines are missing. */
  private startTracking(): void {
    if (this.isTracking || typeof window === 'undefined') return
    this.isTracking = true
    // Capture on the document hears every scroller, the page or one inside it.
    document.addEventListener('scroll', this.scheduleMeasure, {
      capture: true,
      passive: true,
    })
    window.addEventListener('resize', this.scheduleMeasure, { passive: true })
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(this.scheduleMeasure)
      this.resizeObserver.observe(this)
    }
  }

  private stopTracking(): void {
    if (!this.isTracking) return
    this.isTracking = false
    document.removeEventListener('scroll', this.scheduleMeasure, {
      capture: true,
    })
    window.removeEventListener('resize', this.scheduleMeasure)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
    for (const item of this.items) item.clearScrollProgress()
  }

  private readonly scheduleMeasure = (): void => {
    if (this.frame || typeof requestAnimationFrame !== 'function') return
    this.frame = requestAnimationFrame(this.measure)
  }

  private readonly measure = (): void => {
    this.frame = 0
    if (!this.isTracking) return
    const line = window.innerHeight * PROGRESS_LINE
    for (const item of this.items) item.syncScrollProgress(line)
  }

  protected override render() {
    return html`<div part="base"><slot></slot></div>`
  }
}

defineElement('moul-timeline', MoulTimeline)

declare global {
  interface HTMLElementTagNameMap {
    'moul-timeline': MoulTimeline
  }
}
