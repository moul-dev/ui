import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { InViewController } from '../../controllers/in-view.controller'
import { splitGraphemes } from '../../controllers/text-split.controller'
import { defineElement } from '../../utils/define-element'
import {
  inheritedLang,
  LightTextController,
  milliseconds,
} from '../../utils/landing-text'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { typewriterStyles } from './Typewriter.styles'

/** Where a run is: waiting out `delay`, typing, holding a finished word, deleting it, or done. */
type Phase = 'idle' | 'waiting' | 'typing' | 'holding' | 'deleting' | 'done'

/**
 * Text that types itself, one letter at a time, with a blinking cursor; or,
 * with `words`, a list typed in turn, each deleted before the next, as in
 * "We build fast | safe | small apps". Write the text inside it, or set
 * `text`; the element is inline, so it sits inside your own heading. Typing
 * starts the first time it enters the viewport and stops while it is off
 * screen or `is-paused` is set; `play()` starts again from the beginning. It
 * types whole grapheme clusters, so a Khmer letter never appears without its
 * marks. When a run without `is-looping` ends, the cursor blinks four more
 * times and then hides, so nothing keeps blinking on the page. It lives in
 * the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable. The typed letters and the
 * cursor are hidden from screen readers; a visually hidden copy holds the
 * whole text, or every word joined with commas, so it is read once, whole,
 * and does not change while typing. There is no live region. A looping list
 * keeps moving, so give readers a way to stop it by setting `is-paused`.
 *
 * Reduced motion: nothing is typed or deleted. The text, or the current
 * word, appears at once and the cursor does not blink; a list swaps whole
 * words every `hold` milliseconds, and still stops with `is-paused`.
 *
 * @csspart text - The typed text, cursor included.
 * @csspart cursor - The blinking bar after the typed text.
 *
 * @cssprop --typewriter-cursor-color - The cursor's colour. Defaults to `currentColor`.
 */
export class MoulTypewriter extends LitElement {
  static override styles = typewriterStyles

  static override properties = {
    text: { type: String },
    words: { type: Array },
    typingSpeed: { type: Number, attribute: 'typing-speed' },
    deleteSpeed: { type: Number, attribute: 'delete-speed' },
    hold: { type: Number },
    delay: { type: Number },
    isLooping: { type: Boolean, reflect: true, attribute: 'is-looping' },
    isPaused: { type: Boolean, reflect: true, attribute: 'is-paused' },
    hideCursor: { type: Boolean, reflect: true, attribute: 'hide-cursor' },
    phase: { state: true },
    wordIndex: { state: true },
    typedCount: { state: true },
  }

  /** The text to type. When empty, the text written inside the element is used. */
  declare text: string
  /** Words to type in turn, each deleted before the next. When not empty, they replace the text. As an attribute, a JSON array: `words='["fast","safe"]'`. */
  declare words: string[]
  /** Milliseconds per letter while typing. Defaults to 60. */
  declare typingSpeed: number
  /** Milliseconds per letter while deleting. Defaults to 30. */
  declare deleteSpeed: number
  /** Milliseconds a finished word stays before it is deleted. Defaults to 1500. */
  declare hold: number
  /** Milliseconds to wait before typing starts. Defaults to 0. */
  declare delay: number
  /** After the last word, delete it and start again from the first. Without it, the run stops on the last word, fully typed. */
  declare isLooping: boolean
  /** Stops typing, deleting and blinking where they are, until it is removed. */
  declare isPaused: boolean
  /** Shows no cursor. */
  declare hideCursor: boolean

  private declare phase: Phase
  private declare wordIndex: number
  private declare typedCount: number

  private readonly light = new LightTextController(this)
  private readonly inView: InViewController
  /** Each word's grapheme clusters; one entry when typing `text`. */
  private items: string[][] = [[]]
  private readableText = ''
  private sourceKey: string | null = null
  private hasStarted = false
  private isReduced = false
  private timer: ReturnType<typeof setTimeout> | undefined
  private waiting: Array<() => void> = []
  private stopWatchingMotion: (() => void) | null = null

  constructor() {
    super()
    this.text = ''
    this.words = []
    this.typingSpeed = 60
    this.deleteSpeed = 30
    this.hold = 1500
    this.delay = 0
    this.isLooping = false
    this.isPaused = false
    this.hideCursor = false
    this.phase = 'idle'
    this.wordIndex = 0
    this.typedCount = 0
    this.inView = new InViewController(this, {
      onChange: (isInView) => {
        if (isInView && !this.hasStarted) this.start()
        else this.schedule()
      },
    })
  }

  /** The text typed when `words` is empty: `text` when set, otherwise the text written inside the element. */
  public get currentText(): string {
    return this.text || this.light.text
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      this.requestUpdate()
    })
    // Moved in the page: carry on where it was.
    if (this.hasStarted) this.schedule()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.schedule()
    this.settle()
  }

  /**
   * Starts typing again from the beginning. Resolves once the last word, or
   * the text, has been typed in full.
   */
  public play(): Promise<void> {
    const done = new Promise<void>((resolve) => this.waiting.push(resolve))
    this.start()
    if (!this.isConnected) this.settle()
    return done
  }

  private start(): void {
    this.hasStarted = true
    this.wordIndex = 0
    this.typedCount = 0
    this.phase = 'waiting'
    this.schedule()
  }

  /** Sets the timer for the next step, or clears it while the run cannot move. */
  private schedule(): void {
    clearTimeout(this.timer)
    this.timer = undefined
    const canRun =
      this.isConnected &&
      this.hasStarted &&
      this.inView.isInView &&
      !this.isPaused
    if (!canRun) return
    let wait: number
    switch (this.phase) {
      case 'waiting':
        wait = this.isReduced ? 0 : milliseconds(this.delay, 0)
        break
      case 'typing':
        wait = milliseconds(this.typingSpeed, 60)
        break
      case 'holding':
        wait = milliseconds(this.hold, 1500)
        break
      case 'deleting':
        wait = milliseconds(this.deleteSpeed, 30)
        break
      default:
        return
    }
    this.timer = setTimeout(() => this.step(), wait)
  }

  private step(): void {
    this.timer = undefined
    if (this.items.every((word) => word.length === 0)) {
      this.phase = 'done'
      this.settle()
      return
    }
    if (this.isReduced) {
      // Whole words only: show the next one in full, then hold it.
      if (this.phase === 'holding' || this.phase === 'deleting') {
        this.nextWord()
      }
      this.typedCount = this.currentWord().length
      this.finishWord()
    } else if (this.phase === 'waiting' || this.phase === 'typing') {
      this.phase = 'typing'
      const word = this.currentWord()
      this.typedCount = Math.min(word.length, this.typedCount + 1)
      if (this.typedCount >= word.length) this.finishWord()
    } else if (this.phase === 'holding') {
      this.phase = 'deleting'
    } else if (this.phase === 'deleting') {
      this.typedCount = Math.max(0, this.typedCount - 1)
      if (this.typedCount === 0) {
        this.nextWord()
        this.phase = 'typing'
      }
    }
    this.schedule()
  }

  private currentWord(): string[] {
    return this.items[this.wordIndex] ?? []
  }

  private nextWord(): void {
    this.wordIndex = (this.wordIndex + 1) % this.items.length
    this.typedCount = 0
  }

  private finishWord(): void {
    const isLast = this.wordIndex >= this.items.length - 1
    if (isLast) this.settle()
    this.phase = isLast && !this.isLooping ? 'done' : 'holding'
  }

  /** Resolves every waiting `play()`. */
  private settle(): void {
    const waiting = this.waiting
    this.waiting = []
    for (const resolve of waiting) resolve()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    const words = Array.isArray(this.words)
      ? this.words.map((word) => String(word)).filter((word) => word !== '')
      : []
    const lang = inheritedLang(this)
    const source = words.length > 0 ? words : [this.currentText]
    const key = `${lang ?? ''}\u0000${words.length > 0}\u0000${source.join('\u0000')}`
    if (key !== this.sourceKey) {
      this.sourceKey = key
      this.items = source.map((word) => splitGraphemes(word, lang))
      this.readableText = words.length > 0 ? words.join(', ') : source[0]
      // New text mid-run: type it from the beginning.
      if (this.hasStarted) this.start()
    }
    // Looping turned on after the run ended: carry on from the last word.
    if (changed.has('isLooping') && this.isLooping && this.phase === 'done') {
      this.phase = 'holding'
      this.schedule()
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('isPaused')) this.schedule()
  }

  protected override render() {
    const word = this.currentWord()
    const count = this.isReduced
      ? word.length
      : Math.min(this.typedCount, word.length)
    const head = word.slice(0, Math.max(0, count - 1)).join('')
    const last = count > 0 ? word[count - 1] : ''
    const cursorState =
      this.phase === 'done'
        ? 'is-done'
        : this.phase === 'typing' || this.phase === 'deleting'
          ? 'is-busy'
          : ''
    // The last letter and the cursor never break apart, so the cursor never starts a line alone.
    return html`<span class="readable">${this.readableText}</span
      ><span part="text" aria-hidden="true"
        >${head}<span class="tail"
          >${last}${
            this.hideCursor
              ? nothing
              : html`<span part="cursor" class=${cursorState}></span>`
          }</span
        ></span
      >`
  }
}

defineElement('moul-typewriter', MoulTypewriter)

declare global {
  interface HTMLElementTagNameMap {
    'moul-typewriter': MoulTypewriter
  }
}
