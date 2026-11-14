import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { focusGroupStyles } from './FocusGroup.styles'

/** What keeps one item sharp: the mouse or pen over it, or keyboard focus inside it. */
type FocusGroupActive = 'pointer' | 'focus'

/**
 * A grid of items, such as image tiles or cards, where the one under the
 * pointer, or the one keyboard focus is in, stays sharp while every other
 * item blurs, dims and shrinks a little. Its direct children are the items.
 * With no item active, including while the pointer is over the gap between
 * items, they are all sharp. It lays them out as a responsive grid of
 * columns at least `--focus-group-min-width` wide; set your own `display` to
 * lay them out another way. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role; the items
 * keep their own semantics and tab order. Moving keyboard focus into an item
 * (`:focus-visible`) makes it the sharp one, as hovering does. The blur is
 * visual only, so screen readers read every item as usual; blurred text is
 * hard to read, so it suits image-led tiles. A finger does not blur
 * anything, and neither does focus from a mouse click.
 *
 * Reduced motion: the other items blur and dim at once, with no transition,
 * and do not shrink.
 *
 * @slot - The items. Each direct child is one item.
 *
 * @cssprop --focus-group-min-width - The narrowest a column gets before the grid drops one. Defaults to `14rem`.
 * @cssprop --focus-group-gap - Space between the items. Defaults to `var(--spacing-4)`.
 * @cssprop --focus-group-blur - How much the other items blur. Defaults to `4px`.
 * @cssprop --focus-group-dim - The opacity of the other items. Defaults to `0.6`.
 * @cssprop --focus-group-scale - The scale of the other items. Defaults to `0.98`.
 * @cssprop --focus-group-duration - How long the change takes. Defaults to `var(--duration-slow)`, 400ms.
 */
export class MoulFocusGroup extends LitElement {
  static override styles = focusGroupStyles

  /** The item under a mouse or pen, if any. */
  private pointerItem: Element | null = null
  /** The item holding keyboard focus, if any. */
  private focusItem: Element | null = null

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('pointerover', this.handlePointerOver)
    this.addEventListener('pointerleave', this.handlePointerLeave)
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('focusout', this.handleFocusOut)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('pointerover', this.handlePointerOver)
    this.removeEventListener('pointerleave', this.handlePointerLeave)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.removeEventListener('focusout', this.handleFocusOut)
    this.pointerItem = null
    this.focusItem = null
    this.setActive(null)
  }

  /** The direct child an event happened in, or null for the gaps and the group itself. */
  private itemOf(event: Event): Element | null {
    for (const node of event.composedPath()) {
      if (node === this) return null
      if (node instanceof Element && node.parentElement === this) return node
    }
    return null
  }

  private readonly handlePointerOver = (event: PointerEvent): void => {
    // A finger has no hover; blurring under it would only flash while scrolling.
    if (event.pointerType === 'touch') return
    this.pointerItem = this.itemOf(event)
    if (this.pointerItem) this.setActive('pointer')
    else this.setActive(this.focusItem ? 'focus' : null)
  }

  private readonly handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return
    this.pointerItem = null
    this.setActive(this.focusItem ? 'focus' : null)
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const item = this.itemOf(event)
    // The element that really has focus, inside an item's shadow root if need be.
    if (!item || !isKeyboardFocus(event.composedPath()[0] ?? null)) return
    this.focusItem = item
    this.setActive('focus')
  }

  private readonly handleFocusOut = (): void => {
    // A move to another item fires focusin right after, which sets it again.
    this.focusItem = null
    this.setActive(this.pointerItem ? 'pointer' : null)
  }

  /** Forgets items that left the group, so none stays blurred behind a removed one. */
  private readonly handleSlotChange = (): void => {
    if (this.pointerItem?.parentElement !== this) this.pointerItem = null
    if (this.focusItem?.parentElement !== this) this.focusItem = null
    this.setActive(
      this.pointerItem ? 'pointer' : this.focusItem ? 'focus' : null,
    )
  }

  /**
   * Which state keeps an item sharp, as `data-active` on the host; the
   * stylesheet blurs every item that is not `:hover` (pointer) or
   * `:focus-within` (focus). The items themselves are never touched.
   */
  private setActive(active: FocusGroupActive | null): void {
    if (active) this.setAttribute('data-active', active)
    else this.removeAttribute('data-active')
  }

  protected override render() {
    return html`<slot @slotchange=${this.handleSlotChange}></slot>`
  }
}

/** Whether focus came from the keyboard, so a mouse click does not leave the group blurred. */
function isKeyboardFocus(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  try {
    return target.matches(':focus-visible')
  } catch {
    // No `:focus-visible` support: count all focus.
    return true
  }
}

defineElement('moul-focus-group', MoulFocusGroup)

declare global {
  interface HTMLElementTagNameMap {
    'moul-focus-group': MoulFocusGroup
  }
}
