import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { defineElement } from '../../utils/define-element'
import { clear, search } from '../../utils/icons'
import { SPRING_GENTLE, SPRING_SNAPPY, subtleAnimate } from '../../utils/motion'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import { searchFieldStyles } from './SearchField.styles'

export class MoulSearchField extends LitElement {
  static override styles = searchFieldStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true },
    placeholder: { type: String, reflect: true },
    label: { type: String, reflect: true },
    description: { type: String, reflect: true },
    errorMessage: { type: String, reflect: true, attribute: 'error-message' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isRequired: { type: Boolean, reflect: true, attribute: 'is-required' },
    isReadonly: { type: Boolean, reflect: true, attribute: 'is-readonly' },
  }

  declare name: string
  declare value: string
  declare placeholder: string
  declare label: string
  declare description: string
  declare errorMessage: string
  declare isDisabled: boolean
  declare isRequired: boolean
  declare isReadonly: boolean

  public internalsController: FormInternalsController
  private wasClearVisible = false

  constructor() {
    super()
    this.name = ''
    this.value = ''
    this.placeholder = 'Search...'
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

  public clear(): void {
    if (this.isDisabled || this.isReadonly) return
    this.value = ''
    this.syncFormValueAndValidity()

    this.dispatchEvent(
      new CustomEvent('clear', {
        bubbles: true,
        composed: true,
      }),
    )
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
    this.focus()
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('value') ||
      changedProperties.has('isRequired') ||
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
    warnMissingLabel(this, 'search field', hasLabel)

    const isClearVisible = Boolean(
      this.value && !this.isDisabled && !this.isReadonly,
    )
    if (isClearVisible && !this.wasClearVisible) {
      const clearBtn = this.renderRoot?.querySelector(
        '[part="clear-btn"]',
      ) as HTMLElement | null
      if (clearBtn) {
        subtleAnimate(
          clearBtn,
          { scale: [0.8, 1], opacity: [0, 1] },
          SPRING_SNAPPY,
        )
      }
    }
    this.wasClearVisible = isClearVisible

    if (changedProperties.has('errorMessage') && this.errorMessage) {
      const errorEl = this.renderRoot?.querySelector(
        '[part="error"]',
      ) as HTMLElement | null
      if (errorEl) {
        subtleAnimate(errorEl, { y: [-4, 0], opacity: [0, 1] }, SPRING_GENTLE)
      }
    }
  }

  private syncFormValueAndValidity(): void {
    this.internalsController.setValue(this.value || null)

    if (this.isRequired && !this.value) {
      const msg = this.errorMessage || 'This field is required.'
      this.internalsController.setValidity({ valueMissing: true }, msg)
      this.setAttribute('is-invalid', '')
    } else {
      this.internalsController.setValidity({})
      this.removeAttribute('is-invalid')
    }
  }

  private handleInput = (event: Event): void => {
    const input = event.target as HTMLInputElement
    this.value = input.value
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
    if (event.key === 'Enter') {
      this.dispatchEvent(
        new CustomEvent('submit', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      )
    } else if (event.key === 'Escape') {
      if (this.value) {
        event.preventDefault()
        this.clear()
      }
    }
  }

  protected override render() {
    const isInvalid = this.hasAttribute('is-invalid')
    const showClear = Boolean(
      this.value && !this.isDisabled && !this.isReadonly,
    )
    const describedBy = [
      this.description ? 'description' : '',
      this.errorMessage ? 'error' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return html`
      <div part="base">
        <label part="label" for="input">
          <slot name="label">${this.label}</slot>
        </label>

        <search part="search" role="search">
          <div
            part="input-container"
            ?data-invalid=${isInvalid}
            ?data-disabled=${this.isDisabled}
          >
            <span part="search-icon">${search()}</span>

            <input
              id="input"
              part="input"
              type="search"
              placeholder=${this.placeholder}
              .value=${this.value}
              ?disabled=${this.isDisabled}
              ?required=${this.isRequired}
              ?readonly=${this.isReadonly}
              aria-invalid=${isInvalid ? 'true' : 'false'}
              aria-describedby=${describedBy || nothing}
              @input=${this.handleInput}
              @change=${this.handleChange}
              @keydown=${this.handleKeyDown}
            />

            ${
              showClear
                ? html`
                  <button
                    type="button"
                    part="clear-btn"
                    aria-label="Clear search"
                    tabindex="-1"
                    @click=${this.clear}
                  >
                    ${clear()}
                  </button>
                `
                : ''
            }
          </div>
        </search>

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

defineElement('moul-search-field', MoulSearchField)

declare global {
  interface HTMLElementTagNameMap {
    'moul-search-field': MoulSearchField
  }
}
