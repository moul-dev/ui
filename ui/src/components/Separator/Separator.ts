import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { separatorStyles } from './Separator.styles.js'

@customElement('moul-separator')
export class MoulSeparator extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    separatorStyles,
  ]

  @property({ type: String, reflect: true })
  accessor orientation: 'horizontal' | 'vertical' = 'horizontal'

  override render() {
    return this.orientation === 'vertical'
      ? html`<div class="vr" role="separator" aria-orientation="vertical"></div>`
      : html`<hr role="separator" />`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-separator': MoulSeparator
  }
}
