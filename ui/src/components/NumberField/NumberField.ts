import { html, LitElement, type PropertyValues } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { defineElement } from '../../utils/define-element'
import { EASE_OUT, subtleAnimate } from '../../utils/motion'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import { numberFieldStyles } from './NumberField.styles'

export class MoulNumberField extends LitElement {
  static override styles = numberFieldStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: Number, attribute: 'value' },
    min: { type: Number, reflect: true },
    max: { type: Number, reflect: true },
    step: { type: Number, reflect: true },
    placeholder: { type: String, reflect: true },
    label: { type: String, reflect: true },
    description: { type: String, reflect: true },
    errorMessage: { type: String, reflect: true, attribute: 'error-message' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isRequired: { type: Boolean, reflect: true, attribute: 'is-required' },
    isReadonly: { type: Boolean, reflect: true, attribute: 'is-readonly' },
  }

  declare name: string
  declare value: number | null
  declare min?: number
  declare max?: number
  declare step: number
  declare placeholder: string
  declare label: string
  declare description: string
  declare errorMessage: string
  declare isDisabled: boolean
  declare isRequired: boolean
  declare isReadonly: boolean

  public internalsController: FormInternalsController

  constructor() {
    super()
    this.name = ''
    this.value = null
    this.step = 1
    this.placeholder = ''
    this.label = ''
    this.description = ''
    this.errorMessage = ''
    this.isDisabled = false
    this.isRequired = false
    this.isReadonly = false

    this.internalsController = new FormInternalsController(this)
  }

  public get inputElement(): HTMLInputElement | null {
    return this.renderRoot?.querySelector('input') ?? null
  }

  public override focus(options?: FocusOptions): void {
    this.inputElement?.focus(options)
  }

  public override blur(): void {
    this.inputElement?.blur()
  }

  public select(): void {
    this.inputElement?.select()
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

  public stepUp(): void {
    if (this.isDisabled || this.isReadonly) return
    const current =
      typeof this.value === 'number' && !isNaN(this.value)
        ? this.value
        : (this.min ?? 0)
    let next = current + (this.step || 1)
    if (this.max !== undefined && next > this.max) {
      next = this.max
    }
    if (this.min !== undefined && next < this.min) {
      next = this.min
    }
    this.value = next
    this.syncFormValueAndValidity()
    this.dispatchEvents()
  }

  public stepDown(): void {
    if (this.isDisabled || this.isReadonly) return
    const current =
      typeof this.value === 'number' && !isNaN(this.value)
        ? this.value
        : (this.min ?? 0)
    let next = current - (this.step || 1)
    if (this.min !== undefined && next < this.min) {
      next = this.min
    }
    if (this.max !== undefined && next > this.max) {
      next = this.max
    }
    this.value = next
    this.syncFormValueAndValidity()
    this.dispatchEvents()
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('value') ||
      changedProperties.has('isRequired') ||
      changedProperties.has('min') ||
      changedProperties.has('max') ||
      changedProperties.has('errorMessage')
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
    warnMissingLabel(this, 'number field', hasLabel)

    if (changedProperties.has('errorMessage') && this.errorMessage) {
      const errorEl = this.renderRoot?.querySelector(
        '[part="error"]',
      ) as HTMLElement | null
      if (errorEl) {
        subtleAnimate(
          errorEl,
          {
            transform: ['translateY(-4px)', 'translateY(0px)'],
            opacity: [0, 1],
          },
          { duration: 0.2, ease: EASE_OUT },
        )
      }
    }
  }

  private syncFormValueAndValidity(): void {
    const valStr =
      this.value !== null && !isNaN(this.value) ? String(this.value) : ''
    this.internalsController.setValue(valStr || null)

    if (this.isRequired && (this.value === null || isNaN(this.value))) {
      const msg = this.errorMessage || 'This field is required.'
      this.internalsController.setValidity({ valueMissing: true }, msg)
      this.setAttribute('is-invalid', '')
      return
    }

    if (
      this.min !== undefined &&
      this.value !== null &&
      this.value < this.min
    ) {
      this.internalsController.setValidity(
        { rangeUnderflow: true },
        `Value must be greater than or equal to ${this.min}.`,
      )
      this.setAttribute('is-invalid', '')
      return
    }

    if (
      this.max !== undefined &&
      this.value !== null &&
      this.value > this.max
    ) {
      this.internalsController.setValidity(
        { rangeOverflow: true },
        `Value must be less than or equal to ${this.max}.`,
      )
      this.setAttribute('is-invalid', '')
      return
    }

    this.internalsController.setValidity({})
    this.removeAttribute('is-invalid')
  }

  private dispatchEvents(): void {
    this.dispatchEvent(
      new Event('input', {
        bubbles: true,
        composed: true,
      }),
    )
    this.dispatchEvent(
      new Event('change', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleInput = (event: Event): void => {
    const input = event.target as HTMLInputElement
    const raw = input.value.trim()
    if (raw === '') {
      this.value = null
    } else {
      const parsed = parseFloat(raw)
      this.value = isNaN(parsed) ? null : parsed
    }
    this.syncFormValueAndValidity()

    this.dispatchEvent(
      new Event('input', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleChange = (_event: Event): void => {
    this.dispatchEvent(
      new Event('change', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.isDisabled || this.isReadonly) return

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.stepUp()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.stepDown()
    } else if (event.key === 'Home' && this.min !== undefined) {
      event.preventDefault()
      this.value = this.min
      this.syncFormValueAndValidity()
      this.dispatchEvents()
    } else if (event.key === 'End' && this.max !== undefined) {
      event.preventDefault()
      this.value = this.max
      this.syncFormValueAndValidity()
      this.dispatchEvents()
    }
  }

  public reset(): void {
    const defaultVal = (this as any).defaultValue
    this.value =
      typeof defaultVal === 'number'
        ? defaultVal
        : typeof this.min === 'number' && this.min > 0
          ? this.min
          : 0
    this.syncFormValueAndValidity()
  }

  protected override render() {
    const isInvalid = this.hasAttribute('is-invalid')
    const displayValue =
      this.value !== null && !isNaN(this.value) ? String(this.value) : ''

    return html`
      <div part="base">
        <label part="label" for="input">
          <slot name="label">${this.label}</slot>
        </label>

        <div
          part="input-container"
          ?data-invalid=${isInvalid}
          ?data-disabled=${this.isDisabled}
        >
          <span part="prefix"><slot name="prefix"></slot></span>
          <input
            id="input"
            part="input"
            type="text"
            inputmode="numeric"
            role="spinbutton"
            placeholder=${this.placeholder}
            .value=${displayValue}
            ?disabled=${this.isDisabled}
            ?required=${this.isRequired}
            ?readonly=${this.isReadonly}
            aria-valuenow=${this.value !== null ? this.value : undefined}
            aria-valuemin=${this.min !== undefined ? this.min : undefined}
            aria-valuemax=${this.max !== undefined ? this.max : undefined}
            aria-invalid=${isInvalid ? 'true' : 'false'}
            @input=${this.handleInput}
            @change=${this.handleChange}
            @keydown=${this.handleKeyDown}
          />
          <span part="suffix"><slot name="suffix"></slot></span>

          <div part="stepper-group">
            <button
              type="button"
              part="stepper-btn stepper-btn-up"
              aria-label="Increase value"
              tabindex="-1"
              ?disabled=${this.isDisabled || this.isReadonly}
              @click=${() => this.stepUp()}
            >
              ▲
            </button>
            <button
              type="button"
              part="stepper-btn stepper-btn-down"
              aria-label="Decrease value"
              tabindex="-1"
              ?disabled=${this.isDisabled || this.isReadonly}
              @click=${() => this.stepDown()}
            >
              ▼
            </button>
          </div>
        </div>

        ${
          this.description
            ? html`<div id="description" part="description"><slot name="description">${this.description}</slot></div>`
            : html`<slot name="description"></slot>`
        }
        ${
          this.errorMessage
            ? html`<div id="error" part="error"><slot name="error">${this.errorMessage}</slot></div>`
            : html`<slot name="error"></slot>`
        }
      </div>
    `
  }
}

defineElement('moul-number-field', MoulNumberField)

declare global {
  interface HTMLElementTagNameMap {
    'moul-number-field': MoulNumberField
  }
}
