import { html, LitElement, type PropertyValues } from 'lit'
import { type AnimationPlaybackControls, animate } from 'motion'
import { DragController } from '../../controllers/drag.controller'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import {
  normalizeTone,
  normalizeVariant,
  type SemanticTone,
  type VisualVariant,
} from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import {
  alertError,
  alertInfo,
  alertSuccess,
  alertWarning,
  close,
} from '../../utils/icons'
import { prefersReducedMotion } from '../../utils/motion'
import { toastStyles } from './Toast.styles'

/** Share of its width a toast must be swiped for the release to dismiss it. */
const DISMISS_FRACTION = 0.4
/** Release speed (px/s) that dismisses a toast however short the swipe. */
const FLICK_VELOCITY = 500
/** How far past its own width a dismissed toast flies before it is removed. */
const FLY_OUT_GAP = 32
/** The library's snappy spring, which carries the release velocity on. */
const SWIPE_SPRING = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
  mass: 0.8,
} as const
/** Elements in the `action` slot whose click counts as the toast's action. */
const ACTION_CONTROL = 'button, moul-button, a[href], [role="button"]'

type PauseReason = 'hover' | 'focus' | 'drag' | 'region'

/**
 * A transient notification card with a tone icon, title, description, an
 * optional `action` slot and a dismiss button. It closes itself after
 * `duration` ms (5000 by default, 0 or less to stay), can be swiped sideways
 * to dismiss, and usually lives in a `<moul-toast-region>`, created with
 * `toastQueue.add()`. With `show-countdown` a thin bar along the bottom edge
 * shows the time left, which makes it an undo toast when the action slot
 * holds an Undo button.
 *
 * Keyboard and screen readers: the host is not focusable and no key dismisses
 * it; `Tab` reaches any slotted action and the native dismiss button
 * (`aria-label="Dismiss toast"`), which shows on hover or focus and always on
 * touch screens. Swiping is a pointer gesture only; the dismiss button is the
 * keyboard path to the same result. The host is a live region, set when it
 * connects: `role="status"` with `aria-live="polite"`, or `role="alert"` with
 * `aria-live="assertive"` for `tone="error"`. The auto-dismiss timer, and the
 * countdown bar with it, pauses while the pointer is over the toast, while it
 * is being swiped and while keyboard focus is inside it (or inside a stacked
 * region it belongs to), so a keyboard user can reach an Undo button before
 * the toast leaves.
 *
 * Reduced motion: the toast appears and disappears at once instead of rising
 * in from its edge with a slight overshoot, then shrinking and blurring away;
 * the dismiss button shows without fading. A swipe still follows the finger,
 * but on release the toast is removed or snaps back at once instead of flying
 * away or springing. The countdown bar keeps shrinking, linearly, because it
 * is the only sign of how much time is left.
 *
 * @slot - The description; falls back to the `description` property.
 * @slot icon - Replaces the tone icon.
 * @slot title - Replaces the `title` text.
 * @slot action - An action such as Undo. A click on a button or link in it fires `action` and closes the toast.
 * @csspart base - The row holding icon, content and actions.
 * @csspart icon - The icon box.
 * @csspart content - The title and description column.
 * @csspart title - The title text.
 * @csspart description - The description text.
 * @csspart actions - The action slot and dismiss button.
 * @csspart dismiss-button - The dismiss button.
 * @csspart countdown - The bar that shrinks over `duration` (with `show-countdown`).
 * @fires dismiss - After the toast has closed, by its timer, a swipe, the dismiss button, an action or `close()`; `detail.id` is the toast's id.
 * @fires action - When a button or link in the `action` slot is clicked; `detail.id` is the toast's id. Cancel it to keep the toast open.
 */
export class MoulToast extends LitElement {
  static override styles = toastStyles

  static override properties = {
    tone: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    duration: { type: Number, reflect: true },
    title: { type: String },
    description: { type: String, reflect: true },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    showCountdown: {
      type: Boolean,
      reflect: true,
      attribute: 'show-countdown',
    },
  }

  declare tone: SemanticTone
  /**
   * Paints the toast in `tone`: `solid` and `shadow` fill it, `flat` tints it,
   * `bordered` and `glass` frame it. Leave it unset for the neutral
   * `--color-surface` toast.
   */
  declare variant: VisualVariant | undefined
  declare duration: number
  declare title: string
  declare description: string
  declare isOpen: boolean
  /** Shows a bar along the bottom edge that shrinks over `duration` and pauses with the timer. */
  declare showCountdown: boolean

  public overlayPresence: OverlayPresenceController
  private readonly swipe: DragController
  private timerId: ReturnType<typeof setTimeout> | null = null
  private remainingTime: number = 0
  private timerStartedAt: number = 0
  private readonly pauses = new Set<PauseReason>()
  private swipeWidth = 0
  private swipeSettle: AnimationPlaybackControls | null = null
  private closing: Promise<void> | null = null

  constructor() {
    super()
    this.tone = 'primary'
    this.duration = 5000
    this.title = ''
    this.description = ''
    this.isOpen = true
    this.showCountdown = false

    // The surrounding <moul-toast-region> owns the top layer; a toast only animates.
    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'toast',
      popover: () => null,
      dialog: () => null,
    })

    // Before the drag controller's own listener: a press catches a toast still settling.
    this.addEventListener('pointerdown', this.stopSwipeSettle)
    this.swipe = new DragController(this, {
      axis: 'x',
      prefix: '--_swipe',
      disabled: () => !this.isOpen,
      // The toast settles itself on release, so it can fade as it goes.
      release: () => null,
      onStart: () => {
        this.swipeWidth = this.getBoundingClientRect().width || 1
        this.toggleAttribute('data-swiping', true)
        this.pause('drag')
      },
      onMove: (state) => this.applySwipe(state.x),
      onSettle: (state) => void this.releaseSwipe(state.x, state.velocityX),
    })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    const region = this.closest('moul-toast-region') as
      | (HTMLElement & { isTop?: boolean })
      | null
    this.overlayPresence.preset = region?.isTop ? 'toast-top' : 'toast'

    const isAlert = this.tone === 'error'
    this.setAttribute('role', isAlert ? 'alert' : 'status')
    this.setAttribute('aria-live', isAlert ? 'assertive' : 'polite')

    this.addEventListener('pointerenter', this.handlePointerEnter)
    this.addEventListener('pointerleave', this.handlePointerLeave)
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('focusout', this.handleFocusOut)
    this.addEventListener('click', this.handleClick)

    if (this.isOpen) {
      this.startDismissTimer(this.duration)
      // Top layer entrance animation
      this.overlayPresence.setOpen(true)
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.clearDismissTimer()
    this.stopSwipeSettle()
    this.removeEventListener('pointerenter', this.handlePointerEnter)
    this.removeEventListener('pointerleave', this.handlePointerLeave)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.removeEventListener('focusout', this.handleFocusOut)
    this.removeEventListener('click', this.handleClick)
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('isOpen')) {
      if (this.isOpen) {
        this.closing = null
        this.overlayPresence.setOpen(true)
        this.startDismissTimer(this.duration)
      } else if (this.overlayPresence.isOpen) {
        // Closed from outside (`isOpen = false`), not by `close()`.
        void this.close()
      }
    }

    if (changedProps.has('tone')) {
      const normalized = normalizeTone(this.tone)
      if (this.tone !== normalized) {
        this.tone = normalized
      }
    }

    if (changedProps.has('variant') && this.variant != null) {
      const normalized = normalizeVariant(this.variant)
      if (this.variant !== normalized) {
        this.variant = normalized
      }
    }
  }

  /** Whether the timer is held by a hover, a swipe, keyboard focus or a fanned-out deck. */
  public get isPaused(): boolean {
    return this.pauses.size > 0
  }

  /**
   * Holds the timer while a stacked `<moul-toast-region>` is fanned out.
   * @internal
   */
  public holdTimer(isHeld: boolean): void {
    if (isHeld) this.pause('region')
    else this.resume('region')
  }

  private startDismissTimer(durationMs: number): void {
    this.clearDismissTimer()
    this.remainingTime = durationMs > 0 ? durationMs : 0
    this.style.setProperty('--_toast-duration', `${this.remainingTime}ms`)
    this.restartCountdown()
    if (!this.isPaused) this.runTimer()
  }

  private runTimer(): void {
    if (this.remainingTime <= 0 || Number.isNaN(this.remainingTime)) return
    this.timerStartedAt = Date.now()
    this.timerId = setTimeout(() => {
      this.timerId = null
      void this.close()
    }, this.remainingTime)
  }

  private clearDismissTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  private pause(reason: PauseReason): void {
    const wasPaused = this.isPaused
    this.pauses.add(reason)
    if (wasPaused) return
    this.toggleAttribute('data-paused', true)
    if (this.timerId !== null) {
      this.clearDismissTimer()
      const elapsed = Date.now() - this.timerStartedAt
      this.remainingTime = Math.max(0, this.remainingTime - elapsed)
    }
  }

  private resume(reason: PauseReason): void {
    if (!this.pauses.delete(reason) || this.isPaused) return
    this.toggleAttribute('data-paused', false)
    if (this.isOpen && this.timerId === null) this.runTimer()
  }

  /** Plays the countdown bar from full again, for a fresh timer. */
  private restartCountdown(): void {
    const bar =
      this.renderRoot?.querySelector<HTMLElement>('[part="countdown"]')
    if (!bar) return
    bar.style.animation = 'none'
    void bar.offsetWidth
    bar.style.removeProperty('animation')
  }

  private readonly handlePointerEnter = (): void => this.pause('hover')
  private readonly handlePointerLeave = (): void => this.resume('hover')
  private readonly handleFocusIn = (): void => this.pause('focus')

  private readonly handleFocusOut = (e: FocusEvent): void => {
    const next = e.relatedTarget as Node | null
    if (next && (this.contains(next) || this.renderRoot.contains(next))) return
    this.resume('focus')
  }

  /** Writes the swipe offset and how far the toast has faded with it. */
  private applySwipe(x: number): void {
    this.swipe.jumpTo({ x, y: 0 })
    const fade = Math.min(1, Math.abs(x) / (this.swipeWidth || 1))
    this.style.setProperty(
      '--_swipe-fade',
      String(Math.round(fade * 1000) / 1000),
    )
  }

  private readonly stopSwipeSettle = (): void => {
    this.swipeSettle?.stop()
    this.swipeSettle = null
  }

  /** Springs the swipe offset to `to`; resolves when it arrives, never if a new press cuts it short. */
  private settleSwipe(to: number, velocity: number): Promise<void> {
    this.stopSwipeSettle()
    if (prefersReducedMotion() || to === this.swipe.state.x) {
      this.applySwipe(to)
      return Promise.resolve()
    }
    const settle = animate(this.swipe.state.x, to, {
      ...SWIPE_SPRING,
      velocity,
      onUpdate: (x: number) => this.applySwipe(x),
    })
    this.swipeSettle = settle
    return new Promise<void>((resolve) => {
      settle.then(() => {
        if (this.swipeSettle !== settle) return
        this.swipeSettle = null
        this.applySwipe(to)
        resolve()
      })
    })
  }

  /** After a swipe: far enough, or flung outward, flies the toast away; otherwise it springs back. */
  private async releaseSwipe(x: number, velocity: number): Promise<void> {
    const width = this.swipeWidth || 1
    let direction = 0
    if (Math.abs(velocity) > FLICK_VELOCITY) {
      // A flick back toward the middle cancels the swipe.
      if (x === 0 || Math.sign(velocity) === Math.sign(x)) {
        direction = Math.sign(velocity)
      }
    } else if (Math.abs(x) > width * DISMISS_FRACTION) {
      direction = Math.sign(x)
    }

    if (!direction) {
      await this.settleSwipe(0, velocity)
      this.toggleAttribute('data-swiping', false)
      this.resume('drag')
      return
    }
    await this.settleSwipe(direction * (width + FLY_OUT_GAP), velocity)
    // Already out of sight: skip the exit animation.
    await this.finishClose(true)
  }

  /** Closes the toast with its exit animation and fires `dismiss`. */
  public close(): Promise<void> {
    return this.finishClose(false)
  }

  private finishClose(instant: boolean): Promise<void> {
    if (this.closing) return this.closing
    this.clearDismissTimer()
    this.isOpen = false
    const closing = this.overlayPresence
      .setOpen(false, null, { instant })
      .then(() => {
        this.dispatchEvent(
          new CustomEvent('dismiss', {
            bubbles: true,
            composed: true,
            detail: { id: this.id },
          }),
        )
      })
    this.closing = closing
    return closing
  }

  /** A click on a button or link in the action slot is the toast's action. */
  private readonly handleClick = (e: MouseEvent): void => {
    const path = e.composedPath()
    const child = path.findIndex(
      (node) => node instanceof Element && node.parentElement === this,
    )
    if (child < 0 || (path[child] as Element).slot !== 'action') return
    const isControl = path
      .slice(0, child + 1)
      .some((node) => node instanceof Element && node.matches(ACTION_CONTROL))
    if (!isControl || !this.isOpen) return
    const action = new CustomEvent('action', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { id: this.id },
    })
    if (this.dispatchEvent(action)) void this.close()
  }

  private getDefaultIcon() {
    switch (this.tone) {
      case 'error':
        return alertError()
      case 'warning':
        return alertWarning()
      case 'success':
        return alertSuccess()
      default:
        return alertInfo()
    }
  }

  protected override render() {
    return html`
      <div part="base">
        <div part="icon">
          <slot name="icon">${this.getDefaultIcon()}</slot>
        </div>
        <div part="content">
          <slot name="title">
            ${this.title ? html`<div part="title">${this.title}</div>` : ''}
          </slot>
          <div part="description">
            <slot>${this.description}</slot>
          </div>
        </div>
        <div part="actions">
          <slot name="action"></slot>
          <button
            part="dismiss-button"
            class="dismiss-button"
            aria-label="Dismiss toast"
            @click=${() => this.close()}
          >
            ${close()}
          </button>
        </div>
      </div>
      ${
        this.showCountdown && this.duration > 0
          ? html`<div part="countdown" aria-hidden="true"></div>`
          : ''
      }
    `
  }
}

defineElement('moul-toast', MoulToast)

declare global {
  interface HTMLElementTagNameMap {
    'moul-toast': MoulToast
  }
}
