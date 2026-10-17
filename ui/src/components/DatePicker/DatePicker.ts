import { html, LitElement, type PropertyValues, svg } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import '../Calendar/Calendar'
import type { MoulCalendar } from '../Calendar/Calendar'
import { datePickerStyles } from './DatePicker.styles'

export class MoulDatePicker extends LitElement {
  static override styles = datePickerStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true },
    locale: { type: String, reflect: true },
    placeholder: { type: String, reflect: true },
    label: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isRequired: { type: Boolean, reflect: true, attribute: 'is-required' },
    minDate: { type: String, attribute: 'min-date' },
    maxDate: { type: String, attribute: 'max-date' },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
  }

  declare name: string
  declare value: string
  declare locale: string
  declare placeholder: string
  declare label: string
  declare isDisabled: boolean
  declare isRequired: boolean
  declare minDate: string
  declare maxDate: string
  declare isOpen: boolean

  public internalsController: FormInternalsController
  public overlayController: OverlayPresenceController

  constructor() {
    super()
    this.name = ''
    this.value = ''
    this.locale = 'en-US'
    this.placeholder = 'YYYY-MM-DD'
    this.label = ''
    this.isDisabled = false
    this.isRequired = false
    this.minDate = ''
    this.maxDate = ''
    this.isOpen = false

    this.internalsController = new FormInternalsController(this)
    this.overlayController = new OverlayPresenceController(this, {
      preset: 'popover',
      popover: () => this.popoverElement,
    })
  }

  public get inputElement(): HTMLInputElement | null {
    return this.renderRoot?.querySelector('input') ?? null
  }

  public get popoverElement(): HTMLElement | null {
    return this.renderRoot?.querySelector('[part="popover"]') ?? null
  }

  public get calendarElement(): MoulCalendar | null {
    return this.renderRoot?.querySelector('moul-calendar') ?? null
  }

  public override focus(options?: FocusOptions): void {
    this.inputElement?.focus(options)
  }

  public override blur(): void {
    this.inputElement?.blur()
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

  public open(): void {
    if (this.isDisabled || this.isOpen) return
    this.isOpen = true
    this.overlayController.setOpen(true)
  }

  public close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.overlayController.setOpen(false)
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (changedProperties.has('value') || changedProperties.has('isRequired')) {
      this.syncFormValueAndValidity()
    }

    if (changedProperties.has('isOpen')) {
      if (this.isOpen) {
        this.overlayController.setOpen(true)
      } else {
        this.overlayController.setOpen(false)
      }
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
    warnMissingLabel(this, 'date picker', hasLabel)
  }

  private syncFormValueAndValidity(): void {
    this.internalsController.setValue(this.value || null)

    if (this.isRequired && !this.value) {
      this.internalsController.setValidity(
        { valueMissing: true },
        'Please select a date.',
      )
      this.setAttribute('is-invalid', '')
    } else {
      this.internalsController.setValidity({})
      this.removeAttribute('is-invalid')
    }
  }

  public get formattedDisplayDate(): string {
    if (!this.value || !/^\d{4}-\d{2}-\d{2}$/.test(this.value))
      return this.value
    const [y, m, d] = this.value.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    if (isNaN(date.getTime())) return this.value

    try {
      return new Intl.DateTimeFormat(this.locale || 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date)
    } catch {
      return this.value
    }
  }

  private handleCalendarChange = (
    event: CustomEvent<{ value: string }>,
  ): void => {
    event.stopPropagation()
    this.value = event.detail.value
    this.syncFormValueAndValidity()
    this.close()
    this.focus()

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
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
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.isOpen) {
      event.preventDefault()
      this.close()
      this.focus()
    }
  }

  protected override render() {
    const isInvalid = this.hasAttribute('is-invalid')
    const display = this.formattedDisplayDate || this.value

    return html`
      <div part="base" @keydown=${this.handleKeyDown}>
        ${
          this.label
            ? html`<label part="label" for="input"><slot name="label">${this.label}</slot></label>`
            : html`<slot name="label"></slot>`
        }

        <div
          part="input-container"
          ?data-invalid=${isInvalid}
          ?data-disabled=${this.isDisabled}
        >
          <input
            id="input"
            part="input"
            type="text"
            placeholder=${this.placeholder}
            .value=${display}
            ?disabled=${this.isDisabled}
            ?required=${this.isRequired}
            aria-invalid=${isInvalid ? 'true' : 'false'}
            @input=${this.handleInput}
            @change=${this.handleChange}
          />

          <button
            type="button"
            part="trigger-btn"
            aria-label="Open calendar"
            aria-haspopup="dialog"
            aria-expanded=${this.isOpen ? 'true' : 'false'}
            tabindex="-1"
            ?disabled=${this.isDisabled}
            @click=${this.toggle}
          >
            ${svg`
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            `}
          </button>
        </div>

        <div
          part="popover"
          popover="auto"
          tabindex="-1"
          ?hidden=${!this.overlayController.isMounted}
        >
          <moul-calendar
            .value=${this.value}
            .locale=${this.locale}
            .minDate=${this.minDate}
            .maxDate=${this.maxDate}
            ?is-disabled=${this.isDisabled}
            @change=${this.handleCalendarChange}
          ></moul-calendar>
        </div>

        ${this.renderRoot ? html`<slot name="description"></slot><slot name="error"></slot>` : ''}
      </div>
    `
  }
}

defineElement('moul-date-picker', MoulDatePicker)

declare global {
  interface HTMLElementTagNameMap {
    'moul-date-picker': MoulDatePicker
  }
}
