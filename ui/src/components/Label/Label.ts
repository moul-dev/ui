import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { labelStyles } from './Label.styles.js'

@customElement('moul-label')
export class MoulLabel extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    labelStyles,
  ]

  @property({ type: String, attribute: 'for' })
  accessor htmlFor = ''

  @property({ type: Boolean, attribute: 'is-required', reflect: true })
  accessor isRequired = false

  override render() {
    return html`
      <label for="${this.htmlFor}">
        <slot></slot>
        ${this.isRequired ? html`<span class="required-star" aria-hidden="true">*</span>` : ''}
      </label>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-label': MoulLabel
  }
}
