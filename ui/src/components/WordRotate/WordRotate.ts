import { html, LitElement, type PropertyValues } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion } from '../../utils/motion'
import { wordRotateStyles } from './WordRotate.styles'

/** How one word gives way to the next. */
export type WordRotateEffect = 'slide' | 'fade' | 'blur' | 'flip'

/** `detail` of the `wordchange` event. */
export interface WordRotateChangeDetail {
  /** Position of the new word in `words`. */
  index: number
  /** The new word. */
  word: string
}

const EFFECTS: readonly WordRotateEffect[] = ['slide', 'fade', 'blur', 'flip']

/** Shortest wait between two changes, so a zero interval cannot spin. */
const MIN_WAIT = 100

/** A word on screen: the current one, or the one on its way out. */
interface ShownWord {
  key: number
  index: number
  state: 'rest' | 'enter' | 'leave'
}

/**
 * One word in a sentence that cycles through a list, as in "Ship [fast] today"
 * turning to "safe", then "yours". Put it inline in a heading or a paragraph,
 * set `words`, and keep a word inside it as the text shown before the script
 * loads. The old word slides, fades, blurs or flips out as the next comes in,
 * and the box glides to the new word's width so the rest of the sentence
 * moves smoothly instead of jumping. It waits `interval` milliseconds on each
 * word, and pauses while the pointer is over it, while focus is inside it,
 * while it is off screen and while `is-paused` is set. It lives in the effects
 * entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable. The moving words are hidden
 * from screen readers, which read every word once instead, joined with
 * commas, so "Ship [fast] today" reads as "Ship fast, safe, yours today". The
 * copy does not change as the words do, so nothing is announced on each
 * change. Moving content must be possible to pause (WCAG 2.2.2): hovering
 * pauses it, and `is-paused` lets a page offer a pause button.
 *
 * Reduced motion: the words still change every `interval`, but each one
 * replaces the last in place, with no slide, fade, blur, flip or change of
 * width.
 *
 * @slot - Text shown until the script loads, and whenever `words` is empty, usually the first word.
 *
 * @csspart base - The box around the word; style it as a pill with a background, padding and radius.
 * @csspart word - A word; during a change there are two, the one leaving and the one arriving.
 *
 * @fires wordchange - After the element moves on to the next word by itself. `detail: { index, word }`. Setting `index` does not fire it.
 */
export class MoulWordRotate extends LitElement {
  static override styles = wordRotateStyles

  static override properties = {
    words: { type: Array },
    effect: { type: String, reflect: true },
    interval: { type: Number },
    duration: { type: Number },
    index: { type: Number },
    isPaused: { type: Boolean, reflect: true, attribute: 'is-paused' },
  }

  /** The words to cycle through, in order. In HTML, a JSON array: `words='["fast", "safe", "yours"]'`. Empty shows the slotted text and does nothing else. */
  declare words: string[]
  /** How one word gives way to the next. Defaults to `slide`. */
  declare effect: WordRotateEffect
  /** Milliseconds each word stays, counted from when it starts to come in. Defaults to 2500. */
  declare interval: number
  /** Milliseconds a change takes. Defaults to 450. */
  declare duration: number
  /** Position of the current word in `words`. Set it to jump to a word, which then stays a full `interval`. Defaults to 0. */
  declare index: number
  /** Stops on the current word until removed, for a pause button. */
  declare isPaused: boolean

  /** `words` as strings; empty when `words` is not an array. */
  private list: string[] = []
  private current: ShownWord = { key: 0, index: 0, state: 'rest' }
  private leaving: ShownWord | null = null
  private nextKey = 1
  private isHovered = false
  private hasFocus = false
  /** Set while the element itself moves to the next word, so the change fires `wordchange`. */
  private isAdvancing = false
  /** Width of the window just before a change, for the glide to the new word's width. */
  private startWidth: number | null = null
  private timer: ReturnType<typeof setTimeout> | undefined
  private settleTimer: ReturnType<typeof setTimeout> | undefined
  private readonly inView: InViewController

  constructor() {
    super()
    this.words = []
    this.effect = 'slide'
    this.interval = 2500
    this.duration = 450
    this.index = 0
    this.isPaused = false
    this.inView = new InViewController(this, {
      // The timer stops off screen; a change already under way is short and finishes on its own.
      pauseOffscreen: false,
      onChange: () => this.schedule(),
    })
    this.addEventListener('pointerenter', this.handlePointerEnter)
    this.addEventListener('pointerleave', this.handlePointerLeave)
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('focusout', this.handleFocusOut)
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    // A change cut short by a move is finished at once, so the element starts clean.
    if (this.leaving) {
      this.settle()
      this.requestUpdate()
    }
    this.schedule()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopTimer()
    clearTimeout(this.settleTimer)
    this.settleTimer = undefined
    this.isHovered = false
    this.hasFocus = false
  }

  private get windowEl(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>('.window')
  }

  private get currentWordEl(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>(
      '[part="word"]:not([data-state="leave"])',
    )
  }

  private readonly handlePointerEnter = (): void => {
    this.isHovered = true
    this.schedule()
  }

  private readonly handlePointerLeave = (): void => {
    this.isHovered = false
    this.schedule()
  }

  private readonly handleFocusIn = (): void => {
    this.hasFocus = true
    this.schedule()
  }

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget
    this.hasFocus = next instanceof Node && this.contains(next)
    this.schedule()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('effect') && !EFFECTS.includes(this.effect)) {
      this.effect = 'slide'
    }
    if (changed.has('words')) {
      this.list = Array.isArray(this.words)
        ? this.words.map((word) => String(word))
        : []
      // A new list shows the word at `index` at once, with no change animation.
      this.index = wrap(this.index, this.list.length)
      this.settle()
      this.current = { key: this.nextKey++, index: this.index, state: 'rest' }
      this.stopTimer()
    } else if (changed.has('index')) {
      this.index = wrap(this.index, this.list.length)
      if (this.list.length > 0 && this.index !== this.current.index) {
        this.beginChange()
      }
      // A jump gets a full interval; the element's own changes reschedule after the update.
      if (!this.isAdvancing) this.stopTimer()
    }
    if (changed.has('interval')) this.stopTimer()
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('duration')) {
      this.style.setProperty('--_duration', `${this.changeMs()}ms`)
    }
    if (this.startWidth !== null) this.glideWidth(this.startWidth)
    if (this.isAdvancing) {
      this.isAdvancing = false
      this.dispatchEvent(
        new CustomEvent<WordRotateChangeDetail>('wordchange', {
          bubbles: true,
          composed: true,
          detail: { index: this.index, word: this.list[this.index] ?? '' },
        }),
      )
    }
    this.schedule()
  }

  /** Starts the change to the word at `index`: the current word leaves as the new one arrives. */
  private beginChange(): void {
    clearTimeout(this.settleTimer)
    this.settleTimer = undefined
    const isAnimated =
      this.hasUpdated && this.changeMs() > 0 && !prefersReducedMotion()
    if (!isAnimated) {
      this.settle()
      this.current = { key: this.nextKey++, index: this.index, state: 'rest' }
      return
    }
    // Measured before the new word renders, so the width glides from the old word's.
    this.startWidth = this.windowEl?.offsetWidth ?? null
    this.leaving = { ...this.current, state: 'leave' }
    this.current = { key: this.nextKey++, index: this.index, state: 'enter' }
    this.settleTimer = setTimeout(() => {
      this.settleTimer = undefined
      this.settle()
      this.requestUpdate()
    }, this.changeMs())
  }

  /** Moves the window's width from the old word's to the new word's, which the stylesheet transitions. */
  private glideWidth(from: number): void {
    this.startWidth = null
    const windowEl = this.windowEl
    const word = this.currentWordEl
    if (!windowEl || !word) return
    windowEl.style.setProperty('width', `${from}px`)
    // Reading layout commits the start width, so the next change of width transitions from it.
    void windowEl.offsetWidth
    windowEl.style.setProperty('width', `${word.offsetWidth}px`)
  }

  /** Ends a change: drops the leaving word and lets the window take its natural width again. */
  private settle(): void {
    clearTimeout(this.settleTimer)
    this.settleTimer = undefined
    this.startWidth = null
    this.leaving = null
    if (this.current.state !== 'rest') {
      this.current = { ...this.current, state: 'rest' }
    }
    this.windowEl?.style.removeProperty('width')
  }

  /** Starts the timer for the next word when the element should be moving, and stops it when not. */
  private schedule(): void {
    const shouldRun =
      this.isConnected &&
      this.list.length > 1 &&
      !this.isPaused &&
      !this.isHovered &&
      !this.hasFocus &&
      this.inView.isInView
    if (!shouldRun) {
      this.stopTimer()
      return
    }
    if (this.timer !== undefined) return
    const wait = Math.max(
      finite(this.interval, 2500),
      this.changeMs(),
      MIN_WAIT,
    )
    this.timer = setTimeout(this.advance, wait)
  }

  private stopTimer(): void {
    clearTimeout(this.timer)
    this.timer = undefined
  }

  private readonly advance = (): void => {
    this.timer = undefined
    const count = this.list.length
    if (count < 2) return
    this.isAdvancing = true
    this.index = (this.index + 1) % count
  }

  private changeMs(): number {
    return Math.max(0, finite(this.duration, 450))
  }

  protected override render() {
    if (this.list.length === 0) return html`<slot></slot>`
    const shown = this.leaving ? [this.current, this.leaving] : [this.current]
    // No whitespace between the spans: inside an inline box it would show as spaces.
    return html`<span class="readable">${this.list.join(', ')}</span><span part="base" aria-hidden="true"><span class="window" ?data-changing=${this.leaving !== null}>${repeat(
      shown,
      (word) => word.key,
      (word) =>
        html`<span part="word" data-state=${word.state}>${this.list[word.index] ?? ''}</span>`,
    )}</span></span>`
  }
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}

/** Brings `index` into `0…count-1`, counting back from the end for negatives; leaves it alone while the list is empty. */
function wrap(index: number, count: number): number {
  if (count === 0) return Number.isFinite(index) ? Math.trunc(index) : 0
  const whole = Number.isFinite(index) ? Math.trunc(index) : 0
  return ((whole % count) + count) % count
}

defineElement('moul-word-rotate', MoulWordRotate)

declare global {
  interface HTMLElementTagNameMap {
    'moul-word-rotate': MoulWordRotate
  }
}
