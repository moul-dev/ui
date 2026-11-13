import { html, LitElement, type PropertyValues } from 'lit'
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
import { EASE_OUT, subtleAnimate } from '../../utils/motion'
import { alertStyles } from './Alert.styles'

/**
 * An inline message about a status or problem, coloured by `tone` with a
 * matching icon, a `title`, a description and optional `action` content.
 * With `is-dismissible` it shows a close button that fades the alert out and
 * fires `dismiss`; remove the element in your handler.
 *
 * Keyboard and screen readers: the alert itself is not focusable; the close
 * button is a native `<button>` named "Dismiss alert", and slotted actions
 * take focus as usual. The host gets `role="alert"` for the `error` and
 * `warning` tones and `role="status"` otherwise, so it is a live region that
 * screen readers announce assertively or politely.
 *
 * Reduced motion: the alert appears and leaves at once instead of sliding in
 * and shrinking out, and the close button no longer shrinks when pressed or
 * fades its colours.
 */
export class MoulAlert extends LitElement {
  static override styles = alertStyles

  static override properties = {
    tone: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    title: { type: String, reflect: true },
    description: { type: String, reflect: true },
    isDismissible: {
      type: Boolean,
      reflect: true,
      attribute: 'is-dismissible',
    },
  }

  declare tone: SemanticTone
  /**
   * Paints the alert in `tone`: `solid` and `shadow` fill it, `flat` tints it,
   * `bordered` and `glass` frame it. Leave it unset for the neutral
   * `--color-surface` alert.
   */
  declare variant: VisualVariant | undefined
  declare title: string
  declare description: string
  declare isDismissible: boolean

  constructor() {
    super()
    this.tone = 'primary'
    this.title = ''
    this.description = ''
    this.isDismissible = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.updateRole()
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('tone')) {
      const normalized = normalizeTone(this.tone)
      if (this.tone !== normalized) {
        this.tone = normalized
      }
      this.updateRole()
    }

    if (changedProps.has('variant') && this.variant != null) {
      const normalized = normalizeVariant(this.variant)
      if (this.variant !== normalized) {
        this.variant = normalized
      }
    }
  }

  protected override firstUpdated(): void {
    subtleAnimate(
      this,
      { transform: ['translateY(-6px)', 'translateY(0px)'], opacity: [0, 1] },
      { duration: 0.2, ease: EASE_OUT },
    )
  }

  private updateRole(): void {
    const desiredRole =
      this.tone === 'error' || this.tone === 'warning' ? 'alert' : 'status'
    this.setAttribute('role', desiredRole)
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

  private async handleDismiss(e: MouseEvent): Promise<void> {
    const controls = subtleAnimate(
      this,
      { opacity: [1, 0], transform: ['scale(1)', 'scale(0.96)'] },
      { duration: 0.15, ease: EASE_OUT },
    )
    if (controls?.finished) {
      await controls.finished
    }

    this.dispatchEvent(
      new CustomEvent('dismiss', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      }),
    )
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
          ${
            this.isDismissible
              ? html`
                <button
                  part="dismiss-button"
                  class="dismiss-button"
                  aria-label="Dismiss alert"
                  @click=${this.handleDismiss}
                >
                  ${close()}
                </button>
              `
              : ''
          }
        </div>
      </div>
    `
  }
}

defineElement('moul-alert', MoulAlert)

declare global {
  interface HTMLElementTagNameMap {
    'moul-alert': MoulAlert
  }
}
