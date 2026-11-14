import { html, LitElement, type PropertyValues } from 'lit'
import { InViewController } from '../../controllers/in-view.controller'
import {
  type SplitTextBy,
  TextSplitController,
} from '../../controllers/text-split.controller'
import { defineElement } from '../../utils/define-element'
import { LightTextController, milliseconds } from '../../utils/landing-text'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { textEntranceStyles } from './TextEntrance.styles'

/** How each piece comes in: `blur-up` sharpens from a blur while rising a little. */
export type TextEntranceEffect =
  | 'fade'
  | 'blur'
  | 'blur-up'
  | 'slide-up'
  | 'slide-down'
  | 'scale-up'

const EFFECTS: readonly TextEntranceEffect[] = [
  'fade',
  'blur',
  'blur-up',
  'slide-up',
  'slide-down',
  'scale-up',
]

const SPLITS: readonly SplitTextBy[] = ['chars', 'words', 'lines']

/** Milliseconds between pieces when `stagger` is unset: letters follow fast, lines slowly. */
const DEFAULT_STAGGER: Record<SplitTextBy, number> = {
  chars: 25,
  words: 60,
  lines: 150,
}

/** The entrance waits until the text is this far inside the bottom of the viewport. */
const ROOT_MARGIN = '0px 0px -40px 0px'

/**
 * Text whose letters, words or lines come in one after another as it scrolls
 * into view, fading, sharpening from a blur, sliding or growing into place.
 * Write the text inside it, or set `text`; the element is inline, so it sits
 * inside your own heading: `<h1><moul-text-entrance>Ship on
 * Friday</moul-text-entrance></h1>`. It plays once, the first time the text
 * enters the viewport, unless `is-repeating` hides it again whenever it
 * leaves; `play()` replays it. Khmer splits at word and letter boundaries, so
 * a letter never loses its marks. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The pieces
 * are hidden from screen readers and a visually hidden copy holds the whole
 * text, so it is read once, as one sentence, whether or not it has come in
 * yet.
 *
 * Reduced motion: the whole text is shown at once, with no fade, blur or
 * movement, and `play()` resolves at once. It is also shown when printing and
 * where the browser cannot tell whether it is on screen.
 *
 * @csspart base - The span the pieces are rendered into.
 *
 * @cssprop --text-entrance-easing - The timing function. Defaults to `var(--ease-out)`.
 * @cssprop --text-entrance-distance - How far the slide and blur-up effects travel. Defaults to `0.4em`.
 * @cssprop --text-entrance-blur - The starting blur of the blur effects. Defaults to `0.2em`.
 */
export class MoulTextEntrance extends LitElement {
  static override styles = textEntranceStyles

  static override properties = {
    text: { type: String },
    by: { type: String, reflect: true },
    effect: { type: String, reflect: true },
    stagger: { type: Number },
    duration: { type: Number },
    delay: { type: Number },
    isRepeating: { type: Boolean, reflect: true, attribute: 'is-repeating' },
    isRevealed: { type: Boolean, reflect: true, attribute: 'is-revealed' },
  }

  /** The text to show. When empty, the text written inside the element is used. */
  declare text: string
  /** Which pieces come in one after another. Defaults to `words`. */
  declare by: SplitTextBy
  /** How each piece comes in. Defaults to `blur-up`. */
  declare effect: TextEntranceEffect
  /** Milliseconds between one piece and the next. When unset: 25 for `chars`, 60 for `words`, 150 for `lines`. */
  declare stagger: number | null | undefined
  /** Milliseconds each piece takes to come in. Defaults to 500. */
  declare duration: number
  /** Milliseconds to wait after entering the viewport, or after `play()`. Defaults to 0. */
  declare delay: number
  /** Hide again on leaving the viewport, so it plays on every entry. */
  declare isRepeating: boolean
  /** Whether the text is shown, or on its way in. Set by the element as the text enters (and, with `is-repeating`, leaves) the viewport. */
  declare isRevealed: boolean

  private readonly light = new LightTextController(this)
  private readonly splitter: TextSplitController
  private readonly inView: InViewController
  private finishTimer: ReturnType<typeof setTimeout> | undefined
  private waiting: Array<() => void> = []
  private stopWatchingMotion: (() => void) | null = null

  constructor() {
    super()
    this.text = ''
    this.by = 'words'
    this.effect = 'blur-up'
    this.stagger = undefined
    this.duration = 500
    this.delay = 0
    this.isRepeating = false
    this.isRevealed = false
    this.splitter = new TextSplitController(this, {
      container: () =>
        this.renderRoot.querySelector<HTMLElement>('[part="base"]'),
      text: () => this.currentText,
      by: () => this.by,
    })
    this.inView = new InViewController(this, {
      rootMargin: ROOT_MARGIN,
      // The pieces' animations end on their own; pausing them would freeze half-shown text.
      pauseOffscreen: false,
      onChange: (isInView) => {
        if (isInView) this.isRevealed = true
        else if (this.isRepeating) {
          this.isRevealed = false
          this.settle()
        }
      },
    })
  }

  /** The text shown: `text` when set, otherwise the text written inside the element. */
  public get currentText(): string {
    return this.text || this.light.text
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      if (isReduced) this.settle()
    })
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.settle()
  }

  /**
   * Hides the text and brings it in again, as for a replay button. Resolves
   * when the last piece is in, or at once under reduced motion.
   */
  public async play(): Promise<void> {
    if (prefersReducedMotion() || !this.isConnected) {
      this.isRevealed = true
      return
    }
    const done = new Promise<void>((resolve) => this.waiting.push(resolve))
    clearTimeout(this.finishTimer)
    this.isRevealed = false
    await this.updateComplete
    // Reading layout applies the hidden state, so the pieces' animations start again from the beginning.
    void this.getBoundingClientRect()
    this.isRevealed = true
    await this.updateComplete
    clearTimeout(this.finishTimer)
    this.finishTimer = setTimeout(() => this.settle(), this.totalTime())
    return done
  }

  /** Milliseconds from the start of the entrance until the last piece is in. */
  private totalTime(): number {
    const result = this.splitter.result
    const pieces =
      this.by === 'chars'
        ? (result?.chars.length ?? 0)
        : this.by === 'lines'
          ? (result?.lineCount ?? 0)
          : (result?.words.length ?? 0)
    return (
      this.resolvedDelay() +
      Math.max(0, pieces - 1) * this.resolvedStagger() +
      this.resolvedDuration()
    )
  }

  /** Resolves every waiting `play()`. */
  private settle(): void {
    clearTimeout(this.finishTimer)
    this.finishTimer = undefined
    const waiting = this.waiting
    this.waiting = []
    for (const resolve of waiting) resolve()
  }

  private resolvedStagger(): number {
    return milliseconds(this.stagger, DEFAULT_STAGGER[this.by] ?? 60)
  }

  private resolvedDuration(): number {
    return milliseconds(this.duration, 500)
  }

  private resolvedDelay(): number {
    return milliseconds(this.delay, 0)
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('by') && !SPLITS.includes(this.by)) this.by = 'words'
    if (changed.has('effect') && !EFFECTS.includes(this.effect)) {
      this.effect = 'blur-up'
    }
    // Turning repeat off after the first entry keeps the text shown.
    if (
      changed.has('isRepeating') &&
      !this.isRepeating &&
      this.inView.hasEntered
    ) {
      this.isRevealed = true
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    const style = this.style
    if (changed.has('stagger') || changed.has('by')) {
      style.setProperty('--_stagger', `${this.resolvedStagger()}ms`)
    }
    if (changed.has('duration')) {
      style.setProperty('--_duration', `${this.resolvedDuration()}ms`)
    }
    if (changed.has('delay')) {
      style.setProperty('--_delay', `${this.resolvedDelay()}ms`)
    }
  }

  protected override render() {
    return html`<span part="base"></span>`
  }
}

defineElement('moul-text-entrance', MoulTextEntrance)

declare global {
  interface HTMLElementTagNameMap {
    'moul-text-entrance': MoulTextEntrance
  }
}
