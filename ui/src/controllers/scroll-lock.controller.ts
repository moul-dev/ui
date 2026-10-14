import type { ReactiveController, ReactiveControllerHost } from 'lit'

let lockCount = 0
let originalOverflow = ''
let originalPaddingRight = ''

export class ScrollLockController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement
  private isLocked = false

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host
    this.host.addController(this)
  }

  hostConnected() {}

  hostDisconnected() {
    this.unlock()
  }

  lock() {
    if (this.isLocked || typeof document === 'undefined') return
    this.isLocked = true

    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow
      originalPaddingRight = document.body.style.paddingRight

      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
      document.body.style.overflow = 'hidden'
    }
    lockCount++
  }

  unlock() {
    if (!this.isLocked || typeof document === 'undefined') return
    this.isLocked = false
    lockCount--

    if (lockCount <= 0) {
      lockCount = 0
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
    }
  }
}
