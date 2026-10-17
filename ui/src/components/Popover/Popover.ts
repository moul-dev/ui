import { html, LitElement, type PropertyValues } from 'lit'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import {
  focusFirstElement,
  restoreFocus,
  supportsNativePopoverAndAnchor,
  trapFocus,
} from '../../utils/focus-trap'
import { popoverStyles } from './Popover.styles'

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right'
export type PopoverTrigger = 'click' | 'manual'

export class MoulPopover extends LitElement {
  static override styles = popoverStyles

  static override properties = {
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    trigger: { type: String, reflect: true },
    placement: { type: String, reflect: true },
    offset: { type: Number, reflect: true },
  }

  declare isOpen: boolean
  declare trigger: PopoverTrigger
  declare placement: PopoverPlacement
  declare offset: number

  public overlayPresence: OverlayPresenceController
  private static warnedFallback = false
  private previousActiveElement: HTMLElement | null = null

  constructor() {
    super()
    this.isOpen = false
    this.trigger = 'click'
    this.placement = 'bottom'
    this.offset = 8

    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'popover',
      popover: () => this.popoverEl,
    })
  }

  public get popoverEl(): HTMLElement | null {
    return (
      this.shadowRoot?.querySelector<HTMLElement>('[part="popover"]') ?? null
    )
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('keydown', this.handleKeyDown)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.handleKeyDown)
  }

  protected override firstUpdated(): void {
    const popover = this.popoverEl
    if (popover) {
      popover.addEventListener('toggle', this.handleNativeToggle)
    }

    if (!supportsNativePopoverAndAnchor() && !MoulPopover.warnedFallback) {
      MoulPopover.warnedFallback = true
      console.warn(
        '[@moul-dev/ui] Native Popover or Anchor Positioning not supported; applying fallback fixed positioning.',
      )
    }
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('offset')) {
      this.style.setProperty('--_offset', `${this.offset}px`)
    }

    if (changedProps.has('isOpen')) {
      if (this.isOpen !== this.overlayPresence.isOpen) {
        if (this.isOpen) {
          this.openPopover()
        } else {
          this.closePopover()
        }
      }
    }
  }

  private handleNativeToggle = (e: Event): void => {
    const toggleEvent = e as unknown as { newState?: string; oldState?: string }
    if (toggleEvent.newState === 'closed' && this.isOpen) {
      this.isOpen = false
      this.dispatchEvent(
        new CustomEvent('openchange', {
          bubbles: true,
          composed: true,
          detail: { isOpen: false },
        }),
      )
      restoreFocus(this.previousActiveElement)
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
      await this.openPopover()
    } else {
      await this.closePopover()
    }
  }

  private async openPopover(): Promise<void> {
    this.previousActiveElement = document.activeElement as HTMLElement | null
    this.updateFallbackPosition()

    await this.overlayPresence.setOpen(true)
    const popover = this.popoverEl
    if (popover) {
      focusFirstElement(popover)
    }
  }

  private async closePopover(): Promise<void> {
    await this.overlayPresence.setOpen(false)
    restoreFocus(this.previousActiveElement)
  }

  public async toggle(): Promise<void> {
    await this.setOpen(!this.isOpen)
  }

  private updateFallbackPosition(): void {
    if (supportsNativePopoverAndAnchor()) return

    const trigger =
      this.shadowRoot?.querySelector<HTMLElement>('[part="trigger"]')
    const popover = this.popoverEl
    if (!trigger || !popover) return

    const rect = trigger.getBoundingClientRect()
    popover.style.position = 'fixed'

    switch (this.placement) {
      case 'bottom':
        popover.style.top = `${rect.bottom + this.offset}px`
        popover.style.left = `${rect.left + rect.width / 2}px`
        popover.style.transform = 'translateX(-50%)'
        break
      case 'top':
        popover.style.bottom = `${window.innerHeight - rect.top + this.offset}px`
        popover.style.left = `${rect.left + rect.width / 2}px`
        popover.style.transform = 'translateX(-50%)'
        break
      case 'left':
        popover.style.right = `${window.innerWidth - rect.left + this.offset}px`
        popover.style.top = `${rect.top + rect.height / 2}px`
        popover.style.transform = 'translateY(-50%)'
        break
      case 'right':
        popover.style.left = `${rect.right + this.offset}px`
        popover.style.top = `${rect.top + rect.height / 2}px`
        popover.style.transform = 'translateY(-50%)'
        break
    }
  }

  private readonly handleTriggerClick = (): void => {
    if (this.trigger === 'click') {
      this.toggle()
    }
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isOpen) {
      if (
        (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') &&
        (e.target === this || this.contains(e.target as Node))
      ) {
        e.preventDefault()
        this.setOpen(true)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      this.setOpen(false)
      return
    }

    const popover = this.popoverEl
    if (popover?.contains(e.target as Node)) {
      trapFocus(popover, e)
    }
  }

  protected override render() {
    return html`
      <div
        part="trigger"
        class="trigger"
        @click=${this.handleTriggerClick}
      >
        <slot name="trigger"></slot>
      </div>

      <div
        part="popover"
        popover=${this.trigger === 'manual' ? 'manual' : 'auto'}
        class="popover"
      >
        <slot></slot>
      </div>
    `
  }
}

defineElement('moul-popover', MoulPopover)

declare global {
  interface HTMLElementTagNameMap {
    'moul-popover': MoulPopover
  }
}
