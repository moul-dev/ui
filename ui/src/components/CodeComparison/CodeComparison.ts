import { html, LitElement, type PropertyValues } from 'lit'
import { CopyController } from '../../controllers/copy.controller'
import { defineElement } from '../../utils/define-element'
import { type CodeToken, highlightLines } from '../../utils/highlight'
import { check, copy } from '../../utils/icons'
import {
  type CodeSource,
  readLightSources,
  renderTokens,
} from '../CodeBlock/code-view'
import { codeComparisonStyles } from './CodeComparison.styles'
import {
  changedSpan,
  type DiffKind,
  type DiffLine,
  diffLines,
  markSpan,
  type SplitRow,
  splitRows,
} from './diff'

export type CodeComparisonLayout = 'split' | 'unified'
export type CodeComparisonSide = 'before' | 'after'

export interface CodeComparisonCopyDetail {
  code: string
  side: CodeComparisonSide
  isCopied: boolean
}

/** Containers narrower than this show a split comparison as unified. */
const SPLIT_MIN_WIDTH = 576

interface Comparison {
  key: string
  before: CodeToken[][]
  after: CodeToken[][]
  lines: DiffLine[]
  rows: SplitRow[]
  /** The changed part of each paired line, by line index on each side. */
  spans: {
    before: Map<number, [number, number]>
    after: Map<number, [number, number]>
  }
  removed: number
  added: number
}

const lineText = (tokens: CodeToken[] | undefined) =>
  (tokens ?? []).map((token) => token.text).join('')

/**
 * Two versions of a snippet compared line by line: removed lines are marked
 * on the before side, added lines on the after side, and gaps keep the two
 * sides aligned. Where a line was edited rather than replaced, the part that
 * changed is marked more strongly. Give the versions as `before-code` and
 * `after-code`,
 * or in the markup as two `<script type="text/plain">` or `<template>`
 * children (the first is before), whose `data-label` names each side. The
 * code is highlighted like `<moul-code-block>`, in `language`.
 * `layout="split"` (the default) puts the versions side by side, and falls
 * back to one column in containers narrower than 36rem; `layout="unified"`
 * always shows one column, removals above additions. Lines wrap, so the two
 * sides stay level.
 *
 * Keyboard and screen readers: the only controls are the copy buttons,
 * native buttons named "Copy" plus the side's label, which say "Copied" in
 * a polite live region. The coloured view is hidden from screen readers;
 * instead they read a plain version: a group named "Changes from Before to
 * After" that starts with how many lines were removed and added and then
 * reads every line in order, prefixed with `removed-label` or `added-label`
 * when it changed.
 *
 * Reduced motion: the comparison does not move. Only the copy icon animates
 * into a check, and it swaps without scaling.
 *
 * @slot - Two `<script type="text/plain">` or `<template>` children, before and after. Not rendered as is.
 * @fires codecopy - A copy button was used; `detail` is `{ code, side, isCopied }`.
 * @csspart base - The frame around everything.
 * @csspart header - The bar with the labels, counts and copy buttons.
 * @csspart label - Each side's label.
 * @csspart stats - The counts of removed and added lines.
 * @csspart copy-button - Each copy button.
 * @csspart scroller - The scrolling box around the lines.
 * @csspart diff - The grid of lines.
 * @cssprop --code-comparison-max-height - Height above which the lines scroll. Defaults to `none`.
 */
export class MoulCodeComparison extends LitElement {
  static override styles = codeComparisonStyles

  static override properties = {
    beforeCode: { type: String, attribute: 'before-code' },
    afterCode: { type: String, attribute: 'after-code' },
    language: { type: String, reflect: true },
    beforeLabel: { type: String, attribute: 'before-label' },
    afterLabel: { type: String, attribute: 'after-label' },
    layout: { type: String, reflect: true },
    removedLabel: { type: String, attribute: 'removed-label' },
    addedLabel: { type: String, attribute: 'added-label' },
    lightSources: { state: true },
    isNarrow: { state: true },
  }

  /** The old version. Takes precedence over the first snippet in the markup. */
  declare beforeCode: string
  /** The new version. Takes precedence over the second snippet in the markup. */
  declare afterCode: string
  /** The highlighting language, as in `<moul-code-block>`. */
  declare language: string
  declare beforeLabel: string
  declare afterLabel: string
  declare layout: CodeComparisonLayout
  /** Read before a removed line by screen readers. */
  declare removedLabel: string
  /** Read before an added line by screen readers. */
  declare addedLabel: string
  /** @internal */
  declare lightSources: CodeSource[]
  /** @internal */
  declare isNarrow: boolean

  private readonly copier = new CopyController(this)
  private observer: MutationObserver | null = null
  private resizeObserver: ResizeObserver | null = null
  private comparison: Comparison | null = null

  constructor() {
    super()
    this.beforeCode = ''
    this.afterCode = ''
    this.language = ''
    this.beforeLabel = ''
    this.afterLabel = ''
    this.layout = 'split'
    this.removedLabel = 'Removed'
    this.addedLabel = 'Added'
    this.lightSources = []
    this.isNarrow = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.readMarkup()
    this.observer = new MutationObserver(() => this.readMarkup())
    this.observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['data-label', 'data-language'],
    })
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(() => this.measure())
      this.resizeObserver.observe(this)
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.observer?.disconnect()
    this.observer = null
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }

  /** Copies one side's code, as its copy button does. */
  public async copy(side: CodeComparisonSide = 'after'): Promise<boolean> {
    const code = side === 'before' ? this.oldCode : this.newCode
    const isCopied = await this.copier.copy(code, side)
    this.dispatchEvent(
      new CustomEvent<CodeComparisonCopyDetail>('codecopy', {
        bubbles: true,
        composed: true,
        detail: { code, side, isCopied },
      }),
    )
    return isCopied
  }

  private get oldCode(): string {
    return this.beforeCode || this.lightSources[0]?.code || ''
  }

  private get newCode(): string {
    return this.afterCode || this.lightSources[1]?.code || ''
  }

  private readMarkup(): void {
    const next = readLightSources(this)
    // Text alone is not a comparison; it takes two snippets.
    const sources = next.length >= 2 ? next : []
    if (JSON.stringify(sources) !== JSON.stringify(this.lightSources)) {
      this.lightSources = sources
    }
  }

  private measure(): void {
    const width = this.getBoundingClientRect().width
    const isNarrow = width > 0 && width < SPLIT_MIN_WIDTH
    if (isNarrow !== this.isNarrow) this.isNarrow = isNarrow
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('layout') && this.layout !== 'unified') {
      this.layout = 'split'
    }
  }

  private compare(language: string): Comparison {
    const beforeCode = this.oldCode
    const afterCode = this.newCode
    const key = `${language}\u0000${beforeCode}\u0000${afterCode}`
    if (this.comparison?.key === key) return this.comparison
    const before = highlightLines(beforeCode, language)
    const after = highlightLines(afterCode, language)
    const lines = diffLines(beforeCode.split('\n'), afterCode.split('\n'))
    const rows = splitRows(lines)
    const spans: Comparison['spans'] = { before: new Map(), after: new Map() }
    for (const row of rows) {
      if (!row.isChanged || row.before === undefined || row.after === undefined)
        continue
      const span = changedSpan(
        lineText(before[row.before]),
        lineText(after[row.after]),
      )
      if (!span) continue
      spans.before.set(row.before, span.before)
      spans.after.set(row.after, span.after)
    }
    this.comparison = {
      key,
      before,
      after,
      lines,
      rows,
      spans,
      removed: lines.filter((line) => line.kind === 'removed').length,
      added: lines.filter((line) => line.kind === 'added').length,
    }
    return this.comparison
  }

  /** A line number and the line itself, or an empty gap when `index` is missing. */
  private renderLine(
    comparison: Comparison,
    side: CodeComparisonSide,
    index: number | undefined,
    kind: DiffKind,
  ) {
    if (index === undefined) {
      return html`<span class="num" data-kind="empty"></span><span class="cell" data-kind="empty"></span>`
    }
    return html`<span class="num" data-kind=${kind}>${index + 1}</span>${this.renderCell(comparison, side, index, kind)}`
  }

  private renderSplit(comparison: Comparison) {
    return comparison.rows.map((row) => {
      const kindBefore: DiffKind = row.isChanged ? 'removed' : 'same'
      const kindAfter: DiffKind = row.isChanged ? 'added' : 'same'
      return html`${this.renderLine(comparison, 'before', row.before, kindBefore)}${this.renderLine(comparison, 'after', row.after, kindAfter)}`
    })
  }

  /** A line without its number. Lines wrap with their whitespace kept, so the markup stays on one line. */
  private renderCell(
    comparison: Comparison,
    side: CodeComparisonSide,
    index: number | undefined,
    kind: DiffKind,
  ) {
    const tokens = markSpan(
      index === undefined ? [] : (comparison[side][index] ?? []),
      index === undefined ? null : (comparison.spans[side].get(index) ?? null),
    )
    const sign = kind === 'removed' ? '-' : kind === 'added' ? '+' : ' '
    return html`<span class="cell" data-kind=${kind}><span class="sign">${sign}</span><span class="text">${tokens.map((token) => (token.isChange ? html`<span class="change">${renderTokens([token])}</span>` : renderTokens([token])))}</span></span>`
  }

  /** The plain reading for screen readers. */
  private renderReading(
    comparison: Comparison,
    beforeLabel: string,
    afterLabel: string,
  ) {
    return html`
      <div
        class="sr-only"
        role="group"
        aria-label="Changes from ${beforeLabel} to ${afterLabel}"
      >
        <p>
          ${this.removedLabel}: ${comparison.removed}. ${this.addedLabel}:
          ${comparison.added}.
        </p>
        ${comparison.lines.map((line) => {
          const text =
            line.kind === 'added'
              ? lineText(comparison.after[line.after ?? 0])
              : lineText(comparison.before[line.before ?? 0])
          const prefix =
            line.kind === 'removed'
              ? `${this.removedLabel}: `
              : line.kind === 'added'
                ? `${this.addedLabel}: `
                : ''
          return html`<p>${prefix}${text}</p>`
        })}
      </div>
    `
  }

  private renderCopy(side: CodeComparisonSide, label: string) {
    const name = `Copy ${label}`
    return html`
      <button
        part="copy-button"
        class="copy-button"
        type="button"
        aria-label=${name}
        title=${name}
        ?data-copied=${this.copier.isCopied(side)}
        @click=${() => this.copy(side)}
      >
        ${copy('icon-copy')} ${check('icon-check')}
      </button>
    `
  }

  private renderStats(comparison: Comparison) {
    return html`
      <span part="stats" class="stats" aria-hidden="true">
        <span class="removed">−${comparison.removed}</span>
        <span class="added">+${comparison.added}</span>
      </span>
    `
  }

  protected override render() {
    const language =
      this.language ||
      this.lightSources[0]?.language ||
      this.lightSources[1]?.language ||
      ''
    const comparison = this.compare(language)
    const beforeLabel =
      this.beforeLabel || this.lightSources[0]?.label || 'Before'
    const afterLabel = this.afterLabel || this.lightSources[1]?.label || 'After'
    const isSplit = this.layout === 'split' && !this.isNarrow
    const digits = String(
      Math.max(comparison.before.length, comparison.after.length),
    ).length
    const status =
      this.copier.status === 'copied'
        ? 'Copied'
        : this.copier.status === 'failed'
          ? 'Could not copy'
          : ''

    return html`
      <div part="base" class="base" style="--_digits: ${digits}">
        <div part="header" class="header ${isSplit ? 'split' : 'unified'}">
          ${
            isSplit
              ? html`
                <div class="side">
                  <span part="label" class="label">${beforeLabel}</span>
                  ${this.renderCopy('before', beforeLabel)}
                </div>
                <div class="side">
                  <span part="label" class="label">${afterLabel}</span>
                  ${this.renderStats(comparison)}
                  ${this.renderCopy('after', afterLabel)}
                </div>
              `
              : html`
                <div class="side">
                  <span part="label" class="label">${beforeLabel}</span>
                  <span class="arrow" aria-hidden="true">→</span>
                  <span part="label" class="label">${afterLabel}</span>
                  ${this.renderStats(comparison)}
                  ${this.renderCopy('after', afterLabel)}
                </div>
              `
          }
        </div>
        <div part="scroller" class="scroller">
          <div
            part="diff"
            class="diff ${isSplit ? 'split' : 'unified'}"
            aria-hidden="true"
          >
            ${isSplit ? this.renderSplit(comparison) : this.renderUnifiedRows(comparison)}
          </div>
        </div>
        ${this.renderReading(comparison, beforeLabel, afterLabel)}
        <span class="sr-only" role="status">${status}</span>
      </div>
    `
  }

  private renderUnifiedRows(comparison: Comparison) {
    return comparison.lines.map((line) => {
      const isAdded = line.kind === 'added'
      const side: CodeComparisonSide = isAdded ? 'after' : 'before'
      const index = isAdded ? line.after : line.before
      const oldNumber =
        line.kind === 'added' ? '' : String((line.before ?? 0) + 1)
      const newNumber =
        line.kind === 'removed' ? '' : String((line.after ?? 0) + 1)
      return html`<span class="num" data-kind=${line.kind}>${oldNumber}</span><span class="num" data-kind=${line.kind}>${newNumber}</span>${this.renderCell(comparison, side, index, line.kind)}`
    })
  }
}

defineElement('moul-code-comparison', MoulCodeComparison)

declare global {
  interface HTMLElementTagNameMap {
    'moul-code-comparison': MoulCodeComparison
  }
}
