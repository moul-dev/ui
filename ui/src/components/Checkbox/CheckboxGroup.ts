import { html, LitElement, type PropertyValues } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { defineElement } from '../../utils/define-element'
import type { MoulCheckbox } from './Checkbox'
import { checkboxGroupStyles } from './Checkbox.styles'

export type CheckboxGroupOrientation = 'horizontal' | 'vertical'

export class MoulCheckboxGroup extends LitElement {
  static override styles = checkboxGroupStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    value: {
      type: Array,
      converter: {
        fromAttribute: (val: string | null) => {
          if (!val) return []
          try {
            const parsed = JSON.parse(val)
            return Array.isArray(parsed) ? parsed : [val]
          } catch {
            return val.split(',').map((s) => s.trim())
          }
        },
        toAttribute: (val: string[]) => JSON.stringify(val),
      },
    },
    label: { type: String, reflect: true },
    description: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isRequired: { type: Boolean, reflect: true, attribute: 'is-required' },
    orientation: { type: String, reflect: true },
  }

  declare name: string
  declare value: string[]
  declare label: string
  declare description: string
  declare isDisabled: boolean
  declare isRequired: boolean
  declare orientation: CheckboxGroupOrientation

  public internalsController: FormInternalsController

  constructor() {
    super()
    this.name = ''
    this.value = []
    this.label = ''
    this.description = ''
    this.isDisabled = false
    this.isRequired = false
    this.orientation = 'vertical'

    this.internalsController = new FormInternalsController(this)
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('change', this.handleCheckboxChange)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('change', this.handleCheckboxChange)
  }

  public get checkboxes(): MoulCheckbox[] {
    return Array.from(this.querySelectorAll<MoulCheckbox>('moul-checkbox'))
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (changedProperties.has('value') || changedProperties.has('isRequired')) {
      this.syncFormValueAndValidity()
      this.syncChildCheckboxes()
    }

    if (changedProperties.has('isDisabled')) {
      if (this.isDisabled) {
        for (const cb of this.checkboxes) {
          cb.isDisabled = true
        }
      } else if (changedProperties.get('isDisabled') === true) {
        for (const cb of this.checkboxes) {
          if (!cb.hasAttribute('is-disabled')) {
            cb.isDisabled = false
          }
        }
      }
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)
    this.setAttribute('role', 'group')
    if (this.label && !this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', this.label)
    }
  }

  public syncChildCheckboxes(): void {
    for (const cb of this.checkboxes) {
      cb.isChecked = this.value.includes(cb.value)
      if (this.isDisabled) {
        cb.isDisabled = true
      }
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

  private syncFormValueAndValidity(): void {
    if (this.value.length > 0) {
      const fd = new FormData()
      for (const v of this.value) {
        fd.append(this.name, v)
      }
      this.internalsController.setValue(fd)
      this.internalsController.setValidity({})
      this.removeAttribute('is-invalid')
    } else {
      this.internalsController.setValue(null)
      if (this.isRequired) {
        this.internalsController.setValidity(
          { valueMissing: true },
          'Please select at least one option.',
        )
        this.setAttribute('is-invalid', '')
      } else {
        this.internalsController.setValidity({})
        this.removeAttribute('is-invalid')
      }
    }
  }

  private handleSlotChange = (): void => {
    this.syncChildCheckboxes()
  }

  private handleCheckboxChange = (event: Event): void => {
    if (event.target === this) {
      return
    }
    const target = (event.target || event.composedPath()[0]) as MoulCheckbox
    if (target && target.tagName === 'MOUL-CHECKBOX') {
      event.stopImmediatePropagation()
      const checkedVals: string[] = []
      for (const cb of this.checkboxes) {
        if (cb.isChecked) {
          checkedVals.push(cb.value)
        }
      }
      this.value = checkedVals
      this.syncFormValueAndValidity()

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
        ${
          this.description
            ? html`<div part="description"><slot name="description">${this.description}</slot></div>`
            : html`<slot name="description"></slot>`
        }

        <div
          part="group"
          @slotchange=${this.handleSlotChange}
          @change=${this.handleCheckboxChange}
        >
          <slot></slot>
        </div>
      </div>
    `
  }
}

defineElement('moul-checkbox-group', MoulCheckboxGroup)

declare global {
  interface HTMLElementTagNameMap {
    'moul-checkbox-group': MoulCheckboxGroup
  }
}
