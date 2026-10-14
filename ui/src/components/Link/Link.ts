import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { linkStyles } from './Link.styles.js'

@customElement('moul-link')
export class MoulLink extends MoulBase {
  static override styles: CSSResultOrNative[] = [...MoulBase.styles, linkStyles]

  @property({ type: String })
  accessor href = ''

  @property({ type: String })
  accessor target = ''

  @property({ type: String })
  accessor rel = ''

  @property({ type: String, reflect: true })
  accessor variant = 'primary'

  @property({ type: Boolean, attribute: 'is-quiet', reflect: true })
  accessor isQuiet = false

  private handleClick = (event: MouseEvent) => {
    this.dispatchEvent(
      new CustomEvent('moul-press', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: event },
      }),
    )
  }

  override render() {
    const variantClass =
      this.variant && this.variant !== 'primary' ? `link-${this.variant}` : ''

    return html`
      <a
        href="${this.href}"
        target="${this.target || ''}"
        rel="${this.target === '_blank' && !this.rel ? 'noopener noreferrer' : this.rel || ''}"
        class="${variantClass}"
        @click="${this.handleClick}"
      >
        <slot></slot>
      </a>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-link': MoulLink
  }
}
