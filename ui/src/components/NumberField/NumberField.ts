import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { numberFieldStyles } from './NumberField.styles.js'

@customElement('moul-number-field')
export class MoulNumberField extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    numberFieldStyles,
  ]

  @property({ type: Number })
  accessor value = 0

  @property({ type: Number })
  accessor min = -Infinity

  @property({ type: Number })
  accessor max = Infinity

  @property({ type: Number })
  accessor step = 1

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: String, attribute: 'aria-label' })
  accessor ariaLabel = 'Number'

  private handleDecrement = () => {
    if (this.isDisabled) return
    const next = Math.max(this.value - this.step, this.min)
    this.updateValue(next)
  }

  private handleIncrement = () => {
    if (this.isDisabled) return
    const next = Math.min(this.value + this.step, this.max)
    this.updateValue(next)
  }

  private handleInput = (e: InputEvent) => {
    const input = e.target as HTMLInputElement
    const parsed = parseFloat(input.value)
    if (!isNaN(parsed)) {
      this.updateValue(parsed)
    }
  }

  private updateValue(next: number) {
    if (this.value === next) return
    this.value = next
    this.dispatchEvent(
      new CustomEvent('moul-change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    return html`
      <div class="input-group">
        <button
          type="button"
          class="btn-step"
          aria-label="Decrement"
          ?disabled="${this.isDisabled || this.value <= this.min}"
          @click="${this.handleDecrement}"
        >
          −
        </button>
        <input
          type="number"
          class="form-control"
          role="spinbutton"
          .value="${String(this.value)}"
          min="${this.min}"
          max="${this.max}"
          step="${this.step}"
          ?disabled="${this.isDisabled}"
          aria-label="${this.ariaLabel}"
          aria-valuenow="${this.value}"
          aria-valuemin="${this.min !== -Infinity ? this.min : undefined}"
          aria-valuemax="${this.max !== Infinity ? this.max : undefined}"
          @input="${this.handleInput}"
        />
        <button
          type="button"
          class="btn-step"
          aria-label="Increment"
          ?disabled="${this.isDisabled || this.value >= this.max}"
          @click="${this.handleIncrement}"
        >
          +
        </button>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-number-field': MoulNumberField
  }
}
