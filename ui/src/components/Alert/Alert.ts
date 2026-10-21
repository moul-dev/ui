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
import { SPRING_GENTLE, subtleAnimate } from '../../utils/motion'
import { alertStyles } from './Alert.styles'

export class MoulAlert extends LitElement {
  static override styles = alertStyles

  static override properties = {
    tone: { type: String, reflect: true },
    // The default isn't reflected, so an unset variant renders the plain surface.
    variant: { type: String, reflect: true, useDefault: true },
    title: { type: String, reflect: true },
    description: { type: String, reflect: true },
    isDismissible: {
      type: Boolean,
      reflect: true,
      attribute: 'is-dismissible',
    },
  }

  declare tone: SemanticTone
  declare variant: VisualVariant
  declare title: string
  declare description: string
  declare isDismissible: boolean

  constructor() {
    super()
    this.tone = 'primary'
    this.variant = 'flat'
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

    if (changedProps.has('variant')) {
      const normalized = normalizeVariant(this.variant)
      if (this.variant !== normalized) {
        this.variant = normalized
      }
    }
  }

  protected override firstUpdated(): void {
    subtleAnimate(this, { y: [-6, 0], opacity: [0, 1] }, SPRING_GENTLE)
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
      { opacity: [1, 0], scale: [1, 0.96] },
      { duration: 0.18 },
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
