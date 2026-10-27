import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { defineElement } from '../../utils/define-element'
import { EASE_OUT, subtleAnimate } from '../../utils/motion'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import { textAreaStyles } from './TextArea.styles'

export class MoulTextArea extends LitElement {
  static override styles = textAreaStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true },
    rows: { type: Number, reflect: true },
    autoResize: { type: Boolean, reflect: true, attribute: 'auto-resize' },
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
  declare rows: number
  declare autoResize: boolean
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
    this.value = ''
    this.rows = 3
    this.autoResize = false
    this.placeholder = ''
    this.label = ''
    this.description = ''
    this.errorMessage = ''
    this.isDisabled = false
    this.isRequired = false
    this.isReadonly = false

    this.internalsController = new FormInternalsController(this)
  }

  public get textareaElement(): HTMLTextAreaElement | null {
    return this.renderRoot?.querySelector('textarea') ?? null
  }

  public override focus(options?: FocusOptions): void {
    this.textareaElement?.focus(options)
  }

  public override blur(): void {
    this.textareaElement?.blur()
  }

  public select(): void {
    this.textareaElement?.select()
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

  private adjustHeight(): void {
    if (!this.autoResize) return
    const textarea = this.textareaElement
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
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
    warnMissingLabel(this, 'text area', hasLabel)

    if (this.autoResize) {
      this.adjustHeight()
    }

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
    const textarea = event.target as HTMLTextAreaElement
    this.value = textarea.value
    this.syncFormValueAndValidity()
    this.adjustHeight()

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

  protected override render() {
    const isInvalid = this.hasAttribute('is-invalid')
    const describedBy = [
      this.description ? 'description' : '',
      this.errorMessage ? 'error' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return html`
      <div part="base">
        <label part="label" for="textarea">
          <slot name="label">${this.label}</slot>
        </label>

        <textarea
          id="textarea"
          part="textarea"
          rows=${this.rows}
          placeholder=${this.placeholder}
          .value=${this.value}
          ?disabled=${this.isDisabled}
          ?required=${this.isRequired}
          ?readonly=${this.isReadonly}
          aria-invalid=${isInvalid ? 'true' : 'false'}
          aria-describedby=${describedBy || nothing}
          @input=${this.handleInput}
          @change=${this.handleChange}
        ></textarea>

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

defineElement('moul-text-area', MoulTextArea)

declare global {
  interface HTMLElementTagNameMap {
    'moul-text-area': MoulTextArea
  }
}
