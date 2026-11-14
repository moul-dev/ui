import { scaleLinear, scalePoint } from 'd3-scale'
import {
  type CurveFactory,
  curveLinear,
  curveMonotoneX,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
  line,
} from 'd3-shape'
import { html, LitElement, nothing, type PropertyValues, svg } from 'lit'
import { type AnimationPlaybackControls, animate } from 'motion'

import { LayoutIndicatorController } from '../../controllers/layout-indicator.controller'
import { defineElement } from '../../utils/define-element'
import {
  CHART_EASE,
  prefersReducedMotion,
  subtleAnimate,
} from '../../utils/motion'
import {
  axisLabelStride,
  type ChartSeries,
  getChartColor,
  type PointHoverDetail,
  type PointHoverEntry,
} from '../ChartCommon'
import {
  ChartScrubController,
  plotPosition,
  scrubValueText,
} from '../ChartScrub'
import { lineChartStyles } from './LineChart.styles'

export interface LineChartProps {
  data?: Record<string, unknown>[]
  xKey?: string
  series?: ChartSeries[]
  height?: number
  showGrid?: boolean
  curve?: string
  scrub?: boolean
  label?: string
  isLive?: boolean
  isPaused?: boolean
  maxPoints?: number
  valueFormatter?: (value: any) => string
}

export interface ActivePointState {
  seriesKey: string
  index: number
}

export interface LineChartPauseChangeDetail {
  isPaused: boolean
}

type Row = Record<string, unknown>

/** One series as drawn: its value and height at every drawn row. */
interface LineLayer {
  series: ChartSeries
  color: string
  /** The value at each row, or null where there is none. */
  values: (number | null)[]
  /** The y of each row, in user units, or null where there is no value. */
  ys: (number | null)[]
}

interface LineGeometry {
  width: number
  height: number
  padding: { top: number; right: number; bottom: number; left: number }
  rows: Row[]
  /** The x of each row, in user units. */
  xs: number[]
  labels: string[]
  layers: LineLayer[]
}

/** Dropped rows kept left of the plot, so the line stays whole while it glides. */
const TRAIL = 8

function resolveCurveFactory(curveName: string): CurveFactory {
  switch (curveName) {
    case 'linear':
      return curveLinear
    case 'natural':
      return curveNatural
    case 'step':
      return curveStep
    case 'stepAfter':
      return curveStepAfter
    case 'stepBefore':
      return curveStepBefore
    default:
      return curveMonotoneX
  }
}

const toNumber = (raw: unknown): number | null => {
  if (raw === null || raw === undefined) return null
  const num = Number(raw)
  return Number.isFinite(num) ? num : null
}

const defaultFormat = (value: unknown): string =>
  typeof value === 'number' ? value.toLocaleString() : String(value ?? '')

/**
 * A line chart of one or more numeric series over shared categories, with a
 * dot on every point and a D3 `curve` (`monotoneX` by default, or `linear`,
 * `natural`, `step`, `stepAfter`, `stepBefore`). Each `data` row is one point
 * along x (labelled by its `x-key` field, `name` by default). Dragging or
 * hovering across the plot scrubs it: a guide snaps to the nearest category,
 * a dot marks every series there, and `point-hover` fires with the values so
 * a page can show a `<moul-chart-tooltip>`. With `is-live` it becomes a
 * real-time chart: `push()` appends readings, `max-points` keeps the latest
 * ones, the line glides left as each arrives, and a pause button (or
 * `is-paused`) freezes the view while readings keep arriving.
 *
 * Keyboard and screen readers: with scrubbing on (the default) the plot is
 * one tab stop exposed as a `role="slider"` named by `label` ("Line chart" by
 * default). Keyboard focus shows the latest category; `Arrow Left` or
 * `Arrow Down` and `Arrow Right` or `Arrow Up` step through the categories,
 * `Home` and `End` jump to the first and last, and `Escape` or leaving focus
 * hides the guide. `aria-valuetext` reads the category and every series'
 * value through `valueFormatter`, e.g. "10:42: CPU 61%, Memory 48%", and each
 * step fires `point-hover` as the pointer does. In live mode the pause button
 * is a native `<button>` after the plot in tab order, named "Pause live
 * updates" with `aria-pressed`; `Enter` or `Space` toggles it. New readings
 * are not announced. With `scrub="false"` nothing in the plot takes focus,
 * the per-point values are surfaced only by hovering a dot, and the SVG is one
 * `role="img"` named by `label`; give the page a text or table alternative.
 *
 * Reduced motion: on first render the lines fade in over 350ms; under reduced
 * motion they appear at once. In live mode the line glides left between
 * readings, and jumps to each new reading under reduced motion; the pulse on
 * the newest point stops. The scrub guide and dots glide between categories
 * and fade in, and move at once under reduced motion. A hovered dot grows
 * from a 4px to a 6px radius, smoothly normally and instantly under reduced
 * motion.
 *
 * @slot empty - Shown instead of the chart when `data` is empty.
 * @fires point-hover - A dot is hovered or a category scrubbed; `detail` has its value, label, `index` and every series' value in `entries`.
 * @fires point-leave - The pointer left a dot or the chart, or the scrub stopped.
 * @fires pausechange - The user pressed the live pause button; `detail.isPaused` is the new state.
 * @csspart container - The plot box; the slider when scrubbing is on.
 * @csspart line - Each series' line.
 * @csspart point - Each dot (not drawn in live mode).
 * @csspart grid - The grid lines.
 * @csspart track - The group that glides left in live mode.
 * @csspart head - The pulsing dot on each series' newest point in live mode.
 * @csspart pause-button - The live pause and resume button.
 * @csspart scrub-guide - The vertical guide at the scrubbed category.
 * @csspart scrub-dot - The dot marking each series at the scrubbed category.
 */
export class MoulLineChart extends LitElement {
  static override styles = lineChartStyles

  static override properties = {
    data: { attribute: false },
    xKey: { type: String, attribute: 'x-key' },
    series: { attribute: false },
    height: { type: Number },
    showGrid: {
      type: Boolean,
      attribute: 'show-grid',
      converter: {
        fromAttribute: (val: string | null) => val !== null && val !== 'false',
        toAttribute: (val: boolean) => (val ? '' : null),
      },
    },
    curve: { type: String },
    scrub: {
      type: Boolean,
      converter: {
        fromAttribute: (val: string | null) => val !== 'false',
        toAttribute: (val: boolean) => (val ? null : 'false'),
      },
    },
    label: { type: String },
    isLive: { type: Boolean, reflect: true, attribute: 'is-live' },
    isPaused: { type: Boolean, reflect: true, attribute: 'is-paused' },
    maxPoints: { type: Number, attribute: 'max-points' },
    valueFormatter: { attribute: false },
  }

  declare data: Row[]
  declare xKey: string
  declare series: ChartSeries[]
  declare height: number
  declare showGrid: boolean
  declare curve: string
  /** Scrub the plot with the pointer and the keyboard; `scrub="false"` turns it off. */
  declare scrub: boolean
  /** The chart's accessible name. Defaults to "Line chart". */
  declare label: string
  /** Real-time mode: right-aligned readings that glide left, no dots, and a pause button. */
  declare isLive: boolean
  /** Freeze the drawn data; readings pushed meanwhile show when it resumes. */
  declare isPaused: boolean
  /** The most rows `push()` keeps, dropping the oldest; 0 keeps them all. Live mode glides once it is set. */
  declare maxPoints: number
  declare valueFormatter?: (value: any) => string

  public layout: LayoutIndicatorController
  private activePoint: ActivePointState | null = null
  private chartId = Math.random().toString(36).slice(2, 9)

  private readonly scrubber = new ChartScrubController(this, {
    count: () => this.geometry?.xs.length ?? 0,
    xAt: (index) => this.geometry?.xs[index] ?? 0,
    viewSize: () => ({
      width: this.geometry?.width ?? 0,
      height: this.geometry?.height ?? 0,
    }),
    onChange: (index, pointerY) => this.hoverColumn(index, { pointerY }),
  })

  private geometry: LineGeometry | null = null
  private lastHover: string | null = null
  private lastSeriesKey: string | null = null
  /** The rows on screen while the view is frozen (paused, or scrubbing a live chart). */
  private frozenRows: Row[] | null = null
  /** Rows `push()` dropped most recently, drawn left of the plot while it glides. */
  private trail: Row[] = []
  /** How many rows have been dropped since `data` was last set, so live labels keep their rhythm. */
  private dropped = 0
  private isPushing = false
  private glide: AnimationPlaybackControls | null = null
  private glideOffset = 0
  private lastPushAt = 0
  /** The distance between two live readings, in user units, as last drawn. */
  private liveStep = 0

  constructor() {
    super()
    this.data = []
    this.xKey = 'name'
    this.series = []
    this.height = 300
    this.showGrid = true
    this.curve = 'monotoneX'
    this.scrub = true
    this.label = ''
    this.isLive = false
    this.isPaused = false
    this.maxPoints = 0
    this.valueFormatter = undefined

    this.layout = new LayoutIndicatorController(this, {
      observeDimensions: true,
    })
  }

  public get containerWidth(): number {
    return this.layout.width > 0
      ? this.layout.width
      : this.clientWidth > 0
        ? this.clientWidth
        : 600
  }

  public get containerHeight(): number {
    return this.height > 0 ? this.height : 300
  }

  /**
   * Appends one reading or several to `data`, dropping the oldest beyond
   * `max-points`. In live mode the line glides left to make room, over the
   * time since the previous push (at most a second), so a steady feed scrolls
   * smoothly. While paused the readings are kept and drawn on resume.
   */
  public push(rows: Row | Row[]): void {
    const added = (Array.isArray(rows) ? rows : [rows]).filter(
      (row): row is Row => !!row && typeof row === 'object',
    )
    if (added.length === 0) return
    let next = [...(Array.isArray(this.data) ? this.data : []), ...added]
    let dropped: Row[] = []
    const max = Math.floor(Number(this.maxPoints))
    if (max > 0 && next.length > max) {
      dropped = next.slice(0, next.length - max)
      next = next.slice(next.length - max)
    }
    this.trail = [...this.trail, ...dropped].slice(-TRAIL)
    this.dropped += dropped.length
    this.isPushing = true
    this.data = next
    this.glideBy(added.length)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopGlide()
  }

  private get isScrubbing(): boolean {
    return this.scrub && !!this.geometry && this.geometry.xs.length > 0
  }

  private get shouldFreeze(): boolean {
    return this.isPaused || (this.isLive && this.scrubber.index !== null)
  }

  protected override willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps)
    if (changedProps.has('data') && !this.isPushing) {
      // Data set from outside starts a new feed.
      this.trail = []
      this.dropped = 0
      this.stopGlide()
    }
    this.isPushing = false
    if (this.shouldFreeze && !this.frozenRows) {
      this.frozenRows = Array.isArray(this.data) ? [...this.data] : []
      this.stopGlide()
    } else if (!this.shouldFreeze && this.frozenRows) {
      // Resuming catches up on everything pushed while frozen.
      this.frozenRows = null
    }
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (
      changedProps.has('data') ||
      changedProps.has('series') ||
      changedProps.has('curve')
    ) {
      this.animatePaths()
      // A scrub in progress keeps its column and reports the new values.
      const index = this.scrubber.index
      if (index !== null && !this.frozenRows) {
        if (!this.isScrubbing || index >= (this.geometry?.xs.length ?? 0)) {
          this.scrubber.set(null)
        } else {
          this.lastHover = null
          this.hoverColumn(index)
        }
      }
    }
    if (changedProps.has('scrub') && !this.scrub) this.scrubber.set(null)
    this.applyGlide()
  }

  /** Charts fade in once; later data updates (often live) re-render in place. */
  private hasPlayedEntrance = false

  private animatePaths(): void {
    if (this.hasPlayedEntrance || prefersReducedMotion()) return

    const paths =
      this.renderRoot?.querySelectorAll<SVGPathElement>('.series-path')
    if (paths && paths.length > 0) {
      this.hasPlayedEntrance = true
      subtleAnimate(
        paths,
        { opacity: [0, 1] },
        { duration: 0.35, ease: CHART_EASE },
      )
    }
  }

  /** Starts the live track `count` readings to the right and glides it home. */
  private glideBy(count: number): void {
    const now = typeof performance !== 'undefined' ? performance.now() : 0
    const gap = this.lastPushAt ? now - this.lastPushAt : 400
    this.lastPushAt = now
    const canGlide =
      this.isLive &&
      Math.floor(Number(this.maxPoints)) > 0 &&
      this.liveStep > 0 &&
      this.hasUpdated &&
      !this.shouldFreeze &&
      !prefersReducedMotion()
    if (!canGlide) {
      this.stopGlide()
      return
    }
    const from = Math.min(
      this.glideOffset + count * this.liveStep,
      TRAIL * this.liveStep,
    )
    this.glide?.stop()
    this.glideOffset = from
    const glide = animate(from, 0, {
      duration: Math.min(Math.max(gap, 120), 1000) / 1000,
      ease: 'linear',
      onUpdate: (offset: number) => {
        this.glideOffset = offset
        this.applyGlide()
      },
    })
    this.glide = glide
    const settle = (): void => {
      if (this.glide !== glide) return
      this.glide = null
      this.glideOffset = 0
      this.applyGlide()
    }
    glide.finished.then(settle, settle)
  }

  private stopGlide(): void {
    this.glide?.stop()
    this.glide = null
    this.glideOffset = 0
    this.applyGlide()
  }

  /** Writes the glide offset straight onto the track, so a frame of motion costs no render. */
  private applyGlide(): void {
    const track = this.renderRoot?.querySelector('.live-track')
    if (!track) return
    if (this.glideOffset) {
      track.setAttribute(
        'transform',
        `translate(${this.glideOffset.toFixed(2)} 0)`,
      )
    } else {
      track.removeAttribute('transform')
    }
  }

  private getActiveSeries(): ChartSeries[] {
    if (this.series && this.series.length > 0) {
      return this.series
    }

    if (!this.data || this.data.length === 0) {
      return []
    }

    const firstItem = this.data[0] || {}
    return Object.keys(firstItem)
      .filter((key) => key !== this.xKey)
      .filter((key) => {
        const val = firstItem[key]
        const num = typeof val === 'number' ? val : Number(val)
        return (
          (typeof val === 'number' ||
            (typeof val === 'string' && val.trim() !== '')) &&
          Number.isFinite(num)
        )
      })
      .map((key, idx) => ({
        key,
        name: key,
        color: getChartColor(idx),
      }))
  }

  private format(value: unknown): string {
    return this.valueFormatter
      ? this.valueFormatter(value)
      : defaultFormat(value)
  }

  private entriesAt(index: number): PointHoverEntry[] {
    return (this.geometry?.layers ?? []).map((layer) => ({
      key: layer.series.key,
      name: layer.series.name ?? layer.series.key,
      value: layer.values[index] ?? null,
      color: layer.color,
    }))
  }

  /**
   * Reports the scrubbed column: fires `point-hover` for the series nearest
   * the pointer (or `seriesKey`, or the last one reported), or `point-leave`
   * when `index` is null. Moves within one column and series stay quiet.
   */
  private hoverColumn(
    index: number | null,
    pick: { pointerY?: number | null; seriesKey?: string } = {},
  ): void {
    const geometry = this.geometry
    if (index === null || !geometry) {
      if (this.lastHover !== null) {
        this.lastHover = null
        this.dispatchLeave()
      }
      return
    }
    const layers = geometry.layers.filter(
      (layer) => layer.ys[index] !== null && layer.ys[index] !== undefined,
    )
    if (layers.length === 0) return
    let layer: LineLayer | undefined
    if (pick.seriesKey) {
      layer = layers.find((l) => l.series.key === pick.seriesKey)
    } else if (pick.pointerY != null) {
      const y = pick.pointerY
      layer = layers.reduce((best, l) =>
        Math.abs((l.ys[index] ?? 0) - y) < Math.abs((best.ys[index] ?? 0) - y)
          ? l
          : best,
      )
    } else {
      layer = layers.find((l) => l.series.key === this.lastSeriesKey)
    }
    layer ??= layers[0] as LineLayer
    const key = `${index}:${layer.series.key}`
    if (key === this.lastHover) return
    this.lastHover = key
    this.lastSeriesKey = layer.series.key
    const row = geometry.rows[index] ?? {}
    this.dispatchHover({
      point: row,
      series: layer.series,
      value: row[layer.series.key],
      label: geometry.labels[index] ?? '',
      x: geometry.xs[index] ?? 0,
      y: layer.ys[index] ?? 0,
      index,
      entries: this.entriesAt(index),
    })
  }

  private dispatchHover(detail: PointHoverDetail): void {
    this.dispatchEvent(
      new CustomEvent<PointHoverDetail>('point-hover', {
        bubbles: true,
        composed: true,
        detail,
      }),
    )
  }

  private dispatchLeave(): void {
    this.dispatchEvent(
      new CustomEvent('point-leave', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handlePointEnter(
    item: Row,
    seriesItem: ChartSeries,
    cx: number,
    cy: number,
    dIdx: number,
  ): void {
    if (this.isScrubbing) {
      // A dot names its own series; the scrub follows it to that column.
      this.scrubber.index = dIdx
      this.requestUpdate()
      this.hoverColumn(dIdx, { seriesKey: seriesItem.key })
      return
    }
    this.activePoint = {
      seriesKey: seriesItem.key,
      index: dIdx,
    }
    this.requestUpdate()
    this.dispatchHover({
      point: item,
      series: seriesItem,
      value: item[seriesItem.key],
      label: String(item[this.xKey] ?? ''),
      x: cx,
      y: cy,
    })
  }

  private handlePointLeave(): void {
    this.activePoint = null
    this.requestUpdate()
    this.dispatchLeave()
  }

  private readonly handleContainerPointer = (event: PointerEvent): void => {
    if (this.isScrubbing) this.scrubber.handlePointer(event)
  }

  private readonly handleContainerLeave = (): void => {
    if (!this.isScrubbing) return
    this.scrubber.handleLeave()
    // A dot hovered without a scrub column still owes its leave.
    if (this.lastHover !== null) this.hoverColumn(null)
  }

  private readonly handleContainerKeydown = (event: KeyboardEvent): void => {
    if (this.isScrubbing) this.scrubber.handleKeydown(event)
  }

  private readonly handleContainerFocus = (event: FocusEvent): void => {
    if (this.isScrubbing) this.scrubber.handleFocus(event)
  }

  private readonly handleContainerBlur = (): void => {
    if (this.isScrubbing) this.scrubber.set(null)
  }

  private readonly handlePauseClick = (): void => {
    this.isPaused = !this.isPaused
    this.dispatchEvent(
      new CustomEvent<LineChartPauseChangeDetail>('pausechange', {
        bubbles: true,
        composed: true,
        detail: { isPaused: this.isPaused },
      }),
    )
  }

  private renderPauseButton() {
    const label = 'Pause live updates'
    return html`
      <button
        part="pause-button"
        class="live-toggle"
        type="button"
        aria-label=${label}
        aria-pressed=${this.isPaused ? 'true' : 'false'}
        title=${this.isPaused ? 'Resume' : 'Pause'}
        @click=${this.handlePauseClick}
      >
        ${
          this.isPaused
            ? svg`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7-4.5z" fill="currentColor"></path></svg>`
            : svg`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3h2.5v10H4.5zM9 3h2.5v10H9z" fill="currentColor"></path></svg>`
        }
      </button>
    `
  }

  private renderScrub(geometry: LineGeometry, index: number | null) {
    const { width, height, padding, xs, layers } = geometry
    const view = { width, height }
    const at = index ?? xs.length - 1
    const x = xs[at] ?? 0
    const plotTop = height > 0 ? (padding.top / height) * 100 : 0
    const plotHeight =
      height > 0 ? ((height - padding.top - padding.bottom) / height) * 100 : 0
    return html`
      <span
        part="scrub-guide"
        class="scrub-guide"
        style="${plotPosition(x, 0, view)}; top: ${plotTop}%; height: ${plotHeight}%"
      ></span>
      ${layers.map((layer) => {
        const y = layer.ys[at]
        if (y === null || y === undefined) return nothing
        return html`
          <span
            part="scrub-dot"
            class="scrub-dot"
            data-series=${layer.series.key}
            style="${plotPosition(x, y, view)}; --_scrub-color: ${layer.color}"
          ></span>
        `
      })}
    `
  }

  protected override render() {
    const rows = this.frozenRows ?? this.data
    // 1. Domain safeguard: empty data check
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      this.geometry = null
      return html`
        <div part="empty" class="empty-state">
          <slot name="empty">
            <p class="empty-message">No data available</p>
          </slot>
        </div>
      `
    }

    const width = this.containerWidth
    const height = this.containerHeight
    const padding = { top: 20, right: 24, bottom: 32, left: 48 }
    const left = padding.left
    const right = width - padding.right
    const activeSeriesList = this.getActiveSeries()
    const isLive = this.isLive
    const labels = rows.map((d) => String(d[this.xKey] ?? ''))

    // 2. X positions: spread over the plot, or right-aligned at a fixed step in live mode
    const max = Math.floor(Number(this.maxPoints))
    const capacity = Math.max(max > 0 ? max : rows.length, 2)
    const step = (right - left) / (capacity - 1)
    this.liveStep = isLive ? step : 0
    const liveX = (i: number) => right - (rows.length - 1 - i) * step
    const xScale = scalePoint<string>().domain(labels).range([left, right])
    const xs = rows.map((_, i) => {
      const x = isLive ? liveX(i) : (xScale(labels[i] ?? '') ?? 0)
      return Number.isFinite(x) ? x : 0
    })

    // 3. Y-Scale Domain Safeguards
    const yValues: number[] = []
    for (const d of rows) {
      for (const s of activeSeriesList) {
        const num = toNumber(d[s.key])
        if (num !== null) yValues.push(num)
      }
    }

    let minY = 0
    let maxY = 1

    if (yValues.length > 0) {
      const rawMinY = Math.min(...yValues)
      const rawMaxY = Math.max(...yValues)

      if (rawMinY === rawMaxY) {
        // All-identical values safeguard
        if (rawMinY === 0) {
          minY = 0
          maxY = 1
        } else if (rawMinY > 0) {
          minY = 0
          maxY = rawMaxY * 1.2
        } else {
          minY = rawMinY * 1.2
          maxY = 0
        }
      } else {
        // Normal domain calculation with negative safeguards
        if (rawMinY < 0) {
          minY = rawMinY
          maxY = Math.max(0, rawMaxY)
        } else {
          minY = 0
          maxY = rawMaxY || 1
        }
      }
    }

    // Domain span safeguard against degenerate or subnormal ranges (< 1e-6)
    if (Math.abs(maxY - minY) < 1e-6) {
      if (minY < 0 && maxY > 0) {
        minY = -1
        maxY = 1
      } else if (maxY <= 0) {
        minY = -1
        maxY = 0
      } else {
        minY = 0
        maxY = 1
      }
    }

    const yScale = scaleLinear()
      .domain([minY, maxY])
      .range([height - padding.bottom, padding.top])
      .nice()
    const yOf = (num: number | null): number | null => {
      if (num === null) return null
      const y = yScale(num)
      return Number.isFinite(y) ? y : 0
    }

    const layers: LineLayer[] = activeSeriesList.map((s, sIdx) => {
      const values = rows.map((d) => toNumber(d[s.key]))
      return {
        series: s,
        color: s.color || getChartColor(sIdx),
        values,
        ys: values.map(yOf),
      }
    })
    const geometry: LineGeometry = {
      width,
      height,
      padding,
      rows,
      xs,
      labels,
      layers,
    }
    this.geometry = geometry

    const curveFactory = resolveCurveFactory(this.curve)

    // 4. Grid & Axis Ticks
    let yTicks: number[] = []
    try {
      yTicks = yScale.ticks(5)
    } catch {
      yTicks = [minY, (minY + maxY) / 2, maxY]
    }
    if (!yTicks || yTicks.length === 0) {
      yTicks = [minY, (minY + maxY) / 2, maxY]
    }
    const rawBaseY = yScale(0)
    const baselineY = Number.isFinite(rawBaseY)
      ? rawBaseY
      : height - padding.bottom

    const isScrubbing = this.isScrubbing
    const index = isScrubbing ? this.scrubber.index : null
    const valueIndex = index ?? xs.length - 1
    const name = this.label || 'Line chart'

    const pathFor = (
      points: { x: number; y: number | null }[],
    ): string | null =>
      line<{ x: number; y: number | null }>()
        .defined((p) => p.y !== null)
        .x((p) => p.x)
        .y((p) => p.y ?? 0)
        .curve(curveFactory)(points)

    const gridLines = this.showGrid
      ? svg`
        <g class="grid-group" part="grid" aria-hidden="true">
          ${yTicks.map((tick) => {
            const yPos = yScale(tick)
            if (!Number.isFinite(yPos)) return svg``
            return svg`
              <line
                class="grid-line"
                part="grid"
                x1="${left}"
                y1="${yPos}"
                x2="${right}"
                y2="${yPos}"
              />
            `
          })}
        </g>
      `
      : ''

    const yLabels = svg`
      <g class="y-axis-labels" aria-hidden="true">
        ${yTicks.map((tick) => {
          const yPos = yScale(tick)
          if (!Number.isFinite(yPos)) return svg``
          const formatted = this.valueFormatter
            ? this.valueFormatter(tick)
            : String(tick)
          return svg`
            <text
              class="axis-tick y-tick"
              x="${left - 8}"
              y="${yPos}"
              text-anchor="end"
              dominant-baseline="middle"
            >
              ${formatted}
            </text>
          `
        })}
      </g>
    `

    const plot = isLive
      ? this.renderLivePlot(geometry, {
          step,
          capacity,
          pathFor,
          yOf,
          clipId: `line-live-clip-${this.chartId}`,
        })
      : this.renderStaticPlot(geometry, pathFor)

    return html`
      <div class="chart-frame" style="height: ${height}px;">
        <div
          part="container"
          class="chart-container"
          ?data-scrub=${isScrubbing}
          ?data-active=${index !== null}
          role=${isScrubbing ? 'slider' : nothing}
          tabindex=${isScrubbing ? '0' : nothing}
          aria-label=${isScrubbing ? name : nothing}
          aria-valuemin=${isScrubbing ? '0' : nothing}
          aria-valuemax=${isScrubbing ? String(xs.length - 1) : nothing}
          aria-valuenow=${isScrubbing ? String(valueIndex) : nothing}
          aria-valuetext=${
            isScrubbing
              ? scrubValueText(
                  labels[valueIndex] ?? '',
                  this.entriesAt(valueIndex),
                  (value) => this.format(value),
                )
              : nothing
          }
          @pointerdown=${this.handleContainerPointer}
          @pointermove=${this.handleContainerPointer}
          @pointerleave=${this.handleContainerLeave}
          @pointercancel=${this.handleContainerLeave}
          @keydown=${this.handleContainerKeydown}
          @focus=${this.handleContainerFocus}
          @blur=${this.handleContainerBlur}
        >
          <svg
            class="chart-svg"
            viewBox="0 0 ${width} ${height}"
            height="${height}"
            preserveAspectRatio="xMidYMid meet"
            role=${isScrubbing ? nothing : 'img'}
            aria-label=${isScrubbing ? nothing : name}
            aria-hidden=${isScrubbing ? 'true' : nothing}
          >
            ${gridLines}

            <!-- X Axis Baseline -->
            <line
              class="axis-line"
              x1="${left}"
              y1="${baselineY}"
              x2="${right}"
              y2="${baselineY}"
            />

            ${yLabels}
            ${plot}
          </svg>
          ${isScrubbing ? this.renderScrub(geometry, index) : nothing}
        </div>
        ${isLive ? this.renderPauseButton() : nothing}
      </div>
    `
  }

  /** Every label, every line and a dot on every point. */
  private renderStaticPlot(
    geometry: LineGeometry,
    pathFor: (points: { x: number; y: number | null }[]) => string | null,
  ) {
    const { width, height, padding, rows, xs, labels, layers } = geometry
    const isScrubbing = this.isScrubbing
    // Long ranges label every few categories, counted back from the latest.
    const labelStride = axisLabelStride(
      labels.length,
      width - padding.left - padding.right,
    )
    return svg`
      <!-- X Axis Labels -->
      <g class="x-axis-labels" aria-hidden="true">
        ${labels.map((label, i) =>
          (labels.length - 1 - i) % labelStride === 0
            ? svg`
            <text
              class="axis-tick x-tick"
              x="${xs[i] ?? 0}"
              y="${height - padding.bottom + 18}"
              text-anchor="middle"
              dominant-baseline="hanging"
            >
              ${label}
            </text>
          `
            : nothing,
        )}
      </g>

      <!-- Series Lines -->
      <g class="series-lines-group">
        ${layers.map((layer) => {
          let pathD =
            pathFor(xs.map((x, i) => ({ x, y: layer.ys[i] ?? null }))) ?? ''
          if (!pathD && rows.length === 1 && layer.ys[0] != null) {
            pathD = `M ${xs[0]} ${layer.ys[0]}`
          }
          return svg`
            <path
              class="chart-line line-path series-path"
              part="line"
              data-series-key="${layer.series.key}"
              d="${pathD}"
              stroke="${layer.color}"
              stroke-width="${layer.series.strokeWidth ?? 2}"
            />
          `
        })}
      </g>

      <!-- Data Points (Exactly 1 circle per data point) -->
      <g class="series-points-group">
        ${layers.map((layer) =>
          rows.map((d, dIdx) => {
            const cy = layer.ys[dIdx]
            if (cy === null || cy === undefined) return svg``
            const cx = xs[dIdx] ?? 0
            const isActive =
              this.activePoint?.seriesKey === layer.series.key &&
              this.activePoint?.index === dIdx
            return svg`
              <circle
                class="point-marker ${isActive ? 'is-active' : ''}"
                part="point"
                data-series="${layer.series.key}"
                data-index="${dIdx}"
                cx="${cx}"
                cy="${cy}"
                r="${isActive ? 6 : 4}"
                stroke="${layer.color}"
                stroke-width="2"
                fill="var(--color-surface, #ffffff)"
                @pointerenter=${() =>
                  this.handlePointEnter(d, layer.series, cx, cy, dIdx)}
                @pointerleave=${isScrubbing ? nothing : this.handlePointLeave}
              />
            `
          }),
        )}
      </g>
    `
  }

  /**
   * The live plot: lines and thinned labels in one track that glides left,
   * clipped to the plot, with the rows dropped last drawn off its left edge so
   * the line stays whole while it moves, and a pulsing head on each newest point.
   */
  private renderLivePlot(
    geometry: LineGeometry,
    options: {
      step: number
      capacity: number
      pathFor: (points: { x: number; y: number | null }[]) => string | null
      yOf: (num: number | null) => number | null
      clipId: string
    },
  ) {
    const { width, height, padding, rows, xs, labels, layers } = geometry
    const { step, capacity, pathFor, yOf, clipId } = options
    const left = padding.left
    const right = width - padding.right
    const trail = !this.frozenRows && rows.length >= capacity ? this.trail : []
    const trailX = (j: number) => (xs[0] ?? left) - (trail.length - j) * step
    const slots = Math.max(2, Math.floor((right - left) / 72))
    const every = Math.max(1, Math.ceil(capacity / slots))
    const first = this.frozenRows ? 0 : this.dropped
    const trailLabels = trail.map((d) => String(d[this.xKey] ?? ''))
    const labelAt = (seq: number) => ((seq % every) + every) % every === 0
    const last = rows.length - 1
    return svg`
      <defs>
        <clipPath id="${clipId}">
          <rect x="${left}" y="0" width="${Math.max(0, right - left + 8)}" height="${height}"></rect>
        </clipPath>
      </defs>
      <g clip-path="url(#${clipId})">
        <g class="live-track" part="track">
          <g class="x-axis-labels" aria-hidden="true">
            ${trailLabels.map((label, j) =>
              labelAt(first - trail.length + j)
                ? svg`<text class="axis-tick x-tick" x="${trailX(j)}" y="${height - padding.bottom + 18}" text-anchor="middle" dominant-baseline="hanging">${label}</text>`
                : nothing,
            )}
            ${labels.map((label, i) =>
              labelAt(first + i)
                ? svg`<text class="axis-tick x-tick" x="${xs[i]}" y="${height - padding.bottom + 18}" text-anchor="middle" dominant-baseline="hanging">${label}</text>`
                : nothing,
            )}
          </g>
          <g class="series-lines-group">
            ${layers.map((layer) => {
              const points = [
                ...trail.map((d, j) => ({
                  x: trailX(j),
                  y: yOf(toNumber(d[layer.series.key])),
                })),
                ...xs.map((x, i) => ({ x, y: layer.ys[i] ?? null })),
              ]
              return svg`
                <path
                  class="chart-line line-path series-path"
                  part="line"
                  data-series-key="${layer.series.key}"
                  d="${pathFor(points) ?? ''}"
                  stroke="${layer.color}"
                  stroke-width="${layer.series.strokeWidth ?? 2}"
                />
              `
            })}
          </g>
          <g class="live-heads" aria-hidden="true">
            ${layers.map((layer) => {
              const y = layer.ys[last]
              if (y === null || y === undefined) return nothing
              return svg`
                <circle class="live-halo" cx="${xs[last]}" cy="${y}" r="7" fill="${layer.color}"></circle>
                <circle class="live-head" part="head" cx="${xs[last]}" cy="${y}" r="3.5" fill="${layer.color}"></circle>
              `
            })}
          </g>
        </g>
      </g>
    `
  }
}

defineElement('moul-line-chart', MoulLineChart)

export { MoulLineChart as LineChart }

declare global {
  interface HTMLElementTagNameMap {
    'moul-line-chart': MoulLineChart
  }
}
