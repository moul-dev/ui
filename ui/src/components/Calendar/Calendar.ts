import Datepicker from 'bootstrap/js/dist/datepicker.js'
import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { calendarStyles } from './Calendar.styles.js'

@customElement('moul-calendar')
export class MoulCalendar extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    calendarStyles,
  ]

  @property({ type: String })
  accessor value = ''

  @property({ type: String, attribute: 'selection-mode' })
  accessor selectionMode: 'single' | 'multiple' | 'multiple-ranged' = 'single'

  @property({ type: String })
  accessor min = ''

  @property({ type: String })
  accessor max = ''

  @property({ type: String })
  accessor locale = 'en'

  @property({ type: Number, attribute: 'first-weekday' })
  accessor firstWeekday = 0

  @property({ type: Number, attribute: 'display-months-count' })
  accessor displayMonthsCount = 1

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
    const el = this.shadowRoot?.querySelector<HTMLElement>('#picker')
    if (!el) return

    this._picker?.dispose()
    this._picker = new Datepicker(el, {
      selectionMode: this.selectionMode,
      locale: this.locale,
      firstWeekday: this.firstWeekday as any,
      dateMin: (this.min as any) || null,
      dateMax: (this.max as any) || null,
      displayMonthsCount: this.displayMonthsCount as any,
      selectedDates: this.value ? [this.value] : [],
      inline: true,
      vcpOptions: this.vcpOptions || {},
    })

    el.addEventListener('change.bs.datepicker', () => {
      const dates = this._picker?.getSelectedDates() || []
      this.value = dates.join(',')
      this.dispatchEvent(
        new CustomEvent('moul-change', {
          detail: { dates, value: this.value },
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
      <div class="calendar-container">
        <div id="picker"></div>
      </div>
    `
  }
}

@customElement('moul-range-calendar')
export class MoulRangeCalendar extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    calendarStyles,
  ]

  @property({ type: String, attribute: 'start-value' })
  accessor startValue = ''

  @property({ type: String, attribute: 'end-value' })
  accessor endValue = ''

  @property({ type: String })
  accessor min = ''

  @property({ type: String })
  accessor max = ''

  @property({ type: String })
  accessor locale = 'en'

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
    const el = this.shadowRoot?.querySelector<HTMLElement>('#picker')
    if (!el) return

    this._picker?.dispose()
    const selected: string[] = []
    if (this.startValue) selected.push(this.startValue)
    if (this.endValue) selected.push(this.endValue)

    this._picker = new Datepicker(el, {
      selectionMode: 'multiple-ranged',
      locale: this.locale,
      firstWeekday: this.firstWeekday as any,
      dateMin: (this.min as any) || null,
      dateMax: (this.max as any) || null,
      displayMonthsCount: this.displayMonthsCount as any,
      selectedDates: selected,
      inline: true,
      vcpOptions: this.vcpOptions || {},
    })

    el.addEventListener('change.bs.datepicker', () => {
      const dates = this._picker?.getSelectedDates() || []
      this.startValue = dates[0] || ''
      this.endValue = dates[1] || ''
      this.dispatchEvent(
        new CustomEvent('moul-change', {
          detail: {
            dates,
            startValue: this.startValue,
            endValue: this.endValue,
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
    return html`
      <div class="calendar-container">
        <div id="picker"></div>
      </div>
    `
  }
}
