import { html, LitElement, type PropertyValues } from 'lit'
import { keyed } from 'lit/directives/keyed.js'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { marqueeStyles } from './Marquee.styles'

/** Which way the content moves: `start` toward the inline start (leftward in left-to-right text), `up` and `down` in a column. */
export type MarqueeDirection = 'start' | 'end' | 'up' | 'down'

const DIRECTIONS: readonly MarqueeDirection[] = ['start', 'end', 'up', 'down']

const DEFAULT_SPEED = 40

/** A guard against very short content in a very long marquee. */
const MAX_COPIES = 50

/** Marks the light-DOM copies the element makes, so it can find and ignore them. */
const COPY_ATTRIBUTE = 'data-marquee-copy'

/**
 * An endless row of logos, cards or short text that moves at a steady speed,
 * as in a "trusted by" strip or a wall of testimonials. Put the items in it
 * as child elements; it repeats them to fill its length and loops them
 * without a seam. It is as wide as its container. `direction` sets the way
 * they move (`up` and `down` make a column, which takes its height from the
 * page, never from its content, so give it one), `speed` how fast in pixels
 * per second, and `fade-edges` fades both ends. The copies are light-DOM
 * siblings of your items, so your page's CSS styles them too; the element
 * rebuilds them when the items change. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. Screen
 * readers read the items once, in order; the copies are `aria-hidden` and
 * `inert`, so links in them never take focus. Any focus inside pauses the
 * movement. Keyboard focus also returns the row to its start and lets it
 * scroll, so the focused item is always in view; the movement starts again
 * when focus leaves.
 *
 * Reduced motion: nothing moves and no copies are made. The row scrolls by
 * hand instead, so every item stays reachable, and the edges do not fade.
 *
 * @slot - The items, each one an element. Text outside an element is shown but not repeated.
 *
 * @csspart track - The strip that holds the groups; it scrolls under reduced motion.
 * @csspart group - One set of the items: your items, or one set of copies. Every group moves.
 *
 * @cssprop --marquee-gap - Space between the items, and between one group and the next. Defaults to `var(--spacing-8)`.
 */
export class MoulMarquee extends LitElement {
  static override styles = marqueeStyles

  static override properties = {
    direction: { type: String, reflect: true },
    speed: { type: Number },
    pauseOnHover: {
      type: Boolean,
      reflect: true,
      attribute: 'pause-on-hover',
    },
    fadeEdges: { type: Boolean, reflect: true, attribute: 'fade-edges' },
    isPaused: { type: Boolean, reflect: true, attribute: 'is-paused' },
    copyCount: { state: true },
    isBrowsing: { state: true },
  }

  /** Which way the content moves. `start` and `end` swap sides in right-to-left text. Defaults to `start`. */
  declare direction: MarqueeDirection
  /** Pixels per second. Defaults to 40. */
  declare speed: number
  /** Pause while the pointer is over the marquee. */
  declare pauseOnHover: boolean
  /** Fade the content out at both ends. */
  declare fadeEdges: boolean
  /** Hold the content still. */
  declare isPaused: boolean
  /** Sets of copies in the light DOM, each shown as one more group. */
  private declare copyCount: number
  /** Keyboard focus is inside: the row stops at its start and scrolls instead. */
  private declare isBrowsing: boolean

  private readonly inView: InViewController
  private mutationObserver: MutationObserver | null = null
  private resizeObserver: ResizeObserver | null = null
  private stopWatchingMotion: (() => void) | null = null
  private isSyncQueued = false
  /** The items the current copies were made from. */
  private copiedFrom: Element[] = []
  /** The host's length along the direction of travel, in pixels. */
  private hostLength = 0
  /** The length of one group along the direction of travel, in pixels. */
  private groupLength = 0
  private gap = 0

  constructor() {
    super()
    this.direction = 'start'
    this.speed = DEFAULT_SPEED
    this.pauseOnHover = false
    this.fadeEdges = false
    this.isPaused = false
    this.copyCount = 0
    this.isBrowsing = false
    // Pausing goes through `animation-play-state` in the stylesheet, so hover,
    // focus, `is-paused` and leaving the screen never fight over the API.
    this.inView = new InViewController(this, { pauseOffscreen: false })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('focusout', this.handleFocusOut)
    if (typeof MutationObserver === 'function') {
      this.mutationObserver = new MutationObserver(this.handleMutations)
      this.mutationObserver.observe(this, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      })
    }
    this.stopWatchingMotion = watchReducedMotion(() => this.scheduleSync())
    // Copies made now are part of the first render. Items the parser adds
    // later reach the mutation observer.
    this.syncCopies()
    // On a reconnect the shadow tree is already there; the first connect waits for firstUpdated.
    if (this.hasUpdated) this.observeSizes()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('focusin', this.handleFocusIn)
    this.removeEventListener('focusout', this.handleFocusOut)
    this.mutationObserver?.disconnect()
    this.mutationObserver = null
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.removeCopies()
    this.copiedFrom = []
    this.copyCount = 0
    this.isBrowsing = false
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('direction') && !DIRECTIONS.includes(this.direction)) {
      this.direction = 'start'
    }
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed)
    this.observeSizes()
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    // The groups were made afresh (see render), so watch the new first group.
    if (
      changed.has('copyCount') &&
      changed.get('copyCount') !== undefined &&
      this.resizeObserver
    ) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
      this.observeSizes()
    }
    if (changed.has('direction') && changed.get('direction') !== undefined) {
      this.measure()
    } else if (changed.has('speed')) {
      this.writeDuration()
    }
  }

  private get track(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('.track') ?? null
  }

  private get isVertical(): boolean {
    return this.direction === 'up' || this.direction === 'down'
  }

  private observeSizes(): void {
    if (this.resizeObserver || typeof ResizeObserver !== 'function') return
    const group = this.renderRoot.querySelector('.group')
    this.resizeObserver = new ResizeObserver(() => this.measure())
    this.resizeObserver.observe(this)
    if (group) this.resizeObserver.observe(group)
  }

  /** Reads the host and group lengths, then sets the duration and, if it changed, the number of copies. */
  private measure(): void {
    const group = this.renderRoot?.querySelector('.group')
    const track = this.track
    if (!group || !track) return
    const host = this.getBoundingClientRect()
    const box = group.getBoundingClientRect()
    const vertical = this.isVertical
    this.hostLength = vertical ? host.height : host.width
    this.groupLength = vertical ? box.height : box.width
    const style = getComputedStyle(track)
    const gap = vertical ? style.rowGap : style.columnGap
    this.gap = gap?.endsWith('px') ? Number.parseFloat(gap) || 0 : 0
    this.writeDuration()
    if (this.copiesNeeded() !== this.copyCount) this.scheduleSync()
  }

  /** One loop moves one group and one gap, so it takes that distance over the speed. */
  private writeDuration(): void {
    const track = this.track
    if (!track) return
    if (this.groupLength <= 0) {
      track.style.removeProperty('--_marquee-duration')
      return
    }
    const speed =
      Number.isFinite(this.speed) && this.speed > 0 ? this.speed : DEFAULT_SPEED
    const ms = ((this.groupLength + this.gap) / speed) * 1000
    track.style.setProperty('--_marquee-duration', `${Math.round(ms)}ms`)
  }

  /** Enough sets of copies to cover the host's length once more, so the loop never shows a gap. */
  private copiesNeeded(): number {
    if (prefersReducedMotion()) return 0
    const step = this.groupLength + this.gap
    if (step <= 0 || this.hostLength <= 0) return 1
    return Math.min(MAX_COPIES, Math.max(1, Math.ceil(this.hostLength / step)))
  }

  private originals(): Element[] {
    return [...this.children].filter(
      (child) =>
        !child.hasAttribute(COPY_ATTRIBUTE) && !child.hasAttribute('slot'),
    )
  }

  private removeCopies(): void {
    for (const copy of [...this.children]) {
      if (copy.hasAttribute(COPY_ATTRIBUTE)) copy.remove()
    }
  }

  /** Throws away the copies and makes them again from the current items. */
  private syncCopies(): void {
    this.isSyncQueued = false
    if (!this.isConnected) return
    this.removeCopies()
    const originals = this.originals()
    this.copiedFrom = originals
    const count = originals.length > 0 ? this.copiesNeeded() : 0
    if (count > 0) {
      const fragment = document.createDocumentFragment()
      for (let set = 1; set <= count; set++) {
        for (const original of originals) {
          fragment.append(makeCopy(original, set))
        }
      }
      this.append(fragment)
    }
    this.copyCount = count
  }

  private scheduleSync(): void {
    if (this.isSyncQueued) return
    this.isSyncQueued = true
    queueMicrotask(() => {
      if (this.isSyncQueued) this.syncCopies()
    })
  }

  /** Items added or removed; changes inside an item reach the mutation observer instead. */
  private readonly handleSlotChange = (): void => {
    const originals = this.originals()
    const isSame =
      originals.length === this.copiedFrom.length &&
      originals.every((item, index) => item === this.copiedFrom[index])
    if (!isSame) this.scheduleSync()
  }

  /** Rebuilds the copies when the items change, ignoring the copies' own changes and the host's attributes. */
  private readonly handleMutations = (records: MutationRecord[]): void => {
    const changed = records.some((record) => {
      // Detached nodes (a copy being made) and the copies themselves do not count.
      if (!this.contains(record.target) || isInsideCopy(record.target)) {
        return false
      }
      if (record.target === this) {
        if (record.type === 'attributes') return false
        const nodes = [...record.addedNodes, ...record.removedNodes]
        return nodes.some(
          (node) =>
            node instanceof Element && !node.hasAttribute(COPY_ATTRIBUTE),
        )
      }
      return true
    })
    if (changed) this.scheduleSync()
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const target = event.target
    if (!(target instanceof Element) || !isKeyboardFocus(target)) return
    this.isBrowsing = true
    void this.updateComplete.then(() => this.bringIntoView(target))
  }

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget
    if (next instanceof Node && this.contains(next)) return
    if (!this.isBrowsing) return
    const track = this.track
    if (track) {
      track.scrollLeft = 0
      track.scrollTop = 0
    }
    this.isBrowsing = false
  }

  /** Scrolls the track so a focused item sits inside it. */
  private bringIntoView(target: Element): void {
    const track = this.track
    if (!this.isBrowsing || !track || typeof track.scrollBy !== 'function') {
      return
    }
    const box = track.getBoundingClientRect()
    const item = target.getBoundingClientRect()
    const vertical = this.isVertical
    const start = vertical ? item.top - box.top : item.left - box.left
    const end = vertical ? item.bottom - box.bottom : item.right - box.right
    let delta = 0
    if (start < 0) delta = start
    else if (end > 0) delta = Math.min(start, end)
    if (delta !== 0) {
      track.scrollBy(vertical ? { top: delta } : { left: delta })
    }
  }

  protected override render() {
    const sets = Array.from({ length: this.copyCount }, (_, index) => index + 1)
    const trackClass = [
      'track',
      this.inView.isInView ? '' : 'is-offscreen',
      this.isBrowsing ? 'is-browsing' : '',
    ]
      .filter(Boolean)
      .join(' ')
    // Every group must start its animation at the same moment, or the loop
    // shows a seam. A change in the number of groups makes them all afresh,
    // so they start together (the row returns to its start).
    return html`<div part="track" class=${trackClass}>
      ${keyed(
        this.copyCount,
        html`<div part="group" class="group">
            <slot @slotchange=${this.handleSlotChange}></slot>
          </div>
          ${sets.map(
            (set) =>
              html`<div part="group" class="group copy">
                <slot name="copy-${set}"></slot>
              </div>`,
          )}`,
      )}
    </div>`
  }
}

/** A deep clone that is hidden from screen readers, cannot take focus, and has no ids to clash with the original's. */
function makeCopy(original: Element, set: number): Element {
  const copy = original.cloneNode(true) as Element
  copy.setAttribute(COPY_ATTRIBUTE, '')
  copy.removeAttribute('id')
  for (const node of copy.querySelectorAll('[id]')) node.removeAttribute('id')
  copy.setAttribute('slot', `copy-${set}`)
  copy.setAttribute('aria-hidden', 'true')
  copy.setAttribute('inert', '')
  return copy
}

function isInsideCopy(node: Node): boolean {
  const element = node instanceof Element ? node : node.parentElement
  return element?.closest(`[${COPY_ATTRIBUTE}]`) != null
}

/** Focus from the keyboard (or from a script after a key press), as the browser decides for `:focus-visible`. */
function isKeyboardFocus(target: Element): boolean {
  try {
    return target.matches(':focus-visible')
  } catch {
    // Without :focus-visible, err on the side of showing the focused item.
    return true
  }
}

defineElement('moul-marquee', MoulMarquee)

declare global {
  interface HTMLElementTagNameMap {
    'moul-marquee': MoulMarquee
  }
}
