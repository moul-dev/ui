import { html, LitElement, nothing, type PropertyValues, svg } from 'lit'
import { normalizeTone, type SemanticTone } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { timelineItemStyles } from './Timeline.styles'

export type TimelineItemStatus = 'complete' | 'current' | 'upcoming'
export type TimelineDensity = 'comfortable' | 'compact'
export type TimelineProgress = 'scroll' | 'status' | 'none'

const STATUSES: TimelineItemStatus[] = ['complete', 'current', 'upcoming']

/** Words read after the heading for each status; `current` is `aria-current` instead. */
const STATUS_WORDS: Partial<Record<TimelineItemStatus, string>> = {
  complete: 'Completed',
  upcoming: 'Upcoming',
}

const check = svg`<svg class="check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>`

export const isTimelineItem = (node: unknown): node is MoulTimelineItem =>
  node instanceof Element && node.localName === 'moul-timeline-item'

const clamp = (value: number) => Math.min(1, Math.max(0, value))

/**
 * One milestone of a `<moul-timeline>`: a heading (a date, a version, a
 * title) beside or above its content, and a marker on the rail. Give it a
 * `status` of `complete`, `current` or `upcoming` to show where a process
 * stands, and a `tone` to colour its marker. In the roomy layout of a wide
 * timeline the marker and heading stay stuck to the top of the viewport while
 * the item's content scrolls past.
 *
 * Keyboard and screen readers: the item takes no focus and handles no keys;
 * its content keeps its own. The host has `role="listitem"` inside the
 * timeline's list. The rail and the marker, including a slotted marker icon,
 * are hidden from screen readers. `status="current"` sets
 * `aria-current="step"` (an `aria-current` you set yourself is kept), and
 * `complete` and `upcoming` add "Completed" or "Upcoming" after the heading
 * as hidden text; `status-label` replaces that word, for another language.
 * With the timeline's `heading-level`, the heading is a heading of that
 * level.
 *
 * Reduced motion: the marker of the current item stops pulsing, and status
 * changes fill the rail and recolour the marker at once instead of easing.
 * The scroll-linked fill still follows the scroll position, since that is
 * the reader's own movement, not added motion.
 *
 * @slot - The item's content.
 * @slot heading - A rich heading, used instead of the `heading` text.
 * @slot meta - Small text under the heading, such as a date; used instead of the `meta` text.
 * @slot marker - An icon or avatar to show on the rail instead of the dot.
 * @csspart base - The grid that lays out the rail, the heading and the content.
 * @csspart rail - The rail segment beside this item.
 * @csspart progress - The filled part of the rail segment.
 * @csspart aside - The marker and the heading, which stick in the roomy layout.
 * @csspart marker - The marker on the rail.
 * @csspart heading - The heading and its meta.
 * @csspart content - The box around the content.
 */
export class MoulTimelineItem extends LitElement {
  static override styles = timelineItemStyles

  static override properties = {
    heading: { type: String },
    meta: { type: String },
    status: { type: String, reflect: true },
    statusLabel: { type: String, attribute: 'status-label' },
    tone: { type: String, reflect: true },
    density: { state: true },
    progress: { state: true },
    headingLevel: { state: true },
    isFirst: { state: true },
    isLast: { state: true },
  }

  /** The heading text. The `heading` slot takes its place. */
  declare heading: string
  /** Small text under the heading, such as a date. The `meta` slot takes its place. */
  declare meta: string
  /** Where the item stands in a process; empty for none. */
  declare status: TimelineItemStatus | ''
  /** The hidden word read after the heading for `complete` and `upcoming`; defaults to "Completed" and "Upcoming". */
  declare statusLabel: string | undefined
  /** The marker's colour: `primary`, `accent`, `success`, `warning` or `error`. */
  declare tone: SemanticTone | ''
  /**
   * Set by the timeline.
   * @internal
   */
  declare density: TimelineDensity
  /**
   * Set by the timeline.
   * @internal
   */
  declare progress: TimelineProgress
  /**
   * Set by the timeline: the heading's `aria-level`, or 0 for a plain heading.
   * @internal
   */
  declare headingLevel: number
  /**
   * Set by the timeline: the first item, whose rail starts at its marker.
   * @internal
   */
  declare isFirst: boolean
  /**
   * Set by the timeline: the last item, whose rail ends at its marker.
   * @internal
   */
  declare isLast: boolean
  /** True while something is slotted into `marker`. */
  private hasMarker = false
  /** True while the default slot holds anything. */
  private hasContent = false

  /** True when the item set `aria-current` itself, so it can take it off again. */
  private ownsCurrent = false

  constructor() {
    super()
    this.heading = ''
    this.meta = ''
    this.status = ''
    this.statusLabel = undefined
    this.tone = ''
    this.density = 'comfortable'
    this.progress = 'scroll'
    this.headingLevel = 0
    this.isFirst = false
    this.isLast = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'listitem')
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    // Read from the children, so the first render already knows and never re-renders for it.
    this.hasMarker = Array.from(this.children).some(
      (child) => child.slot === 'marker',
    )
    this.hasContent = Array.from(this.childNodes).some((node) =>
      node.nodeType === Node.ELEMENT_NODE
        ? !(node as Element).slot
        : node.nodeType === Node.TEXT_NODE &&
          (node.textContent ?? '').trim() !== '',
    )
    if (changed.has('status') && this.status) {
      const status = STATUSES.includes(this.status as TimelineItemStatus)
        ? this.status
        : ''
      if (status !== this.status) this.status = status
    }
    if (changed.has('tone') && this.tone) {
      const tone = normalizeTone(this.tone)
      if (tone !== this.tone) this.tone = tone
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (!changed.has('status')) return
    if (this.status === 'current') {
      if (!this.hasAttribute('aria-current')) {
        this.setAttribute('aria-current', 'step')
        this.ownsCurrent = true
      }
    } else if (this.ownsCurrent) {
      this.removeAttribute('aria-current')
      this.ownsCurrent = false
    }
  }

  /**
   * Fills the rail segment to where `line` (a viewport y) crosses it, and
   * marks the marker reached once the line passes its centre. The timeline
   * calls it on scroll where the browser has no scroll-driven animations.
   * @internal
   */
  public syncScrollProgress(line: number): void {
    const base = this.renderRoot.querySelector<HTMLElement>('[part~="base"]')
    const track = this.renderRoot.querySelector('[part~="rail"]')
    const marker = this.renderRoot.querySelector('[part~="marker"]')
    if (!base || !track || !marker) return
    const rail = track.getBoundingClientRect()
    const progress =
      rail.height > 0
        ? clamp((line - rail.top) / rail.height)
        : line >= rail.top
          ? 1
          : 0
    base.style.setProperty(
      '--_progress',
      String(Math.round(progress * 1000) / 1000),
    )
    const dot = marker.getBoundingClientRect()
    // On the marker, whose attributes no render rewrites.
    marker.toggleAttribute('data-reached', dot.top + dot.height / 2 <= line)
  }

  /**
   * Clears what `syncScrollProgress` wrote, when the timeline stops tracking the scroll.
   * @internal
   */
  public clearScrollProgress(): void {
    const base = this.renderRoot.querySelector<HTMLElement>('[part~="base"]')
    base?.style.removeProperty('--_progress')
    this.renderRoot
      .querySelector('[part~="marker"]')
      ?.removeAttribute('data-reached')
  }

  private readonly handleSlotChange = (): void => {
    this.requestUpdate()
  }

  private renderStatusWord() {
    const status = this.status as TimelineItemStatus | ''
    if (!status) return nothing
    const word = this.statusLabel ?? STATUS_WORDS[status]
    return word ? html`<span class="sr-only">, ${word}</span>` : nothing
  }

  protected override render() {
    const level = this.headingLevel
    const classes = [
      'base',
      this.density === 'compact' ? 'compact' : 'comfortable',
      this.progress,
      this.isFirst ? 'first' : '',
      this.isLast ? 'last' : '',
      this.status ? 'has-status' : '',
      this.hasMarker ? 'has-marker' : '',
      this.hasContent ? '' : 'empty',
    ]
      .filter(Boolean)
      .join(' ')
    return html`
      <div part="base" class=${classes}>
        <span class="rail" aria-hidden="true">
          <span part="rail" class="track">
            <span part="progress" class="fill"></span>
          </span>
        </span>
        <div part="aside" class="aside">
          <span part="marker" class="marker" aria-hidden="true">
            <slot name="marker" @slotchange=${this.handleSlotChange}>
              ${this.status === 'complete' && this.density !== 'compact' ? check : html`<span class="dot"></span>`}
            </slot>
          </span>
          <div part="heading" class="heading">
            <div
              class="title"
              role=${level > 0 ? 'heading' : nothing}
              aria-level=${level > 0 ? String(level) : nothing}
            >
              <slot name="heading">${this.heading}</slot>${this.renderStatusWord()}
            </div>
            <div class="meta"><slot name="meta">${this.meta}</slot></div>
          </div>
        </div>
        <div part="content" class="content">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
      </div>
    `
  }
}

defineElement('moul-timeline-item', MoulTimelineItem)

declare global {
  interface HTMLElementTagNameMap {
    'moul-timeline-item': MoulTimelineItem
  }
}
