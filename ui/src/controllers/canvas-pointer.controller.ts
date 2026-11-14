import type { ReactiveController, ReactiveControllerHost } from 'lit'

export interface CanvasPointerState {
  /** Pointer offset from the target's left edge, in CSS pixels. */
  x: number
  /** Pointer offset from the target's top edge, in CSS pixels. */
  y: number
  /** Whether the pointer is over the target's box. */
  isInside: boolean
  /** Whether a button, pen or finger is pressed. */
  isDown: boolean
  /** Horizontal velocity in CSS pixels per millisecond, smoothed. */
  velocityX: number
  /** Vertical velocity in CSS pixels per millisecond, smoothed. */
  velocityY: number
  /** `mouse`, `pen` or `touch`, from the last event; empty before the first one. */
  pointerType: string
  /** Whether a pointer has been seen since the host connected. */
  hasPointer: boolean
}

export interface CanvasPointerControllerOptions {
  /** Element whose box the position is measured against. Defaults to the host. */
  target?: () => HTMLElement | null
  /**
   * `element` (default) listens on the host; `window` follows the pointer
   * anywhere on the page, for a field that reacts to a pointer near it.
   */
  scope?: 'element' | 'window'
  /** Pointer types to follow. Defaults to every type. */
  pointerTypes?: readonly string[]
  /** Called on every move, after `state` is updated. */
  onMove?: (state: CanvasPointerState, event: PointerEvent) => void
  /** Called when a pointer is pressed over the host (or anywhere, with `window` scope). */
  onDown?: (state: CanvasPointerState, event: PointerEvent) => void
  /** Called when the press ends or is cancelled. */
  onUp?: (state: CanvasPointerState, event: PointerEvent) => void
  /** Called when the pointer leaves the host (element scope only). */
  onLeave?: (state: CanvasPointerState, event: PointerEvent) => void
}

/** How much of each new velocity sample is kept; the rest is the running average. */
const VELOCITY_SMOOTHING = 0.35

/**
 * Follows the pointer for an element drawn in script, typically a canvas
 * loop that reads `state` once per frame. Unlike `PointerController` it
 * writes no CSS variables and keeps press state and velocity, which a
 * particle field or a trail needs.
 *
 * It does not honour reduced motion by itself: the canvas loop already draws
 * a still frame then, and a pointer-driven effect decides for itself whether
 * the reader's own hand still moves it.
 */
export class CanvasPointerController implements ReactiveController {
  public readonly state: CanvasPointerState = {
    x: 0,
    y: 0,
    isInside: false,
    isDown: false,
    velocityX: 0,
    velocityY: 0,
    pointerType: '',
    hasPointer: false,
  }

  private readonly host: ReactiveControllerHost & HTMLElement
  private readonly options: CanvasPointerControllerOptions
  private lastTime = 0

  private readonly handleMove = (event: PointerEvent): void => {
    if (!this.accepts(event)) return
    this.track(event)
    this.options.onMove?.(this.state, event)
  }

  private readonly handleDown = (event: PointerEvent): void => {
    if (!this.accepts(event)) return
    this.track(event)
    this.state.isDown = true
    this.options.onDown?.(this.state, event)
  }

  private readonly handleUp = (event: PointerEvent): void => {
    if (!this.accepts(event) || !this.state.isDown) return
    this.track(event)
    this.state.isDown = false
    this.options.onUp?.(this.state, event)
  }

  private readonly handleLeave = (event: PointerEvent): void => {
    if (!this.accepts(event)) return
    this.state.isInside = false
    this.state.velocityX = 0
    this.state.velocityY = 0
    if (event.pointerType !== 'mouse') this.state.isDown = false
    this.options.onLeave?.(this.state, event)
  }

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: CanvasPointerControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    host.addController(this)
  }

  public hostConnected(): void {
    const source = this.source()
    source?.addEventListener('pointermove', this.handleMove as EventListener, {
      passive: true,
    })
    source?.addEventListener('pointerdown', this.handleDown as EventListener, {
      passive: true,
    })
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerup', this.handleUp)
      window.addEventListener('pointercancel', this.handleUp)
    }
    if (this.options.scope !== 'window') {
      this.host.addEventListener('pointerleave', this.handleLeave)
    }
  }

  public hostDisconnected(): void {
    const source = this.source()
    source?.removeEventListener('pointermove', this.handleMove as EventListener)
    source?.removeEventListener('pointerdown', this.handleDown as EventListener)
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerup', this.handleUp)
      window.removeEventListener('pointercancel', this.handleUp)
    }
    this.host.removeEventListener('pointerleave', this.handleLeave)
    this.state.isInside = false
    this.state.isDown = false
    this.state.hasPointer = false
    this.state.velocityX = 0
    this.state.velocityY = 0
  }

  /**
   * Lets velocity fall back toward zero; call once per frame so a pointer
   * that stopped moving stops pushing. `delta` is the frame's milliseconds.
   */
  public decay(delta: number): void {
    const keep = Math.exp(-delta / 120)
    this.state.velocityX *= keep
    this.state.velocityY *= keep
  }

  private source(): EventTarget | null {
    if (this.options.scope === 'window') {
      return typeof window === 'undefined' ? null : window
    }
    return this.host
  }

  private accepts(event: PointerEvent): boolean {
    const types = this.options.pointerTypes
    return !types || types.includes(event.pointerType)
  }

  private track(event: PointerEvent): void {
    const target = this.options.target?.() ?? this.host
    const rect = target.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const now = event.timeStamp || performance.now()
    const elapsed = now - this.lastTime
    if (this.state.hasPointer && elapsed > 0 && elapsed < 100) {
      const vx = (x - this.state.x) / elapsed
      const vy = (y - this.state.y) / elapsed
      this.state.velocityX += (vx - this.state.velocityX) * VELOCITY_SMOOTHING
      this.state.velocityY += (vy - this.state.velocityY) * VELOCITY_SMOOTHING
    } else {
      this.state.velocityX = 0
      this.state.velocityY = 0
    }
    this.lastTime = now
    this.state.x = x
    this.state.y = y
    this.state.isInside =
      x >= 0 && y >= 0 && x <= rect.width && y <= rect.height
    this.state.pointerType = event.pointerType
    this.state.hasPointer = true
  }
}
