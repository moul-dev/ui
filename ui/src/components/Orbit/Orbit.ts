import { html, LitElement, nothing } from 'lit'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { orbitStyles } from './Orbit.styles'

const DEFAULT_RADIUS = 120
const DEFAULT_DURATION = 20

/** Set on each item's inline style: its place in the ring, from 0. */
const INDEX_PROPERTY = '--moul-orbit-index'

// The ring turns by animating this angle, and each item turns back by the
// same angle, inherited, so the two never fall out of step. Shadow roots
// ignore `@property`, so it is registered once here; where registration is
// missing (or the page already did it) the angle cannot be animated smoothly.
try {
  CSS.registerProperty({
    name: '--moul-orbit-turn',
    syntax: '<angle>',
    inherits: true,
    initialValue: '0turn',
  })
} catch {
  // Already registered, or the browser cannot register properties.
}

/**
 * Icons, logos or avatars that travel round a centre on a ring, spaced
 * evenly and staying upright, as in an "integrates with" hero. Put the items
 * in it as child elements, each sized to `--orbit-item-size`, and anything
 * for the middle in `slot="center"`. `radius` sets the ring's size in
 * pixels, `duration` the seconds per turn, `is-reverse` turns it the other
 * way, `show-path` draws the ring as a faint circle, and `pause-on-hover`
 * holds it still under the pointer. For more rings, put another
 * `moul-orbit` in the centre slot; each ring keeps its own radius, speed and
 * direction. The element is a square, twice the radius plus one item, and
 * it re-spaces the items when you add or remove one. The movement is CSS
 * and pauses while the orbit is off screen. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The items
 * keep their own semantics and are read in DOM order, so give each image an
 * `alt` and each link a name; the ring path is `aria-hidden`. Any focus
 * inside holds the orbit still, so a focused link stays where it is.
 *
 * Reduced motion: nothing turns. The items rest at their places on the
 * ring, upright, as a still picture.
 *
 * @slot - The items, each one an element. Text outside an element is not placed on the ring.
 * @slot center - Content for the middle, such as a logo or another `moul-orbit` for an inner ring.
 *
 * @csspart orbit - The square that holds the ring and the centre.
 * @csspart path - The circle drawn along the ring, with `show-path`.
 * @csspart ring - The turning layer that carries the items.
 * @csspart center - The box that centres the `center` slot.
 *
 * @cssprop --orbit-item-size - The width and height of each item, and the room left round the ring for them. Defaults to `2.5rem`.
 * @cssprop --orbit-path-color - The colour of the path. Defaults to `var(--color-border)`.
 */
export class MoulOrbit extends LitElement {
  static override styles = orbitStyles

  static override properties = {
    radius: { type: Number },
    duration: { type: Number },
    isReverse: { type: Boolean, reflect: true, attribute: 'is-reverse' },
    showPath: { type: Boolean, reflect: true, attribute: 'show-path' },
    pauseOnHover: {
      type: Boolean,
      reflect: true,
      attribute: 'pause-on-hover',
    },
    itemCount: { state: true },
  }

  /** Distance from the centre to the middle of each item, in pixels. Defaults to 120. */
  declare radius: number
  /** Seconds per full turn. Defaults to 20. */
  declare duration: number
  /** Turn anticlockwise (clockwise in right-to-left text). */
  declare isReverse: boolean
  /** Draw the ring as a faint circle. */
  declare showPath: boolean
  /** Hold still while the pointer is over the orbit. */
  declare pauseOnHover: boolean
  /** How many items are on the ring. */
  private declare itemCount: number

  private readonly inView: InViewController
  /** The elements this ring has given an index, so it can take it back. */
  private placed = new Set<HTMLElement>()

  constructor() {
    super()
    this.radius = DEFAULT_RADIUS
    this.duration = DEFAULT_DURATION
    this.isReverse = false
    this.showPath = false
    this.pauseOnHover = false
    this.itemCount = 0
    // Pausing goes through animation-play-state in the stylesheet. Only the
    // ring animates; the items follow its angle, so they stop with it.
    this.inView = new InViewController(this, { pauseOffscreen: false })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    // Items already in place are numbered before the first render; the
    // parser's later items, and a reconnect, are handled the same way.
    this.placeItems()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    for (const item of this.placed) item.style.removeProperty(INDEX_PROPERTY)
    this.placed.clear()
  }

  private get radiusPx(): number {
    return Number.isFinite(this.radius) && this.radius > 0
      ? this.radius
      : DEFAULT_RADIUS
  }

  private get durationSeconds(): number {
    return Number.isFinite(this.duration) && this.duration > 0
      ? this.duration
      : DEFAULT_DURATION
  }

  /** The children the default slot takes: those with no `slot` attribute, or an empty one. */
  private get items(): HTMLElement[] {
    return [...this.children].filter(
      (child): child is HTMLElement =>
        'style' in child && !child.getAttribute('slot'),
    )
  }

  /** Numbers the items on the ring and takes the number back from any that left it. */
  private placeItems(): void {
    const items = this.items
    const current = new Set(items)
    for (const item of this.placed) {
      const owner = item.parentElement
      // An item moved into another orbit is that orbit's to number.
      const isInAnotherOrbit = owner instanceof MoulOrbit && owner !== this
      if (!current.has(item) && !isInAnotherOrbit) {
        item.style.removeProperty(INDEX_PROPERTY)
      }
    }
    items.forEach((item, index) => {
      item.style.setProperty(INDEX_PROPERTY, String(index))
    })
    this.placed = current
    this.itemCount = items.length
  }

  private readonly handleSlotChange = (): void => {
    this.placeItems()
  }

  protected override render() {
    const orbitClass = this.inView.isInView ? 'orbit' : 'orbit is-offscreen'
    // The ring's size and speed live on this shadow element, not the host,
    // so they never reach a nested orbit's items through inheritance.
    return html`<div
      part="orbit"
      class=${orbitClass}
      style="--_orbit-radius: ${this.radiusPx}px; --_orbit-duration: ${
        this.durationSeconds
      }s"
    >
      ${
        this.showPath
          ? html`<div part="path" class="path" aria-hidden="true"></div>`
          : nothing
      }
      <div part="center" class="center"><slot name="center"></slot></div>
      <div part="ring" class="ring" style="--_orbit-count: ${this.itemCount}">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    </div>`
  }
}

defineElement('moul-orbit', MoulOrbit)

declare global {
  interface HTMLElementTagNameMap {
    'moul-orbit': MoulOrbit
  }
}
