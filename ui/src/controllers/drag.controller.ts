import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { type AnimationPlaybackControls, animate } from 'motion'
import { prefersReducedMotion } from '../utils/motion'

export type DragAxis = 'x' | 'y' | 'both'

export interface DragPoint {
  x: number
  y: number
}

/** Limits for the drag offset, in pixels from the resting origin. Leave a side out for no limit. */
export interface DragBounds {
  left?: number
  right?: number
  top?: number
  bottom?: number
}

export interface DragState {
  /** Current offset from the resting origin, in CSS pixels. */
  x: number
  y: number
  /** Movement since this drag started. */
  deltaX: number
  deltaY: number
  /** Pixels per second over the last 100 ms of movement. */
  velocityX: number
  velocityY: number
  isDragging: boolean
  /** `mouse`, `pen` or `touch`, from the pointer that started the drag. */
  pointerType: string
}

export interface DragSpring {
  stiffness?: number
  damping?: number
  mass?: number
}

export interface DragControllerOptions {
  /**
   * Element that starts a drag when pressed. Defaults to the host. Can live
   * in the host's shadow root: presses are caught on the host and matched
   * against the event path.
   */
  handle?: () => HTMLElement | null
  /** Element that receives `--drag-x` and `--drag-y`. Defaults to the host. */
  styleTarget?: () => HTMLElement | null
  /** Axis the drag moves along. Defaults to `both`. */
  axis?: DragAxis
  /** Limits for the offset, read when each drag starts. */
  bounds?: () => DragBounds | null
  /**
   * How far the offset follows the pointer past a bound: 0 stops dead,
   * 1 ignores the bound until release. Defaults to 0.35, a rubber band.
   */
  elastic?: number
  /** Pixels the pointer must travel before a press becomes a drag, so taps still click. Defaults to 4. */
  threshold?: number
  /**
   * Asked once per press, when it has travelled `threshold` pixels along the
   * drag axis, whether it becomes a drag. Return false to leave the rest of
   * the press to the browser, for example so content that is not scrolled to
   * its top scrolls instead of being pulled. `deltaX` and `deltaY` are the
   * pointer's travel so far.
   */
  canStart?: (intent: {
    deltaX: number
    deltaY: number
    event: PointerEvent
  }) => boolean
  /**
   * Where the offset comes to rest after release, given the final state
   * (including velocity, for flicks). Return null to stay where it was let
   * go, pulled back inside the bounds. Defaults to the origin.
   */
  release?: (state: DragState) => DragPoint | null
  /** Spring for the release. Defaults to stiffness 500, damping 35, mass 0.8, the library's snappy spring. */
  spring?: DragSpring
  /** Prefix for the CSS variables. Defaults to `--drag`. */
  prefix?: string
  /** Ignore presses while this returns true. */
  disabled?: () => boolean
  onStart?: (state: DragState) => void
  onMove?: (state: DragState) => void
  /** Called on release with the point the offset is heading to. */
  onEnd?: (state: DragState, restingPoint: DragPoint) => void
  /** Called when the release spring comes to rest. */
  onSettle?: (state: DragState) => void
}

/** Velocity is measured over this window of recent samples. */
const VELOCITY_WINDOW_MS = 100

const DEFAULT_SPRING: Required<DragSpring> = {
  stiffness: 500,
  damping: 35,
  mass: 0.8,
}

interface Sample {
  time: number
  x: number
  y: number
}

/**
 * Turns presses on an element into a drag with pointer capture, measures
 * the release velocity, and springs the element to where it should rest.
 * The offset is written as `--drag-x` and `--drag-y` (in `px`), so the
 * element moves itself in CSS, for example with
 * `translate: var(--drag-x, 0) var(--drag-y, 0)`.
 *
 * A press only becomes a drag after `threshold` pixels, and the click that
 * ends a real drag is swallowed, so links and buttons inside still work on a
 * tap. On a single-axis drag the cross axis is left to the browser for
 * scrolling. Dragging is a pointer gesture only: give every draggable element
 * a keyboard path to the same result (arrow keys, a button). Under reduced
 * motion the release jumps to its resting point instead of springing.
 */
export class DragController implements ReactiveController {
  public readonly state: DragState = {
    x: 0,
    y: 0,
    deltaX: 0,
    deltaY: 0,
    velocityX: 0,
    velocityY: 0,
    isDragging: false,
    pointerType: '',
  }

  private readonly host: ReactiveControllerHost & HTMLElement
  private readonly options: DragControllerOptions
  private pointerId: number | null = null
  private startClientX = 0
  private startClientY = 0
  private originX = 0
  private originY = 0
  private bounds: DragBounds = {}
  private samples: Sample[] = []
  private springs: AnimationPlaybackControls[] = []
  private resolveSprings: (() => void) | null = null
  private touchActionHandle: HTMLElement | null = null
  private captured: HTMLElement | null = null

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.pointerId !== null || !event.isPrimary) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (this.options.disabled?.()) return
    const handle = this.resolveHandle()
    if (!handle || !event.composedPath().includes(handle)) return

    this.stopSprings()
    this.pointerId = event.pointerId
    this.startClientX = event.clientX
    this.startClientY = event.clientY
    this.originX = this.state.x
    this.originY = this.state.y
    this.state.pointerType = event.pointerType
    this.samples = [{ time: event.timeStamp, x: this.state.x, y: this.state.y }]
    window.addEventListener('pointermove', this.handlePointerMove)
    window.addEventListener('pointerup', this.handlePointerUp)
    window.addEventListener('pointercancel', this.handlePointerUp)
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return
    const dx = event.clientX - this.startClientX
    const dy = event.clientY - this.startClientY

    if (!this.state.isDragging) {
      const axis = this.options.axis ?? 'both'
      const along =
        axis === 'x'
          ? Math.abs(dx)
          : axis === 'y'
            ? Math.abs(dy)
            : Math.hypot(dx, dy)
      const across =
        axis === 'x' ? Math.abs(dy) : axis === 'y' ? Math.abs(dx) : 0
      if (Math.max(along, across) < (this.options.threshold ?? 4)) return
      // The pointer set off along the other axis: leave it to scrolling.
      if (across > along) {
        this.endPress()
        return
      }
      if (
        this.options.canStart &&
        !this.options.canStart({ deltaX: dx, deltaY: dy, event })
      ) {
        this.endPress()
        return
      }
      this.begin(event)
    }

    const axis = this.options.axis ?? 'both'
    const x =
      axis === 'y' ? this.originX : this.constrain(this.originX + dx, 'x')
    const y =
      axis === 'x' ? this.originY : this.constrain(this.originY + dy, 'y')
    this.state.deltaX = x - this.originX
    this.state.deltaY = y - this.originY
    this.setOffset(x, y)
    this.samples.push({ time: event.timeStamp, x, y })
    this.trimSamples(event.timeStamp)
    this.options.onMove?.(this.state)
  }

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return
    const wasDragging = this.state.isDragging
    if (wasDragging) {
      this.measureVelocity(
        event.type === 'pointercancel' ? null : event.timeStamp,
      )
      this.suppressNextClick()
    }
    this.endPress()
    if (!wasDragging) return

    this.state.isDragging = false
    const release = this.options.release ?? (() => ({ x: 0, y: 0 }))
    const target = release(this.state) ?? {
      x: this.clampToBounds(this.state.x, 'x'),
      y: this.clampToBounds(this.state.y, 'y'),
    }
    this.options.onEnd?.(this.state, target)
    this.host.requestUpdate()
    void this.animateTo(target, {
      x: this.state.velocityX,
      y: this.state.velocityY,
    })
  }

  private readonly swallowClick = (event: Event): void => {
    event.preventDefault()
    event.stopPropagation()
  }

  private readonly preventSelection = (event: Event): void => {
    if (this.state.isDragging) event.preventDefault()
  }

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: DragControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    this.host.addController(this)
  }

  public hostConnected(): void {
    this.host.addEventListener('pointerdown', this.handlePointerDown)
    this.applyTouchAction()
  }

  public hostUpdated(): void {
    this.applyTouchAction()
  }

  public hostDisconnected(): void {
    this.host.removeEventListener('pointerdown', this.handlePointerDown)
    this.endPress()
    this.state.isDragging = false
    this.stopSprings()
  }

  /**
   * Springs the offset to `point`, carrying `velocity` (pixels per second) into
   * the motion. Resolves when it comes to rest, or when a new drag or call
   * cuts it short. Under reduced motion it jumps.
   */
  public animateTo(
    point: DragPoint,
    velocity: Partial<DragPoint> = {},
  ): Promise<void> {
    this.stopSprings()
    const axis = this.options.axis ?? 'both'
    const x = axis === 'y' ? this.state.x : point.x
    const y = axis === 'x' ? this.state.y : point.y
    if (prefersReducedMotion() || (x === this.state.x && y === this.state.y)) {
      this.jumpTo({ x, y })
      this.options.onSettle?.(this.state)
      return Promise.resolve()
    }

    const spring = {
      ...DEFAULT_SPRING,
      ...this.options.spring,
      type: 'spring' as const,
    }
    const springs: AnimationPlaybackControls[] = []
    if (x !== this.state.x) {
      springs.push(
        animate(this.state.x, x, {
          ...spring,
          velocity: velocity.x ?? 0,
          onUpdate: (latest: number) => this.setOffset(latest, this.state.y),
        }),
      )
    }
    if (y !== this.state.y) {
      springs.push(
        animate(this.state.y, y, {
          ...spring,
          velocity: velocity.y ?? 0,
          onUpdate: (latest: number) => this.setOffset(this.state.x, latest),
        }),
      )
    }
    this.springs = springs
    return new Promise<void>((resolve) => {
      this.resolveSprings = resolve
      Promise.all(springs.map((s) => s.finished)).then(
        () => {
          if (this.springs !== springs) return
          this.springs = []
          this.resolveSprings = null
          this.setOffset(x, y)
          this.options.onSettle?.(this.state)
          resolve()
        },
        () => {},
      )
    })
  }

  /** Moves the offset to `point` at once, stopping any spring. */
  public jumpTo(point: DragPoint): void {
    this.stopSprings()
    this.setOffset(point.x, point.y)
  }

  /** The names of the variables this controller writes. */
  public get properties(): { x: string; y: string } {
    const prefix = this.options.prefix ?? '--drag'
    return { x: `${prefix}-x`, y: `${prefix}-y` }
  }

  private begin(event: PointerEvent): void {
    this.state.isDragging = true
    this.state.deltaX = 0
    this.state.deltaY = 0
    this.bounds = this.options.bounds?.() ?? {}
    const handle = this.resolveHandle()
    try {
      handle?.setPointerCapture?.(event.pointerId)
      this.captured = handle
    } catch {
      // The pointer is already gone; window listeners still see the rest.
    }
    window.getSelection?.()?.removeAllRanges()
    document.addEventListener('selectstart', this.preventSelection)
    this.options.onStart?.(this.state)
    this.host.requestUpdate()
  }

  /** Clears the press, whether or not it turned into a drag. */
  private endPress(): void {
    if (this.captured && this.pointerId !== null) {
      try {
        this.captured.releasePointerCapture?.(this.pointerId)
      } catch {
        // Capture already ended with the pointer.
      }
    }
    this.captured = null
    this.pointerId = null
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.handlePointerMove)
      window.removeEventListener('pointerup', this.handlePointerUp)
      window.removeEventListener('pointercancel', this.handlePointerUp)
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('selectstart', this.preventSelection)
    }
  }

  private constrain(value: number, axis: 'x' | 'y'): number {
    const min = axis === 'x' ? this.bounds.left : this.bounds.top
    const max = axis === 'x' ? this.bounds.right : this.bounds.bottom
    const elastic = Math.min(1, Math.max(0, this.options.elastic ?? 0.35))
    if (min !== undefined && value < min) return min + (value - min) * elastic
    if (max !== undefined && value > max) return max + (value - max) * elastic
    return value
  }

  private clampToBounds(value: number, axis: 'x' | 'y'): number {
    const min = axis === 'x' ? this.bounds.left : this.bounds.top
    const max = axis === 'x' ? this.bounds.right : this.bounds.bottom
    if (min !== undefined && value < min) return min
    if (max !== undefined && value > max) return max
    return value
  }

  private trimSamples(now: number): void {
    while (
      this.samples.length > 2 &&
      now - this.samples[0].time > VELOCITY_WINDOW_MS
    ) {
      this.samples.shift()
    }
  }

  /** Velocity from the samples in the last window; a pointer held still before release reads as 0. */
  private measureVelocity(releaseTime: number | null): void {
    this.state.velocityX = 0
    this.state.velocityY = 0
    if (releaseTime === null) return
    const recent = this.samples.filter(
      (sample) => releaseTime - sample.time <= VELOCITY_WINDOW_MS,
    )
    if (recent.length < 2) return
    const first = recent[0]
    const last = recent[recent.length - 1]
    const elapsed = last.time - first.time
    if (elapsed <= 0) return
    this.state.velocityX = ((last.x - first.x) / elapsed) * 1000
    this.state.velocityY = ((last.y - first.y) / elapsed) * 1000
  }

  /** The click that ends a drag would otherwise follow a link or press a button under the pointer. */
  private suppressNextClick(): void {
    window.addEventListener('click', this.swallowClick, {
      capture: true,
      once: true,
    })
    // Not every drag ends in a click (the pointer may be released elsewhere).
    setTimeout(() => {
      window.removeEventListener('click', this.swallowClick, { capture: true })
    }, 0)
  }

  private setOffset(x: number, y: number): void {
    this.state.x = x
    this.state.y = y
    const target = this.options.styleTarget?.() ?? this.host
    const names = this.properties
    target.style.setProperty(names.x, `${round(x)}px`)
    target.style.setProperty(names.y, `${round(y)}px`)
  }

  private stopSprings(): void {
    for (const spring of this.springs) spring.stop()
    this.springs = []
    const resolve = this.resolveSprings
    this.resolveSprings = null
    resolve?.()
  }

  private resolveHandle(): HTMLElement | null {
    return this.options.handle ? this.options.handle() : this.host
  }

  /**
   * Tells the browser which gestures stay with the page: on a single-axis
   * drag the other axis still scrolls. Skipped when the element's own styles
   * already set `touch-action`.
   */
  private applyTouchAction(): void {
    const handle = this.resolveHandle()
    if (!handle || handle === this.touchActionHandle) return
    this.touchActionHandle = handle
    if (handle.style.touchAction) return
    if (typeof getComputedStyle === 'function') {
      const current = getComputedStyle(handle).touchAction
      if (current && current !== 'auto') return
    }
    const axis = this.options.axis ?? 'both'
    handle.style.touchAction =
      axis === 'x' ? 'pan-y' : axis === 'y' ? 'pan-x' : 'none'
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
