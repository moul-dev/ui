import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { FocusTrapController } from '../../controllers/focus-trap.controller.js'
import { ScrollLockController } from '../../controllers/scroll-lock.controller.js'
import { MoulBase } from '../../shared/base.js'
import { drawerStyles } from './Drawer.styles.js'

export type DrawerPlacement = 'start' | 'end' | 'top' | 'bottom'

@customElement('moul-drawer')
export class MoulDrawer extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    drawerStyles,
  ]

  private focusTrap = new FocusTrapController(this)
  private scrollLock = new ScrollLockController(this)

  @property({ type: Boolean, attribute: 'is-open', reflect: true })
  accessor isOpen = false

  @property({ type: String, reflect: true })
  accessor placement: DrawerPlacement = 'end'

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

  private handleBackdropClick = () => {
    if (this.isDismissable) {
      this.close()
    }
  }

  close() {
    this.isOpen = false
  }

  override render() {
    if (!this.isOpen) return html``

    return html`
      <div
        class="offcanvas-backdrop show"
        @click="${this.handleBackdropClick}"
      ></div>
      <div
        class="offcanvas offcanvas-${this.placement} show"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
      >
        <div class="offcanvas-header">
          <slot name="handle"></slot>
          <div class="offcanvas-title">
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
        <div class="offcanvas-body">
          <slot name="body"></slot>
          <slot></slot>
        </div>
        <div class="offcanvas-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-drawer': MoulDrawer
  }
}
