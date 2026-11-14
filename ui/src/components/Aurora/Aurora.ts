import { html, LitElement, type PropertyValues } from 'lit'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { auroraStyles } from './Aurora.styles'

/** `aurora` drifts soft bands of colour across the top of the area; `blobs` drifts large blurred blobs that slowly change shape. */
export type AuroraVariant = 'aurora' | 'blobs'

const VARIANTS: readonly AuroraVariant[] = ['aurora', 'blobs']

/** Two layers of bands, crossing at slightly different angles and speeds. */
const BAND_COUNT = 2

const BLOB_COUNT = 4

/**
 * Slow-moving colour behind a hero, a section or a card. `aurora` (the
 * default) drifts soft, blurred bands of colour across the top of the area,
 * like the northern lights, fading out toward the bottom; `blobs` fills the
 * area with large blurred blobs of colour that drift and slowly change
 * shape, like a gradient mesh. Wrap the content and the colour sits behind
 * it; or leave the element empty, position it absolutely over a section, and
 * it is just the background. The colours default to the theme's accent with
 * a purple and a cyan chart colour, and are mixed paler on a light page so
 * dark text stays clear. Each cycle takes tens of seconds; the animation is
 * CSS only and pauses while the element is off screen. It lives in the
 * effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The colour
 * layer is decoration: hidden from screen readers, and pointer events pass
 * through it, so the content inside is read and used as it is. Check the
 * contrast of your text against the brightest part of the colour. Where the
 * system forces its own colours (Windows high contrast) the colour layer is
 * not drawn.
 *
 * Reduced motion: nothing drifts; the colours hold still as a soft colour
 * field.
 *
 * @slot - The content to show in front of the colour. Leave it empty to use the element as a background layer.
 *
 * @csspart background - The colour layer behind the content. It fills the element and is clipped to its corners.
 *
 * @cssprop --aurora-color-1 - The first colour. Defaults to `var(--color-accent)`.
 * @cssprop --aurora-color-2 - The second colour. Defaults to `var(--color-chart-4)`, a purple.
 * @cssprop --aurora-color-3 - The third colour. Defaults to `var(--color-chart-5)`, a cyan.
 * @cssprop --aurora-blur - How soft the colour is, as a blur radius. Defaults to `48px`, and `64px` for `blobs`.
 * @cssprop --aurora-opacity - How strongly the colour shows, from 0 to 1. Defaults to `0.6`. On a light page the colours are also mixed at 70% with transparent, so the field stays pale.
 * @cssprop --aurora-duration - Length of one drift, as a CSS time. Defaults to `20s`; each band or blob runs at its own multiple of it, so the pattern never visibly repeats.
 */
export class MoulAurora extends LitElement {
  static override styles = auroraStyles

  static override properties = {
    variant: { type: String, reflect: true },
  }

  /** The kind of colour field. Defaults to `aurora`. */
  declare variant: AuroraVariant

  constructor() {
    super()
    this.variant = 'aurora'
    // Pauses the CSS animations while the element is off screen (the controller's default).
    new InViewController(this)
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('variant') && !VARIANTS.includes(this.variant)) {
      this.variant = 'aurora'
    }
  }

  protected override render() {
    const shapes =
      this.variant === 'blobs'
        ? Array.from(
            { length: BLOB_COUNT },
            () => html`<div class="blob"></div>`,
          )
        : Array.from(
            { length: BAND_COUNT },
            () => html`<div class="band"></div>`,
          )
    return html`<div part="background" aria-hidden="true"><div class="field">${shapes}</div></div><slot></slot>`
  }
}

defineElement('moul-aurora', MoulAurora)

declare global {
  interface HTMLElementTagNameMap {
    'moul-aurora': MoulAurora
  }
}
