import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { PlaceholderCycleController } from '../../controllers/placeholder-cycle.controller'
import { defineElement } from '../../utils/define-element'
import {
  findImplicitSubmissionForm,
  type ImplicitSubmissionForm,
  submitOnEnter,
} from '../../utils/implicit-submission'
import { EASE_OUT, subtleAnimate } from '../../utils/motion'
import { scatterText } from '../../utils/scatter-text'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import { textFieldStyles } from './TextField.styles'

export type TextFieldType = 'text' | 'email' | 'password' | 'tel' | 'url'

/**
 * A form-associated single-line text input (`type` text, email, password,
 * tel or url) with a label, an optional description and error message,
 * prefix and suffix slots, and `is-required` validation. Give it
 * `placeholders` to rotate the placeholder through several hints, each
 * sliding up as the next arrives, every `placeholder-interval` milliseconds
 * while the field is empty. `vanish()` scatters the typed text into drifting
 * letters and clears the field; with `vanish-on-submit` that happens each
 * time its form submits, after the form has read the value.
 *
 * Keyboard and screen readers: focus goes to a native `<input>` in the shadow
 * root (the host's `focus()` forwards there), so it types, selects and
 * autofills like any text box. `Enter` submits the enclosing `<form>` or
 * `<moul-form>` as a native input would: it clicks the first submit button,
 * or submits a form whose only text field this is. The input is named by a
 * `<label for>` holding the `label` attribute or `label` slot,
 * `aria-describedby` points at the `description` and `error-message` text
 * when they are set, and `aria-invalid` is true while an `is-required` field
 * is empty. Rotating hints are drawn over the input and hidden from screen
 * readers, which hear one stable placeholder instead: `placeholder`, or else
 * the first hint. The scattering letters are hidden too; the field is
 * already empty when they start.
 *
 * Reduced motion: the error message appears in place instead of sliding down
 * 4px, and hover and focus colours change without fading. Rotating hints
 * swap in place without sliding, and `vanish()` clears the field at once
 * without scattering the letters.
 *
 * @csspart placeholder - The rotating hint drawn over an empty input when `placeholders` is set.
 */
export class MoulTextField extends LitElement {
  static override styles = textFieldStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true },
    type: { type: String, reflect: true },
    placeholder: { type: String, reflect: true },
    label: { type: String, reflect: true },
    description: { type: String, reflect: true },
    errorMessage: { type: String, reflect: true, attribute: 'error-message' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isRequired: { type: Boolean, reflect: true, attribute: 'is-required' },
    isReadonly: { type: Boolean, reflect: true, attribute: 'is-readonly' },
    placeholders: { attribute: false },
    placeholderInterval: { type: Number, attribute: 'placeholder-interval' },
    vanishOnSubmit: {
      type: Boolean,
      reflect: true,
      attribute: 'vanish-on-submit',
    },
  }

  declare name: string
  declare value: string
  declare type: TextFieldType
  declare placeholder: string
  declare label: string
  declare description: string
  declare errorMessage: string
  declare isDisabled: boolean
  declare isRequired: boolean
  declare isReadonly: boolean
  /** Hints the placeholder rotates through while the field is empty. */
  declare placeholders: string[]
  /** Milliseconds each hint stays; at least 1000. */
  declare placeholderInterval: number
  /** Scatter the text and clear the field each time its form submits. */
  declare vanishOnSubmit: boolean

  public internalsController: FormInternalsController
  private readonly hints = new PlaceholderCycleController(this, {
    hints: () => (Array.isArray(this.placeholders) ? this.placeholders : []),
    interval: () => this.placeholderInterval,
    isIdle: () => !!this.value,
  })
  /** The form whose `submit` this field listens to for `vanish-on-submit`. */
  private watchedForm: ImplicitSubmissionForm | null = null

  constructor() {
    super()
    this.name = ''
    this.value = ''
    this.type = 'text'
    this.placeholder = ''
    this.label = ''
    this.description = ''
    this.errorMessage = ''
    this.isDisabled = false
    this.isRequired = false
    this.isReadonly = false
    this.placeholders = []
    this.placeholderInterval = 3000
    this.vanishOnSubmit = false

    this.internalsController = new FormInternalsController(this)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.watchForm(null)
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

  /**
   * Scatters the typed text into drifting letters and clears the field,
   * firing `input`. Resolves when the letters are gone. A password scatters
   * as dots. Under reduced motion the field clears at once.
   */
  public async vanish(): Promise<void> {
    const text = this.value
    if (!text) return
    const input = this.inputElement
    const scrollLeft = input?.scrollLeft ?? 0
    this.value = ''
    this.syncFormValueAndValidity()
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
    const layer = this.renderRoot?.querySelector<HTMLElement>('.vanish-layer')
    if (!layer) return
    await scatterText(layer, text, {
      isMasked: this.type === 'password',
      scrollLeft,
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
    warnMissingLabel(this, 'text field', hasLabel)

    this.watchForm(
      this.vanishOnSubmit
        ? findImplicitSubmissionForm(this, this.internalsController.form)
        : null,
    )

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

  private watchForm(form: ImplicitSubmissionForm | null): void {
    if (form === this.watchedForm) return
    this.watchedForm?.removeEventListener('submit', this.handleFormSubmit)
    this.watchedForm = form
    form?.addEventListener('submit', this.handleFormSubmit)
  }

  /** Waits until every `submit` listener, and the browser, has read the value. */
  private readonly handleFormSubmit = (): void => {
    setTimeout(() => {
      void this.vanish()
    })
  }

  private syncFormValueAndValidity(): void {
    this.internalsController.setValue(this.value)

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
    submitOnEnter(
      event,
      findImplicitSubmissionForm(this, this.internalsController.form),
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
        <label part="label" for="input">
          <slot name="label">${this.label}</slot>
        </label>

        <div
          part="input-container"
          ?data-invalid=${isInvalid}
          ?data-disabled=${this.isDisabled}
        >
          <span part="prefix"><slot name="prefix"></slot></span>
          <span class="input-wrap">
          <input
            id="input"
            part="input"
            type=${this.type}
            placeholder=${this.placeholder || (this.placeholders?.[0] ?? '')}
            ?data-cycling=${this.hints.isActive}
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
          ${this.hints.render(!!this.value)}
          <span class="vanish-layer" aria-hidden="true"></span>
          </span>
          <span part="suffix"><slot name="suffix"></slot></span>
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

defineElement('moul-text-field', MoulTextField)

declare global {
  interface HTMLElementTagNameMap {
    'moul-text-field': MoulTextField
  }
}
