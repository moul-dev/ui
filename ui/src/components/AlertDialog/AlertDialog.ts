import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { FocusTrapController } from '../../controllers/focus-trap.controller.js'
import { ScrollLockController } from '../../controllers/scroll-lock.controller.js'
import { MoulBase } from '../../shared/base.js'
import type { ModalSize } from '../Modal/Modal.js'
import { alertDialogStyles } from './AlertDialog.styles.js'

@customElement('moul-alert-dialog')
export class MoulAlertDialog extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    alertDialogStyles,
  ]

  private focusTrap = new FocusTrapController(this)
  private scrollLock = new ScrollLockController(this)

  @property({ type: Boolean, attribute: 'is-open', reflect: true })
  accessor isOpen = false

  @property({ type: String, reflect: true })
  accessor size: ModalSize = 'md'

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
    if (e.key === 'Escape') {
      e.preventDefault()
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
        role="alertdialog"
        aria-modal="true"
      >
        <div class="modal-dialog ${sizeClass}">
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-title">
                <slot name="header"></slot>
              </div>
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
    'moul-alert-dialog': MoulAlertDialog
  }
}
