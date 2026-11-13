import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { spinnerRing } from '../../utils/icons'
import { spinnerStyles } from './Spinner.styles'

export type SpinnerSize = 'sm' | 'md' | 'lg'

/**
 * An indeterminate loading indicator, a spinning ring in the current text
 * colour, for waits of unknown length; `label` says what is loading.
 *
 * Keyboard and screen readers: not focusable. It is a `role="status"` live
 * region named by `label` (default "Loading"), which is also present as
 * visually hidden text; the ring itself is hidden from screen readers.
 *
 * Reduced motion: the ring stops spinning and slowly pulses its opacity
 * instead.
 */
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
