import { html, LitElement, type PropertyValues } from 'lit'
import { type AnimationPlaybackControls, animate } from 'motion'
import { NumberSpringController } from '../../controllers/number-spring.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, SPRING_GENTLE } from '../../utils/motion'
import { numberTickerStyles } from './NumberTicker.styles'

export type NumberTickerMode = 'roll' | 'count'

/** A digit strip holds 0–9 twice, so a roll can wrap from 9 to 0 without turning back. */
const STRIP_CELLS = 20

/** The library's gentle spring, typed for animating a number. */
const ROLL_SPRING = {
  type: 'spring',
  stiffness: 320,
  damping: 28,
  mass: 1,
} as const

/** Digit glyphs per numbering system (`latn`, `khmr`, `arab`…), built once each. */
const digitGlyphs = new Map<string, string[]>()

function glyphsFor(numberingSystem: string): string[] {
  let glyphs = digitGlyphs.get(numberingSystem)
  if (!glyphs) {
    try {
      const format = new Intl.NumberFormat('en', {
        numberingSystem,
        useGrouping: false,
      })
      glyphs = Array.from({ length: 10 }, (_, digit) => format.format(digit))
    } catch {
      glyphs = Array.from({ length: 10 }, (_, digit) => String(digit))
    }
    digitGlyphs.set(numberingSystem, glyphs)
  }
  return glyphs
}

function createFormat(
  locale: string | undefined,
  options: Intl.NumberFormatOptions | undefined,
): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(locale || undefined, options)
  } catch {
    return new Intl.NumberFormat()
  }
}

/** One character of the formatted number: a rolling digit or a static symbol. */
interface Column {
  key: string
  el: HTMLElement
  /** Digit columns only. */
  strip?: HTMLElement
  sizer?: HTMLElement
  /** Strip position in cells: 3 shows the digit 3, 13 shows it too, from the second copy. */
  pos: number
  /** The digit this column shows, or is rolling to. */
  digit?: number
  roll?: AnimationPlaybackControls
}

/**
 * A number that animates to each new `value`. By default it rolls like an
 * odometer, each digit sliding up or down to its new place, with a new
 * leading digit sliding in and a dropped one leaving; `mode="count"` springs
 * the whole number through the values in between instead. It is formatted
 * with `Intl.NumberFormat` (`locale`, `formatOptions`), in tabular figures so
 * the width holds still. Set `from` to count up from a starting value the
 * first time it comes on screen.
 *
 * Keyboard and screen readers: not focusable and has no role. The moving
 * digits are hidden from screen readers; a visually hidden copy of the final,
 * formatted value is read in their place, so intermediate values are never
 * read. It is not a live region: a changed value is not announced unless you
 * put the ticker inside one.
 *
 * Reduced motion: the number jumps straight to its new value, and `from` is
 * ignored.
 *
 * @slot prefix - Content before the number, such as a currency sign that is not part of the format.
 * @slot suffix - Content after the number, such as a unit.
 * @csspart digits - The visible number, hidden from screen readers.
 * @csspart digit - A rolling digit (in `roll` mode).
 * @csspart symbol - A character that does not roll: separators, signs, currency (in `roll` mode).
 */
export class MoulNumberTicker extends LitElement {
  static override styles = numberTickerStyles

  static override properties = {
    value: { type: Number },
    from: { type: Number },
    mode: { type: String, reflect: true },
    locale: { type: String, reflect: true },
    formatOptions: { attribute: false },
  }

  /** The number to show. Each change animates from the number on screen. */
  declare value: number
  /** Where the first animation starts, once the element is first on screen. Unset to show `value` at once. */
  declare from: number | undefined
  /** `roll` slides each digit like an odometer; `count` springs through the values in between. */
  declare mode: NumberTickerMode
  /** BCP 47 locale for formatting. Defaults to the browser's. */
  declare locale: string | undefined
  /** Passed to `Intl.NumberFormat`: currency, percent, compact notation, fraction digits. */
  declare formatOptions: Intl.NumberFormatOptions | undefined

  private readonly spring: NumberSpringController
  private format: Intl.NumberFormat = createFormat(undefined, undefined)
  /** Formats the count's in-between values with the final value's fraction digits. */
  private countFormat: Intl.NumberFormat = this.format
  /** The value the digits show, or are heading to. */
  private shownValue = 0
  /** True while `from` is shown and the element has not yet been on screen. */
  private isWaiting = false
  private observer: IntersectionObserver | null = null
  private rollContainer: HTMLElement | null = null
  private columns = new Map<string, Column>()
  private readonly leaving = new Set<HTMLElement>()

  constructor() {
    super()
    this.value = 0
    this.from = undefined
    this.mode = 'roll'
    this.locale = undefined
    this.formatOptions = undefined
    this.spring = new NumberSpringController(this, { threshold: 0.001 })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasUpdated) return
    if (this.isWaiting) this.observe()
    // A count cut short by a disconnect starts again from where it should be.
    else if (this.mode === 'count') this.spring.reset(this.target)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.observer?.disconnect()
    this.observer = null
    // Finish every roll in place, so a reconnected ticker shows whole digits.
    for (const column of this.columns.values()) {
      column.roll?.stop()
      column.roll = undefined
      if (column.digit !== undefined) this.setStrip(column, column.digit)
    }
    for (const el of this.leaving) el.remove()
    this.leaving.clear()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('mode') && this.mode !== 'roll' && this.mode !== 'count') {
      this.mode = 'roll'
    }
    if (changed.has('locale') || changed.has('formatOptions')) {
      this.format = createFormat(this.locale, this.formatOptions)
    }
    const value = this.target
    if (
      changed.has('locale') ||
      changed.has('formatOptions') ||
      changed.has('value')
    ) {
      const fraction =
        this.format.formatToParts(value).find((p) => p.type === 'fraction')
          ?.value.length ?? 0
      try {
        this.countFormat = new Intl.NumberFormat(this.locale || undefined, {
          ...this.formatOptions,
          minimumFractionDigits: fraction,
          maximumFractionDigits: fraction,
        })
      } catch {
        this.countFormat = this.format
      }
    }
    if (!this.hasUpdated) {
      const from = this.from
      this.isWaiting =
        typeof from === 'number' &&
        Number.isFinite(from) &&
        from !== value &&
        !prefersReducedMotion()
      this.spring.reset(this.isWaiting ? (from as number) : value)
    } else if (changed.has('mode') && this.mode === 'count') {
      this.spring.reset(this.shownValue)
    }
    if (this.mode === 'count' && !this.isWaiting && changed.has('value')) {
      this.spring.setTarget(value)
    }
  }

  protected override firstUpdated(): void {
    if (this.isWaiting) this.observe()
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (this.mode !== 'roll') {
      this.rollContainer = null
      this.columns.clear()
      this.shownValue = this.spring.displayValue
      return
    }
    const container =
      this.renderRoot.querySelector<HTMLElement>('.roll') ?? null
    if (container !== this.rollContainer) {
      this.rollContainer = container
      this.columns.clear()
      this.leaving.clear()
      // Start from what is on screen: `from`, the first value, or the count's last frame.
      this.rollTo(
        this.isWaiting ? (this.from as number) : this.spring.displayValue,
        false,
      )
    }
    if (this.isWaiting) return
    if (
      changed.has('value') ||
      changed.has('locale') ||
      changed.has('formatOptions') ||
      changed.has('mode')
    ) {
      this.rollTo(this.target, changed.has('value') || changed.has('mode'))
    }
  }

  /** `value` as a finite number. */
  private get target(): number {
    const value = Number(this.value)
    return Number.isFinite(value) ? value : 0
  }

  private observe(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.release()
      return
    }
    this.observer?.disconnect()
    this.observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) this.release()
    })
    this.observer.observe(this)
  }

  /** Lets `from` go: the number heads to `value` now that it can be seen. */
  private release(): void {
    this.observer?.disconnect()
    this.observer = null
    if (!this.isWaiting) return
    this.isWaiting = false
    if (this.mode === 'count') this.spring.setTarget(this.target)
    else this.rollTo(this.target, true)
  }

  /** Moves the odometer to `value`, rolling each digit unless `animated` is false. */
  private rollTo(value: number, animated: boolean): void {
    const container = this.rollContainer
    if (!container) return
    const isUp = value >= this.shownValue
    this.shownValue = value
    const motion = animated && this.hasUpdated && !prefersReducedMotion()
    const glyphs = glyphsFor(
      this.format.resolvedOptions().numberingSystem ?? 'latn',
    )
    const chars = Array.from(this.format.format(value))

    // Key every character by its place from the right, so units stay units.
    const next: Column[] = []
    const entering: HTMLElement[] = []
    chars.forEach((char, index) => {
      const place = chars.length - 1 - index
      const digit = glyphs.indexOf(char)
      const key = digit >= 0 ? `d${place}` : `s${place}:${char}`
      let column = this.columns.get(key)
      const isNew = !column
      if (!column) {
        column =
          digit >= 0
            ? this.createDigit(key, glyphs)
            : this.createSymbol(key, char)
        this.columns.set(key, column)
      }
      next.push(column)
      if (digit >= 0) {
        if (isNew) this.setStrip(column, motion ? (isUp ? 0 : 9) : digit)
        this.rollDigit(column, digit, isUp, motion, char)
      }
      if (isNew && motion) entering.push(column.el)
    })

    // Columns no longer in the number leave.
    const keys = new Set(next.map((column) => column.key))
    for (const [key, column] of this.columns) {
      if (keys.has(key)) continue
      this.columns.delete(key)
      column.roll?.stop()
      this.leave(column.el, motion)
    }

    // Put the columns in order, leaving any that are on their way out where they are.
    let previous: Element | null = null
    for (const column of next) {
      const expected: ChildNode | null = previous
        ? previous.nextSibling
        : container.firstChild
      if (column.el !== expected) container.insertBefore(column.el, expected)
      previous = column.el
    }
    for (const el of entering) this.enter(el)
  }

  private createDigit(key: string, glyphs: string[]): Column {
    const el = document.createElement('span')
    el.className = 'digit'
    el.setAttribute('part', 'digit')
    const sizer = document.createElement('span')
    sizer.className = 'sizer'
    const strip = document.createElement('span')
    strip.className = 'strip'
    for (let cell = 0; cell < STRIP_CELLS; cell++) {
      const glyph = document.createElement('span')
      glyph.textContent = glyphs[cell % 10]
      strip.append(glyph)
    }
    el.append(sizer, strip)
    return { key, el, strip, sizer, pos: 0 }
  }

  private createSymbol(key: string, char: string): Column {
    const el = document.createElement('span')
    el.className = 'symbol'
    el.setAttribute('part', 'symbol')
    el.textContent = char
    return { key, el, pos: 0 }
  }

  private setStrip(column: Column, pos: number): void {
    column.pos = pos
    if (column.strip) {
      column.strip.style.transform = `translateY(${round((-pos * 100) / STRIP_CELLS)}%)`
    }
  }

  /**
   * Rolls one digit to `digit`: upward through the strip when the number grows,
   * downward when it shrinks, wrapping through 9 and 0 as an odometer does.
   * Starts from wherever the strip is, so an interrupted roll carries on.
   */
  private rollDigit(
    column: Column,
    digit: number,
    isUp: boolean,
    motion: boolean,
    glyph: string,
  ): void {
    if (column.sizer) column.sizer.textContent = glyph
    column.digit = digit
    column.roll?.stop()
    column.roll = undefined
    if (!motion) {
      this.setStrip(column, digit)
      return
    }
    const current = ((column.pos % 10) + 10) % 10
    const start = isUp ? current : current + 10
    const end = isUp
      ? digit >= start
        ? digit
        : digit + 10
      : digit + 10 <= start
        ? digit + 10
        : digit
    this.setStrip(column, start)
    if (Math.abs(end - start) < 0.001) {
      this.setStrip(column, digit)
      return
    }
    const roll = animate(start, end, {
      ...ROLL_SPRING,
      onUpdate: (latest: number) => this.setStrip(column, latest),
      onComplete: () => {
        if (column.roll !== roll) return
        column.roll = undefined
        this.setStrip(column, digit)
      },
    })
    column.roll = roll
  }

  /** A new column opens from no width as its digit rolls in. */
  private enter(el: HTMLElement): void {
    const width = el.getBoundingClientRect().width
    animate(
      el,
      { opacity: [0, 1], width: ['0px', `${width}px`] },
      SPRING_GENTLE,
    ).then(() => {
      el.style.removeProperty('width')
      el.style.removeProperty('opacity')
    })
  }

  /** A dropped column closes to no width and fades, then goes. */
  private leave(el: HTMLElement, motion: boolean): void {
    if (!motion || this.leaving.has(el)) {
      if (!motion) el.remove()
      return
    }
    this.leaving.add(el)
    const width = el.getBoundingClientRect().width
    animate(
      el,
      { opacity: [1, 0], width: [`${width}px`, '0px'] },
      { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
    ).then(() => {
      this.leaving.delete(el)
      el.remove()
    })
  }

  protected override render() {
    const digits =
      this.mode === 'count'
        ? html`<span part="digits" class="count" aria-hidden="true"
            >${this.countFormat.format(this.spring.displayValue)}</span
          >`
        : html`<span part="digits" class="roll" aria-hidden="true"></span>`
    return html`
      <slot name="prefix"></slot>
      <span class="sr-only">${this.format.format(this.target)}</span>
      ${digits}
      <slot name="suffix"></slot>
    `
  }
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

defineElement('moul-number-ticker', MoulNumberTicker)

declare global {
  interface HTMLElementTagNameMap {
    'moul-number-ticker': MoulNumberTicker
  }
}
