import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { backlightStyles } from './Backlight.styles'

const DEFAULT_BLUR = 20
const MAX_BLUR = 80
const DEFAULT_SATURATION = 2
const MAX_SATURATION = 10

let instances = 0

/**
 * A glow behind an image or a video that takes the media's own colours, as
 * if the screen lit the wall behind it. Put one `<img>`, `<video>`,
 * `<picture>` or `<canvas>` inside. An SVG filter blurs a copy of the media,
 * strengthens its colours and draws the media over it, so the glow follows
 * a playing video frame by frame. `blur` sets how far the glow spreads and
 * `saturation` how strong its colours are. The glow reaches about three
 * times `blur` pixels past the media, so leave room around it and keep it
 * out of containers that clip. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role; the media
 * keeps its own alt text, captions and controls. The glow is decoration and
 * is not exposed. Where the system forces its own colours (Windows high
 * contrast) there is no glow.
 *
 * Reduced motion: does not animate. A video's glow changes as the video
 * plays, which is the video's own motion; pause the video to still it.
 *
 * @slot - The image or video.
 *
 * @csspart base - The wrapper the filter is drawn on, around the media.
 */
export class MoulBacklight extends LitElement {
  static override styles = backlightStyles

  static override properties = {
    // `blur` would shadow HTMLElement.blur(), so the property has its own name.
    glowBlur: { type: Number, reflect: true, attribute: 'blur' },
    saturation: { type: Number, reflect: true },
  }

  /**
   * How far the glow spreads, as the blur's standard deviation in pixels,
   * from 0 to 80. Defaults to 20. The attribute is `blur`.
   */
  declare glowBlur: number
  /** How strong the glow's colours are: 1 keeps the media's own, higher is more vivid, 0 is grey. From 0 to 10. Defaults to 2. */
  declare saturation: number

  /** Unique per instance, in case a browser looks the filter up in the document rather than the shadow root. */
  private readonly filterId = `moul-backlight-${++instances}`
  private resizeObserver: ResizeObserver | null = null
  /** The wrapper's size, which the filter region is measured against; 0 until known. */
  private boxWidth = 0
  private boxHeight = 0

  constructor() {
    super()
    this.glowBlur = DEFAULT_BLUR
    this.saturation = DEFAULT_SATURATION
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (this.hasUpdated) this.observeSize()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed)
    this.observeSize()
  }

  /** The filter region grows with the media, so a wide blur is never cut off square. */
  private observeSize(): void {
    const base = this.renderRoot.querySelector<HTMLElement>('[part="base"]')
    if (!base || this.resizeObserver || typeof ResizeObserver !== 'function') {
      return
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      // The layout size, untouched by transforms, as the filter measures it.
      const rect = entries[entries.length - 1]?.contentRect
      if (!rect) return
      if (rect.width === this.boxWidth && rect.height === this.boxHeight) return
      this.boxWidth = rect.width
      this.boxHeight = rect.height
      this.requestUpdate()
    })
    this.resizeObserver.observe(base)
  }

  /**
   * The filter region, as fractions of the wrapper: three standard
   * deviations past each edge, where the blur has all but faded. Before the
   * size is known, half the size past each edge.
   */
  private region(): { x: string; y: string; width: string; height: string } {
    if (this.boxWidth <= 0 || this.boxHeight <= 0) {
      return { x: '-50%', y: '-50%', width: '200%', height: '200%' }
    }
    const reach = this.glowBlur * 3
    const x = reach / this.boxWidth
    const y = reach / this.boxHeight
    return {
      x: String(round(-x)),
      y: String(round(-y)),
      width: String(round(1 + 2 * x)),
      height: String(round(1 + 2 * y)),
    }
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('glowBlur')) {
      this.glowBlur = clamp(this.glowBlur, MAX_BLUR, DEFAULT_BLUR)
    }
    if (changed.has('saturation')) {
      this.saturation = clamp(
        this.saturation,
        MAX_SATURATION,
        DEFAULT_SATURATION,
      )
    }
  }

  protected override render() {
    const region = this.region()
    // The filter lives in this shadow root, and the url() resolves there.
    return html`<div part="base" style="filter: url(#${this.filterId})">
        <slot></slot>
      </div>
      <svg class="defs" aria-hidden="true" focusable="false" width="0" height="0">
        <filter
          id=${this.filterId}
          x=${region.x}
          y=${region.y}
          width=${region.width}
          height=${region.height}
        >
          <!-- No edgeMode="duplicate": WebKit then draws no glow, and squares
               the corners of rounded media. -->
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation=${this.glowBlur}
            result="blurred"
          ></feGaussianBlur>
          <feColorMatrix
            in="blurred"
            type="saturate"
            values=${this.saturation}
            result="glow"
          ></feColorMatrix>
          <feComposite
            in="SourceGraphic"
            in2="glow"
            operator="over"
          ></feComposite>
        </filter>
      </svg>`
  }
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000
}

/** `value` within 0 and `max`, or `fallback` when it is not a number. */
function clamp(value: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(0, value))
}

defineElement('moul-backlight', MoulBacklight)

declare global {
  interface HTMLElementTagNameMap {
    'moul-backlight': MoulBacklight
  }
}
