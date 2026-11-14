import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { findScrollRoot } from '../../utils/scroll-root'
import { tracingBeamStyles } from './TracingBeam.styles'

/** The variable the script fallback writes on the host, 0 to 1. */
const PROGRESS_PROPERTY = '--_tracing-beam-progress'
const START_PROPERTY = '--tracing-beam-start'
const DEFAULT_START = '50%'

/** A box on screen, in viewport pixels, measured along the block axis. */
interface Span {
  top: number
  bottom: number
}

/**
 * How far through its range the beam is, 0 to 1. `port` is the visible part
 * of the scroll container and `start` how far down it the article's top must
 * come before the beam begins, in pixels.
 *
 * This is the `contain` range of a view timeline whose scrollport is inset by
 * `start` at the top: a long article starts when its top reaches that line
 * and ends when its bottom reaches the bottom of the view, so the beam always
 * fills, even when the article ends the page. A short one starts once it is
 * fully in view and ends when its top reaches the line.
 */
export function tracingBeamProgress(
  subject: Span,
  port: Span,
  start: number,
): number {
  const from = port.top + start
  const height = subject.bottom - subject.top
  const begin = Math.max(from, port.bottom - height)
  const end = Math.min(from, port.bottom - height)
  if (begin === end) return subject.top <= begin ? 1 : 0
  return Math.min(1, Math.max(0, (begin - subject.top) / (begin - end)))
}

/** Whether CSS can run scroll-driven animations, so no script has to follow the scroll. */
function supportsScrollTimelines(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('animation-timeline: view()')
  )
}

/**
 * A line in the gutter beside an article that fills from the top as the
 * reader scrolls through it, with a bright head that travels down the line
 * and a dot at the top that lights once reading starts. It shows how far
 * through a long post, changelog or guide the reader is, next to the text
 * itself. Wrap the article in it; it adds a gutter on the inline start (the
 * right in right-to-left text) and the line runs the full height of the
 * content, following it as images load or the text reflows. The beam starts
 * when the top of the article reaches `--tracing-beam-start` down the view,
 * halfway by default, and fills when its end comes into view, so it always
 * completes, even when the article ends the page. It follows the nearest
 * scroll container, which is usually the page. Where the browser has
 * scroll-driven animations a native view timeline moves the beam and no
 * script runs while the reader scrolls; elsewhere a passive scroll listener
 * moves it once per frame. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The line,
 * the beam and the dot are decorative and hidden from assistive technology;
 * the article is read and reached with Tab as if the element were not there.
 * Where the system forces its own colours (Windows high contrast) the line
 * and the beam are drawn in system colours.
 *
 * Reduced motion: the beam keeps following the scroll, because the reader is
 * the one moving it, and it has no easing, spring or lag of its own, so it is
 * never ahead of or behind the page. The glowing head is not drawn; the line
 * simply fills.
 *
 * @slot - The article: headings, paragraphs, images, any content.
 *
 * @csspart rail - The column in the gutter that holds the line and the dot. It ignores the pointer.
 * @csspart track - The unfilled line, the full height of the content.
 * @csspart beam - The filled part of the line, a gradient that grows down the track.
 * @csspart head - The glowing point at the end of the beam.
 * @csspart dot - The ring at the top of the line.
 * @csspart dot-light - The light inside the dot, shown once reading starts.
 * @csspart content - The wrapper round the article, after the gutter.
 *
 * @cssprop --tracing-beam-start - How far down the view (a percentage of it, or a length) the article's top must come before the beam starts. Defaults to `50%`.
 * @cssprop --tracing-beam-gutter - The space on the inline start that holds the line. Defaults to `2.5rem`.
 * @cssprop --tracing-beam-width - The thickness of the line. Defaults to `2px`.
 * @cssprop --tracing-beam-dot-size - The size of the dot at the top. Defaults to `1.125rem`.
 * @cssprop --tracing-beam-from - The colour at the top of the beam. Defaults to `var(--color-chart-5)`.
 * @cssprop --tracing-beam-to - The colour at the head of the beam and of the lit dot. Defaults to `var(--color-chart-4)`.
 * @cssprop --tracing-beam-track - The colour of the unfilled line. Defaults to `var(--color-border)`.
 */
export class MoulTracingBeam extends LitElement {
  static override styles = tracingBeamStyles

  /** Whether the script fallback is following the scroll; false while CSS does it natively. */
  private isFollowing = false
  private frame = 0
  /** The scroll container being followed, or null for the page. */
  private container: Element | null = null
  /** `--tracing-beam-start` as read on the last resize: a fraction of the view, or pixels. */
  private start: { value: number; isFraction: boolean } = {
    value: 0.5,
    isFraction: true,
  }
  private written = ''
  private resizeObserver: ResizeObserver | null = null

  private readonly schedule = (): void => {
    if (this.frame || typeof requestAnimationFrame !== 'function') return
    this.frame = requestAnimationFrame(this.measure)
  }

  private readonly handleResize = (): void => {
    this.readStart()
    this.schedule()
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (supportsScrollTimelines() || typeof window === 'undefined') return
    this.isFollowing = true
    // The same box a CSS view timeline would follow.
    this.container = findScrollRoot(this)
    this.readStart()
    // Capture catches the scroll of any container, which does not bubble.
    window.addEventListener('scroll', this.schedule, {
      passive: true,
      capture: true,
    })
    window.addEventListener('resize', this.handleResize, { passive: true })
    if (typeof ResizeObserver === 'function') {
      // The article grows as images load: the beam's range moves with it.
      this.resizeObserver = new ResizeObserver(this.handleResize)
      this.resizeObserver.observe(this)
    }
    this.schedule()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    if (!this.isFollowing) return
    this.isFollowing = false
    window.removeEventListener('scroll', this.schedule, { capture: true })
    window.removeEventListener('resize', this.handleResize)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
    this.container = null
  }

  /** Reads `--tracing-beam-start` once per resize, never per frame. */
  private readStart(): void {
    if (typeof getComputedStyle !== 'function') return
    const raw =
      getComputedStyle(this).getPropertyValue(START_PROPERTY).trim() ||
      DEFAULT_START
    const match = /^(-?[\d.]+)(%|px|vh|svh|lvh|dvh|rem|em)?$/.exec(raw)
    if (!match) return
    const number = Number.parseFloat(match[1])
    if (!Number.isFinite(number)) return
    const unit = match[2] ?? 'px'
    if (unit === '%') {
      this.start = { value: number / 100, isFraction: true }
    } else if (unit.endsWith('vh')) {
      this.start = {
        value: (number / 100) * window.innerHeight,
        isFraction: false,
      }
    } else if (unit === 'rem' || unit === 'em') {
      const base = Number.parseFloat(
        getComputedStyle(unit === 'rem' ? document.documentElement : this)
          .fontSize,
      )
      this.start = {
        value: number * (Number.isFinite(base) ? base : 16),
        isFraction: false,
      }
    } else {
      this.start = { value: number, isFraction: false }
    }
  }

  /** One frame of the fallback: two box reads, then one write if the progress moved. */
  private readonly measure = (): void => {
    this.frame = 0
    if (!this.isFollowing) return
    const box = this.getBoundingClientRect()
    let port: Span
    if (this.container) {
      const rect = this.container.getBoundingClientRect()
      const top = rect.top + this.container.clientTop
      port = { top, bottom: top + this.container.clientHeight }
    } else {
      port = { top: 0, bottom: window.innerHeight }
    }
    const height = port.bottom - port.top
    const start = this.start.isFraction
      ? this.start.value * height
      : this.start.value
    const progress = tracingBeamProgress(box, port, start)
    const value = String(Math.round(progress * 10_000) / 10_000)
    if (value === this.written) return
    this.written = value
    this.style.setProperty(PROGRESS_PROPERTY, value)
  }

  protected override render() {
    return html`<div part="rail" class="rail" aria-hidden="true">
        <div part="track" class="track">
          <div part="beam" class="beam">
            <span part="head" class="head"></span>
          </div>
        </div>
        <span part="dot" class="dot"
          ><span part="dot-light" class="dot-light"></span
        ></span>
      </div>
      <div part="content" class="content"><slot></slot></div>`
  }
}

defineElement('moul-tracing-beam', MoulTracingBeam)

declare global {
  interface HTMLElementTagNameMap {
    'moul-tracing-beam': MoulTracingBeam
  }
}
