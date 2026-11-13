import { html, LitElement, type PropertyValues } from 'lit'
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
import { toastStyles } from './Toast.styles'

/**
 * A transient notification card with a tone icon, title, description, an
 * optional `action` slot and a dismiss button. It closes itself after
 * `duration` ms (5000 by default, 0 or less to stay) and usually lives in a
 * `<moul-toast-region>`, created with `toastQueue.add()`.
 *
 * Keyboard and screen readers: the host is not focusable and no key dismisses
 * it; `Tab` reaches any slotted action and the native dismiss button
 * (`aria-label="Dismiss toast"`), which shows on hover or focus and always on
 * touch screens. The host is a live region, set when it connects:
 * `role="status"` with `aria-live="polite"`, or `role="alert"` with
 * `aria-live="assertive"` for `tone="error"`. Pointer hover pauses the
 * auto-dismiss timer and leaving resumes it; keyboard focus does not pause it.
 *
 * Reduced motion: the toast appears and disappears at once instead of rising
 * 24px in from its edge while growing from 95%, then shrinking and blurring
 * away; the dismiss button also shows without fading.
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

  public overlayPresence: OverlayPresenceController
  private timerId: ReturnType<typeof setTimeout> | null = null
  private remainingTime: number = 0
  private timerStartedAt: number = 0

  constructor() {
    super()
    this.tone = 'primary'
    this.duration = 5000
    this.title = ''
    this.description = ''
    this.isOpen = true

    // The surrounding <moul-toast-region> owns the top layer; a toast only animates.
    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'toast',
      popover: () => null,
      dialog: () => null,
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

    if (this.isOpen) {
      this.startDismissTimer(this.duration)
      // Top layer entrance animation
      this.overlayPresence.setOpen(true)
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.clearDismissTimer()
    this.removeEventListener('pointerenter', this.handlePointerEnter)
    this.removeEventListener('pointerleave', this.handlePointerLeave)
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('isOpen')) {
      if (this.isOpen) {
        this.overlayPresence.setOpen(true)
        this.startDismissTimer(this.duration)
      } else {
        this.close()
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

  private startDismissTimer(durationMs: number): void {
    this.clearDismissTimer()
    if (durationMs <= 0 || Number.isNaN(durationMs)) return

    this.remainingTime = durationMs
    this.timerStartedAt = Date.now()

    this.timerId = setTimeout(() => {
      this.close()
    }, durationMs)
  }

  private clearDismissTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  private readonly handlePointerEnter = (): void => {
    if (this.timerId !== null) {
      this.clearDismissTimer()
      const elapsed = Date.now() - this.timerStartedAt
      this.remainingTime = Math.max(0, this.remainingTime - elapsed)
    }
  }

  private readonly handlePointerLeave = (): void => {
    if (this.isOpen && this.remainingTime > 0) {
      this.startDismissTimer(this.remainingTime)
    }
  }

  public async close(): Promise<void> {
    this.clearDismissTimer()
    this.isOpen = false

    await this.overlayPresence.setOpen(false)

    this.dispatchEvent(
      new CustomEvent('dismiss', {
        bubbles: true,
        composed: true,
        detail: { id: this.id },
      }),
    )
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
    `
  }
}

defineElement('moul-toast', MoulToast)

declare global {
  interface HTMLElementTagNameMap {
    'moul-toast': MoulToast
  }
}
