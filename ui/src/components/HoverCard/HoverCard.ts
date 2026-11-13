import { html, LitElement, type PropertyValues } from 'lit'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import {
  focusFirstElement,
  supportsNativePopoverAndAnchor,
} from '../../utils/focus-trap'
import { hoverCardStyles } from './HoverCard.styles'

export type HoverCardPlacement = 'top' | 'bottom' | 'left' | 'right'

/** A focus this soon after a press on the trigger came from the pointer, not the keyboard. */
const POINTER_FOCUS_MS = 500
/** Gap between trigger and card when anchor positioning is unavailable. */
const FALLBACK_GAP = 8

/**
 * A preview card that opens beside a link or a name while the pointer rests
 * on it, for a profile, a page summary or an image behind a link. Unlike a
 * tooltip the card can hold links and buttons: the pointer can move from the
 * trigger into the card, and the card stays open while it is there. It opens
 * after `open-delay` and closes `close-delay` after the pointer has left both.
 * Touch screens have no hover, so a tap follows the link; the card must only
 * repeat what the link leads to.
 *
 * Keyboard and screen readers: the host takes no focus; the slotted trigger
 * keeps its own. Keyboard focus on the trigger opens the card at once, and
 * while it is open its content comes right after the trigger in `Tab` order;
 * the card stays open while focus is in either and closes when focus leaves
 * both. `Escape` closes it, returns focus to the trigger if it was in the
 * card, and stops there, so it does not also close a surrounding dialog. The
 * card has no role and the trigger gets no `aria-expanded` or
 * `aria-haspopup`: a screen reader reads the card's content as ordinary
 * content when it reaches it, and is not told that it opened.
 *
 * Reduced motion: the card appears and disappears at once instead of fading
 * and growing from 96% out of the trigger edge.
 *
 * @slot trigger - The link, name or avatar the card previews.
 * @slot - The card's content; links and buttons are fine.
 * @csspart trigger - The wrapper around the trigger.
 * @csspart card - The floating card.
 * @cssprop --hover-card-offset - Gap between the trigger and the card (default 8px).
 * @fires openchange - From `setOpen()` and from hover, focus and `Escape`; `detail.isOpen` is the new state. Setting `isOpen` directly does not fire it.
 */
export class MoulHoverCard extends LitElement {
  static override styles = hoverCardStyles

  static override properties = {
    placement: { type: String, reflect: true },
    openDelay: { type: Number, reflect: true, attribute: 'open-delay' },
    closeDelay: { type: Number, reflect: true, attribute: 'close-delay' },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
  }

  /** Side of the trigger the card opens on; it flips when there is no room. */
  declare placement: HoverCardPlacement
  /** Milliseconds the pointer rests on the trigger before the card opens. */
  declare openDelay: number
  /** Milliseconds after the pointer leaves the trigger and card before it closes. */
  declare closeDelay: number
  declare isOpen: boolean

  public overlayPresence: OverlayPresenceController
  private openTimer: ReturnType<typeof setTimeout> | null = null
  private closeTimer: ReturnType<typeof setTimeout> | null = null
  /** The pointer is over the trigger or the card. */
  private isPointerInside = false
  /** Focus is in the trigger or the card, put there by the keyboard. */
  private isFocusInside = false
  /** Escape closed the card with focus on the trigger: don't reopen until focus leaves. */
  private isFocusHeld = false
  private lastPressAt = Number.NEGATIVE_INFINITY

  constructor() {
    super()
    this.placement = 'bottom'
    this.openDelay = 500
    this.closeDelay = 300
    this.isOpen = false

    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'popover',
      popover: () => this.cardEl,
      // Animate the card, not the host, which also holds the trigger.
      target: () => this.cardEl,
    })
  }

  public get cardEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector<HTMLElement>('[part="card"]') ?? null
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('pointerdown', this.handlePointerDown)
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('focusout', this.handleFocusOut)
    this.addEventListener('keydown', this.handleKeyDown)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.clearTimers()
    this.removeEventListener('pointerdown', this.handlePointerDown)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.removeEventListener('focusout', this.handleFocusOut)
    this.removeEventListener('keydown', this.handleKeyDown)
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    if (
      changedProps.has('isOpen') &&
      this.isOpen !== this.overlayPresence.isOpen
    ) {
      if (this.isOpen) this.placeFallback()
      void this.overlayPresence.setOpen(this.isOpen)
    }
  }

  public async setOpen(nextOpen: boolean): Promise<void> {
    this.clearTimers()
    if (this.isOpen === nextOpen && this.overlayPresence.isOpen === nextOpen)
      return
    this.isOpen = nextOpen
    this.dispatchEvent(
      new CustomEvent('openchange', {
        bubbles: true,
        composed: true,
        detail: { isOpen: nextOpen },
      }),
    )
    if (nextOpen) this.placeFallback()
    await this.overlayPresence.setOpen(nextOpen)
  }

  private clearTimers(): void {
    if (this.openTimer !== null) clearTimeout(this.openTimer)
    if (this.closeTimer !== null) clearTimeout(this.closeTimer)
    this.openTimer = null
    this.closeTimer = null
  }

  private scheduleOpen(): void {
    this.clearTimers()
    if (this.isOpen) return
    if (this.openDelay > 0) {
      this.openTimer = setTimeout(() => this.setOpen(true), this.openDelay)
    } else {
      void this.setOpen(true)
    }
  }

  private scheduleClose(): void {
    this.clearTimers()
    if (!this.isOpen || this.isFocusInside) return
    const close = (): void => {
      if (!this.isPointerInside && !this.isFocusInside) void this.setOpen(false)
    }
    if (this.closeDelay > 0) {
      this.closeTimer = setTimeout(close, this.closeDelay)
    } else {
      close()
    }
  }

  private readonly handleTriggerEnter = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return
    this.isPointerInside = true
    this.scheduleOpen()
  }

  private readonly handleCardEnter = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return
    this.isPointerInside = true
    this.clearTimers()
    // Caught on its way out: come back.
    if (!this.isOpen && this.overlayPresence.isMounted) void this.setOpen(true)
  }

  private readonly handleLeave = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return
    this.isPointerInside = false
    this.scheduleClose()
  }

  private readonly handlePointerDown = (): void => {
    this.lastPressAt = performance.now()
  }

  /** The host's child that holds `node`: the trigger, or a piece of card content. */
  private ownChild(node: EventTarget | null): Element | null {
    let el = node instanceof Element ? node : null
    while (el && el.parentElement !== this) el = el.parentElement
    return el
  }

  private readonly handleFocusIn = (e: FocusEvent): void => {
    const child = this.ownChild(e.target)
    if (!child) return
    // A press focuses what it lands on; hover already decides for the pointer.
    if (performance.now() - this.lastPressAt < POINTER_FOCUS_MS) return
    this.isFocusInside = true
    if (child.slot !== 'trigger') {
      this.clearTimers()
      return
    }
    if (!this.isFocusHeld) void this.setOpen(true)
  }

  private readonly handleFocusOut = (e: FocusEvent): void => {
    const next = e.relatedTarget
    if (next instanceof Node && this.contains(next)) return
    this.isFocusInside = false
    this.isFocusHeld = false
    if (this.isOpen && !this.isPointerInside) void this.setOpen(false)
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape' || !this.isOpen) return
    e.preventDefault()
    e.stopPropagation()
    const child = this.ownChild(e.target)
    this.isFocusHeld = true
    void this.setOpen(false)
    // Focus in the card would vanish with it; hand it back to the trigger.
    if (child && child.slot !== 'trigger') this.focusTrigger()
  }

  private focusTrigger(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>(
      'slot[name="trigger"]',
    )
    const trigger = slot?.assignedElements({ flatten: true })[0]
    if (trigger instanceof HTMLElement) focusFirstElement(trigger)
  }

  /** Fixed coordinates for browsers without CSS anchor positioning. */
  private placeFallback(): void {
    if (supportsNativePopoverAndAnchor()) return
    const trigger = this.shadowRoot?.querySelector('[part="trigger"]')
    const card = this.cardEl
    if (!trigger || !card) return
    const rect = trigger.getBoundingClientRect()
    const style = card.style
    style.position = 'fixed'
    style.top = style.left = style.right = style.bottom = 'auto'
    switch (this.placement) {
      case 'top':
        style.bottom = `${window.innerHeight - rect.top + FALLBACK_GAP}px`
        style.left = `${rect.left + rect.width / 2}px`
        style.translate = '-50% 0'
        break
      case 'left':
        style.right = `${window.innerWidth - rect.left + FALLBACK_GAP}px`
        style.top = `${rect.top + rect.height / 2}px`
        style.translate = '0 -50%'
        break
      case 'right':
        style.left = `${rect.right + FALLBACK_GAP}px`
        style.top = `${rect.top + rect.height / 2}px`
        style.translate = '0 -50%'
        break
      default:
        style.top = `${rect.bottom + FALLBACK_GAP}px`
        style.left = `${rect.left + rect.width / 2}px`
        style.translate = '-50% 0'
    }
  }

  protected override render() {
    return html`
      <span
        part="trigger"
        class="trigger"
        @pointerenter=${this.handleTriggerEnter}
        @pointerleave=${this.handleLeave}
      >
        <slot name="trigger"></slot>
      </span>
      <div
        part="card"
        class="card"
        popover="manual"
        @pointerenter=${this.handleCardEnter}
        @pointerleave=${this.handleLeave}
      >
        <slot></slot>
      </div>
    `
  }
}

defineElement('moul-hover-card', MoulHoverCard)

declare global {
  interface HTMLElementTagNameMap {
    'moul-hover-card': MoulHoverCard
  }
}
