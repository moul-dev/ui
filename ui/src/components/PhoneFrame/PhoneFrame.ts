import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { phoneFrameStyles } from './PhoneFrame.styles'

/** `iphone`: a rounded slab with a pill cut-out and side buttons. `android`: squarer corners and a round camera hole. */
export type PhoneFrameVariant = 'iphone' | 'android'

const VARIANTS: readonly PhoneFrameVariant[] = ['iphone', 'android']

/**
 * A phone drawn around a screenshot or a video, in CSS only, for an app's
 * landing page or a mobile feature. `variant="iphone"` (the default) is a
 * rounded slab with a pill-shaped cut-out at the top of the screen and side
 * buttons; `variant="android"` has squarer corners and a round camera hole.
 * The shapes are generic, with no logos or brand marks. The screen has the
 * aspect ratio of a modern phone, 393:852 or 412:915, so a full-screen
 * screenshot fits it without cropping. Set the width with
 * `--phone-frame-width` and everything else scales with it, so the bezel stays
 * in proportion at any size; the phone is a size container, so markup on the
 * screen can scale with it in `cqi` units too. The bezel is dark in both
 * themes, as a phone is. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The bezel,
 * the cut-out and the buttons are decoration hidden from screen readers, so
 * they read only what is on the screen, with its own semantics; give a
 * screenshot alt text that says what it shows.
 *
 * Reduced motion: the frame never moves, so there is nothing to reduce. A
 * video on the screen is your own content: pause autoplay under reduced
 * motion as you would anywhere else.
 *
 * @slot - The screen. An image or a video covers it; any other markup starts at the top and is clipped to the screen.
 *
 * @csspart base - The phone's body: the bezel around the screen.
 * @csspart screen - The screen, which clips its content to the rounded corners.
 * @csspart island - The pill-shaped cut-out at the top of the screen (`iphone`).
 * @csspart camera - The round camera hole at the top of the screen (`android`).
 *
 * @cssprop --phone-frame-width - The phone's width, side buttons included; everything else scales with it. Defaults to `18rem`.
 * @cssprop --phone-frame-bezel - The colour of the bezel. Defaults to `var(--color-eclipse)`, dark in both themes.
 */
export class MoulPhoneFrame extends LitElement {
  static override styles = phoneFrameStyles

  static override properties = {
    variant: { type: String, reflect: true },
  }

  /** The shape of the phone. Defaults to `iphone`; an unknown value falls back to it. */
  declare variant: PhoneFrameVariant

  constructor() {
    super()
    this.variant = 'iphone'
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('variant') && !VARIANTS.includes(this.variant)) {
      this.variant = 'iphone'
    }
  }

  protected override render() {
    const isAndroid = this.variant === 'android'
    return html`<div part="base">
      <span class="buttons" aria-hidden="true">
        ${
          isAndroid
            ? html`<span class="button right power"></span>
              <span class="button right volume"></span>`
            : html`<span class="button left action"></span>
              <span class="button left volume-up"></span>
              <span class="button left volume-down"></span>
              <span class="button right power"></span>`
        }
      </span>
      <div part="screen">
        <slot></slot>
        ${
          isAndroid
            ? html`<span part="camera" aria-hidden="true"></span>`
            : html`<span part="island" aria-hidden="true"></span>`
        }
      </div>
    </div>`
  }
}

defineElement('moul-phone-frame', MoulPhoneFrame)

declare global {
  interface HTMLElementTagNameMap {
    'moul-phone-frame': MoulPhoneFrame
  }
}
