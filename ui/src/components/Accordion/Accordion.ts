import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { accordionStyles } from './Accordion.styles'
import type { MoulAccordionItem } from './AccordionItem'

export type AccordionVariant = 'default' | 'separated' | 'bordered'

/**
 * A vertical stack of `moul-accordion-item` sections whose panels open with
 * a spring and no layout jump, for FAQs, settings groups and long forms. By
 * default opening one item closes the others; `is-multiple` lets several stay
 * open. `variant` draws it as a divided list (default), separate raised
 * surfaces (`separated`), or one framed list (`bordered`).
 *
 * Keyboard and screen readers: it follows the WAI-ARIA accordion pattern.
 * Each header is a native button with `aria-expanded` and `aria-controls`
 * inside a `role="heading"` element whose `aria-level` comes from
 * `heading-level` (3 by default; match it to the surrounding headings).
 * `Tab` moves through the headers and into open panels; `Enter` or `Space`
 * toggles the focused item. When a header has focus, `Arrow Down` and
 * `Arrow Up` move to the next or previous enabled header, wrapping, and
 * `Home` and `End` to the first and last; arrow keys inside a panel are left
 * alone. Panels are `role="region"` named by their header, and a closed
 * panel's content is hidden from the tab order and from screen readers. The
 * accordion itself has no role.
 *
 * Reduced motion: each panel's height springs open or shut while its content
 * fades and the chevron turns; under reduced motion panels open and close at
 * once. See `moul-accordion-item`.
 *
 * @slot - The `moul-accordion-item` elements.
 * @fires valuechange - The user opened or closed an item; `detail.value` lists the open items' values. Not fired when `value` or `isOpen` is set from code.
 * @csspart base - The column that holds the items.
 */
export class MoulAccordion extends LitElement {
  static override styles = accordionStyles

  static override properties = {
    isMultiple: { type: Boolean, reflect: true, attribute: 'is-multiple' },
    headingLevel: { type: Number, reflect: true, attribute: 'heading-level' },
    variant: { type: String, reflect: true },
  }

  declare isMultiple: boolean
  declare headingLevel: number
  declare variant: AccordionVariant

  /** A `value` set before the items were there, applied once they arrive. */
  private pendingValue: string[] | null = null
  /** True while the accordion closes items itself, so their events add no `valuechange`. */
  private isSyncing = false

  constructor() {
    super()
    this.isMultiple = false
    this.headingLevel = 3
    this.variant = 'default'
  }

  /**
   * The `value` of every open item, in document order. Setting it opens
   * exactly the items it names (only the first of them unless `is-multiple`)
   * and closes the rest, without firing events.
   */
  public get value(): string[] {
    return this.items.filter((item) => item.isOpen).map((item) => item.value)
  }

  public set value(next: string[]) {
    const values = Array.isArray(next) ? [...next] : []
    if (this.items.length === 0) {
      this.pendingValue = values
      return
    }
    this.pendingValue = null
    let isFirst = true
    for (const item of this.items) {
      const isOpen = values.includes(item.value) && (this.isMultiple || isFirst)
      if (isOpen) isFirst = false
      item.isOpen = isOpen
    }
  }

  /** The items this accordion owns: its `moul-accordion-item` children. */
  public get items(): MoulAccordionItem[] {
    return Array.from(this.children).filter(
      (el): el is MoulAccordionItem => el.localName === 'moul-accordion-item',
    )
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('keydown', this.handleKeyDown)
    this.addEventListener('openchange', this.handleOpenChange)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.handleKeyDown)
    this.removeEventListener('openchange', this.handleOpenChange)
  }

  protected override firstUpdated(): void {
    // Items parsed before the first render; later changes arrive by slotchange.
    this.handleSlotChange()
  }

  protected override updated(changedProps: PropertyValues<this>): void {
    super.updated(changedProps)
    if (changedProps.has('headingLevel')) this.syncItems()
    if (changedProps.has('isMultiple') && !this.isMultiple) this.keepOneOpen()
  }

  /**
   * Called by an item that was opened, by the user or from code; closes the
   * others unless `is-multiple`.
   * @internal
   */
  public handleItemOpened(opened: MoulAccordionItem): void {
    if (this.isMultiple) return
    for (const item of this.items) {
      if (item !== opened && item.isOpen) item.isOpen = false
    }
  }

  private keepOneOpen(): void {
    const first = this.items.find((item) => item.isOpen)
    if (first) this.handleItemOpened(first)
  }

  private syncItems(): void {
    for (const item of this.items) item.headingLevel = this.headingLevel
  }

  private readonly handleSlotChange = (): void => {
    this.syncItems()
    if (this.pendingValue && this.items.length > 0) {
      this.value = this.pendingValue
    } else if (!this.isMultiple) {
      this.keepOneOpen()
    }
  }

  private readonly handleOpenChange = (e: Event): void => {
    const item = e.target as MoulAccordionItem
    if (this.isSyncing || !this.items.includes(item)) return
    if ((e as CustomEvent<{ isOpen: boolean }>).detail.isOpen) {
      if (!this.isMultiple) {
        // The user closed these by opening another, so they report it too.
        this.isSyncing = true
        for (const other of this.items) {
          if (other !== item) other.setOpen(false)
        }
        this.isSyncing = false
      }
    }
    this.dispatchEvent(
      new CustomEvent('valuechange', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    )
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
    const origin = e.composedPath()[0]
    const items = this.items
    const from = items.find((item) => item.triggerEl === origin)
    if (!from) return

    const enabled = items.filter((item) => !item.isDisabled)
    const index = enabled.indexOf(from)
    const last = enabled.length - 1
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? last
          : e.key === 'ArrowDown'
            ? index >= last
              ? 0
              : index + 1
            : index <= 0
              ? last
              : index - 1
    e.preventDefault()
    enabled[next]?.focus()
  }

  protected override render() {
    return html`
      <div part="base">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `
  }
}

defineElement('moul-accordion', MoulAccordion)

declare global {
  interface HTMLElementTagNameMap {
    'moul-accordion': MoulAccordion
  }
}
