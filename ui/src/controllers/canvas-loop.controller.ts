import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { prefersReducedMotion, watchReducedMotion } from '../utils/motion'

export type CanvasContextKind = '2d' | 'webgl' | 'webgl2' | 'none'

interface ContextMap {
  '2d': CanvasRenderingContext2D
  webgl: WebGLRenderingContext
  webgl2: WebGL2RenderingContext
  none: null
}

export interface CanvasFrame<K extends CanvasContextKind = '2d'> {
  canvas: HTMLCanvasElement
  /** The drawing context; null for `none`, or when the browser refused one (WebGL turned off). */
  context: ContextMap[K] | null
  /** Drawing size in CSS pixels. A `2d` context is already scaled, so draw in these units. */
  width: number
  height: number
  /** Device pixels per CSS pixel actually used, after `maxPixelRatio`. */
  pixelRatio: number
  /** Milliseconds the loop has run, not counting time paused. 0 on a still frame. */
  time: number
  /** Milliseconds since the previous frame, at most 100 so a long pause does not fling a simulation. */
  delta: number
  /** Frames drawn since the loop started. */
  frame: number
}

export interface CanvasLoopControllerOptions<
  K extends CanvasContextKind = '2d',
> {
  /** The canvas to draw on, usually in the host's shadow root. Resolved after each update until found. */
  canvas: () => HTMLCanvasElement | null
  /** Context to create. Defaults to `2d`; `none` leaves the canvas to a library that makes its own. */
  context?: K
  /** Passed to `getContext`, e.g. `{ alpha: false }`. */
  contextAttributes?: CanvasRenderingContext2DSettings | WebGLContextAttributes
  /** Draws one frame. */
  draw: (frame: CanvasFrame<K>) => void
  /** Called after the canvas is resized, before the next draw: rebuild size-dependent state here. */
  resize?: (frame: CanvasFrame<K>) => void
  /** Upper limit on the pixel ratio, to bound the cost on dense screens. Defaults to 2. */
  maxPixelRatio?: number
  /** Frames per second to aim for; frames in between are skipped. Defaults to the display's rate. */
  fps?: number
  /**
   * What to do when the user asks for reduced motion. `still` (default)
   * draws a single frame at time 0 and stops; `run` keeps animating, for
   * loops whose movement is the point of the element and is user-driven.
   */
  reducedMotion?: 'still' | 'run'
  /** Start looping as soon as the canvas is ready. Defaults to true. */
  autoStart?: boolean
}

const MAX_DELTA_MS = 100

/**
 * Runs a `requestAnimationFrame` drawing loop for a canvas and takes care of
 * the parts every canvas effect needs:
 *
 * - **Pixel ratio.** The backing store matches the screen's density, capped
 *   by `maxPixelRatio`, and follows the window between screens.
 * - **Resize.** A `ResizeObserver` keeps the canvas sharp at any size.
 * - **Pausing.** The loop stops while the tab is hidden or the canvas is
 *   scrolled off screen, and picks up where it left off.
 * - **Reduced motion.** By default a single still frame is drawn instead.
 *
 * Give the canvas its size in CSS (`width: 100%; height: 100%`); the
 * controller only sets its backing store.
 */
export class CanvasLoopController<K extends CanvasContextKind = '2d'>
  implements ReactiveController
{
  public width = 0
  public height = 0
  public pixelRatio = 1
  public context: ContextMap[K] | null = null

  private readonly host: ReactiveControllerHost & HTMLElement
  private readonly options: CanvasLoopControllerOptions<K>
  private canvas: HTMLCanvasElement | null = null
  private wantsToRun: boolean
  private isConnected = false
  private isPageVisible = true
  private isOnScreen = true
  private isReduced = false
  private frameId = 0
  private time = 0
  private frameCount = 0
  private lastTimestamp: number | null = null
  private lastDrawn = 0
  private resizeObserver: ResizeObserver | null = null
  private intersectionObserver: IntersectionObserver | null = null
  private ratioQuery: MediaQueryList | null = null
  private stopWatchingMotion: (() => void) | null = null

  private readonly handleVisibility = (): void => {
    this.isPageVisible = document.visibilityState !== 'hidden'
    this.update()
  }

  private readonly handleRatioChange = (): void => {
    this.watchPixelRatio()
    this.measure()
  }

  private readonly tick = (timestamp: number): void => {
    this.frameId = 0
    if (!this.shouldLoop()) return
    this.frameId = requestAnimationFrame(this.tick)

    const fps = this.options.fps
    if (fps && this.lastTimestamp !== null) {
      // Allow a millisecond of jitter so 60 Hz does not drop to 30 when aiming for 60.
      if (timestamp - this.lastDrawn < 1000 / fps - 1) return
    }
    const delta =
      this.lastTimestamp === null
        ? 0
        : Math.min(MAX_DELTA_MS, timestamp - this.lastTimestamp)
    this.lastTimestamp = timestamp
    this.lastDrawn = timestamp
    this.time += delta
    this.render(this.time, delta)
  }

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: CanvasLoopControllerOptions<K>,
  ) {
    this.host = host
    this.options = options
    this.wantsToRun = options.autoStart !== false
    this.host.addController(this)
  }

  /** Whether frames are being drawn right now. */
  public get isRunning(): boolean {
    return this.frameId !== 0
  }

  public hostConnected(): void {
    this.isConnected = true
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      this.update()
    })
    if (typeof document !== 'undefined') {
      this.isPageVisible = document.visibilityState !== 'hidden'
      document.addEventListener('visibilitychange', this.handleVisibility)
    }
    this.attach()
  }

  public hostUpdated(): void {
    if (!this.canvas) this.attach()
  }

  public hostDisconnected(): void {
    this.isConnected = false
    this.stopLoop()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibility)
    }
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.intersectionObserver?.disconnect()
    this.intersectionObserver = null
    this.ratioQuery?.removeEventListener?.('change', this.handleRatioChange)
    this.ratioQuery = null
    // The canvas may be re-rendered by the time the host reconnects.
    this.canvas = null
    this.context = null
  }

  /** Starts (or resumes) the loop. It still waits while the page is hidden or the canvas off screen. */
  public start(): void {
    this.wantsToRun = true
    this.update()
  }

  /** Stops the loop; the last frame stays on the canvas. */
  public stop(): void {
    this.wantsToRun = false
    this.stopLoop()
  }

  /** Draws one frame now, for content that changed while the loop is stopped. */
  public drawOnce(): void {
    this.render(this.isReduced && this.isStill ? 0 : this.time, 0)
  }

  private get isStill(): boolean {
    return (this.options.reducedMotion ?? 'still') === 'still'
  }

  private attach(): void {
    const canvas = this.options.canvas()
    if (!canvas) return
    this.canvas = canvas
    const kind = this.options.context ?? '2d'
    this.context =
      kind === 'none'
        ? null
        : ((canvas.getContext(kind, this.options.contextAttributes) ?? null) as
            | ContextMap[K]
            | null)

    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(() => this.measure())
      this.resizeObserver.observe(canvas)
    }
    if (typeof IntersectionObserver === 'function') {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1]
        if (!entry) return
        this.isOnScreen = entry.isIntersecting
        this.update()
      })
      this.intersectionObserver.observe(canvas)
    }
    this.watchPixelRatio()
    this.measure()
  }

  /** Listens for the next change of `devicePixelRatio`, e.g. the window moving to another screen. */
  private watchPixelRatio(): void {
    this.ratioQuery?.removeEventListener?.('change', this.handleRatioChange)
    this.ratioQuery = null
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    )
      return
    const query = window.matchMedia(
      `(resolution: ${window.devicePixelRatio || 1}dppx)`,
    )
    query.addEventListener?.('change', this.handleRatioChange)
    this.ratioQuery = query
  }

  private measure(): void {
    const canvas = this.canvas
    if (!canvas) return
    const box = canvas.getBoundingClientRect()
    const ratio = Math.min(
      typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1,
      this.options.maxPixelRatio ?? 2,
    )
    const backingWidth = Math.max(1, Math.round(box.width * ratio))
    const backingHeight = Math.max(1, Math.round(box.height * ratio))
    const changed =
      box.width !== this.width ||
      box.height !== this.height ||
      ratio !== this.pixelRatio ||
      canvas.width !== backingWidth ||
      canvas.height !== backingHeight
    this.width = box.width
    this.height = box.height
    this.pixelRatio = ratio
    if (!changed) {
      this.update()
      return
    }

    // Assigning width or height clears the canvas and resets the 2D transform.
    canvas.width = backingWidth
    canvas.height = backingHeight
    if ((this.options.context ?? '2d') === '2d') {
      ;(this.context as CanvasRenderingContext2D | null)?.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0,
      )
    }
    this.options.resize?.(this.frame(this.time, 0))
    // Clearing left the canvas blank: repaint now rather than on the next frame,
    // and always when the loop is not running (paused, still, or stopped).
    if (this.width > 0 && this.height > 0) this.drawOnce()
    this.update()
  }

  private shouldLoop(): boolean {
    return (
      this.isConnected &&
      this.wantsToRun &&
      this.canvas !== null &&
      this.isPageVisible &&
      this.isOnScreen &&
      this.width > 0 &&
      this.height > 0 &&
      !(this.isReduced && this.isStill)
    )
  }

  /** Starts or stops the frame loop to match the current conditions. */
  private update(): void {
    if (this.shouldLoop()) {
      if (!this.frameId && typeof requestAnimationFrame === 'function') {
        this.lastTimestamp = null
        this.frameId = requestAnimationFrame(this.tick)
      }
      return
    }
    const wasRunning = this.frameId !== 0
    this.stopLoop()
    // Turning reduced motion on mid-way swaps the moving frame for the still one.
    if (wasRunning && this.isReduced && this.isStill) this.drawOnce()
  }

  private stopLoop(): void {
    if (this.frameId) cancelAnimationFrame(this.frameId)
    this.frameId = 0
    this.lastTimestamp = null
  }

  private render(time: number, delta: number): void {
    if (!this.canvas || this.width <= 0 || this.height <= 0) return
    this.options.draw(this.frame(time, delta))
    this.frameCount += 1
  }

  private frame(time: number, delta: number): CanvasFrame<K> {
    return {
      canvas: this.canvas as HTMLCanvasElement,
      context: this.context,
      width: this.width,
      height: this.height,
      pixelRatio: this.pixelRatio,
      time,
      delta,
      frame: this.frameCount,
    }
  }
}
