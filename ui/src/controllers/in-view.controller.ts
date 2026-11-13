import type { ReactiveController, ReactiveControllerHost } from 'lit'

export interface InViewControllerOptions {
  /**
   * Element whose visibility is tracked. Defaults to the host. Resolved when
   * the host connects and after each update, so it can be a shadow-root element.
   */
  target?: () => Element | null
  /** Scroll container used as the viewport. Defaults to the browser viewport. */
  root?: () => Element | null
  /** Grows or shrinks the viewport, as in `IntersectionObserver`. Defaults to `0px`. */
  rootMargin?: string
  /** Share of the target, 0 to 1, that must be visible to count as in view. Defaults to 0 (any part). */
  threshold?: number
  /** Stop watching after the first entry, for effects that play once. Defaults to false. */
  once?: boolean
  /**
   * Pause the animations running on the host and in its shadow root while
   * the target is out of view, and resume them when it returns. Defaults to true.
   */
  pauseOffscreen?: boolean
  /** Called each time the target enters or leaves the view. */
  onChange?: (
    isInView: boolean,
    entry: IntersectionObserverEntry | null,
  ) => void
}

/**
 * Tracks whether an element is on screen, so an effect can start when the
 * reader reaches it and stop costing frames once it scrolls away.
 *
 * `isInView` follows the element in and out; `hasEntered` turns true on the
 * first entry and stays true, which suits reveal-once effects. Each change
 * re-renders the host. Where `IntersectionObserver` is missing (server
 * rendering, very old browsers) the element counts as in view at once, so
 * content that waits for entry is never left hidden.
 */
export class InViewController implements ReactiveController {
  public isInView = false
  public hasEntered = false

  private readonly host: ReactiveControllerHost & HTMLElement
  private readonly options: InViewControllerOptions
  private observer: IntersectionObserver | null = null
  private observed: Element | null = null
  private readonly paused = new Set<Animation>()
  private hasReported = false

  private readonly handleEntries = (
    entries: IntersectionObserverEntry[],
  ): void => {
    // Only the latest record matters when several queue up in one task.
    const entry = entries[entries.length - 1]
    if (!entry) return
    const threshold = this.options.threshold ?? 0
    const isInView =
      entry.isIntersecting &&
      (threshold === 0 || entry.intersectionRatio >= threshold)
    this.apply(isInView, entry)
  }

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: InViewControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    this.host.addController(this)
  }

  public hostConnected(): void {
    this.observe()
  }

  public hostUpdated(): void {
    if (!this.observed && !(this.options.once && this.hasEntered)) {
      this.observe()
    }
  }

  public hostDisconnected(): void {
    this.observer?.disconnect()
    this.observer = null
    this.observed = null
    this.hasReported = false
    // A disconnected element should not keep animations paused if it is moved and reconnected.
    this.resumeAnimations()
  }

  private observe(): void {
    const target = this.options.target ? this.options.target() : this.host
    if (!target) return
    if (typeof IntersectionObserver !== 'function') {
      this.observed = target
      this.apply(true, null)
      return
    }
    const threshold = this.options.threshold ?? 0
    this.observer = new IntersectionObserver(this.handleEntries, {
      root: this.options.root?.() ?? null,
      rootMargin: this.options.rootMargin ?? '0px',
      threshold: threshold > 0 ? [0, threshold] : 0,
    })
    this.observer.observe(target)
    this.observed = target
  }

  private apply(
    isInView: boolean,
    entry: IntersectionObserverEntry | null,
  ): void {
    // The first report counts even though `isInView` starts false: an element
    // that starts off screen must have its animations paused from the outset.
    const isFirstReport = !this.hasReported
    this.hasReported = true
    const changed = isInView !== this.isInView
    if (!changed && !isFirstReport) return
    this.isInView = isInView
    if (isInView) this.hasEntered = true

    if (this.options.pauseOffscreen !== false) {
      if (isInView) this.resumeAnimations()
      else this.pauseAnimations()
    }
    if (isInView && this.options.once) {
      this.observer?.disconnect()
      this.observer = null
    }
    if (!changed) return
    this.options.onChange?.(isInView, entry)
    this.host.requestUpdate()
  }

  private pauseAnimations(): void {
    for (const animation of this.runningAnimations()) {
      animation.pause()
      this.paused.add(animation)
    }
  }

  /** Resumes only what this controller paused, so animations the element paused itself stay paused. */
  private resumeAnimations(): void {
    for (const animation of this.paused) {
      if (animation.playState === 'paused') animation.play()
    }
    this.paused.clear()
  }

  private runningAnimations(): Animation[] {
    const found = new Set<Animation>()
    const collect = (list: Animation[] | undefined) => {
      for (const animation of list ?? []) {
        if (animation.playState === 'running') found.add(animation)
      }
    }
    collect(this.host.getAnimations?.({ subtree: true }))
    collect(this.host.shadowRoot?.getAnimations?.())
    return [...found]
  }
}
