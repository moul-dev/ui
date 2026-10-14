import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { progressBarStyles } from './ProgressBar.styles.js'

@customElement('moul-progress-bar')
export class MoulProgressBar extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    progressBarStyles,
  ]

  @property({ type: Number })
  accessor value = 0

  @property({ type: Number })
  accessor max = 100

  @property({ type: String, reflect: true })
  accessor variant = 'primary'

  @property({ type: Boolean, attribute: 'is-striped', reflect: true })
  accessor isStriped = false

  @property({ type: Boolean, attribute: 'is-animated', reflect: true })
  accessor isAnimated = false

  @property({ type: String })
  accessor label = ''

  override render() {
    const percentage = Math.min(Math.max((this.value / this.max) * 100, 0), 100)
    const bgClass = this.variant ? `bg-${this.variant}` : ''

    return html`
      <div class="progress" role="progressbar" aria-valuenow="${this.value}" aria-valuemin="0" aria-valuemax="${this.max}">
        <div
          class="progress-bar ${bgClass} ${this.isStriped ? 'progress-bar-striped' : ''} ${this.isAnimated ? 'progress-bar-animated' : ''}"
          style="width: ${percentage}%"
        >
          ${this.label || html`<slot></slot>`}
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-progress-bar': MoulProgressBar
  }
}
