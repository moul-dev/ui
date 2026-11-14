import { html, LitElement } from 'lit'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { shineBorderStyles } from './ShineBorder.styles'

/**
 * A thin border whose colours drift slowly round a box, brightening one side
 * and then another, for a card that should look a little special without a
 * moving beam: a featured plan, a sign-up panel, a "new" announcement. Wrap
 * the box in it (usually a `moul-card`); it draws a ring over the box's own
 * edge and never clips or pads it. It takes the card's radius by default and
 * follows whatever `border-radius` you give the element. Left empty, with
 * `position: absolute; inset: 0; border-radius: inherit`, it is an overlay for
 * any positioned box. The colours default to the theme's accent and chart
 * colours; set your own with `--shine-border-colors`. The animation is CSS
 * only and stops while off screen. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The ring is
 * decorative and hidden from assistive technology; the wrapped content is
 * read and reached with Tab as if the element were not there. Where the
 * system forces its own colours (Windows high contrast) and when printing,
 * the ring is not drawn.
 *
 * Reduced motion: the colours stand still, spread once round the whole
 * border.
 *
 * @slot - The box to frame: a card, a frame, an image or a panel.
 *
 * @csspart border - The coloured ring. It sits over the content's edge and ignores the pointer.
 *
 * @cssprop --shine-border-colors - A comma-separated list of colours. Defaults to `var(--color-accent), var(--color-chart-4), var(--color-chart-3), var(--color-chart-2)`.
 * @cssprop --shine-border-width - Width of the ring. Defaults to `1px`.
 * @cssprop --shine-border-duration - Time for the colours to drift across and back. Defaults to `14s`.
 */
export class MoulShineBorder extends LitElement {
  static override styles = shineBorderStyles

  constructor() {
    super()
    // Pauses the drift while the element is off screen (the controller's default).
    new InViewController(this)
  }

  protected override render() {
    return html`<slot></slot>
      <div part="border" aria-hidden="true"></div>`
  }
}

defineElement('moul-shine-border', MoulShineBorder)

declare global {
  interface HTMLElementTagNameMap {
    'moul-shine-border': MoulShineBorder
  }
}
