import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { spinnerStyles } from './Spinner.styles.js'

export type SpinnerVariant = 'border' | 'grow'
export type SpinnerSize = 'sm' | 'md'

@customElement('moul-spinner')
export class MoulSpinner extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    spinnerStyles,
  ]

  @property({ type: String, reflect: true })
  accessor variant: SpinnerVariant = 'border'

  @property({ type: String, reflect: true })
  accessor size: SpinnerSize = 'md'

  @property({ type: String, reflect: true })
  accessor color = 'primary'

  @property({ type: String, attribute: 'aria-label' })
  accessor ariaLabel = 'Loading...'

  override render() {
    const isBorder = this.variant === 'border'
    const spinnerClass = isBorder ? 'spinner-border' : 'spinner-grow'
    const sizeClass =
      this.size === 'sm'
        ? isBorder
          ? 'spinner-border-sm'
          : 'spinner-grow-sm'
        : ''
    const colorClass = this.color ? `text-${this.color}` : ''

    return html`
      <div class="${spinnerClass} ${sizeClass} ${colorClass}" role="status">
        <span class="visually-hidden">${this.ariaLabel}</span>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-spinner': MoulSpinner
  }
}
