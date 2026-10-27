import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { keyed } from 'lit/directives/keyed.js'
import { defineElement } from '../../utils/define-element'
import { type HeatmapDataItem, placeHoverCard } from '../ChartCommon'
import { heatmapChartStyles } from './HeatmapChart.styles'

export type HeatmapMode = 'calendar' | 'hour'

export interface HeatmapChartProps {
  data?: HeatmapDataItem[]
  mode?: HeatmapMode
  weeks?: number
  endDate?: string
  weekStart?: number
  unit?: string
  unitSingular?: string
  color?: string
  hideSummary?: boolean
  hideLegend?: boolean
  valueFormatter?: (value: number) => string
}

export interface HeatmapCell {
  row: number
  col: number
  value: number
  /** 0 (empty) through 4 (busiest). */
  level: number
  /** Day of the week, 0 = Sunday. */
  weekday: number
  /** The day, in calendar mode. */
  date?: Date
  /** Hour of the day (0–23), in hour mode. */
  hour?: number
  label: string
}

interface HeatModel {
  cells: HeatmapCell[]
  columns: number
  colLabels: { col: number; text: string }[]
  rowLabels: { row: number; text: string }[]
  total: number
  peak: HeatmapCell | null
  /** Cell index at `row * columns + col`; -1 for days after the end date. */
  lookup: Int32Array
}

const DAY_MS = 86_400_000
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
/** Weekdays that get a row label (Mon, Wed, Fri), like a contributions calendar. */
const LABELED_WEEKDAYS = new Set([1, 3, 5])
const LABELED_HOURS = [0, 6, 12, 18]
const MODEL_PROPS = [
  'data',
  'mode',
  'weeks',
  'endDate',
  'weekStart',
  'unit',
  'unitSingular',
]

/** Reads `'YYYY-MM-DD'` as a local day; anything else goes through `Date`. */
function toDate(input: unknown): Date | null {
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input
  }
  if (typeof input === 'string') {
    const match = DATE_ONLY.exec(input.trim())
    if (match) return new Date(+match[1], +match[2] - 1, +match[3])
  }
  if (typeof input !== 'string' && typeof input !== 'number') return null
  const date = new Date(input)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Days since 1970-01-01 for the local calendar day of `date`, immune to DST shifts. */
function dayIndex(date: Date): number {
  return Math.round(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS,
  )
}

function dayDate(index: number): Date {
  const utc = new Date(index * DAY_MS)
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate())
}

/** 1970-01-01 was a Thursday. */
function weekdayOf(index: number): number {
  return (((index + 4) % 7) + 7) % 7
}

/** Quartiles of the active (non-zero) values, so each level holds about a quarter of them. */
function levelThresholds(values: number[]): number[] {
  const active = values.filter((v) => v > 0).sort((a, b) => a - b)
  if (active.length === 0) return [0, 0, 0, 0]
  const at = (p: number) => active[Math.floor(p * (active.length - 1))]
  return [at(0.25), at(0.5), at(0.75), active[active.length - 1]]
}

function levelOf(value: number, [q1, q2, q3, max]: number[]): number {
  if (value <= 0) return 0
  if (value >= max) return 4
  if (value <= q1) return 1
  if (value <= q2) return 2
  if (value <= q3) return 3
  return 4
}

function singularOf(unit: string): string {
  if (/ies$/i.test(unit)) return unit.replace(/ies$/i, 'y')
  if (/[^s]s$/i.test(unit)) return unit.slice(0, -1)
  return unit
}

/**
 * A grid of days colored by how much happened on each: a year-long contributions
 * calendar, or (`mode="hour"`) a weekday × hour-of-day punch card built from the
 * same timestamps. Values sum per cell, so raw events (no `value`) count themselves.
 *
 * @fires point-hover - A cell is hovered or focused; `detail` carries its value and label.
 * @fires point-leave - The pointer or focus left the grid.
 * @csspart base - The wrapper around the summary, grid, and legend.
 * @csspart summary - The total and peak line above the grid.
 * @csspart total - The total, e.g. "1,376 contributions in the last year".
 * @csspart peak - The busiest cell.
 * @csspart grid - The cell grid.
 * @csspart cell - Each cell; `data-level` is 0–4.
 * @csspart legend - The "Less … More" scale.
 * @csspart tooltip - The hover readout.
 */
export class MoulHeatmapChart extends LitElement {
  static override styles = heatmapChartStyles

  static override properties = {
    data: { attribute: false },
    mode: { type: String, reflect: true },
    weeks: { type: Number },
    endDate: { type: String, attribute: 'end-date' },
    weekStart: { type: Number, attribute: 'week-start' },
    unit: { type: String },
    unitSingular: { type: String, attribute: 'unit-singular' },
    color: { type: String },
    hideSummary: { type: Boolean, reflect: true, attribute: 'hide-summary' },
    hideLegend: { type: Boolean, reflect: true, attribute: 'hide-legend' },
    valueFormatter: { attribute: false },
    activeIndex: { state: true },
    focusIndex: { state: true },
  }

  declare data: HeatmapDataItem[]
  declare mode: HeatmapMode
  /** Columns in calendar mode; the last one ends on `endDate`. */
  declare weeks: number
  /** Last day shown (`YYYY-MM-DD`); defaults to today. */
  declare endDate: string
  /** First row of each column: 0 = Sunday, 1 = Monday. */
  declare weekStart: number
  /** Plural noun for values, used in the summary and tooltip. */
  declare unit: string
  /** Defaults to `unit` without its plural ending. */
  declare unitSingular: string
  /** Base color of the ramp; levels mix it into the empty-cell track. */
  declare color: string
  declare hideSummary: boolean
  declare hideLegend: boolean
  declare valueFormatter?: (value: number) => string
  private declare activeIndex: number
  private declare focusIndex: number

  private model: HeatModel = {
    cells: [],
    columns: 0,
    colLabels: [],
    rowLabels: [],
    total: 0,
    peak: null,
    lookup: new Int32Array(0),
  }
  /** Keeps the readout's text while it fades out. */
  private lastShown: HeatmapCell | null = null
  private needsScrollToEnd = true

  constructor() {
    super()
    this.data = []
    this.mode = 'calendar'
    this.weeks = 53
    this.endDate = ''
    this.weekStart = 0
    this.unit = 'contributions'
    this.unitSingular = ''
    this.color = ''
    this.hideSummary = false
    this.hideLegend = false
    this.valueFormatter = undefined
    this.activeIndex = -1
    this.focusIndex = -1
  }

  /** The cell data currently rendered, newest last (for tests and custom readouts). */
  public get cells(): readonly Readonly<HeatmapCell>[] {
    return this.model.cells
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (!MODEL_PROPS.some((key) => changed.has(key))) return
    const modeChanged = changed.has('mode') || changed.has('weeks')
    this.model = this.buildModel()
    const count = this.model.cells.length
    if (modeChanged || this.focusIndex >= count || this.focusIndex < 0) {
      this.focusIndex = count - 1
    }
    if (modeChanged || this.activeIndex >= count) this.activeIndex = -1
    if (modeChanged) this.needsScrollToEnd = true
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    const scroller = this.renderRoot.querySelector<HTMLElement>('.scroller')
    // Wait for a laid-out scroller; a chart in a hidden panel tries again next update.
    if (this.needsScrollToEnd && scroller && scroller.clientWidth > 0) {
      // The newest days sit at the right; start there when the grid overflows.
      scroller.scrollLeft = scroller.scrollWidth
      this.needsScrollToEnd = false
      this.markClipped(scroller)
    }
    if (this.activeIndex >= 0) this.positionHoverCard()
  }

  /** Fades the left edge while earlier weeks are scrolled out of view. */
  private markClipped(scroller: HTMLElement): void {
    scroller.toggleAttribute('data-clipped', scroller.scrollLeft > 1)
  }

  private handleScroll = (event: Event): void => {
    this.markClipped(event.currentTarget as HTMLElement)
  }

  private get locale(): string | undefined {
    const lang = this.closest('[lang]')?.getAttribute('lang')
    if (!lang) return undefined
    try {
      return Intl.getCanonicalLocales(lang)[0]
    } catch {
      return undefined
    }
  }

  private formatValue(value: number): string {
    return this.valueFormatter
      ? this.valueFormatter(value)
      : new Intl.NumberFormat(this.locale).format(value)
  }

  private unitFor(value: number): string {
    if (value !== 1) return this.unit
    return this.unitSingular || singularOf(this.unit)
  }

  private valueText(value: number): string {
    return value === 0
      ? `No ${this.unit}`
      : `${this.formatValue(value)} ${this.unitFor(value)}`
  }

  private get periodText(): string {
    const weeks = this.columnCount
    return weeks >= 52 ? 'in the last year' : `in the last ${weeks} weeks`
  }

  private get columnCount(): number {
    const weeks = Math.round(Number(this.weeks))
    return Number.isFinite(weeks) && weeks > 0 ? weeks : 53
  }

  private buildModel(): HeatModel {
    const locale = this.locale
    const end = (this.endDate && toDate(this.endDate)) || new Date()
    const endIdx = dayIndex(end)
    const weekStart = Number(this.weekStart) === 1 ? 1 : 0
    const weeks = this.columnCount
    const lastColumnStart = endIdx - ((weekdayOf(endIdx) - weekStart + 7) % 7)
    const startIdx = lastColumnStart - (weeks - 1) * 7

    const byDay = new Map<number, number>()
    const byHour = new Float64Array(7 * 24)
    let total = 0
    for (const item of Array.isArray(this.data) ? this.data : []) {
      const date = toDate(item?.date)
      if (!date) continue
      const idx = dayIndex(date)
      if (idx < startIdx || idx > endIdx) continue
      const value = item.value === undefined ? 1 : Number(item.value)
      if (!Number.isFinite(value)) continue
      byDay.set(idx, (byDay.get(idx) ?? 0) + value)
      byHour[date.getDay() * 24 + date.getHours()] += value
      total += value
    }

    const weekdayName = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    // 1970-01-04 was a Sunday.
    const weekdayLabel = (weekday: number) =>
      weekdayName.format(new Date(1970, 0, 4 + weekday))
    const rowLabels: HeatModel['rowLabels'] = []
    for (let row = 0; row < 7; row++) {
      const weekday = (weekStart + row) % 7
      if (LABELED_WEEKDAYS.has(weekday)) {
        rowLabels.push({ row, text: weekdayLabel(weekday) })
      }
    }

    const cells: HeatmapCell[] = []
    let columns: number
    let colLabels: HeatModel['colLabels'] = []

    if (this.mode === 'hour') {
      columns = 24
      const hourName = new Intl.DateTimeFormat(locale, { hour: 'numeric' })
      const hourLabel = (hour: number) =>
        hourName.format(new Date(2000, 0, 1, hour))
      for (let col = 0; col < 24; col++) {
        for (let row = 0; row < 7; row++) {
          const weekday = (weekStart + row) % 7
          cells.push({
            row,
            col,
            weekday,
            hour: col,
            value: byHour[weekday * 24 + col],
            level: 0,
            label: `${weekdayLabel(weekday)}, ${hourLabel(col)} – ${hourLabel((col + 1) % 24)}`,
          })
        }
      }
      colLabels = LABELED_HOURS.map((hour) => ({
        col: hour,
        text: hourLabel(hour),
      }))
    } else {
      columns = weeks
      const dayName = new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      const monthName = new Intl.DateTimeFormat(locale, { month: 'short' })
      let previousMonth = -1
      for (let col = 0; col < weeks; col++) {
        const top = dayDate(startIdx + col * 7)
        // A month is labeled on the first column it fully starts.
        if (top.getMonth() !== previousMonth) {
          previousMonth = top.getMonth()
          colLabels.push({ col, text: monthName.format(top) })
        }
        for (let row = 0; row < 7; row++) {
          const idx = startIdx + col * 7 + row
          if (idx > endIdx) break
          const date = dayDate(idx)
          cells.push({
            row,
            col,
            weekday: date.getDay(),
            date,
            value: byDay.get(idx) ?? 0,
            level: 0,
            label: dayName.format(date),
          })
        }
      }
      // The first month is often a sliver; drop its label when the next one crowds it.
      if (colLabels.length > 1 && colLabels[1].col - colLabels[0].col < 3) {
        colLabels.shift()
      }
      // A label on the last column would hang past the grid.
      colLabels = colLabels.filter((label) => label.col <= weeks - 2)
    }

    const thresholds = levelThresholds(cells.map((cell) => cell.value))
    const lookup = new Int32Array(7 * columns).fill(-1)
    let peak: HeatmapCell | null = null
    cells.forEach((cell, index) => {
      cell.level = levelOf(cell.value, thresholds)
      lookup[cell.row * columns + cell.col] = index
      // Ties go to the most recent cell.
      if (cell.value > 0 && (!peak || cell.value >= peak.value)) peak = cell
    })

    return { cells, columns, colLabels, rowLabels, total, peak, lookup }
  }

  private cellAt(row: number, col: number): number {
    const { columns, lookup } = this.model
    if (row < 0 || row > 6 || col < 0 || col >= columns) return -1
    return lookup[row * columns + col]
  }

  private cellElement(index: number): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>(
      `.cell[data-index="${index}"]`,
    )
  }

  private activate(index: number): void {
    const cell = this.model.cells[index]
    if (!cell || index === this.activeIndex) return
    this.activeIndex = index
    this.lastShown = cell

    const el = this.cellElement(index)
    const rect = el?.getBoundingClientRect()
    const box = this.getBoundingClientRect()
    this.dispatchEvent(
      new CustomEvent('point-hover', {
        bubbles: true,
        composed: true,
        detail: {
          point: {
            date: cell.date,
            weekday: cell.weekday,
            hour: cell.hour,
            level: cell.level,
            value: cell.value,
          },
          value: cell.value,
          label: cell.label,
          x: rect ? Math.round(rect.left + rect.width / 2 - box.left) : 0,
          y: rect ? Math.round(rect.top - box.top) : 0,
        },
      }),
    )
  }

  private deactivate(): void {
    if (this.activeIndex < 0) return
    this.activeIndex = -1
    this.dispatchEvent(
      new CustomEvent('point-leave', { bubbles: true, composed: true }),
    )
  }

  private positionHoverCard(): void {
    const card = this.renderRoot.querySelector<HTMLElement>('.hover-card')
    const frame = this.renderRoot.querySelector<HTMLElement>('.frame')
    const cell = this.cellElement(this.activeIndex)
    if (card && frame && cell) {
      placeHoverCard(card, frame, cell.getBoundingClientRect())
    }
  }

  private handlePointerOver = (event: PointerEvent): void => {
    const cell = (event.target as Element | null)?.closest?.<HTMLElement>(
      '.cell',
    )
    if (cell) this.activate(Number(cell.dataset.index))
  }

  private handlePointerLeave = (): void => {
    if (!this.matches(':focus-within')) this.deactivate()
  }

  private handleFocusIn = (event: FocusEvent): void => {
    const cell = (event.target as Element | null)?.closest?.<HTMLElement>(
      '.cell',
    )
    if (!cell) return
    const index = Number(cell.dataset.index)
    this.focusIndex = index
    this.activate(index)
  }

  private handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null
    if (!next || !this.renderRoot.contains(next)) this.deactivate()
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const current = this.model.cells[this.focusIndex]
    if (!current) return
    let { row, col } = current
    const lastCol = this.model.columns - 1
    switch (event.key) {
      case 'ArrowRight':
        col += 1
        break
      case 'ArrowLeft':
        col -= 1
        break
      case 'ArrowDown':
        row += 1
        break
      case 'ArrowUp':
        row -= 1
        break
      case 'Home':
        col = 0
        break
      case 'End':
        col = lastCol
        break
      default:
        return
    }
    event.preventDefault()
    let next = this.cellAt(row, col)
    // The newest column may stop short of this row; End lands on its last day.
    while (next < 0 && event.key === 'End' && col > 0) {
      col -= 1
      next = this.cellAt(row, col)
    }
    if (next < 0) return
    this.focusIndex = next
    this.updateComplete.then(() => this.cellElement(next)?.focus())
  }

  private renderSummary() {
    const { total, peak } = this.model
    return html`
      <div part="summary" class="summary">
        <p part="total" class="total">
          ${this.formatValue(total)} ${this.unitFor(total)} ${this.periodText}
        </p>
        ${
          peak
            ? html`<p part="peak" class="peak">
                Peak ${peak.label} · ${this.formatValue(peak.value)}
              </p>`
            : nothing
        }
      </div>
    `
  }

  private renderGrid() {
    const { cells, columns, colLabels, rowLabels } = this.model
    const rows = Array.from(
      { length: 7 },
      (): { cell: HeatmapCell; index: number }[] => [],
    )
    cells.forEach((cell, index) => {
      rows[cell.row].push({ cell, index })
    })
    const unitName = this.unit.charAt(0).toUpperCase() + this.unit.slice(1)

    return html`
      <div class="plot-body" style="--_cols: ${columns}">
        <div class="days" aria-hidden="true">
          ${rowLabels.map(
            (label) =>
              html`<span class="row-label" style="grid-row: ${label.row + 2}">${label.text}</span>`,
          )}
        </div>
        <div part="scroller" class="scroller" @scroll=${this.handleScroll}>
          <div
            part="grid"
            class="grid"
            role="grid"
            aria-label="${unitName} by ${this.mode === 'hour' ? 'hour of day' : 'day'}"
            @pointerover=${this.handlePointerOver}
            @pointerleave=${this.handlePointerLeave}
            @focusin=${this.handleFocusIn}
            @focusout=${this.handleFocusOut}
            @keydown=${this.handleKeyDown}
          >
            ${colLabels.map(
              (label) =>
                html`<span class="col-label" aria-hidden="true" style="grid-column: ${label.col + 1}">${label.text}</span>`,
            )}
            ${rows.map(
              (row) => html`
                <div role="row" class="row">
                  ${row.map(
                    ({ cell, index }) => html`
                      <div
                        role="gridcell"
                        part="cell"
                        class="cell"
                        data-index=${index}
                        data-level=${cell.level}
                        tabindex=${index === this.focusIndex ? 0 : -1}
                        aria-label="${this.valueText(cell.value)}, ${cell.label}"
                        style="grid-area: ${cell.row + 2} / ${cell.col + 1}; --_c: ${cell.col}"
                      ></div>
                    `,
                  )}
                </div>
              `,
            )}
          </div>
        </div>
      </div>
    `
  }

  private renderLegend() {
    return html`
      <div part="legend" class="legend" aria-hidden="true">
        <span>Less</span>
        <span class="legend-scale">
          ${[0, 1, 2, 3, 4].map(
            (level) => html`<span class="swatch" data-level=${level}></span>`,
          )}
        </span>
        <span>More</span>
      </div>
    `
  }

  protected override render() {
    const shown =
      this.activeIndex >= 0 ? this.model.cells[this.activeIndex] : null
    const readout = shown ?? this.lastShown

    return html`
      <div
        part="base"
        class="frame"
        style=${this.color ? `--_heat: ${this.color}` : ''}
      >
        ${this.hideSummary ? nothing : this.renderSummary()}
        <div class="plot">${keyed(this.mode, this.renderGrid())}</div>
        ${this.hideLegend ? nothing : this.renderLegend()}
        <div
          part="tooltip"
          class="hover-card"
          aria-hidden="true"
          ?data-open=${!!shown}
        >
          ${
            readout
              ? html`
                <span class="hover-card-value">${this.valueText(readout.value)}</span>
                <span class="hover-card-label">${readout.label}</span>
              `
              : nothing
          }
        </div>
      </div>
    `
  }
}

defineElement('moul-heatmap-chart', MoulHeatmapChart)

export { MoulHeatmapChart as HeatmapChart }

declare global {
  interface HTMLElementTagNameMap {
    'moul-heatmap-chart': MoulHeatmapChart
  }
}
