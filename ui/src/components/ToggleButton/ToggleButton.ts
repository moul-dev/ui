import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { toggleButtonStyles } from './ToggleButton.styles.js'

@customElement('moul-toggle-button')
export class MoulToggleButton extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    toggleButtonStyles,
  ]

  @property({ type: Boolean, attribute: 'is-selected', reflect: true })
  accessor isSelected = false

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: String })
  accessor value = ''

  private handleClick = () => {
    if (this.isDisabled) return
    this.isSelected = !this.isSelected
    this.dispatchEvent(
      new CustomEvent('moul-change', {
        detail: { isSelected: this.isSelected, value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    return html`
      <button
        type="button"
        class="btn ${this.isSelected ? 'active' : ''}"
        ?disabled="${this.isDisabled}"
        aria-pressed="${this.isSelected ? 'true' : 'false'}"
        @click="${this.handleClick}"
      >
        <slot></slot>
      </button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-toggle-button': MoulToggleButton
  }
}
