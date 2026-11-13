import { html, LitElement, nothing, svg } from 'lit'
import { DragController } from '../../controllers/drag.controller'
import { defineElement } from '../../utils/define-element'
import '../Spinner/Spinner'
import { pullToRefreshStyles } from './PullToRefresh.styles'

/** The spinner stays at least this long, so a fast refresh does not flash. */
const MIN_REFRESH_MS = 500
/** Presses that start on these keep the pointer for the caret and selection. */
const TEXT_FIELD =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"]'

type Phase = 'idle' | 'pulling' | 'refreshing' | 'done'

export interface PullToRefreshEventDetail {
  /**
   * Keeps the spinner up until `promise` settles. Call it while the event is
   * being dispatched; it may be called more than once.
   */
  waitUntil(promise: PromiseLike<unknown>): void
}

const arrowDown = svg`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </svg>
`

/**
 * A scroll container that refreshes its content when it is pulled down from
 * the top, as in mobile mail and feed apps. While the content is scrolled to
 * its top, a downward pull drags it down with resistance and reveals an arrow
 * that turns as the pull nears `threshold`; letting go past it holds a
 * spinner open, sets `is-refreshing` and fires `refresh`. Pass the work to
 * `event.detail.waitUntil(promise)`: when it settles the content springs back.
 * Touch, pen and mouse all pull; a press that starts on a text field never
 * does. Give the element a height, and its content scrolls inside it.
 *
 * Keyboard and screen readers: pulling is a pointer gesture, so the scroll
 * container starts with a "Refresh" button that is visually hidden until it
 * has focus, like a skip link; pressing it runs `refresh()`, which apps can
 * also call from their own button. A polite live region announces
 * `refreshing-label` and then `done-label`. The arrow, spinner and their
 * text are hidden from screen readers.
 *
 * Reduced motion: the content snaps open and closed instead of springing and
 * the indicator changes colour at once; a pull still follows the pointer, and
 * the spinner uses its own reduced-motion pulse.
 *
 * @slot - The scrollable content.
 *
 * @fires refresh - When a pull is let go past `threshold`, or `refresh()` runs. `detail.waitUntil(promise)` keeps the spinner up until the promise settles.
 *
 * @csspart indicator - The arrow or spinner and its text, filling the gap the pull opens above the content.
 * @csspart scroller - The scroll container, which moves down with the pull.
 * @csspart refresh-button - The focus-revealed "Refresh" button.
 * @csspart content - The wrapper around the slotted content.
 */
export class MoulPullToRefresh extends LitElement {
  static override styles = pullToRefreshStyles

  static override properties = {
    threshold: { type: Number, reflect: true },
    isRefreshing: { type: Boolean, reflect: true, attribute: 'is-refreshing' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    pullLabel: { type: String, attribute: 'pull-label' },
    releaseLabel: { type: String, attribute: 'release-label' },
    refreshingLabel: { type: String, attribute: 'refreshing-label' },
    doneLabel: { type: String, attribute: 'done-label' },
    refreshLabel: { type: String, attribute: 'refresh-label' },
    phase: { state: true },
    isArmed: { state: true },
    announcement: { state: true },
  }

  /** How far, in px, the content must be pulled before letting go refreshes. */
  declare threshold: number
  /** Set while a refresh runs. Read-only: call `refresh()` to start one. */
  declare isRefreshing: boolean
  /** Turns off pulling and the refresh button. */
  declare isDisabled: boolean
  declare pullLabel: string
  declare releaseLabel: string
  declare refreshingLabel: string
  declare doneLabel: string
  /** Text of the focus-revealed button. */
  declare refreshLabel: string
  declare phase: Phase
  declare isArmed: boolean
  declare announcement: string

  private readonly drag: DragController
  private pressOnField = false
  private running: Promise<void> | null = null

  constructor() {
    super()
    this.threshold = 72
    this.isRefreshing = false
    this.isDisabled = false
    this.pullLabel = 'Pull to refresh'
    this.releaseLabel = 'Release to refresh'
    this.refreshingLabel = 'Refreshing…'
    this.doneLabel = 'Updated'
    this.refreshLabel = 'Refresh'
    this.phase = 'idle'
    this.isArmed = false
    this.announcement = ''

    this.drag = new DragController(this, {
      axis: 'y',
      handle: () => this.scrollerEl,
      prefix: '--_pull',
      // No room to move: every pixel down is past the bound, so the
      // rubber band is the pull's resistance.
      bounds: () => ({ top: 0, bottom: 0 }),
      elastic: 0.5,
      // Close to critically damped: it settles without bouncing past the spinner.
      spring: { stiffness: 380, damping: 38, mass: 1 },
      disabled: () => this.isDisabled || this.isRefreshing,
      canStart: ({ deltaY }) =>
        !this.pressOnField &&
        deltaY > 0 &&
        (this.scrollerEl?.scrollTop ?? 0) <= 0,
      onStart: () => {
        this.phase = 'pulling'
      },
      onMove: (state) => {
        const progress = Math.min(1, Math.max(0, state.y / this.threshold))
        this.style.setProperty(
          '--_pull-progress',
          String(Math.round(progress * 1000) / 1000),
        )
        this.isArmed = state.y >= this.threshold
      },
      release: (state) => ({
        x: 0,
        y: state.y >= this.threshold ? this.threshold : 0,
      }),
      onEnd: (_state, target) => {
        this.isArmed = false
        if (target.y > 0) void this.refresh()
        else this.phase = 'idle'
      },
    })
  }

  private get scrollerEl(): HTMLElement | null {
    return (
      this.shadowRoot?.querySelector<HTMLElement>('[part~="scroller"]') ?? null
    )
  }

  /**
   * Runs a refresh: opens the spinner, fires `refresh`, and closes once every
   * promise passed to `waitUntil` has settled. Resolves when it has closed.
   * While one is running, returns that one.
   */
  public refresh(): Promise<void> {
    if (!this.running) {
      this.running = this.run().finally(() => {
        this.running = null
      })
    }
    return this.running
  }

  private async run(): Promise<void> {
    this.phase = 'refreshing'
    this.isRefreshing = true
    this.announcement = this.refreshingLabel
    // A pull already springs here on its own; a call from code opens it.
    if (!this.drag.state.isDragging) {
      void this.drag.animateTo({ x: 0, y: this.threshold })
    }

    const waits: Array<PromiseLike<unknown>> = [delay(MIN_REFRESH_MS)]
    this.dispatchEvent(
      new CustomEvent<PullToRefreshEventDetail>('refresh', {
        bubbles: true,
        composed: true,
        detail: { waitUntil: (promise) => waits.push(promise) },
      }),
    )
    await Promise.allSettled(waits)

    this.isRefreshing = false
    this.phase = 'done'
    this.announcement = this.doneLabel
    await this.drag.animateTo({ x: 0, y: 0 })
    if (!this.drag.state.isDragging) this.phase = 'idle'
  }

  private readonly handlePointerDown = (e: PointerEvent): void => {
    const path = e.composedPath()
    const inside = path.slice(0, Math.max(0, path.indexOf(this)))
    this.pressOnField = inside.some(
      (node) => node instanceof Element && node.matches(TEXT_FIELD),
    )
  }

  /**
   * Keeps a touch that is pulling from also scrolling the content or the
   * page. Not passive, so the pull can cancel the browser's own scroll.
   */
  private readonly handleTouchMove = {
    handleEvent: (e: TouchEvent): void => {
      if (this.drag.state.isDragging && e.cancelable) e.preventDefault()
    },
    passive: false,
  }

  private indicatorText(): string {
    switch (this.phase) {
      case 'refreshing':
        return this.refreshingLabel
      case 'done':
        return this.doneLabel
      default:
        return this.isArmed ? this.releaseLabel : this.pullLabel
    }
  }

  protected override render() {
    return html`
      <div
        part="indicator"
        class="indicator"
        aria-hidden="true"
        data-phase=${this.phase}
        ?data-armed=${this.isArmed}
        ?data-dragging=${this.drag.state.isDragging}
      >
        ${
          this.phase === 'refreshing'
            ? html`<moul-spinner size="sm"></moul-spinner>`
            : this.phase === 'done'
              ? nothing
              : html`<span class="arrow">${arrowDown}</span>`
        }
        <span class="indicator-label">${this.indicatorText()}</span>
      </div>
      <div
        part="scroller"
        class="scroller"
        ?data-dragging=${this.drag.state.isDragging}
        @pointerdown=${this.handlePointerDown}
        @touchmove=${this.handleTouchMove}
      >
        <button
          part="refresh-button"
          class="refresh-button"
          type="button"
          ?disabled=${this.isDisabled}
          @click=${() => void this.refresh()}
        >
          ${this.refreshLabel}
        </button>
        <div part="content" class="content"><slot></slot></div>
      </div>
      <div class="sr-only" role="status" aria-live="polite">
        ${this.announcement}
      </div>
    `
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

defineElement('moul-pull-to-refresh', MoulPullToRefresh)

declare global {
  interface HTMLElementTagNameMap {
    'moul-pull-to-refresh': MoulPullToRefresh
  }
}
