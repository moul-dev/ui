import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { MoulBase } from '../../shared/base.js'
import { textFieldStyles } from './TextField.styles.js'

@customElement('moul-text-field')
export class MoulTextField extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    textFieldStyles,
  ]

  @property({ type: String })
  accessor value = ''

  @property({ type: String })
  accessor placeholder = ''

  @property({ type: String })
  accessor type = 'text'

  @property({ type: String })
  accessor name = ''

  @property({ type: String, reflect: true })
  accessor size: 'sm' | 'md' | 'lg' = 'md'

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: Boolean, attribute: 'is-read-only', reflect: true })
  accessor isReadOnly = false

  @property({ type: Boolean, attribute: 'is-required', reflect: true })
  accessor isRequired = false

  @property({ type: Boolean, attribute: 'is-invalid', reflect: true })
  accessor isInvalid = false

  @property({ type: String, attribute: 'aria-label' })
  accessor ariaLabel: string | null = null

  private handleInput = (e: InputEvent) => {
    const input = e.target as HTMLInputElement
    this.value = input.value
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
    this.value = input.value
    this.dispatchEvent(
      new CustomEvent('moul-change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    const classes = {
      'form-control': true,
      'form-control-sm': this.size === 'sm',
      'form-control-lg': this.size === 'lg',
      'is-invalid': this.isInvalid,
    }

    return html`
      <input
        type="${this.type}"
        name="${this.name}"
        class="${classMap(classes)}"
        .value="${this.value}"
        placeholder="${this.placeholder}"
        ?disabled="${this.isDisabled}"
        ?readonly="${this.isReadOnly}"
        ?required="${this.isRequired}"
        aria-label="${this.ariaLabel || ''}"
        aria-invalid="${this.isInvalid ? 'true' : 'false'}"
        @input="${this.handleInput}"
        @change="${this.handleChange}"
      />
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-text-field': MoulTextField
  }
}
