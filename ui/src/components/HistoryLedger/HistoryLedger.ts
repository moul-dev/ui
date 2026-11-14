import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import '../Avatar/Avatar'
import '../Badge/Badge'
import '../Button/Button'
import type { MoulButton } from '../Button/Button'
import '../Timeline/Timeline'
import { defineElement } from '../../utils/define-element'
import { chevronDown } from '../../utils/icons'
import {
  EASE_OUT,
  prefersReducedMotion,
  SPRING_GENTLE,
  subtleAnimate,
} from '../../utils/motion'
import { historyLedgerStyles } from './HistoryLedger.styles'

/** One field that changed in a version. */
export interface HistoryChange {
  field: string
  before?: unknown
  after?: unknown
}

export interface HistoryAuthor {
  name: string
  /** Image URL; initials are shown without one. */
  avatar?: string
}

/** One saved version of a record. */
export interface HistoryVersion {
  /** Identifies the version in `current` and in the `restore` event. */
  id: string
  /** Shown as the row's title; defaults to the id. */
  label?: string
  author?: string | HistoryAuthor
  /** When it was saved: a `Date`, an ISO string or a timestamp in milliseconds. */
  timestamp?: Date | string | number
  summary?: string
  /** The fields that changed, shown as an expandable before→after list. */
  changes?: HistoryChange[]
}

export interface HistoryRestoreDetail {
  version: HistoryVersion
  /**
   * Hands the ledger the restore's promise, during the event. The button
   * shows it pending, then success or failure; the version becomes current
   * only if it resolves.
   */
  waitUntil(promise: Promise<unknown>): void
}

/** The words the ledger shows and reads, for another language. */
export interface HistoryLedgerLabels {
  restore: string
  restoring: string
  restored: string
  restoreFailed: string
  current: string
  /** The button that shows the changes, given how many there are. */
  changes: (count: number) => string
  /** Shown for a value that was empty. */
  empty: string
  /** Read before the old value and before the new one. */
  changedFrom: string
  changedTo: string
  /** Shown when there are no versions. */
  noHistory: string
}

const DEFAULT_LABELS: HistoryLedgerLabels = {
  restore: 'Restore',
  restoring: 'Restoring…',
  restored: 'Restored',
  restoreFailed: 'Restore failed',
  current: 'Current',
  changes: (count) => `${count} ${count === 1 ? 'change' : 'changes'}`,
  empty: 'Empty',
  changedFrom: 'changed from',
  changedTo: 'to',
  noHistory: 'No history yet',
}

/** How long the restore button shows its result before the row settles. */
const RESULT_MS = 1500

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

function toDate(value: HistoryVersion['timestamp']): Date | null {
  if (value === undefined || value === null || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "3 hours ago", "yesterday", "now": the largest unit that fits. */
function relativeTime(date: Date, now: number, locale?: string): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const seconds = (date.getTime() - now) / 1000
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) {
      return format.format(Math.round(seconds / size), unit)
    }
  }
  return format.format(0, 'second')
}

function authorName(author: HistoryVersion['author']): string {
  return typeof author === 'string' ? author : (author?.name ?? '')
}

/**
 * A record's version history, newest first, with one-click restore: each
 * version shows who saved it and when, a summary, and the fields it changed
 * as an expandable before→after list, on a compact `<moul-timeline>`. The
 * `current` version is marked; every other one has a Restore button that
 * fires a cancelable `restore` event. Hand the ledger your save with
 * `event.detail.waitUntil(promise)` and the button shows it pending, then
 * restored or failed; once it resolves the version becomes current, unless
 * you replaced `versions` in the meantime.
 *
 * Keyboard and screen readers: every control is a native or `moul-button`
 * button in the tab order. The versions are a list named by `label`
 * ("Version history"), the current one marked `aria-current="true"`. Each
 * Restore button is named after its version ("Restore Version 3"), and its
 * pending, restored and failed states are announced by the button. The
 * changes button has `aria-expanded` and `aria-controls`; Enter or Space
 * opens and closes the list, where the old and new values are read as
 * "changed from … to …". While a restore runs the other Restore buttons are
 * disabled. When a restored row's button goes away, focus moves to that
 * row's title instead of being lost. Times show relative ("2 hours ago")
 * with the full date and time in a `<time datetime>` and its tooltip.
 *
 * Reduced motion: the changes list opens and closes at once instead of
 * growing with a spring, and its chevron turns instantly; the Restore
 * button's own state changes follow `moul-button`'s reduced-motion path.
 *
 * @slot empty - Shown instead of the list when there are no versions.
 * @fires restore - A Restore button was pressed; `detail` is `{ version, waitUntil(promise) }`. Cancelable: `preventDefault()` stops the restore.
 * @csspart base - The wrapper around the list.
 * @csspart timeline - The `moul-timeline` that lays out the versions.
 * @csspart version - Each `moul-timeline-item`.
 * @csspart title - A version's title, focused after its restore.
 * @csspart summary - A version's summary.
 * @csspart changes-toggle - The button that opens a version's changes.
 * @csspart changes - The list of changed fields.
 * @csspart restore - Each Restore button.
 * @csspart empty - The box shown when there are no versions.
 */
export class MoulHistoryLedger extends LitElement {
  static override styles = historyLedgerStyles

  static override properties = {
    versions: { attribute: false },
    current: { type: String },
    label: { type: String },
    isReadOnly: { type: Boolean, reflect: true, attribute: 'is-read-only' },
    labels: { attribute: false },
    valueFormatter: { attribute: false },
  }

  /** The versions, newest first. */
  declare versions: HistoryVersion[]
  /** The id of the version the record is at now. */
  declare current: string
  /** The list's accessible name. */
  declare label: string
  /** Hide every Restore button. */
  declare isReadOnly: boolean
  /** Words to replace, for another language; merged over the English defaults. */
  declare labels: Partial<HistoryLedgerLabels>
  /** Formats a changed value; by default strings show as they are and objects as JSON. */
  declare valueFormatter:
    | ((value: unknown, change: HistoryChange) => string)
    | undefined

  /** Version ids whose changes are open. */
  private readonly expanded = new Set<string>()
  /** Version ids whose changes are animating closed, so they stay visible until then. */
  private readonly closing = new Set<string>()
  /** The version whose restore is running. */
  private pending: string | null = null
  /** Versions that keep their Restore button while it shows the result. */
  private readonly showing = new Set<string>()
  private readonly panelMotions = new Map<string, { stop(): void }>()
  /** A number per version id, for element ids that survive reordering. */
  private readonly serials = new Map<string, number>()
  private clock: ReturnType<typeof setInterval> | null = null
  private readonly timers = new Set<ReturnType<typeof setTimeout>>()

  constructor() {
    super()
    this.versions = []
    this.current = ''
    this.label = 'Version history'
    this.isReadOnly = false
    this.labels = {}
    this.valueFormatter = undefined
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    // Relative times drift; re-render them once a minute.
    this.clock = setInterval(() => this.requestUpdate(), 60_000)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    if (this.clock) clearInterval(this.clock)
    this.clock = null
    for (const timer of this.timers) clearTimeout(timer)
    this.timers.clear()
    for (const motion of this.panelMotions.values()) motion.stop()
    this.panelMotions.clear()
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (!Array.isArray(this.versions)) this.versions = []
    if (changed.has('versions')) {
      // Forget open panels of versions that are gone.
      const ids = new Set(this.versions.map((version) => version.id))
      for (const id of [...this.expanded]) {
        if (!ids.has(id)) this.expanded.delete(id)
      }
    }
  }

  private get text(): HistoryLedgerLabels {
    return { ...DEFAULT_LABELS, ...(this.labels ?? {}) }
  }

  /** The language of the page around the ledger, for times; the browser's when unset or unknown. */
  private get locale(): string | undefined {
    const lang = this.closest('[lang]')?.getAttribute('lang') || undefined
    if (!lang) return undefined
    try {
      return Intl.getCanonicalLocales(lang)[0]
    } catch {
      return undefined
    }
  }

  private formatValue(value: unknown, change: HistoryChange): string {
    if (this.valueFormatter) return this.valueFormatter(value, change)
    if (value === undefined || value === null || value === '') return ''
    if (typeof value === 'string') return value
    if (value instanceof Date) return value.toLocaleString(this.locale)
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value)
      } catch {
        return String(value)
      }
    }
    return String(value)
  }

  private serial(id: string): number {
    let serial = this.serials.get(id)
    if (serial === undefined) {
      serial = this.serials.size
      this.serials.set(id, serial)
    }
    return serial
  }

  private panel(id: string): HTMLElement | null {
    return this.renderRoot.querySelector(`#changes-${this.serial(id)}`)
  }

  private async toggleChanges(version: HistoryVersion) {
    const { id } = version
    const isOpening = !this.expanded.has(id)
    const panel = this.panel(id)
    const from =
      panel && !panel.hidden ? panel.getBoundingClientRect().height : 0
    this.panelMotions.get(id)?.stop()
    this.panelMotions.delete(id)
    if (isOpening) {
      this.expanded.add(id)
      this.closing.delete(id)
    } else {
      this.expanded.delete(id)
      if (!prefersReducedMotion()) this.closing.add(id)
    }
    this.requestUpdate()
    await this.updateComplete
    const target = this.panel(id)
    if (!target || prefersReducedMotion()) return
    target.style.removeProperty('height')
    const to = isOpening ? target.getBoundingClientRect().height : 0
    target.setAttribute('data-animating', '')
    const motion = subtleAnimate(
      target,
      { height: [`${from}px`, `${to}px`] },
      isOpening ? SPRING_GENTLE : { duration: 0.2, ease: EASE_OUT },
    )
    this.panelMotions.set(id, motion)
    const settle = (): void => {
      if (this.panelMotions.get(id) !== motion) return
      this.panelMotions.delete(id)
      target.style.removeProperty('height')
      target.removeAttribute('data-animating')
      if (this.closing.delete(id)) this.requestUpdate()
    }
    motion.finished.then(settle, settle)
  }

  private async restore(version: HistoryVersion, event: Event) {
    const button = event.currentTarget as MoulButton
    if (this.pending !== null) return
    let task: Promise<unknown> | null = null
    let isOpen = true
    const detail: HistoryRestoreDetail = {
      version,
      waitUntil: (promise) => {
        if (isOpen) task = Promise.resolve(promise)
      },
    }
    const allowed = this.dispatchEvent(
      new CustomEvent<HistoryRestoreDetail>('restore', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail,
      }),
    )
    isOpen = false
    if (!allowed) return

    const startedWith = this.versions
    this.pending = version.id
    this.showing.add(version.id)
    this.requestUpdate()
    try {
      await button.run(() => task ?? Promise.resolve())
      // New versions from the app say where the record is now; leave them be.
      if (this.versions === startedWith) this.current = version.id
    } catch {
      // The button shows the failure; the app has the error from its own promise.
    } finally {
      this.pending = null
      this.requestUpdate()
    }
    const timer = setTimeout(() => {
      this.timers.delete(timer)
      void this.release(version.id, button)
    }, RESULT_MS)
    this.timers.add(timer)
  }

  /** Drops a restored row's button once its result has shown, keeping focus on the row. */
  private async release(id: string, button: MoulButton) {
    const hadFocus = this.shadowRoot?.activeElement === button
    this.showing.delete(id)
    this.requestUpdate()
    await this.updateComplete
    if (hadFocus && !button.isConnected) {
      this.renderRoot
        .querySelector<HTMLElement>(`#title-${this.serial(id)}`)
        ?.focus()
    }
  }

  private renderTime(version: HistoryVersion) {
    const date = toDate(version.timestamp)
    if (!date) return nothing
    const locale = this.locale
    let absolute = date.toISOString()
    try {
      absolute = new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    } catch {
      // Keep the ISO string.
    }
    return html`<time datetime=${date.toISOString()} title=${absolute}
      >${relativeTime(date, Date.now(), locale)}</time
    >`
  }

  private renderAuthor(version: HistoryVersion) {
    const name = authorName(version.author)
    if (!name) return nothing
    const avatar =
      typeof version.author === 'object' ? version.author.avatar : undefined
    return html`<span class="author">
      <moul-avatar
        size="xs"
        name=${name}
        src=${avatar ?? nothing}
        aria-hidden="true"
      ></moul-avatar>
      <span>${name}</span>
    </span>`
  }

  private renderValue(value: unknown, change: HistoryChange) {
    const text = this.formatValue(value, change)
    return text
      ? text
      : html`<span class="empty-value">${this.text.empty}</span>`
  }

  private renderChanges(version: HistoryVersion, isOpen: boolean) {
    const changes = version.changes ?? []
    if (changes.length === 0) return nothing
    const text = this.text
    return html`<div
      part="changes"
      class="changes"
      id="changes-${this.serial(version.id)}"
      ?hidden=${!isOpen && !this.closing.has(version.id)}
    >
      <ul class="change-list">
        ${changes.map(
          (change) => html`<li class="change">
            <span class="field">${change.field}</span>
            <span class="values">
              <span class="sr-only">${text.changedFrom}</span>
              <del class="before">${this.renderValue(change.before, change)}</del>
              <span class="arrow" aria-hidden="true">→</span>
              <span class="sr-only">${text.changedTo}</span>
              <ins class="after">${this.renderValue(change.after, change)}</ins>
            </span>
          </li>`,
        )}
      </ul>
    </div>`
  }

  private renderVersion(version: HistoryVersion) {
    const text = this.text
    const serial = this.serial(version.id)
    const isCurrent = version.id === this.current
    const title = version.label || version.id
    const count = version.changes?.length ?? 0
    const isOpen = this.expanded.has(version.id)
    const showRestore =
      !this.isReadOnly && (!isCurrent || this.showing.has(version.id))
    return html`<moul-timeline-item
      part="version"
      status=${isCurrent ? 'current' : ''}
      tone=${isCurrent ? 'success' : ''}
      aria-current=${isCurrent ? 'true' : nothing}
    >
      <span slot="heading" class="heading">
        <span part="title" class="title" id="title-${serial}" tabindex="-1"
          >${title}</span
        >
        ${
          isCurrent
            ? html`<moul-badge
                size="sm"
                tone="success"
                variant="flat"
                aria-hidden="true"
                >${text.current}</moul-badge
              >`
            : nothing
        }
      </span>
      <span slot="meta" class="meta">
        ${this.renderAuthor(version)}${this.renderTime(version)}
      </span>
      <div class="body">
        ${
          version.summary
            ? html`<p part="summary" class="summary">${version.summary}</p>`
            : nothing
        }
        ${
          count > 0 || showRestore
            ? html`<div class="actions">
                ${
                  count > 0
                    ? html`<button
                        part="changes-toggle"
                        class="toggle"
                        type="button"
                        aria-expanded=${isOpen ? 'true' : 'false'}
                        aria-controls="changes-${serial}"
                        @click=${() => this.toggleChanges(version)}
                      >
                        ${chevronDown('chevron')}<span>${text.changes(count)}</span>
                      </button>`
                    : nothing
                }
                ${
                  showRestore
                    ? html`<moul-button
                        part="restore"
                        class="restore"
                        size="sm"
                        variant="secondary"
                        state-duration=${RESULT_MS}
                        ?is-disabled=${
                          this.pending !== null && this.pending !== version.id
                        }
                        @press=${(event: Event) => this.restore(version, event)}
                      >
                        <span>${text.restore}</span
                        ><span class="sr-only"> ${title}</span>
                        <span slot="pending">${text.restoring}</span>
                        <span slot="success">${text.restored}</span>
                        <span slot="error">${text.restoreFailed}</span>
                      </moul-button>`
                    : nothing
                }
              </div>`
            : nothing
        }
        ${this.renderChanges(version, isOpen)}
      </div>
    </moul-timeline-item>`
  }

  protected override render() {
    if (this.versions.length === 0) {
      return html`<div part="empty" class="empty">
        <slot name="empty">${this.text.noHistory}</slot>
      </div>`
    }
    return html`<div part="base">
      <moul-timeline
        part="timeline"
        density="compact"
        progress="none"
        label=${this.label}
      >
        ${repeat(
          this.versions,
          (version) => version.id,
          (version) => this.renderVersion(version),
        )}
      </moul-timeline>
    </div>`
  }
}

defineElement('moul-history-ledger', MoulHistoryLedger)

declare global {
  interface HTMLElementTagNameMap {
    'moul-history-ledger': MoulHistoryLedger
  }
}
