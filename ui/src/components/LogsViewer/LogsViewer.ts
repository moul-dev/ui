import { virtualize } from '@lit-labs/virtualizer/virtualize.js'
import {
  type CSSResultGroup,
  html,
  LitElement,
  type PropertyValues,
  type TemplateResult,
} from 'lit'
import { defineElement } from '../../utils/define-element'
import { animateActiveIndicator } from '../../utils/motion'
import '../Drawer/Drawer'
import type {
  HighlightTextProps,
  LogAttributeChipProps,
  LogCopyIconButtonProps,
  LogFilterLevel,
  LogItem,
  LogLevel,
  LogLevelBadgeProps,
} from './Logs.types'
import { logsViewerStyles } from './LogsViewer.styles'

const FILTER_LEVELS: LogFilterLevel[] = [
  'all',
  'info',
  'warn',
  'error',
  'debug',
]

/**
 * Pure template helper to highlight matching search query substrings.
 */
export function HighlightText({
  text,
  query,
}: HighlightTextProps): TemplateResult | string {
  if (!query?.trim() || !text) {
    return text
  }

  const trimmedQuery = query.trim()
  const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const splitRegex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(splitRegex)
  const lowerQuery = trimmedQuery.toLowerCase()

  return html`${parts.map((part) =>
    part.toLowerCase() === lowerQuery
      ? html`<mark class="highlight" part="highlight">${part}</mark>`
      : part,
  )}`
}

function formatAttributeValue(value: LogAttributeChipProps['value']): string {
  return typeof value === 'object' && value !== null
    ? JSON.stringify(value)
    : String(value)
}

/**
 * Pure template helper for an attribute key-value chip.
 */
export function LogAttributeChip({
  name,
  value,
}: LogAttributeChipProps): TemplateResult {
  return html`
    <span class="attribute-chip" part="attribute-chip">
      <span class="attribute-key">${name}=</span>
      <span class="attribute-val">${formatAttributeValue(value)}</span>
    </span>
  `
}

/**
 * Pure template helper for log severity level badge.
 */
export function LogLevelBadge({
  level = 'info',
}: LogLevelBadgeProps): TemplateResult {
  const normalized = (
    typeof level === 'string' ? level : String(level || 'info')
  ).toLowerCase()
  return html`
    <span
      class="level-badge level-${normalized}"
      part="cell-level"
    >${normalized}</span>
  `
}

/**
 * Pure template helper for log copy button.
 */
export function LogCopyIconButton({
  content = '',
  label = 'Copy',
}: LogCopyIconButtonProps): TemplateResult {
  const handleCopy = (e: Event) => {
    e.stopPropagation()
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(content).catch(() => {})
    }
  }

  return html`
    <button
      type="button"
      class="tool-btn"
      aria-label=${label}
      title=${label}
      @click=${handleCopy}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </svg>
      <span>${label}</span>
    </button>
  `
}

/**
 * MoulLogsViewer Custom Element (`moul-logs-viewer`).
 * Virtualized, interactive log viewer component with filtering, search, line wrapping,
 * active indicator animation, and a log detail drawer opened by clicking a row.
 */
export class MoulLogsViewer extends LitElement {
  static override styles: CSSResultGroup = logsViewerStyles

  static override properties = {
    logs: { type: Array, attribute: false },
    filterLevel: { type: String, attribute: 'filter-level', reflect: true },
    searchQuery: { type: String, attribute: 'search-query', reflect: true },
    showTimestamps: {
      type: Boolean,
      attribute: 'show-timestamps',
      reflect: true,
    },
    showLineNumbers: {
      type: Boolean,
      attribute: 'show-line-numbers',
      reflect: true,
    },
    showLevels: { type: Boolean, attribute: 'show-levels', reflect: true },
    showToolbar: { type: Boolean, attribute: 'show-toolbar', reflect: true },
    wrapLines: { type: Boolean, attribute: 'wrap-lines', reflect: true },
    compact: { type: Boolean, attribute: 'compact', reflect: true },
    virtualized: { type: Boolean, attribute: 'virtualized', reflect: true },
    maxHeight: { type: String, attribute: 'max-height', reflect: true },
    selectedId: { type: String, attribute: 'selected-id', reflect: true },
    isInspectorOpen: {
      type: Boolean,
      attribute: 'is-inspector-open',
      reflect: true,
    },
    title: { type: String, reflect: true },
    searchPlaceholder: { type: String, attribute: 'search-placeholder' },
  }

  declare logs: LogItem[]
  declare filterLevel: LogFilterLevel
  declare searchQuery: string
  declare showTimestamps: boolean
  declare showLineNumbers: boolean
  declare showLevels: boolean
  declare showToolbar: boolean
  declare wrapLines: boolean
  declare compact: boolean
  declare virtualized: boolean
  declare maxHeight: string
  declare selectedId: string | number | null
  declare isInspectorOpen: boolean
  declare title: string
  declare searchPlaceholder: string

  private previousIndicatorRect: DOMRect | null = null
  /** Last log shown in the drawer, kept so its content stays put while the drawer slides out. */
  private inspectedLog: LogItem | null = null

  constructor() {
    super()
    this.logs = []
    this.filterLevel = 'all'
    this.searchQuery = ''
    this.showTimestamps = true
    this.showLineNumbers = true
    this.showLevels = true
    this.showToolbar = true
    this.wrapLines = false
    this.compact = false
    this.virtualized = true
    this.maxHeight = '600px'
    this.selectedId = null
    this.isInspectorOpen = false
    this.title = ''
    this.searchPlaceholder = 'Filter logs...'
  }

  private _resizeObserver: ResizeObserver | null = null
  private _hasDimensions = false

  override connectedCallback(): void {
    super.connectedCallback()
    if (this.hasUpdated && !this._resizeObserver) {
      this.setupResizeObserver()
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.cleanupResizeObserver()
  }

  protected override firstUpdated(): void {
    this.updateIndicator(false)
    this.setupResizeObserver()
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)
    if (changedProperties.has('filterLevel')) {
      this.updateIndicator(true)
    }
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') return
    const container = this.shadowRoot?.querySelector('.scroll-container')
    if (!container) return

    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height, width } = entry.contentRect || { height: 0, width: 0 }
        const hasDim = height > 0 || width > 0
        if (hasDim !== this._hasDimensions) {
          this._hasDimensions = hasDim
          this.requestUpdate()
        }
      }
    })
    this._resizeObserver.observe(container)
  }

  private cleanupResizeObserver(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
      this._resizeObserver = null
    }
  }

  private hasContainerDimensions(): boolean {
    if (typeof window === 'undefined') return false
    if (this._hasDimensions) return true
    const container = this.shadowRoot?.querySelector('.scroll-container')
    return (
      this.offsetHeight > 0 ||
      (container?.clientHeight ?? 0) > 0 ||
      (container?.getBoundingClientRect?.()?.height ?? 0) > 0
    )
  }

  public get filteredLogs(): LogItem[] {
    const rawLogs = Array.isArray(this.logs) ? this.logs : []
    const level = this.filterLevel
    const query = this.searchQuery.trim().toLowerCase()

    return rawLogs.filter((log) => {
      if (!log || typeof log !== 'object') return false

      // 1. Level filtering
      if (level !== 'all') {
        const logLev = (
          typeof log.level === 'string'
            ? log.level
            : String(log.level || 'info')
        ).toLowerCase()
        if (level === 'error') {
          if (logLev !== 'error' && logLev !== 'fatal') return false
        } else if (level === 'warn') {
          if (logLev !== 'warn') return false
        } else if (level === 'info') {
          if (logLev !== 'info') return false
        } else if (level === 'debug') {
          if (logLev !== 'debug' && logLev !== 'trace') return false
        } else if (logLev !== level) {
          return false
        }
      }

      // 2. Search query filtering
      if (query) {
        const inMessage = (log.message || '').toLowerCase().includes(query)
        const inLevel = (
          typeof log.level === 'string' ? log.level : String(log.level || '')
        )
          .toLowerCase()
          .includes(query)
        const inTimestamp = (log.timestamp || '').toLowerCase().includes(query)
        let inAttrs = false

        if (log.attributes && typeof log.attributes === 'object') {
          for (const [k, v] of Object.entries(log.attributes)) {
            if (
              k.toLowerCase().includes(query) ||
              String(v).toLowerCase().includes(query)
            ) {
              inAttrs = true
              break
            }
          }
        }

        const inRaw = (log.raw || '').toLowerCase().includes(query)
        if (!inMessage && !inLevel && !inTimestamp && !inAttrs && !inRaw) {
          return false
        }
      }

      return true
    })
  }

  private updateIndicator(animate = true): void {
    const activeBtn = this.shadowRoot?.querySelector<HTMLButtonElement>(
      `.filter-pill[data-level="${this.filterLevel}"]`,
    )
    const indicator =
      this.shadowRoot?.querySelector<HTMLElement>('.filter-indicator')
    if (!activeBtn || !indicator) return

    const nextRect = activeBtn.getBoundingClientRect()
    indicator.style.left = `${activeBtn.offsetLeft}px`
    indicator.style.width = `${activeBtn.offsetWidth}px`

    if (
      animate &&
      this.previousIndicatorRect &&
      nextRect.width > 0 &&
      nextRect.height > 0
    ) {
      animateActiveIndicator(indicator, this.previousIndicatorRect, nextRect)
    }

    this.previousIndicatorRect = nextRect
  }

  private readonly handleLevelClick = (level: LogFilterLevel): void => {
    const activeBtn = this.shadowRoot?.querySelector<HTMLButtonElement>(
      `.filter-pill[data-level="${this.filterLevel}"]`,
    )
    if (activeBtn) {
      this.previousIndicatorRect = activeBtn.getBoundingClientRect()
    }

    this.filterLevel = level
    this.dispatchEvent(
      new CustomEvent('filterlevelchange', {
        bubbles: true,
        composed: true,
        detail: { filterLevel: this.filterLevel },
      }),
    )
    this.dispatchEvent(
      new CustomEvent('filterchange', {
        bubbles: true,
        composed: true,
        detail: {
          filterLevel: this.filterLevel,
          searchQuery: this.searchQuery,
        },
      }),
    )
  }

  private readonly handleSearchInput = (e: Event): void => {
    const target = e.target as HTMLInputElement
    this.searchQuery = target.value
    this.dispatchEvent(
      new CustomEvent('searchchange', {
        bubbles: true,
        composed: true,
        detail: { searchQuery: this.searchQuery },
      }),
    )
    this.dispatchEvent(
      new CustomEvent('filterchange', {
        bubbles: true,
        composed: true,
        detail: {
          filterLevel: this.filterLevel,
          searchQuery: this.searchQuery,
        },
      }),
    )
  }

  private readonly handleClearSearch = (): void => {
    this.searchQuery = ''
    this.dispatchEvent(
      new CustomEvent('searchchange', {
        bubbles: true,
        composed: true,
        detail: { searchQuery: '' },
      }),
    )
    this.dispatchEvent(
      new CustomEvent('filterchange', {
        bubbles: true,
        composed: true,
        detail: {
          filterLevel: this.filterLevel,
          searchQuery: '',
        },
      }),
    )
  }

  private readonly handleClearAll = (): void => {
    this.dispatchEvent(
      new CustomEvent('clear', {
        bubbles: true,
        composed: true,
        detail: {},
      }),
    )
  }

  private readonly toggleTimestamps = (): void => {
    this.showTimestamps = !this.showTimestamps
  }

  private readonly toggleWrap = (): void => {
    this.wrapLines = !this.wrapLines
  }

  private readonly handleRowClick = (item: LogItem): void => {
    this.selectedId = item.id
    this.isInspectorOpen = true

    this.dispatchEvent(
      new CustomEvent('logselect', {
        bubbles: true,
        composed: true,
        detail: { log: item },
      }),
    )
    this.dispatchEvent(
      new CustomEvent('rowclick', {
        bubbles: true,
        composed: true,
        detail: { log: item },
      }),
    )
  }

  private readonly closeInspector = (): void => {
    this.isInspectorOpen = false
    this.selectedId = null
  }

  // The drawer reports Escape and backdrop dismissal here; keep its event inside the viewer.
  private readonly handleInspectorOpenChange = (e: CustomEvent): void => {
    e.stopPropagation()
    if (!e.detail?.isOpen) {
      this.closeInspector()
    }
  }

  private readonly handleCopyAll = (): void => {
    const items = this.filteredLogs
    const text = items.map((i) => i.raw || i.message).join('\n')
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  private readonly handleDownload = (): void => {
    const items = this.filteredLogs
    const text = items.map((i) => i.raw || i.message).join('\n')
    if (typeof document !== 'undefined') {
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs-${new Date().toISOString().slice(0, 10)}.log`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  private renderRow(item: LogItem, idx: number): TemplateResult {
    const isSelected =
      this.selectedId !== null && String(this.selectedId) === String(item.id)
    const lineNum = item.lineNumber ?? idx + 1
    const level = (
      typeof item.level === 'string' ? item.level : String(item.level || 'info')
    ).toLowerCase() as LogLevel

    return html`
      <div
        class="row ${isSelected ? 'selected' : ''} ${this.compact ? 'compact' : ''}"
        part="row"
        role="row"
        tabindex="0"
        aria-selected=${isSelected ? 'true' : 'false'}
        data-id=${item.id}
        @click=${() => this.handleRowClick(item)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            this.handleRowClick(item)
          }
        }}
      >
        ${
          this.showLineNumbers
            ? html`
              <div class="cell cell-line" part="cell-linenumber" role="cell">
                ${lineNum}
              </div>
            `
            : ''
        }
        ${
          this.showTimestamps
            ? html`
              <div class="cell cell-time" part="cell-timestamp" role="cell">
                ${HighlightText({ text: item.timestamp || '', query: this.searchQuery })}
              </div>
            `
            : ''
        }
        ${
          this.showLevels
            ? html`
              <div class="cell cell-level" part="cell-level" role="cell">
                ${LogLevelBadge({ level })}
              </div>
            `
            : ''
        }
        <div class="cell cell-message" part="cell-message" role="cell">
          <span class="message-text">${HighlightText({ text: item.message, query: this.searchQuery })}</span>
          ${
            item.attributes && Object.keys(item.attributes).length > 0
              ? html`
                <span class="attributes-wrapper" part="attributes">
                  ${Object.entries(item.attributes).map(([k, v]) =>
                    LogAttributeChip({ name: k, value: v }),
                  )}
                </span>
              `
              : ''
          }
        </div>
      </div>
    `
  }

  private get selectedLog(): LogItem | null {
    if (this.selectedId === null) return null
    return (
      (this.logs || []).find(
        (l) => l && String(l.id) === String(this.selectedId),
      ) ?? null
    )
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)
    this.inspectedLog = this.selectedLog ?? this.inspectedLog
  }

  private renderInspector(item: LogItem): TemplateResult {
    const attrs = Object.entries(item.attributes || {})
    const rawContent = item.raw || item.message
    const level = (
      typeof item.level === 'string' ? item.level : String(item.level || 'info')
    ).toLowerCase()

    return html`
      <div slot="header" class="inspector-header" part="inspector-header">
        <h2 class="inspector-title">Log details</h2>
        <button
          type="button"
          class="inspector-close-btn"
          aria-label="Close log details"
          @click=${this.closeInspector}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="inspector-body">
        <dl class="inspector-meta" part="inspector-meta">
          <div class="inspector-meta-item">
            <dt>Level</dt>
            <dd>${LogLevelBadge({ level })}</dd>
          </div>
          ${
            item.timestamp
              ? html`
                <div class="inspector-meta-item">
                  <dt>Timestamp</dt>
                  <dd>${item.timestamp}</dd>
                </div>
              `
              : ''
          }
          ${
            item.lineNumber !== undefined
              ? html`
                <div class="inspector-meta-item">
                  <dt>Line</dt>
                  <dd>${item.lineNumber}</dd>
                </div>
              `
              : ''
          }
        </dl>

        <section class="inspector-section">
          <h3 class="inspector-label">Message</h3>
          <p class="inspector-message" part="inspector-message">${item.message}</p>
        </section>

        ${
          attrs.length > 0
            ? html`
              <section class="inspector-section">
                <h3 class="inspector-label">
                  Attributes <span class="inspector-count">${attrs.length}</span>
                </h3>
                <dl class="inspector-attrs" part="inspector-attrs">
                  ${attrs.map(
                    ([k, v]) => html`
                      <div class="inspector-attr-row">
                        <dt class="attribute-key">${k}</dt>
                        <dd class="attribute-val">${formatAttributeValue(v)}</dd>
                      </div>
                    `,
                  )}
                </dl>
              </section>
            `
            : ''
        }

        <section class="inspector-section">
          <div class="inspector-section-header">
            <h3 class="inspector-label">Raw</h3>
            ${LogCopyIconButton({ content: rawContent, label: 'Copy' })}
          </div>
          <pre class="inspector-raw" part="inspector-raw"><code>${rawContent}</code></pre>
        </section>
      </div>
    `
  }

  override render(): TemplateResult {
    const filtered = this.filteredLogs
    const totalCount = Array.isArray(this.logs) ? this.logs.length : 0
    const filteredCount = filtered.length

    return html`
      <div class="container" part="container">
        ${
          this.showToolbar
            ? html`
              <div class="toolbar" part="toolbar" role="toolbar" aria-label="Logs Filter Toolbar">
                <div class="toolbar-left">
                  <div class="search-box" part="search">
                    <svg
                      class="search-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                      type="text"
                      class="search-input"
                      placeholder=${this.searchPlaceholder}
                      .value=${this.searchQuery}
                      aria-label="Filter logs"
                      @input=${this.handleSearchInput}
                    />
                    ${
                      this.searchQuery
                        ? html`
                          <button
                            type="button"
                            class="search-clear-btn"
                            aria-label="Clear search"
                            @click=${this.handleClearSearch}
                          >
                            ✕
                          </button>
                        `
                        : ''
                    }
                  </div>

                  <div class="filter-group" part="filter-group" role="radiogroup" aria-label="Filter by level">
                    <div class="filter-indicator" part="filter-indicator"></div>
                    ${FILTER_LEVELS.map(
                      (level) => html`
                        <button
                          type="button"
                          class="filter-pill ${this.filterLevel === level ? 'active' : ''}"
                          part="filter-pill"
                          role="radio"
                          data-level=${level}
                          aria-checked=${this.filterLevel === level ? 'true' : 'false'}
                          aria-pressed=${this.filterLevel === level ? 'true' : 'false'}
                          @click=${() => this.handleLevelClick(level)}
                        >
                          ${level}
                        </button>
                      `,
                    )}
                  </div>
                </div>

                <div class="toolbar-right">
                  <span class="counts-badge" part="counts" aria-live="polite">
                    ${filteredCount} / ${totalCount} events
                  </span>

                  <button
                    type="button"
                    class="tool-btn ${this.showTimestamps ? 'active' : ''}"
                    title="Toggle timestamps"
                    aria-label="Toggle timestamps"
                    aria-pressed=${this.showTimestamps ? 'true' : 'false'}
                    @click=${this.toggleTimestamps}
                  >
                    <span>T</span>
                  </button>

                  <button
                    type="button"
                    class="tool-btn ${this.wrapLines ? 'active' : ''}"
                    title="Toggle line wrapping"
                    aria-label="Toggle line wrapping"
                    aria-pressed=${this.wrapLines ? 'true' : 'false'}
                    @click=${this.toggleWrap}
                  >
                    <span>W</span>
                  </button>

                  <button
                    type="button"
                    class="tool-btn"
                    title="Copy filtered logs"
                    aria-label="Copy logs"
                    @click=${this.handleCopyAll}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    class="tool-btn"
                    title="Download logs"
                    aria-label="Download logs"
                    @click=${this.handleDownload}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    class="tool-btn"
                    title="Clear view"
                    aria-label="Clear view"
                    @click=${this.handleClearAll}
                  >
                    ✕
                  </button>
                </div>
              </div>
            `
            : ''
        }

        <div
          class="scroll-container ${this.wrapLines ? 'wrap-lines' : 'no-wrap'}"
          part="scroll-container"
          style="max-height: ${this.maxHeight};"
          role="region"
          aria-label="Logs Stream"
        >
          <div class="logs-table" part="table" role="table">
            ${
              filtered.length === 0
                ? html`
                  <div class="empty-state" part="empty" role="cell">
                    No logs match your filter criteria.
                  </div>
                `
                : this.virtualized &&
                    filtered.length > 50 &&
                    this.hasContainerDimensions()
                  ? virtualize({
                      items: filtered,
                      renderItem: (item: LogItem, idx: number) =>
                        this.renderRow(item, idx),
                    })
                  : filtered.map((item, idx) => this.renderRow(item, idx))
            }
          </div>
        </div>

        <moul-drawer
          part="inspector"
          placement="right"
          size="lg"
          .isOpen=${this.isInspectorOpen && this.selectedLog !== null}
          @openchange=${this.handleInspectorOpenChange}
        >
          ${this.inspectedLog ? this.renderInspector(this.inspectedLog) : ''}
        </moul-drawer>
      </div>
    `
  }
}

defineElement('moul-logs-viewer', MoulLogsViewer)

declare global {
  interface HTMLElementTagNameMap {
    'moul-logs-viewer': MoulLogsViewer
  }
}
