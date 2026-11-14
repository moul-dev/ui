import { LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { dockSeparatorStyles } from './Dock.styles'

/**
 * A thin line between groups of items in a `moul-dock`, such as pages on one
 * side and settings on the other. It moves aside with its neighbours when
 * they grow, and never grows itself. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable; `role="separator"`, with
 * `aria-orientation` set by the dock across its own direction (vertical in a
 * horizontal dock), so screen readers announce the groups.
 *
 * Reduced motion: the separator never moves aside, because nothing grows.
 *
 * @cssprop --dock-separator-color - The colour of the line. Defaults to `var(--color-border)`.
 */
export class MoulDockSeparator extends LitElement {
  static override styles = dockSeparatorStyles

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'separator')
    if (!this.hasAttribute('aria-orientation')) {
      this.setAttribute('aria-orientation', 'vertical')
    }
  }
}

defineElement('moul-dock-separator', MoulDockSeparator)

declare global {
  interface HTMLElementTagNameMap {
    'moul-dock-separator': MoulDockSeparator
  }
}
