import type { ReactiveController, ReactiveControllerHost } from 'lit'

/** `forward` is down on the block axis and toward the end of the line on the inline axis. */
export type ScrollDirection = 'forward' | 'backward' | null

export interface ScrollState {
  /** 0 to 1 along the timeline. */
  progress: number
  /** Distance scrolled from the start of the source, in CSS pixels. */
  offset: number
  /** The way the reader last scrolled by more than `directionThreshold`, or null before that. */
  direction: ScrollDirection
  /** Signed scroll speed in pixels per second; 0 once scrolling stops. */
  velocity: number
}

export interface ScrollControllerOptions {
  /**
   * Scroll container. Defaults to the page. Resolved when the host connects
   * and after each update, so it can be an ancestor or a shadow-root element.
   */
  source?: () => Element | null
  /**
   * What progress measures. `scroll` (default): how far the source is
   * scrolled, 0 at the start and 1 at the end. `view`: how far the subject
   * has travelled through the source's visible area, 0 as its leading edge
   * comes into view and 1 as its trailing edge leaves.
   */
  timeline?: 'scroll' | 'view'
  /** Element a `view` timeline follows. Defaults to the host. */
  subject?: () => Element | null
  /** `block` (default) for vertical scrolling in horizontal writing, `inline` for sideways. */
  axis?: 'block' | 'inline'
  /** CSS variable that receives the progress. Defaults to `--scroll-progress`. */
  property?: string
  /** Element that receives the variable. Defaults to the host. */
  styleTarget?: () => HTMLElement | null
  /**
   * Track direction and velocity. These need a scroll listener even where
   * the browser drives progress natively, so they are off unless asked for.
   * Defaults to false; true when `onScroll` is given.
   */
  trackDirection?: boolean
  /** Pixels the reader must travel before `direction` flips. Defaults to 8. */
  directionThreshold?: number
  /** Called after each frame in which the source scrolled, and once more when it settles. */
  onScroll?: (state: ScrollState) => void
  /** Use the script fallback even where native scroll timelines exist. Defaults to false. */
  forceFallback?: boolean
}

/** Velocity drops to 0 this long after the last scroll event. */
const SETTLE_MS = 120

const registeredProperties = new Set<string>()

interface TimelineConstructors {
  ScrollTimeline?: new (options: {
    source?: Element | null
    axis?: string
  }) => AnimationTimeline
  ViewTimeline?: new (options: {
    subject?: Element | null
    axis?: string
  }) => AnimationTimeline
}

/**
 * Exposes scroll position as a CSS variable, 0 to 1, so scroll-linked effects
 * (a progress bar, a parallax row, a tracing line) are written once in CSS
 * against `var(--scroll-progress)`:
 *
 * - Where the browser has scroll-driven animations, the variable is animated
 *   by a native `ScrollTimeline` or `ViewTimeline` and no script runs while
 *   the reader scrolls.
 * - Elsewhere a passive scroll listener writes it once per frame.
 *
 * With `trackDirection`, it also reports which way the reader is scrolling
 * and how fast, and re-renders the host when the direction flips (a navbar
 * that hides on the way down). Scrolling is the reader's own movement, so
 * progress keeps updating under reduced motion; effects that add motion of
 * their own should still honour `prefers-reduced-motion` in their styles.
 */
export class ScrollController implements ReactiveController {
  public readonly state: ScrollState = {
    progress: 0,
    offset: 0,
    direction: null,
    velocity: 0,
  }

  private readonly host: ReactiveControllerHost & HTMLElement
  private readonly options: ScrollControllerOptions
  private nativeAnimation: Animation | null = null
  private listenedSource: EventTarget | null = null
  private frame = 0
  private settleTimer: ReturnType<typeof setTimeout> | null = null
  private lastOffset: number | null = null
  private lastTime = 0
  private anchorOffset = 0

  private readonly handleScroll = (): void => {
    if (this.frame || typeof requestAnimationFrame !== 'function') return
    this.frame = requestAnimationFrame(this.flush)
  }

  private readonly flush = (): void => {
    this.frame = 0
    this.measure()
    if (this.settleTimer) clearTimeout(this.settleTimer)
    this.settleTimer = setTimeout(this.settle, SETTLE_MS)
  }

  private readonly settle = (): void => {
    this.settleTimer = null
    if (this.state.velocity === 0) return
    this.state.velocity = 0
    this.options.onScroll?.(this.state)
  }

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: ScrollControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    this.host.addController(this)
  }

  /** Whether progress is driven by a native scroll timeline rather than a script listener. */
  public get isNative(): boolean {
    return this.nativeAnimation !== null
  }

  public hostConnected(): void {
    this.connect()
  }

  public hostUpdated(): void {
    // A source or subject in the shadow root only exists after the first render.
    if (!this.nativeAnimation && !this.listenedSource) this.connect()
  }

  public hostDisconnected(): void {
    this.nativeAnimation?.cancel()
    this.nativeAnimation = null
    this.listenedSource?.removeEventListener('scroll', this.handleScroll)
    this.listenedSource = null
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleScroll)
    }
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
    if (this.settleTimer) clearTimeout(this.settleTimer)
    this.settleTimer = null
    this.lastOffset = null
  }

  private get property(): string {
    return this.options.property ?? '--scroll-progress'
  }

  private get tracksDirection(): boolean {
    return Boolean(this.options.trackDirection || this.options.onScroll)
  }

  private connect(): void {
    if (typeof window === 'undefined') return
    const styleTarget = this.options.styleTarget?.() ?? this.host
    const subject = this.options.subject?.() ?? this.host
    if (!styleTarget || (this.options.timeline === 'view' && !subject)) return

    if (!this.options.forceFallback) {
      this.nativeAnimation = this.startNative(styleTarget, subject)
    }
    if (this.nativeAnimation && !this.tracksDirection) return

    const source = this.scrollSource()
    if (!source) return
    this.listenedSource = source === scrollingElement() ? window : source
    this.listenedSource.addEventListener('scroll', this.handleScroll, {
      passive: true,
    })
    window.addEventListener('resize', this.handleScroll, { passive: true })
    this.measure()
  }

  /** Starts a native timeline-driven animation of the variable, or returns null where there is none. */
  private startNative(
    styleTarget: HTMLElement,
    subject: Element,
  ): Animation | null {
    const timelines = globalThis as unknown as TimelineConstructors
    const isView = this.options.timeline === 'view'
    const Timeline = isView ? timelines.ViewTimeline : timelines.ScrollTimeline
    if (typeof Timeline !== 'function') return null
    if (typeof styleTarget.animate !== 'function') return null
    if (!registerNumberProperty(this.property)) return null

    const axis = this.options.axis ?? 'block'
    try {
      const timeline = isView
        ? new Timeline({ subject, axis })
        : // An explicit null source would leave the timeline inactive.
          new Timeline({ source: this.scrollSource(), axis })
      return styleTarget.animate({ [this.property]: ['0', '1'] }, {
        timeline,
        fill: 'both',
        easing: 'linear',
        ...(isView ? { rangeStart: 'cover 0%', rangeEnd: 'cover 100%' } : {}),
      } as KeyframeAnimationOptions)
    } catch {
      return null
    }
  }

  private scrollSource(): Element | null {
    return this.options.source?.() ?? scrollingElement()
  }

  private measure(): void {
    const source = this.scrollSource()
    if (!source) return
    const isInline = this.options.axis === 'inline'
    const offset = Math.abs(isInline ? source.scrollLeft : source.scrollTop)

    if (this.nativeAnimation) {
      const progress = this.nativeAnimation.effect?.getComputedTiming().progress
      if (typeof progress === 'number') this.state.progress = progress
    } else {
      const progress =
        this.options.timeline === 'view'
          ? this.viewProgress(source, isInline)
          : scrollProgress(source, offset, isInline)
      this.state.progress = progress
      const styleTarget = this.options.styleTarget?.() ?? this.host
      styleTarget?.style.setProperty(this.property, String(round(progress)))
    }

    const now = performance.now()
    if (this.lastOffset !== null && this.tracksDirection) {
      const elapsed = now - this.lastTime
      if (elapsed > 0) {
        this.state.velocity = ((offset - this.lastOffset) / elapsed) * 1000
      }
      this.updateDirection(offset)
    } else {
      this.anchorOffset = offset
    }
    this.state.offset = offset
    this.lastOffset = offset
    this.lastTime = now
    this.options.onScroll?.(this.state)
  }

  private updateDirection(offset: number): void {
    const threshold = this.options.directionThreshold ?? 8
    const travelled = offset - this.anchorOffset
    let next = this.state.direction
    if (travelled > threshold) next = 'forward'
    else if (travelled < -threshold) next = 'backward'
    else return
    // Re-anchor so each flip needs a fresh run of `threshold` pixels.
    this.anchorOffset = offset
    if (next !== this.state.direction) {
      this.state.direction = next
      this.host.requestUpdate()
    }
  }

  private viewProgress(source: Element, isInline: boolean): number {
    const subject = this.options.subject?.() ?? this.host
    if (!subject) return 0
    const box = subject.getBoundingClientRect()
    const isPage = source === scrollingElement()
    const port = isPage
      ? {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        }
      : source.getBoundingClientRect()
    const start = isInline ? box.left - port.left : box.top - port.top
    const size = isInline ? box.width : box.height
    const portSize = isInline ? port.width : port.height
    const travel = portSize + size
    return travel > 0 ? clamp((portSize - start) / travel) : 0
  }
}

/** The element that scrolls the page. */
function scrollingElement(): Element | null {
  if (typeof document === 'undefined') return null
  return document.scrollingElement ?? document.documentElement
}

function scrollProgress(
  source: Element,
  offset: number,
  isInline: boolean,
): number {
  const range = isInline
    ? source.scrollWidth - source.clientWidth
    : source.scrollHeight - source.clientHeight
  return range > 0 ? clamp(offset / range) : 0
}

/**
 * Registers the variable as a `<number>` so a native animation can
 * interpolate it. Returns false where `CSS.registerProperty` is missing.
 */
function registerNumberProperty(name: string): boolean {
  if (registeredProperties.has(name)) return true
  const css = (typeof CSS === 'undefined' ? undefined : CSS) as
    | { registerProperty?: (definition: PropertyDefinition) => void }
    | undefined
  if (typeof css?.registerProperty !== 'function') return false
  try {
    css.registerProperty({
      name,
      syntax: '<number>',
      inherits: true,
      initialValue: '0',
    })
  } catch {
    // Already registered, by this library or by the page: either way it animates.
  }
  registeredProperties.add(name)
  return true
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000
}
