import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { calendarNavNext, calendarNavPrev } from '../../utils/icons'
import { subtleAnimate } from '../../utils/motion'
import { calendarStyles } from './Calendar.styles'

export class MoulCalendar extends LitElement {
  static override styles = calendarStyles

  static override properties = {
    value: { type: String, reflect: true },
    locale: { type: String, reflect: true },
    minDate: { type: String, reflect: true, attribute: 'min-date' },
    maxDate: { type: String, reflect: true, attribute: 'max-date' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
  }

  declare value: string
  declare locale: string
  declare minDate: string
  declare maxDate: string
  declare isDisabled: boolean

  private viewYear: number
  private viewMonth: number // 0-11
  private focusedDate: string

  constructor() {
    super()
    this.value = ''
    this.locale = 'en-US'
    this.minDate = ''
    this.maxDate = ''
    this.isDisabled = false

    const now = new Date()
    this.viewYear = now.getFullYear()
    this.viewMonth = now.getMonth()
    this.focusedDate = this.formatDate(now)
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  private parseDate(str: string): Date | null {
    if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null
    const [y, m, d] = str.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return isNaN(date.getTime()) ? null : date
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (changedProperties.has('value') && this.value) {
      const parsed = this.parseDate(this.value)
      if (parsed) {
        this.viewYear = parsed.getFullYear()
        this.viewMonth = parsed.getMonth()
        this.focusedDate = this.value
      }
    }
  }

  public prevMonth(): void {
    if (this.isDisabled) return
    if (this.viewMonth === 0) {
      this.viewMonth = 11
      this.viewYear -= 1
    } else {
      this.viewMonth -= 1
    }
    this.requestUpdate()
    this.animateTransition(-1)
  }

  public nextMonth(): void {
    if (this.isDisabled) return
    if (this.viewMonth === 11) {
      this.viewMonth = 0
      this.viewYear += 1
    } else {
      this.viewMonth += 1
    }
    this.requestUpdate()
    this.animateTransition(1)
  }

  private animateTransition(dir: number): void {
    const body = this.renderRoot?.querySelector('tbody') as HTMLElement | null
    if (body) {
      subtleAnimate(
        body,
        { x: [dir * 12, 0], opacity: [0.3, 1] },
        { duration: 0.18 },
      )
    }
  }

  public selectDate(dateStr: string): void {
    if (this.isDisabled) return
    if (this.minDate && dateStr < this.minDate) return
    if (this.maxDate && dateStr > this.maxDate) return

    this.value = dateStr
    this.focusedDate = dateStr
    const parsed = this.parseDate(dateStr)
    if (parsed) {
      this.viewYear = parsed.getFullYear()
      this.viewMonth = parsed.getMonth()
    }

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleKeyDown = (event: KeyboardEvent, dateStr: string): void => {
    const current =
      this.parseDate(dateStr) || new Date(this.viewYear, this.viewMonth, 1)
    let nextDate: Date | null = null

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      nextDate = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate() + 1,
      )
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      nextDate = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate() - 1,
      )
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      nextDate = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate() + 7,
      )
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      nextDate = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate() - 7,
      )
    } else if (event.key === 'PageDown') {
      event.preventDefault()
      nextDate = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        current.getDate(),
      )
    } else if (event.key === 'PageUp') {
      event.preventDefault()
      nextDate = new Date(
        current.getFullYear(),
        current.getMonth() - 1,
        current.getDate(),
      )
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.selectDate(dateStr)
      return
    }

    if (nextDate) {
      const nextStr = this.formatDate(nextDate)
      this.focusedDate = nextStr
      this.viewYear = nextDate.getFullYear()
      this.viewMonth = nextDate.getMonth()
      this.requestUpdate()
      this.updateComplete.then(() => {
        const btn = this.renderRoot?.querySelector(
          `[data-date="${nextStr}"]`,
        ) as HTMLButtonElement | null
        btn?.focus()
      })
    }
  }

  private getWeekdayHeaders(): string[] {
    const format = new Intl.DateTimeFormat(this.locale || 'en-US', {
      weekday: 'narrow',
    })
    const days: string[] = []
    // 2023-01-01 is a Sunday
    for (let i = 1; i <= 7; i++) {
      days.push(format.format(new Date(2023, 0, i)))
    }
    return days
  }

  private getMonthTitle(): string {
    const date = new Date(this.viewYear, this.viewMonth, 1)
    return new Intl.DateTimeFormat(this.locale || 'en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  private generateDays(): Array<{
    dateStr: string
    dayNumber: number
    isOutside: boolean
    isDisabledDate: boolean
    isSelected: boolean
    isToday: boolean
  }> {
    const days: Array<{
      dateStr: string
      dayNumber: number
      isOutside: boolean
      isDisabledDate: boolean
      isSelected: boolean
      isToday: boolean
    }> = []

    const firstDayIndex = new Date(this.viewYear, this.viewMonth, 1).getDay()
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(this.viewYear, this.viewMonth, 0).getDate()
    const todayStr = this.formatDate(new Date())

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i
      const prevDate = new Date(this.viewYear, this.viewMonth - 1, d)
      const dateStr = this.formatDate(prevDate)
      const isDisabledDate =
        this.isDisabled ||
        Boolean(this.minDate && dateStr < this.minDate) ||
        Boolean(this.maxDate && dateStr > this.maxDate)

      days.push({
        dateStr,
        dayNumber: d,
        isOutside: true,
        isDisabledDate,
        isSelected: dateStr === this.value,
        isToday: dateStr === todayStr,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(this.viewYear, this.viewMonth, d)
      const dateStr = this.formatDate(curDate)
      const isDisabledDate =
        this.isDisabled ||
        Boolean(this.minDate && dateStr < this.minDate) ||
        Boolean(this.maxDate && dateStr > this.maxDate)

      days.push({
        dateStr,
        dayNumber: d,
        isOutside: false,
        isDisabledDate,
        isSelected: dateStr === this.value,
        isToday: dateStr === todayStr,
      })
    }

    // Next month padding to fill grid to multiple of 7 (up to 35 or 42)
    const totalSlots = days.length <= 35 ? 35 : 42
    const remaining = totalSlots - days.length
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(this.viewYear, this.viewMonth + 1, d)
      const dateStr = this.formatDate(nextDate)
      const isDisabledDate =
        this.isDisabled ||
        Boolean(this.minDate && dateStr < this.minDate) ||
        Boolean(this.maxDate && dateStr > this.maxDate)

      days.push({
        dateStr,
        dayNumber: d,
        isOutside: true,
        isDisabledDate,
        isSelected: dateStr === this.value,
        isToday: dateStr === todayStr,
      })
    }

    return days
  }

  protected override render() {
    const weekdayHeaders = this.getWeekdayHeaders()
    const days = this.generateDays()
    const weeks: Array<typeof days> = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return html`
      <div part="base">
        <div part="header">
          <button
            type="button"
            part="nav-btn nav-btn-prev"
            aria-label="Previous month"
            ?disabled=${this.isDisabled}
            @click=${this.prevMonth}
          >
            ${calendarNavPrev()}
          </button>

          <h2 part="heading" aria-live="polite">${this.getMonthTitle()}</h2>

          <button
            type="button"
            part="nav-btn nav-btn-next"
            aria-label="Next month"
            ?disabled=${this.isDisabled}
            @click=${this.nextMonth}
          >
            ${calendarNavNext()}
          </button>
        </div>

        <table part="grid" role="grid" aria-label="Calendar">
          <thead part="grid-header">
            <tr>
              ${weekdayHeaders.map(
                (w) => html`<th scope="col" aria-label=${w}>${w}</th>`,
              )}
            </tr>
          </thead>
          <tbody>
            ${weeks.map(
              (week) => html`
                <tr>
                  ${week.map((cell) => {
                    const isFocused = cell.dateStr === this.focusedDate
                    return html`
                      <td part="grid-cell" role="gridcell" aria-selected=${cell.isSelected ? 'true' : 'false'}>
                        <button
                          type="button"
                          part="day-btn"
                          data-date=${cell.dateStr}
                          data-selected=${cell.isSelected}
                          data-today=${cell.isToday}
                          data-outside=${cell.isOutside}
                          tabindex=${isFocused && !cell.isDisabledDate ? '0' : '-1'}
                          aria-disabled=${cell.isDisabledDate ? 'true' : 'false'}
                          ?disabled=${cell.isDisabledDate}
                          @click=${() => this.selectDate(cell.dateStr)}
                          @keydown=${(e: KeyboardEvent) => this.handleKeyDown(e, cell.dateStr)}
                        >
                          ${cell.dayNumber}
                        </button>
                      </td>
                    `
                  })}
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
    `
  }
}

defineElement('moul-calendar', MoulCalendar)

declare global {
  interface HTMLElementTagNameMap {
    'moul-calendar': MoulCalendar
  }
}
