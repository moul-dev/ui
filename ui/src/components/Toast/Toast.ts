import { type CSSResultOrNative, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { LiveRegionController } from '../../controllers/live-region.controller.js'
import { MoulBase } from '../../shared/base.js'
import { toastContainerStyles, toastStyles } from './Toast.styles.js'

export interface ToastOptions {
  id?: string
  title?: string
  message: string
  duration?: number
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
}

@customElement('moul-toast')
export class MoulToast extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    toastStyles,
  ]

  @property({ type: String })
  accessor title = ''

  @property({ type: String })
  accessor message = ''

  @property({ type: Number })
  accessor duration = 5000

  private timer: ReturnType<typeof setTimeout> | null = null

  override connectedCallback() {
    super.connectedCallback()
    if (this.duration > 0) {
      this.timer = setTimeout(() => this.dismiss(), this.duration)
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    if (this.timer) clearTimeout(this.timer)
  }

  dismiss = () => {
    this.dispatchEvent(
      new CustomEvent('moul-dismiss', { bubbles: true, composed: true }),
    )
    this.remove()
  }

  override render() {
    return html`
      <div class="toast" role="status" aria-live="polite" aria-atomic="true">
        ${
          this.title
            ? html`
              <div class="toast-header">
                <span class="toast-title">${this.title}</span>
                <button
                  type="button"
                  class="btn-close"
                  aria-label="Close"
                  @click="${this.dismiss}"
                ></button>
              </div>
            `
            : ''
        }
        <div class="toast-body">
          <slot>${this.message}</slot>
        </div>
      </div>
    `
  }
}

@customElement('moul-toast-container')
export class MoulToastContainer extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    toastContainerStyles,
  ]

  private liveRegion = new LiveRegionController(this, { politeness: 'polite' })

  @state()
  private accessor toasts: ToastOptions[] = []

  addToast(toast: ToastOptions) {
    const id =
      toast.id ||
      `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const toastItem = { ...toast, id }
    this.toasts = [...this.toasts, toastItem]
    this.liveRegion.announce(
      `${toast.title ? `${toast.title}: ` : ''}${toast.message}`,
      'polite',
    )
    return id
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id)
  }

  override render() {
    return html`
      ${this.toasts.map(
        (t) => html`
          <moul-toast
            title="${t.title || ''}"
            message="${t.message}"
            duration="${t.duration ?? 5000}"
            @moul-dismiss="${() => this.removeToast(t.id!)}"
          ></moul-toast>
        `,
      )}
      <slot></slot>
    `
  }
}

let containerInstance: MoulToastContainer | null = null

export function toast(options: ToastOptions | string) {
  if (typeof document === 'undefined') return
  if (!containerInstance?.isConnected) {
    containerInstance = document.createElement(
      'moul-toast-container',
    ) as MoulToastContainer
    document.body.appendChild(containerInstance)
  }
  const opts: ToastOptions =
    typeof options === 'string' ? { message: options } : options
  return containerInstance.addToast(opts)
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-toast': MoulToast
    'moul-toast-container': MoulToastContainer
  }
}
