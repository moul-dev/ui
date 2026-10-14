import type { Placement } from '@floating-ui/dom'
import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { FloatingUIController } from '../../controllers/floating-ui.controller.js'
import { MoulBase } from '../../shared/base.js'
import { popoverStyles } from './Popover.styles.js'

@customElement('moul-popover')
export class MoulPopover extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    popoverStyles,
  ]

  private floating = new FloatingUIController(this, {
    placement: 'bottom',
    offset: 8,
  })

  @property({ type: Boolean, attribute: 'is-open', reflect: true })
  accessor isOpen = false

  @property({ type: String, reflect: true })
  accessor placement: Placement = 'bottom'

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('placement')) {
      this.floating.options.placement = this.placement
    }
    if (changedProperties.has('isOpen')) {
      if (this.isOpen) {
        this.openPopover()
      } else {
        this.closePopover()
      }
    }
  }

  private openPopover() {
    const trigger =
      this.shadowRoot!.querySelector<HTMLElement>('.trigger-wrapper')!
    const popover = this.shadowRoot!.querySelector<HTMLElement>('.popover')!
    this.floating.start(trigger, popover)
    window.addEventListener('click', this.handleOutsideClick)
    window.addEventListener('keydown', this.handleKeyDown)
    this.dispatchEvent(
      new CustomEvent('moul-open', { bubbles: true, composed: true }),
    )
  }

  private closePopover() {
    this.floating.stop()
    window.removeEventListener('click', this.handleOutsideClick)
    window.removeEventListener('keydown', this.handleKeyDown)
    this.dispatchEvent(
      new CustomEvent('moul-close', { bubbles: true, composed: true }),
    )
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.isOpen = false
    }
  }

  private handleOutsideClick = (e: MouseEvent) => {
    const path = e.composedPath()
    if (!path.includes(this)) {
      this.isOpen = false
    }
  }

  private toggle = () => {
    this.isOpen = !this.isOpen
  }

  override render() {
    return html`
      <div class="popover-container">
        <div class="trigger-wrapper" @click="${this.toggle}">
          <slot name="trigger"></slot>
          <slot></slot>
        </div>
        <div
          class="popover ${this.isOpen ? 'show' : ''}"
          role="dialog"
          aria-modal="false"
        >
          <slot name="content"></slot>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-popover': MoulPopover
  }
}
