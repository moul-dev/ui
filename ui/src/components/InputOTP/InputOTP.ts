import { html, LitElement, type PropertyValues } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { defineElement } from '../../utils/define-element'
import { SPRING_SNAPPY, subtleAnimate } from '../../utils/motion'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import { inputOtpStyles } from './InputOTP.styles'

export class MoulInputOTP extends LitElement {
  static override styles = inputOtpStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    length: { type: Number, reflect: true },
    value: { type: String, reflect: true },
    pattern: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isRequired: { type: Boolean, reflect: true, attribute: 'is-required' },
    label: { type: String, reflect: true },
  }

  declare name: string
  declare length: number
  declare value: string
  declare pattern: string
  declare isDisabled: boolean
  declare isRequired: boolean
  declare label: string

  public internalsController: FormInternalsController

  constructor() {
    super()
    this.name = ''
    this.length = 6
    this.value = ''
    this.pattern = '^\\d+$'
    this.isDisabled = false
    this.isRequired = false
    this.label = ''

    this.internalsController = new FormInternalsController(this)
  }

  public get slotInputs(): HTMLInputElement[] {
    return Array.from(
      this.renderRoot?.querySelectorAll<HTMLInputElement>('input') ?? [],
    )
  }

  public override focus(options?: FocusOptions): void {
    const slots = this.slotInputs
    const firstEmpty = slots.find((input) => !input.value)
    if (firstEmpty) {
      firstEmpty.focus(options)
    } else {
      slots[0]?.focus(options)
    }
  }

  public override blur(): void {
    for (const input of this.slotInputs) {
      input.blur()
    }
  }

  public checkValidity(): boolean {
    return this.internalsController.checkValidity()
  }

  public reportValidity(): boolean {
    return this.internalsController.reportValidity()
  }

  public get validity(): ValidityState | null {
    return this.internalsController.validity
  }

  public get validationMessage(): string {
    return this.internalsController.validationMessage
  }

  public shake(): void {
    const group = this.renderRoot?.querySelector(
      '[part="group"]',
    ) as HTMLElement | null
    if (group) {
      subtleAnimate(group, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.25 })
    }
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('value') ||
      changedProperties.has('isRequired') ||
      changedProperties.has('length')
    ) {
      this.syncFormValueAndValidity()
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    const hasLabel = Boolean(
      this.label ||
        this.getAttribute('aria-label') ||
        this.getAttribute('aria-labelledby') ||
        this.querySelector('[slot="label"]'),
    )
    warnMissingLabel(this, 'OTP input', hasLabel)
  }

  private syncFormValueAndValidity(): void {
    this.internalsController.setValue(this.value || null)

    if (this.isRequired && (!this.value || this.value.length < this.length)) {
      this.internalsController.setValidity(
        { valueMissing: true },
        'Please enter the full code.',
      )
      this.setAttribute('is-invalid', '')
    } else {
      this.internalsController.setValidity({})
      this.removeAttribute('is-invalid')
    }
  }

  private handleSlotInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement
    const rawVal = input.value
    const char = rawVal ? rawVal.slice(-1) : ''

    const regex = new RegExp(this.pattern)
    if (char && regex.test(char)) {
      const chars = this.value.padEnd(this.length, ' ').split('')
      chars[index] = char
      this.value = chars.join('').trimEnd()
      this.syncFormValueAndValidity()

      subtleAnimate(input, { scale: [1.06, 1] }, SPRING_SNAPPY)

      this.dispatchEvent(
        new CustomEvent('input', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      )
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      )

      if (this.value.length === this.length) {
        this.dispatchEvent(
          new CustomEvent('complete', {
            detail: { value: this.value },
            bubbles: true,
            composed: true,
          }),
        )
      } else if (index < this.length - 1) {
        this.slotInputs[index + 1]?.focus()
      }
    } else {
      // Revert if invalid character
      input.value = this.value[index] || ''
    }
  }

  private handleSlotKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement
      if (!input.value && index > 0) {
        event.preventDefault()
        const prevInput = this.slotInputs[index - 1]
        if (prevInput) {
          prevInput.focus()
          const chars = this.value.split('')
          chars.splice(index - 1, 1)
          this.value = chars.join('')
          this.syncFormValueAndValidity()

          this.dispatchEvent(
            new CustomEvent('input', {
              detail: { value: this.value },
              bubbles: true,
              composed: true,
            }),
          )
          this.dispatchEvent(
            new CustomEvent('change', {
              detail: { value: this.value },
              bubbles: true,
              composed: true,
            }),
          )
        }
      } else {
        const chars = this.value.split('')
        chars[index] = ''
        this.value = chars.join('').trimEnd()
        this.syncFormValueAndValidity()

        this.dispatchEvent(
          new CustomEvent('input', {
            detail: { value: this.value },
            bubbles: true,
            composed: true,
          }),
        )
        this.dispatchEvent(
          new CustomEvent('change', {
            detail: { value: this.value },
            bubbles: true,
            composed: true,
          }),
        )
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      this.slotInputs[index - 1]?.focus()
    } else if (event.key === 'ArrowRight' && index < this.length - 1) {
      event.preventDefault()
      this.slotInputs[index + 1]?.focus()
    }
  }

  private handleSlotPaste(event: ClipboardEvent): void {
    event.preventDefault()
    const text = event.clipboardData?.getData('text') ?? ''
    const regex = new RegExp(this.pattern)
    const validChars = Array.from(text)
      .filter((c) => regex.test(c))
      .slice(0, this.length)

    if (validChars.length > 0) {
      this.value = validChars.join('')
      this.syncFormValueAndValidity()

      const focusIndex = Math.min(validChars.length, this.length - 1)
      this.slotInputs[focusIndex]?.focus()

      this.dispatchEvent(
        new CustomEvent('input', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      )
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      )

      if (this.value.length === this.length) {
        this.dispatchEvent(
          new CustomEvent('complete', {
            detail: { value: this.value },
            bubbles: true,
            composed: true,
          }),
        )
      }
    }
  }

  protected override render() {
    const isInvalid = this.hasAttribute('is-invalid')
    const slots = Array.from({ length: this.length }, (_, i) => i)

    return html`
      <div part="base">
        ${
          this.label
            ? html`<label part="label"><slot name="label">${this.label}</slot></label>`
            : html`<slot name="label"></slot>`
        }

        <div
          part="group"
          role="group"
          aria-label=${this.label || 'One-time password'}
          @paste=${this.handleSlotPaste}
        >
          ${slots.map((i) => {
            const char = this.value[i] || ''
            return html`
              <input
                part="slot"
                type="text"
                inputmode="numeric"
                maxlength="1"
                data-index=${i}
                .value=${char}
                ?disabled=${this.isDisabled}
                aria-label=${`Digit ${i + 1} of ${this.length}`}
                autocomplete="one-time-code"
                ?data-invalid=${isInvalid}
                @input=${(e: Event) => this.handleSlotInput(e, i)}
                @keydown=${(e: KeyboardEvent) => this.handleSlotKeyDown(e, i)}
              />
              ${
                i === Math.floor(this.length / 2) - 1
                  ? html`<slot name="separator"><span part="separator">-</span></slot>`
                  : ''
              }
            `
          })}
        </div>
      </div>
    `
  }
}

defineElement('moul-input-otp', MoulInputOTP)

declare global {
  interface HTMLElementTagNameMap {
    'moul-input-otp': MoulInputOTP
  }
}
