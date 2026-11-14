import {
  css,
  html,
  nothing,
  type ReactiveController,
  type ReactiveControllerHost,
} from 'lit'
import { keyed } from 'lit/directives/keyed.js'

export interface PlaceholderCycleOptions {
  /** The hints to rotate through. */
  hints: () => string[]
  /** Milliseconds each hint stays. */
  interval: () => number
  /** True while the hints are hidden (the field holds text), so no time is spent cycling. */
  isIdle: () => boolean
}

const MIN_INTERVAL = 1000
const DEFAULT_INTERVAL = 3000

/**
 * Rotates a field's placeholder through a list of hints ("Ask about your
 * collections…", "Summarise yesterday's errors…"), each sliding up and out as
 * the next slides in. Used by `<moul-text-field>` and `<moul-prompt-input>`.
 *
 * The rotating copy is drawn over the field and hidden from screen readers;
 * the field keeps one stable native placeholder for them, so assistive
 * technology never hears it change. The cycle stops while the field holds
 * text or the tab is hidden.
 */
export class PlaceholderCycleController implements ReactiveController {
  /** The hint shown now. */
  public index = 0
  /** The hint sliding out, or -1. */
  private previous = -1
  /** Counts the turns; each turn's spans are new, so their animations restart. */
  private turn = 0
  private timer: ReturnType<typeof setInterval> | undefined
  private runningInterval = 0
  private hintsKey = ''
  private readonly host: ReactiveControllerHost
  private readonly options: PlaceholderCycleOptions

  constructor(host: ReactiveControllerHost, options: PlaceholderCycleOptions) {
    this.host = host
    this.options = options
    host.addController(this)
  }

  /** True when there are hints to show. */
  public get isActive(): boolean {
    return this.options.hints().length > 0
  }

  /** The hint shown now, or an empty string. */
  public get current(): string {
    const hints = this.options.hints()
    return hints.length ? (hints[this.index % hints.length] ?? '') : ''
  }

  hostConnected(): void {
    this.restart()
  }

  hostUpdated(): void {
    const key = this.options.hints().join('\u0000')
    if (key !== this.hintsKey) {
      this.hintsKey = key
      this.index = 0
      this.previous = -1
    }
    if (this.interval() !== this.runningInterval) this.restart()
  }

  hostDisconnected(): void {
    clearInterval(this.timer)
    this.timer = undefined
    this.runningInterval = 0
  }

  private interval(): number {
    const value = Number(this.options.interval())
    return Number.isFinite(value) && value > 0
      ? Math.max(MIN_INTERVAL, value)
      : DEFAULT_INTERVAL
  }

  private restart(): void {
    clearInterval(this.timer)
    this.runningInterval = this.interval()
    this.timer = setInterval(this.tick, this.runningInterval)
  }

  private readonly tick = (): void => {
    const hints = this.options.hints()
    if (
      hints.length < 2 ||
      this.options.isIdle() ||
      (typeof document !== 'undefined' && document.hidden)
    ) {
      return
    }
    this.previous = this.index % hints.length
    this.index = (this.index + 1) % hints.length
    this.turn++
    this.host.requestUpdate()
  }

  /** The rotating hint, to place over the field. Nothing when there are no hints. */
  public render(isHidden: boolean) {
    const hints = this.options.hints()
    if (!hints.length) return nothing
    const leaving = this.previous >= 0 ? hints[this.previous] : undefined
    return html`<span
      part="placeholder"
      class="cycling-placeholder"
      aria-hidden="true"
      ?hidden=${isHidden}
      >${keyed(
        this.turn,
        html`${leaving !== undefined ? html`<span class="hint leaving">${leaving}</span>` : nothing}<span class="hint ${this.turn > 0 ? 'entering' : ''}">${this.current}</span>`,
      )}</span
    >`
  }
}

/** Layout and motion for the rotating hint; each field positions `.cycling-placeholder` over its text. */
export const placeholderCycleStyles = css`
  .cycling-placeholder {
    position: absolute;
    display: grid;
    overflow: hidden;
    color: var(--color-field-placeholder);
    pointer-events: none;
    user-select: none;
  }

  .cycling-placeholder[hidden] {
    display: none;
  }

  .hint {
    grid-area: 1 / 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .hint.entering {
    animation: moul-hint-in 420ms var(--ease-out, ease-out) both;
  }

  .hint.leaving {
    animation: moul-hint-out 320ms var(--ease-out, ease-out) both;
  }

  @keyframes moul-hint-in {
    from {
      opacity: 0;
      transform: translateY(0.65em);
      filter: blur(2px);
    }
    to {
      opacity: 1;
      transform: none;
      filter: none;
    }
  }

  @keyframes moul-hint-out {
    from {
      opacity: 1;
      transform: none;
      filter: none;
    }
    to {
      opacity: 0;
      transform: translateY(-0.65em);
      filter: blur(2px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hint.entering {
      animation: none;
    }

    .hint.leaving {
      display: none;
    }
  }
`
