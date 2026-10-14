import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { alertStyles } from './Alert.styles.js'

export type AlertVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'

@customElement('moul-alert')
export class MoulAlert extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    alertStyles,
  ]

  @property({ type: String, reflect: true })
  accessor variant: AlertVariant = 'primary'

  @property({ type: String })
  accessor title = ''

  @property({ type: String })
  accessor description = ''

  @property({ type: Boolean, attribute: 'is-dismissable', reflect: true })
  accessor isDismissable = false

  private handleDismiss = () => {
    this.dispatchEvent(
      new CustomEvent('moul-dismiss', { bubbles: true, composed: true }),
    )
    this.remove()
  }

  override render() {
    const variantMap: Record<string, string> = {
      accent: 'primary',
      error: 'danger',
      loading: 'info',
    }
    const resolvedVariant = variantMap[this.variant] || this.variant

    return html`
      <div class="alert alert-${resolvedVariant} theme-${resolvedVariant === 'dark' ? 'inverse' : resolvedVariant} ${this.isDismissable ? 'alert-dismissible' : ''}" role="alert">
        <span class="alert-icon">
          <slot name="icon"></slot>
        </span>
        <div class="alert-content">
          ${this.title ? html`<div class="alert-heading">${this.title}</div>` : ''}
          <slot></slot>
          ${this.description ? html`<div class="alert-description">${this.description}</div>` : ''}
        </div>
        <span class="alert-actions">
          <slot name="actions"></slot>
          <slot name="action"></slot>
          ${
            this.isDismissable
              ? html`
                <button
                  type="button"
                  class="btn-close"
                  aria-label="Close"
                  @click="${this.handleDismiss}"
                ></button>
              `
              : ''
          }
        </span>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-alert': MoulAlert
  }
}
