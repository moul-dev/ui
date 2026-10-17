import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { formStyles } from './Form.styles'

export type FormMethod = 'get' | 'post' | 'dialog'

export class MoulForm extends LitElement {
  static override styles = formStyles

  static override properties = {
    action: { type: String, reflect: true },
    method: { type: String, reflect: true },
    novalidate: { type: Boolean, reflect: true },
  }

  declare action: string
  declare method: FormMethod
  declare novalidate: boolean

  constructor() {
    super()
    this.action = ''
    this.method = 'post'
    this.novalidate = false
  }

  public get nativeForm(): HTMLFormElement | null {
    return this.renderRoot?.querySelector('form') ?? null
  }

  /**
   * Returns all form-associated custom controls and native form inputs
   * contained inside this form.
   */
  public getControls(): HTMLElement[] {
    const selector = [
      'moul-text-field',
      'moul-number-field',
      'moul-search-field',
      'moul-text-area',
      'moul-checkbox',
      'moul-checkbox-group',
      'moul-radio-group',
      'moul-switch',
      'moul-slider',
      'moul-input-otp',
      'moul-select',
      'moul-combobox',
      'moul-calendar',
      'moul-date-picker',
      'input',
      'select',
      'textarea',
      'button',
    ].join(', ')

    return Array.from(this.querySelectorAll<HTMLElement>(selector))
  }

  /**
   * Compiles and returns a FormData instance containing all named, non-disabled values.
   */
  public getFormData(): FormData {
    const formData = new FormData()
    const controls = this.getControls()

    for (const ctrl of controls) {
      const el = ctrl as any
      const name = el.name || el.getAttribute?.('name')
      if (!name) continue
      if (el.isDisabled || el.disabled) continue

      if (typeof el.isChecked === 'boolean') {
        if (el.isChecked) {
          formData.append(name, el.value ?? 'on')
        }
      } else if (
        ctrl.tagName === 'INPUT' &&
        (ctrl as HTMLInputElement).type === 'checkbox'
      ) {
        if ((ctrl as HTMLInputElement).checked) {
          formData.append(name, (ctrl as HTMLInputElement).value || 'on')
        }
      } else if (
        ctrl.tagName === 'INPUT' &&
        (ctrl as HTMLInputElement).type === 'radio'
      ) {
        if ((ctrl as HTMLInputElement).checked) {
          formData.append(name, (ctrl as HTMLInputElement).value)
        }
      } else if (Array.isArray(el.value)) {
        for (const item of el.value) {
          formData.append(name, String(item))
        }
      } else if (
        el.value !== undefined &&
        el.value !== null &&
        el.value !== ''
      ) {
        formData.append(name, String(el.value))
      }
    }

    return formData
  }

  public checkValidity(): boolean {
    if (this.novalidate) return true
    const controls = this.getControls()
    let valid = true

    for (const ctrl of controls) {
      const anyCtrl = ctrl as any
      if (typeof anyCtrl.checkValidity === 'function') {
        if (!anyCtrl.checkValidity()) {
          valid = false
        }
      }
    }
    return valid
  }

  public reportValidity(): boolean {
    if (this.novalidate) return true
    const controls = this.getControls()
    let valid = true

    for (const ctrl of controls) {
      const anyCtrl = ctrl as any
      if (typeof anyCtrl.reportValidity === 'function') {
        if (!anyCtrl.reportValidity()) {
          valid = false
        }
      } else if (typeof anyCtrl.checkValidity === 'function') {
        if (!anyCtrl.checkValidity()) {
          valid = false
        }
      }
    }
    return valid
  }

  public submit(): void {
    this.handleSubmit(new Event('submit', { cancelable: true }))
  }

  public reset(): void {
    this.handleReset(new Event('reset', { cancelable: true }))
  }

  private handleSubmit = (event: Event): void => {
    event.preventDefault()
    event.stopImmediatePropagation()

    if (!this.novalidate) {
      const errors: Record<string, string> = {}
      let isValid = true

      const controls = this.getControls()
      for (const ctrl of controls) {
        const anyCtrl = ctrl as any
        let ctrlValid = true
        if (typeof anyCtrl.reportValidity === 'function') {
          ctrlValid = anyCtrl.reportValidity()
        } else if (typeof anyCtrl.checkValidity === 'function') {
          ctrlValid = anyCtrl.checkValidity()
        }

        if (!ctrlValid) {
          isValid = false
          const name =
            anyCtrl.name || ctrl.getAttribute('name') || ctrl.id || 'unknown'
          errors[name] = anyCtrl.validationMessage || 'This field is invalid.'
        }
      }

      if (!isValid) {
        this.dispatchEvent(
          new CustomEvent('invalid', {
            detail: { errors },
            bubbles: true,
            composed: true,
          }),
        )
        return
      }
    }

    const formData = this.getFormData()
    this.dispatchEvent(
      new CustomEvent('submit', {
        detail: { formData },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleReset = (event: Event): void => {
    event.preventDefault()

    const controls = this.getControls()
    for (const ctrl of controls) {
      const anyCtrl = ctrl as any
      if (typeof anyCtrl.reset === 'function') {
        anyCtrl.reset()
      } else if (
        'value' in anyCtrl &&
        typeof anyCtrl.defaultValue !== 'undefined'
      ) {
        anyCtrl.value = anyCtrl.defaultValue
      } else if ('isChecked' in anyCtrl) {
        anyCtrl.isChecked = false
      } else if ('value' in anyCtrl && typeof anyCtrl.value === 'string') {
        anyCtrl.value = ''
      } else if ('value' in anyCtrl && typeof anyCtrl.value === 'number') {
        anyCtrl.value =
          typeof anyCtrl.min === 'number' && anyCtrl.min > 0 ? anyCtrl.min : 0
      }
    }

    this.dispatchEvent(
      new CustomEvent('reset', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  protected override render() {
    return html`
      <form
        part="base"
        action=${this.action}
        method=${this.method}
        ?novalidate=${this.novalidate}
        @submit=${this.handleSubmit}
        @reset=${this.handleReset}
      >
        <slot></slot>
      </form>
    `
  }
}

defineElement('moul-form', MoulForm)

declare global {
  interface HTMLElementTagNameMap {
    'moul-form': MoulForm
  }
}
