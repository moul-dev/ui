import { html, LitElement, type PropertyValues } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { InViewController } from '../../controllers/in-view.controller'
import {
  segmentText,
  splitGraphemes,
} from '../../controllers/text-split.controller'
import { defineElement } from '../../utils/define-element'
import {
  inheritedLang,
  LightTextController,
  milliseconds,
} from '../../utils/landing-text'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { scrambleStyles } from './Scramble.styles'

/** What starts the scramble: entering the viewport, a pointer or focus, or only `play()`. */
export type ScrambleTrigger = 'view' | 'hover' | 'manual'

const TRIGGERS: readonly ScrambleTrigger[] = ['view', 'hover', 'manual']

const DEFAULT_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*'

/** Milliseconds between new random glyphs: fast enough to read as noise, slow enough to see. */
const SHUFFLE_EVERY = 50

/** The longest step a frame may take, so a return from a background tab does not jump to the end. */
const MAX_FRAME_STEP = 100

type Piece = { kind: 'space'; text: string } | { kind: 'word'; chars: string[] }

/**
 * Text whose letters scramble through random glyphs, then resolve to the
 * final text from start to end, like a decoder. Write the text inside it, or
 * set `text`; the element is inline, so it sits inside your own heading or
 * link. With `trigger="view"` (the default) it plays once, the first time it
 * enters the viewport; `hover` plays it each time a pointer enters it (or
 * focus moves into it, where the page has made it focusable); `manual` waits
 * for `play()`. Each letter keeps the width of
 * its final glyph, so the line never jitters, and spaces never scramble. It
 * lives in the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable itself, so a keyboard user
 * does not start a `hover` scramble; inside a link or a button, call `play()`
 * from that control's own `focus` and `pointerenter` events. The scrambling
 * letters are hidden from screen readers and a visually hidden copy holds the
 * final text, so it is read once, whole, and never as noise.
 *
 * Reduced motion: nothing scrambles. The final text shows at once and
 * `play()` resolves at once; turning reduced motion on mid-scramble shows the
 * final text straight away.
 *
 * @csspart text - The visible letters.
 *
 * @cssprop --scramble-glyph-color - The colour of the random glyphs. Defaults to `currentColor`.
 */
export class MoulScramble extends LitElement {
  static override styles = scrambleStyles

  static override properties = {
    text: { type: String },
    trigger: { type: String, reflect: true },
    duration: { type: Number },
    charset: { type: String },
    resolvedCount: { state: true },
    glyphs: { state: true },
  }

  /** The final text. When empty, the text written inside the element is used. */
  declare text: string
  /** What starts the scramble. Defaults to `view`. */
  declare trigger: ScrambleTrigger
  /** Milliseconds for the whole text to resolve. Defaults to 800. */
  declare duration: number
  /** The glyphs letters scramble through. Defaults to Latin letters, digits and `!@#$%&*`. */
  declare charset: string

  private declare resolvedCount: number
  private declare glyphs: string[]

  private readonly light = new LightTextController(this)
  private readonly inView: InViewController
  private pieces: Piece[] = []
  private charCount = 0
  private sourceKey: string | null = null
  private pool: string[] = []
  private poolKey: string | null = null
  private isRunning = false
  private hasPlayed = false
  private isReduced = false
  private frameId = 0
  private lastTime: number | null = null
  private elapsed = 0
  private lastShuffle = 0
  private waiting: Array<() => void> = []
  private stopWatchingMotion: (() => void) | null = null

  constructor() {
    super()
    this.text = ''
    this.trigger = 'view'
    this.duration = 800
    this.charset = DEFAULT_CHARSET
    this.resolvedCount = 0
    this.glyphs = []
    // No inset margin: any visible part counts, so a hover scramble at the very bottom of the viewport still runs.
    this.inView = new InViewController(this, {
      // Nothing here is a CSS animation; the frame loop stops itself off screen.
      pauseOffscreen: false,
      onChange: (isInView) => {
        if (isInView && this.trigger === 'view' && !this.hasPlayed) {
          void this.play()
        } else {
          this.loop()
        }
      },
    })
  }

  /** The final text: `text` when set, otherwise the text written inside the element. */
  public get currentText(): string {
    return this.text || this.light.text
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      if (isReduced) this.finish()
      else this.requestUpdate()
    })
    this.addEventListener('pointerenter', this.handleEnter)
    this.addEventListener('focusin', this.handleEnter)
    // Put back in the page before its first entry: show noise again.
    if (this.hasUpdated && this.isWaitingForView()) this.shuffle()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.removeEventListener('pointerenter', this.handleEnter)
    this.removeEventListener('focusin', this.handleEnter)
    this.finish()
  }

  /**
   * Scrambles the text from the start and resolves it again. Resolves once
   * every letter shows its final glyph, or at once under reduced motion.
   */
  public play(): Promise<void> {
    this.hasPlayed = true
    if (this.isReduced || prefersReducedMotion() || !this.isConnected) {
      this.finish()
      return Promise.resolve()
    }
    const done = new Promise<void>((resolve) => this.waiting.push(resolve))
    this.isRunning = true
    this.elapsed = 0
    this.lastTime = null
    this.resolvedCount = 0
    this.shuffle()
    this.loop()
    return done
  }

  private readonly handleEnter = (): void => {
    if (this.trigger === 'hover' && !this.isRunning) void this.play()
  }

  /** Runs the frame loop while a scramble is under way and on screen; stops it otherwise. */
  private loop(): void {
    const canRun = this.isRunning && this.isConnected && this.inView.isInView
    if (canRun && !this.frameId) {
      this.frameId = requestAnimationFrame(this.frame)
    } else if (!canRun && this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = 0
      // The next frame after a pause counts from itself, not from when it stopped.
      this.lastTime = null
    }
  }

  private readonly frame = (time: number): void => {
    this.frameId = 0
    if (this.lastTime !== null) {
      this.elapsed += Math.min(
        MAX_FRAME_STEP,
        Math.max(0, time - this.lastTime),
      )
    }
    this.lastTime = time
    const duration = milliseconds(this.duration, 800)
    // Letter i resolves once (i + 1) / count of the duration has passed.
    const resolved =
      duration === 0
        ? this.charCount
        : Math.floor((this.elapsed / duration) * this.charCount)
    if (resolved >= this.charCount) {
      this.finish()
      return
    }
    this.resolvedCount = resolved
    if (this.elapsed - this.lastShuffle >= SHUFFLE_EVERY) this.shuffle()
    this.loop()
  }

  /** Picks a new random glyph for every letter. */
  private shuffle(): void {
    const pool = this.glyphPool()
    this.glyphs = Array.from(
      { length: this.charCount },
      () => pool[Math.floor(Math.random() * pool.length)] ?? '',
    )
    this.lastShuffle = this.elapsed
  }

  private glyphPool(): string[] {
    const charset = this.charset || DEFAULT_CHARSET
    if (charset !== this.poolKey) {
      this.poolKey = charset
      this.pool = splitGraphemes(charset).filter((glyph) => glyph.trim())
      if (this.pool.length === 0) this.pool = splitGraphemes(DEFAULT_CHARSET)
    }
    return this.pool
  }

  /** Stops the loop, shows the final text and resolves every waiting `play()`. */
  private finish(): void {
    if (this.frameId) cancelAnimationFrame(this.frameId)
    this.frameId = 0
    this.lastTime = null
    this.isRunning = false
    this.resolvedCount = this.charCount
    this.glyphs = []
    const waiting = this.waiting
    this.waiting = []
    for (const resolve of waiting) resolve()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('trigger') && !TRIGGERS.includes(this.trigger)) {
      this.trigger = 'view'
    }
    const lang = inheritedLang(this)
    const text = this.currentText
    const key = `${lang ?? ''}\u0000${text}`
    if (key !== this.sourceKey) {
      this.sourceKey = key
      this.pieces = segmentText(text, lang).map((segment) =>
        segment.kind === 'space'
          ? { kind: 'space', text: segment.text }
          : { kind: 'word', chars: segment.chars },
      )
      this.charCount = this.pieces.reduce(
        (sum, piece) => sum + (piece.kind === 'word' ? piece.chars.length : 0),
        0,
      )
      if (this.isRunning || this.isWaitingForView()) this.shuffle()
      else this.resolvedCount = this.charCount
    }
    if (changed.has('charset') && this.glyphs.length > 0) this.shuffle()
  }

  /** Before its first entry, a `view` scramble shows noise, so it resolves from noise. */
  private isWaitingForView(): boolean {
    return this.trigger === 'view' && !this.hasPlayed && !this.isReduced
  }

  protected override render() {
    const isScrambled = this.isRunning || this.isWaitingForView()
    const resolved = this.isWaitingForView() ? 0 : this.resolvedCount
    let index = 0
    const letters = this.pieces.map((piece) => {
      if (piece.kind === 'space') return piece.text
      return html`<span class="word"
        >${piece.chars.map((char) => {
          const i = index++
          const glyph =
            isScrambled && i >= resolved ? this.glyphs[i] : undefined
          return html`<span class="char" data-glyph=${ifDefined(glyph)}
            >${char}</span
          >`
        })}</span
      >`
    })
    return html`<span class="readable">${this.currentText}</span
      ><span part="text" aria-hidden="true">${letters}</span>`
  }
}

defineElement('moul-scramble', MoulScramble)

declare global {
  interface HTMLElementTagNameMap {
    'moul-scramble': MoulScramble
  }
}
