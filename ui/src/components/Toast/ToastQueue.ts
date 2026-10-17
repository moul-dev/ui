import { html, LitElement } from 'lit'
import type { SemanticTone, VisualVariant } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import type { MoulToast } from './Toast'
import { toastRegionStyles } from './Toast.styles'

export interface ToastOptions {
  id?: string
  title: string
  description?: string
  tone?: SemanticTone
  variant?: VisualVariant
  duration?: number
}

export class MoulToastRegion extends LitElement {
  static override styles = toastRegionStyles

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

    toast.addEventListener('dismiss', () => {
      toast.remove()
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
