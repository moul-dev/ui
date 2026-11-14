import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { CopyController } from '../../controllers/copy.controller'
import { defineElement } from '../../utils/define-element'
import { check, copy, replay } from '../../utils/icons'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { terminalStyles } from './Terminal.styles'
import './TerminalLine'
import type { MoulTerminalLine } from './TerminalLine'

const isLine = (node: unknown): node is MoulTerminalLine =>
  node instanceof Element && node.localName === 'moul-terminal-line'

/** A pause that ends early, with `false`, when `isCurrent()` stops holding. */
function pause(ms: number, isCurrent: () => boolean): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(isCurrent()), Math.max(0, ms))
  })
}

/**
 * A terminal window that plays a session: each `<moul-terminal-line
 * is-command>` types itself after the prompt, and the output lines below it
 * appear once it has run, one after another. Use it on landing and docs pages
 * to show an install or a CLI at work. Playback starts when the terminal
 * scrolls into view; `is-static` shows every line at once instead, and
 * `replay()` (or the replay button that appears at the end) plays it again.
 * The copy button copies the commands, one per line, without the prompts or
 * the output.
 *
 * Keyboard and screen readers: the window is a `role="group"` named by
 * `label` ("Terminal"). Every line's full text is in the page from the
 * start, so screen readers read the whole session whatever the playback
 * shows; prompts, the typed copy and the cursor are hidden from them. The
 * copy and replay buttons are native buttons, reached with `Tab`; after a
 * copy, a polite live region says "Copied".
 *
 * Reduced motion: every line shows at once, with no typing, fading or
 * blinking cursor, and the replay button is not offered. Switching the
 * setting on mid-playback finishes it at once.
 *
 * @slot - The `moul-terminal-line` elements, in order.
 * @fires complete - The last line has played.
 * @csspart base - The window.
 * @csspart header - The title bar.
 * @csspart title - The title, from `label`.
 * @csspart copy-button - The copy button.
 * @csspart replay-button - The replay button.
 * @csspart body - The box the lines sit in.
 * @cssprop --terminal-min-height - Defaults to `auto`; the lines' full height is kept from the start, so nothing below moves as they appear.
 */
export class MoulTerminal extends LitElement {
  static override styles = terminalStyles

  static override properties = {
    label: { type: String },
    prompt: { type: String },
    typingSpeed: { type: Number, attribute: 'typing-speed' },
    lineDelay: { type: Number, attribute: 'line-delay' },
    isStatic: { type: Boolean, reflect: true, attribute: 'is-static' },
    isLooping: { type: Boolean, reflect: true, attribute: 'is-looping' },
    hideCopy: { type: Boolean, reflect: true, attribute: 'hide-copy' },
    isComplete: { state: true },
    hasCommands: { state: true },
  }

  /** The window's title and accessible name. */
  declare label: string
  /** The prompt before each command. */
  declare prompt: string
  /** Milliseconds per typed character. */
  declare typingSpeed: number
  /** Milliseconds before each line starts, unless the line sets its own `delay`. */
  declare lineDelay: number
  /** Show every line at once, without playback. */
  declare isStatic: boolean
  /** Start over two seconds after the last line. */
  declare isLooping: boolean
  declare hideCopy: boolean
  /** @internal */
  declare isComplete: boolean
  /** @internal */
  declare hasCommands: boolean

  private readonly copier = new CopyController(this)
  /** Bumped to cancel the playback in progress. */
  private run = 0
  private hasStarted = false
  private viewObserver: IntersectionObserver | null = null
  private stopWatching: (() => void) | null = null

  constructor() {
    super()
    this.label = 'Terminal'
    this.prompt = '$'
    this.typingSpeed = 40
    this.lineDelay = 400
    this.isStatic = false
    this.isLooping = false
    this.hideCopy = false
    this.isComplete = false
    this.hasCommands = false
  }

  /** The lines, in order. */
  public get lines(): MoulTerminalLine[] {
    return Array.from(this.children).filter(isLine)
  }

  /** The commands' text, one per line. */
  public get commands(): string {
    return this.lines
      .filter((line) => line.isCommand)
      .map((line) => line.text)
      .join('\n')
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.stopWatching = watchReducedMotion((isReduced) => {
      if (isReduced) this.finish()
    })
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.run++
    this.viewObserver?.disconnect()
    this.viewObserver = null
    this.stopWatching?.()
    this.stopWatching = null
    // A terminal taken off the page shows its whole session.
    this.finish()
    this.hasStarted = false
  }

  protected override firstUpdated(): void {
    this.syncLines()
    if (this.shouldAnimate()) {
      for (const line of this.lines) line.state = 'waiting'
      this.startWhenVisible()
    } else {
      this.finish()
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('prompt')) this.syncLines()
    if (changed.has('isStatic') && this.isStatic) this.finish()
  }

  /** Plays the session again from the first line. */
  public replay(): void {
    if (!this.shouldAnimate()) {
      this.finish()
      return
    }
    this.hasStarted = true
    void this.play()
  }

  /** Shows every line at once and stops the playback. */
  public finish(): void {
    this.run++
    for (const line of this.lines) {
      line.state = 'shown'
      line.typed = 0
    }
    this.isComplete = true
  }

  /** Copies the commands, as the copy button does. */
  public copy(): Promise<boolean> {
    return this.copier.copy(this.commands)
  }

  private shouldAnimate(): boolean {
    return !this.isStatic && !prefersReducedMotion()
  }

  private syncLines(): void {
    for (const line of this.lines) line.defaultPrompt = this.prompt
    const hasCommands = this.lines.some((line) => line.isCommand)
    if (hasCommands !== this.hasCommands) this.hasCommands = hasCommands
  }

  private readonly handleSlotChange = (): void => {
    this.syncLines()
    // Lines added after the session ended show at once; ones added during it wait their turn.
    if (!this.isComplete && this.hasStarted) return
    for (const line of this.lines) {
      if (this.isComplete && line.state === 'waiting') line.state = 'shown'
      else if (!this.hasStarted && this.shouldAnimate()) line.state = 'waiting'
    }
  }

  private startWhenVisible(): void {
    if (typeof IntersectionObserver !== 'function') {
      this.hasStarted = true
      void this.play()
      return
    }
    this.viewObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || this.hasStarted)
          return
        this.hasStarted = true
        this.viewObserver?.disconnect()
        this.viewObserver = null
        void this.play()
      },
      { threshold: 0.3 },
    )
    this.viewObserver.observe(this)
  }

  private async play(): Promise<void> {
    const run = ++this.run
    const isCurrent = () => run === this.run && this.isConnected
    this.isComplete = false
    for (const line of this.lines) {
      line.state = 'waiting'
      line.typed = 0
    }
    // Lines are read as the playback reaches them, so ones added meanwhile join in.
    for (let index = 0; index < this.lines.length; index++) {
      const line = this.lines[index] as MoulTerminalLine
      const delay = Number.isFinite(line.delay)
        ? Number(line.delay)
        : this.lineDelay
      if (!(await pause(index === 0 ? Math.min(delay, 200) : delay, isCurrent)))
        return
      if (!line.isCommand) {
        line.state = 'shown'
        continue
      }
      line.state = 'typing'
      const length = line.text.length
      for (let typed = 1; typed <= length; typed++) {
        line.typed = typed
        if (!(await pause(this.typingSpeed, isCurrent))) return
      }
      if (!(await pause(160, isCurrent))) return
      line.state = 'shown'
    }
    this.isComplete = true
    this.dispatchEvent(new Event('complete', { bubbles: true, composed: true }))
    if (this.isLooping && (await pause(2000, isCurrent))) void this.play()
  }

  protected override render() {
    const isCopied = this.copier.isCopied()
    const canReplay = this.isComplete && this.shouldAnimate()
    return html`
      <div part="base" class="base" role="group" aria-label=${this.label}>
        <div part="header" class="header">
          <span class="lights" aria-hidden="true"><span></span><span></span><span></span></span>
          <span part="title" class="title">${this.label}</span>
          <span class="actions">
            ${
              canReplay
                ? html`
                  <button
                    part="replay-button"
                    class="copy-button"
                    type="button"
                    aria-label="Replay"
                    title="Replay"
                    @click=${() => this.replay()}
                  >
                    ${replay()}
                  </button>
                `
                : nothing
            }
            ${
              this.hideCopy || !this.hasCommands
                ? nothing
                : html`
                  <button
                    part="copy-button"
                    class="copy-button"
                    type="button"
                    aria-label="Copy commands"
                    title="Copy commands"
                    ?data-copied=${isCopied}
                    @click=${() => this.copy()}
                  >
                    ${copy('icon-copy')} ${check('icon-check')}
                  </button>
                `
            }
          </span>
        </div>
        <div part="body" class="body">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
        <span class="sr-only" role="status">
          ${
            this.copier.status === 'copied'
              ? 'Copied'
              : this.copier.status === 'failed'
                ? 'Could not copy'
                : ''
          }
        </span>
      </div>
    `
  }
}

defineElement('moul-terminal', MoulTerminal)

declare global {
  interface HTMLElementTagNameMap {
    'moul-terminal': MoulTerminal
  }
}
