import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { styleMap } from 'lit/directives/style-map.js'
import {
  PointerController,
  type PointerState,
} from '../../controllers/pointer.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { tiltStyles } from './Tilt.styles'

const DEFAULT_MAX_TILT = 10
const DEFAULT_PERSPECTIVE = 1000
const DEFAULT_HOVER_SCALE = 1.03
const MAX_TILT_LIMIT = 45

/** The prefix of the variables the pointer controller writes on the surface. */
const POINTER_PREFIX = '--_tilt-pointer'

// The pointer position changes on every frame. Registered as non-inheriting
// properties, it restyles the surface (and the glare, which inherits it on
// purpose) without restyling the whole card inside. Where registration is
// missing the variables simply inherit, which only costs a little more.
for (const [suffix, syntax, initialValue] of [
  ['x', '<length>', '0px'],
  ['y', '<length>', '0px'],
  ['ratio-x', '<number>', '0.5'],
  ['ratio-y', '<number>', '0.5'],
] as const) {
  try {
    CSS.registerProperty({
      name: `${POINTER_PREFIX}-${suffix}`,
      syntax,
      inherits: false,
      initialValue,
    })
  } catch {
    // Already registered, or the browser cannot register properties.
  }
}

/**
 * Tilts a card, an image or any box in 3D toward the pointer, as if the
 * pointer pressed on that corner, and lets it spring back flat when the
 * pointer leaves. Wrap the box in it: `max-tilt` sets how far it leans at the
 * edges, `hover-scale` how much it grows while tilted, `is-reversed` leans it
 * away from the pointer instead, and `glare` adds a soft light that follows
 * the pointer over the surface. Give the element the same `border-radius` as
 * the box so the glare keeps to its corners. Parts of the box can rise off
 * the surface: give the box `transform-style: preserve-3d` and lift any part
 * of it with `translate: 0 0 2rem`. Only a mouse or a pen tilts it; on a touch
 * screen the box stays flat. The tilt is one transform on one element, so the
 * page is never laid out again while the pointer moves. It lives in the
 * effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The content
 * is read and reached with Tab as if the element were not there, and focus
 * does not tilt it. The glare is decorative and hidden from assistive
 * technology.
 *
 * Reduced motion: the box stays flat and does not grow, and the glare does
 * not show.
 *
 * @slot - The box to tilt: a card, an image or a panel.
 *
 * @csspart surface - The layer that tilts; it holds the content and the glare.
 * @csspart glare - The soft light that follows the pointer, shown with `glare`.
 *
 * @cssprop --tilt-glare-color - The colour at the centre of the glare. Defaults to a soft white, a little brighter in light themes.
 * @cssprop --tilt-duration - How long the box takes to settle flat after the pointer leaves. Defaults to `700ms`.
 */
export class MoulTilt extends LitElement {
  static override styles = tiltStyles

  static override properties = {
    maxTilt: { type: Number, attribute: 'max-tilt' },
    perspective: { type: Number },
    hoverScale: { type: Number, attribute: 'hover-scale' },
    isReversed: { type: Boolean, reflect: true, attribute: 'is-reversed' },
    glare: { type: Boolean, reflect: true },
  }

  /** The most the box leans, in degrees, with the pointer on an edge. Defaults to 10. */
  declare maxTilt: number
  /** The distance of the viewer from the box, in pixels; smaller looks deeper. Defaults to 1000. */
  declare perspective: number
  /** The scale of the box while the pointer is over it. Defaults to 1.03; 1 keeps its size. */
  declare hoverScale: number
  /** Lean away from the pointer instead of toward it. */
  declare isReversed: boolean
  /** Show a soft light that follows the pointer over the surface. */
  declare glare: boolean

  private isReduced = false
  private stopWatchingMotion: (() => void) | null = null

  constructor() {
    super()
    this.maxTilt = DEFAULT_MAX_TILT
    this.perspective = DEFAULT_PERSPECTIVE
    this.hoverScale = DEFAULT_HOVER_SCALE
    this.isReversed = false
    this.glare = false
    // Registers itself with the host; it reads the host's box once per frame.
    new PointerController(this, {
      pointerTypes: ['mouse', 'pen'],
      prefix: POINTER_PREFIX,
      styleTarget: () => this.surfaceEl,
      onFrame: this.handlePointerFrame,
    })
  }

  /** Whether the box is tilted toward the pointer right now. */
  public get isTilted(): boolean {
    return this.surfaceEl?.classList.contains('is-active') ?? false
  }

  private get surfaceEl(): HTMLElement | null {
    return (
      this.renderRoot?.querySelector<HTMLElement>('[part="surface"]') ?? null
    )
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      if (isReduced) this.setActive(false)
    })
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.setActive(false)
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('maxTilt')) {
      const value = Number(this.maxTilt)
      this.maxTilt = Number.isFinite(value)
        ? Math.min(MAX_TILT_LIMIT, Math.max(0, value))
        : DEFAULT_MAX_TILT
    }
    if (changed.has('perspective')) {
      const value = Number(this.perspective)
      if (!Number.isFinite(value) || value <= 0) {
        this.perspective = DEFAULT_PERSPECTIVE
      }
    }
    if (changed.has('hoverScale')) {
      const value = Number(this.hoverScale)
      if (!Number.isFinite(value) || value <= 0) {
        this.hoverScale = DEFAULT_HOVER_SCALE
      }
    }
  }

  private readonly handlePointerFrame = (state: PointerState): void => {
    this.setActive(state.isInside && !this.isReduced)
  }

  private setActive(isActive: boolean): void {
    this.surfaceEl?.classList.toggle('is-active', isActive)
  }

  protected override render() {
    const surfaceStyle = {
      '--_tilt-max': String(this.maxTilt),
      '--_tilt-perspective': `${this.perspective}px`,
      '--_tilt-scale': String(this.hoverScale),
      '--_tilt-direction': this.isReversed ? '-1' : '1',
    }
    return html`<div part="surface" class="surface" style=${styleMap(surfaceStyle)}>
      <slot></slot>
      ${
        this.glare
          ? html`<span part="glare" class="glare" aria-hidden="true"></span>`
          : nothing
      }
    </div>`
  }
}

defineElement('moul-tilt', MoulTilt)

declare global {
  interface HTMLElementTagNameMap {
    'moul-tilt': MoulTilt
  }
}
