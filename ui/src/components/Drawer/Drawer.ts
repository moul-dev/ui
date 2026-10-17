import { html, LitElement, type PropertyValues } from 'lit'
import {
  OverlayPresenceController,
  type OverlayPreset,
} from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import {
  focusFirstElement,
  restoreFocus,
  trapFocus,
} from '../../utils/focus-trap'
import { drawerStyles } from './Drawer.styles'

export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom'
export type DrawerSize = 'sm' | 'md' | 'lg'

export class MoulDrawer extends LitElement {
  static override styles = drawerStyles

  static override properties = {
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    placement: { type: String, reflect: true },
    size: { type: String, reflect: true },
    isDismissable: {
      type: Boolean,
      reflect: true,
      attribute: 'is-dismissable',
    },
  }

  declare isOpen: boolean
  declare placement: DrawerPlacement
  declare size: DrawerSize
  declare isDismissable: boolean

  public overlayPresence: OverlayPresenceController
  private previousActiveElement: HTMLElement | null = null

  constructor() {
    super()
    this.isOpen = false
    this.placement = 'right'
    this.size = 'md'
    this.isDismissable = true

    this.overlayPresence = new OverlayPresenceController(this, {
      preset: `drawer-${this.placement}` as OverlayPreset,
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
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.handleKeyDown)
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('placement')) {
      const preset = `drawer-${this.placement}` as OverlayPreset
      ;(
        this.overlayPresence as unknown as {
          options: { preset: OverlayPreset }
        }
      ).options.preset = preset
    }

    if (changedProps.has('isOpen')) {
      if (this.isOpen !== this.overlayPresence.isOpen) {
        if (this.isOpen) {
          this.openDrawer()
        } else {
          this.closeDrawer()
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
      await this.openDrawer()
    } else {
      await this.closeDrawer()
    }
  }

  private async openDrawer(): Promise<void> {
    this.previousActiveElement = document.activeElement as HTMLElement | null

    await this.overlayPresence.setOpen(true)
    const dialog = this.dialogEl
    if (dialog) {
      focusFirstElement(this.contentEl ?? dialog)
    }
  }

  private async closeDrawer(): Promise<void> {
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
        aria-modal="true"
        class="dialog"
        @click=${this.handleDialogClick}
      >
        <div part="base" class="drawer-card">
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

defineElement('moul-drawer', MoulDrawer)

declare global {
  interface HTMLElementTagNameMap {
    'moul-drawer': MoulDrawer
  }
}
