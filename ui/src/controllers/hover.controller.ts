import type { ReactiveController, ReactiveControllerHost } from 'lit'

export interface HoverOptions {
  openDelay?: number
  closeDelay?: number
  onHoverChange?: (isHovered: boolean) => void
}

export class HoverController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement
  private targetEl: HTMLElement | null = null
  private openTimer: ReturnType<typeof setTimeout> | null = null
  private closeTimer: ReturnType<typeof setTimeout> | null = null

  isHovered = false
  options: HoverOptions

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: HoverOptions = {},
  ) {
    this.host = host
    this.options = {
      openDelay: 0,
      closeDelay: 0,
      ...options,
    }
    this.host.addController(this)
  }

  hostConnected() {}

  hostDisconnected() {
    this.detach()
  }

  attach(target: HTMLElement) {
    this.detach()
    this.targetEl = target

    this.targetEl.addEventListener('mouseenter', this.handleEnter)
    this.targetEl.addEventListener('mouseleave', this.handleLeave)
    this.targetEl.addEventListener('focusin', this.handleEnter)
    this.targetEl.addEventListener('focusout', this.handleLeave)
  }

  detach() {
    this.clearTimers()
    if (this.targetEl) {
      this.targetEl.removeEventListener('mouseenter', this.handleEnter)
      this.targetEl.removeEventListener('mouseleave', this.handleLeave)
      this.targetEl.removeEventListener('focusin', this.handleEnter)
      this.targetEl.removeEventListener('focusout', this.handleLeave)
      this.targetEl = null
    }
  }

  private clearTimers() {
    if (this.openTimer) clearTimeout(this.openTimer)
    if (this.closeTimer) clearTimeout(this.closeTimer)
    this.openTimer = null
    this.closeTimer = null
  }

  private setHovered(hovered: boolean) {
    if (this.isHovered === hovered) return
    this.isHovered = hovered
    this.options.onHoverChange?.(hovered)
    this.host.requestUpdate()
  }

  private handleEnter = () => {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer)
      this.closeTimer = null
    }

    if (this.isHovered) return

    if ((this.options.openDelay || 0) > 0) {
      this.openTimer = setTimeout(() => {
        this.setHovered(true)
      }, this.options.openDelay)
    } else {
      this.setHovered(true)
    }
  }

  private handleLeave = () => {
    if (this.openTimer) {
      clearTimeout(this.openTimer)
      this.openTimer = null
    }

    if (!this.isHovered) return

    if ((this.options.closeDelay || 0) > 0) {
      this.closeTimer = setTimeout(() => {
        this.setHovered(false)
      }, this.options.closeDelay)
    } else {
      this.setHovered(false)
    }
  }
}
