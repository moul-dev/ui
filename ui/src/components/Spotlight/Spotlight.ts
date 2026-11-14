import { html, LitElement, type PropertyValues } from 'lit'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { spotlightStyles } from './Spotlight.styles'

/** `cone` is one long beam from a top corner, `lamp` a bright line with light spreading down from it, `sway` two beams from the top corners that swing slowly. */
export type SpotlightVariant = 'cone' | 'lamp' | 'sway'

/** Which top corner the `cone` falls from: `start` (left in left-to-right text), `center` (straight down from the middle) or `end`. */
export type SpotlightPlacement = 'start' | 'center' | 'end'

const VARIANTS: readonly SpotlightVariant[] = ['cone', 'lamp', 'sway']
const PLACEMENTS: readonly SpotlightPlacement[] = ['start', 'center', 'end']

/**
 * A soft light falling on a hero from above, to draw the eye to its heading.
 * `cone` (the default) is a large, soft, elongated ellipse of light that
 * falls diagonally from a top corner, chosen with `placement`, and fades and
 * slides into place when the element first scrolls into view. `lamp` is a
 * bright thin line across the top with a cone of light spreading down from
 * it over the content; both widen into place on entry. `sway` is two soft
 * beams from the top corners that swing slowly toward the middle and back,
 * all the time. Wrap the hero's content in it, or leave it empty and position
 * it absolutely over a section, as its background. The light is a near-white
 * glow on a dark page and the accent colour on a light page, where white
 * would not show. `play()` runs the entrance again. The motion is CSS only,
 * and `sway` pauses while the element is off screen. It lives in the effects
 * entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The light
 * is decoration: hidden from screen readers, and pointer events pass through
 * it, so the content inside is read and used as it is. Where the system
 * forces its own colours (Windows high contrast) the light is not drawn.
 *
 * Reduced motion: `cone` and `lamp` show the light in place from the start,
 * with no entrance; `sway` holds both beams still.
 *
 * @slot - The content to light. Leave it empty to use the element as a background layer.
 *
 * @csspart background - The layer the light is drawn in, behind the content. It fills the element and is clipped to its corners.
 *
 * @cssprop --spotlight-color - The colour of the light; the element sets how strongly each part of it shows, so give a solid colour. Defaults to `var(--color-accent)` on a light page and a near-white tinted with the accent on a dark one.
 * @cssprop --spotlight-duration - For `cone` and `lamp`, how long the entrance takes; for `sway`, one swing (the beams fade in over a quarter of it). Defaults to `2s`, and `8s` for `sway`.
 */
export class MoulSpotlight extends LitElement {
  static override styles = spotlightStyles

  static override properties = {
    variant: { type: String, reflect: true },
    placement: { type: String, reflect: true },
    isLit: { type: Boolean, reflect: true, attribute: 'is-lit' },
  }

  /** The kind of light. Defaults to `cone`. */
  declare variant: SpotlightVariant
  /**
   * Which top corner the `cone` falls from. `start` and `end` swap sides in
   * right-to-left text. `lamp` and `sway` ignore it. Defaults to `start`.
   */
  declare placement: SpotlightPlacement
  /**
   * Whether the light has come on. Set by the element when it first enters
   * the viewport; set it yourself to show the light without waiting.
   */
  declare isLit: boolean

  constructor() {
    super()
    this.variant = 'cone'
    this.placement = 'start'
    this.isLit = false
    // Not `once`: the controller keeps watching so the `sway` loop pauses off
    // screen (its default). The entrance still runs once, because nothing but
    // `play()` ever turns `isLit` off again.
    new InViewController(this, {
      onChange: (isInView) => {
        if (isInView) this.isLit = true
      },
    })
  }

  /**
   * Puts the light out and brings it on again, as for a replay button.
   * Resolves once the entrance has started.
   */
  public async play(): Promise<void> {
    this.isLit = false
    await this.updateComplete
    // Reading layout makes the browser apply the unlit state, so the entrance starts from it.
    void this.getBoundingClientRect()
    this.isLit = true
    await this.updateComplete
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('variant') && !VARIANTS.includes(this.variant)) {
      this.variant = 'cone'
    }
    if (changed.has('placement') && !PLACEMENTS.includes(this.placement)) {
      this.placement = 'start'
    }
  }

  protected override render() {
    return html`<div part="background" aria-hidden="true">${this.renderLight()}</div><slot></slot>`
  }

  private renderLight() {
    switch (this.variant) {
      case 'lamp':
        return html`<div class="lamp-cone"></div><div class="lamp-glow"></div><div class="lamp-line"></div>`
      case 'sway':
        return html`<div class="sway sway-start"></div><div class="sway sway-end"></div>`
      default:
        return html`<div class="cone"></div>`
    }
  }
}

defineElement('moul-spotlight', MoulSpotlight)

declare global {
  interface HTMLElementTagNameMap {
    'moul-spotlight': MoulSpotlight
  }
}
