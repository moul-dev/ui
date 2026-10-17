import { html, LitElement } from 'lit'
import type { SemanticTone } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { typographyStyles } from './Typography.styles'

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body'
  | 'caption'
  | 'code'
  | 'mono'

export class MoulTypography extends LitElement {
  static override styles = typographyStyles

  static override properties = {
    variant: { type: String, reflect: true },
    tone: { type: String, reflect: true },
  }

  declare variant: TypographyVariant
  declare tone?: SemanticTone

  constructor() {
    super()
    this.variant = 'body'
  }

  protected override render() {
    switch (this.variant) {
      case 'h1':
        return html`<h1 part="root" class="typography"><slot></slot></h1>`
      case 'h2':
        return html`<h2 part="root" class="typography"><slot></slot></h2>`
      case 'h3':
        return html`<h3 part="root" class="typography"><slot></slot></h3>`
      case 'h4':
        return html`<h4 part="root" class="typography"><slot></slot></h4>`
      case 'h5':
        return html`<h5 part="root" class="typography"><slot></slot></h5>`
      case 'h6':
        return html`<h6 part="root" class="typography"><slot></slot></h6>`
      case 'caption':
        return html`<span part="root" class="typography"><slot></slot></span>`
      case 'code':
      case 'mono':
        return html`<code part="root" class="typography"><slot></slot></code>`
      default:
        return html`<p part="root" class="typography"><slot></slot></p>`
    }
  }
}

defineElement('moul-typography', MoulTypography)

declare global {
  interface HTMLElementTagNameMap {
    'moul-typography': MoulTypography
  }
}
