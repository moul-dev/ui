import { html, LitElement, type PropertyValues } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { defineElement } from '../../utils/define-element'
import type { MoulRadio } from './Radio'
import { radioGroupStyles } from './RadioGroup.styles'

export type RadioGroupOrientation = 'horizontal' | 'vertical'

export class MoulRadioGroup extends LitElement {
  static override styles = radioGroupStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true },
    label: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isRequired: { type: Boolean, reflect: true, attribute: 'is-required' },
    orientation: { type: String, reflect: true },
  }

  declare name: string
  declare value: string
  declare label: string
  declare isDisabled: boolean
  declare isRequired: boolean
  declare orientation: RadioGroupOrientation

  public internalsController: FormInternalsController

  constructor() {
    super()
    this.name = ''
    this.value = ''
    this.label = ''
    this.isDisabled = false
    this.isRequired = false
    this.orientation = 'vertical'

    this.internalsController = new FormInternalsController(this)
  }

  public get radios(): MoulRadio[] {
    return Array.from(this.querySelectorAll<MoulRadio>('moul-radio'))
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'radiogroup')
    this.addEventListener('keydown', this.handleKeyDown)
    this.addEventListener('radio-select' as any, this.handleRadioSelect)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.handleKeyDown)
    this.removeEventListener('radio-select' as any, this.handleRadioSelect)
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (changedProperties.has('value') || changedProperties.has('isRequired')) {
      this.syncFormValueAndValidity()
      this.syncRadios()
    }

    if (changedProperties.has('isDisabled')) {
      if (this.isDisabled) {
        for (const r of this.radios) {
          r.isDisabled = true
        }
      } else if (changedProperties.get('isDisabled') === true) {
        for (const r of this.radios) {
          if (!r.hasAttribute('is-disabled')) {
            r.isDisabled = false
          }
        }
      }
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)
    if (this.label && !this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', this.label)
    }
  }

  public syncRadios(): void {
    const radios = this.radios
    const hasChecked = radios.some((r) => r.value === this.value)

    radios.forEach((r, idx) => {
      const isChecked = r.value === this.value
      r.isChecked = isChecked
      if (this.isDisabled) {
        r.isDisabled = true
      }
      // Roving tabindex: if none checked, first non-disabled has tabindex 0; otherwise only checked has 0
      if (hasChecked) {
        r.setAttribute('tabindex', isChecked && !r.isDisabled ? '0' : '-1')
      } else {
        r.setAttribute('tabindex', idx === 0 && !r.isDisabled ? '0' : '-1')
      }
    })
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

  private syncFormValueAndValidity(): void {
    this.internalsController.setValue(this.value || null)

    if (this.isRequired && !this.value) {
      this.internalsController.setValidity(
        { valueMissing: true },
        'Please select an option.',
      )
      this.setAttribute('is-invalid', '')
    } else {
      this.internalsController.setValidity({})
      this.removeAttribute('is-invalid')
    }
  }

  private handleSlotChange = (): void => {
    this.syncRadios()
  }

  private handleRadioSelect = (event: CustomEvent<{ value: string }>): void => {
    event.stopPropagation()
    const nextVal = event.detail.value
    if (this.value !== nextVal) {
      this.value = nextVal
      this.syncFormValueAndValidity()
      this.syncRadios()

      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      )
    }
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const available = this.radios.filter((r) => !r.isDisabled)
    if (available.length === 0) return

    const currentIndex = available.findIndex((r) => r.value === this.value)
    let nextIndex = currentIndex

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % available.length
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      nextIndex = currentIndex <= 0 ? available.length - 1 : currentIndex - 1
    } else {
      return
    }

    const nextRadio = available[nextIndex]
    if (nextRadio) {
      nextRadio.focus()
      this.value = nextRadio.value
      this.syncFormValueAndValidity()
      this.syncRadios()

      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      )
    }
  }

  protected override render() {
    return html`
      <div part="base">
        ${
          this.label
            ? html`<div part="label"><slot name="label">${this.label}</slot></div>`
            : html`<slot name="label"></slot>`
        }

        <div part="group" @slotchange=${this.handleSlotChange}>
          <slot></slot>
        </div>
      </div>
    `
  }
}

defineElement('moul-radio-group', MoulRadioGroup)

declare global {
  interface HTMLElementTagNameMap {
    'moul-radio-group': MoulRadioGroup
  }
}
