import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { EASE_OUT, subtleAnimate } from '../../utils/motion'
import { tabPanelStyles } from './Tabs.styles'

/**
 * The content for one tab inside `moul-tabs`, shown while the `moul-tab` with
 * the same `key` is selected and `hidden` otherwise.
 *
 * Keyboard and screen readers: the host has `role="tabpanel"` and
 * `tabindex="0"`, so Tab moves from the selected tab into the panel, then on
 * to its content. It is not linked to its tab with `aria-labelledby` or
 * `aria-controls`, so it has no accessible name of its own.
 *
 * Reduced motion: a newly shown panel fades in over 150ms; under reduced
 * motion it appears at once.
 */
export class MoulTabPanel extends LitElement {
  static override styles = tabPanelStyles

  static override properties = {
    key: { type: String, reflect: true },
  }

  declare key: string

  constructor() {
    super()
    this.key = ''
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'tabpanel')
    this.setAttribute('tabindex', '0')
  }

  public reveal(): void {
    if (!this.hasAttribute('hidden')) return
    this.removeAttribute('hidden')
    subtleAnimate(this, { opacity: [0, 1] }, { duration: 0.15, ease: EASE_OUT })
  }

  public hide(): void {
    this.setAttribute('hidden', '')
  }

  protected override render() {
    return html`<slot></slot>`
  }
}

defineElement('moul-tab-panel', MoulTabPanel)

declare global {
  interface HTMLElementTagNameMap {
    'moul-tab-panel': MoulTabPanel
  }
}
