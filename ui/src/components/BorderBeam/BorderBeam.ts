import { html, LitElement } from 'lit'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { borderBeamStyles } from './BorderBeam.styles'

// Where the browser cannot move the beam along the border, a conic ring turns
// instead, by animating this angle. Shadow roots ignore `@property`, so it is
// registered once here; where registration is missing (or the page already
// did it) that ring simply stays still.
try {
  CSS.registerProperty({
    name: '--moul-border-beam-angle',
    syntax: '<angle>',
    inherits: false,
    initialValue: '0deg',
  })
} catch {
  // Already registered, or the browser cannot register properties.
}

/**
 * A short, bright beam of light that travels round the border of a box at a
 * steady speed, following its rounded corners, to draw the eye to one card:
 * the plan you recommend on a pricing page, a sign-up panel, a product shot
 * in a browser frame. Wrap the box in it (usually a `moul-card`); it draws a
 * thin ring over the box's own edge and never clips or pads it. It takes the
 * card's radius by default, and the beam follows whatever `border-radius` you
 * give the element. Left empty, with `position: absolute; inset: 0;
 * border-radius: inherit`, it is an overlay for any positioned box; a second
 * one with `--border-beam-delay` sends two beams round. The beam is CSS only
 * and stops while off screen. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The ring is
 * decorative and hidden from assistive technology; the wrapped content is
 * read and reached with Tab as if the element were not there. Where the
 * system forces its own colours (Windows high contrast) and when printing,
 * the ring is not drawn.
 *
 * Reduced motion: the beam does not travel. A still, soft highlight rests on
 * the corner where it would start (the top left, or the top right in
 * right-to-left text).
 *
 * @slot - The box to light up: a card, a frame, an image or a panel.
 *
 * @csspart border - The ring the beam shows through. It sits over the content's edge and ignores the pointer.
 *
 * @cssprop --border-beam-size - Length of the beam. Defaults to `80px`.
 * @cssprop --border-beam-width - Width of the ring the beam shows through. Defaults to `1.5px`.
 * @cssprop --border-beam-duration - Time for one trip round the border. Defaults to `6s`.
 * @cssprop --border-beam-delay - How far into its trip the beam starts, as a time, so two beams can travel apart; it never waits. Defaults to `0s`.
 * @cssprop --border-beam-color-from - Colour of the beam's head. Defaults to `var(--color-accent)`.
 * @cssprop --border-beam-color-to - Colour the beam fades through towards its tail. Defaults to `var(--color-chart-4)`.
 */
export class MoulBorderBeam extends LitElement {
  static override styles = borderBeamStyles

  static override properties = {
    isReverse: { type: Boolean, reflect: true, attribute: 'is-reverse' },
  }

  /** Send the beam round the other way: anticlockwise, or clockwise in right-to-left text. */
  declare isReverse: boolean

  constructor() {
    super()
    this.isReverse = false
    // Pauses the beam while the element is off screen (the controller's default).
    new InViewController(this)
  }

  protected override render() {
    return html`<slot></slot>
      <div part="border" aria-hidden="true"><div class="beam"></div></div>`
  }
}

defineElement('moul-border-beam', MoulBorderBeam)

declare global {
  interface HTMLElementTagNameMap {
    'moul-border-beam': MoulBorderBeam
  }
}
