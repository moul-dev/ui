import { arc, type PieArcDatum, pie } from 'd3-shape'
import { html, LitElement, nothing, type PropertyValues, svg } from 'lit'

import { LayoutIndicatorController } from '../../controllers/layout-indicator.controller'
import { NumberSpringController } from '../../controllers/number-spring.controller'
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

export type DoughnutChartShape = 'full' | 'half'

export interface DoughnutChartProps {
  data?: DoughnutDataItem[]
  innerRadiusRatio?: number
  height?: number
  centerLabel?: string
  centerSublabel?: string
  padAngle?: number
  cornerRadius?: number
  shape?: DoughnutChartShape
  value?: number | null
  min?: number
  max?: number
  color?: string
  label?: string
  valueFormatter?: (value: any) => string
}

/** How long the centre keeps a slice after the pointer leaves it, so moving to the next slice counts instead of flashing the label. */
const CENTRE_LINGER = 120

/** Decimal places in `value` (capped at 4), so a count to 99.5 never shows "99.4999". */
function fractionDigits(value: number): number {
  const fraction = /\.(\d+)/.exec(String(value))?.[1] ?? ''
  return Math.min(fraction.length, 4)
}

/**
 * A doughnut chart of named values (`data` items `{ name, value }`), or a pie
 * when `inner-radius-ratio` is 0, with an optional `center-label` and
 * `center-sublabel` (or the `center` slot) in the hole. Hovering or focusing a
 * slice fires `point-hover` and shows that slice's value and name in the
 * centre, counting from one slice's value to the next. `shape="half"` draws a
 * half circle. Set `value` (with `min` and `max`, 0 to 100 by default) and it
 * becomes a gauge instead: a track and one arc that sweeps to each new value
 * with a spring, while the number in the centre counts along with it.
 *
 * Keyboard and screen readers: every slice is its own `Tab` stop, with a focus
 * ring on `:focus-visible`; focusing one highlights it, shows it in the
 * centre and fires `point-hover` as hovering does, blurring fires
 * `point-leave`, and no other keys do anything. Each slice has
 * `role="graphics-symbol"` and an `aria-label` of "name: value" (value
 * through `valueFormatter`), but sits inside an SVG `role="img"` named by
 * `label`, `center-label` or "Doughnut chart", whose children ARIA treats as
 * presentational, so some screen readers announce only that name. There is no
 * data table. A gauge takes no focus: it is one `role="meter"` named by
 * `label` (else `center-sublabel`, else "Gauge") with `aria-valuenow`,
 * `aria-valuemin`, `aria-valuemax` and the formatted value as
 * `aria-valuetext`; value changes are not announced.
 *
 * Reduced motion: on first render the slices fade in one after another; under
 * reduced motion they appear at once. The active slice dims to 85% opacity,
 * fading over 150ms normally and instantly under reduced motion; its 6px step
 * outward is always instant. The centre value counts between slices and the
 * gauge arc sweeps with its number; under reduced motion both jump to the new
 * value.
 *
 * @slot center - Replaces the center label and sublabel in the hole.
 * @slot empty - Shown instead of the chart when `data` is empty and no gauge `value` is set.
 * @fires point-hover - A slice is hovered or focused; `detail` has its value.
 * @fires point-leave - The pointer or focus left a slice.
 * @csspart wrapper - The chart box; the `role="meter"` in gauge mode.
 * @csspart svg - The SVG.
 * @csspart slice - Each slice.
 * @csspart track - The gauge's unfilled track.
 * @csspart value-arc - The gauge's filled arc.
 * @csspart center - The box in the hole.
 * @csspart center-label - The large centre text: the label, the active slice's value, or the gauge value.
 * @csspart center-sublabel - The small centre text.
 * @cssprop --doughnut-track-color - The gauge track colour. Defaults to `var(--color-fill-track)`.
 */
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
    shape: { type: String, reflect: true },
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    color: { type: String },
    label: { type: String },
    valueFormatter: { attribute: false },
  }

  declare data: DoughnutDataItem[]
  declare innerRadiusRatio: number
  declare height: number
  declare centerLabel: string
  declare centerSublabel: string
  declare padAngle: number
  declare cornerRadius: number
  /** `full` circle (default) or `half` circle, opening downward. */
  declare shape: DoughnutChartShape
  /** The gauge value. Setting it turns the chart into a gauge; `null` returns to the slices. */
  declare value: number | null
  /** The gauge's lowest value. */
  declare min: number
  /** The gauge's highest value. */
  declare max: number
  /** The gauge arc's colour. Defaults to `var(--color-chart-1)`. */
  declare color: string
  /** The accessible name: of the SVG for slices, of the meter for a gauge. */
  declare label: string
  declare valueFormatter?: (value: any) => string

  public layout: LayoutIndicatorController
  private activeSliceIndex: number | null = null
  /** The slice the centre shows; it lingers briefly after the slice loses hover. */
  private centreIndex: number | null = null
  private centreTimer: ReturnType<typeof setTimeout> | undefined
  private hasGaugeStarted = false
  /** The centre number and the gauge sweep, moving together on one spring. */
  private readonly counter = new NumberSpringController(this, {
    threshold: 0.001,
  })

  constructor() {
    super()
    this.data = []
    this.innerRadiusRatio = 0.6
    this.height = 300
    this.centerLabel = ''
    this.centerSublabel = ''
    this.padAngle = 0.02
    this.cornerRadius = 4
    this.shape = 'full'
    this.value = null
    this.min = 0
    this.max = 100
    this.color = ''
    this.label = ''
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

  /** True when `value` is a number, so the chart draws a gauge. */
  public get isGauge(): boolean {
    return (
      this.value !== null &&
      this.value !== undefined &&
      Number.isFinite(Number(this.value))
    )
  }

  private get isHalf(): boolean {
    return this.shape === 'half'
  }

  /** The gauge's range, with `max` above `min` whatever was set. */
  private get range(): [number, number] {
    const min = Number.isFinite(Number(this.min)) ? Number(this.min) : 0
    const max = Number.isFinite(Number(this.max)) ? Number(this.max) : 100
    return max > min ? [min, max] : [min, min + 1]
  }

  private get gaugeTarget(): number {
    const [min, max] = this.range
    return Math.min(max, Math.max(min, Number(this.value)))
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    clearTimeout(this.centreTimer)
    this.centreIndex = null
  }

  protected override willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps)
    if (changedProps.has('shape') && this.shape !== 'half') {
      if (this.shape !== 'full') this.shape = 'full'
    }
    if (
      this.isGauge &&
      (changedProps.has('value') ||
        changedProps.has('min') ||
        changedProps.has('max'))
    ) {
      // The first value sweeps in from the bottom of the range.
      if (!this.hasGaugeStarted) {
        this.hasGaugeStarted = true
        this.counter.reset(this.range[0])
      }
      this.counter.setTarget(this.gaugeTarget)
    } else if (!this.isGauge && this.hasGaugeStarted) {
      this.hasGaugeStarted = false
    }
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

  /** Charts fade in once; later data updates (often live) re-render in place. */
  private hasPlayedEntrance = false

  private animateSlices(): void {
    if (this.hasPlayedEntrance || prefersReducedMotion()) return

    const slices = this.renderRoot?.querySelectorAll<SVGPathElement>('.slice')
    if (slices && slices.length > 0) {
      this.hasPlayedEntrance = true
      subtleAnimate(
        slices,
        { opacity: [0, 1] },
        { duration: 0.38, delay: stagger(0.04), ease: CHART_EASE },
      )
    }
  }

  /** Formats a number the centre shows, keeping the decimals of the value it counts to. */
  private formatCount(display: number, target: number): string {
    const digits = fractionDigits(target)
    const factor = 10 ** digits
    const rounded = Math.round(display * factor) / factor
    if (this.valueFormatter) return String(this.valueFormatter(rounded))
    return rounded.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  }

  private handleSliceEnter(
    d: PieArcDatum<DoughnutDataItem>,
    index: number,
    centroid: [number, number],
    cx: number,
    cy: number,
  ): void {
    this.activeSliceIndex = index
    // Moving straight from one slice to the next counts; arriving from outside jumps.
    const value = Number(d.data.value) || 0
    const isContinuing = this.centreIndex !== null
    clearTimeout(this.centreTimer)
    this.centreIndex = index
    if (isContinuing) this.counter.setTarget(value)
    else this.counter.reset(value)
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

  private handleSliceLeave(): void {
    this.activeSliceIndex = null
    clearTimeout(this.centreTimer)
    this.centreTimer = setTimeout(() => {
      this.centreIndex = null
      this.requestUpdate()
    }, CENTRE_LINGER)
    this.requestUpdate()

    this.dispatchEvent(
      new CustomEvent('point-leave', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  /** Where the ring sits: centre, radii and the angles it spans. */
  private layoutRing(width: number, height: number) {
    const padding = 16
    const outerRadius = this.isHalf
      ? Math.max(10, Math.min(width / 2 - padding, height - padding * 2))
      : Math.max(10, Math.min(width, height) / 2 - padding)
    return {
      cx: width / 2,
      // A half ring sits on its flat edge, centred in the box as a whole.
      cy: this.isHalf ? (height + outerRadius) / 2 : height / 2,
      outerRadius,
      innerRadius: outerRadius * this.effectiveInnerRadiusRatio,
      startAngle: this.isHalf ? -Math.PI / 2 : 0,
      endAngle: this.isHalf ? Math.PI / 2 : Math.PI * 2,
    }
  }

  private renderCentre(
    cx: number,
    cy: number,
    innerRadius: number,
    labels: { label: string; sublabel: string },
  ) {
    if (innerRadius <= 0) return nothing
    const box = this.isHalf
      ? `width: ${innerRadius * 2}px; height: ${innerRadius}px; left: ${cx - innerRadius}px; top: ${cy - innerRadius}px;`
      : `width: ${innerRadius * 2}px; height: ${innerRadius * 2}px; left: ${cx - innerRadius}px; top: ${cy - innerRadius}px;`
    return html`
      <div
        class="center-container ${this.isHalf ? 'is-half' : ''}"
        part="center"
        style="${box}"
      >
        <slot name="center">
          ${
            labels.label || labels.sublabel
              ? html`
                <div class="center-labels">
                  ${
                    labels.label
                      ? html`<div class="center-label" part="center-label">${labels.label}</div>`
                      : ''
                  }
                  ${
                    labels.sublabel
                      ? html`<div class="center-sublabel" part="center-sublabel">${labels.sublabel}</div>`
                      : ''
                  }
                </div>
              `
              : ''
          }
        </slot>
      </div>
    `
  }

  private renderGauge() {
    const width = this.containerWidth
    const height = this.containerHeight
    const ring = this.layoutRing(width, height)
    const { cx, cy, outerRadius, innerRadius, startAngle, endAngle } = ring
    const [min, max] = this.range
    const target = this.gaugeTarget
    const display = this.counter.displayValue
    const fraction = Math.min(1, Math.max(0, (display - min) / (max - min)))
    const ringArc = arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(this.cornerRadius)
    const trackD = ringArc({ startAngle, endAngle }) ?? ''
    const valueD =
      fraction > 0
        ? (ringArc({
            startAngle,
            endAngle: startAngle + (endAngle - startAngle) * fraction,
          }) ?? '')
        : ''
    const valueText = this.formatCount(target, target)
    const name = this.label || this.centerSublabel || 'Gauge'

    return html`
      <div
        class="chart-wrapper"
        part="wrapper"
        style="height: ${height}px"
        role="meter"
        aria-label=${name}
        aria-valuemin=${String(min)}
        aria-valuemax=${String(max)}
        aria-valuenow=${String(target)}
        aria-valuetext=${valueText}
      >
        <svg
          class="chart-svg"
          viewBox="0 0 ${width} ${height}"
          preserveAspectRatio="xMidYMid meet"
          part="svg"
          aria-hidden="true"
        >
          <g transform="translate(${cx}, ${cy})">
            <path class="gauge-track" part="track" d="${trackD}"></path>
            ${
              valueD
                ? svg`<path
                  class="gauge-value"
                  part="value-arc"
                  d="${valueD}"
                  fill="${this.color || 'var(--color-chart-1)'}"
                ></path>`
                : nothing
            }
          </g>
        </svg>
        ${this.renderCentre(cx, cy, innerRadius, {
          label: this.centerLabel || this.formatCount(display, target),
          sublabel: this.centerSublabel,
        })}
      </div>
    `
  }

  protected override render() {
    if (this.isGauge) return this.renderGauge()

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
    const ring = this.layoutRing(width, height)
    const { cx, cy, outerRadius, innerRadius, startAngle, endAngle } = ring

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
      .startAngle(startAngle)
      .endAngle(endAngle)
      .padAngle(isSingleSlice ? 0 : this.padAngle)

    const arcs = pieGen(this.data)

    const baseArcGen = arc<PieArcDatum<DoughnutDataItem>>()
      .innerRadius(innerRadius)
      .cornerRadius(isSingleSlice ? 0 : this.cornerRadius)

    // The centre follows the hovered or focused slice, then returns to its label.
    const centreItem =
      this.centreIndex !== null ? this.data[this.centreIndex] : undefined
    const centre = centreItem
      ? {
          label: this.formatCount(
            this.counter.displayValue,
            Number(centreItem.value) || 0,
          ),
          sublabel: centreItem.name,
        }
      : { label: this.centerLabel, sublabel: this.centerSublabel }

    const emptyTrack = this.isHalf
      ? svg`
        <path
          class="empty-track"
          d="${
            arc<{ startAngle: number; endAngle: number }>()
              .innerRadius(innerRadius)
              .outerRadius(outerRadius)({ startAngle, endAngle }) ?? ''
          }"
          fill="var(--color-default, #f4f4f5)"
        />
      `
      : svg`
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

    return html`
      <div class="chart-wrapper" part="wrapper" style="height: ${height}px">
        <svg
          class="chart-svg"
          viewBox="0 0 ${width} ${height}"
          preserveAspectRatio="xMidYMid meet"
          part="svg"
          role="img"
          aria-label="${this.label || this.centerLabel || 'Doughnut chart'}"
        >
          <g transform="translate(${cx}, ${cy})">
            ${
              totalPositive === 0
                ? emptyTrack
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
                      @pointerenter="${() =>
                        this.handleSliceEnter(d, idx, centroid, cx, cy)}"
                      @pointerleave="${() => this.handleSliceLeave()}"
                      @focus="${() =>
                        this.handleSliceEnter(d, idx, centroid, cx, cy)}"
                      @blur="${() => this.handleSliceLeave()}"
                    />
                  `
                  })
            }
          </g>
        </svg>

        ${this.renderCentre(cx, cy, innerRadius, centre)}
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
