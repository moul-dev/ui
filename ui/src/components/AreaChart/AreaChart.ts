import { scaleLinear, scalePoint } from 'd3-scale'
import { area, curveMonotoneX, line } from 'd3-shape'
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
import { areaChartStyles } from './AreaChart.styles'

export interface AreaChartProps {
  data?: Record<string, unknown>[]
  xKey?: string
  series?: ChartSeries[]
  height?: number
  stacked?: boolean
  showGrid?: boolean
  valueFormatter?: (value: any) => string
}

export interface AreaChartPointData {
  xVal: string
  rawVal: number
  y0: number
  y1: number
  rawData: Record<string, unknown>
}

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
    valueFormatter: { attribute: false },
  }

  declare data: Record<string, unknown>[]
  declare xKey: string
  declare series: ChartSeries[]
  declare height: number
  declare stacked: boolean
  declare showGrid: boolean
  declare valueFormatter?: (value: any) => string

  public layout: LayoutIndicatorController

  private chartId = Math.random().toString(36).slice(2, 9)

  constructor() {
    super()
    this.data = []
    this.xKey = 'name'
    this.series = []
    this.height = 300
    this.stacked = false
    this.showGrid = true
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

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (
      changedProps.has('data') ||
      changedProps.has('series') ||
      changedProps.has('stacked')
    ) {
      this.animateAreaPaths()
    }
  }

  private animateAreaPaths(): void {
    if (prefersReducedMotion()) return

    const areaPaths = this.renderRoot?.querySelectorAll(
      '.area-path, .chart-area',
    )
    const strokePaths = this.renderRoot?.querySelectorAll(
      '.stroke-path, .area-stroke, .chart-line',
    )

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

  private handlePointHover(
    point: AreaChartPointData,
    s: ChartSeries,
    x: number,
    y: number,
    _event: PointerEvent,
  ): void {
    const detail: PointHoverDetail = {
      point: point.rawData,
      series: s,
      value: point.rawVal,
      label: point.xVal,
      x,
      y,
    }

    this.dispatchEvent(
      new CustomEvent<PointHoverDetail>('point-hover', {
        bubbles: true,
        composed: true,
        detail,
      }),
    )
  }

  private handlePointLeave(): void {
    this.dispatchEvent(
      new CustomEvent('point-leave', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  protected override render() {
    if (!this.hasData) {
      return html`
        <div part="empty" class="empty-state">
          <slot name="empty">
            <p class="empty-message">No data available</p>
          </slot>
        </div>
      `
    }

    const seriesList = this.effectiveSeries
    if (seriesList.length === 0) {
      return html`
        <div part="empty" class="empty-state">
          <slot name="empty">
            <p class="empty-message">No data available</p>
          </slot>
        </div>
      `
    }

    const width =
      this.layout.width > 0
        ? this.layout.width
        : this.clientWidth > 0
          ? this.clientWidth
          : 600
    const height = this.height > 0 ? this.height : 300

    const padding = {
      top: 16,
      right: 16,
      bottom: 28,
      left: 40,
    }

    // X Scale
    const xCategories = this.data.map((d) => String(d[this.xKey] ?? ''))
    const xScale = scalePoint<string>()
      .domain(xCategories)
      .range([padding.left, width - padding.right])

    // Accumulators for stacked mode
    const posBaselines = new Array(this.data.length).fill(0)
    const negBaselines = new Array(this.data.length).fill(0)

    // Build series points
    const seriesPointsList: {
      series: ChartSeries
      color: string
      gradId: string
      points: AreaChartPointData[]
    }[] = []

    let minY = 0
    let maxY = 0

    seriesList.forEach((s, sIdx) => {
      const color = s.color ?? getChartColor(sIdx)
      const gradId = `area-grad-${this.chartId}-${s.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`
      const points: AreaChartPointData[] = []

      this.data.forEach((d, i) => {
        const xVal = String(d[this.xKey] ?? '')
        const raw = d[s.key]
        const num = Number(raw)
        const val = Number.isFinite(num) ? num : 0

        let y0 = 0
        let y1 = 0

        if (this.stacked) {
          if (val >= 0) {
            y0 = posBaselines[i]
            y1 = posBaselines[i] + val
            posBaselines[i] += val
          } else {
            y0 = negBaselines[i]
            y1 = negBaselines[i] + val
            negBaselines[i] += val
          }
        } else {
          y0 = 0
          y1 = val
        }

        if (!Number.isFinite(y0)) y0 = 0
        if (!Number.isFinite(y1)) y1 = 0

        minY = Math.min(minY, y0, y1)
        maxY = Math.max(maxY, y0, y1)

        points.push({
          xVal,
          rawVal: val,
          y0,
          y1,
          rawData: d,
        })
      })

      seriesPointsList.push({
        series: s,
        color,
        gradId,
        points,
      })
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
      .range([height - padding.bottom, padding.top])
      .nice()

    // Area & Line Generators
    const areaGen = area<AreaChartPointData>()
      .defined((p) => Number.isFinite(p.y0) && Number.isFinite(p.y1))
      .x((p) => {
        const xPos = xScale(p.xVal) ?? padding.left
        return Number.isFinite(xPos) ? xPos : padding.left
      })
      .y0((p) => {
        const yPos = yScale(p.y0)
        return Number.isFinite(yPos) ? yPos : height - padding.bottom
      })
      .y1((p) => {
        const yPos = yScale(p.y1)
        return Number.isFinite(yPos) ? yPos : height - padding.bottom
      })
      .curve(curveMonotoneX)

    const lineGen = line<AreaChartPointData>()
      .defined((p) => Number.isFinite(p.y1))
      .x((p) => {
        const xPos = xScale(p.xVal) ?? padding.left
        return Number.isFinite(xPos) ? xPos : padding.left
      })
      .y((p) => {
        const yPos = yScale(p.y1)
        return Number.isFinite(yPos) ? yPos : height - padding.bottom
      })
      .curve(curveMonotoneX)

    let yTicks: number[] = []
    try {
      yTicks = yScale.ticks(5)
    } catch {
      yTicks = [domainMin, (domainMin + domainMax) / 2, domainMax]
    }
    if (!yTicks || yTicks.length === 0) {
      yTicks = [domainMin, (domainMin + domainMax) / 2, domainMax]
    }

    return html`
      <div
        part="container"
        class="chart-container"
        style="height: ${height}px;"
        @pointerleave=${this.handlePointLeave}
      >
        <svg
          part="svg"
          class="chart-svg"
          viewBox="0 0 ${width} ${height}"
          height="${height}"
          preserveAspectRatio="none"
        >
          <defs>
            ${seriesPointsList.map(
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
            ${xCategories.map(
              (cat) => svg`
                <text
                  class="axis-label axis-label-x"
                  x="${xScale(cat) ?? padding.left}"
                  y="${height - padding.bottom + 8}"
                >
                  ${cat}
                </text>
              `,
            )}
          </g>

          <!-- Area Paths and Boundary Lines -->
          <g part="series" class="series-group">
            ${seriesPointsList.map((item) => {
              let areaPathD = areaGen(item.points) ?? ''
              let strokePathD = lineGen(item.points) ?? ''

              // Single point fallback: deterministic M path
              if (item.points.length === 1) {
                const pt = item.points[0]
                const px = xScale(pt.xVal) ?? padding.left
                const rawTop = yScale(pt.y1)
                const rawBot = yScale(pt.y0)
                const pyTop = Number.isFinite(rawTop)
                  ? rawTop
                  : height - padding.bottom
                const pyBot = Number.isFinite(rawBot)
                  ? rawBot
                  : height - padding.bottom
                areaPathD = `M ${px - 2} ${pyBot} L ${px - 2} ${pyTop} L ${px + 2} ${pyTop} L ${px + 2} ${pyBot} Z`
                strokePathD = `M ${px - 2} ${pyTop} L ${px + 2} ${pyTop}`
              }

              return svg`
                <g class="series-layer" data-series="${item.series.key}">
                  <path
                    class="chart-area area-path"
                    part="area"
                    d="${areaPathD}"
                    fill="url(#${item.gradId})"
                  ></path>
                  <path
                    class="chart-line area-stroke stroke-path"
                    part="line stroke"
                    d="${strokePathD}"
                    stroke="${item.color}"
                    stroke-width="${item.series.strokeWidth ?? 2}"
                    fill="none"
                  ></path>
                </g>
              `
            })}
          </g>

          <!-- Interactive Data Points (Exactly 1 circle per data point) -->
          <g part="points" class="points-group">
            ${seriesPointsList.map((item) =>
              item.points.map((pt) => {
                if (!Number.isFinite(pt.rawVal)) {
                  return svg``
                }
                const cx = xScale(pt.xVal) ?? padding.left
                const rawCy = yScale(pt.y1)
                if (!Number.isFinite(rawCy)) {
                  return svg``
                }
                const cy = rawCy
                return svg`
                  <circle
                    class="point-marker"
                    part="point"
                    cx="${cx}"
                    cy="${cy}"
                    r="4"
                    fill="${item.color}"
                    @pointerenter=${(e: PointerEvent) =>
                      this.handlePointHover(pt, item.series, cx, cy, e)}
                    @pointerleave=${this.handlePointLeave}
                  ></circle>
                `
              }),
            )}
          </g>
        </svg>
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
