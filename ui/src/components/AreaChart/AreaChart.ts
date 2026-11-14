import { scaleLinear, scalePoint } from 'd3-scale'
import { area, curveMonotoneX, line } from 'd3-shape'
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
import { areaChartStyles } from './AreaChart.styles'

export interface AreaChartProps {
  data?: Record<string, unknown>[]
  xKey?: string
  series?: ChartSeries[]
  height?: number
  stacked?: boolean
  showGrid?: boolean
  scrub?: boolean
  label?: string
  valueFormatter?: (value: any) => string
}

export interface AreaChartPointData {
  xVal: string
  rawVal: number
  y0: number
  y1: number
  rawData: Record<string, unknown>
}

/** One series as drawn: its points in data space and in SVG user units. */
interface AreaLayer {
  series: ChartSeries
  color: string
  gradId: string
  points: AreaChartPointData[]
  /** Baseline of each point, in user units. */
  y0: number[]
  /** Top of each point, in user units. */
  y1: number[]
}

interface AreaGeometry {
  width: number
  height: number
  padding: { top: number; right: number; bottom: number; left: number }
  /** The x of each column, in user units. */
  xs: number[]
  labels: string[]
  yScale: (value: number) => number
  yTicks: number[]
  layers: AreaLayer[]
}

/** A drawn shape a morph starts from. */
interface MorphSource {
  xs: number[]
  y0: number[]
  y1: number[]
}

/** How long a morph from one data set to the next takes, in seconds. */
const MORPH_DURATION = 0.4

const finiteOr = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback

/**
 * Reads the drawn curve `ys` (sampled at ascending `xs`) at `x`, joining the
 * samples with straight lines and holding the end values past either edge.
 */
function sampleAt(xs: number[], ys: number[], x: number): number {
  const last = xs.length - 1
  if (last < 0) return 0
  if (x <= xs[0] || last === 0) return ys[0]
  if (x >= xs[last]) return ys[last]
  let i = 1
  while (i < last && xs[i] < x) i++
  const span = xs[i] - xs[i - 1]
  const t = span > 0 ? (x - xs[i - 1]) / span : 0
  return ys[i - 1] + (ys[i] - ys[i - 1]) * t
}

const defaultFormat = (value: unknown): string =>
  typeof value === 'number' ? value.toLocaleString() : String(value ?? '')

/**
 * An area chart of one or more numeric series over shared categories: each
 * `data` row is one point along x (labelled by its `x-key` field, `name` by
 * default) and each series, from `series` or else every numeric field, is a
 * filled area under a line, overlapping or `stacked`. Dragging or hovering
 * across the plot scrubs it: a guide snaps to the nearest category, a dot
 * marks every series there, and `point-hover` fires with the values so a page
 * can show a `<moul-chart-tooltip>`. When `data` changes, for example on a
 * 7, 30 or 90 day range switch, the areas morph from the old shape to the new
 * one instead of jumping, even when the number of points changes.
 *
 * Keyboard and screen readers: with scrubbing on (the default) the plot is
 * one tab stop exposed as a `role="slider"` named by `label` ("Area chart" by
 * default). Keyboard focus shows the latest category; `Arrow Left` or
 * `Arrow Down` and `Arrow Right` or `Arrow Up` step through the categories,
 * `Home` and `End` jump to the first and last, and `Escape` or leaving focus
 * hides the guide. `aria-valuetext` reads the category and every series'
 * value through `valueFormatter`, e.g. "Mar: Desktop 237, Mobile 120", and
 * each step fires `point-hover` as the pointer does. The SVG is hidden from
 * screen readers then, since the slider carries its values. With
 * `scrub="false"` nothing takes focus, the per-point values are surfaced only
 * by hovering a dot, and a screen reader meets at most the axis text; give the
 * page a text or table alternative.
 *
 * Reduced motion: on first render the areas and lines fade in over 350ms;
 * under reduced motion they appear at once. A data change morphs the areas
 * over 400ms, and jumps to the new shape under reduced motion. The scrub
 * guide and dots glide between categories and fade in, and move at once
 * under reduced motion. A hovered point's dot grows from a 4px to a 6px
 * radius, smoothly normally and instantly under reduced motion.
 *
 * @slot empty - Shown instead of the chart when there is no data.
 * @fires point-hover - A point is hovered or scrubbed; `detail` has its value, label, `index` and every series' value in `entries`.
 * @fires point-leave - The pointer left a point or the chart, or the scrub stopped.
 * @csspart container - The plot box; the slider when scrubbing is on.
 * @csspart scrub-guide - The vertical guide at the scrubbed category.
 * @csspart scrub-dot - The dot marking each series at the scrubbed category.
 */
export class MoulAreaChart extends LitElement {
  static override styles = areaChartStyles

  static override properties = {
    data: { attribute: false },
    xKey: { type: String, attribute: 'x-key' },
    series: { attribute: false },
    height: { type: Number },
    stacked: { type: Boolean },
    showGrid: {
      type: Boolean,
      attribute: 'show-grid',
      converter: {
        fromAttribute: (val: string | null) => val !== null && val !== 'false',
        toAttribute: (val: boolean) => (val ? '' : null),
      },
    },
    scrub: {
      type: Boolean,
      converter: {
        fromAttribute: (val: string | null) => val !== 'false',
        toAttribute: (val: boolean) => (val ? null : 'false'),
      },
    },
    label: { type: String },
    valueFormatter: { attribute: false },
  }

  declare data: Record<string, unknown>[]
  declare xKey: string
  declare series: ChartSeries[]
  declare height: number
  declare stacked: boolean
  declare showGrid: boolean
  /** Scrub the plot with the pointer and the keyboard; `scrub="false"` turns it off. */
  declare scrub: boolean
  /** The accessible name of the scrub slider. Defaults to "Area chart". */
  declare label: string
  declare valueFormatter?: (value: any) => string

  public layout: LayoutIndicatorController

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

  /** What the last render drew, for scrubbing and as the start of a morph. */
  private geometry: AreaGeometry | null = null
  private morphFrom: Map<string, MorphSource> | null = null
  private morphProgress = 1
  private morph: AnimationPlaybackControls | null = null
  /** The column and series the last `point-hover` described, so moves within it stay quiet. */
  private lastHover: string | null = null
  private lastSeriesKey: string | null = null

  constructor() {
    super()
    this.data = []
    this.xKey = 'name'
    this.series = []
    this.height = 300
    this.stacked = false
    this.showGrid = true
    this.scrub = true
    this.label = ''
    this.valueFormatter = undefined

    this.layout = new LayoutIndicatorController(this, {
      observeDimensions: true,
    })
  }

  public get hasData(): boolean {
    return Array.isArray(this.data) && this.data.length > 0
  }

  public get effectiveSeries(): ChartSeries[] {
    if (Array.isArray(this.series) && this.series.length > 0) {
      return this.series
    }
    if (!this.hasData) {
      return []
    }
    const first = this.data[0]
    if (!first) return []
    return Object.keys(first)
      .filter((k) => {
        if (k === this.xKey) return false
        const val = first[k]
        const num = typeof val === 'number' ? val : Number(val)
        return (
          (typeof val === 'number' ||
            (typeof val === 'string' && val.trim() !== '')) &&
          Number.isFinite(num)
        )
      })
      .map((k, idx) => ({
        key: k,
        name: k,
        color: getChartColor(idx),
      }))
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.morph?.stop()
    this.morph = null
    this.morphFrom = null
    this.morphProgress = 1
  }

  protected override willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps)
    // A new data set morphs from what is on screen now, mid-morph included.
    if (changedProps.has('data') && this.geometry && this.hasData) {
      this.startMorph(this.geometry)
    }
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (
      changedProps.has('data') ||
      changedProps.has('series') ||
      changedProps.has('stacked')
    ) {
      this.animateAreaPaths()
      // A scrub in progress keeps its column and reports the new values.
      const index = this.scrubber.index
      if (index !== null) {
        if (!this.isScrubbing || index >= (this.geometry?.xs.length ?? 0)) {
          this.scrubber.set(null)
        } else {
          this.lastHover = null
          this.hoverColumn(index)
        }
      }
    }
    if (changedProps.has('scrub') && !this.scrub) this.scrubber.set(null)
  }

  /** Charts fade in once; later data updates (often live) morph in place. */
  private hasPlayedEntrance = false

  private animateAreaPaths(): void {
    if (this.hasPlayedEntrance || prefersReducedMotion()) return

    const areaPaths = this.renderRoot?.querySelectorAll(
      '.area-path, .chart-area',
    )
    const strokePaths = this.renderRoot?.querySelectorAll(
      '.stroke-path, .area-stroke, .chart-line',
    )
    if (areaPaths?.length || strokePaths?.length) this.hasPlayedEntrance = true

    if (areaPaths && areaPaths.length > 0) {
      subtleAnimate(
        areaPaths,
        { opacity: [0, 1] },
        { duration: 0.35, ease: CHART_EASE },
      )
    }
    if (strokePaths && strokePaths.length > 0) {
      subtleAnimate(
        strokePaths,
        { opacity: [0, 1] },
        { duration: 0.35, ease: CHART_EASE },
      )
    }
  }

  private startMorph(from: AreaGeometry): void {
    this.morph?.stop()
    this.morph = null
    if (prefersReducedMotion()) {
      this.morphFrom = null
      this.morphProgress = 1
      return
    }
    this.morphFrom = new Map(
      from.layers.map((layer) => [
        layer.series.key,
        { xs: from.xs, y0: layer.y0, y1: layer.y1 },
      ]),
    )
    this.morphProgress = 0
    const morph = animate(0, 1, {
      duration: MORPH_DURATION,
      ease: CHART_EASE,
      onUpdate: (progress: number) => {
        this.morphProgress = progress
        this.requestUpdate()
      },
    })
    this.morph = morph
    const settle = (): void => {
      if (this.morph !== morph) return
      this.morph = null
      this.morphFrom = null
      this.morphProgress = 1
      this.requestUpdate()
    }
    morph.finished.then(settle, settle)
  }

  private get isScrubbing(): boolean {
    return this.scrub && !!this.geometry && this.geometry.xs.length > 0
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
      value: layer.points[index]?.rawVal,
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
    if (index === null || !geometry || geometry.layers.length === 0) {
      if (this.lastHover !== null) {
        this.lastHover = null
        this.handlePointLeave()
      }
      return
    }
    const { layers } = geometry
    let layer: AreaLayer | undefined
    if (pick.seriesKey) {
      layer = layers.find((l) => l.series.key === pick.seriesKey)
    } else if (pick.pointerY != null) {
      const y = pick.pointerY
      layer = layers.reduce((best, l) =>
        Math.abs(l.y1[index] - y) < Math.abs(best.y1[index] - y) ? l : best,
      )
    } else {
      layer = layers.find((l) => l.series.key === this.lastSeriesKey)
    }
    layer ??= layers[0] as AreaLayer
    const point = layer.points[index]
    if (!point) return
    const key = `${index}:${layer.series.key}`
    if (key === this.lastHover) return
    this.lastHover = key
    this.lastSeriesKey = layer.series.key
    this.dispatchHover({
      point: point.rawData,
      series: layer.series,
      value: point.rawVal,
      label: point.xVal,
      x: geometry.xs[index] ?? 0,
      y: layer.y1[index] ?? 0,
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

  private handlePointHover(
    point: AreaChartPointData,
    s: ChartSeries,
    index: number,
    x: number,
    y: number,
  ): void {
    if (this.isScrubbing) {
      // A dot names its own series; the scrub follows it to that column.
      this.scrubber.index = index
      this.requestUpdate()
      this.hoverColumn(index, { seriesKey: s.key })
      return
    }
    this.dispatchHover({
      point: point.rawData,
      series: s,
      value: point.rawVal,
      label: point.xVal,
      x,
      y,
    })
  }

  private handlePointLeave(): void {
    this.dispatchEvent(
      new CustomEvent('point-leave', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private readonly handleContainerPointer = (event: PointerEvent): void => {
    if (this.isScrubbing) this.scrubber.handlePointer(event)
  }

  private readonly handleContainerLeave = (): void => {
    if (this.isScrubbing) {
      this.scrubber.handleLeave()
      // A dot hovered without a scrub column still owes its leave.
      if (this.lastHover !== null) this.hoverColumn(null)
    } else {
      this.handlePointLeave()
    }
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

  /** Lays out every series in user units, blending in the shape a morph started from. */
  private computeGeometry(seriesList: ChartSeries[]): AreaGeometry {
    const width =
      this.layout.width > 0
        ? this.layout.width
        : this.clientWidth > 0
          ? this.clientWidth
          : 600
    const height = this.height > 0 ? this.height : 300
    const padding = { top: 16, right: 16, bottom: 28, left: 40 }
    const baseline = height - padding.bottom

    const labels = this.data.map((d) => String(d[this.xKey] ?? ''))
    const xScale = scalePoint<string>()
      .domain(labels)
      .range([padding.left, width - padding.right])
    const xs = labels.map((label) =>
      finiteOr(xScale(label) ?? padding.left, padding.left),
    )

    // Accumulators for stacked mode
    const posBaselines = new Array(this.data.length).fill(0)
    const negBaselines = new Array(this.data.length).fill(0)
    let minY = 0
    let maxY = 0

    const series = seriesList.map((s, sIdx) => {
      const points: AreaChartPointData[] = this.data.map((d, i) => {
        const num = Number(d[s.key])
        const val = Number.isFinite(num) ? num : 0
        let y0 = 0
        let y1 = val
        if (this.stacked) {
          const baselines = val >= 0 ? posBaselines : negBaselines
          y0 = baselines[i]
          y1 = baselines[i] + val
          baselines[i] += val
        }
        y0 = finiteOr(y0, 0)
        y1 = finiteOr(y1, 0)
        minY = Math.min(minY, y0, y1)
        maxY = Math.max(maxY, y0, y1)
        return {
          xVal: labels[i] ?? '',
          rawVal: val,
          y0,
          y1,
          rawData: d,
        }
      })
      return {
        series: s,
        color: s.color ?? getChartColor(sIdx),
        gradId: `area-grad-${this.chartId}-${s.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
        points,
      }
    })

    // Y Scale domain bounds
    let domainMin = minY < 0 ? minY : 0
    let domainMax = maxY > 0 ? maxY : 1
    if (domainMin === domainMax) {
      domainMax = domainMin + 1
    }
    // Domain span safeguard against degenerate or subnormal ranges (< 1e-6)
    if (Math.abs(domainMax - domainMin) < 1e-6) {
      if (domainMin < 0 && domainMax > 0) {
        domainMin = -1
        domainMax = 1
      } else if (domainMax <= 0) {
        domainMin = -1
        domainMax = 0
      } else {
        domainMin = 0
        domainMax = 1
      }
    }

    const yScale = scaleLinear()
      .domain([domainMin, domainMax])
      .range([baseline, padding.top])
      .nice()

    let yTicks: number[] = []
    try {
      yTicks = yScale.ticks(5)
    } catch {
      yTicks = []
    }
    if (!yTicks || yTicks.length === 0) {
      yTicks = [domainMin, (domainMin + domainMax) / 2, domainMax]
    }

    const from = this.morphFrom
    const t = this.morphProgress
    const layers: AreaLayer[] = series.map((item) => {
      let y0 = item.points.map((p) => finiteOr(yScale(p.y0), baseline))
      let y1 = item.points.map((p) => finiteOr(yScale(p.y1), baseline))
      if (from && t < 1) {
        // The old shape, read at the new columns; a new series grows from its baseline.
        const source = from.get(item.series.key)
        const fromY0 = source
          ? xs.map((x) => sampleAt(source.xs, source.y0, x))
          : y0
        const fromY1 = source
          ? xs.map((x) => sampleAt(source.xs, source.y1, x))
          : y0
        y0 = y0.map((y, i) => fromY0[i] + (y - fromY0[i]) * t)
        y1 = y1.map((y, i) => fromY1[i] + (y - fromY1[i]) * t)
      }
      return { ...item, y0, y1 }
    })

    return { width, height, padding, xs, labels, yScale, yTicks, layers }
  }

  private renderEmpty() {
    return html`
      <div part="empty" class="empty-state">
        <slot name="empty">
          <p class="empty-message">No data available</p>
        </slot>
      </div>
    `
  }

  private renderScrub(geometry: AreaGeometry, index: number | null) {
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
      ${layers.map(
        (layer) => html`
          <span
            part="scrub-dot"
            class="scrub-dot"
            data-series=${layer.series.key}
            style="${plotPosition(x, layer.y1[at] ?? 0, view)}; --_scrub-color: ${layer.color}"
          ></span>
        `,
      )}
    `
  }

  protected override render() {
    const seriesList = this.hasData ? this.effectiveSeries : []
    if (seriesList.length === 0) {
      this.geometry = null
      return this.renderEmpty()
    }

    const geometry = this.computeGeometry(seriesList)
    this.geometry = geometry
    const { width, height, padding, xs, labels, yScale, yTicks, layers } =
      geometry
    const baseline = height - padding.bottom
    const isScrubbing = this.isScrubbing
    const index = isScrubbing ? this.scrubber.index : null
    const valueIndex = index ?? xs.length - 1
    // Long ranges label every few categories, counted back from the latest.
    const labelStride = axisLabelStride(
      labels.length,
      width - padding.left - padding.right,
    )

    const areaGen = (layer: AreaLayer) =>
      area<number>()
        .x((i) => xs[i] ?? padding.left)
        .y0((i) => layer.y0[i] ?? baseline)
        .y1((i) => layer.y1[i] ?? baseline)
        .curve(curveMonotoneX)
    const lineGen = (layer: AreaLayer) =>
      line<number>()
        .x((i) => xs[i] ?? padding.left)
        .y((i) => layer.y1[i] ?? baseline)
        .curve(curveMonotoneX)

    return html`
      <div
        part="container"
        class="chart-container"
        style="height: ${height}px;"
        ?data-scrub=${isScrubbing}
        ?data-active=${index !== null}
        role=${isScrubbing ? 'slider' : nothing}
        tabindex=${isScrubbing ? '0' : nothing}
        aria-label=${isScrubbing ? this.label || 'Area chart' : nothing}
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
          part="svg"
          class="chart-svg"
          viewBox="0 0 ${width} ${height}"
          height="${height}"
          preserveAspectRatio="none"
          aria-hidden=${isScrubbing ? 'true' : nothing}
        >
          <defs>
            ${layers.map(
              (item) => svg`
                <linearGradient
                  id="${item.gradId}"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stop-color="${item.color}"
                    stop-opacity="0.25"
                  ></stop>
                  <stop
                    offset="100%"
                    stop-color="${item.color}"
                    stop-opacity="0"
                  ></stop>
                </linearGradient>
              `,
            )}
          </defs>

          <!-- Grid Lines and Y-Axis Labels -->
          ${
            this.showGrid
              ? svg`
                <g part="grid" class="grid-group">
                  ${yTicks.map((tick) => {
                    const yPos = yScale(tick)
                    if (!Number.isFinite(yPos)) return svg``
                    return svg`
                      <line
                        class="grid-line"
                        part="grid"
                        x1="${padding.left}"
                        y1="${yPos}"
                        x2="${width - padding.right}"
                        y2="${yPos}"
                      ></line>
                      <text
                        class="axis-label axis-label-y"
                        x="${padding.left - 8}"
                        y="${yPos}"
                      >
                        ${
                          this.valueFormatter
                            ? this.valueFormatter(tick)
                            : String(tick)
                        }
                      </text>
                    `
                  })}
                </g>
              `
              : ''
          }

          <!-- X-Axis Labels -->
          <g part="x-axis" class="axis-group-x">
            ${labels.map((cat, i) =>
              (labels.length - 1 - i) % labelStride === 0
                ? svg`
                <text
                  class="axis-label axis-label-x"
                  x="${xs[i]}"
                  y="${baseline + 8}"
                >
                  ${cat}
                </text>
              `
                : nothing,
            )}
          </g>

          <!-- Area Paths and Boundary Lines -->
          <g part="series" class="series-group">
            ${layers.map((layer) => {
              const indices = layer.points.map((_, i) => i)
              let areaPathD = areaGen(layer)(indices) ?? ''
              let strokePathD = lineGen(layer)(indices) ?? ''

              // Single point fallback: deterministic M path
              if (layer.points.length === 1) {
                const px = xs[0] ?? padding.left
                const pyTop = layer.y1[0] ?? baseline
                const pyBot = layer.y0[0] ?? baseline
                areaPathD = `M ${px - 2} ${pyBot} L ${px - 2} ${pyTop} L ${px + 2} ${pyTop} L ${px + 2} ${pyBot} Z`
                strokePathD = `M ${px - 2} ${pyTop} L ${px + 2} ${pyTop}`
              }

              return svg`
                <g class="series-layer" data-series="${layer.series.key}">
                  <path
                    class="chart-area area-path"
                    part="area"
                    d="${areaPathD}"
                    fill="url(#${layer.gradId})"
                  ></path>
                  <path
                    class="chart-line area-stroke stroke-path"
                    part="line stroke"
                    d="${strokePathD}"
                    stroke="${layer.color}"
                    stroke-width="${layer.series.strokeWidth ?? 2}"
                    fill="none"
                  ></path>
                </g>
              `
            })}
          </g>

          <!-- Interactive Data Points (Exactly 1 circle per data point); packed ones are faded out -->
          <g
            part="points"
            class="points-group ${
              xs.length > 1 &&
              (width - padding.left - padding.right) / (xs.length - 1) < 12
                ? 'is-dense'
                : ''
            }"
          >
            ${layers.map((layer) =>
              layer.points.map((pt, i) => {
                if (!Number.isFinite(pt.rawVal)) return svg``
                const cx = xs[i] ?? padding.left
                const cy = layer.y1[i] ?? baseline
                return svg`
                  <circle
                    class="point-marker"
                    part="point"
                    cx="${cx}"
                    cy="${cy}"
                    r="4"
                    fill="${layer.color}"
                    @pointerenter=${() =>
                      this.handlePointHover(pt, layer.series, i, cx, cy)}
                    @pointerleave=${isScrubbing ? nothing : this.handlePointLeave}
                  ></circle>
                `
              }),
            )}
          </g>
        </svg>
        ${isScrubbing ? this.renderScrub(geometry, index) : nothing}
      </div>
    `
  }
}

defineElement('moul-area-chart', MoulAreaChart)

export { MoulAreaChart as AreaChart }

declare global {
  interface HTMLElementTagNameMap {
    'moul-area-chart': MoulAreaChart
  }
}
