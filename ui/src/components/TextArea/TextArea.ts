import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { MoulBase } from '../../shared/base.js'
import { textAreaStyles } from './TextArea.styles.js'

@customElement('moul-text-area')
export class MoulTextArea extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    textAreaStyles,
  ]

  @property({ type: String })
  accessor value = ''

  @property({ type: String })
  accessor placeholder = ''

  @property({ type: Number })
  accessor rows = 3

  @property({ type: String })
  accessor name = ''

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: Boolean, attribute: 'is-read-only', reflect: true })
  accessor isReadOnly = false

  @property({ type: Boolean, attribute: 'is-required', reflect: true })
  accessor isRequired = false

  @property({ type: Boolean, attribute: 'is-invalid', reflect: true })
  accessor isInvalid = false

  @property({ type: Boolean, attribute: 'auto-resize', reflect: true })
  accessor autoResize = false

  @property({ type: String, attribute: 'aria-label' })
  accessor ariaLabel: string | null = null

  private handleInput = (e: InputEvent) => {
    const textarea = e.target as HTMLTextAreaElement
    this.value = textarea.value
    if (this.autoResize) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
    this.dispatchEvent(
      new CustomEvent('moul-input', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleChange = (e: Event) => {
    const textarea = e.target as HTMLTextAreaElement
    this.value = textarea.value
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
      'is-invalid': this.isInvalid,
    }

    return html`
      <textarea
        name="${this.name}"
        class="${classMap(classes)}"
        rows="${this.rows}"
        .value="${this.value}"
        placeholder="${this.placeholder}"
        ?disabled="${this.isDisabled}"
        ?readonly="${this.isReadOnly}"
        ?required="${this.isRequired}"
        aria-label="${this.ariaLabel || ''}"
        aria-invalid="${this.isInvalid ? 'true' : 'false'}"
        @input="${this.handleInput}"
        @change="${this.handleChange}"
      ></textarea>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-text-area': MoulTextArea
  }
}
