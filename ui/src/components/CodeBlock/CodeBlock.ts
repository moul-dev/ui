import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { CopyController } from '../../controllers/copy.controller'
import { defineElement } from '../../utils/define-element'
import {
  type CodeToken,
  highlightLines,
  languageLabel,
  parseLineList,
} from '../../utils/highlight'
import { check, copy } from '../../utils/icons'
import {
  EASE_OUT,
  placeIndicator,
  prefersReducedMotion,
  SPRING_GENTLE,
  subtleAnimate,
} from '../../utils/motion'
import { codeBlockStyles } from './CodeBlock.styles'
import { type CodeSource, readLightSources, renderTokens } from './code-view'

export interface CodeBlockTab {
  /** The tab's name. */
  label: string
  code: string
  /** This tab's language; defaults to the block's `language`. */
  language?: string
  filename?: string
  /** Lines to highlight, as in `highlight-lines`. */
  highlightLines?: string
}

export interface CodeBlockCopyDetail {
  code: string
  language: string
  /** False when the browser refused the clipboard. */
  isCopied: boolean
}

export interface CodeBlockTabChangeDetail {
  index: number
  label: string
}

/** Blocks on the page, so a tab chosen in one is chosen in the others that share its `sync-key`. */
const blocks = new Set<MoulCodeBlock>()

/**
 * Read-only source code, highlighted, with a copy button and optional tabs
 * for variants of the same snippet (npm, pnpm and yarn; TypeScript and
 * JavaScript). The colours come from the `--color-code-*` tokens and the
 * built-in highlighter, which knows TypeScript, JavaScript, JSON, HTML, CSS,
 * shell, Python, Rust, SQL, YAML and diffs; any other language shows as plain
 * text. Give the code as `code`, as `tabs`, or in the markup: write it as the
 * element's text, or put each tab in a `<script type="text/plain">` or
 * `<template>` child with `data-label` (and optionally `data-language`,
 * `data-filename`, `data-highlight-lines`). Code in markup is dedented.
 * `highlight-lines` marks lines (`"2, 4-6"`), `show-line-numbers` numbers
 * them, `is-wrapped` wraps long ones instead of scrolling, and blocks that
 * share a `sync-key` switch tabs together.
 *
 * Keyboard and screen readers: the copy button is a native button named by
 * `copy-label` ("Copy code"); after a copy, a polite live region says
 * `copied-label` ("Copied"), or `copy-failed-label` when the browser
 * refuses the clipboard. With tabs, the tab row
 * is a `role="tablist"` with one tab stop: `Arrow Left` and `Arrow Right`
 * move between tabs and select them (swapped under `dir="rtl"`), `Home` and
 * `End` jump to the first and last; the code below is their `tabpanel` and
 * takes focus so it can be scrolled with the arrow keys. Without tabs, the
 * code is a `role="group"` named by `label`, the filename or the language
 * ("TypeScript code"), and takes focus only when it overflows and needs
 * scrolling. Line numbers are drawn by CSS and not read out; highlighted
 * lines are only shown, not announced.
 *
 * Reduced motion: switching tabs swaps the code at once instead of fading it
 * in and easing the height, the tab indicator jumps instead of gliding, and
 * the copy icon turns into a check without scaling.
 *
 * @slot - The code, as text, or one `<script type="text/plain">` or `<template>` per tab. Not rendered as is.
 * @fires codecopy - The copy button was used; `detail` is `{ code, language, isCopied }`.
 * @fires tabchange - The user chose another tab; `detail` is `{ index, label }`.
 * @csspart base - The frame around everything.
 * @csspart header - The bar above the code that holds the filename or tabs and the copy button.
 * @csspart filename - The filename in the header.
 * @csspart tabs - The `tablist`.
 * @csspart tab - Each tab button.
 * @csspart indicator - The line under the selected tab.
 * @csspart copy-button - The copy button.
 * @csspart scroller - The scrolling box around the code.
 * @csspart code - The `<pre>` element.
 * @cssprop --code-block-max-height - Height above which the code scrolls. Defaults to `none`.
 * @cssprop --code-block-font-size - Defaults to `var(--font-size-sm)`.
 */
export class MoulCodeBlock extends LitElement {
  static override styles = codeBlockStyles

  static override properties = {
    code: { type: String },
    language: { type: String, reflect: true },
    filename: { type: String },
    highlightLines: { type: String, attribute: 'highlight-lines' },
    showLineNumbers: {
      type: Boolean,
      reflect: true,
      attribute: 'show-line-numbers',
    },
    isWrapped: { type: Boolean, reflect: true, attribute: 'is-wrapped' },
    hideCopy: { type: Boolean, reflect: true, attribute: 'hide-copy' },
    tabs: { attribute: false },
    selectedIndex: { type: Number, attribute: 'selected-index' },
    syncKey: { type: String, attribute: 'sync-key' },
    label: { type: String },
    copyLabel: { type: String, attribute: 'copy-label' },
    copiedLabel: { type: String, attribute: 'copied-label' },
    copyFailedLabel: { type: String, attribute: 'copy-failed-label' },
    lightSources: { state: true },
    isOverflowing: { state: true },
  }

  /** The code to show. Takes precedence over code written in the markup. */
  declare code: string
  /** The highlighting language: `ts`, `js`, `json`, `html`, `css`, `bash`, `python`, `rust`, `sql`, `yaml`, `diff` (and their usual aliases), or anything else for plain text. */
  declare language: string
  /** Shown in the header. Ignored when there are tabs. */
  declare filename: string
  /** Lines to highlight, 1-based: `"3"`, `"1, 4-6"`. */
  declare highlightLines: string
  declare showLineNumbers: boolean
  /** Wrap long lines instead of scrolling sideways. */
  declare isWrapped: boolean
  declare hideCopy: boolean
  /** Variants of the snippet, one tab each. Takes precedence over `code` and the markup. */
  declare tabs: CodeBlockTab[]
  /** The selected tab. */
  declare selectedIndex: number
  /** Blocks with the same key select a tab with the same label together. */
  declare syncKey: string
  /** The code's accessible name when there are no tabs; defaults to the filename or language. */
  declare label: string
  declare copyLabel: string
  declare copiedLabel: string
  declare copyFailedLabel: string
  /** @internal */
  declare lightSources: CodeSource[]
  /** @internal */
  declare isOverflowing: boolean

  private readonly copier = new CopyController(this)
  private observer: MutationObserver | null = null
  private resizeObserver: ResizeObserver | null = null
  private highlighted: { key: string; lines: CodeToken[][] } | null = null
  /** The body's height before a tab switch, so the switch can ease from it. */
  private heightBefore = 0

  constructor() {
    super()
    this.code = ''
    this.language = ''
    this.filename = ''
    this.highlightLines = ''
    this.showLineNumbers = false
    this.isWrapped = false
    this.hideCopy = false
    this.tabs = []
    this.selectedIndex = 0
    this.syncKey = ''
    this.label = ''
    this.copyLabel = 'Copy code'
    this.copiedLabel = 'Copied'
    this.copyFailedLabel = 'Could not copy'
    this.lightSources = []
    this.isOverflowing = false
  }

  /** The snippet shown now. */
  public get currentCode(): string {
    return this.current()?.code ?? ''
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    blocks.add(this)
    this.readMarkup()
    this.observer = new MutationObserver(() => this.readMarkup())
    this.observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        'data-label',
        'data-language',
        'data-filename',
        'data-highlight-lines',
      ],
    })
    if (this.hasUpdated) this.observeSize()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    blocks.delete(this)
    this.observer?.disconnect()
    this.observer = null
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }

  /** Copies the code shown now, as the copy button does. */
  public async copy(): Promise<boolean> {
    const source = this.current()
    const code = source?.code ?? ''
    const isCopied = await this.copier.copy(code)
    this.dispatchEvent(
      new CustomEvent<CodeBlockCopyDetail>('codecopy', {
        bubbles: true,
        composed: true,
        detail: { code, language: this.languageOf(source), isCopied },
      }),
    )
    return isCopied
  }

  private readMarkup(): void {
    const next = readLightSources(this)
    if (JSON.stringify(next) !== JSON.stringify(this.lightSources)) {
      this.lightSources = next
    }
  }

  /** Every snippet, in tab order: `tabs`, else `code`, else the markup. */
  private sources(): CodeSource[] {
    if (Array.isArray(this.tabs) && this.tabs.length > 0) {
      return this.tabs.map((tab) => ({
        label: tab.label ?? '',
        code: tab.code ?? '',
        language: tab.language ?? '',
        filename: tab.filename ?? '',
        highlightLines: tab.highlightLines ?? '',
      }))
    }
    if (this.code) {
      return [
        {
          label: '',
          code: this.code,
          language: '',
          filename: '',
          highlightLines: '',
        },
      ]
    }
    return this.lightSources
  }

  private current(): CodeSource | undefined {
    const sources = this.sources()
    return sources[this.indexIn(sources)]
  }

  private indexIn(sources: CodeSource[]): number {
    const index = Math.trunc(Number(this.selectedIndex) || 0)
    return Math.min(Math.max(index, 0), Math.max(sources.length - 1, 0))
  }

  private languageOf(source: CodeSource | undefined): string {
    return source?.language || this.language || ''
  }

  private linesOf(code: string, language: string): CodeToken[][] {
    const key = `${language}\u0000${code}`
    if (this.highlighted?.key !== key) {
      this.highlighted = { key, lines: highlightLines(code, language) }
    }
    return this.highlighted.lines
  }

  private get body(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>('[part~="body"]')
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('selectedIndex') && this.hasUpdated) {
      this.heightBefore = this.body?.offsetHeight ?? 0
    }
  }

  protected override firstUpdated(): void {
    this.observeSize()
  }

  protected override updated(changed: PropertyValues<this>): void {
    const switched =
      changed.has('selectedIndex') && changed.get('selectedIndex') !== undefined
    this.placeTabIndicator(!switched)
    if (switched) this.animateSwitch()
    this.measureOverflow()
  }

  /** Eases the body from its old height to the new one and fades the new code in. */
  private animateSwitch(): void {
    const body = this.body
    const code = this.renderRoot.querySelector('[part~="code"]')
    if (!body || !code || prefersReducedMotion()) return
    const from = this.heightBefore
    const to = body.offsetHeight
    subtleAnimate(
      code,
      { opacity: [0, 1], transform: ['translateY(4px)', 'translateY(0px)'] },
      { duration: 0.22, ease: EASE_OUT },
    )
    if (!from || Math.abs(from - to) < 1) return
    body.style.overflow = 'hidden'
    const glide = subtleAnimate(
      body,
      { height: [`${from}px`, `${to}px`] },
      SPRING_GENTLE,
    )
    const settle = (): void => {
      body.style.removeProperty('height')
      body.style.removeProperty('overflow')
    }
    glide.finished.then(settle, settle)
  }

  private placeTabIndicator(instant: boolean): void {
    const tablist = this.renderRoot.querySelector<HTMLElement>('[part~="tabs"]')
    const indicator = this.renderRoot.querySelector<HTMLElement>(
      '[part~="indicator"]',
    )
    if (!tablist || !indicator) return
    const tab = tablist.querySelector<HTMLElement>('[aria-selected="true"]')
    placeIndicator(indicator, tablist, tab, instant)
  }

  private observeSize(): void {
    if (this.resizeObserver || typeof ResizeObserver !== 'function') return
    this.resizeObserver = new ResizeObserver(() => {
      this.measureOverflow()
      this.placeTabIndicator(true)
    })
    this.resizeObserver.observe(this)
  }

  /** A scrolling box must take focus so keyboard users can scroll it. */
  private measureOverflow(): void {
    const scroller =
      this.renderRoot.querySelector<HTMLElement>('[part~="scroller"]')
    if (!scroller) return
    const isOverflowing =
      scroller.scrollWidth > scroller.clientWidth + 1 ||
      scroller.scrollHeight > scroller.clientHeight + 1
    if (isOverflowing !== this.isOverflowing) {
      this.isOverflowing = isOverflowing
    }
  }

  private selectTab(index: number, sources: CodeSource[], sync = true): void {
    if (index === this.indexIn(sources)) return
    this.selectedIndex = index
    const label = sources[index]?.label ?? ''
    this.dispatchEvent(
      new CustomEvent<CodeBlockTabChangeDetail>('tabchange', {
        bubbles: true,
        composed: true,
        detail: { index, label },
      }),
    )
    if (!sync || !this.syncKey || !label) return
    for (const block of blocks) {
      if (block === this || block.syncKey !== this.syncKey) continue
      const others = block.sources()
      const match = others.findIndex((source) => source.label === label)
      if (match >= 0) block.selectTab(match, others, false)
    }
  }

  private handleTabKeydown(event: KeyboardEvent, sources: CodeSource[]): void {
    const count = sources.length
    const index = this.indexIn(sources)
    const isRtl = getComputedStyle(this).direction === 'rtl'
    const forward = isRtl ? 'ArrowLeft' : 'ArrowRight'
    const back = isRtl ? 'ArrowRight' : 'ArrowLeft'
    const next =
      event.key === forward
        ? (index + 1) % count
        : event.key === back
          ? (index - 1 + count) % count
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? count - 1
              : null
    if (next === null) return
    event.preventDefault()
    this.selectTab(next, sources)
    this.updateComplete.then(() => {
      this.renderRoot.querySelector<HTMLElement>(`#tab-${next}`)?.focus()
    })
  }

  private renderTabs(sources: CodeSource[], index: number) {
    return html`
      <div
        part="tabs"
        class="tabs"
        role="tablist"
        aria-label=${this.label || 'Code'}
        @keydown=${(event: KeyboardEvent) =>
          this.handleTabKeydown(event, sources)}
      >
        ${sources.map(
          (source, i) => html`
            <button
              part="tab"
              class="tab"
              id="tab-${i}"
              type="button"
              role="tab"
              aria-selected=${i === index ? 'true' : 'false'}
              aria-controls="panel"
              tabindex=${i === index ? '0' : '-1'}
              @click=${() => this.selectTab(i, sources)}
            >
              ${source.label || source.filename || `Tab ${i + 1}`}
            </button>
          `,
        )}
        <span part="indicator" class="indicator" aria-hidden="true"></span>
      </div>
    `
  }

  private renderCopy(isFloating: boolean) {
    if (this.hideCopy) return nothing
    const isCopied = this.copier.isCopied()
    return html`
      <button
        part="copy-button"
        class="copy-button ${isFloating ? 'floating' : ''}"
        type="button"
        aria-label=${this.copyLabel}
        title=${this.copyLabel}
        ?data-copied=${isCopied}
        @click=${() => this.copy()}
      >
        ${copy('icon-copy')} ${check('icon-check')}
      </button>
    `
  }

  protected override render() {
    const sources = this.sources()
    const index = this.indexIn(sources)
    const source = sources[index]
    const hasTabs = sources.length > 1
    const language = this.languageOf(source)
    const title = hasTabs ? '' : source?.filename || this.filename
    const lines = this.linesOf(source?.code ?? '', language)
    const marked = parseLineList(source?.highlightLines || this.highlightLines)
    const hasHeader = hasTabs || !!title
    const name =
      this.label ||
      title ||
      (language ? `${languageLabel(language)} code` : 'Code')
    const status =
      this.copier.status === 'copied'
        ? this.copiedLabel
        : this.copier.status === 'failed'
          ? this.copyFailedLabel
          : ''
    // Whitespace inside <pre> is shown, so the code markup stays on one line.
    const code = html`<pre part="code" class="code"><code>${lines.map(
      (tokens, i) =>
        html`<span class="line" ?data-highlighted=${marked.has(i + 1)}><span class="text">${renderTokens(tokens)}</span></span>${i < lines.length - 1 ? '\n' : ''}`,
    )}</code></pre>`

    return html`
      <div
        part="base"
        class="base ${this.showLineNumbers ? 'numbered' : ''} ${this.isWrapped ? 'wrapped' : ''}"
        style="--_digits: ${String(lines.length).length}"
      >
        ${
          hasHeader
            ? html`
              <div part="header" class="header">
                ${
                  hasTabs
                    ? this.renderTabs(sources, index)
                    : html`<span part="filename" class="filename">${title}</span>`
                }
                ${this.renderCopy(false)}
              </div>
            `
            : nothing
        }
        <div part="body" class="body">
          <div
            part="scroller"
            class="scroller"
            id="panel"
            role=${hasTabs ? 'tabpanel' : 'group'}
            aria-labelledby=${hasTabs ? `tab-${index}` : nothing}
            aria-label=${hasTabs ? nothing : name}
            tabindex=${hasTabs || this.isOverflowing ? '0' : nothing}
          >
            ${code}
          </div>
          ${hasHeader ? nothing : this.renderCopy(true)}
        </div>
        <span class="sr-only" role="status">${status}</span>
      </div>
    `
  }
}

defineElement('moul-code-block', MoulCodeBlock)

declare global {
  interface HTMLElementTagNameMap {
    'moul-code-block': MoulCodeBlock
  }
}
