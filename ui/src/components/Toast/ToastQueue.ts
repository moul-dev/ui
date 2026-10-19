import { html, LitElement } from 'lit'
import { animate } from 'motion'
import type { SemanticTone, VisualVariant } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, SPRING_GENTLE } from '../../utils/motion'
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

export type ToastPlacement =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end'

/**
 * Fixed-position stack that hosts toasts. The region itself is promoted to the top
 * layer (manual popover) while it has children, so every toast lays out in one flex
 * column at the chosen `placement` instead of each toast floating independently.
 */
export class MoulToastRegion extends LitElement {
  static override styles = toastRegionStyles

  static override properties = {
    placement: { type: String, reflect: true },
  }

  declare placement: ToastPlacement

  private observer: MutationObserver | null = null

  constructor() {
    super()
    this.placement = 'bottom-end'
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasAttribute('popover')) this.setAttribute('popover', 'manual')
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', 'Notifications')
    }
    this.setAttribute('role', 'region')
    this.observer = new MutationObserver(() => this.syncTopLayer())
    this.observer.observe(this, { childList: true })
    this.syncTopLayer()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.observer?.disconnect()
    this.observer = null
  }

  /** True when toasts should enter from above (top placements). */
  public get isTop(): boolean {
    return this.placement.startsWith('top')
  }

  /**
   * Removes a toast and glides the remaining ones into the freed space (FLIP),
   * the way stacked notifications close ranks on iOS/macOS.
   */
  public removeToast(toast: HTMLElement): void {
    const siblings = Array.from(this.children).filter(
      (el): el is HTMLElement => el !== toast && el instanceof HTMLElement,
    )
    const before = new Map(
      siblings.map((el) => [el, el.getBoundingClientRect()]),
    )
    toast.remove()
    if (prefersReducedMotion()) return
    for (const el of siblings) {
      const prev = before.get(el)
      if (!prev) continue
      const dy = prev.top - el.getBoundingClientRect().top
      if (Math.abs(dy) < 0.5) continue
      animate(el, { y: [dy, 0] }, SPRING_GENTLE).then(() => {
        el.style.removeProperty('transform')
      })
    }
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
