import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { subtleAnimate } from '../../utils/motion'
import { tabPanelStyles } from './Tabs.styles'

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
    subtleAnimate(this, { opacity: [0, 1], y: [4, 0] }, { duration: 0.16 })
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
