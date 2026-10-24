import { scaleBand, scaleLinear } from 'd3-scale'
import { html, LitElement, type PropertyValues, svg } from 'lit'

import { LayoutIndicatorController } from '../../controllers/layout-indicator.controller'
import { defineElement } from '../../utils/define-element'
import {
  CHART_EASE,
  prefersReducedMotion,
  stagger,
  subtleAnimate,
} from '../../utils/motion'
import {
  type ChartSeries,
  getChartColor,
  type PointHoverDetail,
} from '../ChartCommon'
import { barChartStyles } from './BarChart.styles'

export interface BarChartProps {
  data?: Record<string, unknown>[]
  xKey?: string
  series?: ChartSeries[]
  height?: number
  layout?: 'vertical' | 'horizontal'
  stacked?: boolean
  showGrid?: boolean
  valueFormatter?: (value: any) => string
}

export interface ActiveBarState {
  seriesKey: string
  category: string
  index: number
}

export class MoulBarChart extends LitElement {
  static override styles = barChartStyles

  static override properties = {
    data: { attribute: false },
    xKey: { type: String, attribute: 'x-key' },
    series: { attribute: false },
    height: { type: Number },
    layout: { type: String },
    stacked: {
      type: Boolean,
      converter: {
        fromAttribute: (val: string | null) => val !== null && val !== 'false',
        toAttribute: (val: boolean) => (val ? '' : null),
      },
    },
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
  declare layout: 'vertical' | 'horizontal'
  declare stacked: boolean
  declare showGrid: boolean
  declare valueFormatter?: (value: any) => string

  public layoutController: LayoutIndicatorController
  private activeBar: ActiveBarState | null = null

  constructor() {
    super()
    this.data = []
    this.xKey = 'name'
    this.series = []
    this.height = 300
    this.layout = 'vertical'
    this.stacked = false
    this.showGrid = true
    this.valueFormatter = undefined

    this.layoutController = new LayoutIndicatorController(this, {
      observeDimensions: true,
    })
  }

  public get containerWidth(): number {
    return this.layoutController.width > 0
      ? this.layoutController.width
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
      changedProps.has('layout') ||
      changedProps.has('stacked')
    ) {
      this.animateBars()
    }
  }

  /** Charts fade in once; later data updates (often live) re-render in place. */
  private hasPlayedEntrance = false

  private animateBars(): void {
    if (this.hasPlayedEntrance || prefersReducedMotion()) return

    const bars = this.renderRoot?.querySelectorAll<SVGRectElement>(
      'rect.chart-bar, [part="bar"]',
    )
    if (bars && bars.length > 0) {
      this.hasPlayedEntrance = true
      subtleAnimate(
        bars,
        { opacity: [0, 1] },
        { duration: 0.35, ease: CHART_EASE, delay: stagger(0.025) },
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

  private handleBarEnter(
    _event: PointerEvent,
    item: Record<string, unknown>,
    seriesItem: ChartSeries,
    anchorX: number,
    anchorY: number,
    val: number,
    category: string,
    dIdx: number,
  ): void {
    this.activeBar = {
      seriesKey: seriesItem.key,
      category,
      index: dIdx,
    }
    this.requestUpdate()

    this.dispatchEvent(
      new CustomEvent<PointHoverDetail>('point-hover', {
        bubbles: true,
        composed: true,
        detail: {
          point: item,
          series: seriesItem,
          value: val,
          label: category,
          x: Math.round(anchorX),
          y: Math.round(anchorY),
        },
      }),
    )
  }

  private handleBarLeave(_event: PointerEvent): void {
    this.activeBar = null
    this.requestUpdate()

    this.dispatchEvent(
      new CustomEvent('point-leave', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  protected override render() {
    if (!this.data || !Array.isArray(this.data) || this.data.length === 0) {
      return html`
        <div part="empty" class="empty-state">
          <slot name="empty">
            <p class="empty-message">No data available</p>
          </slot>
        </div>
      `
    }

    const activeSeriesList = this.getActiveSeries()
    if (activeSeriesList.length === 0) {
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
    const isHorizontal = this.layout === 'horizontal'

    const padding = isHorizontal
      ? { top: 20, right: 24, bottom: 32, left: 64 }
      : { top: 20, right: 20, bottom: 32, left: 48 }

    const categories = this.data.map((d) => String(d[this.xKey] ?? ''))

    // Calculate domain bounds
    let minVal = 0
    let maxVal = 1

    if (this.stacked) {
      const posTotals: number[] = []
      const negTotals: number[] = []
      for (const d of this.data) {
        let pos = 0
        let neg = 0
        for (const s of activeSeriesList) {
          const raw = d[s.key]
          if (raw !== null && raw !== undefined) {
            const num = Number(raw)
            if (Number.isFinite(num)) {
              if (num >= 0) pos += num
              else neg += num
            }
          }
        }
        posTotals.push(pos)
        negTotals.push(neg)
      }
      const rawMax = posTotals.length > 0 ? Math.max(...posTotals) : 0
      const rawMin = negTotals.length > 0 ? Math.min(...negTotals) : 0
      if (rawMin < 0) {
        minVal = rawMin
        maxVal = Math.max(0, rawMax)
      } else {
        minVal = 0
        maxVal = rawMax > 0 ? rawMax : 1
      }
    } else {
      const values: number[] = []
      for (const d of this.data) {
        for (const s of activeSeriesList) {
          const raw = d[s.key]
          if (raw !== null && raw !== undefined) {
            const num = Number(raw)
            if (Number.isFinite(num)) {
              values.push(num)
            }
          }
        }
      }
      if (values.length > 0) {
        const rawMin = Math.min(...values)
        const rawMax = Math.max(...values)
        if (rawMin === rawMax) {
          if (rawMin === 0) {
            minVal = 0
            maxVal = 1
          } else if (rawMin > 0) {
            minVal = 0
            maxVal = rawMax * 1.2
          } else {
            minVal = rawMin * 1.2
            maxVal = 0
          }
        } else {
          if (rawMin < 0) {
            minVal = rawMin
            maxVal = Math.max(0, rawMax)
          } else {
            minVal = 0
            maxVal = rawMax || 1
          }
        }
      }
    }

    // Degenerate or subnormal domain span safeguard (< 1e-6)
    if (Math.abs(maxVal - minVal) < 1e-6) {
      if (minVal < 0 && maxVal > 0) {
        minVal = -1
        maxVal = 1
      } else if (maxVal <= 0) {
        minVal = -1
        maxVal = 0
      } else {
        minVal = 0
        maxVal = 1
      }
    }

    const seriesKeys = activeSeriesList.map((s) => s.key)

    if (!isHorizontal) {
      // ----------------------------------------------------
      // VERTICAL LAYOUT (X = Category, Y = Metric)
      // ----------------------------------------------------
      const catScale = scaleBand<string>()
        .domain(categories)
        .range([padding.left, width - padding.right])
        .paddingInner(0.2)
        .paddingOuter(0.1)

      const yScale = scaleLinear()
        .domain([minVal, maxVal])
        .range([height - padding.bottom, padding.top])
        .nice()

      const rawBaseY = yScale(0)
      const baselineY = Number.isFinite(rawBaseY)
        ? Math.min(Math.max(rawBaseY, padding.top), height - padding.bottom)
        : height - padding.bottom

      let yTicks: number[] = []
      try {
        yTicks = yScale.ticks(5)
      } catch {
        yTicks = [minVal, (minVal + maxVal) / 2, maxVal]
      }
      if (!yTicks || yTicks.length === 0) {
        yTicks = [minVal, (minVal + maxVal) / 2, maxVal]
      }

      const seriesSubScale = scaleBand<string>()
        .domain(seriesKeys)
        .range([0, catScale.bandwidth()])
        .padding(0.05)

      return html`
        <div class="chart-container" style="width: 100%; height: ${height}px; position: relative;">
          <svg
            class="chart-svg"
            viewBox="0 0 ${width} ${height}"
            height="${height}"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Bar chart"
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

            <!-- Y Axis Tick Labels -->
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

            <!-- X Axis Category Labels -->
            <g class="x-axis-labels" aria-hidden="true">
              ${this.data.map((d) => {
                const cat = String(d[this.xKey] ?? '')
                const xPos = (catScale(cat) ?? 0) + catScale.bandwidth() / 2
                return svg`
                  <text
                    class="axis-tick x-tick"
                    x="${xPos}"
                    y="${height - padding.bottom + 18}"
                    text-anchor="middle"
                    dominant-baseline="hanging"
                  >
                    ${cat}
                  </text>
                `
              })}
            </g>

            <!-- Bars -->
            <g class="bars-group">
              ${this.data.map((d, dIdx) => {
                const cat = String(d[this.xKey] ?? '')
                const catX = catScale(cat) ?? 0
                let posSum = 0
                let negSum = 0

                return activeSeriesList.map((s, sIdx) => {
                  const rawVal = Number(d[s.key])
                  const val = Number.isFinite(rawVal) ? rawVal : 0
                  const color = s.color || getChartColor(sIdx)

                  let barX = 0
                  let barY = 0
                  let barWidth = 0
                  let barHeight = 0
                  let anchorX = 0
                  let anchorY = 0

                  if (this.stacked) {
                    barX = catX
                    barWidth = Math.max(1, catScale.bandwidth())
                    if (val >= 0) {
                      const base = posSum
                      const end = posSum + val
                      posSum += val
                      barY = yScale(end)
                      barHeight = Math.max(0, yScale(base) - yScale(end))
                      anchorY = barY
                    } else {
                      const base = negSum
                      const end = negSum + val
                      negSum += val
                      barY = yScale(base)
                      barHeight = Math.max(0, yScale(end) - yScale(base))
                      anchorY = barY + barHeight
                    }
                    anchorX = barX + barWidth / 2
                  } else {
                    barX = catX + (seriesSubScale(s.key) ?? 0)
                    barWidth = Math.max(1, seriesSubScale.bandwidth())
                    const valY = yScale(val)
                    barY = Math.min(valY, baselineY)
                    barHeight = Math.max(0, Math.abs(valY - baselineY))
                    anchorX = barX + barWidth / 2
                    anchorY = valY
                  }

                  const isActive =
                    this.activeBar?.seriesKey === s.key &&
                    this.activeBar?.index === dIdx

                  return svg`
                    <rect
                      class="chart-bar ${isActive ? 'is-active' : ''}"
                      part="bar"
                      data-series-key="${s.key}"
                      data-category="${cat}"
                      data-index="${dIdx}"
                      x="${barX}"
                      y="${barY}"
                      width="${barWidth}"
                      height="${barHeight}"
                      fill="${color}"
                      rx="3"
                      ry="3"
                      cursor="pointer"
                      @pointerenter="${(e: PointerEvent) =>
                        this.handleBarEnter(
                          e,
                          d,
                          s,
                          anchorX,
                          anchorY,
                          val,
                          cat,
                          dIdx,
                        )}"
                      @pointerleave="${(e: PointerEvent) =>
                        this.handleBarLeave(e)}"
                    />
                  `
                })
              })}
            </g>
          </svg>
        </div>
      `
    }

    // ----------------------------------------------------
    // HORIZONTAL LAYOUT (Y = Category, X = Metric)
    // ----------------------------------------------------
    const catScale = scaleBand<string>()
      .domain(categories)
      .range([padding.top, height - padding.bottom])
      .paddingInner(0.2)
      .paddingOuter(0.1)

    const xScale = scaleLinear()
      .domain([minVal, maxVal])
      .range([padding.left, width - padding.right])
      .nice()

    const rawBaseX = xScale(0)
    const baselineX = Number.isFinite(rawBaseX)
      ? Math.min(Math.max(rawBaseX, padding.left), width - padding.right)
      : padding.left

    let xTicks: number[] = []
    try {
      xTicks = xScale.ticks(5)
    } catch {
      xTicks = [minVal, (minVal + maxVal) / 2, maxVal]
    }
    if (!xTicks || xTicks.length === 0) {
      xTicks = [minVal, (minVal + maxVal) / 2, maxVal]
    }

    const seriesSubScale = scaleBand<string>()
      .domain(seriesKeys)
      .range([0, catScale.bandwidth()])
      .padding(0.05)

    return html`
      <div class="chart-container" style="width: 100%; height: ${height}px; position: relative;">
        <svg
          class="chart-svg"
          viewBox="0 0 ${width} ${height}"
          height="${height}"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Bar chart"
        >
          <!-- Grid Lines -->
          ${
            this.showGrid
              ? svg`
                <g class="grid-group" part="grid" aria-hidden="true">
                  ${xTicks.map((tick) => {
                    const xPos = xScale(tick)
                    if (!Number.isFinite(xPos)) return svg``
                    return svg`
                      <line
                        class="grid-line"
                        part="grid"
                        x1="${xPos}"
                        y1="${padding.top}"
                        x2="${xPos}"
                        y2="${height - padding.bottom}"
                      />
                    `
                  })}
                </g>
              `
              : ''
          }

          <!-- Y Axis Baseline -->
          <line
            class="axis-line"
            x1="${baselineX}"
            y1="${padding.top}"
            x2="${baselineX}"
            y2="${height - padding.bottom}"
          />

          <!-- Y Axis Category Labels -->
          <g class="y-axis-labels" aria-hidden="true">
            ${this.data.map((d) => {
              const cat = String(d[this.xKey] ?? '')
              const yPos = (catScale(cat) ?? 0) + catScale.bandwidth() / 2
              return svg`
                <text
                  class="axis-tick y-tick"
                  x="${padding.left - 8}"
                  y="${yPos}"
                  text-anchor="end"
                  dominant-baseline="middle"
                >
                  ${cat}
                </text>
              `
            })}
          </g>

          <!-- X Axis Metric Labels -->
          <g class="x-axis-labels" aria-hidden="true">
            ${xTicks.map((tick) => {
              const xPos = xScale(tick)
              if (!Number.isFinite(xPos)) return svg``
              const formatted = this.valueFormatter
                ? this.valueFormatter(tick)
                : String(tick)
              return svg`
                <text
                  class="axis-tick x-tick"
                  x="${xPos}"
                  y="${height - padding.bottom + 18}"
                  text-anchor="middle"
                  dominant-baseline="hanging"
                >
                  ${formatted}
                </text>
              `
            })}
          </g>

          <!-- Bars -->
          <g class="bars-group">
            ${this.data.map((d, dIdx) => {
              const cat = String(d[this.xKey] ?? '')
              const catY = catScale(cat) ?? 0
              let posSum = 0
              let negSum = 0

              return activeSeriesList.map((s, sIdx) => {
                const rawVal = Number(d[s.key])
                const val = Number.isFinite(rawVal) ? rawVal : 0
                const color = s.color || getChartColor(sIdx)

                let barX = 0
                let barY = 0
                let barWidth = 0
                let barHeight = 0
                let anchorX = 0
                let anchorY = 0

                if (this.stacked) {
                  barY = catY
                  barHeight = Math.max(1, catScale.bandwidth())
                  if (val >= 0) {
                    const base = posSum
                    const end = posSum + val
                    posSum += val
                    barX = xScale(base)
                    barWidth = Math.max(0, xScale(end) - xScale(base))
                    anchorX = barX + barWidth
                  } else {
                    const base = negSum
                    const end = negSum + val
                    negSum += val
                    barX = xScale(end)
                    barWidth = Math.max(0, xScale(base) - xScale(end))
                    anchorX = barX
                  }
                  anchorY = barY + barHeight / 2
                } else {
                  barY = catY + (seriesSubScale(s.key) ?? 0)
                  barHeight = Math.max(1, seriesSubScale.bandwidth())
                  const valX = xScale(val)
                  barX = Math.min(valX, baselineX)
                  barWidth = Math.max(0, Math.abs(valX - baselineX))
                  anchorX = val >= 0 ? barX + barWidth : barX
                  anchorY = barY + barHeight / 2
                }

                const isActive =
                  this.activeBar?.seriesKey === s.key &&
                  this.activeBar?.index === dIdx

                return svg`
                  <rect
                    class="chart-bar ${isActive ? 'is-active' : ''}"
                    part="bar"
                    data-series-key="${s.key}"
                    data-category="${cat}"
                    data-index="${dIdx}"
                    x="${barX}"
                    y="${barY}"
                    width="${barWidth}"
                    height="${barHeight}"
                    fill="${color}"
                    rx="3"
                    ry="3"
                    cursor="pointer"
                    @pointerenter="${(e: PointerEvent) =>
                      this.handleBarEnter(
                        e,
                        d,
                        s,
                        anchorX,
                        anchorY,
                        val,
                        cat,
                        dIdx,
                      )}"
                    @pointerleave="${(e: PointerEvent) =>
                      this.handleBarLeave(e)}"
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

defineElement('moul-bar-chart', MoulBarChart)

export { MoulBarChart as BarChart }

declare global {
  interface HTMLElementTagNameMap {
    'moul-bar-chart': MoulBarChart
  }
}
