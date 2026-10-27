import { scaleLinear } from 'd3-scale'
import { curveMonotoneX, line } from 'd3-shape'
import { html, LitElement, type PropertyValues, svg } from 'lit'
import { NumberSpringController } from '../../controllers/number-spring.controller'
import {
  normalizeTone,
  normalizeVariant,
  type SemanticTone,
  type VisualVariant,
} from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import {
  CHART_EASE,
  prefersReducedMotion,
  SPRING_SNAPPY,
  subtleAnimate,
} from '../../utils/motion'
import { statStyles } from './Stat.styles'

export type StatTrend = 'up' | 'down' | 'neutral'

type TrendSentiment = 'positive' | 'negative' | 'neutral'

export interface StatProps {
  label?: string
  value?: number
  prefix?: string
  suffix?: string
  trend?: StatTrend
  trendValue?: string
  isLowerBetter?: boolean
  tone?: SemanticTone
  variant?: VisualVariant
  color?: string
  description?: string
  valueFormatter?: (value: number) => string
  sparklineData?: number[]
  sparklineLabels?: string[]
}

interface SparklinePoint {
  value: number
  label?: string
  /** Plot coordinates in the 100×100 box. */
  x: number
  y: number
}

interface SparklineGeometry {
  points: SparklinePoint[]
  linePath: string
  areaPath: string
}

/*
 * The sparkline plots into a 100×100 box stretched over the card's full width, so a
 * y coordinate doubles as a percentage for the HTML end dot (which stays round).
 */
const SPARK_SIZE = 100
const SPARK_PAD_TOP = 8
const SPARK_PAD_BOTTOM = 22
/* How far the line runs past each end of the plot; the card clips it at its edges. */
const SPARK_TAIL = SPARK_SIZE * 0.5

/** CSS `left` for a plot x; the plot stops short of both card edges by the dot inset. */
function plotLeft(x: number): string {
  return `calc(var(--_spark-inset) + (100% - 2 * var(--_spark-inset)) * ${x / SPARK_SIZE})`
}

/** Decimal places in `value` (capped at 4), so 99.98 never counts up to "100.0". */
function fractionDigits(value: number): number {
  const fraction = /\.(\d+)/.exec(String(value))?.[1] ?? ''
  return Math.min(fraction.length, 4)
}

export class MoulStat extends LitElement {
  static override styles = statStyles

  static override properties = {
    label: { type: String },
    value: { type: Number },
    prefix: { type: String },
    suffix: { type: String },
    trend: { type: String },
    trendValue: { type: String, attribute: 'trend-value' },
    isLowerBetter: {
      type: Boolean,
      reflect: true,
      attribute: 'is-lower-better',
    },
    tone: { type: String, reflect: true },
    // The default isn't reflected, so an unset variant renders the plain surface.
    variant: { type: String, reflect: true, useDefault: true },
    color: { type: String },
    description: { type: String },
    valueFormatter: { attribute: false },
    sparklineData: { attribute: false },
    sparklineLabels: { attribute: false },
  }

  declare label: string
  declare value: number
  declare prefix: string
  declare suffix: string
  declare trend: StatTrend
  declare trendValue: string
  declare isLowerBetter: boolean
  declare tone: SemanticTone
  declare variant: VisualVariant
  declare color: string
  declare description: string
  declare valueFormatter?: (value: number) => string
  declare sparklineData?: number[]
  declare sparklineLabels?: string[]

  private spring: NumberSpringController

  private sparklineId = Math.random().toString(36).slice(2, 9)

  /* Slot occupancy hides the empty icon and footer wrappers; kept off the public API. */
  private hasIcon = false
  private hasFooter = false

  private sparkline: SparklineGeometry | null = null
  /** The point under the pointer or keyboard; null shows the current value. */
  private activeIndex: number | null = null

  constructor() {
    super()
    this.label = ''
    this.value = 0
    this.prefix = ''
    this.suffix = ''
    this.trend = 'neutral'
    this.trendValue = ''
    this.isLowerBetter = false
    this.tone = 'primary'
    this.variant = 'flat'
    this.color = ''
    this.description = ''
    this.valueFormatter = undefined
    this.sparklineData = undefined
    this.sparklineLabels = undefined

    this.spring = new NumberSpringController(this, {
      initialValue: 0,
    })
  }

  public get targetValue(): number {
    return this.spring.targetValue
  }

  public get displayValue(): number {
    return this.spring.displayValue
  }

  public reset(val: number): void {
    this.value = val
    this.spring.reset(val)
  }

  /** Whether the trend is good news: down reads as positive when lower is better. */
  private get trendSentiment(): TrendSentiment {
    if (this.trend !== 'up' && this.trend !== 'down') return 'neutral'
    return (this.trend === 'up') !== this.isLowerBetter
      ? 'positive'
      : 'negative'
  }

  protected override willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps)

    if (changedProps.has('tone')) {
      const normalized = normalizeTone(this.tone)
      if (this.tone !== normalized) {
        this.tone = normalized
      }
    }

    if (changedProps.has('variant')) {
      const normalized = normalizeVariant(this.variant)
      if (this.variant !== normalized) {
        this.variant = normalized
      }
    }

    if (
      changedProps.has('sparklineData') ||
      changedProps.has('sparklineLabels')
    ) {
      this.sparkline = this.computeSparkline()
      const count = this.sparkline?.points.length ?? 0
      if (this.activeIndex !== null && this.activeIndex >= count) {
        this.activeIndex = null
      }
    }

    if (changedProps.has('value')) {
      if (!this.hasUpdated) {
        this.spring.reset(this.value ?? 0)
      } else {
        this.spring.setTarget(this.value ?? 0)
      }
    }
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('trend') || changedProps.has('trendValue')) {
      const badge = this.renderRoot?.querySelector('.trend-badge')
      if (badge) {
        subtleAnimate(
          badge,
          { transform: ['scale(0.9)', 'scale(1)'], opacity: [0, 1] },
          SPRING_SNAPPY,
        )
      }
    }

    if (changedProps.has('sparklineData')) {
      this.animateSparkline()
    }
  }

  /** The sparkline draws in once; later data updates (often live) re-render in place. */
  private hasPlayedEntrance = false

  private animateSparkline(): void {
    if (this.hasPlayedEntrance || prefersReducedMotion()) return

    const plot = this.renderRoot?.querySelector<HTMLElement>('.sparkline-plot')
    if (!plot) return
    this.hasPlayedEntrance = true

    // Wipe in left to right; the negative top inset leaves room for the end dot's halo.
    // Native WAAPI with no fill, so no clip-path is left inline once it ends (motion
    // commits its final keyframe as a style).
    plot.animate?.(
      { clipPath: ['inset(-12px 100% 0 0)', 'inset(-12px 0% 0 0)'] },
      { duration: 900, easing: `cubic-bezier(${CHART_EASE.join(', ')})` },
    )

    const dot = this.renderRoot?.querySelector('.sparkline-dot')
    if (dot) {
      subtleAnimate(
        dot,
        { transform: ['scale(0)', 'scale(1)'], opacity: [0, 1] },
        { ...SPRING_SNAPPY, delay: 0.75 },
      )
    }
  }

  private handleIconSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement
    this.hasIcon = slot.assignedNodes({ flatten: true }).length > 0
    this.requestUpdate()
  }

  private handleFooterSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement
    this.hasFooter = slot.assignedNodes({ flatten: true }).length > 0
    this.requestUpdate()
  }

  private setActiveIndex(index: number | null): void {
    if (index === this.activeIndex) return
    this.activeIndex = index
    this.requestUpdate()
  }

  /** Snaps the pointer to the nearest point; touch scrubs horizontally, scrolls vertically. */
  private handleSparklinePointer(event: PointerEvent): void {
    const count = this.sparkline?.points.length ?? 0
    const svgEl = this.renderRoot?.querySelector('.sparkline-svg')
    const rect = svgEl?.getBoundingClientRect()
    if (!count || !rect?.width) return
    const t = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1)
    this.setActiveIndex(Math.round(t * (count - 1)))
  }

  private handleSparklineLeave(): void {
    this.setActiveIndex(null)
  }

  /** Arrow keys step through points from the latest one; Escape returns to it. */
  private handleSparklineKeydown(event: KeyboardEvent): void {
    const count = this.sparkline?.points.length ?? 0
    if (!count) return
    if (event.key === 'Escape') {
      this.setActiveIndex(null)
      return
    }
    const current = this.activeIndex ?? count - 1
    const steps: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowDown: current - 1,
      ArrowRight: current + 1,
      ArrowUp: current + 1,
      Home: 0,
      End: count - 1,
    }
    const next = steps[event.key]
    if (next === undefined) return
    event.preventDefault()
    this.setActiveIndex(Math.min(Math.max(next, 0), count - 1))
  }

  private computeSparkline(): SparklineGeometry | null {
    const labels = this.sparklineLabels ?? []
    // Labels pair with values by index, so filter the pairs, not the values.
    const data = (this.sparklineData ?? [])
      .map((value, i) => ({ value, label: labels[i] }))
      .filter((d) => Number.isFinite(d.value))
    if (data.length < 2) return null

    const xScale = scaleLinear()
      .domain([0, data.length - 1])
      .range([0, SPARK_SIZE])

    const values = data.map((d) => d.value)
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const yScale = scaleLinear()
      .domain(minVal === maxVal ? [minVal - 1, maxVal + 1] : [minVal, maxVal])
      .range([SPARK_SIZE - SPARK_PAD_BOTTOM, SPARK_PAD_TOP])

    const points = data.map((d, i) => ({
      ...d,
      x: xScale(i),
      y: yScale(d.value),
    }))
    const lineGen = line<SparklinePoint>()
      .x((p) => p.x)
      .y((p) => p.y)
      .curve(curveMonotoneX)

    // Flat tails carry the line off both edges; a dot on either end hides the join.
    const curve = (lineGen(points) ?? '').replace(/^M/, 'L')
    const first = points[0] as SparklinePoint
    const linePath = `M${-SPARK_TAIL},${first.y}${curve}H${SPARK_SIZE + SPARK_TAIL}`
    const areaPath = `${linePath}V${SPARK_SIZE}H${-SPARK_TAIL}Z`
    return { points, linePath, areaPath }
  }

  private formatValue(value: number): string {
    if (this.valueFormatter) return this.valueFormatter(value)
    const digits = fractionDigits(this.value)
    return value.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  }

  private renderSparkline(): unknown {
    if (!this.sparkline) return ''

    const { points, linePath, areaPath } = this.sparkline
    const isActive = this.activeIndex !== null
    const index = this.activeIndex ?? points.length - 1
    const point = points[index] as SparklinePoint
    const gradientId = `stat-spark-${this.sparklineId}`
    const valueText = point.label
      ? `${point.label}: ${this.formatValue(point.value)}`
      : this.formatValue(point.value)

    // A slider to assistive tech: arrow keys step through the history.
    return html`
      <div
        class="sparkline"
        part="sparkline"
        style=${this.color ? `--_stat-chart: ${this.color}` : ''}
        ?data-active=${isActive}
        role="slider"
        tabindex="0"
        aria-label=${this.label}
        aria-valuemin="0"
        aria-valuemax=${points.length - 1}
        aria-valuenow=${index}
        aria-valuetext=${valueText}
        @pointerdown=${this.handleSparklinePointer}
        @pointermove=${this.handleSparklinePointer}
        @pointerleave=${this.handleSparklineLeave}
        @pointercancel=${this.handleSparklineLeave}
        @keydown=${this.handleSparklineKeydown}
        @blur=${this.handleSparklineLeave}
      >
        <div class="sparkline-plot">
          <svg
            class="sparkline-svg"
            viewBox="0 0 ${SPARK_SIZE} ${SPARK_SIZE}"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
                <stop class="sparkline-stop-start" offset="0%"></stop>
                <stop class="sparkline-stop-end" offset="100%"></stop>
              </linearGradient>
            </defs>
            <path class="sparkline-area" d="${areaPath}" fill="url(#${gradientId})" />
            <path class="sparkline-line" d="${linePath}" vector-effect="non-scaling-stroke" />
          </svg>
          <span class="sparkline-guide" style="left: ${plotLeft(point.x)}"></span>
          <span
            class="sparkline-dot"
            style="left: ${plotLeft(point.x)}; top: ${point.y}%"
          ></span>
        </div>
      </div>
      <span class="focus-ring" aria-hidden="true"></span>
    `
  }

  private renderTrendIcon(trend: StatTrend): unknown {
    if (trend === 'up') {
      return svg`
        <svg class="trend-icon" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M5 1.75 8.75 8.25H1.25Z" />
        </svg>
      `
    }
    if (trend === 'down') {
      return svg`
        <svg class="trend-icon" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M5 8.25 8.75 1.75H1.25Z" />
        </svg>
      `
    }
    return svg`
      <svg class="trend-icon" viewBox="0 0 10 10" aria-hidden="true">
        <rect x="1.5" y="4.25" width="7" height="1.5" rx="0.75" />
      </svg>
    `
  }

  private renderTrendBadge(): unknown {
    if (!this.trendValue && this.trend === 'neutral') return ''

    const direction =
      this.trend === 'up' ? 'Up' : this.trend === 'down' ? 'Down' : ''

    return html`
      <span
        class="trend-badge trend-${this.trend} is-${this.trendSentiment}"
        part="trend-badge"
      >
        ${this.renderTrendIcon(this.trend)}
        ${direction ? html`<span class="sr-only">${direction}</span>` : ''}
        ${this.trendValue ? html`<span>${this.trendValue}</span>` : ''}
      </span>
    `
  }

  protected override render() {
    // While scrubbing, the headline shows the active point instead of the spring.
    const active =
      this.activeIndex === null
        ? undefined
        : this.sparkline?.points[this.activeIndex]
    const formattedVal = this.formatValue(
      active ? active.value : this.spring.displayValue,
    )
    const hasLabels = !!this.sparkline?.points.some((p) => p.label)
    const descriptionText = active?.label ?? this.description

    return html`
      <div class="header" part="header">
        <span class="icon" part="icon" ?hidden=${!this.hasIcon}>
          <slot name="icon" @slotchange=${this.handleIconSlotChange}></slot>
        </span>
        <span class="label" part="label">${this.label}</span>
        ${this.renderTrendBadge()}
      </div>

      <div class="body" part="body">
        <div class="value-row" part="value-row">
          ${this.prefix ? html`<span class="prefix" part="prefix">${this.prefix}</span>` : ''}
          <span class="value" part="value">${formattedVal}</span>
          ${this.suffix ? html`<span class="suffix" part="suffix">${this.suffix}</span>` : ''}
        </div>
        ${
          this.description || hasLabels
            ? html`<span class="description" part="description">${descriptionText}</span>`
            : ''
        }
      </div>

      <div class="footer" part="footer" ?hidden=${!this.hasFooter}>
        <slot name="footer" @slotchange=${this.handleFooterSlotChange}></slot>
      </div>

      ${this.renderSparkline()}
    `
  }
}

defineElement('moul-stat', MoulStat)

export { MoulStat as Stat }

declare global {
  interface HTMLElementTagNameMap {
    'moul-stat': MoulStat
  }
}
