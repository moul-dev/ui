import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { FocusTrapController } from '../../controllers/focus-trap.controller.js'
import { ScrollLockController } from '../../controllers/scroll-lock.controller.js'
import { MoulBase } from '../../shared/base.js'
import { modalStyles } from './Modal.styles.js'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'

@customElement('moul-modal')
export class MoulModal extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    modalStyles,
  ]

  private focusTrap = new FocusTrapController(this)
  private scrollLock = new ScrollLockController(this)

  @property({ type: Boolean, attribute: 'is-open', reflect: true })
  accessor isOpen = false

  @property({ type: String, reflect: true })
  accessor size: ModalSize = 'md'

  @property({ type: Boolean, attribute: 'is-dismissable', reflect: true })
  accessor isDismissable = true

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('isOpen')) {
      if (this.isOpen) {
        this.scrollLock.lock()
        this.focusTrap.activate()
        window.addEventListener('keydown', this.handleKeyDown)
        this.dispatchEvent(
          new CustomEvent('moul-open', { bubbles: true, composed: true }),
        )
      } else {
        this.scrollLock.unlock()
        this.focusTrap.deactivate()
        window.removeEventListener('keydown', this.handleKeyDown)
        this.dispatchEvent(
          new CustomEvent('moul-close', { bubbles: true, composed: true }),
        )
      }
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.isDismissable) {
      e.preventDefault()
      this.close()
    }
  }

  private handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget && this.isDismissable) {
      this.close()
    }
  }

  close() {
    this.isOpen = false
  }

  override render() {
    if (!this.isOpen) return html``

    const sizeClass = this.size !== 'md' ? `modal-${this.size}` : ''

    return html`
      <div
        class="modal-backdrop show"
        @click="${this.handleBackdropClick}"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-dialog ${sizeClass}">
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-title">
                <slot name="header"></slot>
              </div>
              ${
                this.isDismissable
                  ? html`
                    <button
                      type="button"
                      class="btn-close"
                      aria-label="Close"
                      @click="${this.close}"
                    ></button>
                  `
                  : ''
              }
            </div>
            <div class="modal-body">
              <slot name="body"></slot>
              <slot></slot>
            </div>
            <div class="modal-footer">
              <slot name="footer"></slot>
            </div>
          </div>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-modal': MoulModal
  }
}
