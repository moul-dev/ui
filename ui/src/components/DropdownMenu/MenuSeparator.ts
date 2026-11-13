import { LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { menuSeparatorStyles } from './DropdownMenu.styles'

/**
 * A thin rule between items or groups in a `<moul-dropdown-menu>`.
 *
 * Keyboard and screen readers: not focusable, and skipped by the arrow keys.
 * The host gets `role="separator"`, which screen readers may announce while
 * reading through the menu.
 *
 * Reduced motion: the separator never moves on its own; the menu's open and
 * close motion covers it.
 */
export class MoulMenuSeparator extends LitElement {
  static override styles = menuSeparatorStyles

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'separator')
  }
}

defineElement('moul-menu-separator', MoulMenuSeparator)

declare global {
  interface HTMLElementTagNameMap {
    'moul-menu-separator': MoulMenuSeparator
  }
}
