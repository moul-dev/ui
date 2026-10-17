import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { spinnerRing } from '../../utils/icons'
import { spinnerStyles } from './Spinner.styles'

export type SpinnerSize = 'sm' | 'md' | 'lg'

export class MoulSpinner extends LitElement {
  static override styles = spinnerStyles

  static override properties = {
    size: { type: String, reflect: true },
    label: { type: String, reflect: true },
  }

  declare size: SpinnerSize
  declare label: string

  constructor() {
    super()
    this.size = 'md'
    this.label = 'Loading'
  }

  protected override render() {
    return html`
      <div part="base" role="status" aria-label=${this.label}>
        ${spinnerRing('spinner-svg')}
        <span class="sr-only">${this.label}</span>
      </div>
    `
  }
}

defineElement('moul-spinner', MoulSpinner)

declare global {
  interface HTMLElementTagNameMap {
    'moul-spinner': MoulSpinner
  }
}
