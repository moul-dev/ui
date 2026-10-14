import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  type Middleware,
  offset,
  type Placement,
  shift,
} from '@floating-ui/dom'
import type { ReactiveController, ReactiveControllerHost } from 'lit'

export interface FloatingUIOptions {
  placement?: Placement
  offset?: number
  flip?: boolean
  shift?: boolean
  arrow?: HTMLElement | null
  syncWidth?: boolean
}

export class FloatingUIController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement
  private referenceEl: HTMLElement | null = null
  private floatingEl: HTMLElement | null = null
  private cleanup: (() => void) | null = null

  x = 0
  y = 0
  currentPlacement: Placement = 'bottom'
  options: FloatingUIOptions

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: FloatingUIOptions = {},
  ) {
    this.host = host
    this.options = {
      placement: 'bottom',
      offset: 8,
      flip: true,
      shift: true,
      ...options,
    }
    this.host.addController(this)
  }

  hostConnected() {}

  hostDisconnected() {
    this.stop()
  }

  start(referenceEl: HTMLElement, floatingEl: HTMLElement) {
    this.stop()
    this.referenceEl = referenceEl
    this.floatingEl = floatingEl

    this.cleanup = autoUpdate(referenceEl, floatingEl, () => {
      this.updatePosition()
    })
  }

  stop() {
    if (this.cleanup) {
      this.cleanup()
      this.cleanup = null
    }
    this.referenceEl = null
    this.floatingEl = null
  }

  async updatePosition() {
    if (!this.referenceEl || !this.floatingEl) return

    const middleware: Middleware[] = []

    if (this.options.offset !== undefined) {
      middleware.push(offset(this.options.offset))
    }
    if (this.options.flip !== false) {
      middleware.push(flip())
    }
    if (this.options.shift !== false) {
      middleware.push(shift({ padding: 8 }))
    }
    if (this.options.arrow) {
      middleware.push(arrow({ element: this.options.arrow }))
    }

    const { x, y, placement } = await computePosition(
      this.referenceEl,
      this.floatingEl,
      {
        placement: this.options.placement || 'bottom',
        middleware,
      },
    )

    this.x = x
    this.y = y
    this.currentPlacement = placement

    Object.assign(this.floatingEl.style, {
      left: `${x}px`,
      top: `${y}px`,
      position: 'absolute',
      ...(this.options.syncWidth && this.referenceEl
        ? { width: `${this.referenceEl.offsetWidth}px` }
        : {}),
    })

    this.host.requestUpdate()
  }
}
