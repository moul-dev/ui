import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import {
  findScrollRoot,
  scrollPortHeight,
  scrollPortTop,
} from '../../utils/scroll-root'
import { stickyScrollStyles } from './StickyScroll.styles'
import type { MoulStickyScrollItem } from './StickyScrollItem'
import './StickyScrollItem'

export interface StickyScrollStepChangeDetail {
  /** The index of the step now active, among the `moul-sticky-scroll-item` children. */
  current: number
  /** The index of the step that was active before. */
  previous: number
  /** The step now active. */
  item: MoulStickyScrollItem
}

const COUNT_PROPERTY = '--_sticky-scroll-count'
const TINT_PROPERTY = '--_sticky-scroll-tint'

/**
 * The reading line, two fifths of the way down the visible area: the last
 * step whose text has reached it is the one being read. A little above the
 * middle, so the first step is the active one while the walk-through starts
 * near the top.
 */
const READING_LINE = 0.4

/**
 * The part of the visible area above the reading line. Watching a band
 * rather than the line itself means a jump (an anchor link, End, a restored
 * scroll position) that carries a step past the line in one frame still
 * reports a change, which a zero-height line would miss.
 */
const READING_BAND = '0px 0px -60% 0px'

const isItem = (el: Element): el is MoulStickyScrollItem =>
  el.localName === 'moul-sticky-scroll-item'

/**
 * A walk-through in steps: the text of each step scrolls by in one column
 * while a panel in the other stays pinned and shows the picture, video or
 * mock-up of the step being read, fading from one to the next, as on a
 * product page that explains a feature in four steps. Fill it with
 * `moul-sticky-scroll-item` elements, each with its text and a child in its
 * `media` slot. The last step whose text has reached the reading line, two
 * fifths of the way down the visible area, is the active one (also after a
 * jump such as an anchor link): its text is at full strength, the others
 * are dimmed, and it fires `stepchange`. The media stays in each item, where you put it: the
 * items lay their text and media straight into this element's two-column grid
 * (`display: contents`), every media panel shares the second column and
 * sticks within it, and only the active one is shown. When the element is
 * under 600 pixels wide the grid becomes one column, each media panel sits
 * above its text, and nothing is pinned or dimmed. Give an item `--sticky-scroll-tint` and the
 * background turns to that colour while the step is active. Leave some room
 * after the last step with `--sticky-scroll-end-space`, or it cannot reach
 * the reading line; the panel stays pinned through that room. It lives
 * in the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. Each step's
 * text and media are read together, in order, inactive media included, and
 * focus inside a step (in its text or its media) makes it active, so the
 * panel always shows the step the keyboard is in.
 *
 * Reduced motion: the panel swaps media at once and the text brightens and
 * dims without fading, and the background changes colour without a
 * transition.
 *
 * @slot - The `moul-sticky-scroll-item` steps.
 *
 * @csspart grid - The two-column grid the steps lay their text and media into.
 *
 * @cssprop --sticky-scroll-media-width - Width of the media column, as a grid track. Defaults to `1fr`.
 * @cssprop --sticky-scroll-media-height - Height of the media panel. Defaults to `18rem`.
 * @cssprop --sticky-scroll-top - Where the panel pins, from the top of the scrolling box. Defaults to centring it.
 * @cssprop --sticky-scroll-gap - Space between the columns. Defaults to `var(--spacing-8)`.
 * @cssprop --sticky-scroll-spacing - Space above and below each step's text. Defaults to `var(--spacing-8)`.
 * @cssprop --sticky-scroll-end-space - Room after the last step, so it can reach the reading line while the panel stays pinned. Defaults to `0px`.
 * @cssprop --sticky-scroll-dim - Opacity of the text of inactive steps; `1` turns dimming off. Defaults to `0.45`.
 * @cssprop --sticky-scroll-tint - Set on an item: the background while that step is active.
 *
 * @fires stepchange - When the reader scrolls or tabs to another step; `detail` is `{ current, previous, item }`, the indexes of the new and old steps and the new step's element.
 */
export class MoulStickyScroll extends LitElement {
  static override styles = stickyScrollStyles

  private items: MoulStickyScrollItem[] = []
  private boxes = new Map<Element, number>()
  private observer: IntersectionObserver | null = null
  private scrollRoot: Element | null = null
  private active = -1
  private observeToken = 0

  /** The index of the active step, or -1 while there are none. */
  get activeIndex(): number {
    return this.active
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('focusin', this.handleFocusIn)
    if (this.hasUpdated) void this.syncItems()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('focusin', this.handleFocusIn)
    this.observer?.disconnect()
    this.observer = null
    this.boxes.clear()
    this.observeToken++
  }

  protected override firstUpdated(): void {
    // Some engines fire no slotchange for children present at first render.
    void this.syncItems()
  }

  private readonly handleSlotChange = (): void => {
    void this.syncItems()
  }

  private async syncItems(): Promise<void> {
    const token = ++this.observeToken
    this.items = [...this.children].filter(isItem)
    this.style.setProperty(
      COUNT_PROPERTY,
      String(Math.max(1, this.items.length)),
    )
    if (this.active >= this.items.length) this.active = -1
    // Every item's text box must exist before it can be observed.
    await Promise.all(this.items.map((item) => item.updateComplete))
    if (token !== this.observeToken || !this.isConnected) return
    this.observe()
    const keep = this.active >= 0 ? this.active : 0
    this.active = -1
    if (this.items.length > 0) this.activate(keep, false)
  }

  private observe(): void {
    this.observer?.disconnect()
    this.observer = null
    this.boxes.clear()
    if (typeof IntersectionObserver !== 'function') return
    this.scrollRoot = findScrollRoot(this)
    this.observer = new IntersectionObserver(this.handleEntries, {
      root: this.scrollRoot,
      rootMargin: READING_BAND,
      threshold: 0,
    })
    this.items.forEach((item, index) => {
      const box = item.stepBox
      if (!box) return
      this.boxes.set(box, index)
      this.observer?.observe(box)
    })
    // The whole walk-through too: a jump that lands past every step, in the
    // room after the last one, changes no step's state but does change this.
    this.observer.observe(this)
  }

  /**
   * Any change in the band means the steps moved past the reading line, so
   * the active step is worked out again from where they are: the last one
   * whose text has reached the line. This reads one box per step, and only
   * when a step or the walk-through crosses the band's edge, never per frame.
   */
  private readonly handleEntries = (): void => {
    const root = this.scrollRoot
    const line = scrollPortTop(root) + scrollPortHeight(root) * READING_LINE
    let index = 0
    this.items.forEach((item, i) => {
      const box = item.stepBox
      if (box && box.getBoundingClientRect().top <= line) index = i
    })
    if (this.items.length > 0) this.activate(index, true)
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    for (const node of event.composedPath()) {
      if (node === this) return
      if (
        node instanceof Element &&
        isItem(node) &&
        node.parentElement === this
      ) {
        const index = this.items.indexOf(node)
        if (index >= 0) this.activate(index, true)
        return
      }
    }
  }

  private activate(index: number, notify: boolean): void {
    if (index === this.active || !this.items[index]) return
    const previous = this.active
    this.active = index
    this.items.forEach((item, i) => {
      item.isActive = i === index
    })
    this.syncTint(this.items[index])
    if (!notify) return
    this.dispatchEvent(
      new CustomEvent<StickyScrollStepChangeDetail>('stepchange', {
        detail: { current: index, previous, item: this.items[index] },
        bubbles: true,
        composed: true,
      }),
    )
  }

  /** Takes the background from the active step's `--sticky-scroll-tint`, read once per change. */
  private syncTint(item: MoulStickyScrollItem): void {
    const tint =
      typeof getComputedStyle === 'function'
        ? getComputedStyle(item).getPropertyValue('--sticky-scroll-tint').trim()
        : ''
    if (tint) this.style.setProperty(TINT_PROPERTY, tint)
    else this.style.removeProperty(TINT_PROPERTY)
  }

  protected override render() {
    return html`<div part="grid" class="grid">
      <slot @slotchange=${this.handleSlotChange}></slot>
    </div>`
  }
}

defineElement('moul-sticky-scroll', MoulStickyScroll)

declare global {
  interface HTMLElementTagNameMap {
    'moul-sticky-scroll': MoulStickyScroll
  }
}
