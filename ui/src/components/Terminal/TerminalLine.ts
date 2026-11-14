import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { EASE_OUT, subtleAnimate } from '../../utils/motion'
import { terminalLineStyles } from './Terminal.styles'

export type TerminalLineTone = 'success' | 'warning' | 'error' | 'muted'
/** Where a line is in the playback. */
export type TerminalLineState = 'waiting' | 'typing' | 'shown'

const TONES: TerminalLineTone[] = ['success', 'warning', 'error', 'muted']

/**
 * One line of a `<moul-terminal>`: a command, which types itself after a
 * prompt, or a line of output, which appears once the command before it has
 * finished. Its content is its children, in any inline markup; a command
 * types its text content.
 *
 * Keyboard and screen readers: not focusable. The line's full text is in the
 * page from the start, so screen readers read it whole, whatever the
 * playback shows; the typed copy, the cursor and the prompt are hidden from
 * them.
 *
 * Reduced motion: the parent terminal shows every line at once, so commands
 * never type and output does not fade in.
 *
 * @slot - The line's content.
 * @csspart prompt - The prompt before a command.
 * @csspart content - The line's content.
 */
export class MoulTerminalLine extends LitElement {
  static override styles = terminalLineStyles

  static override properties = {
    isCommand: { type: Boolean, reflect: true, attribute: 'is-command' },
    prompt: { type: String },
    tone: { type: String, reflect: true },
    delay: { type: Number },
    state: { type: String, reflect: true, attribute: 'data-state' },
    typed: { type: Number, attribute: false },
    defaultPrompt: { attribute: false },
  }

  /** Type the line after a prompt, as a command. */
  declare isCommand: boolean
  /** The prompt before a command; defaults to the terminal's. */
  declare prompt: string | undefined
  /** Colour for output: `success`, `warning`, `error` or `muted`. */
  declare tone: TerminalLineTone | undefined
  /** Milliseconds to wait before the line starts; defaults to the terminal's `line-delay`. */
  declare delay: number | undefined
  /**
   * Set by the terminal as it plays.
   * @internal
   */
  declare state: TerminalLineState
  /**
   * Characters typed so far, while typing.
   * @internal
   */
  declare typed: number
  /**
   * The terminal's prompt, used when the line has none of its own.
   * @internal
   */
  declare defaultPrompt: string

  constructor() {
    super()
    this.isCommand = false
    this.prompt = undefined
    this.tone = undefined
    this.delay = undefined
    this.state = 'shown'
    this.typed = 0
    this.defaultPrompt = '$'
  }

  /** The text a command types. */
  public get text(): string {
    return (this.textContent ?? '').replace(/\s+/g, ' ').trim()
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('tone') && this.tone && !TONES.includes(this.tone)) {
      this.tone = undefined
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    const was = changed.get('state')
    // Output fades up into place when the terminal reaches it.
    if (was === 'waiting' && this.state === 'shown' && !this.isCommand) {
      const body = this.renderRoot.querySelector('.body')
      if (body) {
        subtleAnimate(
          body,
          {
            opacity: [0, 1],
            transform: ['translateY(4px)', 'translateY(0px)'],
          },
          { duration: 0.24, ease: EASE_OUT },
        )
      }
    }
  }

  protected override render() {
    const prompt = this.prompt ?? this.defaultPrompt
    const typed =
      this.state === 'typing'
        ? html`<span class="typed" aria-hidden="true">${this.text.slice(0, this.typed)}<span class="cursor"></span></span>`
        : nothing
    // Output keeps its spaces (pre-wrap), so the content markup stays on one line.
    return html`
      <div class="body">
        ${
          this.isCommand && prompt
            ? html`<span part="prompt" class="prompt" aria-hidden="true">${prompt}</span>`
            : nothing
        }
        <span class="stack"><span part="content" class="content"><slot></slot></span>${typed}</span>
      </div>
    `
  }
}

defineElement('moul-terminal-line', MoulTerminalLine)

declare global {
  interface HTMLElementTagNameMap {
    'moul-terminal-line': MoulTerminalLine
  }
}
