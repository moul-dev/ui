import { html, LitElement, type PropertyValues } from 'lit'
import { styleMap } from 'lit/directives/style-map.js'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { lightRaysStyles } from './LightRays.styles'

const DEFAULT_COUNT = 7
const MAX_COUNT = 16

/** Where one ray falls and how it moves. Every value is fixed by the ray's place, never random. */
interface Ray {
  /** Where the ray meets the top edge, in percent of the width. */
  x: number
  /** Resting tilt in degrees. Rays left of centre lean left, rays right of it lean right. */
  angle: number
  /** Width at the far end, in percent of the element's width. */
  width: number
  /** Length, as a multiple of `--light-rays-length`. */
  reach: number
  /** How far into its cycle the ray starts, from 0 to 1. */
  delay: number
  /** Length of its cycle, as a multiple of `--light-rays-duration`. */
  pace: number
  /** How far it sways either side of its rest, in degrees. */
  swing: number
  /** Its brightest opacity, from 0 to 1. */
  peak: number
}

/**
 * Soft rays of light shining down from the top edge, for a hero or a
 * section that should feel lit from above. The rays fan out from the top at
 * slightly different angles and widths, and each sways a little and
 * brightens and dims at its own slow pace, so the light never moves in step.
 * `count` sets how many there are. Wrap the content and the rays fall behind
 * it; or leave the element empty and position it absolutely over a section,
 * as its background. The light is tinted with the accent: a pale, near-white
 * light on a dark page, and a soft blue on a light page, where white light
 * would not show. The rays are laid out by a fixed pattern, so they fall the
 * same way on every load. The animation is CSS only and pauses while the
 * element is off screen. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The rays
 * are decoration: hidden from screen readers, and pointer events pass
 * through them, so the content inside is read and used as it is. Where the
 * system forces its own colours (Windows high contrast) the rays are not
 * drawn.
 *
 * Reduced motion: the rays hold still at a medium brightness.
 *
 * @slot - The content to show in front of the light. Leave it empty to use the element as a background layer.
 *
 * @csspart background - The layer the rays are drawn in, behind the content. It fills the element and is clipped to its corners.
 *
 * @cssprop --light-rays-color - The colour of the light. It shows at 70% on a light page and 35% on a dark one. Defaults to the accent mixed with white: 70% accent on a light page, 20% on a dark one.
 * @cssprop --light-rays-blur - How soft the rays are, as a blur radius. Defaults to `12px`.
 * @cssprop --light-rays-length - How far down the rays reach, as a share of the element's height; each ray reaches between 0.75 and 1.2 times it. Defaults to `70%`.
 * @cssprop --light-rays-duration - The base length of a ray's cycle, as a CSS time; each ray runs at between 0.75 and 1.35 times it. Defaults to `12s`.
 */
export class MoulLightRays extends LitElement {
  static override styles = lightRaysStyles

  static override properties = {
    count: { type: Number },
  }

  /** How many rays shine, from 1 to 16. Defaults to 7. */
  declare count: number

  private rays: Ray[] = []

  constructor() {
    super()
    this.count = DEFAULT_COUNT
    // Pauses the CSS animations while the element is off screen (the controller's default).
    new InViewController(this)
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('count')) {
      const count = usedCount(this.count)
      this.rays = Array.from({ length: count }, (_, index) =>
        rayAt(index, count),
      )
    }
  }

  protected override render() {
    return html`<div part="background" aria-hidden="true"><div class="glow"></div><div class="rays">${this.rays.map((ray) => html`<div class="ray" style=${styleMap(rayStyle(ray))}></div>`)}</div></div><slot></slot>`
  }
}

/** The number of rays drawn: a whole number from 1 to 16, or 7 for anything that is not a number. */
function usedCount(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_COUNT
  return Math.min(MAX_COUNT, Math.max(1, Math.round(value)))
}

/** A repeatable stand-in for a random number from 0 to 1, from a ray's index and a salt per property. */
function seeded(index: number, salt: number): number {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Ray `index` of `count`: spread evenly across the middle 84% of the top
 * edge with a little jitter, tilted away from the middle so the rays fan
 * out, each with its own width, length, pace and brightness.
 */
function rayAt(index: number, count: number): Ray {
  const spacing = 84 / count
  // Never more than a few percent, so a single ray stays near the middle.
  const jitter = Math.min(spacing, 10) * 0.6
  const x = 8 + spacing * (index + 0.5) + (seeded(index, 1) - 0.5) * jitter
  return {
    x: round(x),
    angle: round((50 - x) * 0.4 + (seeded(index, 2) - 0.5) * 10),
    width: round(7 + seeded(index, 3) * 9),
    reach: round(0.75 + seeded(index, 4) * 0.45),
    delay: round(seeded(index, 5)),
    pace: round(0.75 + seeded(index, 6) * 0.6),
    swing: round(1.5 + seeded(index, 7) * 3),
    peak: round(0.55 + seeded(index, 8) * 0.45),
  }
}

function rayStyle(ray: Ray): Record<string, string> {
  return {
    '--_light-rays-x': `${ray.x}%`,
    '--_light-rays-angle': `${ray.angle}deg`,
    '--_light-rays-width': `${ray.width}%`,
    '--_light-rays-reach': `${ray.reach}`,
    '--_light-rays-delay': `${ray.delay}`,
    '--_light-rays-pace': `${ray.pace}`,
    '--_light-rays-swing': `${ray.swing}deg`,
    '--_light-rays-peak': `${ray.peak}`,
  }
}

defineElement('moul-light-rays', MoulLightRays)

declare global {
  interface HTMLElementTagNameMap {
    'moul-light-rays': MoulLightRays
  }
}
