import { html, LitElement, nothing } from 'lit'
import { defineElement } from '../../utils/define-element'
import { navigationMenuLinkStyles } from './NavigationMenu.styles'

/**
 * A link card for a `moul-navigation-menu-item` panel: an optional icon, a
 * label and a line of description, as in a mega menu's product list. Give it
 * an `href`, a `label` and a `description` (or put rich description content
 * in it as children), and an icon in `slot="icon"`. Every card in a panel is
 * the same width, `--navigation-menu-link-width`, so cards line up in the
 * item's columns. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: a native link, in the tab order like any
 * other. It is named by its label and described by its description
 * (`aria-labelledby` and `aria-describedby`), so a screen reader reads the
 * label as the link text and the description after it. `is-current` sets
 * `aria-current="page"`. The icon is decoration; give an `<svg>` in it
 * `aria-hidden="true"`.
 *
 * Reduced motion: hover and focus colours change at once instead of fading.
 *
 * @slot - Rich description content, shown after the `description` text.
 * @slot label - Rich label content, in place of the `label` text.
 * @slot icon - An icon shown in a tinted square before the text.
 *
 * @csspart base - The link.
 * @csspart icon - The tinted square that holds the icon.
 * @csspart label - The label.
 * @csspart description - The description.
 *
 * @cssprop --navigation-menu-link-width - The width of the card. Defaults to `16rem`.
 */
export class MoulNavigationMenuLink extends LitElement {
  static override styles = navigationMenuLinkStyles

  static override properties = {
    href: { type: String, reflect: true },
    target: { type: String, reflect: true },
    label: { type: String, reflect: true },
    description: { type: String, reflect: true },
    isCurrent: { type: Boolean, reflect: true, attribute: 'is-current' },
    hasIcon: { state: true },
  }

  declare href: string
  /** Where to open the link, as on `<a target>`; `_blank` adds `rel="noopener noreferrer"`. */
  declare target: string
  declare label: string
  declare description: string
  /** Marks the link as the current page with `aria-current="page"`. */
  declare isCurrent: boolean
  private declare hasIcon: boolean

  constructor() {
    super()
    this.href = ''
    this.target = ''
    this.label = ''
    this.description = ''
    this.isCurrent = false
    this.hasIcon = false
  }

  public get linkEl(): HTMLAnchorElement | null {
    return this.renderRoot?.querySelector('a') ?? null
  }

  public override focus(options?: FocusOptions): void {
    this.linkEl?.focus(options)
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.hasIcon = [...this.children].some(
      (child) => child.getAttribute('slot') === 'icon',
    )
  }

  private readonly handleIconSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement
    this.hasIcon = slot.assignedNodes({ flatten: true }).length > 0
  }

  protected override render() {
    const isBlank = this.target === '_blank'
    return html`<a
      part="base"
      href=${this.href || nothing}
      target=${this.target || nothing}
      rel=${isBlank ? 'noopener noreferrer' : nothing}
      aria-current=${this.isCurrent ? 'page' : nothing}
      aria-labelledby="label"
      aria-describedby="description"
      ?data-has-icon=${this.hasIcon}
    >
      <span part="icon"
        ><slot name="icon" @slotchange=${this.handleIconSlotChange}></slot
      ></span>
      <span class="text">
        <span part="label" id="label"
          ><slot name="label">${this.label}</slot></span
        >
        <span part="description" id="description"
          >${this.description}<slot></slot
        ></span>
      </span>
    </a>`
  }
}

defineElement('moul-navigation-menu-link', MoulNavigationMenuLink)

declare global {
  interface HTMLElementTagNameMap {
    'moul-navigation-menu-link': MoulNavigationMenuLink
  }
}
