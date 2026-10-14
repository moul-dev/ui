import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { emptyStateStyles } from './EmptyState.styles.js'

@customElement('moul-empty-state')
export class MoulEmptyState extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    emptyStateStyles,
  ]

  @property({ type: String, reflect: true })
  accessor variant: 'default' | 'card' | 'dashed' = 'default'

  @property({ type: String })
  accessor title = ''

  @property({ type: String })
  accessor description = ''

  override render() {
    return html`
      <div class="empty-state">
        <div class="empty-state-icon">
          <slot name="icon"></slot>
        </div>
        <div class="empty-state-title">
          <slot name="title">${this.title}</slot>
        </div>
        <div class="empty-state-description">
          <slot name="description">${this.description}</slot>
          <slot></slot>
        </div>
        <div class="empty-state-actions">
          <slot name="actions"></slot>
          <slot name="action"></slot>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-empty-state': MoulEmptyState
  }
}
