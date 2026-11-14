import { html, LitElement } from 'lit'
import {
  closestEdge,
  type PointerEdge,
} from '../../controllers/pointer.controller'
import { defineElement } from '../../utils/define-element'
import { directionHoverStyles } from './DirectionHover.styles'

/**
 * After an exit slide has had this long, the overlay counts as parked off
 * the edge even if no `transitionend` arrived (a hidden tab, say).
 */
const PARK_MS = 700

/** Where a reveal came from: the pointer, keyboard focus or a tap. */
interface RevealReasons {
  pointer: boolean
  focus: boolean
  touch: boolean
}

/**
 * An image or card whose overlay slides in from the side the pointer came
 * in, and slides out toward the side it left, so the movement follows the
 * hand: enter from the left and the caption sweeps in from the left. Put the
 * picture in the default slot and the caption, title or actions in the
 * `overlay` slot; a slotted `img` or `video` is cropped to fill the box. The
 * picture zooms in slightly while the overlay is in. The element clips to
 * its rounded box and works out the side from the pointer's position as it
 * crosses the edge, so nothing runs while the pointer moves inside it. It
 * lives in the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The
 * overlay's content is always in the page, so screen readers read it after
 * the picture whether it is shown or not, and links in it stay in the tab
 * order: when focus moves inside the element, the overlay slides up from the
 * bottom and stays until focus leaves. A tap on a touch screen also shows it,
 * and a tap elsewhere hides it again.
 *
 * Reduced motion: the overlay fades in and out where it is, without
 * sliding, and the picture does not zoom.
 *
 * @slot - The picture: an `img`, a `video`, or any element.
 * @slot overlay - What slides in: a caption, a title, links or buttons.
 *
 * @csspart media - The box round the picture; it zooms while the overlay is in.
 * @csspart overlay - The panel that slides in, with a scrim behind the text.
 *
 * @cssprop --direction-hover-radius - The corner radius. Defaults to `var(--radius-xl)`.
 * @cssprop --direction-hover-duration - How long a slide takes. Defaults to `var(--duration-slow)`, 400ms.
 * @cssprop --direction-hover-zoom - The picture's scale while the overlay is in. Defaults to `1.05`; `1` turns the zoom off.
 * @cssprop --direction-hover-overlay-background - The scrim behind the overlay. Defaults to a gradient of `var(--color-overlay)` rising from the bottom.
 * @cssprop --direction-hover-overlay-color - The overlay's text colour. Defaults to `var(--color-snow)`.
 * @cssprop --direction-hover-padding - Space round the overlay's content. Defaults to `var(--spacing-4)`.
 */
export class MoulDirectionHover extends LitElement {
  static override styles = directionHoverStyles

  /** Whether the overlay is in, or on its way in. */
  public get isRevealed(): boolean {
    return this.getAttribute('data-state') === 'in'
  }

  private readonly reasons: RevealReasons = {
    pointer: false,
    focus: false,
    touch: false,
  }
  /** The overlay finished sliding out and rests off an edge. */
  private isParked = true
  private hiddenAt = Number.NEGATIVE_INFINITY

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('pointerenter', this.handlePointerEnter)
    this.addEventListener('pointerleave', this.handlePointerLeave)
    this.addEventListener('pointerup', this.handlePointerUp)
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('focusout', this.handleFocusOut)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('pointerenter', this.handlePointerEnter)
    this.removeEventListener('pointerleave', this.handlePointerLeave)
    this.removeEventListener('pointerup', this.handlePointerUp)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.removeEventListener('focusout', this.handleFocusOut)
    this.stopWatchingOutsideTaps()
    this.reasons.pointer = false
    this.reasons.focus = false
    this.reasons.touch = false
    this.removeAttribute('data-state')
    this.removeAttribute('data-edge')
    this.isParked = true
  }

  private get overlayEl(): HTMLElement | null {
    return (
      this.renderRoot?.querySelector<HTMLElement>('[part="overlay"]') ?? null
    )
  }

  /** The edge of the element nearest to a pointer event's position. */
  private edgeOf(event: PointerEvent): PointerEdge {
    const rect = this.getBoundingClientRect()
    return closestEdge(
      event.clientX - rect.left,
      event.clientY - rect.top,
      rect.width,
      rect.height,
    )
  }

  private readonly handlePointerEnter = (event: PointerEvent): void => {
    // A finger enters and leaves on every tap; taps are handled on pointerup.
    if (event.pointerType === 'touch') return
    this.reasons.pointer = true
    this.reveal(this.edgeOf(event))
  }

  private readonly handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return
    this.reasons.pointer = false
    this.conceal(this.edgeOf(event))
  }

  /** A tap: a touch that ended without turning into a scroll (that fires pointercancel). */
  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch' || this.reasons.touch) return
    this.reasons.touch = true
    this.reveal('bottom')
    // Wait for this tap to finish before listening for the next one.
    setTimeout(() => {
      if (this.reasons.touch && this.isConnected) {
        document.addEventListener('pointerdown', this.handleOutsideTap, true)
      }
    })
  }

  private readonly handleOutsideTap = (event: PointerEvent): void => {
    if (event.composedPath().includes(this)) return
    this.reasons.touch = false
    this.stopWatchingOutsideTaps()
    this.conceal('bottom')
  }

  private stopWatchingOutsideTaps(): void {
    document.removeEventListener('pointerdown', this.handleOutsideTap, true)
  }

  private readonly handleFocusIn = (): void => {
    this.reasons.focus = true
    this.reveal('bottom')
  }

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null
    if (next && this.contains(next)) return
    this.reasons.focus = false
    this.conceal('bottom')
  }

  private readonly handleTransitionEnd = (event: TransitionEvent): void => {
    if (event.target !== this.overlayEl) return
    if (event.propertyName === 'translate' && !this.isRevealed) {
      this.isParked = true
    }
  }

  /**
   * Slides the overlay in. If it rests off another edge, it first jumps to
   * `edge` without a transition; if it is still on its way out, it simply
   * turns back from where it is.
   */
  private reveal(edge: PointerEdge): void {
    if (this.isRevealed) return
    const parked = this.isParked || performance.now() - this.hiddenAt > PARK_MS
    const overlay = this.overlayEl
    if (parked && overlay && this.getAttribute('data-edge') !== edge) {
      this.setAttribute('data-snap', '')
      this.setAttribute('data-edge', edge)
      // Commit the jump before the transition is restored.
      void getComputedStyle(overlay).translate
      this.removeAttribute('data-snap')
    } else if (!this.hasAttribute('data-edge')) {
      this.setAttribute('data-edge', edge)
    }
    this.isParked = false
    this.setAttribute('data-state', 'in')
  }

  /** Slides the overlay out toward `edge`, unless something else still holds it in. */
  private conceal(edge: PointerEdge): void {
    const { pointer, focus, touch } = this.reasons
    if (pointer || focus || touch || !this.isRevealed) return
    this.setAttribute('data-edge', edge)
    this.setAttribute('data-state', 'out')
    this.hiddenAt = performance.now()
  }

  protected override render() {
    return html`<div part="media" class="media"><slot></slot></div>
      <div
        part="overlay"
        class="overlay"
        @transitionend=${this.handleTransitionEnd}
      >
        <slot name="overlay"></slot>
      </div>`
  }
}

defineElement('moul-direction-hover', MoulDirectionHover)

declare global {
  interface HTMLElementTagNameMap {
    'moul-direction-hover': MoulDirectionHover
  }
}
