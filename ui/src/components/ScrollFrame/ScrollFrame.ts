import { html, LitElement, type PropertyValues } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { styleMap } from 'lit/directives/style-map.js'
import { ScrollController } from '../../controllers/scroll.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { findScrollRoot } from '../../utils/scroll-root'
import { scrollFrameStyles } from './ScrollFrame.styles'

const DEFAULT_TILT = 20
const MAX_TILT = 60

/** The progress variable the script fallback writes on the base. */
const PROGRESS_PROPERTY = '--_scroll-frame-progress'

// The fallback writes progress on every scrolled frame. Registered as
// non-inheriting, with flat (1) as its starting value, it restyles only the
// frame and the header, which inherit it on purpose, never the content.
try {
  CSS.registerProperty({
    name: PROGRESS_PROPERTY,
    syntax: '<number>',
    inherits: false,
    initialValue: '1',
  })
} catch {
  // Already registered, or the browser cannot register properties.
}

/** Whether the browser can drive the tilt from a CSS view timeline, with no script while scrolling. */
function supportsViewTimeline(): boolean {
  try {
    return (
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('animation-timeline: view()')
    )
  } catch {
    return false
  }
}

/**
 * A screen that starts tilted back, like a laptop lid half open, and lies
 * flat as the reader scrolls it into view, while a heading above it rises
 * into place: a product shot that unfolds as the reader reaches it. Put the
 * screen in it (a `moul-browser-frame`, a `moul-phone-frame`, an image or
 * any box) and a heading in the `header` slot. `tilt` sets how far back it
 * starts, in degrees. It is flat by the time its middle reaches the middle
 * of the viewport, and stays flat from there on. Where the browser has
 * scroll-driven animations the tilt is a CSS animation on a view timeline,
 * and no script runs while the reader scrolls; elsewhere a passive scroll
 * listener drives it once per frame. Only transforms change, so the page is
 * never laid out again. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The header
 * and the content are read in order with their own semantics, and anything
 * focusable inside is reached with Tab as usual, tilted or not.
 *
 * Reduced motion: the screen is flat and the heading in place from the
 * start, and no script follows the scroll.
 *
 * @slot - The screen: a browser frame, a phone frame, an image or any box.
 * @slot header - A heading or intro above the screen that rises into place.
 *
 * @csspart base - The wrapper whose passage through the viewport drives the tilt.
 * @csspart header - The wrapper of the `header` slot.
 * @csspart frame - The wrapper that tilts; it holds the screen.
 *
 * @cssprop --scroll-frame-scale - The scale the screen starts at, easing to 1 as it lies flat. Defaults to `1.05`.
 * @cssprop --scroll-frame-perspective - The distance of the viewer from the screen; smaller looks deeper. Defaults to `1000px`.
 * @cssprop --scroll-frame-header-shift - How far below its place the heading starts. Defaults to `3rem`.
 * @cssprop --scroll-frame-gap - The space between the heading and the screen. Defaults to `var(--spacing-8, 2rem)`.
 */
export class MoulScrollFrame extends LitElement {
  static override styles = scrollFrameStyles

  static override properties = {
    tilt: { type: Number },
    hasHeader: { state: true },
  }

  /** How far back the screen starts, in degrees, from 0 to 60. Defaults to 20. */
  declare tilt: number
  private declare hasHeader: boolean

  private scrolling: ScrollController | null = null
  private isReduced = false
  private stopWatchingMotion: (() => void) | null = null

  constructor() {
    super()
    this.tilt = DEFAULT_TILT
    this.hasHeader = false
  }

  /** True where a native view timeline drives the tilt; false where the script fallback does. */
  public get isNative(): boolean {
    return supportsViewTimeline()
  }

  private get baseEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('[part="base"]') ?? null
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      this.syncFallback()
    })
    // The script follows the base, which only exists once rendered.
    if (this.hasUpdated) this.syncFallback()
  }

  protected override firstUpdated(): void {
    // Not every engine fires slotchange for the children a slot starts with.
    const header = this.renderRoot.querySelector<HTMLSlotElement>(
      'slot[name="header"]',
    )
    if (header) this.readHeader(header)
    this.syncFallback()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.stopFallback()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('tilt')) {
      const value = Number(this.tilt)
      this.tilt = Number.isFinite(value)
        ? Math.min(MAX_TILT, Math.max(0, value))
        : DEFAULT_TILT
    }
  }

  /** Follows the scroll by script only where there is no view timeline, and never under reduced motion. */
  private syncFallback(): void {
    const needsScript =
      this.isConnected && this.hasUpdated && !this.isReduced && !this.isNative
    if (!needsScript) {
      this.stopFallback()
      return
    }
    if (this.scrolling) return
    // A CSS view timeline follows the nearest scroll container; so does this.
    const container = findScrollRoot(this)
    this.scrolling = new ScrollController(this, {
      timeline: 'view',
      source: () => container,
      subject: () => this.baseEl,
      styleTarget: () => this.baseEl,
      property: PROGRESS_PROPERTY,
      forceFallback: true,
    })
  }

  private stopFallback(): void {
    if (!this.scrolling) return
    this.scrolling.hostDisconnected()
    this.removeController(this.scrolling)
    this.scrolling = null
    // Flat, rather than frozen wherever the last scroll left it.
    this.baseEl?.style.removeProperty(PROGRESS_PROPERTY)
  }

  private readonly handleHeaderChange = (event: Event): void => {
    this.readHeader(event.target as HTMLSlotElement)
  }

  private readHeader(slot: HTMLSlotElement): void {
    this.hasHeader = slot
      .assignedNodes({ flatten: true })
      .some(
        (node) =>
          node.nodeType === Node.ELEMENT_NODE ||
          (node.nodeType === Node.TEXT_NODE &&
            Boolean(node.textContent?.trim())),
      )
  }

  protected override render() {
    const baseStyle = { '--_scroll-frame-tilt': String(this.tilt) }
    return html`<div
      part="base"
      class=${classMap({ base: true, 'has-header': this.hasHeader })}
      style=${styleMap(baseStyle)}
    >
      <div part="header" class="header">
        <slot name="header" @slotchange=${this.handleHeaderChange}></slot>
      </div>
      <div part="frame" class="frame"><slot></slot></div>
    </div>`
  }
}

defineElement('moul-scroll-frame', MoulScrollFrame)

declare global {
  interface HTMLElementTagNameMap {
    'moul-scroll-frame': MoulScrollFrame
  }
}
