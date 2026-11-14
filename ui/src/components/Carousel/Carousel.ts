import { html, LitElement, nothing, type PropertyValues } from 'lit'
import {
  DragController,
  type DragState,
} from '../../controllers/drag.controller'
import { defineElement } from '../../utils/define-element'
import {
  AutoplayController,
  isRtl,
  labelSlides,
  normalizeIndex,
  parseControls,
  renderDots,
  setSlideHidden,
  slideIcons,
  slideIntent,
  slottedElements,
  unlabelSlide,
} from '../../utils/slides'
import { carouselStyles } from './Carousel.styles'

/** `start` lines each slide up with the inline start of the viewport; `center` centres it. */
export type CarouselAlign = 'start' | 'center'

export interface CarouselSlideChangeDetail {
  index: number
}

/** A flick faster than this, in px per second, always moves at least one slide. */
const FLICK_VELOCITY = 300
/** Seconds of travel a flick's velocity adds to where the drag was let go. */
const PROJECTION = 0.12
/** Autoplay interval for a bare `autoplay` attribute, in ms. */
const DEFAULT_AUTOPLAY = 5000

interface CarouselLayout {
  /** Distance from the track's inline start to each slide, in px. */
  starts: number[]
  widths: number[]
  /** How far the track moves for each snap point, in px; one per reachable index. */
  snaps: number[]
  /** The viewport's inline size. */
  viewport: number
  /** -1 when the track moves left to go forward, 1 in right-to-left text. */
  sign: number
}

const EMPTY_LAYOUT: CarouselLayout = {
  starts: [],
  widths: [],
  snaps: [],
  viewport: 0,
  sign: -1,
}

const autoplayConverter = {
  fromAttribute: (value: string | null): number => {
    if (value === null) return 0
    if (value.trim() === '') return DEFAULT_AUTOPLAY
    const ms = Number(value)
    return Number.isFinite(ms) && ms > 0 ? ms : 0
  },
  toAttribute: (value: number): string | null =>
    value > 0 ? String(value) : null,
}

/**
 * A row of slides the reader swipes or drags through, with previous and next
 * buttons, dots, and an optional autoplay, as in a testimonials row or a set
 * of story cards. Every child element is a slide. `--carousel-slide-size`
 * sets how wide each one is (100% by default, one at a time; `80%` lets the
 * next one peek in), `--carousel-gap` the space between them, and `align`
 * whether a slide comes to rest at the start of the viewport or in the
 * middle. A drag follows the pointer and, on release, settles on the
 * nearest slide, carried on by the speed of a flick. With `align="start"`
 * the row never scrolls past its last slide, so there are only as many
 * stops as it takes to reach the end. `is-loop` makes next on the last
 * slide go back to the first; `autoplay="6000"` moves on every six seconds.
 * It lives in the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: the carousel is a region with
 * `aria-roledescription="carousel"` named by `label`. The play button, when
 * there is autoplay, comes first in the tab order, then the previous and
 * next buttons, the slides and the dots ("Go to slide N", the current one
 * marked with `aria-current`). The slide area is focusable: Left and Right
 * move one slide (mirrored in right-to-left text), Home and End go to the
 * ends. Each slide without a name of its own gets `role="group"`,
 * `aria-roledescription="slide"` and a "2 of 5" label (an `<img>` slide
 * keeps its image role and `alt`); slides wholly out of
 * view are `inert`, so neither Tab nor a screen reader reaches content the
 * reader cannot see, and focusing a link in a half-visible slide brings that
 * slide into view. A polite live region says "Slide 2 of 5" after every
 * change the reader makes, and stays silent while autoplay turns. Autoplay
 * holds while the pointer is over the carousel, while focus is inside it
 * (except on the play button), while it is off screen and while the tab is
 * hidden, and the play button stops it for good.
 *
 * Reduced motion: slides change at once instead of springing, a drag still
 * follows the finger but the release jumps to its slide, and autoplay never
 * starts, so the play button is not shown.
 *
 * @slot - The slides, one element each.
 *
 * @csspart base - The region that holds the viewport and the controls.
 * @csspart viewport - The focusable window the slides move through; the drag starts here.
 * @csspart track - The row of slides that moves.
 * @csspart buttons - The play, previous and next buttons.
 * @csspart prev - The previous-slide button.
 * @csspart next - The next-slide button.
 * @csspart play-button - The button that stops and starts autoplay.
 * @csspart dots - The row of dots.
 * @csspart dot - Each dot; the current one is also `dot-current`.
 * @csspart dot-current - The current dot.
 *
 * @cssprop --carousel-slide-size - The inline size of each slide. Defaults to `100%`.
 * @cssprop --carousel-gap - The space between slides. Defaults to `1rem`.
 * @cssprop --carousel-viewport-padding - Room above and below the slides for their shadows, taken back with a negative margin. Defaults to `0.5rem`.
 *
 * @fires slidechange - When the carousel moves to another slide by drag, key, button, dot, method or autoplay. `detail.index` is the new index. Not fired when the `index` property is set from outside.
 */
export class MoulCarousel extends LitElement {
  static override styles = carouselStyles

  static override properties = {
    label: { type: String },
    controls: { type: String, reflect: true },
    align: { type: String, reflect: true },
    isLoop: { type: Boolean, reflect: true, attribute: 'is-loop' },
    autoplay: { converter: autoplayConverter, reflect: true },
    index: { type: Number, reflect: true },
    snapCount: { state: true },
    announcement: { state: true },
    isRotating: { state: true },
  }

  /** The carousel's accessible name, such as "Customer stories". */
  declare label: string
  /** Which controls to show: a token list of `arrows` and `dots`, or `none`. Defaults to `arrows dots`. */
  declare controls: string
  /** Where a slide comes to rest. Defaults to `start`. */
  declare align: CarouselAlign
  /** Next on the last slide goes to the first, and previous on the first to the last. */
  declare isLoop: boolean
  /** Milliseconds between slides when it turns on its own; 0 (the default) is off. A bare `autoplay` attribute means 5000. */
  declare autoplay: number
  /** The current slide, from 0. With `align="start"` the last few slides can share the last stop. */
  declare index: number
  /** How many stops the track has. */
  private declare snapCount: number
  private declare announcement: string
  private declare isRotating: boolean

  private readonly drag: DragController
  private readonly rotation: AutoplayController
  private slides: HTMLElement[] = []
  private labelled = new Set<HTMLElement>()
  private layout: CarouselLayout = EMPTY_LAYOUT
  /** The index the track is resting at or heading to. */
  private placedIndex = -1
  private hasLaidOut = false
  private resizeObserver: ResizeObserver | null = null
  private releaseIndex = 0

  constructor() {
    super()
    this.label = ''
    this.controls = 'arrows dots'
    this.align = 'start'
    this.isLoop = false
    this.autoplay = 0
    this.index = 0
    this.snapCount = 0
    this.announcement = ''
    this.isRotating = false

    this.drag = new DragController(this, {
      axis: 'x',
      handle: () => this.viewportEl,
      styleTarget: () => this.trackEl,
      prefix: '--_drag',
      elastic: 0.2,
      bounds: () => this.dragBounds(),
      disabled: () => this.layout.snaps.length < 2,
      release: (state) => {
        this.releaseIndex = this.indexForRelease(state)
        return { x: this.layout.snaps[this.releaseIndex] ?? 0, y: 0 }
      },
      onEnd: () => {
        this.select(this.releaseIndex, 'user', { isPlaced: true })
      },
    })

    this.rotation = new AutoplayController(this, {
      interval: () => this.autoplay,
      onAdvance: () => {
        if (this.drag.state.isDragging) return
        this.select(this.index + 1, 'autoplay')
      },
      isPlayButton: (element) =>
        element instanceof Element &&
        element.getAttribute('part') === 'play-button',
      onRunningChange: (isRunning) => {
        this.isRotating = isRunning
      },
    })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('dragstart', this.handleNativeDrag)
    this.addEventListener('focusin', this.handleFocusIn)
    // Moved to another place in the page: the slot's children are unchanged,
    // so no slotchange comes to mark them and measure them again.
    if (this.hasUpdated) {
      this.watchSize()
      this.handleSlotChange()
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('dragstart', this.handleNativeDrag)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    for (const slide of this.slides) {
      unlabelSlide(slide)
      setSlideHidden(slide, false)
    }
    this.labelled.clear()
    this.slides = []
    this.hasLaidOut = false
  }

  /** Moves to the next slide; on the last one, to the first with `is-loop`. */
  public next(): void {
    this.select(this.index + 1, 'user')
  }

  /** Moves to the previous slide; on the first one, to the last with `is-loop`. */
  public previous(): void {
    this.select(this.index - 1, 'user')
  }

  /** Moves to the slide at `index`, from 0. */
  public goTo(index: number): void {
    this.select(index, 'user')
  }

  private get viewportEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('.viewport') ?? null
  }

  private get trackEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('.track') ?? null
  }

  private get slotEl(): HTMLSlotElement | null {
    return this.renderRoot?.querySelector('slot') ?? null
  }

  protected override firstUpdated(): void {
    this.watchSize()
    // Not every engine reports the first assignment with slotchange.
    this.handleSlotChange()
  }

  private watchSize(): void {
    if (this.resizeObserver || typeof ResizeObserver !== 'function') return
    this.resizeObserver = new ResizeObserver(() => this.relayout())
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('align') && this.align !== 'center') this.align = 'start'
    if (changed.has('controls') && this.controls == null) {
      this.controls = 'arrows dots'
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('align') && this.hasLaidOut) this.relayout()
    if (
      changed.has('index') &&
      this.hasLaidOut &&
      this.index !== this.placedIndex
    ) {
      // Set from outside: move there quietly, as a property should.
      const index = normalizeIndex(this.index, this.snapCount, this.isLoop)
      this.placedIndex = index
      if (index !== this.index) this.index = index
      this.moveTo(index, true)
    }
  }

  /** Changes the slide and keeps everything that depends on it in step. */
  private select(
    target: number,
    source: 'user' | 'autoplay',
    { isPlaced = false }: { isPlaced?: boolean } = {},
  ): void {
    const count = this.snapCount
    if (count === 0) return
    const wrap = this.isLoop || source === 'autoplay'
    const index = normalizeIndex(target, count, wrap)
    const changed = index !== this.index
    this.placedIndex = index
    this.index = index
    if (!isPlaced) this.moveTo(index, true)
    else this.hideOffscreen()
    if (source === 'user') {
      this.rotation.restart()
      this.announcement = `Slide ${index + 1} of ${count}`
    }
    if (changed) {
      this.dispatchEvent(
        new CustomEvent<CarouselSlideChangeDetail>('slidechange', {
          detail: { index },
          bubbles: true,
          composed: true,
        }),
      )
    }
  }

  private moveTo(index: number, animate: boolean): void {
    const x = this.layout.snaps[index] ?? 0
    this.hideOffscreen()
    if (animate && this.hasLaidOut) void this.drag.animateTo({ x, y: 0 })
    else this.drag.jumpTo({ x, y: 0 })
  }

  /** Reads where each slide sits and works out the stops. */
  private measure(): void {
    const viewport = this.viewportEl
    const track = this.trackEl
    if (!viewport || !track) return
    const rtl = isRtl(this)
    const trackBox = track.getBoundingClientRect()
    const width = viewport.getBoundingClientRect().width
    const boxes = this.slides.map((slide) => slide.getBoundingClientRect())
    // Offsets from the track's own edge, so its current translation cancels out.
    const starts = boxes.map((box) =>
      rtl ? trackBox.right - box.right : box.left - trackBox.left,
    )
    const widths = boxes.map((box) => box.width)
    const end = Math.max(0, ...starts.map((start, i) => start + widths[i]))
    const overflow = Math.max(0, end - width)
    const sign = rtl ? 1 : -1

    const distances: number[] = []
    if (this.align === 'center') {
      starts.forEach((start, i) => {
        distances.push(start - (width - widths[i]) / 2)
      })
    } else {
      for (const start of starts) {
        const distance = Math.min(Math.max(0, start), overflow)
        distances.push(distance)
        // Every later slide would rest at the same place: the end of the row.
        if (distance >= overflow - 0.5) break
      }
    }
    this.layout = {
      starts,
      widths,
      snaps: distances.map((distance) => round(sign * distance) || 0),
      viewport: width,
      sign,
    }
    this.snapCount = this.slides.length === 0 ? 0 : distances.length
  }

  private relayout(): void {
    if (this.drag.state.isDragging) return
    this.measure()
    // Not laid out yet (hidden, or not rendered): keep the index asked for.
    if (this.layout.viewport <= 0) return
    const index = normalizeIndex(this.index, this.snapCount, false)
    this.placedIndex = index
    if (index !== this.index) this.index = index
    this.moveTo(index, false)
    this.hasLaidOut = true
  }

  private dragBounds(): { left: number; right: number } {
    const snaps = this.layout.snaps
    if (snaps.length === 0) return { left: 0, right: 0 }
    return { left: Math.min(...snaps), right: Math.max(...snaps) }
  }

  /** The stop a drag let go with `state` should settle on. */
  private indexForRelease(state: DragState): number {
    const snaps = this.layout.snaps
    if (snaps.length === 0) return 0
    const projected = state.x + state.velocityX * PROJECTION
    let nearest = 0
    for (let i = 1; i < snaps.length; i++) {
      if (
        Math.abs(snaps[i] - projected) < Math.abs(snaps[nearest] - projected)
      ) {
        nearest = i
      }
    }
    if (
      nearest === this.index &&
      Math.abs(state.velocityX) > FLICK_VELOCITY &&
      Math.abs(state.deltaX) > 8
    ) {
      const isForward = Math.sign(state.velocityX) === this.layout.sign
      nearest = normalizeIndex(
        this.index + (isForward ? 1 : -1),
        snaps.length,
        false,
      )
    }
    return nearest
  }

  /** The stop that brings slide `slideIndex` into view. */
  private stopFor(slideIndex: number): number {
    if (this.align === 'center') return slideIndex
    return Math.min(slideIndex, Math.max(0, this.snapCount - 1))
  }

  /** The part of the row the viewport shows at the current index, as distances from the track's start. */
  private visibleRange(): [number, number] {
    const { snaps, sign, viewport } = this.layout
    const from = (snaps[this.index] ?? 0) * sign
    return [from, from + viewport]
  }

  /** Makes slides wholly outside the viewport inert, and the rest reachable. */
  private hideOffscreen(): void {
    const { starts, widths, viewport } = this.layout
    if (viewport <= 0) {
      for (const slide of this.slides) setSlideHidden(slide, false)
      return
    }
    const [from, to] = this.visibleRange()
    this.slides.forEach((slide, i) => {
      const start = starts[i] ?? 0
      const end = start + (widths[i] ?? 0)
      setSlideHidden(slide, end <= from + 1 || start >= to - 1)
    })
  }

  private isWhollyVisible(slideIndex: number): boolean {
    const [from, to] = this.visibleRange()
    const start = this.layout.starts[slideIndex] ?? 0
    const end = start + (this.layout.widths[slideIndex] ?? 0)
    return start >= from - 1 && end <= to + 1
  }

  private readonly handleSlotChange = (): void => {
    const slides = slottedElements(this.slotEl)
    for (const slide of this.slides) {
      if (!slides.includes(slide)) setSlideHidden(slide, false)
    }
    this.labelled = labelSlides(
      slides,
      this.labelled,
      (slide) => slide instanceof HTMLImageElement,
    )
    if (this.resizeObserver) {
      // The viewport sets the stops, and so do slides that size themselves.
      for (const slide of this.slides) this.resizeObserver.unobserve(slide)
      const viewport = this.viewportEl
      if (viewport) this.resizeObserver.observe(viewport)
      for (const slide of slides) this.resizeObserver.observe(slide)
    }
    this.slides = slides
    this.relayout()
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    // Arrow keys belong to the slide area itself, not to a field inside a slide.
    if (event.composedPath()[0] !== this.viewportEl) return
    const intent = slideIntent(event, isRtl(this))
    if (!intent) return
    event.preventDefault()
    if (intent === 'next') this.next()
    else if (intent === 'previous') this.previous()
    else if (intent === 'first') this.select(0, 'user')
    else this.select(this.snapCount - 1, 'user')
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    if (this.drag.state.isDragging) return
    const origin = event.composedPath()[0]
    if (!(origin instanceof Node)) return
    const slideIndex = this.slides.findIndex(
      (slide) => slide === origin || slide.contains(origin),
    )
    if (slideIndex < 0 || this.isWhollyVisible(slideIndex)) return
    this.select(this.stopFor(slideIndex), 'user')
  }

  /** A dragged image or link would take the pointer away from the drag. */
  private readonly handleNativeDrag = (event: DragEvent): void => {
    event.preventDefault()
  }

  protected override render() {
    const { arrows, dots } = parseControls(this.controls)
    const count = this.snapCount
    const hasStops = count > 1
    const isAtStart = !this.isLoop && this.index <= 0
    const isAtEnd = !this.isLoop && this.index >= count - 1
    const showPlay = this.rotation.isEnabled && hasStops
    const isPaused = this.rotation.isPaused

    return html`<div
      part="base"
      class="carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label=${this.label || nothing}
    >
      ${
        showPlay || (arrows && hasStops)
          ? html`<div part="buttons" class="buttons">
            ${
              showPlay
                ? html`<button
                  type="button"
                  part="play-button"
                  class="control"
                  aria-label=${
                    isPaused
                      ? 'Start automatic slide show'
                      : 'Stop automatic slide show'
                  }
                  @click=${() => this.rotation.toggle()}
                >
                  ${isPaused ? slideIcons.play() : slideIcons.pause()}
                </button>`
                : nothing
            }
            ${
              arrows && hasStops
                ? html`<button
                    type="button"
                    part="prev"
                    class="control arrow"
                    aria-label="Previous slide"
                    aria-disabled=${isAtStart ? 'true' : 'false'}
                    @click=${() => {
                      if (!isAtStart) this.previous()
                    }}
                  >
                    ${slideIcons.previous()}
                  </button>
                  <button
                    type="button"
                    part="next"
                    class="control arrow"
                    aria-label="Next slide"
                    aria-disabled=${isAtEnd ? 'true' : 'false'}
                    @click=${() => {
                      if (!isAtEnd) this.next()
                    }}
                  >
                    ${slideIcons.next()}
                  </button>`
                : nothing
            }
          </div>`
          : nothing
      }
      <div
        part="viewport"
        class="viewport"
        role="group"
        aria-label="Slides"
        tabindex="0"
        ?data-dragging=${this.drag.state.isDragging}
        @keydown=${this.handleKeyDown}
      >
        <div part="track" class="track">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
      </div>
      ${dots ? renderDots(count, this.index, (i) => this.select(i, 'user')) : nothing}
      <div
        class="visually-hidden"
        aria-live=${this.isRotating ? 'off' : 'polite'}
        aria-atomic="true"
      >
        ${this.announcement}
      </div>
    </div>`
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

defineElement('moul-carousel', MoulCarousel)

declare global {
  interface HTMLElementTagNameMap {
    'moul-carousel': MoulCarousel
  }
}
