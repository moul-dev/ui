import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { InViewController } from '../../controllers/in-view.controller'
import { normalizeTone, type SemanticTone } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { highlightStyles } from './Highlight.styles'

/** `marker` is a highlighter band behind the words, `underline` a thick stroke under them, `box` and `circle` a hand-drawn shape around them. */
export type HighlightEffect = 'marker' | 'underline' | 'box' | 'circle'

const EFFECTS: readonly HighlightEffect[] = [
  'marker',
  'underline',
  'box',
  'circle',
]

/** The drawing waits until the words are this far inside the bottom of the viewport. */
const ROOT_MARGIN = '0px 0px -40px 0px'

/**
 * A marker stroke drawn on words as they scroll into view, to pick out the
 * phrase that matters in a heading or a paragraph. Wrap the words: `marker`
 * sweeps a highlighter band behind them, `underline` draws a thick stroke
 * under them, and both run line after line when the words wrap; `box` and
 * `circle` draw a hand-drawn rectangle or ellipse around them and keep them
 * on one line. The mark is a translucent or solid version of `tone` (a yellow
 * marker by default) and the text keeps its own colour. It draws once, the
 * first time the words enter the viewport, starting from the inline start,
 * so from the right in right-to-left text. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role; the words
 * are read as they are and the mark is decoration, hidden from screen
 * readers. When the emphasis carries meaning, put the words in `<mark>` or
 * `<strong>` inside the element, so it reaches screen readers too; a slotted
 * `<mark>` loses the browser's yellow so the drawn mark shows instead.
 *
 * Reduced motion: the mark is drawn from the start, with no animation. It is
 * also drawn when printing.
 *
 * @slot - The words to mark.
 *
 * @cssprop --highlight-color - The colour of the mark, in place of the tone's. The marker band mixes it at 40% with transparent; underline, box and circle use it as it is.
 */
export class MoulHighlight extends LitElement {
  static override styles = highlightStyles

  static override properties = {
    effect: { type: String, reflect: true },
    tone: { type: String, reflect: true },
    delay: { type: Number },
    duration: { type: Number },
    isDrawn: { type: Boolean, reflect: true, attribute: 'is-drawn' },
  }

  /** The kind of mark. Defaults to `marker`. */
  declare effect: HighlightEffect
  /** The colour of the mark. Defaults to `warning`, a yellow marker. */
  declare tone: SemanticTone
  /** Milliseconds to wait after the words enter the viewport. Defaults to 0. */
  declare delay: number
  /** Milliseconds the drawing takes. Defaults to 700. */
  declare duration: number
  /** Whether the mark is drawn. Set by the element when the words first enter the viewport. */
  declare isDrawn: boolean

  /** Size of the SVG the box or circle is drawn in, in pixels, once measured. */
  private shapeSize: { width: number; height: number } | null = null
  private observedShape: SVGSVGElement | null = null
  private resizeObserver: ResizeObserver | null = null

  constructor() {
    super()
    this.effect = 'marker'
    this.tone = 'warning'
    this.delay = 0
    this.duration = 700
    this.isDrawn = false
    new InViewController(this, {
      rootMargin: ROOT_MARGIN,
      once: true,
      // The drawing is a transition that ends on its own; pausing it would leave a half-drawn mark.
      pauseOffscreen: false,
      onChange: (isInView) => {
        if (isInView) this.isDrawn = true
      },
    })
  }

  /**
   * Erases the mark and draws it again, as for a replay button. Resolves once
   * the drawing has started.
   */
  public async play(): Promise<void> {
    this.isDrawn = false
    await this.updateComplete
    // Reading layout makes the browser apply the erased state, so the drawing starts from it.
    void this.getBoundingClientRect()
    this.isDrawn = true
    await this.updateComplete
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (this.hasUpdated) this.watchShape()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.observedShape = null
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('effect') && !EFFECTS.includes(this.effect)) {
      this.effect = 'marker'
    }
    if (changed.has('tone')) {
      const tone = normalizeTone(this.tone, 'warning')
      if (tone !== this.tone) this.tone = tone
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('duration')) {
      this.style.setProperty(
        '--_duration',
        `${Math.max(0, finite(this.duration, 700))}ms`,
      )
    }
    if (changed.has('delay')) {
      this.style.setProperty(
        '--_delay',
        `${Math.max(0, finite(this.delay, 0))}ms`,
      )
    }
    this.watchShape()
  }

  /** Measures the SVG a box or circle is drawn in, and redraws the path whenever its size changes. */
  private watchShape(): void {
    const svg = this.renderRoot.querySelector('svg')
    if (svg === this.observedShape) return
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.observedShape = svg
    if (!svg || typeof ResizeObserver !== 'function') return
    this.resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[entries.length - 1]?.contentRect
      if (!rect) return
      const { width, height } = rect
      if (
        this.shapeSize?.width === width &&
        this.shapeSize?.height === height
      ) {
        return
      }
      this.shapeSize = { width, height }
      this.requestUpdate()
    })
    this.resizeObserver.observe(svg)
  }

  protected override render() {
    if (this.effect !== 'box' && this.effect !== 'circle') {
      return html`<slot></slot>`
    }
    const size = this.shapeSize
    const isMeasured = size !== null && size.width > 0 && size.height > 0
    const path = isMeasured
      ? (this.effect === 'box' ? boxPath : circlePath)(size.width, size.height)
      : ''
    // No whitespace between the slot and the SVG: inside the line it would show as a space.
    return html`<slot></slot><svg aria-hidden="true" preserveAspectRatio="none" viewBox=${isMeasured ? `0 0 ${round(size.width)} ${round(size.height)}` : nothing}><path pathLength="1" d=${path || nothing}></path></svg>`
  }
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}

/** Room left between the path and the edge of its box, for the stroke. */
function insetFor(width: number, height: number): number {
  return Math.min(4, width / 4, height / 4)
}

/**
 * A hand-drawn rectangle filling a `width` × `height` box: slightly bowed
 * edges and uneven corners, starting near the top-left corner and running
 * past it at the end, the way a pen closes a box.
 */
function boxPath(width: number, height: number): string {
  const inset = insetFor(width, height)
  const wobble = Math.min(4, Math.max(1, Math.min(width, height) * 0.06))
  const left = inset
  const top = inset
  const right = width - inset
  const bottom = height - inset
  const midX = width / 2
  const midY = height / 2
  const p = (x: number, y: number) => `${round(x)} ${round(y)}`
  return [
    `M${p(left + 2 * wobble, top + wobble)}`,
    `Q${p(midX, top - wobble / 2)} ${p(right, top)}`,
    `Q${p(right + wobble / 2, midY)} ${p(right - wobble, bottom)}`,
    `Q${p(midX, bottom + wobble / 2)} ${p(left, bottom - wobble)}`,
    `Q${p(left - wobble / 2, midY)} ${p(left + wobble, top)}`,
    `L${p(left + 6 * wobble, top + wobble / 2)}`,
  ].join(' ')
}

/**
 * A hand-drawn ellipse filling a `width` × `height` box: it starts on the
 * left, a little above the middle, goes once round clockwise and carries on
 * past its start, widening slightly so the two ends do not meet.
 */
function circlePath(width: number, height: number): string {
  const inset = insetFor(width, height)
  const growth = 0.06
  const rx = Math.max(0, width / 2 - inset) / (1 + growth / 2)
  const ry = Math.max(0, height / 2 - inset) / (1 + growth / 2)
  const cx = width / 2
  const cy = height / 2
  const steps = 64
  const start = Math.PI * 1.1
  const sweep = Math.PI * 2 + 0.45
  const points: string[] = []
  for (let step = 0; step <= steps; step++) {
    const t = step / steps
    const angle = start + sweep * t
    const scale = 1 - growth / 2 + growth * t
    points.push(
      `${round(cx + rx * scale * Math.cos(angle))} ${round(cy + ry * scale * Math.sin(angle))}`,
    )
  }
  return `M${points.join(' L')}`
}

defineElement('moul-highlight', MoulHighlight)

declare global {
  interface HTMLElementTagNameMap {
    'moul-highlight': MoulHighlight
  }
}
