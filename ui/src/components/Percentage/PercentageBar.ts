import { scaleLinear } from 'd3-scale'
import { html, LitElement, type PropertyValues } from 'lit'
import { normalizeTone, type SemanticTone } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { percentageBarStyles } from './Percentage.styles'

export type PercentageBarSize = 'sm' | 'md' | 'lg'

export interface PercentageBarProps {
  value?: number
  size?: PercentageBarSize
  tone?: SemanticTone
  showLabel?: boolean
  label?: string
  showValueText?: boolean
  color?: string
  valueFormatter?: (value: number) => string
}

/**
 * A thin horizontal bar filled to a 0–100 percentage (clamped), with an
 * optional label and value text above it, for usage and completion figures
 * such as storage used or quota spent.
 *
 * Keyboard and screen readers: not focusable. The host has
 * `role="progressbar"` with `aria-valuemin="0"`, `aria-valuemax="100"` and
 * `aria-valuenow` set to the clamped value; its accessible name is the `label`
 * attribute (copied to `aria-label`), and text slotted into `label` does not
 * name it. `valueFormatter` text is not passed on as `aria-valuetext`.
 *
 * Reduced motion: the fill jumps to a new value instead of growing or
 * shrinking over 300ms.
 */
export class MoulPercentageBar extends LitElement {
  static override styles = percentageBarStyles

  static override properties = {
    value: { type: Number },
    size: { type: String, reflect: true },
    tone: { type: String, reflect: true },
    showLabel: { type: Boolean, attribute: 'show-label' },
    label: { type: String },
    showValueText: { type: Boolean, attribute: 'show-value-text' },
    color: { type: String },
    valueFormatter: { attribute: false },
  }

  declare value: number
  declare size: PercentageBarSize
  declare tone: SemanticTone
  declare showLabel: boolean
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

  protected override render() {
    const rawVal = Number.isFinite(this.value) ? this.value : 0
    const clamped = Math.max(0, Math.min(100, rawVal))

    // D3 scale linear mapping 0-100 to 0-100%
    const scale = scaleLinear().domain([0, 100]).range([0, 100]).clamp(true)
    const fillWidth = scale(clamped)

    const formattedVal = this.valueFormatter
      ? this.valueFormatter(clamped)
      : `${Math.round(clamped)}%`

    const customStyle = this.color ? `--bar-color: ${this.color};` : ''

    return html`
      <div class="bar-container" style="${customStyle}" part="container">
        ${
          this.showLabel || this.showValueText
            ? html`
              <div class="bar-header" part="header">
                ${this.showLabel ? html`<span class="bar-label" part="label"><slot name="label">${this.label}</slot></span>` : ''}
                ${this.showValueText ? html`<span class="bar-value" part="value">${formattedVal}</span>` : ''}
              </div>
            `
            : ''
        }

        <svg class="bar-svg" viewBox="0 0 100 10" preserveAspectRatio="none" part="svg" aria-hidden="true">
          <rect class="bar-track" x="0" y="0" width="100" height="10" rx="5" ry="5" />
          <rect class="bar-fill" x="0" y="0" width="${fillWidth}" height="10" rx="5" ry="5" />
        </svg>
      </div>
    `
  }
}

defineElement('moul-percentage-bar', MoulPercentageBar)

export { MoulPercentageBar as PercentageBar }

declare global {
  interface HTMLElementTagNameMap {
    'moul-percentage-bar': MoulPercentageBar
  }
}
