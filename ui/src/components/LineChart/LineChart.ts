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
import { html, LitElement, type PropertyValues, svg } from 'lit'

import { LayoutIndicatorController } from '../../controllers/layout-indicator.controller'
import { defineElement } from '../../utils/define-element'
import {
  CHART_EASE,
  prefersReducedMotion,
  subtleAnimate,
} from '../../utils/motion'
import {
  type ChartSeries,
  getChartColor,
  type PointHoverDetail,
} from '../ChartCommon'
import { lineChartStyles } from './LineChart.styles'

export interface LineChartProps {
  data?: Record<string, unknown>[]
  xKey?: string
  series?: ChartSeries[]
  height?: number
  showGrid?: boolean
  curve?: string
  valueFormatter?: (value: any) => string
}

export interface ActivePointState {
  seriesKey: string
  index: number
}

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
    valueFormatter: { attribute: false },
  }

  declare data: Record<string, unknown>[]
  declare xKey: string
  declare series: ChartSeries[]
  declare height: number
  declare showGrid: boolean
  declare curve: string
  declare valueFormatter?: (value: any) => string

  public layout: LayoutIndicatorController
  private activePoint: ActivePointState | null = null

  constructor() {
    super()
    this.data = []
    this.xKey = 'name'
    this.series = []
    this.height = 300
    this.showGrid = true
    this.curve = 'monotoneX'
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

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (
      changedProps.has('data') ||
      changedProps.has('series') ||
      changedProps.has('curve')
    ) {
      this.animatePaths()
    }
  }

  private animatePaths(): void {
    if (prefersReducedMotion()) return

    const paths =
      this.renderRoot?.querySelectorAll<SVGPathElement>('.series-path')
    if (paths && paths.length > 0) {
      subtleAnimate(
        paths,
        { opacity: [0, 1] },
        { duration: 0.35, ease: CHART_EASE },
      )
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

  private handlePointEnter(
    _event: PointerEvent,
    item: Record<string, unknown>,
    seriesItem: ChartSeries,
    cx: number,
    cy: number,
    dIdx: number,
  ): void {
    this.activePoint = {
      seriesKey: seriesItem.key,
      index: dIdx,
    }
    this.requestUpdate()

    const rawValue = item[seriesItem.key]
    const label = String(item[this.xKey] ?? '')

    this.dispatchEvent(
      new CustomEvent<PointHoverDetail>('point-hover', {
        bubbles: true,
        composed: true,
        detail: {
          point: item,
          series: seriesItem,
          value: rawValue,
          label,
          x: cx,
          y: cy,
        },
      }),
    )
  }

  private handlePointLeave(_event: PointerEvent): void {
    this.activePoint = null
    this.requestUpdate()

    this.dispatchEvent(
      new CustomEvent('point-leave', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  protected override render() {
    // 1. Domain safeguard: empty data check
    if (!this.data || !Array.isArray(this.data) || this.data.length === 0) {
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
    const activeSeriesList = this.getActiveSeries()

    // 2. X-Scale (scalePoint)
    const xLabels = this.data.map((d) => String(d[this.xKey] ?? ''))
    const xScale = scalePoint<string>()
      .domain(xLabels)
      .range([padding.left, width - padding.right])

    // 3. Y-Scale Domain Safeguards
    const yValues: number[] = []
    for (const d of this.data) {
      for (const s of activeSeriesList) {
        const raw = d[s.key]
        if (raw !== null && raw !== undefined) {
          const num = Number(raw)
          if (!Number.isNaN(num) && Number.isFinite(num)) {
            yValues.push(num)
          }
        }
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

    return html`
      <div style="width: 100%; height: ${height}px; position: relative;">
        <svg
          class="chart-svg"
          viewBox="0 0 ${width} ${height}"
          height="${height}"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Line chart"
        >
          <!-- Grid Lines -->
          ${
            this.showGrid
              ? svg`
                <g class="grid-group" part="grid" aria-hidden="true">
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
                      />
                    `
                  })}
                </g>
              `
              : ''
          }

          <!-- X Axis Baseline -->
          <line
            class="axis-line"
            x1="${padding.left}"
            y1="${baselineY}"
            x2="${width - padding.right}"
            y2="${baselineY}"
          />

          <!-- Y Axis Labels -->
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
                  x="${padding.left - 8}"
                  y="${yPos}"
                  text-anchor="end"
                  dominant-baseline="middle"
                >
                  ${formatted}
                </text>
              `
            })}
          </g>

          <!-- X Axis Labels -->
          <g class="x-axis-labels" aria-hidden="true">
            ${this.data.map((d) => {
              const label = String(d[this.xKey] ?? '')
              const xPos = xScale(label) ?? 0
              return svg`
                <text
                  class="axis-tick x-tick"
                  x="${xPos}"
                  y="${height - padding.bottom + 18}"
                  text-anchor="middle"
                  dominant-baseline="hanging"
                >
                  ${label}
                </text>
              `
            })}
          </g>

          <!-- Series Lines -->
          <g class="series-lines-group">
            ${activeSeriesList.map((s, sIdx) => {
              const color = s.color || getChartColor(sIdx)
              const strokeWidth = s.strokeWidth ?? 2

              const lineGenerator = line<Record<string, unknown>>()
                .defined((d) => {
                  const val = d[s.key]
                  if (val === null || val === undefined) return false
                  const num = Number(val)
                  return Number.isFinite(num)
                })
                .x((d) => {
                  const xPos = xScale(String(d[this.xKey] ?? '')) ?? 0
                  return Number.isFinite(xPos) ? xPos : 0
                })
                .y((d) => {
                  const num = Number(d[s.key])
                  const yPos = Number.isFinite(num) ? yScale(num) : 0
                  return Number.isFinite(yPos) ? yPos : 0
                })
                .curve(curveFactory)

              let pathD = lineGenerator(this.data) ?? ''
              if (!pathD && this.data.length === 1) {
                const d0 = this.data[0]
                const val = Number(d0[s.key])
                if (Number.isFinite(val)) {
                  const px = xScale(String(d0[this.xKey] ?? '')) ?? 0
                  const rawPy = yScale(val)
                  const py = Number.isFinite(rawPy) ? rawPy : 0
                  pathD = `M ${px} ${py}`
                }
              }

              return svg`
                <path
                  class="chart-line line-path series-path"
                  part="line"
                  data-series-key="${s.key}"
                  d="${pathD}"
                  stroke="${color}"
                  stroke-width="${strokeWidth}"
                />
              `
            })}
          </g>

          <!-- Data Points (Exactly 1 circle per data point) -->
          <g class="series-points-group">
            ${activeSeriesList.map((s, sIdx) => {
              const color = s.color || getChartColor(sIdx)

              return this.data.map((d, dIdx) => {
                const rawVal = d[s.key]
                if (rawVal === null || rawVal === undefined) {
                  return svg``
                }
                const num = Number(rawVal)
                if (!Number.isFinite(num)) {
                  return svg``
                }

                const cx = xScale(String(d[this.xKey] ?? '')) ?? 0
                const rawCy = yScale(num)
                const cy = Number.isFinite(rawCy) ? rawCy : 0
                const isActive =
                  this.activePoint?.seriesKey === s.key &&
                  this.activePoint?.index === dIdx

                return svg`
                  <circle
                    class="point-marker ${isActive ? 'is-active' : ''}"
                    part="point"
                    data-series="${s.key}"
                    data-index="${dIdx}"
                    cx="${cx}"
                    cy="${cy}"
                    r="${isActive ? 6 : 4}"
                    stroke="${color}"
                    stroke-width="2"
                    fill="var(--color-surface, #ffffff)"
                    @pointerenter="${(e: PointerEvent) =>
                      this.handlePointEnter(e, d, s, cx, cy, dIdx)}"
                    @pointerleave="${(e: PointerEvent) =>
                      this.handlePointLeave(e)}"
                  />
                `
              })
            })}
          </g>
        </svg>
      </div>
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
