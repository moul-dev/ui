import { html, LitElement, nothing, type PropertyValues, svg } from 'lit'
import { defineElement } from '../../utils/define-element'
import { menuItemStyles } from './DropdownMenu.styles'

export type MenuItemType = 'item' | 'checkbox' | 'radio'
export type MenuItemVariant = 'default' | 'danger'

const ROLES: Record<MenuItemType, string> = {
  item: 'menuitem',
  checkbox: 'menuitemcheckbox',
  radio: 'menuitemradio',
}

/**
 * One action in a `<moul-dropdown-menu>`: a plain item, a checkbox item that
 * toggles `is-checked`, or a radio item that is exclusive within its nearest
 * `<moul-menu-group>` (or the whole menu when it has no group). With `href`
 * it is a link that navigates when activated, and `variant="danger"` marks a
 * destructive action. The menu fires `action` when an item is activated;
 * regular items then close the menu, checkbox and radio items keep it open.
 *
 * Keyboard and screen readers: the host gets `role="menuitem"`,
 * `menuitemcheckbox` or `menuitemradio` (with `aria-checked`) and
 * `tabindex="-1"`: the parent menu moves focus onto it with the arrow keys,
 * `Home`, `End` and type-ahead, and `Enter` or `Space` activate it. Its name
 * is its text, prefix and suffix included. A disabled item gets
 * `aria-disabled="true"` and stays focusable, as the WAI-ARIA menu pattern
 * asks, but cannot be activated. The `shortcut` hint is hidden from screen
 * readers; add `aria-keyshortcuts` yourself when the shortcut really works.
 * A link item renders an empty, hidden `<a>` over the row so middle-click and
 * "open in new tab" work; screen readers hear a menu item, not a link.
 *
 * Reduced motion: the background highlight and the check mark change at once
 * instead of fading.
 *
 * @slot - The item's label.
 * @slot prefix - An icon or other content before the label.
 * @slot suffix - Content after the label, such as a badge.
 * @csspart item - The row.
 * @csspart indicator - The check mark or dot of a checkbox or radio item.
 * @csspart label - The wrapper around the default slot.
 * @csspart shortcut - The keyboard hint from `shortcut`.
 * @csspart link - The `<a>` laid over a link item.
 */
export class MoulMenuItem extends LitElement {
  static override styles = menuItemStyles

  static override properties = {
    value: { type: String, reflect: true },
    type: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isChecked: { type: Boolean, reflect: true, attribute: 'is-checked' },
    href: { type: String, reflect: true },
    target: { type: String, reflect: true },
    shortcut: { type: String, reflect: true },
  }

  declare value: string
  declare type: MenuItemType
  declare variant: MenuItemVariant
  declare isDisabled: boolean
  declare isChecked: boolean
  declare href: string
  declare target: string
  declare shortcut: string

  constructor() {
    super()
    this.value = ''
    this.type = 'item'
    this.variant = 'default'
    this.isDisabled = false
    this.isChecked = false
    this.href = ''
    this.target = ''
    this.shortcut = ''
  }

  /** The label text (default slot only), used for type-ahead and as the fallback `value`. */
  public get label(): string {
    let text = ''
    for (const node of Array.from(this.childNodes)) {
      if (node instanceof Element && node.hasAttribute('slot')) continue
      text += node.textContent ?? ''
    }
    return text.replace(/\s+/g, ' ').trim()
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('tabindex', '-1')
  }

  /** Clicks the link of a link item, so a keyboard activation navigates like a pointer one. */
  public override click(): void {
    const link = this.renderRoot?.querySelector<HTMLAnchorElement>('a[href]')
    if (link) link.click()
    else super.click()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    const type = ROLES[this.type] ? this.type : 'item'
    this.setAttribute('role', ROLES[type])
    if (type === 'item') this.removeAttribute('aria-checked')
    else this.setAttribute('aria-checked', String(this.isChecked))
    if (this.isDisabled) this.setAttribute('aria-disabled', 'true')
    else this.removeAttribute('aria-disabled')
  }

  protected override render() {
    const hasIndicator = this.type === 'checkbox' || this.type === 'radio'
    return html`
      <div part="item">
        ${
          hasIndicator
            ? html`<span part="indicator" aria-hidden="true">
              ${
                this.type === 'radio'
                  ? svg`<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="3.5" fill="currentColor"></circle></svg>`
                  : svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
              }
            </span>`
            : nothing
        }
        <slot name="prefix"></slot>
        <span part="label"><slot></slot></span>
        <slot name="suffix"></slot>
        ${
          this.shortcut
            ? html`<kbd part="shortcut" aria-hidden="true">${this.shortcut}</kbd>`
            : nothing
        }
        ${
          this.href && !this.isDisabled
            ? html`<a
              part="link"
              href=${this.href}
              target=${this.target || nothing}
              tabindex="-1"
              aria-hidden="true"
            ></a>`
            : nothing
        }
      </div>
    `
  }
}

defineElement('moul-menu-item', MoulMenuItem)

declare global {
  interface HTMLElementTagNameMap {
    'moul-menu-item': MoulMenuItem
  }
}
