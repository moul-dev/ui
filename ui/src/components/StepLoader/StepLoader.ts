import { html, LitElement, nothing, type PropertyValues } from 'lit'
import '../Spinner/Spinner'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion } from '../../utils/motion'
import { drawnCheck, drawnCross } from './icons'
import { stepLoaderStyles } from './StepLoader.styles'

/** One step: its label, or a label with a line of detail under it. */
export type StepLoaderStep = string | { label: string; description?: string }

/** Where a step stands: before, at or after `current`, or failed at `current`. */
export type StepLoaderState = 'done' | 'current' | 'failed' | 'pending'

/** Words read to screen readers; set the ones to translate. */
export interface StepLoaderLabels {
  /** After a finished step's label. Default "done". */
  done: string
  /** After the step in progress. Default "in progress". */
  current: string
  /** After the step that failed. Default "failed". */
  failed: string
  /** After a step not reached yet. Default "not started". */
  pending: string
  /** Announced once every step is done. Default "All steps done". */
  complete: string
}

const DEFAULT_LABELS: StepLoaderLabels = {
  done: 'done',
  current: 'in progress',
  failed: 'failed',
  pending: 'not started',
  complete: 'All steps done',
}

/**
 * A checklist that ticks off the steps of a long task while the user waits:
 * finished steps get a check that draws itself, the step in progress is
 * emphasised beside a spinner, and the steps still to come are muted. Set
 * `steps`, then move `current` as the work moves on; with `interval` it moves
 * on by itself, for waits with no progress to report. `is-error` marks the
 * current step as failed.
 *
 * Keyboard and screen readers: not focusable. The steps are an ordered list
 * named by `label` (default "Progress"), the current item has
 * `aria-current="step"`, and each item ends with visually hidden state text
 * ("done", "in progress", "failed", "not started"; translate them with
 * `labels`). A polite live region announces the current step's label as it
 * changes, with "failed" after it on `is-error`, and "All steps done" at the
 * end.
 *
 * Reduced motion: checks and crosses appear already drawn, the current row
 * does not slide in, and a constrained list jumps to the current step instead
 * of scrolling to it; the spinner pulses instead of turning.
 *
 * @fires stepchange - When `interval` moves `current` on by itself; `detail` is `{ current, previous }`.
 * @fires complete - Once `current` reaches the end of `steps`, however it got there.
 * @csspart list - The `<ol>` of steps.
 * @csspart step - Each `<li>`; also `step-done`, `step-current`, `step-failed` or `step-pending`.
 * @csspart indicator - The circle at the start of each step.
 * @csspart label - A step's label.
 * @csspart description - A step's detail line.
 * @cssprop --step-loader-gap - Space between steps. Defaults to `var(--spacing-3)`.
 */
export class MoulStepLoader extends LitElement {
  static override styles = stepLoaderStyles

  static override properties = {
    steps: { attribute: false },
    current: { type: Number, reflect: true },
    interval: { type: Number, reflect: true },
    loop: { type: Boolean, reflect: true },
    isError: { type: Boolean, reflect: true, attribute: 'is-error' },
    label: { type: String, reflect: true },
    labels: { attribute: false },
  }

  /** The steps, in order. */
  declare steps: StepLoaderStep[]
  /** Index of the step in progress. Earlier steps are done; at `steps.length` or past it, all are. */
  declare current: number
  /** Milliseconds before `current` moves on by itself; 0 (the default) leaves it to you. */
  declare interval: number
  /** With `interval`, start again from the first step after the last one is done. */
  declare loop: boolean
  /** The current step failed: it shows a cross, and `interval` stops. */
  declare isError: boolean
  /** Accessible name of the list. */
  declare label: string
  /** Screen reader words, merged over the English defaults. */
  declare labels: Partial<StepLoaderLabels>

  private timer: ReturnType<typeof setTimeout> | null = null
  private wasComplete = false

  constructor() {
    super()
    this.steps = []
    this.current = 0
    this.interval = 0
    this.loop = false
    this.isError = false
    this.label = 'Progress'
    this.labels = {}
  }

  /** True once every step is done. */
  public get isComplete(): boolean {
    return this.steps.length > 0 && this.current >= this.steps.length
  }

  /** Where step `index` stands. */
  public stateOf(index: number): StepLoaderState {
    if (index < this.current) return 'done'
    if (index > this.current) return 'pending'
    return this.isError ? 'failed' : 'current'
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (this.hasUpdated) this.schedule()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.clearTimer()
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    const isComplete = this.isComplete
    if (isComplete && !this.wasComplete && changedProps.has('current')) {
      this.dispatchEvent(
        new CustomEvent('complete', { bubbles: true, composed: true }),
      )
    }
    this.wasComplete = isComplete
    if (
      changedProps.has('current') ||
      changedProps.has('interval') ||
      changedProps.has('loop') ||
      changedProps.has('isError') ||
      changedProps.has('steps')
    ) {
      this.schedule()
    }
    if (changedProps.has('current') || changedProps.has('isError')) {
      this.revealCurrent()
    }
  }

  private schedule(): void {
    this.clearTimer()
    const count = this.steps.length
    if (!this.isConnected || !(this.interval > 0) || this.isError) return
    if (count === 0 || (this.current >= count && !this.loop)) return
    this.timer = setTimeout(() => {
      this.timer = null
      this.advance()
    }, this.interval)
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  private advance(): void {
    const previous = this.current
    // Past the last step only a loop gets here: start over.
    this.current = previous >= this.steps.length ? 0 : previous + 1
    this.dispatchEvent(
      new CustomEvent('stepchange', {
        bubbles: true,
        composed: true,
        detail: { current: this.current, previous },
      }),
    )
  }

  /** Scrolls a list taller than the host so the current step sits in its middle. */
  private revealCurrent(): void {
    if (this.scrollHeight <= this.clientHeight + 1) return
    const rows = this.shadowRoot?.querySelectorAll<HTMLElement>('.step')
    if (!rows?.length) return
    const row = rows[Math.min(Math.max(this.current, 0), rows.length - 1)]
    const hostTop = this.getBoundingClientRect().top
    const rect = row.getBoundingClientRect()
    const top =
      rect.top -
      hostTop +
      this.scrollTop -
      (this.clientHeight - rect.height) / 2
    this.scrollTo?.({
      top: Math.max(0, top),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }

  private get words(): StepLoaderLabels {
    return { ...DEFAULT_LABELS, ...this.labels }
  }

  private get announcement(): string {
    const words = this.words
    if (this.isComplete) return words.complete
    const step = this.steps[this.current]
    if (step === undefined) return ''
    const label = typeof step === 'string' ? step : step.label
    return this.isError ? `${label}, ${words.failed}` : label
  }

  private renderIndicator(state: StepLoaderState, label: string) {
    switch (state) {
      case 'done':
        return drawnCheck()
      case 'failed':
        return drawnCross()
      case 'current':
        return html`<moul-spinner size="sm" label=${label}></moul-spinner>`
      default:
        return nothing
    }
  }

  protected override render() {
    const words = this.words
    return html`
      <ol part="list" aria-label=${this.label}>
        ${this.steps.map((step, index) => {
          const { label, description } =
            typeof step === 'string' ? { label: step, description: '' } : step
          const state = this.stateOf(index)
          const isCurrent = state === 'current' || state === 'failed'
          return html`
            <li
              part="step step-${state}"
              class="step"
              data-state=${state}
              aria-current=${isCurrent ? 'step' : nothing}
            >
              <span part="indicator" class="indicator" aria-hidden="true"
                >${this.renderIndicator(state, label)}</span
              >
              <span class="text">
                <span part="label" class="label">${label}</span>
                ${
                  description
                    ? html`<span part="description" class="description"
                        >${description}</span
                      >`
                    : nothing
                }
                <span class="sr-only">, ${words[state]}</span>
              </span>
            </li>
          `
        })}
      </ol>
      <div class="sr-only" role="status" aria-live="polite">
        ${this.announcement}
      </div>
    `
  }
}

defineElement('moul-step-loader', MoulStepLoader)

declare global {
  interface HTMLElementTagNameMap {
    'moul-step-loader': MoulStepLoader
  }
}
