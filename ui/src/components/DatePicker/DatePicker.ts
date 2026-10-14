import Datepicker from 'bootstrap/js/dist/datepicker.js'
import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { datePickerStyles } from './DatePicker.styles.js'

@customElement('moul-date-picker')
export class MoulDatePicker extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    datePickerStyles,
  ]

  @property({ type: String })
  accessor value = ''

  @property({ type: String })
  accessor label = ''

  @property({ type: String })
  accessor description = ''

  @property({ type: String, attribute: 'error-message' })
  accessor errorMessage = ''

  @property({ type: Boolean, attribute: 'is-invalid' })
  accessor isInvalid = false

  @property({ type: Boolean, attribute: 'is-disabled' })
  accessor isDisabled = false

  @property({ type: String })
  accessor min = ''

  @property({ type: String })
  accessor max = ''

  @property({ type: String })
  accessor locale = 'en'

  @property({ type: String })
  accessor placeholder = 'Select date'

  @property({ type: Number, attribute: 'first-weekday' })
  accessor firstWeekday = 0

  @property({ type: Object, attribute: 'vcp-options' })
  accessor vcpOptions: any = {}

  private _picker: any = null

  override connectedCallback() {
    super.connectedCallback()
    this.updateComplete.then(() => {
      this.initPicker()
    })
  }

  private initPicker() {
    const input = this.shadowRoot?.querySelector<HTMLInputElement>('#picker')
    if (!input) return

    this._picker?.dispose()
    this._picker = new Datepicker(input, {
      selectionMode: 'single',
      locale: this.locale,
      firstWeekday: this.firstWeekday as any,
      dateMin: (this.min as any) || null,
      dateMax: (this.max as any) || null,
      selectedDates: this.value ? [this.value] : [],
      inline: false,
      vcpOptions: this.vcpOptions || {},
    })

    input.addEventListener('change.bs.datepicker', () => {
      const dates = this._picker?.getSelectedDates() || []
      this.value = dates[0] || ''
      this.dispatchEvent(
        new CustomEvent('moul-change', {
          detail: { value: this.value, dates },
          bubbles: true,
          composed: true,
        }),
      )
    })
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    this._picker?.dispose()
    this._picker = null
  }

  override render() {
    return html`
      <div class="date-picker-container">
        ${this.label ? html`<label class="label">${this.label}</label>` : ''}
        <div class="input-wrapper">
          <input
            id="picker"
            type="text"
            class="form-control ${this.isInvalid ? 'is-invalid' : ''}"
            placeholder="${this.placeholder}"
            .value=${this.value}
            ?disabled=${this.isDisabled}
          />
          <span class="calendar-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </span>
        </div>
        ${this.description && !this.isInvalid ? html`<div class="description">${this.description}</div>` : ''}
        ${this.isInvalid && this.errorMessage ? html`<div class="error-message" role="alert">${this.errorMessage}</div>` : ''}
      </div>
    `
  }
}

@customElement('moul-date-range-picker')
export class MoulDateRangePicker extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    datePickerStyles,
  ]

  @property({ type: String, attribute: 'start-value' })
  accessor startValue = ''

  @property({ type: String, attribute: 'end-value' })
  accessor endValue = ''

  @property({ type: String })
  accessor label = ''

  @property({ type: String })
  accessor description = ''

  @property({ type: String, attribute: 'error-message' })
  accessor errorMessage = ''

  @property({ type: Boolean, attribute: 'is-invalid' })
  accessor isInvalid = false

  @property({ type: Boolean, attribute: 'is-disabled' })
  accessor isDisabled = false

  @property({ type: String })
  accessor min = ''

  @property({ type: String })
  accessor max = ''

  @property({ type: String })
  accessor locale = 'en'

  @property({ type: String })
  accessor placeholder = 'Select date range'

  @property({ type: Number, attribute: 'first-weekday' })
  accessor firstWeekday = 0

  @property({ type: Number, attribute: 'display-months-count' })
  accessor displayMonthsCount = 2

  @property({ type: Object, attribute: 'vcp-options' })
  accessor vcpOptions: any = {}

  private _picker: any = null

  override connectedCallback() {
    super.connectedCallback()
    this.updateComplete.then(() => {
      this.initPicker()
    })
  }

  private initPicker() {
    const input = this.shadowRoot?.querySelector<HTMLInputElement>('#picker')
    if (!input) return

    this._picker?.dispose()
    const selected: string[] = []
    if (this.startValue) selected.push(this.startValue)
    if (this.endValue) selected.push(this.endValue)

    this._picker = new Datepicker(input, {
      selectionMode: 'multiple-ranged',
      locale: this.locale,
      firstWeekday: this.firstWeekday as any,
      dateMin: (this.min as any) || null,
      dateMax: (this.max as any) || null,
      displayMonthsCount: this.displayMonthsCount as any,
      selectedDates: selected,
      inline: false,
      vcpOptions: this.vcpOptions || {},
    })

    input.addEventListener('change.bs.datepicker', () => {
      const dates = this._picker?.getSelectedDates() || []
      this.startValue = dates[0] || ''
      this.endValue = dates[1] || ''
      this.dispatchEvent(
        new CustomEvent('moul-change', {
          detail: {
            startValue: this.startValue,
            endValue: this.endValue,
            dates,
          },
          bubbles: true,
          composed: true,
        }),
      )
    })
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    this._picker?.dispose()
    this._picker = null
  }

  override render() {
    const displayValue =
      this.startValue && this.endValue
        ? `${this.startValue} - ${this.endValue}`
        : this.startValue || ''

    return html`
      <div class="date-picker-container">
        ${this.label ? html`<label class="label">${this.label}</label>` : ''}
        <div class="input-wrapper">
          <input
            id="picker"
            type="text"
            class="form-control ${this.isInvalid ? 'is-invalid' : ''}"
            placeholder="${this.placeholder}"
            .value=${displayValue}
            ?disabled=${this.isDisabled}
          />
          <span class="calendar-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </span>
        </div>
        ${this.description && !this.isInvalid ? html`<div class="description">${this.description}</div>` : ''}
        ${this.isInvalid && this.errorMessage ? html`<div class="error-message" role="alert">${this.errorMessage}</div>` : ''}
      </div>
    `
  }
}
