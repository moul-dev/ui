import { html, LitElement, type PropertyValues } from 'lit'
import {
  OverlayPresenceController,
  type OverlaySetOpenOptions,
} from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import { tooltipStyles } from './Tooltip.styles'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

let tooltipCount = 0

/**
 * Once the pointer has read one tooltip, its siblings (tooltips sharing a parent, like a
 * toolbar's buttons) open instantly for a moment after it leaves: no delay, no entrance.
 */
const WARM_WINDOW_MS = 300
let warmTooltip: { tooltip: HTMLElement; leftAt: number } | null = null

function isWarmFor(tooltip: HTMLElement): boolean {
  if (!warmTooltip?.tooltip.isConnected) return false
  return (
    warmTooltip.tooltip.parentElement === tooltip.parentElement &&
    performance.now() - warmTooltip.leftAt < WARM_WINDOW_MS
  )
}

function isKeyboardFocus(target: EventTarget | null): boolean {
  try {
    return target instanceof Element && target.matches(':focus-visible')
  } catch {
    return false
  }
}

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
      // Animate the floating panel, not the host, which also holds the trigger.
      target: () => this.popoverEl,
    })
  }

  public get popoverEl(): HTMLElement | null {
    return (
      this.shadowRoot?.querySelector<HTMLElement>('[role="tooltip"]') ?? null
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

  public async setOpen(
    nextOpen: boolean,
    options: OverlaySetOpenOptions = {},
  ): Promise<void> {
    this.clearHoverTimer()
    if (this.isOpen === nextOpen && this.overlayPresence.isOpen === nextOpen)
      return

    this.isOpen = nextOpen
    await this.overlayPresence.setOpen(nextOpen, null, options)
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
    if (isWarmFor(this)) {
      this.setOpen(true, { instant: true })
    } else if (this.delay <= 0) {
      this.setOpen(true)
    } else {
      this.hoverTimer = setTimeout(() => {
        this.setOpen(true)
      }, this.delay)
    }
  }

  private readonly handlePointerLeave = (): void => {
    this.clearHoverTimer()
    // Only a tooltip the pointer actually read warms its neighbors.
    if (this.isOpen) warmTooltip = { tooltip: this, leftAt: performance.now() }
    this.setOpen(false)
  }

  private readonly handleFocusIn = (e: FocusEvent): void => {
    // Immediate display on focus per OV-TLP-02; keyboard focus skips the entrance too
    this.clearHoverTimer()
    this.setOpen(true, { instant: isKeyboardFocus(e.target) })
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
