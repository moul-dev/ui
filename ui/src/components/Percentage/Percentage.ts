import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { percentageStyles } from './Percentage.styles.js'

@customElement('moul-percentage-bar')
export class MoulPercentageBar extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    percentageStyles,
  ]

  @property({ type: Number })
  accessor value = 0

  @property({ type: String })
  accessor variant = 'primary'

  override render() {
    const clamped = Math.min(Math.max(this.value, 0), 100)
    const bgClass = this.variant ? `bg-${this.variant}` : ''

    return html`
      <div class="progress" role="progressbar" aria-valuenow="${clamped}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar ${bgClass}" style="width: ${clamped}%"></div>
      </div>
    `
  }
}

@customElement('moul-percentage-circle')
export class MoulPercentageCircle extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    percentageStyles,
  ]

  @property({ type: Number })
  accessor value = 0

  @property({ type: Number })
  accessor size = 64

  @property({ type: Number, attribute: 'stroke-width' })
  accessor strokeWidth = 6

  override render() {
    const clamped = Math.min(Math.max(this.value, 0), 100)
    const radius = (this.size - this.strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (clamped / 100) * circumference

    return html`
      <div class="circle-container" style="width: ${this.size}px; height: ${this.size}px;">
        <svg class="circle-svg" width="${this.size}" height="${this.size}">
          <circle
            class="circle-bg"
            cx="${this.size / 2}"
            cy="${this.size / 2}"
            r="${radius}"
            stroke-width="${this.strokeWidth}"
          />
          <circle
            class="circle-progress"
            cx="${this.size / 2}"
            cy="${this.size / 2}"
            r="${radius}"
            stroke-width="${this.strokeWidth}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
          />
        </svg>
        <div class="circle-label">
          <slot>${clamped}%</slot>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-percentage-bar': MoulPercentageBar
    'moul-percentage-circle': MoulPercentageCircle
  }
}
