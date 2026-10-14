import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { typographyStyles } from './Typography.styles.js'

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'lead'
  | 'body'
  | 'small'
  | 'muted'

@customElement('moul-typography')
export class MoulTypography extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    typographyStyles,
  ]

  @property({ type: String, reflect: true })
  accessor variant: TypographyVariant = 'body'

  override render() {
    switch (this.variant) {
      case 'h1':
        return html`<h1 class="h1"><slot></slot></h1>`
      case 'h2':
        return html`<h2 class="h2"><slot></slot></h2>`
      case 'h3':
        return html`<h3 class="h3"><slot></slot></h3>`
      case 'h4':
        return html`<h4 class="h4"><slot></slot></h4>`
      case 'h5':
        return html`<h5 class="h5"><slot></slot></h5>`
      case 'h6':
        return html`<h6 class="h6"><slot></slot></h6>`
      case 'lead':
        return html`<p class="lead"><slot></slot></p>`
      case 'small':
        return html`<small class="small"><slot></slot></small>`
      case 'muted':
        return html`<span class="muted"><slot></slot></span>`
      default:
        return html`<p class="body"><slot></slot></p>`
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-typography': MoulTypography
  }
}
