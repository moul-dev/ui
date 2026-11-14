import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { chevronDown } from '../../utils/icons'
import { navigationMenuItemStyles } from './NavigationMenu.styles'

/**
 * One entry in a `moul-navigation-menu`: a trigger that opens a panel of
 * links, or, with `href`, a plain link with no panel. Put the panel content
 * in it as children, such as `moul-navigation-menu-link` cards or any markup;
 * `columns` lays the children out in that many columns. The menu opens and
 * closes it and sets its orientation; on its own it renders the trigger and a
 * closed panel. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: the host is a `listitem` in the menu's list.
 * A panel item renders a native `<button>` with `aria-expanded` and
 * `aria-controls` pointing at its panel; an `href` item renders a native
 * link. `is-current` sets `aria-current="page"` on either. A closed panel is
 * `display: none` (horizontal) or `visibility: hidden` (vertical), so its
 * links are out of the tab order and the accessibility tree. The arrow keys,
 * `Escape` and focus moves are handled by the parent menu.
 *
 * Reduced motion: the chevron flips without turning, and in a vertical menu
 * the panel opens and closes without its height animation.
 *
 * @slot - The panel content: links, link cards or any markup. Ignored when `href` is set.
 * @slot label - Rich content for the trigger, in place of the `label` text.
 *
 * @csspart trigger - The button that opens the panel.
 * @csspart link - The link an `href` item renders instead of a trigger.
 * @csspart chevron - The chevron after the trigger label.
 * @csspart panel - The panel: floating under the menu when horizontal, inline under the trigger when vertical.
 * @csspart content - The grid inside the panel that holds the slotted children.
 */
export class MoulNavigationMenuItem extends LitElement {
  static override styles = navigationMenuItemStyles

  static override properties = {
    label: { type: String, reflect: true },
    href: { type: String, reflect: true },
    value: { type: String, reflect: true },
    columns: { type: Number, reflect: true },
    isCurrent: { type: Boolean, reflect: true, attribute: 'is-current' },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
  }

  /** The trigger text, and the value when `value` is empty. */
  declare label: string
  /** Makes the item a plain link to this URL, with no panel. */
  declare href: string
  /** The value the menu reports while this item is open. Defaults to the label. */
  declare value: string
  /** Columns for the panel's children. Defaults to 1; a vertical menu always uses one. */
  declare columns: number
  /** Marks the item as the current page with `aria-current="page"`. */
  declare isCurrent: boolean
  /** Whether the panel is open. Set by the menu; set the menu's `value` to open an item. */
  declare isOpen: boolean

  constructor() {
    super()
    this.label = ''
    this.href = ''
    this.value = ''
    this.columns = 1
    this.isCurrent = false
    this.isOpen = false
  }

  /** The value the menu uses for this item: `value`, else the label. */
  public get itemValue(): string {
    return this.value || this.label
  }

  /** Whether the item has a panel (it has no `href`). */
  public get hasPanel(): boolean {
    return !this.href
  }

  /** The trigger button, or the link of an `href` item. */
  public get triggerEl(): HTMLElement | null {
    return (
      this.renderRoot?.querySelector<HTMLElement>(
        '[part~="trigger"], [part~="link"]',
      ) ?? null
    )
  }

  public get panelEl(): HTMLElement | null {
    return (
      this.renderRoot?.querySelector<HTMLElement>('[part~="panel"]') ?? null
    )
  }

  /** Moves focus to the trigger (or the link of an `href` item). */
  public focusTrigger(options?: FocusOptions): void {
    this.triggerEl?.focus(options)
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasAttribute('role')) this.setAttribute('role', 'listitem')
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('href') && this.href && this.isOpen) this.isOpen = false
  }

  protected override render() {
    const current = this.isCurrent ? 'page' : nothing
    const label = html`<slot name="label">${this.label}</slot>`
    if (this.href) {
      return html`<a part="link" href=${this.href} aria-current=${current}
        >${label}</a
      >`
    }
    const columns =
      Number.isFinite(this.columns) && this.columns >= 1
        ? Math.floor(this.columns)
        : 1
    return html`
      <button
        part="trigger"
        type="button"
        aria-expanded=${this.isOpen ? 'true' : 'false'}
        aria-controls="panel"
        aria-current=${current}
      >
        ${label}<span part="chevron">${chevronDown()}</span>
      </button>
      <div
        part="panel"
        id="panel"
        ?data-open=${this.isOpen}
        style="--_nm-columns: ${columns}"
      >
        <div class="clip"><div part="content"><slot></slot></div></div>
      </div>
    `
  }
}

defineElement('moul-navigation-menu-item', MoulNavigationMenuItem)

declare global {
  interface HTMLElementTagNameMap {
    'moul-navigation-menu-item': MoulNavigationMenuItem
  }
}
