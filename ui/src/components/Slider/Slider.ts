import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { sliderStyles } from './Slider.styles.js'

@customElement('moul-slider')
export class MoulSlider extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    sliderStyles,
  ]

  @property({ type: Number })
  accessor value = 0

  @property({ type: Number })
  accessor min = 0

  @property({ type: Number })
  accessor max = 100

  @property({ type: Number })
  accessor step = 1

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: String, attribute: 'aria-label' })
  accessor ariaLabel = 'Slider'

  private handleInput = (e: InputEvent) => {
    const input = e.target as HTMLInputElement
    this.value = Number(input.value)
    this.dispatchEvent(
      new CustomEvent('moul-input', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    this.value = Number(input.value)
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
      <input
        type="range"
        class="form-range"
        role="slider"
        .value="${String(this.value)}"
        min="${this.min}"
        max="${this.max}"
        step="${this.step}"
        ?disabled="${this.isDisabled}"
        aria-label="${this.ariaLabel}"
        aria-valuenow="${this.value}"
        aria-valuemin="${this.min}"
        aria-valuemax="${this.max}"
        @input="${this.handleInput}"
        @change="${this.handleChange}"
      />
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-slider': MoulSlider
  }
}
