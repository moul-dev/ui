import { html, LitElement, type PropertyValues } from 'lit'
import { styleMap } from 'lit/directives/style-map.js'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { perspectiveGridStyles } from './PerspectiveGrid.styles'

/** `floor` is a grid plane running back to a horizon; `tunnel` is four grid walls meeting at a vanishing point in the centre. */
export type PerspectiveGridVariant = 'floor' | 'tunnel'

const VARIANTS: readonly PerspectiveGridVariant[] = ['floor', 'tunnel']

const DEFAULT_ANGLE = 65
const MIN_ANGLE = 0
const MAX_ANGLE = 85

/** How far back the floor is seen from, in host heights; it must match the stage's `perspective` in the stylesheet. */
const VIEW_DISTANCE = 1.5

/** The fade's reach when the floor lies flat and the horizon is infinitely far up. */
const MAX_REACH = 100

function clampAngle(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_ANGLE
  return Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, value))
}

/** The walls of the tunnel, each built the same way and turned into place by the stylesheet. */
const WALLS = ['top', 'bottom', 'left', 'right'] as const

/**
 * A grid of lines receding into depth behind whatever you put inside it,
 * for a hero or a call to action with a retro or technical look. `floor`
 * lays the grid on a plane that runs back to a horizon about a third of the
 * way down, with its lines converging on a point in the middle; `tunnel`
 * builds four grid walls, top, bottom, left and right, that meet at a
 * vanishing point in the centre. The lines flow slowly toward the viewer, and the grid fades
 * out toward the horizon or the vanishing point, so it sits on any
 * background. `angle` tilts the floor: lower looks down on it from above,
 * higher looks along it, with the horizon lower. Wrap content in it, or leave
 * it empty and position it absolutely as a layer behind a section's content.
 * It is drawn with CSS 3D transforms and gradients in the theme's foreground
 * colour, so it reads on light and dark pages, and the movement pauses while
 * it is off screen. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The grid is
 * decorative and hidden from screen readers (`aria-hidden`); the content
 * inside is read and focused as usual. Where the system forces its own
 * colours (Windows high contrast) the grid is not drawn.
 *
 * Reduced motion: the grid holds still.
 *
 * @slot - The content shown in front of the grid. Leave it empty to use the element as a layer.
 *
 * @csspart background - The decorative layer behind the content that holds the grid.
 *
 * @cssprop --perspective-grid-size - The size of one cell, as a CSS length, where the grid is nearest. Defaults to `60px`.
 * @cssprop --perspective-grid-color - The colour of the lines. Defaults to `--color-fg` at 22%.
 * @cssprop --perspective-grid-line-width - The width of the lines where the grid is nearest. Defaults to `1px`.
 * @cssprop --perspective-grid-duration - The time the lines take to move one cell toward the viewer. Defaults to `1s`.
 */
export class MoulPerspectiveGrid extends LitElement {
  static override styles = perspectiveGridStyles

  static override properties = {
    variant: { type: String, reflect: true },
    angle: { type: Number },
  }

  /** A floor running back to a horizon, or a tunnel of four walls. Defaults to `floor`. */
  declare variant: PerspectiveGridVariant
  /** How far the floor tilts back from facing the viewer, in degrees from 0 to 85. Only `floor` uses it. Defaults to 65. */
  declare angle: number

  constructor() {
    super()
    this.variant = 'floor'
    this.angle = DEFAULT_ANGLE
    // Pauses the flowing lines while the grid is off screen (the controller's default).
    new InViewController(this)
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('variant') && !VARIANTS.includes(this.variant)) {
      this.variant = 'floor'
    }
    if (changed.has('angle')) {
      const angle = clampAngle(this.angle)
      if (angle !== this.angle) this.angle = angle
    }
  }

  protected override render() {
    const radians = (this.angle * Math.PI) / 180
    // The share of the host's height between the horizon and the bottom edge,
    // for the fade to follow: the viewing distance over tan(angle).
    const reach = Math.min(MAX_REACH, VIEW_DISTANCE / Math.tan(radians))
    const stageStyle = styleMap({
      '--_perspective-grid-angle': `${this.angle}deg`,
      '--_perspective-grid-reach': String(
        Number.isFinite(reach) ? Number(reach.toFixed(4)) : MAX_REACH,
      ),
    })
    const planes =
      this.variant === 'tunnel'
        ? WALLS.map(
            (wall) =>
              html`<div class="plane wall wall-${wall}">
                <div class="lines"></div>
              </div>`,
          )
        : html`<div class="plane floor"><div class="lines"></div></div>`
    return html`<div part="background" class="background" aria-hidden="true">
        <div class="stage" style=${stageStyle}>${planes}</div>
      </div>
      <slot></slot>`
  }
}

defineElement('moul-perspective-grid', MoulPerspectiveGrid)

declare global {
  interface HTMLElementTagNameMap {
    'moul-perspective-grid': MoulPerspectiveGrid
  }
}
