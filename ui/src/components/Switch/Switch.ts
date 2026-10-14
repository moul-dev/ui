import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { switchStyles } from './Switch.styles.js'

@customElement('moul-switch')
export class MoulSwitch extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    switchStyles,
  ]

  @property({ type: Boolean, attribute: 'is-selected', reflect: true })
  accessor isSelected = false

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: String })
  accessor value = ''

  @property({ type: String })
  accessor name = ''

  private handleChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    this.isSelected = input.checked
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
      <label class="form-check form-switch">
        <input
          type="checkbox"
          role="switch"
          class="form-check-input"
          name="${this.name}"
          .checked="${this.isSelected}"
          ?disabled="${this.isDisabled}"
          aria-checked="${this.isSelected ? 'true' : 'false'}"
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
    'moul-switch': MoulSwitch
  }
}
