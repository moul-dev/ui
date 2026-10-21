import { arc, type PieArcDatum, pie } from 'd3-shape'
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
  type DoughnutDataItem,
  getChartColor,
  type PointHoverDetail,
} from '../ChartCommon'
import { doughnutChartStyles } from './DoughnutChart.styles'

export interface DoughnutChartProps {
  data?: DoughnutDataItem[]
  innerRadiusRatio?: number
  height?: number
  centerLabel?: string
  centerSublabel?: string
  padAngle?: number
  cornerRadius?: number
  valueFormatter?: (value: any) => string
}

export class MoulDoughnutChart extends LitElement {
  static override styles = doughnutChartStyles

  static override properties = {
    data: { attribute: false },
    innerRadiusRatio: { type: Number, attribute: 'inner-radius-ratio' },
    height: { type: Number },
    centerLabel: { type: String, attribute: 'center-label' },
    centerSublabel: { type: String, attribute: 'center-sublabel' },
    padAngle: { type: Number, attribute: 'pad-angle' },
    cornerRadius: { type: Number, attribute: 'corner-radius' },
    valueFormatter: { attribute: false },
  }

  declare data: DoughnutDataItem[]
  declare innerRadiusRatio: number
  declare height: number
  declare centerLabel: string
  declare centerSublabel: string
  declare padAngle: number
  declare cornerRadius: number
  declare valueFormatter?: (value: any) => string

  public layout: LayoutIndicatorController
  private activeSliceIndex: number | null = null

  constructor() {
    super()
    this.data = []
    this.innerRadiusRatio = 0.6
    this.height = 300
    this.centerLabel = ''
    this.centerSublabel = ''
    this.padAngle = 0.02
    this.cornerRadius = 4
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
        : 300
  }

  public get containerHeight(): number {
    return this.height > 0
      ? this.height
      : this.layout.height > 0
        ? this.layout.height
        : 300
  }

  public get effectiveInnerRadiusRatio(): number {
    const ratio = Number(this.innerRadiusRatio)
    if (!Number.isFinite(ratio) || ratio <= 0) return 0
    return Math.min(0.95, ratio)
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    if (
      changedProps.has('data') ||
      changedProps.has('innerRadiusRatio') ||
      changedProps.has('height')
    ) {
      this.animateSlices()
    }
  }

  private animateSlices(): void {
    if (prefersReducedMotion()) return

    const slices = this.renderRoot?.querySelectorAll<SVGPathElement>('.slice')
    if (slices && slices.length > 0) {
      subtleAnimate(
        slices,
        { opacity: [0, 1] },
        { duration: 0.38, delay: stagger(0.04), ease: CHART_EASE },
      )
    }
  }

  private handleSliceEnter(
    _event: PointerEvent | FocusEvent,
    d: PieArcDatum<DoughnutDataItem>,
    index: number,
    centroid: [number, number],
    cx: number,
    cy: number,
  ): void {
    this.activeSliceIndex = index
    this.requestUpdate()

    const formattedValue = this.valueFormatter
      ? this.valueFormatter(d.data.value)
      : d.data.value

    const sliceColor = d.data.color || getChartColor(d.index)

    const detail: PointHoverDetail = {
      point: d.data as Record<string, unknown>,
      series: {
        key: d.data.name,
        name: d.data.name,
        color: sliceColor,
      },
      value: formattedValue,
      label: d.data.name,
      x: Math.round(cx + centroid[0]),
      y: Math.round(cy + centroid[1]),
    }

    this.dispatchEvent(
      new CustomEvent<PointHoverDetail>('point-hover', {
        bubbles: true,
        composed: true,
        detail,
      }),
    )
  }

  private handleSliceLeave(_event?: PointerEvent | FocusEvent): void {
    this.activeSliceIndex = null
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

    const width = this.containerWidth
    const height = this.containerHeight
    const cx = width / 2
    const cy = height / 2

    const padding = 16
    const maxRadius = Math.max(10, Math.min(width, height) / 2 - padding)
    const outerRadius = maxRadius
    const innerRadius = outerRadius * this.effectiveInnerRadiusRatio

    const totalPositive = this.data.reduce(
      (sum, item) => sum + Math.max(0, Number(item?.value) || 0),
      0,
    )

    const positiveItems = this.data.filter(
      (item) => (Number(item?.value) || 0) > 0,
    )
    const isSingleSlice = positiveItems.length <= 1

    const pieGen = pie<DoughnutDataItem>()
      .value((d) => Math.max(0, Number(d.value) || 0))
      .sort(null)
      .padAngle(isSingleSlice ? 0 : this.padAngle)

    const arcs = pieGen(this.data)

    const baseArcGen = arc<PieArcDatum<DoughnutDataItem>>()
      .innerRadius(innerRadius)
      .cornerRadius(isSingleSlice ? 0 : this.cornerRadius)

    return html`
      <div class="chart-wrapper" part="wrapper" style="height: ${height}px">
        <svg
          class="chart-svg"
          viewBox="0 0 ${width} ${height}"
          preserveAspectRatio="xMidYMid meet"
          part="svg"
          role="img"
          aria-label="${this.centerLabel || 'Doughnut chart'}"
        >
          <g transform="translate(${cx}, ${cy})">
            ${
              totalPositive === 0
                ? svg`
                  <circle
                    class="empty-track"
                    cx="0"
                    cy="0"
                    r="${(outerRadius + innerRadius) / 2}"
                    stroke="var(--color-default, #f4f4f5)"
                    stroke-width="${Math.max(2, outerRadius - innerRadius)}"
                    fill="none"
                  />
                `
                : arcs.map((d, idx) => {
                    if (d.startAngle === d.endAngle) return svg``

                    const isActive = this.activeSliceIndex === idx
                    const currentOuterRadius = isActive
                      ? outerRadius + 6
                      : outerRadius

                    const pathD = baseArcGen.outerRadius(currentOuterRadius)(d)
                    if (!pathD) return svg``

                    const color = d.data.color || getChartColor(d.index)
                    const centroid = baseArcGen.centroid(d)
                    const formattedValue = this.valueFormatter
                      ? this.valueFormatter(d.data.value)
                      : String(d.data.value)

                    return svg`
                    <path
                      class="slice ${isActive ? 'is-active' : ''}"
                      part="slice"
                      data-index="${idx}"
                      data-name="${d.data.name}"
                      data-value="${d.data.value}"
                      d="${pathD}"
                      fill="${color}"
                      stroke="var(--color-surface, #ffffff)"
                      stroke-width="1.5"
                      role="graphics-symbol"
                      aria-label="${d.data.name}: ${formattedValue}"
                      tabindex="0"
                      @pointerenter="${(e: PointerEvent) =>
                        this.handleSliceEnter(e, d, idx, centroid, cx, cy)}"
                      @pointerleave="${(e: PointerEvent) =>
                        this.handleSliceLeave(e)}"
                      @focus="${(e: FocusEvent) =>
                        this.handleSliceEnter(e, d, idx, centroid, cx, cy)}"
                      @blur="${(e: FocusEvent) => this.handleSliceLeave(e)}"
                    />
                  `
                  })
            }
          </g>
        </svg>

        ${
          innerRadius > 0
            ? html`
              <div
                class="center-container"
                part="center"
                style="width: ${innerRadius * 2}px; height: ${innerRadius * 2}px; left: ${cx - innerRadius}px; top: ${cy - innerRadius}px;"
              >
                <slot name="center">
                  ${
                    this.centerLabel || this.centerSublabel
                      ? html`
                        <div class="center-labels">
                          ${
                            this.centerLabel
                              ? html`<div class="center-label" part="center-label">${this.centerLabel}</div>`
                              : ''
                          }
                          ${
                            this.centerSublabel
                              ? html`<div class="center-sublabel" part="center-sublabel">${this.centerSublabel}</div>`
                              : ''
                          }
                        </div>
                      `
                      : ''
                  }
                </slot>
              </div>
            `
            : ''
        }
      </div>
    `
  }
}

defineElement('moul-doughnut-chart', MoulDoughnutChart)

export { MoulDoughnutChart as DoughnutChart }

declare global {
  interface HTMLElementTagNameMap {
    'moul-doughnut-chart': MoulDoughnutChart
  }
}
