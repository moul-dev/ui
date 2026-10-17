import { html, LitElement, type PropertyValues, svg } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { defineElement } from '../../utils/define-element'
import { SPRING_SNAPPY, subtleAnimate } from '../../utils/motion'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import { checkboxStyles } from './Checkbox.styles'

export class MoulCheckbox extends LitElement {
  static override styles = checkboxStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true },
    isChecked: { type: Boolean, reflect: true, attribute: 'is-checked' },
    isIndeterminate: {
      type: Boolean,
      reflect: true,
      attribute: 'is-indeterminate',
    },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isRequired: { type: Boolean, reflect: true, attribute: 'is-required' },
    label: { type: String, reflect: true },
  }

  declare name: string
  declare value: string
  declare isChecked: boolean
  declare isIndeterminate: boolean
  declare isDisabled: boolean
  declare isRequired: boolean
  declare label: string

  public internalsController: FormInternalsController

  constructor() {
    super()
    this.name = ''
    this.value = 'on'
    this.isChecked = false
    this.isIndeterminate = false
    this.isDisabled = false
    this.isRequired = false
    this.label = ''

    this.internalsController = new FormInternalsController(this)
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('tabindex', this.isDisabled ? '-1' : '0')
    this.addEventListener('click', this.handleClick)
    this.addEventListener('keydown', this.handleKeyDown)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('click', this.handleClick)
    this.removeEventListener('keydown', this.handleKeyDown)
  }

  public toggle(): void {
    if (this.isDisabled) return

    this.isIndeterminate = false
    this.isChecked = !this.isChecked
    this.syncFormValueAndValidity()

    const indicator = this.renderRoot?.querySelector(
      '[part="indicator"]',
    ) as HTMLElement | null
    if (indicator) {
      subtleAnimate(indicator, { scale: [0.9, 1] }, SPRING_SNAPPY)
    }

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: {
          isChecked: this.isChecked,
          value: this.value,
        },
        bubbles: true,
        composed: true,
      }),
    )
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('isChecked') ||
      changedProperties.has('value') ||
      changedProperties.has('isRequired')
    ) {
      this.syncFormValueAndValidity()
    }

    if (changedProperties.has('isDisabled')) {
      this.setAttribute('tabindex', this.isDisabled ? '-1' : '0')
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    const hasLabel = Boolean(
      this.label ||
        this.getAttribute('aria-label') ||
        this.getAttribute('aria-labelledby') ||
        this.textContent?.trim(),
    )
    warnMissingLabel(this, 'checkbox', hasLabel)

    // Update ARIA attributes on host
    this.setAttribute('role', 'checkbox')
    this.setAttribute(
      'aria-checked',
      this.isIndeterminate ? 'mixed' : this.isChecked ? 'true' : 'false',
    )
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
    this.internalsController.setValue(this.isChecked ? this.value : null)

    if (this.isRequired && !this.isChecked) {
      this.internalsController.setValidity(
        { valueMissing: true },
        'This field is required.',
      )
      this.setAttribute('is-invalid', '')
    } else {
      this.internalsController.setValidity({})
      this.removeAttribute('is-invalid')
    }
  }

  private handleClick = (event: MouseEvent): void => {
    event.preventDefault()
    this.toggle()
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
      this.toggle()
    }
  }

  protected override render() {
    return html`
      <div
        part="base"
        ?data-disabled=${this.isDisabled}
      >
        <span part="indicator">
          ${
            this.isIndeterminate
              ? svg`
                <svg part="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h14" />
                </svg>
              `
              : this.isChecked
                ? svg`
                  <svg part="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                `
                : ''
          }
        </span>

        <span part="label">
          <slot>${this.label}</slot>
        </span>
      </div>
    `
  }
}

defineElement('moul-checkbox', MoulCheckbox)

declare global {
  interface HTMLElementTagNameMap {
    'moul-checkbox': MoulCheckbox
  }
}
