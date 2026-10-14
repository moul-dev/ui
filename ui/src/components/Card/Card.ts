import { type CSSResultOrNative, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { cardStyles } from './Card.styles.js'

@customElement('moul-card')
export class MoulCard extends MoulBase {
  static override styles: CSSResultOrNative[] = [...MoulBase.styles, cardStyles]

  @property({ type: Boolean, attribute: 'is-interactive', reflect: true })
  accessor isInteractive = false

  @state()
  private accessor hasHeader = false

  @state()
  private accessor hasFooter = false

  private handleHeaderSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement
    this.hasHeader = slot.assignedNodes({ flatten: true }).length > 0
  }

  private handleFooterSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement
    this.hasFooter = slot.assignedNodes({ flatten: true }).length > 0
  }

  override render() {
    return html`
      <div class="card ${this.isInteractive ? 'interactive' : ''}">
        <div class="card-header ${this.hasHeader ? '' : 'd-none'}">
          <slot name="header" @slotchange=${this.handleHeaderSlotChange}></slot>
        </div>
        <div class="card-body">
          <slot name="body"></slot>
          <slot></slot>
        </div>
        <div class="card-footer ${this.hasFooter ? '' : 'd-none'}">
          <slot name="footer" @slotchange=${this.handleFooterSlotChange}></slot>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-card': MoulCard
  }
}
