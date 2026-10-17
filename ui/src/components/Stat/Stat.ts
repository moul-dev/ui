import { scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'
import { html, LitElement, type PropertyValues, svg } from 'lit'
import { NumberSpringController } from '../../controllers/number-spring.controller'
import {
  normalizeTone,
  normalizeVariant,
  type SemanticTone,
  type VisualVariant,
} from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { SPRING_SNAPPY, subtleAnimate } from '../../utils/motion'
import { statStyles } from './Stat.styles'

export type StatTrend = 'up' | 'down' | 'neutral'

export interface StatProps {
  label?: string
  value?: number
  prefix?: string
  suffix?: string
  trend?: StatTrend
  trendValue?: string
  tone?: SemanticTone
  variant?: VisualVariant
  description?: string
  valueFormatter?: (value: number) => string
  sparklineData?: number[]
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
    tone: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    description: { type: String },
    valueFormatter: { attribute: false },
    sparklineData: { attribute: false },
  }

  declare label: string
  declare value: number
  declare prefix: string
  declare suffix: string
  declare trend: StatTrend
  declare trendValue: string
  declare tone: SemanticTone
  declare variant: VisualVariant
  declare description: string
  declare valueFormatter?: (value: number) => string
  declare sparklineData?: number[]

  private spring: NumberSpringController

  constructor() {
    super()
    this.label = ''
    this.value = 0
    this.prefix = ''
    this.suffix = ''
    this.trend = 'neutral'
    this.trendValue = ''
    this.tone = 'primary'
    this.variant = 'flat'
    this.description = ''
    this.valueFormatter = undefined
    this.sparklineData = undefined

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
          { scale: [0.9, 1], opacity: [0, 1] },
          SPRING_SNAPPY,
        )
      }
    }
  }

  private renderSparkline(): unknown {
    if (!this.sparklineData || this.sparklineData.length < 2) return ''

    const width = 80
    const height = 24
    const padding = 2

    const xScale = scaleLinear()
      .domain([0, this.sparklineData.length - 1])
      .range([padding, width - padding])

    const minVal = Math.min(...this.sparklineData)
    const maxVal = Math.max(...this.sparklineData)
    const yScale = scaleLinear()
      .domain([
        minVal === maxVal ? minVal - 1 : minVal,
        minVal === maxVal ? maxVal + 1 : maxVal,
      ])
      .range([height - padding, padding])

    const lineGen = line<number>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d))

    const pathData = lineGen(this.sparklineData) || ''

    return svg`
      <svg class="sparkline-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true">
        <path d="${pathData}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `
  }

  private renderTrendIcon(trend: StatTrend): unknown {
    if (trend === 'up') {
      return svg`
        <svg class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      `
    }
    if (trend === 'down') {
      return svg`
        <svg class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      `
    }
    return svg`
      <svg class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    `
  }

  protected override render() {
    const rawVal = this.spring.displayValue
    const formattedVal = this.valueFormatter
      ? this.valueFormatter(rawVal)
      : Number.isInteger(this.value)
        ? Math.round(rawVal).toLocaleString()
        : rawVal.toFixed(1)

    const hasFooter =
      this.trendValue || this.trend !== 'neutral' || this.description

    return html`
      <div class="header" part="header">
        <span class="label" part="label">${this.label}</span>
        <div class="icon" part="icon">
          <slot name="icon"></slot>
        </div>
      </div>

      <div class="body" part="body">
        <div class="value-row" part="value-row">
          ${this.prefix ? html`<span class="prefix" part="prefix">${this.prefix}</span>` : ''}
          <span class="value" part="value">${formattedVal}</span>
          ${this.suffix ? html`<span class="suffix" part="suffix">${this.suffix}</span>` : ''}
        </div>
        ${this.renderSparkline()}
      </div>

      ${
        hasFooter
          ? html`
            <div class="footer" part="footer">
              ${
                this.trendValue || this.trend !== 'neutral'
                  ? html`
                    <span class="trend-badge trend-${this.trend}" part="trend-badge">
                      ${this.renderTrendIcon(this.trend)}
                      ${this.trendValue ? html`<span>${this.trendValue}</span>` : ''}
                    </span>
                  `
                  : ''
              }
              ${this.description ? html`<span class="description" part="description">${this.description}</span>` : ''}
              <slot name="footer"></slot>
            </div>
          `
          : html`<slot name="footer"></slot>`
      }
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
