import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { InViewController } from '../../controllers/in-view.controller'
import {
  PointerController,
  type PointerState,
} from '../../controllers/pointer.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { glowBorderStyles } from './GlowBorder.styles'

/**
 * The angle of the lit arc, 0 at the top and clockwise. Registered so it can
 * ease from one side to the next; shadow roots ignore `@property`, so it is
 * registered once here. Where registration is missing the arc jumps instead.
 */
const ANGLE_PROPERTY = '--moul-glow-border-angle'
/** How brightly the arc shows, 0 to 1. */
const INTENSITY_PROPERTY = '--_glow-border-intensity'
const SPREAD_PROPERTY = '--_glow-border-spread'
const BLUR_PROPERTY = '--_glow-border-blur'

try {
  CSS.registerProperty({
    name: ANGLE_PROPERTY,
    syntax: '<angle>',
    inherits: true,
    initialValue: '0deg',
  })
} catch {
  // Already registered, or the browser cannot register properties.
}

const DEFAULT_PROXIMITY = 64
const DEFAULT_SPREAD = 80
/**
 * Around the very middle of the box the angle to the pointer swings wildly
 * with tiny moves; inside this share of the box the arc stays where it is.
 */
const STILL_ZONE = 0.12

/**
 * A border that lights up on the side nearest the pointer, as if a light
 * followed it round the edge: the arc slides round as the pointer moves,
 * brightens as it comes close and fades once it is more than `proximity`
 * pixels away. Use it on a grid of cards, a pricing plan or a feature tile,
 * where a pointer passing between the boxes lights the edges it is near.
 * Wrap the box in it (usually a `moul-card`); it draws a thin ring over the
 * box's own edge and never clips or pads it, and takes the card's radius
 * unless you give it a `border-radius`. Left empty, with `position: absolute;
 * inset: 0; border-radius: inherit`, it is an overlay for any positioned box.
 * `spread` sets how much of the edge the light covers, `blur` adds a soft
 * halo round the arc, and the colours come from the theme. Only a mouse or a
 * pen lights it; the pointer is followed only while the box is on screen,
 * and the arc moves on the graphics card without laying the page out again.
 * It lives in the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The ring is
 * decorative and hidden from assistive technology; the wrapped content is
 * read and reached with Tab as if the element were not there. Where the
 * system forces its own colours (Windows high contrast) and when printing,
 * the ring is not drawn.
 *
 * Reduced motion: the light does not follow the pointer or slide round the
 * edge. While the pointer is over the box the whole ring lights evenly, and
 * it goes dark again when the pointer leaves, without fading. An empty
 * overlay stays dark.
 *
 * @slot - The box to light up: a card, a tile, an image or a panel.
 *
 * @csspart border - The ring the light shows through. It sits over the content's edge and ignores the pointer.
 * @csspart halo - The blurred light round the arc, drawn only when `blur` is above 0.
 *
 * @cssprop --glow-border-width - Width of the ring. Defaults to `2px`.
 * @cssprop --glow-border-colors - The colours along the lit arc, as a comma-separated list. Defaults to `var(--color-accent), var(--color-chart-4), var(--color-chart-2)`.
 * @cssprop --glow-border-duration - How long the arc takes to catch up with the pointer and to fade. Defaults to `0.4s`.
 */
export class MoulGlowBorder extends LitElement {
  static override styles = glowBorderStyles

  static override properties = {
    proximity: { type: Number },
    spread: { type: Number },
    glowBlur: { type: Number, attribute: 'blur' },
  }

  /** How far outside the box, in pixels, the pointer still lights it; the light fades out over this distance. Defaults to 64; 0 lights it only while the pointer is over the box. */
  declare proximity: number
  /** How much of the edge the light covers, in degrees round the box's centre. Defaults to 80. */
  declare spread: number
  /** Radius, in pixels, of a soft halo round the lit arc. Defaults to 0, no halo. Attribute `blur`. */
  declare glowBlur: number

  private pointer: PointerController | null = null
  private width = 0
  private height = 0
  /** The angle last written, unwrapped, so the next one can take the short way round. */
  private angle: number | null = null
  private intensity = 0
  private isReduced = false
  private stopWatchingMotion: (() => void) | null = null
  private resizeObserver: ResizeObserver | null = null

  constructor() {
    super()
    this.proximity = DEFAULT_PROXIMITY
    this.spread = DEFAULT_SPREAD
    this.glowBlur = 0
    // The pointer is followed only while the box is on screen.
    new InViewController(this, {
      pauseOffscreen: false,
      onChange: (isInView) => this.follow(isInView),
    })
  }

  /** The element the light is drawn on; it receives the angle and the intensity. */
  private get glowEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('.glow') ?? null
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      if (isReduced) this.fade()
    })
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerout', this.handleWindowOut)
    }
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(this.measure)
      this.resizeObserver.observe(this)
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerout', this.handleWindowOut)
    }
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.fade()
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    const glow = this.glowEl
    if (!glow) return
    if (changed.has('spread')) {
      const spread =
        Number.isFinite(this.spread) && this.spread > 0
          ? Math.min(this.spread, 360)
          : DEFAULT_SPREAD
      glow.style.setProperty(SPREAD_PROPERTY, `${spread}deg`)
    }
    if (changed.has('glowBlur')) {
      glow.style.setProperty(BLUR_PROPERTY, `${this.blurRadius}px`)
    }
  }

  private get blurRadius(): number {
    return Number.isFinite(this.glowBlur) && this.glowBlur > 0
      ? this.glowBlur
      : 0
  }

  /** Starts following the pointer when the box comes on screen and stops when it leaves. */
  private follow(isInView: boolean): void {
    if (isInView && !this.pointer) {
      this.pointer = new PointerController(this, {
        scope: 'window',
        pointerTypes: ['mouse', 'pen'],
        prefix: '--_glow-border-pointer',
        styleTarget: () => this.glowEl,
        onFrame: this.handleFrame,
      })
    } else if (!isInView && this.pointer) {
      this.pointer.hostDisconnected()
      this.removeController(this.pointer)
      this.pointer = null
      this.fade()
    }
  }

  private readonly measure = (): void => {
    this.width = this.offsetWidth
    this.height = this.offsetHeight
  }

  private readonly handleWindowOut = (event: PointerEvent): void => {
    // The pointer left the page: nothing is near the box any more.
    if (!event.relatedTarget) this.fade()
  }

  private readonly handleFrame = (state: PointerState): void => {
    if (this.isReduced) return
    if (this.width <= 0 || this.height <= 0) this.measure()
    const width = this.width
    const height = this.height
    if (width <= 0 || height <= 0) return

    const outsideX = Math.max(-state.x, 0, state.x - width)
    const outsideY = Math.max(-state.y, 0, state.y - height)
    const distance = Math.hypot(outsideX, outsideY)
    const reach =
      Number.isFinite(this.proximity) && this.proximity > 0 ? this.proximity : 0
    const intensity =
      distance === 0 ? 1 : reach > 0 ? Math.max(0, 1 - distance / reach) : 0

    const dx = state.x - width / 2
    const dy = state.y - height / 2
    const isStill = Math.hypot(dx / width, dy / height) < STILL_ZONE
    let angle = this.angle
    if (intensity > 0 && !(isStill && angle !== null)) {
      angle = glowAngle(dx, dy, this.angle)
    }
    this.write(angle, intensity)
  }

  private fade(): void {
    this.write(this.angle, 0)
  }

  private write(angle: number | null, intensity: number): void {
    const glow = this.glowEl
    if (!glow) return
    if (angle !== null && angle !== this.angle) {
      glow.style.setProperty(ANGLE_PROPERTY, `${round(angle)}deg`)
      this.angle = angle
    }
    const level = round(intensity, 3)
    if (level !== this.intensity) {
      glow.style.setProperty(INTENSITY_PROPERTY, String(level))
      this.intensity = level
    }
  }

  protected override render() {
    return html`<slot></slot>
      <div class="glow" aria-hidden="true">
        ${
          this.blurRadius > 0
            ? html`<div part="halo" class="halo"><div class="ring"></div></div>`
            : nothing
        }
        <div part="border" class="ring"></div>
      </div>`
  }
}

/**
 * The angle, 0 at the top and clockwise, from the box's centre towards a
 * point `dx`, `dy` from it. Given the previous angle, it returns the turn
 * nearest to it (possibly beyond 360 or below 0), so easing from one to the
 * other takes the short way round.
 */
export function glowAngle(
  dx: number,
  dy: number,
  previous: number | null = null,
): number {
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90
  const normal = ((angle % 360) + 360) % 360
  if (previous === null) return normal
  const delta = ((((normal - previous) % 360) + 540) % 360) - 180
  return previous + delta
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

defineElement('moul-glow-border', MoulGlowBorder)

declare global {
  interface HTMLElementTagNameMap {
    'moul-glow-border': MoulGlowBorder
  }
}
