import {
  type CSSResultGroup,
  css,
  html,
  LitElement,
  type TemplateResult,
} from 'lit'
import { defineElement } from '../../utils/define-element'
import type { LogFilterLevel, LogItem } from './Logs.types'
import './LogsViewer'
import { parseLogs } from './parseLogs'

/**
 * MoulLogs Custom Element (`moul-logs`).
 * Companion declarative element accepting raw multiline log string input
 * (via `raw` property/attribute or slotted text), parsing it into structured `LogItem[]`,
 * and passing the result to an internal `<moul-logs-viewer>`.
 */
export class MoulLogs extends LitElement {
  static override styles: CSSResultGroup = css`
    :host {
      display: block;
      width: 100%;
    }
    ::slotted(*) {
      display: none;
    }
  `

  static override properties = {
    raw: { type: String, reflect: true },
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
  }

  declare raw: string
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

  private _slottedContent = ''

  constructor() {
    super()
    this.raw = ''
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
  }

  private handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement
    const nodes = slot.assignedNodes({ flatten: true })
    const text = nodes
      .map((node) => node.textContent || '')
      .join('\n')
      .trim()
    if (text !== this._slottedContent) {
      this._slottedContent = text
      this.requestUpdate()
    }
  }

  public get parsedLogs(): LogItem[] {
    const content = this.raw || this._slottedContent || this.textContent || ''
    return parseLogs(content)
  }

  override render(): TemplateResult {
    return html`
      <slot @slotchange=${this.handleSlotChange}></slot>
      <moul-logs-viewer
        .logs=${this.parsedLogs}
        .filterLevel=${this.filterLevel}
        .searchQuery=${this.searchQuery}
        .showTimestamps=${this.showTimestamps}
        .showLineNumbers=${this.showLineNumbers}
        .showLevels=${this.showLevels}
        .showToolbar=${this.showToolbar}
        .wrapLines=${this.wrapLines}
        .compact=${this.compact}
        .virtualized=${this.virtualized}
        .maxHeight=${this.maxHeight}
      ></moul-logs-viewer>
    `
  }
}

defineElement('moul-logs', MoulLogs)

declare global {
  interface HTMLElementTagNameMap {
    'moul-logs': MoulLogs
  }
}
