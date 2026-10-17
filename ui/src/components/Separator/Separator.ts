import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { separatorStyles } from './Separator.styles'

export type SeparatorOrientation = 'horizontal' | 'vertical'

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
