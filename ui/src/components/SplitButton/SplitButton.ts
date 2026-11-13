import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { chevronDown } from '../../utils/icons'
import type { ButtonSize } from '../Button/Button'
import '../Button/Button'
import type {
  DropdownMenuPlacement,
  MoulDropdownMenu,
} from '../DropdownMenu/DropdownMenu'
import '../DropdownMenu/DropdownMenu'
import { splitButtonStyles } from './SplitButton.styles'

export type SplitButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'ghost'
  | 'danger'

const VARIANTS: string[] = [
  'primary',
  'secondary',
  'tertiary',
  'outline',
  'ghost',
  'danger',
]
const MENU_LABEL = 'More actions'

/**
 * A main action joined to a chevron that opens a menu of related actions,
 * such as "Deploy" with "Deploy to staging" and "Schedule deploy" behind the
 * chevron. Use it when one action is the usual choice and its variants are
 * rarer; use `<moul-dropdown-menu>` alone when no action stands out. The two
 * parts are `<moul-button>`s drawn as one pill with a divider between them,
 * and the menu is a `<moul-dropdown-menu>` aligned to the chevron's end and
 * at least as wide as the whole split button.
 *
 * Put the main action's label in the default slot, its icon in `prefix`, and
 * `<moul-menu-item>`, `<moul-menu-group>` and `<moul-menu-separator>` with
 * `slot="menu"`. Pressing the main part fires `press`; the chevron never does.
 * Activating a menu item fires `action`. `variant` takes `primary`,
 * `secondary`, `tertiary`, `outline`, `ghost` or `danger`; any other value,
 * `danger-soft` included, renders as `primary`. `is-pending` applies to the
 * main part only: it shows the button's pending loader and ignores presses
 * while the chevron and its menu stay usable, so the related actions remain
 * reachable. Set `is-disabled` to turn off both parts.
 *
 * Keyboard and screen readers: there are two Tab stops, the main button and
 * the chevron, each a native `<button>`. The main button is named by its
 * label; `Enter` or `Space` press it, and `Alt+Arrow Down` on it opens the
 * menu and focuses the first enabled item. The chevron is named by
 * `menu-label` (default "More actions", also the menu's name) and has
 * `aria-haspopup="menu"` and `aria-expanded`; a click toggles the menu,
 * `Enter`, `Space` and `Arrow Down` open it on the first item and
 * `Arrow Up` on the last. In the menu the keys of `<moul-dropdown-menu>`
 * apply (arrows, `Home`, `End`, type-ahead); `Escape` or activating an item
 * closes it and returns focus to the chevron. Screen readers hear two
 * separate buttons: the host has no role and nothing ties the chevron to the
 * main action except its name. While pending, the main button keeps focus
 * and reports `aria-busy="true"`.
 *
 * Reduced motion: the chevron turns over at once instead of rotating, and
 * the menu appears without growing out of the chevron or staggering its
 * items. Neither part scales down when pressed, with or without reduced
 * motion, so the pill never comes apart.
 *
 * @slot - The main action's label.
 * @slot prefix - An icon before the main action's label.
 * @slot menu - The menu's `<moul-menu-item>`, `<moul-menu-group>` and `<moul-menu-separator>` elements.
 * @fires press - When the main part is pressed (never the chevron); `detail.originalEvent` is the click.
 * @fires action - When a menu item is activated; `detail: { value, item }`.
 * @fires openchange - When the menu opens or closes; `detail.isOpen`.
 * @csspart main - The main action's `<moul-button>`.
 * @csspart trigger - The chevron's `<moul-button>`.
 * @csspart chevron - The chevron icon, which turns over while the menu is open.
 * @csspart menu - The menu surface (`role="menu"`), from `<moul-dropdown-menu>`.
 * @cssprop --split-button-divider - The colour of the 1px line between the parts. Defaults to the variant's foreground at 30% on filled variants, 15% on neutral ones, and `--color-border` on `outline`.
 */
export class MoulSplitButton extends LitElement {
  static override styles = splitButtonStyles

  static override properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isPending: { type: Boolean, reflect: true, attribute: 'is-pending' },
    menuLabel: { type: String, reflect: true, attribute: 'menu-label' },
    placement: { type: String, reflect: true },
  }

  declare variant: SplitButtonVariant
  declare size: ButtonSize
  declare isDisabled: boolean
  declare isPending: boolean
  declare menuLabel: string
  declare placement: DropdownMenuPlacement

  constructor() {
    super()
    this.variant = 'primary'
    this.size = 'md'
    this.isDisabled = false
    this.isPending = false
    this.menuLabel = MENU_LABEL
    this.placement = 'bottom-end'
  }

  private get menu(): MoulDropdownMenu | null {
    return this.renderRoot?.querySelector('moul-dropdown-menu') ?? null
  }

  /** Opens the menu and focuses its first enabled item; does nothing while disabled. */
  public async showMenu(): Promise<void> {
    await this.updateComplete
    await this.menu?.show()
  }

  /** Closes the menu, returning focus to the chevron if it was in the menu. */
  public async hideMenu(): Promise<void> {
    await this.updateComplete
    await this.menu?.hide()
  }

  private readonly handleMainKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'ArrowDown' || !event.altKey) return
    event.preventDefault()
    this.showMenu()
  }

  /** The chevron is a `moul-button` too: keep its composed `press` from passing for the main action's. */
  private readonly stopPress = (event: Event): void => event.stopPropagation()

  /** Runs before the menu places itself, so it is at least as wide as the whole split button. */
  private readonly handleOpenChange = (
    event: CustomEvent<{ isOpen: boolean }>,
  ): void => {
    if (!event.detail.isOpen) return
    const width = Math.round(this.getBoundingClientRect().width)
    this.menu?.style.setProperty(
      '--dropdown-menu-min-width',
      `max(10rem, ${width}px)`,
    )
  }

  protected override render() {
    const variant = VARIANTS.includes(this.variant) ? this.variant : 'primary'
    const label = this.menuLabel || MENU_LABEL
    return html`
      <moul-button
        part="main"
        class="main"
        variant=${variant}
        size=${this.size}
        ?is-disabled=${this.isDisabled}
        ?is-pending=${this.isPending}
        @keydown=${this.handleMainKeyDown}
      >
        <slot name="prefix" slot="prefix"></slot>
        <slot></slot>
      </moul-button>
      <moul-dropdown-menu
        class="dropdown"
        exportparts="menu"
        placement=${this.placement}
        label=${label}
        ?is-disabled=${this.isDisabled}
        @openchange=${this.handleOpenChange}
      >
        <moul-button
          slot="trigger"
          part="trigger"
          class="trigger"
          variant=${variant}
          size=${this.size}
          is-icon
          aria-label=${label}
          ?is-disabled=${this.isDisabled}
          @press=${this.stopPress}
        >
          <span part="chevron" class="chevron">${chevronDown()}</span>
          <span class="sr-only">${label}</span>
        </moul-button>
        <slot name="menu"></slot>
      </moul-dropdown-menu>
    `
  }
}

defineElement('moul-split-button', MoulSplitButton)

declare global {
  interface HTMLElementTagNameMap {
    'moul-split-button': MoulSplitButton
  }
}
