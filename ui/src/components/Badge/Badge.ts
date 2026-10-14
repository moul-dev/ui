import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { badgeStyles } from './Badge.styles.js'

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'
  | 'neutral'
  | 'error'

export type BadgeSize = 'sm' | 'md' | 'lg'

@customElement('moul-badge')
export class MoulBadge extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    badgeStyles,
  ]

  @property({ type: String, reflect: true })
  accessor variant: BadgeVariant = 'primary'

  @property({ type: String, reflect: true })
  accessor size: BadgeSize = 'md'

  @property({ type: Boolean, attribute: 'is-pill', reflect: true })
  accessor isPill = false

  @property({ type: Boolean, attribute: 'dot', reflect: true })
  accessor dot = false

  override render() {
    const variantMap: Record<string, string> = {
      neutral: 'secondary',
      error: 'danger',
    }
    const resolvedVariant = variantMap[this.variant] || this.variant

    return html`
      <span class="badge theme-${resolvedVariant === 'dark' ? 'inverse' : resolvedVariant} text-bg-${resolvedVariant} ${this.isPill ? 'rounded-pill' : ''} ${this.size}">
        ${this.dot ? html`<span class="badge-dot" aria-hidden="true"></span>` : ''}
        <slot></slot>
      </span>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-badge': MoulBadge
  }
}
