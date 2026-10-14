import type { ReactiveController, ReactiveControllerHost } from 'lit'

export class FocusTrapController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement
  private active = false
  private previouslyFocusedElement: HTMLElement | null = null

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host
    this.host.addController(this)
  }

  hostConnected() {}

  hostDisconnected() {
    this.deactivate()
  }

  activate() {
    if (this.active) return
    this.active = true
    this.previouslyFocusedElement =
      (document.activeElement as HTMLElement) || null

    this.host.addEventListener('keydown', this.handleKeyDown)

    // Initial focus on first focusable element
    requestAnimationFrame(() => {
      const focusable = this.getFocusableElements()
      if (focusable.length > 0) {
        focusable[0].focus()
      } else {
        this.host.focus()
      }
    })
  }

  deactivate() {
    if (!this.active) return
    this.active = false
    this.host.removeEventListener('keydown', this.handleKeyDown)

    if (
      this.previouslyFocusedElement &&
      typeof this.previouslyFocusedElement.focus === 'function'
    ) {
      this.previouslyFocusedElement.focus()
    }
    this.previouslyFocusedElement = null
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    const focusable = this.getFocusableElements()
    if (focusable.length === 0) {
      event.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const rootNode = this.host.shadowRoot || this.host
    const activeEl =
      (rootNode as Document | ShadowRoot).activeElement ||
      document.activeElement

    if (event.shiftKey) {
      if (activeEl === first || activeEl === this.host) {
        event.preventDefault()
        last.focus()
      }
    } else {
      if (activeEl === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const root = this.host.shadowRoot || this.host
    const elements = Array.from(root.querySelectorAll<HTMLElement>(selector))
    // Also include slotted light DOM focusable elements
    const slotted = Array.from(
      this.host.querySelectorAll<HTMLElement>(selector),
    )
    const combined = Array.from(new Set([...elements, ...slotted]))
    return combined.filter(
      (el) =>
        !el.hasAttribute('disabled') &&
        el.getAttribute('aria-hidden') !== 'true' &&
        el.offsetParent !== null,
    )
  }
}
