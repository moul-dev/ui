import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { CopyController } from '../../controllers/copy.controller'
import type { SemanticTone } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { highlightLines } from '../../utils/highlight'
import { check, chevronDown, copy } from '../../utils/icons'
import {
  EASE_OUT,
  prefersReducedMotion,
  SPRING_GENTLE,
  subtleAnimate,
} from '../../utils/motion'
import '../AnimatedList/AnimatedList'
import { renderTokens } from '../CodeBlock/code-view'
import { activityFeedStyles } from './ActivityFeed.styles'

export interface ActivityEvent {
  /** Identifies the event; an event pushed again with the same id updates it in place. */
  id: string | number
  /** What happened: `POST /v1/records`, `Deploy finished`. */
  title: string
  /** A second line: who, where, how long. */
  description?: string
  /** When it happened: a `Date`, a timestamp in milliseconds or an ISO string. */
  timestamp?: Date | string | number
  /** Colours the event's dot. */
  tone?: SemanticTone
  /** A short tag after the title: a status code, a method. */
  badge?: string
  /** Any JSON value (or a JSON string), shown formatted and highlighted when the event is expanded. */
  payload?: unknown
}

export type ActivityFeedTimeFormat = 'relative' | 'time' | 'datetime'

export interface ActivityFeedExpandedChangeDetail {
  id: string | number
  isExpanded: boolean
  event: ActivityEvent
}

export interface ActivityFeedPauseChangeDetail {
  isPaused: boolean
}

/** Payloads longer than this are cut, so one huge event cannot stall the page. */
const MAX_PAYLOAD_CHARS = 50_000
const TONES = new Set(['primary', 'accent', 'success', 'warning', 'error'])

const keyOf = (event: ActivityEvent) => String(event.id)

function toDate(value: ActivityEvent['timestamp']): Date | null {
  if (value === undefined || value === null || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** A payload as display text: formatted JSON when it is JSON, else plain text. */
function payloadText(payload: unknown): { text: string; language: string } {
  let text: string
  let language = 'json'
  try {
    if (typeof payload === 'string') {
      try {
        text = JSON.stringify(JSON.parse(payload), null, 2)
      } catch {
        text = payload
        language = 'text'
      }
    } else {
      text = JSON.stringify(payload, null, 2) ?? String(payload)
    }
  } catch {
    // Circular or otherwise unserialisable.
    text = String(payload)
    language = 'text'
  }
  if (text.length > MAX_PAYLOAD_CHARS) {
    text = `${text.slice(0, MAX_PAYLOAD_CHARS)}\n… (${text.length - MAX_PAYLOAD_CHARS} more characters)`
  }
  return { text, language }
}

/**
 * A live stream of events, newest first, for audit trails, request logs and
 * activity panels. New events arrive at the top through
 * `<moul-animated-list>`, pushing the others down. An event with a `payload`
 * expands to show it as formatted, highlighted JSON with a copy button. Set
 * `events`, or call `push()` as events come in; at most `max` are kept.
 * While the pointer is over the feed or focus is inside it, and while it
 * `is-paused`, new events wait instead of moving the rows, and a pill says
 * how many are waiting; choosing it shows them.
 *
 * Keyboard and screen readers: the header's pause button is a native button
 * whose label says what it will do ("Pause" or "Resume"). The events are a
 * list named by `label`, or with `is-live` a polite `role="log"` that
 * announces each event as it arrives. The rows with a payload are buttons
 * with `aria-expanded`, and form one tab stop: `Arrow Down` and `Arrow Up`
 * move between them, `Home` and `End` jump to the first and last, and
 * `Enter` or `Space` opens or closes one. An open payload is a region named
 * "Payload" whose copy button follows its row in the tab order. Times are
 * `<time>` elements whose title holds the full date. The dot's tone is only
 * shown, so put the outcome in the title or badge too.
 *
 * Reduced motion: events appear at once instead of growing in, payloads open
 * and close at once instead of easing their height, and the live dot does
 * not pulse.
 *
 * @slot empty - Shown when there are no events.
 * @fires expandedchange - The user opened or closed a payload; `detail` is `{ id, isExpanded, event }`.
 * @fires pausechange - The pause button paused or resumed the feed; `detail` is `{ isPaused }`.
 * @csspart base - The frame around everything.
 * @csspart header - The bar with the label, the live status and the pause button.
 * @csspart label - The label in the header.
 * @csspart status - The live or paused status.
 * @csspart pause-button - The pause button.
 * @csspart pending - The pill that shows how many events are waiting.
 * @csspart list - The scrolling list of events.
 * @csspart row - Each event's row (a button when it has a payload).
 * @csspart payload - An open payload.
 * @csspart copy-button - A payload's copy button.
 * @cssprop --activity-feed-max-height - Height above which the list scrolls. Defaults to `28rem`.
 */
export class MoulActivityFeed extends LitElement {
  static override styles = activityFeedStyles

  static override properties = {
    events: { attribute: false },
    max: { type: Number },
    isPaused: { type: Boolean, reflect: true, attribute: 'is-paused' },
    isLive: { type: Boolean, reflect: true, attribute: 'is-live' },
    label: { type: String },
    hideHeader: { type: Boolean, reflect: true, attribute: 'hide-header' },
    timeFormat: { type: String, attribute: 'time-format' },
    locale: { type: String },
    shown: { state: true },
    isHolding: { state: true },
  }

  /** The events, newest first. */
  declare events: ActivityEvent[]
  /** The most events kept; older ones drop off the end. */
  declare max: number
  /** Hold new events back until resumed. */
  declare isPaused: boolean
  /** Announce arriving events to screen readers (`role="log"`). */
  declare isLive: boolean
  /** The feed's name, shown in the header and given to the list. */
  declare label: string
  declare hideHeader: boolean
  /** `relative` ("2 min ago", the default), `time` (14:03:27) or `datetime`. */
  declare timeFormat: ActivityFeedTimeFormat
  /** The locale for times; the browser's by default. */
  declare locale: string | undefined
  /**
   * The events on screen, which lag `events` while the feed holds.
   * @internal
   */
  declare shown: ActivityEvent[]
  /**
   * The pointer is over the feed or focus is inside it.
   * @internal
   */
  declare isHolding: boolean

  private readonly copier = new CopyController(this)
  private readonly expanded = new Set<string>()
  /** Payloads easing shut, still rendered until they are. */
  private readonly closing = new Set<string>()
  /** Payloads to ease open after the next render. */
  private readonly opening = new Set<string>()
  /** The row holding the tab stop. */
  private activeKey: string | null = null
  private ticker: ReturnType<typeof setInterval> | undefined

  constructor() {
    super()
    this.events = []
    this.max = 200
    this.isPaused = false
    this.isLive = false
    this.label = 'Activity'
    this.hideHeader = false
    this.timeFormat = 'relative'
    this.locale = undefined
    this.shown = []
    this.isHolding = false
  }

  /** How many events are waiting to be shown. */
  public get pendingCount(): number {
    const shown = new Set(this.shown.map(keyOf))
    return this.limited().filter((event) => !shown.has(keyOf(event))).length
  }

  /**
   * Adds events to the top, newest first, so `push(c, b)` puts `c` above `b`.
   * An event whose id is already in the feed is updated where it is.
   */
  public push(...events: ActivityEvent[]): void {
    const incoming = new Map(events.map((event) => [keyOf(event), event]))
    const kept = this.events.map((event) => {
      const update = incoming.get(keyOf(event))
      if (update) incoming.delete(keyOf(event))
      return update ?? event
    })
    this.events = [...incoming.values(), ...kept].slice(0, this.limit())
  }

  /** Shows every waiting event now, even while paused. */
  public showPending(): void {
    this.shown = this.limited()
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    // Relative times go stale; refresh them now and then.
    this.ticker = setInterval(() => {
      if (this.timeFormat === 'relative' && this.shown.length) {
        this.requestUpdate()
      }
    }, 15_000)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    clearInterval(this.ticker)
    this.isHolding = false
  }

  private limit(): number {
    const max = Math.trunc(Number(this.max))
    return Number.isFinite(max) && max > 0 ? max : 200
  }

  private limited(): ActivityEvent[] {
    return (Array.isArray(this.events) ? this.events : []).slice(
      0,
      this.limit(),
    )
  }

  private get isFrozen(): boolean {
    return this.isPaused || this.isHolding
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    const isFrozen = this.isFrozen
    if (!isFrozen) {
      if (
        changed.has('events') ||
        changed.has('max') ||
        changed.has('isPaused') ||
        changed.has('isHolding')
      ) {
        this.shown = this.limited()
      }
    } else if (changed.has('events')) {
      // Rows on screen still take updates to their own events.
      const latest = new Map(
        this.limited().map((event) => [keyOf(event), event]),
      )
      this.shown = this.shown.map((event) => latest.get(keyOf(event)) ?? event)
    }
    const keys = new Set(this.shown.map(keyOf))
    for (const key of this.expanded)
      if (!keys.has(key)) this.expanded.delete(key)
  }

  protected override updated(): void {
    for (const key of this.opening) this.easePayload(key, true)
    this.opening.clear()
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused
    this.dispatchEvent(
      new CustomEvent<ActivityFeedPauseChangeDetail>('pausechange', {
        bubbles: true,
        composed: true,
        detail: { isPaused: this.isPaused },
      }),
    )
  }

  private toggle(event: ActivityEvent): void {
    const key = keyOf(event)
    const isExpanded = !this.expanded.has(key)
    if (isExpanded) {
      this.expanded.add(key)
      this.closing.delete(key)
      this.opening.add(key)
    } else {
      this.expanded.delete(key)
      if (!prefersReducedMotion()) {
        this.closing.add(key)
        this.updateComplete.then(() => this.easePayload(key, false))
      }
    }
    this.requestUpdate()
    this.dispatchEvent(
      new CustomEvent<ActivityFeedExpandedChangeDetail>('expandedchange', {
        bubbles: true,
        composed: true,
        detail: { id: event.id, isExpanded, event },
      }),
    )
  }

  /** Eases a payload's height open or shut; a shut one leaves the DOM when it lands. */
  private easePayload(key: string, isOpening: boolean): void {
    const panel = this.renderRoot.querySelector<HTMLElement>(
      `[data-payload="${CSS.escape(key)}"]`,
    )
    if (!panel || prefersReducedMotion()) {
      this.closing.delete(key)
      if (!isOpening) this.requestUpdate()
      return
    }
    const height = panel.scrollHeight
    panel.style.overflow = 'hidden'
    const motion = subtleAnimate(
      panel,
      {
        height: isOpening ? ['0px', `${height}px`] : [`${height}px`, '0px'],
        opacity: isOpening ? [0, 1] : [1, 0],
      },
      isOpening ? SPRING_GENTLE : { duration: 0.18, ease: EASE_OUT },
    )
    const settle = (): void => {
      panel.style.removeProperty('height')
      panel.style.removeProperty('overflow')
      panel.style.removeProperty('opacity')
      if (!isOpening && this.closing.delete(key)) this.requestUpdate()
    }
    motion.finished.then(settle, settle)
  }

  private rowButtons(): HTMLButtonElement[] {
    return Array.from(
      this.renderRoot.querySelectorAll<HTMLButtonElement>('button.head'),
    )
  }

  private handleListKeydown(event: KeyboardEvent): void {
    const buttons = this.rowButtons()
    const current = buttons.indexOf(event.target as HTMLButtonElement)
    if (current < 0) return
    const next =
      event.key === 'ArrowDown'
        ? Math.min(current + 1, buttons.length - 1)
        : event.key === 'ArrowUp'
          ? Math.max(current - 1, 0)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? buttons.length - 1
              : null
    if (next === null) return
    event.preventDefault()
    const target = buttons[next]
    this.activeKey = target?.dataset.key ?? null
    for (const button of buttons) button.tabIndex = button === target ? 0 : -1
    target?.focus()
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    this.isHolding = true
    const key = (event.target as HTMLElement | null)?.dataset?.key
    if (key) this.activeKey = key
  }

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null
    const list = this.renderRoot.querySelector('[part~="list"]')
    if (!next || !list?.contains(next)) {
      if (!this.matches(':hover')) this.isHolding = false
    }
  }

  private readonly hold = (): void => {
    this.isHolding = true
  }

  private readonly release = (): void => {
    const list = this.renderRoot.querySelector('[part~="list"]')
    const focused = (this.renderRoot as ShadowRoot).activeElement
    if (!focused || !list?.contains(focused)) this.isHolding = false
  }

  private formatTime(date: Date): string {
    const locale = this.locale || undefined
    if (this.timeFormat === 'time') {
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date)
    }
    if (this.timeFormat === 'datetime') {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(date)
    }
    const seconds = Math.round((date.getTime() - Date.now()) / 1000)
    const format = new Intl.RelativeTimeFormat(locale, {
      numeric: 'auto',
      style: 'short',
    })
    const abs = Math.abs(seconds)
    if (abs < 10) return format.format(0, 'second')
    if (abs < 60) return format.format(seconds, 'second')
    if (abs < 3600) return format.format(Math.round(seconds / 60), 'minute')
    if (abs < 86_400) return format.format(Math.round(seconds / 3600), 'hour')
    if (abs < 604_800) return format.format(Math.round(seconds / 86_400), 'day')
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
  }

  private renderTime(value: ActivityEvent['timestamp']) {
    const date = toDate(value)
    if (!date) return nothing
    const full = new Intl.DateTimeFormat(this.locale || undefined, {
      dateStyle: 'full',
      timeStyle: 'medium',
    }).format(date)
    return html`<time class="time" datetime=${date.toISOString()} title=${full}>${this.formatTime(date)}</time>`
  }

  private renderPayload(event: ActivityEvent, key: string, index: number) {
    const { text, language } = payloadText(event.payload)
    const lines = highlightLines(text, language)
    const copyKey = `payload:${key}`
    return html`
      <div
        part="payload"
        class="payload"
        id="payload-${index}"
        role="region"
        aria-label="Payload"
        data-payload=${key}
      >
        <div class="payload-inner">
          <pre class="code"><code>${lines.map((tokens, i) => html`<span class="line">${renderTokens(tokens)}</span>${i < lines.length - 1 ? '\n' : ''}`)}</code></pre>
          <button
            part="copy-button"
            class="copy-button"
            type="button"
            aria-label="Copy payload"
            title="Copy payload"
            ?data-copied=${this.copier.isCopied(copyKey)}
            @click=${() => this.copier.copy(text, copyKey)}
          >
            ${copy('icon-copy')} ${check('icon-check')}
          </button>
        </div>
      </div>
    `
  }

  private renderRow(
    event: ActivityEvent,
    index: number,
    firstKey: string | null,
  ) {
    const key = keyOf(event)
    const hasPayload = event.payload !== undefined && event.payload !== null
    const isOpen = this.expanded.has(key)
    const tone = event.tone && TONES.has(event.tone) ? event.tone : undefined
    const head = html`
      <span class="dot" aria-hidden="true"></span>
      <span class="text">
        <span class="title-row">
          <span class="title">${event.title}</span>
          ${event.badge ? html`<span class="badge">${event.badge}</span>` : nothing}
        </span>
        ${event.description ? html`<span class="description">${event.description}</span>` : nothing}
      </span>
      ${this.renderTime(event.timestamp)}
    `
    return html`
      <div
        class="item"
        role=${this.isLive ? nothing : 'listitem'}
        data-tone=${tone ?? nothing}
        ?data-open=${isOpen}
      >
        ${
          hasPayload
            ? html`
              <button
                part="row"
                class="head"
                type="button"
                data-key=${key}
                aria-expanded=${isOpen ? 'true' : 'false'}
                aria-controls=${isOpen ? `payload-${index}` : nothing}
                tabindex=${key === (this.activeKey ?? firstKey) ? '0' : '-1'}
                @click=${() => this.toggle(event)}
              >
                ${head} ${chevronDown('chevron')}
              </button>
            `
            : html`<div part="row" class="head">${head}</div>`
        }
        ${
          isOpen || this.closing.has(key)
            ? this.renderPayload(event, key, index)
            : nothing
        }
      </div>
    `
  }

  protected override render() {
    const pending = this.pendingCount
    const keys = this.shown.map(keyOf)
    // The tab stop goes back to the first row with a payload when its row leaves.
    if (this.activeKey && !keys.includes(this.activeKey)) this.activeKey = null
    const firstKey =
      this.shown.find(
        (event) => event.payload !== undefined && event.payload !== null,
      ) ?? null
    const first = firstKey ? keyOf(firstKey) : null

    return html`
      <div part="base" class="base">
        ${
          this.hideHeader
            ? nothing
            : html`
              <div part="header" class="header">
                <span part="label" class="label">${this.label}</span>
                <span part="status" class="status" ?data-paused=${this.isPaused}>
                  <span class="pulse" aria-hidden="true"></span>
                  ${this.isPaused ? 'Paused' : 'Live'}
                </span>
                <button
                  part="pause-button"
                  class="pause-button"
                  type="button"
                  @click=${this.togglePause}
                >
                  ${this.isPaused ? 'Resume' : 'Pause'}
                </button>
              </div>
            `
        }
        <div
          class="body"
          @pointerenter=${this.hold}
          @pointerleave=${this.release}
          @focusin=${this.handleFocusIn}
          @focusout=${this.handleFocusOut}
        >
          ${
            pending > 0
              ? html`
                <div class="pending-bar">
                  <button
                    part="pending"
                    class="pending"
                    type="button"
                    @click=${() => this.showPending()}
                  >
                    ↑ ${pending} new
                  </button>
                </div>
              `
              : nothing
          }
          ${
            this.shown.length === 0
              ? html`<div class="empty"><slot name="empty">No activity yet</slot></div>`
              : nothing
          }
          <moul-animated-list
            part="list"
            class="list"
            role=${this.isLive ? 'log' : 'list'}
            aria-label=${this.label}
            ?is-live=${this.isLive}
            ?hidden=${this.shown.length === 0}
            @keydown=${this.handleListKeydown}
          >
            ${repeat(this.shown, keyOf, (event, index) =>
              this.renderRow(event, index, first),
            )}
          </moul-animated-list>
        </div>
      </div>
    `
  }
}

defineElement('moul-activity-feed', MoulActivityFeed)

declare global {
  interface HTMLElementTagNameMap {
    'moul-activity-feed': MoulActivityFeed
  }
}
