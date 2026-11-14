import { html, LitElement, type PropertyValues } from 'lit'
import { styleMap } from 'lit/directives/style-map.js'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { noiseStyles } from './Noise.styles'

const DEFAULT_FREQUENCY = 0.8
const MIN_FREQUENCY = 0.2
const MAX_FREQUENCY = 2

/** Side of the noise tile in its own units; `--noise-size` sets how large it is drawn. */
const TILE = 200

/**
 * A film-grain texture laid over content, to take the flat, digital edge off
 * a hero, a card or a gradient. Wrap the content and a fine grain covers all
 * of it, the content included, while clicks and selection pass through to
 * the content as usual. The grain is a tile of SVG noise painted in
 * `--noise-color` (the text colour by default, so dark specks on a light page
 * and light ones on a dark page) at a low `--noise-opacity`; `frequency` sets
 * how fine it is. With `is-animated` the grain jumps a few times a second,
 * like film running through a projector, and stops while the element is off
 * screen. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The grain is
 * decoration: hidden from screen readers, and pointer events pass through it,
 * so links, buttons and text under it work as they are. The specks fall on
 * the text too, which lowers its contrast a little; keep `--noise-opacity`
 * low over body text. Where the system forces its own colours (Windows high
 * contrast) the grain is not drawn.
 *
 * Reduced motion: the grain holds still, even with `is-animated`.
 *
 * @slot - The content to texture. Leave it empty to use the element as an overlay layer.
 *
 * @csspart grain - The grain layer. It lies over the content, fills the element and is clipped to its corners.
 *
 * @cssprop --noise-color - The colour of the grain. Defaults to `var(--color-fg)`.
 * @cssprop --noise-opacity - How strongly the grain shows, from 0 to 1. Defaults to `0.12`.
 * @cssprop --noise-size - The size of one tile of grain. The grain scales with it, so a larger tile also makes larger specks. Defaults to `200px`.
 */
export class MoulNoise extends LitElement {
  static override styles = noiseStyles

  static override properties = {
    frequency: { type: Number },
    isAnimated: { type: Boolean, reflect: true, attribute: 'is-animated' },
  }

  /**
   * How fine the grain is: the base frequency of the noise, from 0.2 (soft,
   * cloudy) to 2 (very fine). Values outside that range are clamped.
   * Defaults to 0.8.
   */
  declare frequency: number
  /** Make the grain jump a few times a second, like film. */
  declare isAnimated: boolean

  /** The data URI of the current tile, rebuilt only when `frequency` changes. */
  private grain = ''

  constructor() {
    super()
    this.frequency = DEFAULT_FREQUENCY
    this.isAnimated = false
    // Stops the jitter while the element is off screen (the controller's default).
    new InViewController(this)
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('frequency') || !this.grain) {
      this.grain = grainImage(usedFrequency(this.frequency))
    }
  }

  protected override render() {
    // The grain comes after the slot, and its z-index puts it over the content.
    return html`<slot></slot><div part="grain" aria-hidden="true" style=${styleMap({ '--_noise-image': this.grain })}></div>`
  }
}

/** The frequency the tile is drawn with: finite, clamped, and rounded so the URI stays short. */
function usedFrequency(value: number): number {
  const frequency = Number.isFinite(value) ? value : DEFAULT_FREQUENCY
  const clamped = Math.min(MAX_FREQUENCY, Math.max(MIN_FREQUENCY, frequency))
  return Math.round(clamped * 1000) / 1000
}

/**
 * A tile of fractal noise as a CSS image. The colour matrix stretches the
 * alpha channel, so the mask is clear specks on clear space rather than an
 * even haze; `stitchTiles` makes the tile repeat without a seam.
 */
function grainImage(frequency: number): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">` +
    '<filter id="g" x="0" y="0" width="100%" height="100%">' +
    `<feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="3" stitchTiles="stitch"/>` +
    '<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3 -1"/>' +
    '</filter><rect width="100%" height="100%" filter="url(#g)"/></svg>'
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

defineElement('moul-noise', MoulNoise)

declare global {
  interface HTMLElementTagNameMap {
    'moul-noise': MoulNoise
  }
}
