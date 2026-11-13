import { html, LitElement, type PropertyValues } from 'lit'
import { animate } from 'motion'
import { defineElement } from '../../utils/define-element'
import { EASE_OUT, prefersReducedMotion } from '../../utils/motion'
import {
  measureSpot,
  readRadius,
  Spotlight,
  type SpotRect,
  spotClipPath,
  viewportSpot,
} from '../Tour/spotlight'
import { focusModeStyles } from './FocusMode.styles'

/**
 * Dims the page around one region so the reader can concentrate on it: wrap
 * the region in `<moul-focus-mode>` and set `is-open`. A rounded cutout
 * leaves the region (or the element `target` selects) bright and fully
 * interactive, since clicks inside the cutout pass through the dim layer; set
 * `is-blurred` to blur the page as well. The cutout follows the region as the
 * page scrolls or the region changes size, and a click on the dimmed page or
 * `Escape` ends it.
 *
 * Keyboard and screen readers: it adds no focus stop and moves no focus.
 * While it is open, `Escape` anywhere on the page ends it unless another
 * element has already handled that key. It is a visual aid, not a modal: the
 * dimmed page stays in the Tab order and in the accessibility tree, and
 * screen readers are told nothing when it opens or closes; move focus into
 * the region yourself if that is what opening it means.
 *
 * Reduced motion: the dim appears and disappears at once, without fading,
 * and the cutout jumps to the region instead of closing in on it from the
 * edges of the screen.
 *
 * @slot - The region to keep in focus.
 * @csspart overlay - The layer that dims the page around the cutout.
 * @cssprop --focus-mode-overlay - Colour of the dimmed page. Defaults to `--color-overlay`.
 * @cssprop --focus-mode-blur - Blur radius with `is-blurred`. Defaults to `4px`.
 * @fires openchange - From `setOpen()` and `toggle()`, and when `Escape` or a click on the dimmed page ends focus mode; `detail.isOpen` is the new state. Setting `isOpen` directly does not fire it.
 */
export class MoulFocusMode extends LitElement {
  static override styles = focusModeStyles

  static override properties = {
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    target: { attribute: 'target' },
    padding: { type: Number, reflect: true },
    radius: { type: Number, reflect: true },
    isBlurred: { type: Boolean, reflect: true, attribute: 'is-blurred' },
  }

  declare isOpen: boolean
  /** A CSS selector, or (as a property) an element, to keep bright instead of the host. */
  declare target: string | Element | null
  /** Space between the region and the edge of the cutout, in pixels. */
  declare padding: number
  /** Corner radius of the cutout in pixels; unset, it follows `--radius-xl`. */
  declare radius: number | undefined
  declare isBlurred: boolean

  private readonly spotlight = new Spotlight((rect) => {
    const overlay = this.overlayEl
    if (overlay) overlay.style.clipPath = spotClipPath(rect)
  })
  private shown = false
  private observed: Element | null = null
  private resizeObserver: ResizeObserver | null = null
  private frame = 0

  constructor() {
    super()
    this.isOpen = false
    this.target = null
    this.padding = 8
    this.radius = undefined
    this.isBlurred = false
  }

  public get overlayEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part~="overlay"]') ?? null
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    if (this.shown) {
      this.shown = false
      this.stopFollowing()
      this.spotlight.stop()
      this.hideOverlay()
    }
  }

  /** Opens or closes focus mode and fires `openchange`. */
  public async setOpen(nextOpen: boolean): Promise<void> {
    if (this.isOpen === nextOpen) return
    this.isOpen = nextOpen
    this.dispatchEvent(
      new CustomEvent('openchange', {
        bubbles: true,
        composed: true,
        detail: { isOpen: this.isOpen },
      }),
    )
    await this.updateComplete
  }

  public toggle(): Promise<void> {
    return this.setOpen(!this.isOpen)
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (this.isOpen && !this.shown) void this.show()
    else if (!this.isOpen && this.shown) void this.hide()
    else if (this.shown && (changed.has('target') || changed.has('padding'))) {
      this.queueReposition()
    }
  }

  /** The element the cutout surrounds. */
  private resolveTarget(): Element {
    const { target } = this
    if (target && typeof target !== 'string') return target
    if (target) {
      try {
        const root = this.getRootNode() as Document | ShadowRoot
        const found =
          root.querySelector?.(target) ?? document.querySelector(target)
        if (found) return found
      } catch {
        // Not a valid selector: fall back to the region itself.
      }
    }
    return this
  }

  private measure(): SpotRect | null {
    const radius =
      this.radius ?? readRadius(this.shadowRoot?.querySelector('.probe'))
    return measureSpot(this.resolveTarget(), this.padding, radius)
  }

  private async show(): Promise<void> {
    this.shown = true
    const overlay = this.overlayEl
    if (!overlay) return
    try {
      if (!overlay.matches(':popover-open')) overlay.showPopover()
    } catch {
      // Without the Popover API the fixed overlay still covers the page.
    }
    overlay.classList.add('is-shown')
    this.startFollowing()
    const spot = this.measure()
    if (prefersReducedMotion()) {
      this.spotlight.set(spot)
      return
    }
    // The dim closes in on the region from the edges of the screen.
    void this.spotlight.moveTo(spot, { from: viewportSpot() })
    animate(overlay, { opacity: [0, 1] }, { duration: 0.25, ease: EASE_OUT })
  }

  private async hide(): Promise<void> {
    this.shown = false
    this.stopFollowing()
    const overlay = this.overlayEl
    if (overlay && !prefersReducedMotion() && this.spotlight.rect) {
      const fade = animate(
        overlay,
        { opacity: 0 },
        { duration: 0.2, ease: EASE_OUT },
      )
      await Promise.race([
        Promise.all([
          this.spotlight.moveTo(viewportSpot()),
          fade.finished.catch(() => {}),
        ]),
        new Promise((resolve) => setTimeout(resolve, 400)),
      ])
      fade.stop()
    }
    // Opened again while it was fading.
    if (this.isOpen) return
    this.spotlight.stop()
    this.hideOverlay()
  }

  private hideOverlay(): void {
    const overlay = this.overlayEl
    if (!overlay) return
    overlay.classList.remove('is-shown')
    overlay.style.removeProperty('opacity')
    try {
      if (overlay.matches(':popover-open')) overlay.hidePopover()
    } catch {
      // Already hidden.
    }
    this.spotlight.rect = null
  }

  private startFollowing(): void {
    window.addEventListener('scroll', this.queueReposition, {
      capture: true,
      passive: true,
    })
    window.addEventListener('resize', this.queueReposition)
    document.addEventListener('keydown', this.handleKeyDown)
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.queueReposition)
    }
    this.observe(this.resolveTarget())
  }

  private stopFollowing(): void {
    window.removeEventListener('scroll', this.queueReposition, {
      capture: true,
    })
    window.removeEventListener('resize', this.queueReposition)
    document.removeEventListener('keydown', this.handleKeyDown)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.observed = null
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  private observe(element: Element): void {
    if (element === this.observed || !this.resizeObserver) return
    if (this.observed) this.resizeObserver.unobserve(this.observed)
    this.resizeObserver.observe(element)
    this.observed = element
  }

  private readonly queueReposition = (): void => {
    if (this.frame || !this.shown) return
    this.frame = requestAnimationFrame(() => {
      this.frame = 0
      if (!this.shown) return
      this.observe(this.resolveTarget())
      this.spotlight.follow(this.measure())
    })
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape' || e.defaultPrevented || !this.isOpen) return
    void this.setOpen(false)
  }

  private readonly handleOverlayClick = (): void => {
    void this.setOpen(false)
  }

  protected override render() {
    return html`
      <slot></slot>
      <div
        part="overlay"
        popover="manual"
        aria-hidden="true"
        @click=${this.handleOverlayClick}
      >
        <span class="probe"></span>
      </div>
    `
  }
}

defineElement('moul-focus-mode', MoulFocusMode)

declare global {
  interface HTMLElementTagNameMap {
    'moul-focus-mode': MoulFocusMode
  }
}
