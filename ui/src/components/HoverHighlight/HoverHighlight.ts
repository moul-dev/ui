import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { placeIndicator } from '../../utils/motion'
import { hoverHighlightStyles } from './HoverHighlight.styles'

/** What the highlight is on: the item under the pointer, the focused item, or the resting item. */
type HighlightSource = 'pointer' | 'focus' | 'rest'

/** Attribute the element sets on the item the highlight is on, so its text can change colour. */
const HIGHLIGHTED_ATTRIBUTE = 'data-highlighted'

/** An item counts as current when it, or something inside it, carries one of these. */
const CURRENT_SELECTOR =
  '[aria-current]:not([aria-current="false"]), [data-active]:not([data-active="false"]), [aria-selected="true"]'

/**
 * One highlight shape that slides from item to item as the pointer moves
 * across a list, a grid of cards or a row of links, instead of each item
 * lighting up on its own. Its direct children are the items, or the
 * descendants that match `item-selector`. The highlight sits behind the
 * items, takes the size and corner radius of the item it is on, and fades
 * out when the pointer leaves; with `is-persistent` it stays instead, on the
 * current item (one carrying `aria-current`, `data-active` or
 * `aria-selected="true"`) or else on the last one it was on. The item under
 * the highlight gets a `data-highlighted` attribute, so its text can change
 * colour. Opaque items hide it: give them a transparent background, or let
 * the highlight spill past them with a negative `--hover-highlight-inset`.
 * It lives in the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role; the items
 * keep their own semantics and tab order. Moving keyboard focus into an item
 * (`:focus-visible`) slides the highlight there, as hovering does, so it
 * doubles as a focus indicator; keep the items' own focus ring as well. The
 * highlight is decorative and hidden from assistive technology. A finger
 * moves nothing.
 *
 * Reduced motion: the highlight does not slide or resize. It appears on each
 * item at once and only fades in and out.
 *
 * @slot - The items: the direct children, unless `item-selector` picks others.
 *
 * @csspart highlight - The shape behind the hovered item. Style its fill with `--hover-highlight-background`.
 *
 * @cssprop --hover-highlight-background - The highlight's fill. Defaults to `var(--color-fill-hover)`.
 * @cssprop --hover-highlight-radius - The highlight's corner radius. Defaults to the item's own radius, or `var(--radius-lg)` for square items.
 * @cssprop --hover-highlight-inset - How far inside the item the highlight's edge sits; negative values spill past it. Defaults to `0px`.
 * @cssprop --hover-highlight-duration - How long a slide takes. Defaults to `var(--duration-base)`, 250ms.
 */
export class MoulHoverHighlight extends LitElement {
  static override styles = hoverHighlightStyles

  static override properties = {
    itemSelector: { type: String, attribute: 'item-selector' },
    isPersistent: { type: Boolean, reflect: true, attribute: 'is-persistent' },
  }

  /** CSS selector for the items, matched against descendants. Empty (the default) means the direct children. */
  declare itemSelector: string
  /** Keep the highlight on the current or last item when the pointer and focus leave. */
  declare isPersistent: boolean

  /** The item under a mouse or pen, if any. */
  private pointerItem: HTMLElement | null = null
  /** The item holding keyboard focus, if any. */
  private focusItem: HTMLElement | null = null
  /** The item the highlight was last on. */
  private lastItem: HTMLElement | null = null
  /** The item the highlight is on now, or null while it is hidden. */
  private shownItem: HTMLElement | null = null
  private resizeObserver: ResizeObserver | null = null
  private mutationObserver: MutationObserver | null = null

  constructor() {
    super()
    this.itemSelector = ''
    this.isPersistent = false
  }

  private get highlightEl(): HTMLElement | null {
    return (
      this.renderRoot?.querySelector<HTMLElement>('[part="highlight"]') ?? null
    )
  }

  /** The items, in document order. */
  public get items(): HTMLElement[] {
    if (this.itemSelector) {
      try {
        return [...this.querySelectorAll<HTMLElement>(this.itemSelector)]
      } catch {
        return []
      }
    }
    return [...this.children].filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    )
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('pointerover', this.handlePointerOver)
    this.addEventListener('pointerleave', this.handlePointerLeave)
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('focusout', this.handleFocusOut)
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(this.handleResize)
      this.resizeObserver.observe(this)
    }
    if (typeof MutationObserver === 'function') {
      this.mutationObserver = new MutationObserver(this.handleMutation)
      this.mutationObserver.observe(this, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['aria-current', 'data-active', 'aria-selected'],
      })
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('pointerover', this.handlePointerOver)
    this.removeEventListener('pointerleave', this.handlePointerLeave)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.removeEventListener('focusout', this.handleFocusOut)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.mutationObserver?.disconnect()
    this.mutationObserver = null
    this.markItem(null)
    this.pointerItem = null
    this.focusItem = null
    this.lastItem = null
    this.shownItem = null
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    // Also the first placement: the constructor's defaults count as changes.
    if (changed.has('itemSelector') || changed.has('isPersistent')) {
      this.forgetMissingItems()
      this.refresh(true)
    }
  }

  /** The item an event happened in, or null for the gaps and the element itself. */
  private itemOf(event: Event): HTMLElement | null {
    const items = this.items
    for (const node of event.composedPath()) {
      if (node === this) return null
      if (node instanceof HTMLElement && items.includes(node)) return node
    }
    return null
  }

  private readonly handlePointerOver = (event: PointerEvent): void => {
    // A finger has no hover; a highlight under it would only flash while scrolling.
    if (event.pointerType === 'touch') return
    const item = this.itemOf(event)
    // Over a gap between items the highlight waits where it is.
    if (!item) return
    this.pointerItem = item
    this.refresh()
  }

  private readonly handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return
    this.pointerItem = null
    this.refresh()
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const item = this.itemOf(event)
    if (!item || !isKeyboardFocus(event.composedPath()[0] ?? null)) return
    this.focusItem = item
    this.refresh()
  }

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null
    // A move to another item fires focusin right after, which sets it again.
    if (next && this.contains(next)) return
    this.focusItem = null
    this.refresh()
  }

  private readonly handleSlotChange = (): void => {
    this.forgetMissingItems()
    this.refresh(true)
  }

  private readonly handleResize = (): void => {
    this.refresh(true)
  }

  /** Items added or removed deep inside (for `item-selector`), or a current item that moved. */
  private readonly handleMutation = (records: MutationRecord[]): void => {
    if (records.some((record) => record.type === 'childList')) {
      this.forgetMissingItems()
      this.refresh(true)
    } else if (this.isPersistent && !this.pointerItem && !this.focusItem) {
      this.refresh()
    }
  }

  /** Forgets items that left the element, so the highlight never rests on a removed one. */
  private forgetMissingItems(): void {
    const items = this.items
    const keep = (item: HTMLElement | null) =>
      item && items.includes(item) ? item : null
    this.pointerItem = keep(this.pointerItem)
    this.focusItem = keep(this.focusItem)
    this.lastItem = keep(this.lastItem)
    if (this.shownItem && !items.includes(this.shownItem)) {
      this.shownItem.removeAttribute(HIGHLIGHTED_ATTRIBUTE)
      this.shownItem = null
    }
  }

  /** The item the highlight should rest on when nothing is hovered or focused. */
  private restingItem(): HTMLElement | null {
    if (!this.isPersistent) return null
    const items = this.items
    const current = items.find(
      (item) =>
        item.matches(CURRENT_SELECTOR) || item.querySelector(CURRENT_SELECTOR),
    )
    return current ?? this.lastItem
  }

  /** Which item the highlight belongs on, and why. */
  private target(): { item: HTMLElement; source: HighlightSource } | null {
    if (this.pointerItem) return { item: this.pointerItem, source: 'pointer' }
    if (this.focusItem) return { item: this.focusItem, source: 'focus' }
    const rest = this.restingItem()
    return rest ? { item: rest, source: 'rest' } : null
  }

  /**
   * Moves the highlight to its item, or hides it. `remeasure` places it again
   * even when the item has not changed, after a resize or new items.
   */
  private refresh(remeasure = false): void {
    const highlight = this.highlightEl
    if (!highlight) return
    const target = this.target()

    if (!target) {
      this.markItem(null)
      this.shownItem = null
      this.removeAttribute('data-highlight')
      // Hidden: the next item it appears on is placed without a slide.
      placeIndicator(highlight, this, null)
      return
    }

    const { item, source } = target
    if (item === this.shownItem && !remeasure) {
      this.setAttribute('data-highlight', source)
      return
    }
    this.lastItem = item
    this.shownItem = item
    this.markItem(item)
    highlight.style.setProperty(
      '--_hover-highlight-item-radius',
      itemRadius(item),
    )
    placeIndicator(highlight, this, item)
    this.setAttribute('data-highlight', source)
  }

  /** Moves the `data-highlighted` marker to `item`. */
  private markItem(item: HTMLElement | null): void {
    for (const each of this.items) {
      if (each !== item) each.removeAttribute(HIGHLIGHTED_ATTRIBUTE)
    }
    if (this.shownItem && this.shownItem !== item) {
      this.shownItem.removeAttribute(HIGHLIGHTED_ATTRIBUTE)
    }
    item?.setAttribute(HIGHLIGHTED_ATTRIBUTE, '')
  }

  protected override render() {
    return html`<span part="highlight" class="highlight" aria-hidden="true"></span
      ><slot @slotchange=${this.handleSlotChange}></slot>`
  }
}

/** The item's corner radius, or nothing for a square item, so the token default applies. */
function itemRadius(item: HTMLElement): string {
  if (typeof getComputedStyle !== 'function') return ''
  const radius = getComputedStyle(item).borderRadius
  if (!radius || /^0(px)?(\s+0(px)?)*$/.test(radius.trim())) return ''
  return radius
}

/** Whether focus came from the keyboard, so a mouse click does not leave a highlight behind. */
function isKeyboardFocus(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  try {
    return target.matches(':focus-visible')
  } catch {
    return true
  }
}

defineElement('moul-hover-highlight', MoulHoverHighlight)

declare global {
  interface HTMLElementTagNameMap {
    'moul-hover-highlight': MoulHoverHighlight
  }
}
