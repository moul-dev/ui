import { html, LitElement, type PropertyValues } from 'lit'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import {
  focusFirstElement,
  restoreFocus,
  trapFocus,
} from '../../utils/focus-trap'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import { modalStyles } from './Modal.styles'

export type ModalSize = 'sm' | 'md' | 'lg' | 'fullscreen'

export class MoulModal extends LitElement {
  static override styles = modalStyles

  static override properties = {
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    size: { type: String, reflect: true },
    isDismissable: {
      type: Boolean,
      reflect: true,
      attribute: 'is-dismissable',
    },
  }

  declare isOpen: boolean
  declare size: ModalSize
  declare isDismissable: boolean

  public overlayPresence: OverlayPresenceController
  private previousActiveElement: HTMLElement | null = null

  constructor() {
    super()
    this.isOpen = false
    this.size = 'md'
    this.isDismissable = true

    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'modal',
      dialog: () => this.dialogEl,
    })
  }

  public get dialogEl(): HTMLDialogElement | null {
    return this.shadowRoot?.querySelector<HTMLDialogElement>('dialog') ?? null
  }

  public get contentEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector<HTMLElement>('[part="base"]') ?? null
  }

  public get isMounted(): boolean {
    return this.overlayPresence.isMounted
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    warnMissingLabel(this, 'moul-modal')
    this.addEventListener('keydown', this.handleKeyDown)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.handleKeyDown)
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('isOpen')) {
      if (this.isOpen !== this.overlayPresence.isOpen) {
        if (this.isOpen) {
          this.openModal()
        } else {
          this.closeModal()
        }
      }
    }
  }

  public async setOpen(nextOpen: boolean): Promise<void> {
    if (this.isOpen === nextOpen && this.overlayPresence.isOpen === nextOpen)
      return
    this.isOpen = nextOpen
    this.dispatchEvent(
      new CustomEvent('openchange', {
        bubbles: true,
        composed: true,
        detail: { isOpen: this.isOpen },
      }),
    )
    if (nextOpen) {
      await this.openModal()
    } else {
      await this.closeModal()
    }
  }

  private async openModal(): Promise<void> {
    this.previousActiveElement = document.activeElement as HTMLElement | null

    await this.overlayPresence.setOpen(true)
    const dialog = this.dialogEl
    if (dialog) {
      focusFirstElement(this.contentEl ?? dialog)
    }
  }

  private async closeModal(): Promise<void> {
    await this.overlayPresence.setOpen(false)
    restoreFocus(this.previousActiveElement)
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isOpen) return

    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      this.setOpen(false)
      return
    }

    if (e.key === 'Tab') {
      trapFocus(this.dialogEl ?? this, e)
    }
  }

  private readonly handleDialogClick = (e: MouseEvent): void => {
    if (!this.isDismissable) return

    const content = this.contentEl
    if (!content) return

    const rect = content.getBoundingClientRect()
    const isInside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom

    if (!isInside) {
      this.setOpen(false)
    }
  }

  protected override render() {
    return html`
      <dialog
        part="dialog"
        class="dialog"
        @click=${this.handleDialogClick}
      >
        <div part="base" class="modal-card">
          <div part="header">
            <slot name="header"></slot>
          </div>
          <div part="body">
            <slot></slot>
          </div>
          <div part="footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </dialog>
    `
  }
}

defineElement('moul-modal', MoulModal)

declare global {
  interface HTMLElementTagNameMap {
    'moul-modal': MoulModal
  }
}
