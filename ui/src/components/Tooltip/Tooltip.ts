import { html, LitElement, type PropertyValues } from 'lit'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import { tooltipStyles } from './Tooltip.styles'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

let tooltipCount = 0

export class MoulTooltip extends LitElement {
  static override styles = tooltipStyles

  static override properties = {
    content: { type: String, reflect: true },
    placement: { type: String, reflect: true },
    delay: { type: Number, reflect: true },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
  }

  declare content: string
  declare placement: TooltipPlacement
  declare delay: number
  declare isOpen: boolean

  public overlayPresence: OverlayPresenceController
  private tooltipId: string
  private hoverTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    super()
    this.content = ''
    this.placement = 'top'
    this.delay = 300
    this.isOpen = false
    this.tooltipId = `moul-tooltip-${++tooltipCount}`

    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'tooltip',
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
    this.addEventListener('pointerenter', this.handlePointerEnter)
    this.addEventListener('pointerleave', this.handlePointerLeave)
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('focusout', this.handleFocusOut)
    this.addEventListener('keydown', this.handleKeyDown)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.clearHoverTimer()
    this.removeEventListener('pointerenter', this.handlePointerEnter)
    this.removeEventListener('pointerleave', this.handlePointerLeave)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.removeEventListener('focusout', this.handleFocusOut)
    this.removeEventListener('keydown', this.handleKeyDown)
  }

  protected override firstUpdated(): void {
    this.syncAriaDescribedBy()
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('isOpen')) {
      if (this.isOpen !== this.overlayPresence.isOpen) {
        this.overlayPresence.setOpen(this.isOpen)
      }
    }
  }

  private syncAriaDescribedBy(): void {
    const triggerSlot =
      this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])')
    const assigned = triggerSlot?.assignedElements({ flatten: true }) ?? []
    for (const el of assigned) {
      if (!el.hasAttribute('aria-describedby')) {
        el.setAttribute('aria-describedby', this.tooltipId)
      }
    }
  }

  private clearHoverTimer(): void {
    if (this.hoverTimer !== null) {
      clearTimeout(this.hoverTimer)
      this.hoverTimer = null
    }
  }

  public async setOpen(nextOpen: boolean): Promise<void> {
    this.clearHoverTimer()
    if (this.isOpen === nextOpen && this.overlayPresence.isOpen === nextOpen)
      return

    this.isOpen = nextOpen
    await this.overlayPresence.setOpen(nextOpen)
    this.dispatchEvent(
      new CustomEvent('openchange', {
        bubbles: true,
        composed: true,
        detail: { isOpen: this.isOpen },
      }),
    )
  }

  private readonly handlePointerEnter = (): void => {
    this.clearHoverTimer()
    if (this.delay <= 0) {
      this.setOpen(true)
    } else {
      this.hoverTimer = setTimeout(() => {
        this.setOpen(true)
      }, this.delay)
    }
  }

  private readonly handlePointerLeave = (): void => {
    this.clearHoverTimer()
    this.setOpen(false)
  }

  private readonly handleFocusIn = (): void => {
    // Immediate display on focus per OV-TLP-02
    this.clearHoverTimer()
    this.setOpen(true)
  }

  private readonly handleFocusOut = (): void => {
    this.clearHoverTimer()
    this.setOpen(false)
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.isOpen) {
      e.stopPropagation()
      this.setOpen(false)
    }
  }

  protected override render() {
    return html`
      <div part="trigger" class="trigger">
        <slot @slotchange=${this.syncAriaDescribedBy}></slot>
      </div>

      <div
        id=${this.tooltipId}
        part="popover tooltip"
        role="tooltip"
        popover="manual"
        class="tooltip"
      >
        <slot name="content">${this.content}</slot>
      </div>
    `
  }
}

defineElement('moul-tooltip', MoulTooltip)

declare global {
  interface HTMLElementTagNameMap {
    'moul-tooltip': MoulTooltip
  }
}
