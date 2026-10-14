import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { buttonGroupStyles } from './ButtonGroup.styles.js'

@customElement('moul-button-group')
export class MoulButtonGroup extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    buttonGroupStyles,
  ]

  @property({ type: String, reflect: true })
  accessor orientation: 'horizontal' | 'vertical' = 'horizontal'

  @property({ type: String, reflect: true })
  accessor size: 'sm' | 'md' | 'lg' = 'md'

  @property({ type: String, attribute: 'aria-label' })
  accessor ariaLabel = 'Button group'

  override render() {
    return html`
      <div class="btn-group" role="group" aria-label="${this.ariaLabel}">
        <slot></slot>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-button-group': MoulButtonGroup
  }
}
