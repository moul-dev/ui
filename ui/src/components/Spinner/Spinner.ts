import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { spinnerRing } from '../../utils/icons'
import { spinnerStyles } from './Spinner.styles'

export type SpinnerSize = 'sm' | 'md' | 'lg'
export type SpinnerVariant = 'ring' | 'dots' | 'shape' | 'orbit'

const VARIANTS: readonly SpinnerVariant[] = ['ring', 'dots', 'shape', 'orbit']

/**
 * An indeterminate loading indicator in the current text colour, for waits of
 * unknown length; `label` says what is loading. `variant` picks the look: a
 * spinning `ring` (the default), three `dots` that rise and fade in turn, a
 * `shape` that morphs from a rounded square into a circle and back while it
 * turns, or a dot that circles a faint track in `orbit`.
 *
 * Keyboard and screen readers: not focusable. It is a `role="status"` live
 * region named by `label` (default "Loading"), which is also present as
 * visually hidden text; the drawing itself is hidden from screen readers.
 *
 * Reduced motion: nothing turns or travels. The ring, shape and orbit dot
 * slowly pulse their opacity instead, and the dots pulse one after another.
 *
 * @csspart base - The `role="status"` box that holds the drawing.
 */
export class MoulSpinner extends LitElement {
  static override styles = spinnerStyles

  static override properties = {
    size: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    label: { type: String, reflect: true },
  }

  declare size: SpinnerSize
  /** The look of the indicator; unknown values fall back to `ring`. */
  declare variant: SpinnerVariant
  declare label: string

  constructor() {
    super()
    this.size = 'md'
    this.variant = 'ring'
    this.label = 'Loading'
  }

  protected override willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps)
    if (changedProps.has('variant') && !VARIANTS.includes(this.variant)) {
      this.variant = 'ring'
    }
  }

  private renderIndicator() {
    switch (this.variant) {
      case 'dots':
        return html`<span class="dots" aria-hidden="true"
          ><span class="dot"></span><span class="dot"></span
          ><span class="dot"></span
        ></span>`
      case 'shape':
        return html`<span class="shape" aria-hidden="true"></span>`
      case 'orbit':
        return html`<span class="orbit" aria-hidden="true"
          ><span class="satellite"></span
        ></span>`
      default:
        return spinnerRing('spinner-svg')
    }
  }

  protected override render() {
    return html`
      <div part="base" role="status" aria-label=${this.label}>
        ${this.renderIndicator()}
        <span class="sr-only">${this.label}</span>
      </div>
    `
  }
}

defineElement('moul-spinner', MoulSpinner)

declare global {
  interface HTMLElementTagNameMap {
    'moul-spinner': MoulSpinner
  }
}
