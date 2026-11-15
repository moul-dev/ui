import { html, LitElement, type PropertyValues } from 'lit'
import { type AnimationPlaybackControls, animate } from 'motion'
import type { SemanticTone, VisualVariant } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, SPRING_GENTLE } from '../../utils/motion'
import '../Button/Button'
// `toastQueue.add()` creates `<moul-toast>`, so the region brings it along.
import './Toast'
import type { MoulToast } from './Toast'
import { toastRegionStyles } from './Toast.styles'

export interface ToastAction {
  /** The button's text, e.g. "Undo". */
  label: string
  /** Called when the button is pressed, before the toast closes. */
  onAction?: () => void
}

export interface ToastOptions {
  id?: string
  title: string
  description?: string
  tone?: SemanticTone
  variant?: VisualVariant
  duration?: number
  /** A button in the toast; pressing it calls `onAction` and closes the toast. */
  action?: ToastAction
  /** Shows a bar that shrinks over `duration`, for undo toasts. */
  showCountdown?: boolean
}

export type ToastPlacement =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end'

/** How far each card behind the front one peeks out of a stacked deck, in px. */
const STACK_PEEK = 12
/** Cards that show in a stacked deck, the front one included. */
const STACK_VISIBLE = 3
/** The custom properties a deck writes on each toast. */
const STACK_PROPS = [
  '--_stack-y',
  '--_stack-shrink',
  '--_stack-dim',
  '--_stack-clip',
]

/**
 * Fixed-position stack that hosts toasts. The region itself is promoted to the top
 * layer (manual popover) while it has children, so every toast lays out in one flex
 * column at the chosen `placement` instead of each toast floating independently.
 * With `is-stacked` the toasts collapse into a deck, the newest in front and
 * two behind it peeking out, that fans out into the list on hover or focus.
 *
 * Keyboard and screen readers: not focusable and handles no keys; the toasts'
 * dismiss buttons and actions take focus. It is a landmark with
 * `role="region"`, named "Notifications" unless you set `aria-label`; the
 * announcements come from each toast's own live region. A stacked deck fans
 * out, and holds every toast's timer, while the pointer is over it or
 * keyboard focus is inside it, so a focused toast is never hidden behind
 * another; every toast in the deck stays in the reading order.
 *
 * Reduced motion: when a toast is removed, the toasts left behind jump into
 * the freed space instead of gliding there, and a stacked deck collapses and
 * fans out at once.
 *
 * @slot - The `<moul-toast>` elements, oldest first.
 */
export class MoulToastRegion extends LitElement {
  static override styles = toastRegionStyles

  static override properties = {
    placement: { type: String, reflect: true },
    isStacked: { type: Boolean, reflect: true, attribute: 'is-stacked' },
  }

  declare placement: ToastPlacement
  /** Collapses the toasts into a deck that fans out on hover or focus. */
  declare isStacked: boolean

  private observer: MutationObserver | null = null
  private resizeObserver: ResizeObserver | null = null
  private isHovered = false
  private hasFocus = false

  constructor() {
    super()
    this.placement = 'bottom-end'
    this.isStacked = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasAttribute('popover')) this.setAttribute('popover', 'manual')
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', 'Notifications')
    }
    this.setAttribute('role', 'region')
    this.observer = new MutationObserver(() => {
      this.syncTopLayer()
      this.syncStack()
    })
    this.observer.observe(this, { childList: true })
    this.syncTopLayer()
    this.addEventListener('pointerenter', this.handlePointerEnter)
    this.addEventListener('pointerleave', this.handlePointerLeave)
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('focusout', this.handleFocusOut)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.observer?.disconnect()
    this.observer = null
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.removeEventListener('pointerenter', this.handlePointerEnter)
    this.removeEventListener('pointerleave', this.handlePointerLeave)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.removeEventListener('focusout', this.handleFocusOut)
  }

  private readonly handlePointerEnter = (): void => {
    this.isHovered = true
    this.syncHold()
  }

  private readonly handlePointerLeave = (): void => {
    this.isHovered = false
    this.syncHold()
  }

  private readonly handleFocusIn = (): void => {
    this.hasFocus = true
    this.syncHold()
  }

  private readonly handleFocusOut = (e: FocusEvent): void => {
    this.hasFocus = this.contains(e.relatedTarget as Node | null)
    this.syncHold()
  }

  /** A fanned-out deck holds every toast's timer, so none leaves while it is read. */
  private syncHold(): void {
    const isHeld = this.isStacked && (this.isHovered || this.hasFocus)
    for (const toast of this.toasts) {
      ;(toast as Partial<MoulToast>).holdTimer?.(isHeld)
    }
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    if (changedProps.has('isStacked') || changedProps.has('placement')) {
      this.syncStack()
    }
  }

  /** Close-ranks glides in flight, so a second removal can retarget them. */
  private readonly glides = new WeakMap<
    HTMLElement,
    AnimationPlaybackControls
  >()

  /** Where each toast's list slot was on screen at the last deck layout. */
  private stackTops = new WeakMap<HTMLElement, number>()

  /** True when toasts should enter from above (top placements). */
  public get isTop(): boolean {
    return this.placement.startsWith('top')
  }

  /**
   * Removes a toast and glides the remaining ones into the freed space (FLIP),
   * the way stacked notifications close ranks on iOS/macOS.
   */
  public removeToast(toast: HTMLElement): void {
    if (this.isStacked) {
      // The deck glides its toasts on from their last slots itself.
      toast.remove()
      this.syncStack()
      return
    }
    const siblings = Array.from(this.children).filter(
      (el): el is HTMLElement => el !== toast && el instanceof HTMLElement,
    )
    // Where each toast is on screen now, including a glide still in flight.
    const before = new Map(
      siblings.map((el) => [el, el.getBoundingClientRect()]),
    )
    toast.remove()
    if (prefersReducedMotion()) return
    // Drop unfinished glides so the next reads see the new layout slots, not old offsets.
    for (const el of siblings) this.stopGlide(el)
    for (const el of siblings) {
      const prev = before.get(el)
      if (prev) this.glide(el, prev.top - el.getBoundingClientRect().top)
    }
  }

  /** Slides a toast from `dy` px away back into its slot. */
  private glide(el: HTMLElement, dy: number): void {
    if (prefersReducedMotion() || Math.abs(dy) < 0.5) return
    const glide = animate(
      el,
      { transform: [`translateY(${dy}px)`, 'translateY(0px)'] },
      SPRING_GENTLE,
    )
    this.glides.set(el, glide)
    glide.then(() => {
      if (this.glides.get(el) !== glide) return
      this.glides.delete(el)
      el.style.removeProperty('transform')
    })
  }

  /** Stops a glide in flight and returns how far from its slot it had left to go. */
  private stopGlide(el: HTMLElement): number {
    const running = this.glides.get(el)
    if (!running) return 0
    let remaining = 0
    try {
      remaining = new DOMMatrixReadOnly(getComputedStyle(el).transform).m42
    } catch {
      // No DOMMatrix: the glide restarts from the new offset alone.
    }
    running.cancel()
    this.glides.delete(el)
    el.style.removeProperty('transform')
    return remaining
  }

  /**
   * Keeps each toast's place in the deck current while `is-stacked` is set,
   * and clears it otherwise.
   */
  private syncStack(): void {
    this.syncHold()
    this.resizeObserver?.disconnect()
    if (!this.isStacked) {
      this.resizeObserver = null
      this.stackTops = new WeakMap()
      for (const toast of this.toasts) {
        for (const prop of STACK_PROPS) toast.style.removeProperty(prop)
      }
      return
    }
    if (!this.resizeObserver && typeof ResizeObserver === 'function') {
      // A toast that renders, or wraps to a new height, moves the deck.
      this.resizeObserver = new ResizeObserver(() => this.layoutStack())
    }
    for (const toast of this.toasts) this.resizeObserver?.observe(toast)
    this.layoutStack()
  }

  private get toasts(): HTMLElement[] {
    return Array.from(this.children).filter(
      (el): el is HTMLElement => el.localName === 'moul-toast',
    )
  }

  /**
   * Writes each toast's place in the deck: how far it moves to sit behind
   * the front toast (the newest, nearest the edge) with its far edge peeking
   * out, how much it shrinks and fades, and how much of a taller card to trim.
   * Offsets are measured from the plain list layout, which is also the
   * fanned-out layout, so fanning out is only a transition. A toast whose
   * list slot moved (a toast arrived or left) glides from where it was.
   */
  private layoutStack(): void {
    const toasts = this.toasts
    const front = toasts[toasts.length - 1]
    if (!this.isStacked || !front) return
    const regionTop = this.getBoundingClientRect().top
    const frontTop = front.offsetTop
    const frontHeight = front.offsetHeight
    toasts.forEach((toast, index) => {
      const top = toast.offsetTop
      const last = this.stackTops.get(toast)
      this.stackTops.set(toast, regionTop + top)
      if (last !== undefined) {
        this.glide(toast, last - (regionTop + top) + this.stopGlide(toast))
      }

      const style = toast.style
      const depth = Math.min(toasts.length - 1 - index, STACK_VISIBLE)
      if (depth === 0) {
        for (const prop of STACK_PROPS) style.removeProperty(prop)
        return
      }
      const height = toast.offsetHeight
      const y = this.isTop
        ? frontTop + frontHeight + depth * STACK_PEEK - (top + height)
        : frontTop - depth * STACK_PEEK - top
      style.setProperty('--_stack-y', `${Math.round(y)}px`)
      style.setProperty('--_stack-shrink', String(depth * 0.05))
      style.setProperty(
        '--_stack-dim',
        depth >= STACK_VISIBLE ? '1' : String(depth * 0.2),
      )
      style.setProperty(
        '--_stack-clip',
        `${Math.max(0, height - frontHeight)}px`,
      )
    })
  }

  private syncTopLayer(): void {
    if (typeof this.showPopover !== 'function') return
    const hasToasts = this.childElementCount > 0
    try {
      const isShown = this.matches(':popover-open')
      if (hasToasts && !isShown) this.showPopover()
      else if (!hasToasts && isShown) this.hidePopover()
    } catch {
      // Environments without the Popover API keep the fixed-position fallback.
    }
  }

  protected override render() {
    return html`<slot></slot>`
  }
}

defineElement('moul-toast-region', MoulToastRegion)

declare global {
  interface HTMLElementTagNameMap {
    'moul-toast-region': MoulToastRegion
  }
}

let toastCounter = 0

class ToastQueue {
  private region: MoulToastRegion | null = null
  private defaultPlacement: ToastPlacement = 'bottom-end'
  private defaultStacked = false

  /** Whether the shared region collapses its toasts into a deck. Applies to the existing region immediately. */
  public get isStacked(): boolean {
    return this.region?.isConnected
      ? this.region.isStacked
      : this.defaultStacked
  }

  public set isStacked(next: boolean) {
    this.defaultStacked = next
    const region = this.region?.isConnected ? this.region : null
    if (region) region.isStacked = next
  }

  /** Where the shared region docks. Applies to the existing region immediately. */
  public get placement(): ToastPlacement {
    return this.region?.placement ?? this.defaultPlacement
  }

  public set placement(next: ToastPlacement) {
    this.defaultPlacement = next
    const region = this.region?.isConnected ? this.region : null
    if (region) region.placement = next
  }

  private getOrCreateRegion(): MoulToastRegion | null {
    if (typeof document === 'undefined') return null

    if (!this.region?.isConnected) {
      let existing = document.querySelector(
        'moul-toast-region',
      ) as MoulToastRegion | null
      if (!existing) {
        existing = document.createElement(
          'moul-toast-region',
        ) as MoulToastRegion
        existing.placement = this.defaultPlacement
        existing.isStacked = this.defaultStacked
        document.body.appendChild(existing)
      }
      this.region = existing
    }
    return this.region
  }

  public add(options: ToastOptions): string {
    const id = options.id ?? `toast-${++toastCounter}`
    const region = this.getOrCreateRegion()
    if (!region) return id

    const toast = document.createElement('moul-toast') as MoulToast
    toast.id = id
    toast.title = options.title
    if (options.description) toast.description = options.description
    if (options.tone) toast.tone = options.tone
    if (options.variant) toast.variant = options.variant
    if (typeof options.duration === 'number') toast.duration = options.duration
    if (options.showCountdown) toast.showCountdown = true

    const { action } = options
    if (action) {
      const button = document.createElement('moul-button')
      button.slot = 'action'
      button.size = 'sm'
      button.variant = 'secondary'
      button.textContent = action.label
      toast.append(button)
      if (action.onAction) {
        toast.addEventListener('action', () => action.onAction?.())
      }
    }

    toast.addEventListener('dismiss', () => {
      region.removeToast(toast)
    })

    region.appendChild(toast)
    return id
  }

  public close(id: string): void {
    const region = this.getOrCreateRegion()
    if (!region) return

    const toast = region.querySelector(`#${id}`) as MoulToast | null
    if (toast) {
      toast.close()
    }
  }

  public clear(): void {
    const region = this.getOrCreateRegion()
    if (!region) return

    const toasts = Array.from(
      region.querySelectorAll('moul-toast'),
    ) as MoulToast[]
    toasts.forEach((t) => {
      t.close()
    })
  }
}

export const toastQueue = new ToastQueue()
