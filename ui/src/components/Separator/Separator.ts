import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { separatorStyles } from './Separator.styles'

export type SeparatorOrientation = 'horizontal' | 'vertical'

/**
 * A thin line that divides content, horizontal by default or vertical with
 * `orientation="vertical"`.
 *
 * Keyboard and screen readers: not focusable. It renders an `<hr>` with
 * `role="separator"` and a matching `aria-orientation`, so screen readers
 * report a separator.
 *
 * Reduced motion: does not animate.
 */
export class MoulSeparator extends LitElement {
  static override styles = separatorStyles

  static override properties = {
    orientation: { type: String, reflect: true },
  }

  declare orientation: SeparatorOrientation

  constructor() {
    super()
    this.orientation = 'horizontal'
  }

  protected override render() {
    return html`
      <hr
        part="separator"
        role="separator"
        aria-orientation=${this.orientation}
      />
    `
  }
}

defineElement('moul-separator', MoulSeparator)

declare global {
  interface HTMLElementTagNameMap {
    'moul-separator': MoulSeparator
  }
}
