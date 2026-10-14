import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { checkboxStyles } from './Checkbox.styles.js'

@customElement('moul-checkbox')
export class MoulCheckbox extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    checkboxStyles,
  ]

  @property({ type: Boolean, attribute: 'is-selected', reflect: true })
  accessor isSelected = false

  @property({ type: Boolean, attribute: 'is-indeterminate', reflect: true })
  accessor isIndeterminate = false

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: String })
  accessor value = ''

  @property({ type: String })
  accessor name = ''

  private handleChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    this.isSelected = input.checked
    this.isIndeterminate = false
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
      <label class="form-check">
        <input
          type="checkbox"
          class="form-check-input"
          name="${this.name}"
          .checked="${this.isSelected}"
          .indeterminate="${this.isIndeterminate}"
          ?disabled="${this.isDisabled}"
          aria-checked="${this.isIndeterminate ? 'mixed' : this.isSelected ? 'true' : 'false'}"
          @change="${this.handleChange}"
        />
        <span class="form-check-label">
          <slot></slot>
        </span>
      </label>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-checkbox': MoulCheckbox
  }
}
