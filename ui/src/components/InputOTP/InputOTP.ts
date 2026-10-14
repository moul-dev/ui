import { type CSSResultOrNative, html } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { inputOTPStyles } from './InputOTP.styles.js'

@customElement('moul-input-otp-separator')
export class MoulInputOTPSeparator extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    inputOTPStyles,
  ]

  override render() {
    return html`<span class="separator">-</span>`
  }
}

@customElement('moul-input-otp-slot')
export class MoulInputOTPSlot extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    inputOTPStyles,
  ]

  @property({ type: String })
  accessor char = ''

  @property({ type: Boolean, attribute: 'is-active' })
  accessor isActive = false

  @property({ type: Boolean, attribute: 'is-invalid' })
  accessor isInvalid = false

  @property({ type: Boolean, attribute: 'is-disabled' })
  accessor isDisabled = false

  @property({ type: String })
  accessor size: 'sm' | 'md' | 'lg' = 'md'

  override render() {
    return html`
      <div
        class="slot ${this.size} ${this.isActive ? 'active' : ''} ${this.isInvalid ? 'invalid' : ''} ${this.isDisabled ? 'disabled' : ''}"
      >
        ${this.char}
      </div>
    `
  }
}

@customElement('moul-input-otp')
export class MoulInputOTP extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    inputOTPStyles,
  ]

  @property({ type: Number })
  accessor length = 6

  @property({ type: String })
  accessor value = ''

  @property({ type: String })
  accessor label = ''

  @property({ type: String })
  accessor description = ''

  @property({ type: String, attribute: 'error-message' })
  accessor errorMessage = ''

  @property({ type: Boolean, attribute: 'is-invalid' })
  accessor isInvalid = false

  @property({ type: Boolean, attribute: 'is-disabled' })
  accessor isDisabled = false

  @property({ type: String })
  accessor size: 'sm' | 'md' | 'lg' = 'md'

  @state()
  private accessor isFocused = false

  @query('.hidden-input')
  private accessor inputElement: HTMLInputElement | null = null

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement
    const val = input.value.slice(0, this.length)
    this.value = val
    this.dispatchEvent(
      new CustomEvent('moul-change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
    if (this.value.length === this.length) {
      this.dispatchEvent(
        new CustomEvent('moul-complete', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      )
    }
  }

  private handleClick() {
    if (!this.isDisabled && this.inputElement) {
      this.inputElement.focus()
    }
  }

  override render() {
    const chars = this.value.split('')
    const slots = Array.from({ length: this.length }, (_, i) => {
      const char = chars[i] || ''
      const isActive =
        this.isFocused &&
        (i === chars.length ||
          (i === this.length - 1 && chars.length === this.length))
      return html`
        <div
          class="slot ${this.size} ${isActive ? 'active' : ''} ${this.isInvalid ? 'invalid' : ''} ${this.isDisabled ? 'disabled' : ''}"
        >
          ${char}
        </div>
      `
    })

    return html`
      <div class="container" @click=${this.handleClick}>
        ${this.label ? html`<label class="label">${this.label}</label>` : ''}
        <div class="otp-container" role="group" aria-label="${this.label || 'OTP code'}">
          <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="one-time-code"
            maxlength="${this.length}"
            .value=${this.value}
            class="hidden-input"
            ?disabled=${this.isDisabled}
            @input=${this.handleInput}
            @focus=${() => {
              this.isFocused = true
            }}
            @blur=${() => {
              this.isFocused = false
            }}
          />
          ${slots}
        </div>
        ${this.description && !this.isInvalid ? html`<div class="description">${this.description}</div>` : ''}
        ${this.isInvalid && this.errorMessage ? html`<div class="error-message" role="alert">${this.errorMessage}</div>` : ''}
      </div>
    `
  }
}
