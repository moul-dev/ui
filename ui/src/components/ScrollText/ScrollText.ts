import { html, LitElement, type PropertyValues } from 'lit'
import { ScrollController } from '../../controllers/scroll.controller'
import { TextSplitController } from '../../controllers/text-split.controller'
import { defineElement } from '../../utils/define-element'
import { LightTextController } from '../../utils/landing-text'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { findScrollRoot } from '../../utils/scroll-root'
import { scrollTextStyles } from './ScrollText.styles'

/** The variable the scroll timeline animates on the text: the container's scroll progress, 0 to 1. Every word reads it. */
const PROGRESS_PROPERTY = '--_scroll-text-progress'

/** A word lights as it rises past this line, measured down from the top of the viewport. */
const READING_LINE = 0.6

/** The shortest stretch of scrolling, as a share of the viewport, that lights a short text. */
const MIN_SPAN = 0.3

/** The share of a pinned section's scroll spent lighting the words; the rest holds them lit. */
const PINNED_SHARE = 0.8

export interface ScrollTextGeometry {
  /** Height of the scroll container's visible area, in pixels. */
  viewport: number
  /** Height of the element, in pixels. */
  height: number
  /** Whether the element is a tall section with the text pinned in the viewport. */
  isPinned: boolean
  /** Progress when the container is scrolled to the very end. Defaults to 1. */
  last?: number
}

export interface ScrollTextRange {
  /** Progress at which the first word starts to light. */
  from: number
  /** Progress at which the last word is fully lit. */
  to: number
}

/**
 * Where on the element's view timeline (0 as its top edge enters the bottom
 * of the viewport, 1 as its bottom edge leaves the top) the words light up.
 *
 * Flowing text lights a word as it rises past a reading line 60% of the way
 * down the viewport, so the first word lights as the top of the text crosses
 * it and the last as the bottom does; a short text gets at least 30% of a
 * viewport of scrolling. A pinned section lights the words over the first
 * 80% of the scroll during which the text stays in place. Text that can
 * never scroll far enough, near the end of the page, lights earlier instead.
 */
export function scrollTextRange(geometry: ScrollTextGeometry): ScrollTextRange {
  const viewport = Math.max(0, geometry.viewport)
  const height = Math.max(0, geometry.height)
  const travel = viewport + height
  if (travel <= 0) return { from: 0, to: 1 }

  let from: number
  let to: number
  if (geometry.isPinned && height > viewport) {
    from = viewport / travel
    to = from + (PINNED_SHARE * (height - viewport)) / travel
  } else {
    from = ((1 - READING_LINE) * viewport) / travel
    to = from + Math.max(height, MIN_SPAN * viewport) / travel
  }

  const last = clamp(geometry.last ?? 1)
  if (to > last) {
    from -= to - last
    to = last
  }
  from = Math.max(0, from)
  if (to - from < 0.01) to = Math.min(1, from + 0.01)
  if (to - from < 0.01) from = Math.max(0, to - 0.01)
  return { from: round(from), to: round(to) }
}

/**
 * Text whose words light up one after another as the reader scrolls, from a
 * dim grey to full strength, so a statement reads itself out at the pace of
 * the scroll. Write the text inside it, or set `text`. In the flow of the
 * page each word lights as it rises past a line a little below the middle of
 * the viewport. With `is-pinned` it becomes a tall section (250% of the
 * viewport by default) in which the text stays in the middle of the screen
 * while the reader scrolls through it, and lights word by word until it
 * moves on. One scroll timeline drives every word through CSS, so in
 * browsers with scroll-driven animations no script runs while the reader
 * scrolls; elsewhere one passive listener writes it once per frame. It
 * follows the page, or the nearest ancestor that scrolls (`overflow: auto`
 * or `scroll`), and is not fooled by wrappers with `overflow: hidden`. Khmer
 * and other scripts without spaces split at word boundaries. It lives in the
 * effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The words
 * are hidden from screen readers and a visually hidden copy holds the whole
 * text, so it is read once, as one sentence, lit or not. Where the system
 * forces its own colours (Windows high contrast) and when printing, every
 * word is shown at full strength.
 *
 * Reduced motion: every word is shown at full strength and nothing follows
 * the scroll. A pinned section is not pinned: the text sits in the flow of
 * the page like a paragraph.
 *
 * @csspart stage - The box that holds the text; in a pinned section it stays in the viewport.
 * @csspart text - The text, one span per word.
 *
 * @cssprop --scroll-text-dim - Opacity of a word that is not lit yet. Defaults to `0.2`.
 * @cssprop --scroll-text-length - Height of a pinned section; the longer it is, the slower the words light. Defaults to `250vh`.
 * @cssprop --scroll-text-pin-height - Height of the area the text is pinned in. Defaults to `100svh`, the viewport.
 */
export class MoulScrollText extends LitElement {
  static override styles = scrollTextStyles

  static override properties = {
    text: { type: String },
    isPinned: { type: Boolean, reflect: true, attribute: 'is-pinned' },
  }

  /** The text to show. When empty, the text written inside the element is used. */
  declare text: string
  /** Make a tall section in which the text stays in the middle of the viewport while the reader scrolls through it. */
  declare isPinned: boolean

  private readonly light = new LightTextController(this)
  private readonly splitter: TextSplitController
  private scrolling: ScrollController | null = null
  /** The scroll container followed, or null for the page. */
  private source: Element | null = null
  private resizeObserver: ResizeObserver | null = null
  private stopWatchingMotion: (() => void) | null = null
  private wordCount = 0
  private range: ScrollTextRange | null = null
  /** The text's view progress as `start + rate × scroll progress`, from the last measure. */
  private mapping: { start: number; rate: number } | null = null

  constructor() {
    super()
    this.text = ''
    this.isPinned = false
    this.splitter = new TextSplitController(this, {
      container: () => this.textEl,
      text: () => this.currentText,
      by: () => 'words',
    })
  }

  private get textEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('[part="text"]') ?? null
  }

  /** The text shown: `text` when set, otherwise the text written inside the element. */
  public get currentText(): string {
    return this.text || this.light.text
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      if (isReduced) this.stopFollowing()
      else this.follow()
    })
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.measureRange, { passive: true })
    }
    if (this.hasUpdated) this.follow()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.measureRange)
    }
    this.stopFollowing()
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed)
    this.follow()
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    const count = this.splitter.result?.words.length ?? 0
    if (count !== this.wordCount) {
      this.wordCount = count
      this.writeRange()
    }
    // A pinned section is a different height, and lights over a different stretch.
    if (changed.has('isPinned') && changed.get('isPinned') !== undefined) {
      this.measureRange()
    }
  }

  /** Starts following the scroll, unless the reader asked for reduced motion. */
  private follow(): void {
    if (!this.isConnected || this.scrolling || prefersReducedMotion()) return
    this.source = findScrollRoot(this, { skipHidden: true })
    const source = this.source
    // A scroll timeline on the container that really scrolls, not a view
    // timeline: a view timeline follows the nearest ancestor with any
    // overflow other than visible, so a wrapper with `overflow: hidden`
    // would freeze it. The text's own place is folded in by measureRange.
    this.scrolling = new ScrollController(this, {
      property: PROGRESS_PROPERTY,
      // On the text, not the host: WebKit re-resolves the host's own lengths
      // while an animation drives one of its properties, and reads a `rem`
      // in --scroll-text-length as an `em`.
      styleTarget: () => this.textEl,
      ...(source ? { source: () => source } : {}),
    })
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(this.measureRange)
      this.resizeObserver.observe(this)
      // The page (or container) growing or shrinking moves where the text can scroll to.
      const content = source ?? document.documentElement
      if (content) this.resizeObserver.observe(content)
    }
    this.measureRange()
  }

  private stopFollowing(): void {
    if (this.scrolling) {
      this.scrolling.hostDisconnected()
      this.removeController(this.scrolling)
    }
    this.scrolling = null
    this.mapping = null
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.textEl?.style.removeProperty(PROGRESS_PROPERTY)
  }

  /** Works out where the words light, from the element's size and place. Runs on resize, never while scrolling. */
  private readonly measureRange = (): void => {
    if (!this.scrolling || typeof window === 'undefined') return
    const source = this.source
    const page = document.scrollingElement ?? document.documentElement
    const scroller = source ?? page
    if (!scroller) return
    const box = this.getBoundingClientRect()
    const viewport = source
      ? source.clientHeight
      : document.documentElement.clientHeight || window.innerHeight
    const portTop = source
      ? source.getBoundingClientRect().top + source.clientTop
      : 0
    const top = box.top - portTop
    const scrolled = scroller.scrollTop
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
    const travel = viewport + box.height
    if (travel <= 0) return
    // The text's view progress, 0 as its top enters the bottom of the
    // viewport and 1 as its bottom leaves the top, moves in step with the
    // container's scroll progress: view = start + rate × scroll.
    const start = (viewport - (top + scrolled)) / travel
    const rate = maxScroll / travel
    this.mapping = { start, rate }
    this.range = scrollTextRange({
      viewport,
      height: box.height,
      isPinned: this.isPinned,
      last: clamp(start + rate),
    })
    this.writeRange()
  }

  /**
   * Each word lights as `scroll progress × k − c` passes its index, so the
   * host holds two numbers and each word only its index (`--word-index`,
   * from the splitter). Until they are known, every word shows.
   */
  private writeRange(): void {
    const range = this.range
    const mapping = this.mapping
    if (!range || !mapping || this.wordCount === 0) {
      this.style.removeProperty('--_scroll-text-k')
      this.style.removeProperty('--_scroll-text-c')
      return
    }
    // In view progress a word lights at view × perView − from × perView;
    // substituting view = start + rate × scroll gives k and c.
    const perView = this.wordCount / (range.to - range.from)
    const k = mapping.rate * perView
    const c = (range.from - mapping.start) * perView
    this.style.setProperty('--_scroll-text-k', String(round(k)))
    this.style.setProperty('--_scroll-text-c', String(round(c)))
  }

  protected override render() {
    return html`<div part="stage" class="stage">
      <span part="text" class="text"></span>
    </div>`
  }
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000
}

defineElement('moul-scroll-text', MoulScrollText)

declare global {
  interface HTMLElementTagNameMap {
    'moul-scroll-text': MoulScrollText
  }
}
