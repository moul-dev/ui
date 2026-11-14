import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { CopyController } from '../../controllers/copy.controller'
import { defineElement } from '../../utils/define-element'
import { dedent } from '../../utils/highlight'
import {
  alertError,
  check,
  copy,
  replay,
  thumbDown,
  thumbUp,
} from '../../utils/icons'
import { completeStreamingTail, parseMarkdown } from '../../utils/markdown'
import { prefersReducedMotion } from '../../utils/motion'
import {
  type ResponseSource,
  renderBlocks,
  sourceHost,
  sourceHref,
} from './markdown-view'
import { streamingResponseStyles } from './StreamingResponse.styles'

export type { ResponseSource } from './markdown-view'

export type ResponseFeedback = 'up' | 'down' | ''

export interface ResponseFeedbackChangeDetail {
  value: ResponseFeedback
}

export interface ResponseCopyDetail {
  text: string
  /** False when the browser refused the clipboard. */
  isCopied: boolean
}

const ACTIONS = ['copy', 'regenerate', 'feedback'] as const
type ResponseAction = (typeof ACTIONS)[number]

/** Reveal speed while text arrives, in characters a second at the least. */
const STREAM_RATE = 90
/** How fast the backlog shrinks: the share of it shown each second. */
const CATCH_UP = 6
/** Faster once the stream has ended, so the last words do not linger. */
const FLUSH_RATE = 600
const FLUSH_CATCH_UP = 14

/** Moves `end` past the rest of a letter, so a Khmer consonant never shows without its signs. */
function clusterEnd(text: string, end: number): number {
  let i = end
  while (i < text.length) {
    const code = text.charCodeAt(i)
    const previous = text.charCodeAt(i - 1)
    const isLowSurrogate = code >= 0xdc00 && code <= 0xdfff
    const isJoiner = code === 0x200c || code === 0x200d || previous === 0x17d2
    const isMark = code === 0xfe0f || /\p{M}/u.test(text[i] as string)
    if (isLowSurrogate || isJoiner || isMark) {
      i++
      continue
    }
    break
  }
  return i
}

/**
 * An answer from a language model, written in Markdown, that grows as it
 * streams in: set `content` to the text so far, or call `appendText()` with each
 * chunk, and set `is-streaming` until the last one has arrived. The text is
 * revealed smoothly at the end of the answer, however the chunks bunch up,
 * behind a soft caret. Headings, lists, tables, quotes, links and code are
 * rendered (fenced code in a `<moul-code-block>` with copy and highlighting),
 * `[1]` citations link to `sources`, which are listed under the answer, and
 * once the answer is done a row of actions offers copy, regenerate and good
 * or bad feedback. `error` shows a failed answer with a retry.
 *
 * The Markdown is parsed into data and rendered as text, never as HTML, so
 * markup in a reply is shown rather than run. Links go only to `http`,
 * `https`, `mailto` and relative URLs. Images are not loaded: each becomes a
 * link, because an image URL in a reply can carry data out of the page.
 *
 * Keyboard and screen readers: the answer is a region named by `label`
 * ("Response") with `aria-busy="true"` while it streams, so screen readers
 * wait for the finished text rather than reading every word as it lands.
 * Headings are real headings whose levels start at `heading-level` (3).
 * Links, citations ("Source 1: …"), the sources list and the code blocks keep
 * their own keyboard behaviour. The actions are native buttons with names;
 * the feedback buttons are toggles with `aria-pressed`, and a polite live
 * region says "Copied" after a copy. An error is a `role="alert"`.
 *
 * Reduced motion: text appears as soon as it arrives instead of being
 * revealed smoothly, the caret does not blink, and the actions appear
 * without fading in.
 *
 * @slot - Markdown to show when `content` is empty, written as the element's text. Not rendered as is.
 * @slot actions - More buttons for the action row.
 * @fires regenerate - The regenerate or retry button was used.
 * @fires feedbackchange - A feedback button was toggled; `detail` is `{ value }` (`up`, `down` or empty).
 * @fires responsecopy - The copy button was used; `detail` is `{ text, isCopied }`.
 * @csspart base - The frame around everything.
 * @csspart content - The rendered answer.
 * @csspart caret - The caret at the end of the text while it streams.
 * @csspart error - The error message.
 * @csspart sources - The list of sources.
 * @csspart source - Each source.
 * @csspart actions - The row of actions.
 * @csspart action-button - Each action button.
 */
export class MoulStreamingResponse extends LitElement {
  static override styles = streamingResponseStyles

  static override properties = {
    content: { type: String },
    isStreaming: { type: Boolean, reflect: true, attribute: 'is-streaming' },
    sources: { attribute: false },
    actions: { type: String },
    feedback: { type: String, reflect: true },
    error: { type: String },
    headingLevel: { type: Number, attribute: 'heading-level' },
    label: { type: String },
    lightContent: { state: true },
  }

  /** The Markdown so far. Takes precedence over text written in the markup. */
  declare content: string
  /** More text is coming: shows the caret and holds back the actions. */
  declare isStreaming: boolean
  /** The sources `[n]` citations point at, in order. */
  declare sources: ResponseSource[]
  /** Space-separated actions to offer once done: `copy`, `regenerate`, `feedback`. Empty for none. */
  declare actions: string
  /** The reader's verdict: `up`, `down`, or empty. */
  declare feedback: ResponseFeedback
  /** Why the answer failed; shown with a retry button. */
  declare error: string
  /** The `aria-level` of a top-level (`#`) heading in the answer. */
  declare headingLevel: number
  /** The answer's accessible name. */
  declare label: string
  /** @internal */
  declare lightContent: string

  private readonly copier = new CopyController(this)
  private observer: MutationObserver | null = null
  /** How much of the text is on screen. */
  private shown = 0
  /** Fractional characters owed to the next frame. */
  private owed = 0
  private frame = 0
  private lastTime = 0

  constructor() {
    super()
    this.content = ''
    this.isStreaming = false
    this.sources = []
    this.actions = 'copy regenerate feedback'
    this.feedback = ''
    this.error = ''
    this.headingLevel = 3
    this.label = 'Response'
    this.lightContent = ''
  }

  /** The whole answer, revealed or not. */
  public get text(): string {
    return this.content || this.lightContent
  }

  /** True while text that has arrived is still being revealed. */
  public get isRevealing(): boolean {
    return this.shown < this.text.length
  }

  /** Adds a chunk of text to the end. */
  public appendText(chunk: string): void {
    if (chunk) this.content = this.text + chunk
  }

  /** Copies the answer's Markdown, as the copy button does. */
  public async copy(): Promise<boolean> {
    const text = this.text
    const isCopied = await this.copier.copy(text)
    this.dispatchEvent(
      new CustomEvent<ResponseCopyDetail>('responsecopy', {
        bubbles: true,
        composed: true,
        detail: { text, isCopied },
      }),
    )
    return isCopied
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.readMarkup()
    this.observer = new MutationObserver(() => this.readMarkup())
    this.observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.observer?.disconnect()
    this.observer = null
    cancelAnimationFrame(this.frame)
    this.frame = 0
    // Whatever arrived is shown when it comes back.
    this.shown = this.text.length
  }

  private readMarkup(): void {
    const text = Array.from(this.childNodes)
      .filter(
        (node) =>
          node.nodeType === Node.TEXT_NODE ||
          (node instanceof Element && !node.slot),
      )
      .map((node) => node.textContent ?? '')
      .join('')
    const next = dedent(text)
    if (next !== this.lightContent) this.lightContent = next
  }

  private get actionSet(): Set<ResponseAction> {
    return new Set(
      (this.actions ?? '')
        .split(/\s+/)
        .filter((token): token is ResponseAction =>
          (ACTIONS as readonly string[]).includes(token),
        ),
    )
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (this.feedback !== 'up' && this.feedback !== 'down') this.feedback = ''
    const text = this.text
    const wasText =
      (changed.get('content') as string | undefined) ??
      (changed.get('lightContent') as string | undefined)
    // New text that does not continue the old (a regenerated answer) starts over.
    if (
      wasText !== undefined &&
      !text.startsWith(wasText.slice(0, this.shown))
    ) {
      this.shown = 0
      this.owed = 0
    }
    // Text that is already complete when it arrives, or any text under
    // reduced motion, shows at once; only a stream is revealed.
    const smooth =
      !prefersReducedMotion() && (this.isStreaming || this.frame !== 0)
    if (!smooth) this.shown = text.length
    if (this.shown > text.length) this.shown = text.length
  }

  protected override updated(): void {
    if (
      this.isRevealing &&
      !this.frame &&
      typeof requestAnimationFrame === 'function'
    ) {
      this.lastTime = 0
      this.frame = requestAnimationFrame(this.reveal)
    }
  }

  private readonly reveal = (time: number): void => {
    this.frame = 0
    const text = this.text
    const backlog = text.length - this.shown
    if (backlog <= 0) return
    if (prefersReducedMotion()) {
      this.shown = text.length
      this.requestUpdate()
      return
    }
    const seconds = this.lastTime
      ? Math.min(0.1, (time - this.lastTime) / 1000)
      : 1 / 60
    this.lastTime = time
    const rate = this.isStreaming
      ? Math.max(STREAM_RATE, backlog * CATCH_UP)
      : Math.max(FLUSH_RATE, backlog * FLUSH_CATCH_UP)
    this.owed += rate * seconds
    const step = Math.floor(this.owed)
    if (step > 0) {
      this.owed -= step
      this.shown = clusterEnd(text, Math.min(text.length, this.shown + step))
      this.requestUpdate()
    }
    if (this.shown < text.length)
      this.frame = requestAnimationFrame(this.reveal)
  }

  private emit<T>(type: string, detail: T): void {
    this.dispatchEvent(
      new CustomEvent<T>(type, { bubbles: true, composed: true, detail }),
    )
  }

  private setFeedback(value: 'up' | 'down'): void {
    this.feedback = this.feedback === value ? '' : value
    this.emit<ResponseFeedbackChangeDetail>('feedbackchange', {
      value: this.feedback,
    })
  }

  private renderSources() {
    const sources = Array.isArray(this.sources) ? this.sources : []
    if (!sources.length) return nothing
    return html`
      <div part="sources" class="sources">
        <span class="sources-label" id="sources-label">Sources</span>
        <ol class="source-list" aria-labelledby="sources-label">
          ${sources.map((source, i) => {
            const href = sourceHref(source.url)
            const host = sourceHost(source.url)
            const body = html`
              <span class="source-index" aria-hidden="true">${i + 1}</span>
              <span class="source-text">
                <span class="source-title">${source.title || host || `Source ${i + 1}`}</span>
                ${
                  source.description || host
                    ? html`<span class="source-meta">${source.description || host}</span>`
                    : nothing
                }
              </span>
            `
            return html`<li>
              ${
                href
                  ? html`<a
                      part="source"
                      class="source"
                      href=${href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      >${body}</a
                    >`
                  : html`<span part="source" class="source">${body}</span>`
              }
            </li>`
          })}
        </ol>
      </div>
    `
  }

  private renderActions(isDone: boolean) {
    const actions = this.actionSet
    const status =
      this.copier.status === 'copied'
        ? 'Copied'
        : this.copier.status === 'failed'
          ? 'Could not copy'
          : ''
    return html`
      <div part="actions" class="actions" ?hidden=${!isDone}>
        ${
          actions.has('copy')
            ? html`<button
                part="action-button"
                class="action copy-button"
                type="button"
                aria-label="Copy response"
                title="Copy response"
                ?data-copied=${this.copier.isCopied()}
                @click=${() => this.copy()}
              >
                ${copy('icon-copy')} ${check('icon-check')}
              </button>`
            : nothing
        }
        ${
          actions.has('regenerate')
            ? html`<button
                part="action-button"
                class="action"
                type="button"
                aria-label="Regenerate response"
                title="Regenerate response"
                @click=${() => this.emit('regenerate', {})}
              >
                ${replay()}
              </button>`
            : nothing
        }
        ${
          actions.has('feedback')
            ? html`<button
                  part="action-button"
                  class="action"
                  type="button"
                  aria-label="Good response"
                  title="Good response"
                  aria-pressed=${this.feedback === 'up' ? 'true' : 'false'}
                  @click=${() => this.setFeedback('up')}
                >
                  ${thumbUp()}
                </button>
                <button
                  part="action-button"
                  class="action"
                  type="button"
                  aria-label="Bad response"
                  title="Bad response"
                  aria-pressed=${this.feedback === 'down' ? 'true' : 'false'}
                  @click=${() => this.setFeedback('down')}
                >
                  ${thumbDown()}
                </button>`
            : nothing
        }
        <slot name="actions"></slot>
        <span class="sr-only" role="status">${status}</span>
      </div>
    `
  }

  protected override render() {
    const text = this.text
    const visible = text.slice(0, this.shown)
    const sources = Array.isArray(this.sources) ? this.sources : []
    const isBusy = this.isStreaming || this.isRevealing
    // A half-written `**bo` shows as bold now, not as stars until its closer arrives.
    const blocks = parseMarkdown(
      isBusy ? completeStreamingTail(visible) : visible,
      { sourceCount: sources.length },
    )
    const last = blocks[blocks.length - 1]
    const caret = html`<span part="caret" class="caret" aria-hidden="true"></span>`
    // A caret cannot sit inside a code block, so it gets a line of its own after one.
    const caretOwnLine = isBusy && (!last || last.type === 'code')
    const isDone = !isBusy && !!text && !this.error

    return html`
      <div part="base" class="base">
        <div
          part="content"
          class="content"
          role="region"
          aria-label=${this.label}
          aria-busy=${isBusy ? 'true' : 'false'}
        >
          ${renderBlocks(
            blocks,
            {
              headingLevel: Math.min(
                6,
                Math.max(1, Math.round(this.headingLevel) || 3),
              ),
              sources,
              caret: isBusy ? caret : nothing,
            },
            isBusy && !caretOwnLine,
          )}
          ${caretOwnLine ? html`<p class="caret-line">${caret}</p>` : nothing}
        </div>
        ${
          this.error
            ? html`<div part="error" class="error" role="alert">
                ${alertError('error-icon')}
                <span class="error-text">${this.error}</span>
                ${
                  this.actionSet.has('regenerate')
                    ? html`<button
                        class="retry"
                        type="button"
                        @click=${() => this.emit('regenerate', {})}
                      >
                        Retry
                      </button>`
                    : nothing
                }
              </div>`
            : nothing
        }
        ${isBusy ? nothing : this.renderSources()}
        ${this.renderActions(isDone)}
      </div>
    `
  }
}

defineElement('moul-streaming-response', MoulStreamingResponse)

declare global {
  interface HTMLElementTagNameMap {
    'moul-streaming-response': MoulStreamingResponse
  }
}
