import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { statStyles } from './Stat.styles.js'

export type StatTrendDirection = 'up' | 'down' | 'neutral'

@customElement('moul-stat')
export class MoulStat extends MoulBase {
  static override styles: CSSResultOrNative[] = [...MoulBase.styles, statStyles]

  @property({ type: String })
  accessor label = ''

  @property({ type: String })
  accessor value = ''

  @property({ type: String })
  accessor trend = ''

  @property({ type: String, attribute: 'trend-direction' })
  accessor trendDirection: StatTrendDirection = 'neutral'

  override render() {
    return html`
      <div class="stat">
        <div class="stat-label">
          <slot name="label">${this.label}</slot>
        </div>
        <div class="stat-value">
          <slot name="value">${this.value}</slot>
          <slot></slot>
        </div>
        ${
          this.trend
            ? html`
              <div class="stat-trend trend-${this.trendDirection}">
                <slot name="trend">${this.trend}</slot>
              </div>
            `
            : html`<slot name="trend"></slot>`
        }
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-stat': MoulStat
  }
}
