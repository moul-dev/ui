import { type CSSResultOrNative, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { descriptionStyles } from './Description.styles.js'

@customElement('moul-description')
export class MoulDescription extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    descriptionStyles,
  ]

  override render() {
    return html`
      <div class="form-text">
        <slot></slot>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-description': MoulDescription
  }
}
