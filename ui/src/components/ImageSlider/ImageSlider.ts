import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { DragController } from '../../controllers/drag.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion } from '../../utils/motion'
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
import { imageSliderStyles } from './ImageSlider.styles'

/** How one image gives way to the next. */
export type ImageSliderEffect = 'fade' | 'slide' | 'zoom'

export interface ImageSliderSlideChangeDetail {
  index: number
}

const EFFECTS: readonly ImageSliderEffect[] = ['fade', 'slide', 'zoom']
const DEFAULT_INTERVAL = 5000
/** Length of the change between two images, in ms. */
const CHANGE_MS = 700
/** Longest wait for the next image to decode before it is shown anyway. */
const DECODE_WAIT_MS = 600
/** A horizontal swipe longer than this, in px, changes the image. */
const SWIPE_DISTANCE = 48
/** Or one faster than this, in px per second. */
const SWIPE_VELOCITY = 400
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
/** How far the zoom effect pushes in over one image's time on screen. */
const ZOOM_SCALE = 1.08

/** Set on each slide: `current` is shown, `leaving` is on its way out. */
const STATE_ATTRIBUTE = 'data-moul-slide'

/**
 * A full-width slideshow of images with a scrim and an overlay for a
 * headline and a button, as at the top of a travel or product page. Put
 * the images in it as `<img>` children, with `alt` text, and the overlay
 * content in `slot="overlay"`. Each image covers the frame
 * (`--image-slider-height`, `28rem` by default). One image gives way to the
 * next every `interval` milliseconds (5000 by default; 0 turns autoplay off),
 * with an `effect`: `fade` (the default), `slide`, or `zoom`, a cross-fade
 * with a slow push-in on the image being shown. The reader can swipe, use
 * the previous and next buttons or the dots, or the arrow keys, and the
 * slideshow goes round from the last image to the first. The next image is
 * decoded before it is shown, so it never flashes in half drawn. It lives in
 * the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: the slideshow is a region with
 * `aria-roledescription="carousel"` named by `label`. The play button comes
 * first in the tab order, then the frame, the previous and next buttons and
 * the dots ("Go to slide N", the current one marked with `aria-current`).
 * With focus on the frame, Left and Right change the image (mirrored in
 * right-to-left text) and Home and End go to the first and last. Images keep
 * their image role and `alt`; other slides get `role="group"`,
 * `aria-roledescription="slide"` and a "2 of 5" label. Only the image on
 * show is exposed: the rest are `inert`. A polite live region says
 * "Slide 2 of 5" and the image's `alt` after each change the reader makes,
 * and stays silent while autoplay turns. Autoplay holds while the pointer
 * is over the slideshow, while focus is inside it (except on the play
 * button), while it is off screen and while the tab is hidden, and the play
 * button stops it for good.
 *
 * Reduced motion: autoplay never starts and the play button is not shown,
 * images change at once with no fade, slide or zoom, and a swipe still
 * changes the image.
 *
 * @slot - The images, one element each; `<img>` with `alt` text is expected.
 * @slot overlay - Content over the images, such as a headline and a button.
 *
 * @csspart base - The region round the slideshow.
 * @csspart frame - The focusable box the images fill.
 * @csspart slides - The layer that stacks the images.
 * @csspart scrim - The shade over the images, under the overlay; shown when the overlay has content.
 * @csspart overlay - The box that centres the `overlay` slot.
 * @csspart prev - The previous-image button.
 * @csspart next - The next-image button.
 * @csspart play-button - The button that stops and starts autoplay.
 * @csspart dots - The row of dots.
 * @csspart dot - Each dot; the current one is also `dot-current`.
 * @csspart dot-current - The current dot.
 *
 * @cssprop --image-slider-height - The height of the frame. Defaults to `28rem`; set it to `auto` with `--image-slider-aspect-ratio` to size by shape instead.
 * @cssprop --image-slider-aspect-ratio - The frame's aspect ratio, such as `16 / 9`. Defaults to `auto`.
 * @cssprop --image-slider-radius - The frame's corner radius. Defaults to `0`.
 * @cssprop --image-slider-scrim - The scrim's background. Defaults to a dark gradient rising from the bottom.
 * @cssprop --image-slider-overlay-color - The overlay's text colour. Defaults to `var(--color-white)`, for text on photographs in either theme.
 *
 * @fires slidechange - When the slideshow moves to another image by swipe, key, button, dot, method or autoplay. `detail.index` is the new index. Not fired when the `index` property is set from outside.
 */
export class MoulImageSlider extends LitElement {
  static override styles = imageSliderStyles

  static override properties = {
    label: { type: String },
    effect: { type: String, reflect: true },
    interval: { type: Number, reflect: true },
    controls: { type: String, reflect: true },
    index: { type: Number, reflect: true },
    slideCount: { state: true },
    hasOverlay: { state: true },
    announcement: { state: true },
    isRotating: { state: true },
  }

  /** The slideshow's accessible name, such as "Mondulkiri in four days". */
  declare label: string
  /** How one image gives way to the next. Defaults to `fade`; an unknown value falls back to it. */
  declare effect: ImageSliderEffect
  /** Milliseconds each image is shown before the next; 0 turns autoplay off. Defaults to 5000. */
  declare interval: number
  /** Which controls to show: a token list of `arrows` and `dots`, or `none`. Defaults to `arrows dots`. */
  declare controls: string
  /** The image on show, from 0. */
  declare index: number
  private declare slideCount: number
  private declare hasOverlay: boolean
  private declare announcement: string
  private declare isRotating: boolean

  private readonly rotation: AutoplayController
  private slides: HTMLElement[] = []
  private labelled = new Set<HTMLElement>()
  /** The index whose image is on show, or on its way. */
  private shownIndex = -1
  /** Bumped on every change, so a slow decode never shows a stale image. */
  private changeId = 0
  private running: Animation[] = []
  private zoom: Animation | null = null
  private zoomTarget: HTMLElement | null = null

  constructor() {
    super()
    this.label = ''
    this.effect = 'fade'
    this.interval = DEFAULT_INTERVAL
    this.controls = 'arrows dots'
    this.index = 0
    this.slideCount = 0
    this.hasOverlay = false
    this.announcement = ''
    this.isRotating = false

    this.rotation = new AutoplayController(this, {
      interval: () =>
        Number.isFinite(this.interval) && this.interval > 0 ? this.interval : 0,
      onAdvance: () => this.select(this.index + 1, 'autoplay', 1),
      isPlayButton: (element) =>
        element instanceof Element &&
        element.getAttribute('part') === 'play-button',
      onRunningChange: (isRunning) => {
        this.isRotating = isRunning
        if (isRunning) this.zoom?.play()
        else this.zoom?.pause()
      },
    })

    // A swipe changes the image. The images lean a little way after the
    // finger (`--_swipe-x`, scaled down in the styles) and spring back.
    new DragController(this, {
      axis: 'x',
      handle: () => this.frameEl,
      styleTarget: () => this.frameEl,
      prefix: '--_swipe',
      disabled: () => this.slideCount < 2,
      release: (state) => {
        this.handleSwipe(state.deltaX, state.velocityX)
        return { x: 0, y: 0 }
      },
    })
  }

  /** Changes the image if a drag that travelled `travel` px was a swipe. */
  private handleSwipe(travel: number, velocity: number): void {
    let way = 0
    if (Math.abs(travel) > SWIPE_DISTANCE) way = Math.sign(travel)
    else if (Math.abs(velocity) > SWIPE_VELOCITY && Math.abs(travel) > 8) {
      way = Math.sign(velocity)
    }
    if (way === 0) return
    // Dragging toward the inline start brings the next image.
    const isTowardStart = isRtl(this) ? way > 0 : way < 0
    if (isTowardStart) this.next()
    else this.previous()
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    // Moved to another place in the page: the slot's children are unchanged,
    // so no slotchange comes to mark them again.
    if (this.hasUpdated) this.handleSlotChange()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.finishRunning()
    this.zoom?.cancel()
    this.zoom = null
    this.zoomTarget = null
    for (const slide of this.slides) {
      unlabelSlide(slide)
      setSlideHidden(slide, false)
      slide.removeAttribute(STATE_ATTRIBUTE)
    }
    this.labelled.clear()
    this.slides = []
    this.shownIndex = -1
  }

  /** Shows the next image, going round to the first after the last. */
  public next(): void {
    this.select(this.index + 1, 'user', 1)
  }

  /** Shows the previous image, going round to the last before the first. */
  public previous(): void {
    this.select(this.index - 1, 'user', -1)
  }

  /** Shows the image at `index`, from 0. */
  public goTo(index: number): void {
    this.select(index, 'user')
  }

  private get frameEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('.frame') ?? null
  }

  protected override firstUpdated(): void {
    // Not every engine reports the first assignment with slotchange.
    this.handleSlotChange()
    const overlay = this.renderRoot?.querySelector<HTMLSlotElement>(
      'slot[name="overlay"]',
    )
    if (overlay) this.readOverlay(overlay)
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('effect') && !EFFECTS.includes(this.effect)) {
      this.effect = 'fade'
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (
      changed.has('index') &&
      this.slides.length > 0 &&
      this.index !== this.shownIndex
    ) {
      // Set from outside: show it quietly, as a property should.
      const index = normalizeIndex(this.index, this.slides.length, true)
      if (index !== this.index) this.index = index
      void this.show(index, Math.sign(index - this.shownIndex) || 1, true)
    }
  }

  private select(
    target: number,
    source: 'user' | 'autoplay',
    direction?: number,
  ): void {
    const count = this.slides.length
    if (count === 0) return
    const index = normalizeIndex(target, count, true)
    const changed = index !== this.index
    const way = direction ?? (Math.sign(index - this.index) || 1)
    this.index = index
    if (source === 'user') {
      this.rotation.restart()
      const alt = this.slides[index]?.getAttribute('alt')
      this.announcement = `Slide ${index + 1} of ${count}${alt ? `: ${alt}` : ''}`
    }
    if (!changed) return
    void this.show(index, way, true)
    this.dispatchEvent(
      new CustomEvent<ImageSliderSlideChangeDetail>('slidechange', {
        detail: { index },
        bubbles: true,
        composed: true,
      }),
    )
  }

  /** Brings slide `index` in, from the side `direction` points to. */
  private async show(
    index: number,
    direction: number,
    animate: boolean,
  ): Promise<void> {
    const id = ++this.changeId
    this.shownIndex = index
    const incoming = this.slides[index]
    if (!incoming) return
    if (animate) await this.decoded(incoming)
    if (id !== this.changeId || !this.isConnected) return

    this.finishRunning()
    // Whatever is on screen now leaves, even if an earlier change was cut short.
    const outgoing = this.slides.find(
      (slide) => slide.getAttribute(STATE_ATTRIBUTE) === 'current',
    )
    const isMoving =
      animate &&
      outgoing !== undefined &&
      outgoing !== incoming &&
      !prefersReducedMotion() &&
      typeof incoming.animate === 'function'

    this.slides.forEach((slide) => {
      const state =
        slide === incoming
          ? 'current'
          : isMoving && slide === outgoing
            ? 'leaving'
            : null
      if (state) slide.setAttribute(STATE_ATTRIBUTE, state)
      else slide.removeAttribute(STATE_ATTRIBUTE)
      setSlideHidden(slide, slide !== incoming)
    })

    // The zoom on the image that is leaving runs on until it has faded out.
    const leavingZoom = this.zoomTarget === outgoing ? this.zoom : null
    if (!leavingZoom) this.zoom?.cancel()
    this.zoom = null
    this.zoomTarget = null
    if (this.effect === 'zoom' && !prefersReducedMotion()) {
      this.startZoom(incoming)
    }
    if (!isMoving || !outgoing) {
      leavingZoom?.cancel()
      return
    }

    const timing = { duration: CHANGE_MS, easing: EASE }
    if (this.effect === 'slide') {
      const side = direction * (isRtl(this) ? -1 : 1)
      this.running = [
        incoming.animate(
          [
            { transform: `translateX(${side * 100}%)` },
            { transform: 'translateX(0)' },
          ],
          timing,
        ),
        outgoing.animate(
          [
            { transform: 'translateX(0)' },
            { transform: `translateX(${side * -100}%)` },
          ],
          timing,
        ),
      ]
    } else {
      this.running = [
        incoming.animate([{ opacity: 0 }, { opacity: 1 }], timing),
      ]
    }
    const running = this.running
    Promise.all(running.map((animation) => animation.finished)).then(
      () => {
        if (outgoing.getAttribute(STATE_ATTRIBUTE) === 'leaving') {
          outgoing.removeAttribute(STATE_ATTRIBUTE)
        }
        leavingZoom?.cancel()
        if (this.running === running) this.running = []
      },
      () => {
        leavingZoom?.cancel()
      },
    )
    this.warm(normalizeIndex(index + direction, this.slides.length, true))
  }

  /** A slow push-in over the time the image is on screen. */
  private startZoom(slide: HTMLElement): void {
    if (typeof slide.animate !== 'function') return
    const shown = this.rotation.isEnabled ? this.interval : DEFAULT_INTERVAL
    this.zoomTarget = slide
    this.zoom = slide.animate(
      [{ transform: 'scale(1)' }, { transform: `scale(${ZOOM_SCALE})` }],
      { duration: shown + CHANGE_MS * 2, easing: 'linear', fill: 'forwards' },
    )
    if (this.rotation.isEnabled && !this.isRotating) this.zoom.pause()
  }

  /** Ends any change still running, so the next starts from rest. */
  private finishRunning(): void {
    for (const animation of this.running) {
      try {
        animation.finish()
      } catch {
        // An animation with no end cannot finish; it was cancelled anyway.
      }
    }
    this.running = []
  }

  /** Waits, briefly, for the slide's image to be ready to draw. */
  private async decoded(slide: HTMLElement): Promise<void> {
    const image = imageIn(slide)
    if (!image || image.complete || typeof image.decode !== 'function') return
    await Promise.race([
      image.decode().catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, DECODE_WAIT_MS)),
    ])
  }

  /** Starts decoding the image that will most likely come next. */
  private warm(index: number): void {
    const image = imageIn(this.slides[index])
    if (image && !image.complete && typeof image.decode === 'function') {
      image.decode().catch(() => {})
    }
  }

  private readonly handleSlotChange = (): void => {
    const slot =
      this.renderRoot?.querySelector<HTMLSlotElement>('slot:not([name])')
    const slides = slottedElements(slot ?? null)
    for (const slide of this.slides) {
      if (!slides.includes(slide)) {
        setSlideHidden(slide, false)
        slide.removeAttribute(STATE_ATTRIBUTE)
      }
    }
    this.slides = slides
    this.labelled = labelSlides(
      slides,
      this.labelled,
      (slide) => slide instanceof HTMLImageElement,
    )
    this.slideCount = slides.length
    const index = normalizeIndex(this.index, slides.length, true)
    if (index !== this.index) this.index = index
    this.shownIndex = -1
    void this.show(index, 1, false)
  }

  private readonly handleOverlayChange = (event: Event): void => {
    this.readOverlay(event.target as HTMLSlotElement)
  }

  private readOverlay(slot: HTMLSlotElement): void {
    this.hasOverlay = slot
      .assignedNodes({ flatten: true })
      .some(
        (node) =>
          node.nodeType === Node.ELEMENT_NODE ||
          Boolean(node.textContent?.trim()),
      )
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.composedPath()[0] !== this.frameEl) return
    const intent = slideIntent(event, isRtl(this))
    if (!intent) return
    event.preventDefault()
    if (intent === 'next') this.next()
    else if (intent === 'previous') this.previous()
    else if (intent === 'first') this.select(0, 'user', -1)
    else this.select(this.slides.length - 1, 'user', 1)
  }

  protected override render() {
    const { arrows, dots } = parseControls(this.controls)
    const hasSlides = this.slideCount > 1
    const showPlay = this.rotation.isEnabled && hasSlides
    const isPaused = this.rotation.isPaused

    return html`<div
      part="base"
      class="slider"
      role="region"
      aria-roledescription="carousel"
      aria-label=${this.label || nothing}
      data-effect=${this.effect}
    >
      ${
        showPlay
          ? html`<button
            type="button"
            part="play-button"
            class="control play"
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
      <div
        part="frame"
        class="frame"
        role="group"
        aria-label="Slides"
        tabindex="0"
        @keydown=${this.handleKeyDown}
      >
        <div part="slides" class="slides">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div part="scrim" class="scrim" ?hidden=${!this.hasOverlay}></div>
        <div part="overlay" class="overlay">
          <slot name="overlay" @slotchange=${this.handleOverlayChange}></slot>
        </div>
      </div>
      ${
        arrows && hasSlides
          ? html`<button
              type="button"
              part="prev"
              class="control arrow prev"
              aria-label="Previous slide"
              @click=${() => this.previous()}
            >
              ${slideIcons.previous()}
            </button>
            <button
              type="button"
              part="next"
              class="control arrow next"
              aria-label="Next slide"
              @click=${() => this.next()}
            >
              ${slideIcons.next()}
            </button>`
          : nothing
      }
      ${dots ? renderDots(this.slideCount, this.index, (i) => this.select(i, 'user')) : nothing}
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

/** The slide itself when it is an image, else the first image inside it. */
function imageIn(slide: HTMLElement | undefined): HTMLImageElement | null {
  if (!slide) return null
  if (slide instanceof HTMLImageElement) return slide
  return slide.querySelector('img')
}

defineElement('moul-image-slider', MoulImageSlider)

declare global {
  interface HTMLElementTagNameMap {
    'moul-image-slider': MoulImageSlider
  }
}
