import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { animate } from 'motion'
import { defineElement } from '../../utils/define-element'
import {
  focusFirstElement,
  getDeepActiveElement,
  getFocusableElements,
  restoreFocus,
} from '../../utils/focus-trap'
import { close as closeIcon } from '../../utils/icons'
import {
  EASE_OUT,
  prefersReducedMotion,
  SPRING_GENTLE,
  SPRING_SNAPPY,
} from '../../utils/motion'
import '../Button/Button'
import {
  type CardPlacement,
  measureSpot,
  placeCard,
  readRadius,
  Spotlight,
  type SpotRect,
  spotClipPath,
} from './spotlight'
import { tourStyles } from './Tour.styles'
import { MoulTourStep } from './TourStep'

export type { TourPlacement } from './TourStep'

const TEXT_ENTRY =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"]'

/** Longest wait for the exit fade before the dialog closes anyway. */
const EXIT_TIMEOUT_MS = 300

export interface TourStepChangeDetail {
  current: number
  previous: number
}

export interface TourOpenChangeDetail {
  isOpen: boolean
  /** True when the tour closed because Done was pressed on its last step. */
  isComplete: boolean
}

/**
 * A step-by-step walkthrough of a page: each `<moul-tour-step>` dims the page
 * except for a rounded cutout around its target and shows a card beside it
 * with a heading, a body, "2 of 5" and Back, Next and Done buttons. The cutout
 * glides from target to target, each target is scrolled into view first, and
 * both follow scrolling and resizing while the tour is open. Start it with
 * `start()`; it runs in a modal `<dialog>`, so the page underneath is inert.
 *
 * Keyboard and screen readers: on start, focus moves to the card's Next
 * button, and `Tab` and `Shift+Tab` cycle inside the card. `Arrow Right` and
 * `Arrow Left` go to the next and previous step (swapped in a right-to-left
 * page) unless focus is in a text field; on the last step `Arrow Right` does
 * nothing, so finishing takes a press of Done. `Escape` and the close button
 * end the tour, and focus returns to where it was before it started. The
 * dialog is named by the step's heading and described by its body, and each
 * later step is announced as "heading, 2 of 5" through a polite live region.
 *
 * Reduced motion: the cutout jumps to each target instead of springing, the
 * card appears and moves at once instead of fading, growing and gliding, and
 * targets are scrolled into view instantly.
 *
 * @slot - The `<moul-tour-step>` elements, in order.
 * @csspart dialog - The full-viewport `<dialog>`.
 * @csspart overlay - The layer that dims the page around the cutout.
 * @csspart card - The card beside the cutout.
 * @csspart header - The row with the heading and the close button.
 * @csspart heading - The step's heading.
 * @csspart close-button - The button that ends the tour.
 * @csspart body - Holds the current step's body.
 * @csspart footer - The row with the progress and the buttons.
 * @csspart progress - The "2 of 5" text.
 * @csspart previous-button - The Back button (not shown on the first step).
 * @csspart next-button - The Next button, Done on the last step.
 * @cssprop --tour-overlay - Colour of the dimmed page. Defaults to `--color-overlay`.
 * @fires stepchange - Before the tour moves to another step by `goTo()`, `next()`, `previous()`, a button or an arrow key; `detail` is `{ current, previous }`. Cancel it to stay on the step. Setting `current` directly does not fire it.
 * @fires openchange - When the tour starts or ends through its methods, a button or `Escape`; `detail` is `{ isOpen, isComplete }`, where `isComplete` is true only when Done was pressed on the last step. Setting `isOpen` directly does not fire it.
 */
export class MoulTour extends LitElement {
  static override styles = tourStyles

  static override properties = {
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    current: { type: Number, reflect: true },
    padding: { type: Number, reflect: true },
    radius: { type: Number, reflect: true },
    nextLabel: { type: String, attribute: 'next-label' },
    previousLabel: { type: String, attribute: 'previous-label' },
    doneLabel: { type: String, attribute: 'done-label' },
    skipLabel: { type: String, attribute: 'skip-label' },
    progressLabel: { type: String, attribute: 'progress-label' },
    announcement: { state: true },
  }

  declare isOpen: boolean
  /** Index of the step shown, from 0. */
  declare current: number
  /** Space between the target and the edge of the cutout, in pixels. */
  declare padding: number
  /** Corner radius of the cutout in pixels; unset, it follows `--radius-xl`. */
  declare radius: number | undefined
  declare nextLabel: string
  declare previousLabel: string
  declare doneLabel: string
  /** Accessible name of the close button. */
  declare skipLabel: string
  /** The progress text, with `{current}` and `{total}` replaced. */
  declare progressLabel: string
  declare announcement: string

  private readonly spotlight = new Spotlight((rect) => {
    const overlay = this.overlayEl
    if (overlay) overlay.style.clipPath = spotClipPath(rect)
  })
  private shown = false
  private previousActiveElement: HTMLElement | null = null
  private cardPlacement: CardPlacement | null = null
  private observedTarget: Element | null = null
  private resizeObserver: ResizeObserver | null = null
  private frame = 0

  constructor() {
    super()
    this.isOpen = false
    this.current = 0
    this.padding = 8
    this.radius = undefined
    this.nextLabel = 'Next'
    this.previousLabel = 'Back'
    this.doneLabel = 'Done'
    this.skipLabel = 'Skip tour'
    this.progressLabel = '{current} of {total}'
    this.announcement = ''
  }

  /** The steps, in order. */
  public get steps(): MoulTourStep[] {
    return Array.from(this.children).filter(
      (el): el is MoulTourStep => el instanceof MoulTourStep,
    )
  }

  public get dialogEl(): HTMLDialogElement | null {
    return this.shadowRoot?.querySelector('dialog') ?? null
  }

  private get overlayEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part~="overlay"]') ?? null
  }

  private get cardEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part~="card"]') ?? null
  }

  private get nextButton(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part~="next-button"]') ?? null
  }

  private get isLast(): boolean {
    return this.current >= this.steps.length - 1
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('keydown', this.handleKeyDown)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.handleKeyDown)
    this.stopFollowing()
    this.spotlight.stop()
    this.shown = false
  }

  /** Opens the tour on step `index` (the first by default). */
  public start(index = 0): void {
    const total = this.steps.length
    if (total === 0) return
    this.current = Math.min(Math.max(0, Math.trunc(index) || 0), total - 1)
    if (this.isOpen) return
    this.isOpen = true
    this.emitOpenChange(false)
  }

  /**
   * Moves to step `index`, firing a cancelable `stepchange` while the tour is
   * open. Returns whether the step changed.
   */
  public goTo(index: number): boolean {
    const total = this.steps.length
    if (total === 0) return false
    const next = Math.min(Math.max(0, Math.trunc(index) || 0), total - 1)
    if (next === this.current) return false
    if (this.isOpen) {
      const event = new CustomEvent<TourStepChangeDetail>('stepchange', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { current: next, previous: this.current },
      })
      if (!this.dispatchEvent(event)) return false
    }
    this.current = next
    return true
  }

  /** Moves to the next step; on the last step it finishes the tour instead and returns false. */
  public next(): boolean {
    if (this.isOpen && this.isLast) {
      this.close(true)
      return false
    }
    return this.goTo(this.current + 1)
  }

  public previous(): boolean {
    return this.goTo(this.current - 1)
  }

  /** Ends the tour without finishing it, as the close button and `Escape` do. */
  public end(): void {
    this.close(false)
  }

  private close(isComplete: boolean): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.emitOpenChange(isComplete)
  }

  private emitOpenChange(isComplete: boolean): void {
    this.dispatchEvent(
      new CustomEvent<TourOpenChangeDetail>('openchange', {
        bubbles: true,
        composed: true,
        detail: { isOpen: this.isOpen, isComplete },
      }),
    )
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    const steps = this.steps
    if (steps.length > 0 && this.current > steps.length - 1) {
      this.current = steps.length - 1
    }
    if (!(this.current >= 0)) this.current = 0
    steps.forEach((step, index) => {
      step.isActive = index === this.current
    })
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (this.isOpen && !this.shown) {
      void this.show()
    } else if (!this.isOpen && this.shown) {
      void this.hide()
    } else if (this.shown) {
      if (changed.has('current') && changed.get('current') !== undefined) {
        void this.showStep(false)
      } else {
        this.queueReposition()
      }
    }
  }

  private async show(): Promise<void> {
    this.shown = true
    this.previousActiveElement = getDeepActiveElement()
    await this.updateComplete
    const dialog = this.dialogEl
    if (!dialog || !this.isOpen) return
    try {
      if (!dialog.open) dialog.showModal()
    } catch (err) {
      console.warn('[@moul-dev/web-component] moul-tour could not open:', err)
      this.shown = false
      return
    }
    this.announcement = ''
    this.startFollowing()
    await this.showStep(true)
  }

  private async hide(): Promise<void> {
    this.shown = false
    this.stopFollowing()
    this.spotlight.stop()
    const dialog = this.dialogEl
    const layers = [this.overlayEl, this.cardEl].filter(
      (el): el is HTMLElement => el !== null,
    )
    if (dialog?.open && !prefersReducedMotion()) {
      const fade = animate(
        layers,
        { opacity: 0 },
        { duration: 0.15, ease: EASE_OUT },
      )
      await Promise.race([
        fade.finished.catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, EXIT_TIMEOUT_MS)),
      ])
      fade.stop()
    }
    // Started again during the fade.
    if (this.isOpen) return
    try {
      dialog?.close()
    } catch {
      // Already closed.
    }
    for (const layer of layers) layer.style.removeProperty('opacity')
    this.cardPlacement = null
    this.spotlight.rect = null
    restoreFocus(this.previousActiveElement)
    this.previousActiveElement = null
  }

  /** Scrolls to the current step's target and moves the cutout and the card to it. */
  private async showStep(isEntering: boolean): Promise<void> {
    await this.updateComplete
    if (!this.shown) return
    const reduced = prefersReducedMotion()
    const target = this.currentTarget()
    if (target) scrollIntoViewIfNeeded(target, reduced)
    this.observeTarget(target)

    const spot = this.measure(target)
    const card = this.cardEl
    const from = this.cardPlacement
    const placement = this.positionCard(spot)

    if (isEntering) {
      // The cutout opens out of a point at the target's centre.
      void this.spotlight.moveTo(spot, { from: null, instant: reduced })
      if (!reduced && card) {
        animate(
          this.overlayEl as HTMLElement,
          { opacity: [0, 1] },
          { duration: 0.2, ease: EASE_OUT },
        )
        animate(
          card,
          { opacity: [0, 1], transform: ['scale(0.96)', 'scale(1)'] },
          SPRING_SNAPPY,
        )
      }
      this.focusPrimary()
      return
    }

    void this.spotlight.moveTo(spot)
    if (!reduced && card && from && placement) {
      const dx = from.left - placement.left
      const dy = from.top - placement.top
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        animate(
          card,
          {
            transform: [`translate(${dx}px, ${dy}px)`, 'translate(0px, 0px)'],
          },
          SPRING_GENTLE,
        )
      }
    }
    const step = this.steps[this.current]
    this.announcement = [step?.heading, this.progressText()]
      .filter(Boolean)
      .join(', ')
    // Back disappears on the first step; keep focus in the card.
    if (!this.isFocusInside()) this.focusPrimary()
  }

  private currentTarget(): Element | null {
    return this.steps[this.current]?.resolveTarget() ?? null
  }

  private measure(target: Element | null): SpotRect | null {
    const radius =
      this.radius ?? readRadius(this.shadowRoot?.querySelector('.probe'))
    return measureSpot(target, this.padding, radius)
  }

  private positionCard(spot: SpotRect | null): CardPlacement | null {
    const card = this.cardEl
    if (!card) return null
    const step = this.steps[this.current]
    const placement = placeCard(
      spot,
      { width: card.offsetWidth, height: card.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight },
      step?.placement ?? 'auto',
    )
    card.style.left = `${Math.round(placement.left)}px`
    card.style.top = `${Math.round(placement.top)}px`
    card.dataset.side = placement.side
    this.cardPlacement = placement
    return placement
  }

  private focusPrimary(): void {
    const next = this.nextButton
    if (next) focusFirstElement(next)
  }

  private isFocusInside(): boolean {
    const active = document.activeElement
    return active === this || (active !== null && this.contains(active))
  }

  private progressText(): string {
    return this.progressLabel
      .replace('{current}', String(this.current + 1))
      .replace('{total}', String(this.steps.length))
  }

  private startFollowing(): void {
    window.addEventListener('scroll', this.queueReposition, {
      capture: true,
      passive: true,
    })
    window.addEventListener('resize', this.queueReposition)
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.queueReposition)
      const card = this.cardEl
      if (card) this.resizeObserver.observe(card)
    }
  }

  private stopFollowing(): void {
    window.removeEventListener('scroll', this.queueReposition, {
      capture: true,
    })
    window.removeEventListener('resize', this.queueReposition)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.observedTarget = null
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  private observeTarget(target: Element | null): void {
    if (target === this.observedTarget || !this.resizeObserver) return
    if (this.observedTarget) this.resizeObserver.unobserve(this.observedTarget)
    if (target) this.resizeObserver.observe(target)
    this.observedTarget = target
  }

  private readonly queueReposition = (): void => {
    if (this.frame || !this.shown) return
    this.frame = requestAnimationFrame(() => {
      this.frame = 0
      this.reposition()
    })
  }

  /** Keeps the cutout and the card on a target that scrolled, resized or changed. */
  private reposition(): void {
    if (!this.shown) return
    const target = this.currentTarget()
    this.observeTarget(target)
    const spot = this.measure(target)
    this.spotlight.follow(spot)
    this.positionCard(spot)
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isOpen) return
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      this.end()
      return
    }
    if (e.key === 'Tab') {
      this.trapTab(e)
      return
    }
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    const origin = e.composedPath()[0]
    if (origin instanceof Element && origin.matches(TEXT_ENTRY)) return
    e.preventDefault()
    const isRtl = getComputedStyle(this).direction === 'rtl'
    const forward = (e.key === 'ArrowRight') !== isRtl
    if (!forward) this.previous()
    else if (!this.isLast) this.next()
  }

  /** Keeps `Tab` inside the card, across the shadow roots of its buttons. */
  private trapTab(e: KeyboardEvent): void {
    const card = this.cardEl
    if (!card) return
    const focusables = getFocusableElements(card)
    if (focusables.length === 0) {
      e.preventDefault()
      return
    }
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = getDeepActiveElement()
    const isInside = this.isFocusInside()
    if (e.shiftKey && (active === first || !isInside)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (active === last || !isInside)) {
      e.preventDefault()
      first.focus()
    }
  }

  /** The browser's own `Escape` handling would close the dialog behind the tour's back. */
  private readonly handleCancel = (e: Event): void => {
    e.preventDefault()
    this.end()
  }

  private readonly handleSlotChange = (): void => {
    this.requestUpdate()
  }

  protected override render() {
    const steps = this.steps
    const step = steps[this.current]
    const isLast = this.current >= steps.length - 1
    return html`
      <dialog
        part="dialog"
        aria-labelledby="heading"
        aria-describedby="body"
        @cancel=${this.handleCancel}
      >
        <div part="overlay"></div>
        <span class="probe" aria-hidden="true"></span>
        <section part="card" data-side="center">
          <div part="header">
            <h2 part="heading" id="heading">${step?.heading ?? ''}</h2>
            <button
              part="close-button"
              type="button"
              aria-label=${this.skipLabel}
              @click=${() => this.end()}
            >
              ${closeIcon()}
            </button>
          </div>
          <div part="body" id="body">
            <slot @slotchange=${this.handleSlotChange}></slot>
          </div>
          <div part="footer">
            <span part="progress">${this.progressText()}</span>
            <div class="actions">
              ${
                this.current > 0
                  ? html`<moul-button
                      part="previous-button"
                      variant="secondary"
                      size="sm"
                      @press=${() => this.previous()}
                      >${this.previousLabel}</moul-button
                    >`
                  : nothing
              }
              <moul-button
                part="next-button"
                size="sm"
                @press=${() => this.next()}
                >${isLast ? this.doneLabel : this.nextLabel}</moul-button
              >
            </div>
          </div>
        </section>
        <div class="sr-only" aria-live="polite">${this.announcement}</div>
      </dialog>
    `
  }
}

/** Scrolls `target` to the middle of its scroll container unless it is already in view. */
function scrollIntoViewIfNeeded(target: Element, reduced: boolean): void {
  const box = target.getBoundingClientRect()
  const inView =
    box.top >= 0 &&
    box.left >= 0 &&
    box.bottom <= window.innerHeight &&
    box.right <= window.innerWidth
  if (inView || typeof target.scrollIntoView !== 'function') return
  target.scrollIntoView({
    block: 'center',
    inline: 'nearest',
    behavior: (reduced ? 'instant' : 'smooth') as ScrollBehavior,
  })
}

defineElement('moul-tour', MoulTour)

declare global {
  interface HTMLElementTagNameMap {
    'moul-tour': MoulTour
  }
}
