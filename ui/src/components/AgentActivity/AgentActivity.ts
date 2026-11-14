import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { defineElement } from '../../utils/define-element'
import { alertError, check, chevronDown } from '../../utils/icons'
import {
  EASE_OUT,
  prefersReducedMotion,
  SPRING_GENTLE,
  subtleAnimate,
} from '../../utils/motion'
import '../CodeBlock/CodeBlock'
import { payloadText } from '../CodeBlock/code-view'
import '../Timeline/Timeline'
import type { TimelineItemStatus } from '../Timeline/TimelineItem'
import { agentActivityStyles } from './AgentActivity.styles'

export type AgentStepStatus = 'pending' | 'running' | 'done' | 'error'

/** One thing the agent did: a reasoning step, or a call to a tool. */
export interface AgentStep {
  /** Identifies the step; pushing a step with a known id updates it in place. */
  id: string | number
  /** What the step does: "Read the collection schema". A tool call defaults to its tool's name. */
  title?: string
  /** The tool called, shown as a tag: `list_records`. Makes the step a tool call. */
  tool?: string
  /** Reasoning or a note, shown under the title. */
  detail?: string
  /** What the tool was called with: any JSON value, or a JSON string. */
  input?: unknown
  /** What the tool returned: any JSON value, or a JSON string. */
  output?: unknown
  /** Why the step failed. */
  error?: string
  /** `pending`, `running`, `done` (the default) or `error`. */
  status?: AgentStepStatus
  /** When the step started: a `Date`, milliseconds or an ISO string. A running step counts up from it. */
  startedAt?: Date | string | number
  /** When the step ended. */
  endedAt?: Date | string | number
  /** How long it took in milliseconds, when the start and end are unknown. */
  duration?: number
}

export interface AgentActivityOpenChangeDetail {
  isOpen: boolean
}

export interface AgentActivityExpandedChangeDetail {
  id: string | number
  isExpanded: boolean
  step: AgentStep
}

const STATUSES: AgentStepStatus[] = ['pending', 'running', 'done', 'error']
const TIMELINE_STATUS: Record<AgentStepStatus, TimelineItemStatus> = {
  pending: 'upcoming',
  running: 'current',
  done: 'complete',
  error: 'complete',
}

const keyOf = (step: AgentStep) => String(step.id)
const statusOf = (step: AgentStep): AgentStepStatus =>
  STATUSES.includes(step.status as AgentStepStatus)
    ? (step.status as AgentStepStatus)
    : 'done'
const hasDetails = (step: AgentStep) =>
  step.input !== undefined || step.output !== undefined

function toTime(value: AgentStep['startedAt']): number | null {
  if (value === undefined || value === null || value === '') return null
  const time = (value instanceof Date ? value : new Date(value)).getTime()
  return Number.isNaN(time) ? null : time
}

/** `420 ms`, `3.2s`, `1m 05s`. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return ''
  if (ms < 1000) return `${Math.round(ms)} ms`
  const seconds = ms / 1000
  if (seconds < 10) return `${Number(seconds.toFixed(1))}s`
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${String(Math.round(seconds % 60)).padStart(2, '0')}s`
}

/**
 * What an AI agent is doing, as a live timeline: its reasoning steps and the
 * tools it calls, each with a status (pending, running, done or error) and
 * how long it took. Set `steps`, or call `push()` as the agent works. A step
 * that names a `tool` is a tool call whose `input` and `output` open as
 * highlighted JSON. The header sums the work up ("Calling list_records…",
 * then "Finished 4 steps · 3 tool calls · 6.2s") and folds the timeline away,
 * so a finished run can step aside for the answer.
 *
 * Keyboard and screen readers: the header is a native button with
 * `aria-expanded` that shows or hides the steps; `Enter` or `Space` toggles
 * it. The steps are a `<moul-timeline>` list named "Agent steps", where the
 * running step is `aria-current="step"` and done or upcoming ones say so
 * after their title. A step with input or output has a "Show input and
 * output" button with `aria-expanded`; the code blocks it opens keep their
 * own copy buttons. With `is-live`, a polite live region announces each
 * step as it starts and fails, and when the run finishes.
 *
 * Reduced motion: the steps and a step's details open and close at once
 * instead of easing their height, the running marker does not pulse, the
 * summary does not shimmer, and the header's spinner turns slowly.
 *
 * @fires openchange - The header showed or hid the steps; `detail` is `{ isOpen }`.
 * @fires expandedchange - A step's input and output were shown or hidden; `detail` is `{ id, isExpanded, step }`.
 * @csspart base - The frame around everything.
 * @csspart header - The button that sums up the run and toggles the steps.
 * @csspart summary - The summary text.
 * @csspart steps - The panel holding the timeline.
 * @csspart step - Each step's row.
 * @csspart tool - A tool call's tag.
 * @csspart details-button - The button that shows a step's input and output.
 * @csspart details - A step's input and output.
 */
export class MoulAgentActivity extends LitElement {
  static override styles = agentActivityStyles

  static override properties = {
    steps: { attribute: false },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    isLive: { type: Boolean, reflect: true, attribute: 'is-live' },
    label: { type: String },
    announcement: { state: true },
  }

  /** The steps, oldest first. */
  declare steps: AgentStep[]
  /** Show the steps under the header. */
  declare isOpen: boolean
  /** Announce steps as they start and fail. */
  declare isLive: boolean
  /** Replaces the header's summary. */
  declare label: string
  /** @internal */
  declare announcement: string

  private readonly expanded = new Set<string>()
  private readonly closing = new Set<string>()
  private readonly opening = new Set<string>()
  private lastStatuses = new Map<string, AgentStepStatus>()
  private ticker: ReturnType<typeof setInterval> | undefined
  private isPanelClosing = false

  constructor() {
    super()
    this.steps = []
    this.isOpen = true
    this.isLive = false
    this.label = ''
    this.announcement = ''
  }

  /** True while any step is running. */
  public get isRunning(): boolean {
    return this.list().some((step) => statusOf(step) === 'running')
  }

  /** Adds steps to the end; a step whose id is known is updated where it is. */
  public push(...steps: AgentStep[]): void {
    const incoming = new Map(steps.map((step) => [keyOf(step), step]))
    const kept = this.list().map((step) => {
      const update = incoming.get(keyOf(step))
      if (!update) return step
      incoming.delete(keyOf(step))
      return { ...step, ...update }
    })
    this.steps = [...kept, ...incoming.values()]
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    clearInterval(this.ticker)
    this.ticker = undefined
  }

  private list(): AgentStep[] {
    return Array.isArray(this.steps) ? this.steps : []
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (!changed.has('steps')) return
    const steps = this.list()
    const keys = new Set(steps.map(keyOf))
    for (const key of this.expanded)
      if (!keys.has(key)) this.expanded.delete(key)
    if (this.isLive) this.announce(steps)
    this.lastStatuses = new Map(
      steps.map((step) => [keyOf(step), statusOf(step)]),
    )
  }

  protected override updated(changed: PropertyValues<this>): void {
    // Running steps count their seconds.
    if (this.isRunning && !this.ticker) {
      this.ticker = setInterval(() => this.requestUpdate(), 1000)
    } else if (!this.isRunning && this.ticker) {
      clearInterval(this.ticker)
      this.ticker = undefined
    }
    for (const key of this.opening) this.easeDetails(key, true)
    this.opening.clear()
    if (changed.has('isOpen') && changed.get('isOpen') !== undefined) {
      this.easePanel(this.isOpen)
    }
  }

  private announce(steps: AgentStep[]): void {
    const messages: string[] = []
    for (const step of steps) {
      const status = statusOf(step)
      const before = this.lastStatuses.get(keyOf(step))
      if (status === before) continue
      const name = this.titleOf(step)
      if (status === 'running') messages.push(`Running ${name}`)
      else if (status === 'error') messages.push(`${name} failed`)
    }
    const wasRunning = [...this.lastStatuses.values()].includes('running')
    const isRunning = steps.some((step) => statusOf(step) === 'running')
    if (wasRunning && !isRunning) messages.push('Finished')
    if (messages.length) this.announcement = messages.join('. ')
  }

  private titleOf(step: AgentStep): string {
    return step.title || step.tool || 'Step'
  }

  /** How long the step took, or has run so far. */
  private durationOf(step: AgentStep): number | null {
    const start = toTime(step.startedAt)
    const end = toTime(step.endedAt)
    if (start !== null && end !== null) return Math.max(0, end - start)
    if (statusOf(step) === 'running' && start !== null) {
      return Math.max(0, Date.now() - start)
    }
    return typeof step.duration === 'number' ? step.duration : null
  }

  private summary(steps: AgentStep[]): string {
    if (this.label) return this.label
    const running = steps.find((step) => statusOf(step) === 'running')
    if (running) {
      return running.tool && !running.title
        ? `Calling ${running.tool}…`
        : `${this.titleOf(running)}…`
    }
    if (!steps.length || steps.every((step) => statusOf(step) === 'pending')) {
      return 'Getting started…'
    }
    const finished = steps.filter((step) => statusOf(step) !== 'pending')
    const tools = finished.filter((step) => step.tool).length
    const failed = finished.filter((step) => statusOf(step) === 'error').length
    const parts = [
      `Finished ${finished.length} ${finished.length === 1 ? 'step' : 'steps'}`,
    ]
    if (tools)
      parts.push(`${tools} ${tools === 1 ? 'tool call' : 'tool calls'}`)
    if (failed) parts.push(`${failed} failed`)
    const total = this.totalDuration(steps)
    if (total !== null) parts.push(formatDuration(total))
    return parts.join(' · ')
  }

  /**
   * From the first start to the last end when every step that ran carries its
   * times, since steps can overlap; otherwise the sum of their durations.
   */
  private totalDuration(steps: AgentStep[]): number | null {
    const ran = steps.filter((step) => statusOf(step) !== 'pending')
    const starts = ran.map((step) => toTime(step.startedAt))
    const ends = ran.map((step) => toTime(step.endedAt))
    if (
      ran.length &&
      starts.every((t) => t !== null) &&
      ends.every((t) => t !== null)
    ) {
      return Math.max(
        0,
        Math.max(...(ends as number[])) - Math.min(...(starts as number[])),
      )
    }
    const durations = ran
      .map((step) => this.durationOf(step))
      .filter((d): d is number => d !== null)
    return durations.length ? durations.reduce((a, b) => a + b, 0) : null
  }

  private toggleOpen(): void {
    this.isOpen = !this.isOpen
    this.dispatchEvent(
      new CustomEvent<AgentActivityOpenChangeDetail>('openchange', {
        bubbles: true,
        composed: true,
        detail: { isOpen: this.isOpen },
      }),
    )
  }

  private toggleDetails(step: AgentStep): void {
    const key = keyOf(step)
    const isExpanded = !this.expanded.has(key)
    if (isExpanded) {
      this.expanded.add(key)
      this.closing.delete(key)
      this.opening.add(key)
    } else {
      this.expanded.delete(key)
      if (!prefersReducedMotion()) {
        this.closing.add(key)
        this.updateComplete.then(() => this.easeDetails(key, false))
      }
    }
    this.requestUpdate()
    this.dispatchEvent(
      new CustomEvent<AgentActivityExpandedChangeDetail>('expandedchange', {
        bubbles: true,
        composed: true,
        detail: { id: step.id, isExpanded, step },
      }),
    )
  }

  /** Eases an element's height open or shut, then hands it back to CSS. */
  private easeHeight(
    el: HTMLElement,
    isOpening: boolean,
    done: () => void,
  ): void {
    const height = el.scrollHeight
    el.style.overflow = 'hidden'
    const motion = subtleAnimate(
      el,
      {
        height: isOpening ? ['0px', `${height}px`] : [`${height}px`, '0px'],
        opacity: isOpening ? [0, 1] : [1, 0],
      },
      isOpening ? SPRING_GENTLE : { duration: 0.18, ease: EASE_OUT },
    )
    const settle = (): void => {
      el.style.removeProperty('height')
      el.style.removeProperty('overflow')
      el.style.removeProperty('opacity')
      done()
    }
    motion.finished.then(settle, settle)
  }

  private easeDetails(key: string, isOpening: boolean): void {
    const panel = this.renderRoot.querySelector<HTMLElement>(
      `[data-details="${CSS.escape(key)}"]`,
    )
    if (!panel || prefersReducedMotion()) {
      if (this.closing.delete(key)) this.requestUpdate()
      return
    }
    this.easeHeight(panel, isOpening, () => {
      if (!isOpening && this.closing.delete(key)) this.requestUpdate()
    })
  }

  private easePanel(isOpening: boolean): void {
    const panel = this.renderRoot.querySelector<HTMLElement>('[part~="steps"]')
    if (!panel || prefersReducedMotion()) return
    this.isPanelClosing = !isOpening
    if (!isOpening) this.requestUpdate()
    this.easeHeight(panel, isOpening, () => {
      if (this.isPanelClosing) {
        this.isPanelClosing = false
        this.requestUpdate()
      }
    })
  }

  private renderDetails(step: AgentStep, key: string) {
    const blocks: [string, unknown][] = []
    if (step.input !== undefined) blocks.push(['Input', step.input])
    if (step.output !== undefined) blocks.push(['Output', step.output])
    return html`
      <div part="details" class="details" data-details=${key}>
        <div class="details-inner">
          ${blocks.map(([name, value]) => {
            const { text, language } = payloadText(value)
            return html`<moul-code-block
              class="payload"
              filename=${name}
              label="${this.titleOf(step)} ${name.toLowerCase()}"
              language=${language}
              .code=${text}
            ></moul-code-block>`
          })}
        </div>
      </div>
    `
  }

  private renderStep(step: AgentStep) {
    const key = keyOf(step)
    const status = statusOf(step)
    const duration = this.durationOf(step)
    const isExpanded = this.expanded.has(key)
    const showDetails = isExpanded || this.closing.has(key)
    const meta = [
      status === 'pending' ? 'Waiting' : '',
      duration !== null && status !== 'pending' ? formatDuration(duration) : '',
    ]
      .filter(Boolean)
      .join(' · ')
    return html`
      <moul-timeline-item
        part="step"
        class="step"
        status=${TIMELINE_STATUS[status]}
        tone=${status === 'error' ? 'error' : nothing}
        data-status=${status}
        status-label=${status === 'error' ? 'Failed' : nothing}
      >
        <span slot="heading" class="step-heading">
          <span class="step-title">${this.titleOf(step)}</span>
          ${
            step.tool && step.title
              ? html`<code part="tool" class="tool">${step.tool}</code>`
              : nothing
          }
        </span>
        ${meta ? html`<span slot="meta">${meta}</span>` : nothing}
        ${step.detail ? html`<p class="detail">${step.detail}</p>` : nothing}
        ${
          status === 'error' && step.error
            ? html`<p class="step-error">${step.error}</p>`
            : nothing
        }
        ${
          hasDetails(step)
            ? html`<button
                part="details-button"
                class="details-button"
                type="button"
                aria-expanded=${isExpanded ? 'true' : 'false'}
                @click=${() => this.toggleDetails(step)}
              >
                ${chevronDown('chevron')}
                ${isExpanded ? 'Hide input and output' : 'Show input and output'}
              </button>`
            : nothing
        }
        ${showDetails && hasDetails(step) ? this.renderDetails(step, key) : nothing}
      </moul-timeline-item>
    `
  }

  private renderStatusIcon(steps: AgentStep[]) {
    if (this.isRunning)
      return html`<span class="spinner" aria-hidden="true"></span>`
    if (steps.some((step) => statusOf(step) === 'error')) {
      return alertError('status-icon error')
    }
    if (steps.length && steps.every((step) => statusOf(step) === 'done')) {
      return check('status-icon done')
    }
    return html`<span class="spinner" aria-hidden="true"></span>`
  }

  protected override render() {
    const steps = this.list()
    const showPanel = this.isOpen || this.isPanelClosing
    return html`
      <div part="base" class="base" ?data-running=${this.isRunning}>
        <button
          part="header"
          class="header"
          type="button"
          aria-expanded=${this.isOpen ? 'true' : 'false'}
          aria-controls="steps"
          @click=${this.toggleOpen}
        >
          ${this.renderStatusIcon(steps)}
          <span part="summary" class="summary">${this.summary(steps)}</span>
          ${chevronDown('chevron')}
        </button>
        <div part="steps" class="steps" id="steps" ?hidden=${!showPanel}>
          <moul-timeline density="compact" progress="status" label="Agent steps">
            ${repeat(steps, keyOf, (step) => this.renderStep(step))}
          </moul-timeline>
        </div>
        <span class="sr-only" role="status">${this.isLive ? this.announcement : ''}</span>
      </div>
    `
  }
}

defineElement('moul-agent-activity', MoulAgentActivity)

declare global {
  interface HTMLElementTagNameMap {
    'moul-agent-activity': MoulAgentActivity
  }
}
