import { html, LitElement, type PropertyValues } from 'lit'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import type { SemanticTone } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import {
  focusFirstElement,
  restoreFocus,
  trapFocus,
} from '../../utils/focus-trap'
import { alertDialogStyles } from './AlertDialog.styles'

export type AlertDialogSize = 'sm' | 'md' | 'lg'

export class MoulAlertDialog extends LitElement {
  static override styles = alertDialogStyles

  static override properties = {
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    tone: { type: String, reflect: true },
    size: { type: String, reflect: true },
  }

  declare isOpen: boolean
  declare tone: SemanticTone
  declare size: AlertDialogSize

  public overlayPresence: OverlayPresenceController
  private previousActiveElement: HTMLElement | null = null

  constructor() {
    super()
    this.isOpen = false
    this.tone = 'error'
    this.size = 'md'

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
    this.addEventListener('keydown', this.handleKeyDown)
    this.addEventListener('click', this.handleClick)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.handleKeyDown)
    this.removeEventListener('click', this.handleClick)
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('isOpen')) {
      if (this.isOpen !== this.overlayPresence.isOpen) {
        if (this.isOpen) {
          this.openDialog()
        } else {
          this.closeDialog()
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
      await this.openDialog()
    } else {
      await this.closeDialog()
    }
  }

  public confirm(): void {
    this.dispatchEvent(
      new CustomEvent('confirm', {
        bubbles: true,
        composed: true,
      }),
    )
    this.setOpen(false)
  }

  public cancel(): void {
    this.dispatchEvent(
      new CustomEvent('cancel', {
        bubbles: true,
        composed: true,
      }),
    )
    this.setOpen(false)
  }

  private async openDialog(): Promise<void> {
    this.previousActiveElement = document.activeElement as HTMLElement | null

    await this.overlayPresence.setOpen(true)
    const dialog = this.dialogEl
    if (dialog) {
      // Direct initial focus to cancel button for safety if available
      const cancelBtn = this.querySelector<HTMLElement>(
        '[data-action="cancel"], [slot="cancel"]',
      )
      if (cancelBtn && typeof cancelBtn.focus === 'function') {
        cancelBtn.focus()
      } else {
        focusFirstElement(this.contentEl ?? dialog)
      }
    }
  }

  private async closeDialog(): Promise<void> {
    await this.overlayPresence.setOpen(false)
    restoreFocus(this.previousActiveElement)
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isOpen) return

    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      this.cancel()
      return
    }

    if (e.key === 'Tab') {
      trapFocus(this.dialogEl ?? this, e)
    }
  }

  private readonly handleClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement | null
    if (!target) return

    const action =
      target.getAttribute?.('data-action') || target.getAttribute?.('slot')
    if (action === 'confirm') {
      this.confirm()
    } else if (action === 'cancel') {
      this.cancel()
    }
  }

  protected override render() {
    return html`
      <dialog
        part="dialog"
        role="alertdialog"
        aria-modal="true"
        class="dialog"
      >
        <div part="base" class="alert-dialog-card">
          <div part="header">
            <slot name="header"></slot>
          </div>
          <div part="body">
            <slot name="body"><slot></slot></slot>
          </div>
          <div part="footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </dialog>
    `
  }
}

defineElement('moul-alert-dialog', MoulAlertDialog)

declare global {
  interface HTMLElementTagNameMap {
    'moul-alert-dialog': MoulAlertDialog
  }
}
