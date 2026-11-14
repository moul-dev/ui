import { html, LitElement, type PropertyValues } from 'lit'
import { styleMap } from 'lit/directives/style-map.js'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { rippleStyles } from './Ripple.styles'

const DEFAULT_COUNT = 6
const MIN_COUNT = 1
const MAX_COUNT = 12

function clampCount(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_COUNT
  return Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(value)))
}

/**
 * Concentric rings that pulse outward in sequence from the centre, behind an
 * icon, an avatar or a button set in the middle of them, to draw the eye to
 * one thing: a call to action, a "live" status, an integration's logo. The
 * rings grow by a fixed step and grow fainter outward, and a mask fades the
 * outer ones, so the effect has no hard edge. The element centres its
 * content, and the rings are centred on the element, not on the content; it
 * is at least tall enough for the inner rings, and taller is better. Colours
 * come from the theme's foreground, so it reads on light and dark pages. The
 * animation is CSS only and pauses while the rings are off screen. It lives
 * in the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The rings
 * are decorative and hidden from screen readers (`aria-hidden`); the content
 * in the middle is read and focused as usual. Where the system forces its
 * own colours (Windows high contrast) the rings are not drawn.
 *
 * Reduced motion: the rings stay still at their resting size.
 *
 * @slot - The content in the middle of the rings, centred in the element.
 *
 * @csspart background - The decorative layer behind the content that holds the rings and carries the fade.
 *
 * @cssprop --ripple-size - The diameter of the innermost ring, as a CSS length. Defaults to `10rem`.
 * @cssprop --ripple-gap - How much wider each ring is than the one inside it. Defaults to `4.5rem`.
 * @cssprop --ripple-color - The colour the rings are tinted and outlined with, at low strength. Defaults to `var(--color-fg)`.
 * @cssprop --ripple-duration - The length of one pulse. Defaults to `2s`.
 */
export class MoulRipple extends LitElement {
  static override styles = rippleStyles

  static override properties = {
    count: { type: Number },
  }

  /** How many rings, from 1 to 12. Defaults to 6. */
  declare count: number

  constructor() {
    super()
    this.count = DEFAULT_COUNT
    // Pauses the pulse while the rings are off screen (the controller's default).
    new InViewController(this)
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('count')) {
      const count = clampCount(this.count)
      if (count !== this.count) this.count = count
    }
  }

  protected override render() {
    const count = clampCount(this.count)
    return html`<div
        part="background"
        class="background"
        aria-hidden="true"
        style=${styleMap({ '--_ripple-count': String(count) })}
      >
        ${Array.from(
          { length: count },
          (_, index) =>
            html`<span
              class="ring"
              style=${styleMap({ '--_ripple-index': String(index) })}
            ></span>`,
        )}
      </div>
      <slot></slot>`
  }
}

defineElement('moul-ripple', MoulRipple)

declare global {
  interface HTMLElementTagNameMap {
    'moul-ripple': MoulRipple
  }
}
