import {
  css,
  html,
  nothing,
  type ReactiveController,
  type ReactiveControllerHost,
  type SVGTemplateResult,
  svg,
  type TemplateResult,
} from 'lit'
import { prefersReducedMotion, watchReducedMotion } from './motion'

/**
 * Pieces shared by `moul-carousel` and `moul-image-slider`: the autoplay
 * timer and when it holds, the slide labels, the keyboard map, the dots and
 * the control icons.
 */

export interface SlideControls {
  arrows: boolean
  dots: boolean
}

/**
 * Reads a `controls` token list such as `arrows dots`. `none`, or a list
 * with no known token, shows neither; a missing value shows both.
 */
export function parseControls(value: string | null | undefined): SlideControls {
  if (value === null || value === undefined) return { arrows: true, dots: true }
  const tokens = new Set(value.toLowerCase().split(/\s+/).filter(Boolean))
  return { arrows: tokens.has('arrows'), dots: tokens.has('dots') }
}

export type SlideIntent = 'next' | 'previous' | 'first' | 'last'

/**
 * What a key press asks a slide set to do. Left and right follow the
 * reading direction, so in right-to-left text the left arrow goes forward.
 * Keys with a modifier are left alone.
 */
export function slideIntent(
  event: KeyboardEvent,
  isRtl: boolean,
): SlideIntent | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null
  switch (event.key) {
    case 'ArrowRight':
      return isRtl ? 'previous' : 'next'
    case 'ArrowLeft':
      return isRtl ? 'next' : 'previous'
    case 'Home':
      return 'first'
    case 'End':
      return 'last'
    default:
      return null
  }
}

/**
 * Whether the element is laid out right to left: by `:dir()`, by the nearest
 * `dir` attribute, or by a `direction` set in CSS.
 */
export function isRtl(element: Element): boolean {
  try {
    if (element.matches(':dir(rtl)')) return true
  } catch {
    // Engines without :dir() fall through to the attribute and the style.
  }
  if (element.closest('[dir]')?.getAttribute('dir')?.toLowerCase() === 'rtl') {
    return true
  }
  return (
    typeof getComputedStyle === 'function' &&
    getComputedStyle(element).direction === 'rtl'
  )
}

/** `index` kept inside `0 … count - 1`, wrapping round when `wrap` is true. */
export function normalizeIndex(
  index: number,
  count: number,
  wrap: boolean,
): number {
  if (count <= 0) return 0
  const whole = Number.isFinite(index) ? Math.round(index) : 0
  if (wrap) return ((whole % count) + count) % count
  return Math.min(count - 1, Math.max(0, whole))
}

const SLIDE_LABEL_MARK = 'data-moul-slide-label'

/**
 * Gives each slide the group role and an "N of M" name, unless the author
 * named it already, and takes them back from elements that are no longer
 * slides. Slides `skip` returns true for keep their own role (an `<img>`
 * stays an image named by its `alt`) but still count. Returns the slides it
 * touched, to pass in next time.
 */
export function labelSlides(
  slides: readonly HTMLElement[],
  previous: ReadonlySet<HTMLElement> = new Set(),
  skip: (slide: HTMLElement) => boolean = () => false,
): Set<HTMLElement> {
  const labelled = new Set<HTMLElement>()
  const current = new Set(slides)
  for (const slide of previous) {
    if (!current.has(slide)) unlabelSlide(slide)
  }
  slides.forEach((slide, index) => {
    if (skip(slide)) {
      unlabelSlide(slide)
      return
    }
    const isOurs = slide.hasAttribute(SLIDE_LABEL_MARK)
    const hasOwnName =
      !isOurs &&
      (slide.hasAttribute('aria-label') ||
        slide.hasAttribute('aria-labelledby'))
    if (!slide.hasAttribute('role')) {
      slide.setAttribute('role', 'group')
      slide.setAttribute(`${SLIDE_LABEL_MARK}-role`, '')
    }
    if (!slide.hasAttribute('aria-roledescription')) {
      slide.setAttribute('aria-roledescription', 'slide')
      slide.setAttribute(`${SLIDE_LABEL_MARK}-description`, '')
    }
    labelled.add(slide)
    if (hasOwnName) return
    slide.setAttribute('aria-label', `${index + 1} of ${slides.length}`)
    slide.setAttribute(SLIDE_LABEL_MARK, '')
  })
  return labelled
}

/** Removes what `labelSlides` added to an element. */
export function unlabelSlide(slide: HTMLElement): void {
  if (slide.hasAttribute(SLIDE_LABEL_MARK)) {
    slide.removeAttribute('aria-label')
    slide.removeAttribute(SLIDE_LABEL_MARK)
  }
  if (slide.hasAttribute(`${SLIDE_LABEL_MARK}-role`)) {
    slide.removeAttribute('role')
    slide.removeAttribute(`${SLIDE_LABEL_MARK}-role`)
  }
  if (slide.hasAttribute(`${SLIDE_LABEL_MARK}-description`)) {
    slide.removeAttribute('aria-roledescription')
    slide.removeAttribute(`${SLIDE_LABEL_MARK}-description`)
  }
}

const HIDDEN_MARK = 'data-moul-slide-hidden'

/**
 * Hides a slide from focus and assistive technology with `inert`, or shows
 * it again. Only an `inert` this helper set is ever removed, so an author's
 * own stays.
 */
export function setSlideHidden(slide: HTMLElement, isHidden: boolean): void {
  if (isHidden) {
    if (slide.hasAttribute('inert')) return
    slide.setAttribute('inert', '')
    slide.setAttribute(HIDDEN_MARK, '')
  } else if (slide.hasAttribute(HIDDEN_MARK)) {
    slide.removeAttribute('inert')
    slide.removeAttribute(HIDDEN_MARK)
  }
}

/** The elements assigned to a slot, children of nested slots included. */
export function slottedElements(slot: HTMLSlotElement | null): HTMLElement[] {
  if (!slot) return []
  return slot
    .assignedElements({ flatten: true })
    .filter((node): node is HTMLElement => 'style' in node)
}

export interface AutoplayControllerOptions {
  /** Milliseconds between slides; 0 or less turns autoplay off. */
  interval: () => number
  /** Called each time the interval runs out while autoplay is running. */
  onAdvance: () => void
  /**
   * Whether `element`, the first element in the focus event's path, is the
   * play button. Focus there does not hold the timer, so pressing play
   * starts it at once.
   */
  isPlayButton?: (element: EventTarget | undefined) => boolean
  /** Called when `isRunning` changes. */
  onRunningChange?: (isRunning: boolean) => void
}

/**
 * Advances a slide set on a timer, the way the APG carousel pattern asks:
 * it holds while the pointer is over the host, while focus is inside it
 * (except on the play button), while the host is off screen and while the
 * document is hidden, and stops for good when the reader presses pause.
 * Under reduced motion it never runs. A manual change calls `restart()`, so
 * the next slide never follows a click straight away.
 */
export class AutoplayController implements ReactiveController {
  /** Set by the reader with the pause button; the timer does not run while true. */
  public isPaused = false

  private readonly host: ReactiveControllerHost & HTMLElement
  private readonly options: AutoplayControllerOptions
  private timer: ReturnType<typeof setTimeout> | null = null
  private isHovered = false
  private hasFocus = false
  private isInView = true
  private isReduced = false
  private observer: IntersectionObserver | null = null
  private stopWatchingMotion: (() => void) | null = null
  private wasRunning = false

  private readonly handlePointerEnter = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return
    this.isHovered = true
    this.sync()
  }

  private readonly handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return
    this.isHovered = false
    this.sync()
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const origin = event.composedPath()[0]
    this.hasFocus = !this.options.isPlayButton?.(origin)
    this.sync()
  }

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null
    if (next && (next === this.host || this.host.contains(next))) return
    this.hasFocus = false
    this.sync()
  }

  private readonly handleVisibility = (): void => {
    this.sync()
  }

  private readonly tick = (): void => {
    this.timer = null
    if (!this.isRunning) return
    this.options.onAdvance()
    this.sync()
  }

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: AutoplayControllerOptions,
  ) {
    this.host = host
    this.options = options
    this.host.addController(this)
  }

  /** Autoplay is asked for and motion is allowed. */
  public get isEnabled(): boolean {
    return this.options.interval() > 0 && !this.isReduced
  }

  /** The timer is counting down now. */
  public get isRunning(): boolean {
    return (
      this.isEnabled &&
      !this.isPaused &&
      !this.isHovered &&
      !this.hasFocus &&
      this.isInView &&
      !(
        typeof document !== 'undefined' && document.visibilityState === 'hidden'
      )
    )
  }

  public hostConnected(): void {
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      this.sync()
      this.host.requestUpdate()
    })
    this.host.addEventListener('pointerenter', this.handlePointerEnter)
    this.host.addEventListener('pointerleave', this.handlePointerLeave)
    this.host.addEventListener('focusin', this.handleFocusIn)
    this.host.addEventListener('focusout', this.handleFocusOut)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibility)
    }
    if (typeof IntersectionObserver === 'function') {
      this.observer = new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1]
        if (!entry) return
        this.isInView = entry.isIntersecting
        this.sync()
      })
      this.observer.observe(this.host)
    }
    this.sync()
  }

  public hostUpdated(): void {
    // The interval may have been switched on, off or changed.
    this.sync()
  }

  public hostDisconnected(): void {
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.host.removeEventListener('pointerenter', this.handlePointerEnter)
    this.host.removeEventListener('pointerleave', this.handlePointerLeave)
    this.host.removeEventListener('focusin', this.handleFocusIn)
    this.host.removeEventListener('focusout', this.handleFocusOut)
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibility)
    }
    this.observer?.disconnect()
    this.observer = null
    this.clear()
    this.isHovered = false
    this.hasFocus = false
    this.isInView = true
    this.wasRunning = false
  }

  /** Pauses or resumes for the reader, as the play button does. */
  public toggle(): void {
    this.isPaused = !this.isPaused
    this.restart()
    this.host.requestUpdate()
  }

  /** Starts the interval again from the top, after a manual change. */
  public restart(): void {
    this.clear()
    this.sync()
  }

  private sync(): void {
    const isRunning = this.isRunning
    if (isRunning && !this.timer) {
      this.timer = setTimeout(this.tick, this.options.interval())
    } else if (!isRunning) {
      this.clear()
    }
    if (isRunning !== this.wasRunning) {
      this.wasRunning = isRunning
      this.options.onRunningChange?.(isRunning)
    }
  }

  private clear(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }
}

const icon = (path: SVGTemplateResult): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    ${path}
  </svg>
`

/** Control icons; the chevrons are flipped in right-to-left text by the element styles. */
export const slideIcons = {
  previous: () => icon(svg`<path d="m15 18-6-6 6-6" />`),
  next: () => icon(svg`<path d="m9 18 6-6-6-6" />`),
  play: () =>
    icon(svg`<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" />`),
  pause: () =>
    icon(
      svg`<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />`,
    ),
}

/** A row of "Go to slide N" buttons, the current one marked with `aria-current`. */
export function renderDots(
  count: number,
  current: number,
  onSelect: (index: number) => void,
): TemplateResult | typeof nothing {
  if (count < 2) return nothing
  return html`<div part="dots" class="dots">
    ${Array.from(
      { length: count },
      (_, index) => html`<button
        type="button"
        part=${index === current ? 'dot dot-current' : 'dot'}
        class="dot"
        aria-label="Go to slide ${index + 1}"
        aria-current=${index === current ? 'true' : 'false'}
        @click=${() => onSelect(index)}
      ></button>`,
    )}
  </div>`
}

/** Hides text visually while keeping it for screen readers. */
export const visuallyHiddenStyles = css`
  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
`

/**
 * The look shared by the slide controls: round buttons and pill-shaped dots.
 * Each element sets the private colours (`--_control-bg`, `--_control-fg`,
 * `--_control-border`, `--_control-hover-bg`, `--_dot-color`,
 * `--_dot-current-color`) for where its controls sit.
 */
export const slideControlStyles = css`
  .control {
    display: inline-grid;
    place-items: center;
    flex: none;
    inline-size: var(--_control-size, 2.25rem);
    block-size: var(--_control-size, 2.25rem);
    margin: 0;
    padding: 0;
    border: 1px solid var(--_control-border, var(--color-border));
    border-radius: var(--radius-full, 9999px);
    background: var(--_control-bg, var(--color-surface));
    color: var(--_control-fg, var(--color-fg));
    font: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color var(--duration-fast, 150ms) var(--ease-out, ease-out),
      opacity var(--duration-fast, 150ms) var(--ease-out, ease-out),
      scale var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  .control svg {
    inline-size: 1.125rem;
    block-size: 1.125rem;
  }

  @media (hover: hover) {
    .control:hover:not([aria-disabled='true']) {
      background: var(--_control-hover-bg, var(--color-surface-hover));
    }
  }

  .control:active:not([aria-disabled='true']) {
    scale: 0.94;
  }

  .control:focus-visible {
    outline: none;
  }

  .control[aria-disabled='true'] {
    opacity: 0.4;
    cursor: default;
  }

  /* Chevrons point the way the slides travel. */
  :host(:dir(rtl)) .arrow svg {
    scale: -1 1;
  }

  .dots {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  /* A 24px-tall target round a small visible pill; the current one is longer. */
  .dot {
    position: relative;
    flex: none;
    inline-size: 1.5rem;
    block-size: 1.5rem;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--radius-full, 9999px);
    background: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: inline-size var(--duration-base, 250ms) var(--ease-out, ease-out);
  }

  .dot::before {
    content: '';
    position: absolute;
    inset-block: calc(50% - 0.25rem);
    inset-inline: 0.5rem;
    border-radius: inherit;
    background: var(--_dot-color, var(--color-fill-track-strong));
    transition: background-color var(--duration-base, 250ms)
      var(--ease-out, ease-out);
  }

  .dot[aria-current='true'] {
    inline-size: 2.5rem;
  }

  .dot[aria-current='true']::before {
    background: var(--_dot-current-color, var(--color-fg));
  }

  .dot:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  @media (prefers-reduced-motion: reduce) {
    .control,
    .dot,
    .dot::before {
      transition: none;
    }

    .control:active:not([aria-disabled='true']) {
      scale: none;
    }
  }

  @media (forced-colors: active) {
    .dot::before {
      background: CanvasText;
    }

    .dot[aria-current='true']::before {
      background: Highlight;
    }
  }
`
