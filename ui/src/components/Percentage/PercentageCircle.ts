import { arc } from 'd3-shape'
import { html, LitElement, type PropertyValues, svg } from 'lit'
import { normalizeTone, type SemanticTone } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { percentageCircleStyles } from './Percentage.styles'

export type PercentageCircleSize = 'sm' | 'md' | 'lg' | number

export interface PercentageCircleProps {
  value?: number
  size?: PercentageCircleSize
  tone?: SemanticTone
  showLabel?: boolean
  strokeWidth?: number
  label?: string
  showValueText?: boolean
  color?: string
  valueFormatter?: (value: number) => string
}

export class MoulPercentageCircle extends LitElement {
  static override styles = percentageCircleStyles

  static override properties = {
    value: { type: Number },
    size: {
      type: String,
      converter: {
        fromAttribute: (val: string | null) => {
          if (!val) return 'md'
          const num = Number(val)
          return Number.isFinite(num) && !isNaN(num) ? num : val
        },
        toAttribute: (val: PercentageCircleSize) => String(val),
      },
    },
    tone: { type: String, reflect: true },
    showLabel: { type: Boolean, attribute: 'show-label' },
    strokeWidth: { type: Number, attribute: 'stroke-width' },
    label: { type: String },
    showValueText: { type: Boolean, attribute: 'show-value-text' },
    color: { type: String },
    valueFormatter: { attribute: false },
  }

  declare value: number
  declare size: PercentageCircleSize
  declare tone: SemanticTone
  declare showLabel: boolean
  declare strokeWidth: number
  declare label: string
  declare showValueText: boolean
  declare color: string
  declare valueFormatter?: (value: number) => string

  constructor() {
    super()
    this.value = 0
    this.size = 'md'
    this.tone = 'primary'
    this.showLabel = true
    this.strokeWidth = 8
    this.label = ''
    this.showValueText = true
    this.color = ''
    this.valueFormatter = undefined
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'progressbar')
    this.setAttribute('aria-valuemin', '0')
    this.setAttribute('aria-valuemax', '100')
    this.syncAria()
  }

  protected override willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps)

    if (changedProps.has('tone')) {
      const normalized = normalizeTone(this.tone)
      if (this.tone !== normalized) {
        this.tone = normalized
      }
    }

    if (changedProps.has('value')) {
      this.syncAria()
    }
  }

  private syncAria(): void {
    const clamped = Math.max(
      0,
      Math.min(100, Number.isFinite(this.value) ? this.value : 0),
    )
    this.setAttribute('aria-valuenow', String(clamped))
    if (this.label) {
      this.setAttribute('aria-label', this.label)
    }
  }

  private resolvePixelSize(): number {
    if (typeof this.size === 'number') return this.size
    switch (this.size) {
      case 'sm':
        return 60
      case 'lg':
        return 120
      default:
        return 80
    }
  }

  protected override render() {
    const rawVal = Number.isFinite(this.value) ? this.value : 0
    const clamped = Math.max(0, Math.min(100, rawVal))
    const pixelSize = this.resolvePixelSize()
    const strokeW = Math.max(2, Math.min(pixelSize / 2, this.strokeWidth || 8))

    const outerRadius = pixelSize / 2
    const innerRadius = Math.max(0, outerRadius - strokeW)

    // D3 arc generator for circular background track and fill arc
    const trackArcGenerator = arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(0)
      .endAngle(2 * Math.PI)

    const fillArcGenerator = arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(0)
      .endAngle((clamped / 100) * 2 * Math.PI)
      .cornerRadius(strokeW / 2)

    const trackPath = trackArcGenerator({} as any) || ''
    const fillPath = clamped > 0 ? fillArcGenerator({} as any) || '' : ''

    const formattedVal = this.valueFormatter
      ? this.valueFormatter(clamped)
      : `${Math.round(clamped)}%`

    const customStyle = this.color ? `--circle-color: ${this.color};` : ''

    return html`
      <div class="circle-wrapper" style="width: ${pixelSize}px; height: ${pixelSize}px; ${customStyle}" part="wrapper">
        <svg
          class="circle-svg"
          width="${pixelSize}"
          height="${pixelSize}"
          viewBox="-${pixelSize / 2} -${pixelSize / 2} ${pixelSize} ${pixelSize}"
          part="svg"
          aria-hidden="true"
        >
          <path class="circle-track" d="${trackPath}" />
          ${fillPath ? svg`<path class="circle-fill" d="${fillPath}" />` : ''}
        </svg>

        <div class="circle-center" part="center">
          <slot>
            ${this.showValueText ? html`<span class="circle-value" part="value">${formattedVal}</span>` : ''}
          </slot>
          ${
            this.showLabel && this.label
              ? html`<span class="circle-label" part="label"><slot name="label">${this.label}</slot></span>`
              : ''
          }
        </div>
      </div>
    `
  }
}

defineElement('moul-percentage-circle', MoulPercentageCircle)

export { MoulPercentageCircle as PercentageCircle }

declare global {
  interface HTMLElementTagNameMap {
    'moul-percentage-circle': MoulPercentageCircle
  }
}
