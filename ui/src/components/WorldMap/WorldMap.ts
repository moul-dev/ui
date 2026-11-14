import { html, LitElement, nothing, type PropertyValues, svg } from 'lit'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { LAND_MASK } from './land-mask'
import { worldMapStyles } from './WorldMap.styles'

/** A place on the map, in degrees: latitude north positive, longitude east positive. */
export interface WorldMapPoint {
  lat: number
  lng: number
  /** A name for the place, shown with `show-labels` and read by screen readers. */
  label?: string
}

/** A pin on the map. */
export type WorldMapMarker = WorldMapPoint

/** A curved line from one place to another. */
export interface WorldMapArc {
  from: WorldMapPoint
  to: WorldMapPoint
  /** What the line means, read by screen readers. Defaults to "From to To" when both ends are labelled. */
  label?: string
}

/** The map's width in SVG user units: one per degree of longitude. */
const MAP_WIDTH = 360
/** The southern edge of the drawn map, in degrees. */
const SOUTH = LAND_MASK.north - (LAND_MASK.rows - 1) * LAND_MASK.step
/** Room above and below the dots, in degrees, so the first and last rows are whole. */
const PAD = LAND_MASK.step
const MAP_HEIGHT = LAND_MASK.north - SOUTH + PAD * 2

/** Parses a JSON attribute, and treats anything that is not a JSON array as empty. */
const jsonArray = {
  fromAttribute(value: string | null): unknown[] {
    if (!value) return []
    try {
      const parsed: unknown = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },
  toAttribute(value: unknown[]): string {
    return JSON.stringify(value)
  },
}

let landPath: string | null = null

/**
 * One path for every land dot: a zero-length line per cell, drawn as a dot
 * by its round cap. One element instead of four thousand circles.
 */
function landDots(): string {
  if (landPath !== null) return landPath
  const { bits, columns, rows, step } = LAND_MASK
  const bytes = typeof atob === 'function' ? atob(bits) : ''
  const parts: string[] = []
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cell = row * columns + column
      if (bytes.charCodeAt(cell >> 3) & (0x80 >> (cell & 7))) {
        parts.push(`M${(column + 0.5) * step} ${row * step + PAD}h0`)
      }
    }
  }
  landPath = parts.join('')
  return landPath
}

function isPoint(value: unknown): value is WorldMapPoint {
  const point = value as WorldMapPoint | null
  return (
    typeof point === 'object' &&
    point !== null &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng)
  )
}

function isArc(value: unknown): value is WorldMapArc {
  const arc = value as WorldMapArc | null
  return (
    typeof arc === 'object' &&
    arc !== null &&
    isPoint(arc.from) &&
    isPoint(arc.to)
  )
}

/**
 * Where a place falls on the map, in SVG user units: equirectangular, one
 * unit per degree. Latitudes beyond the drawn map are held at its edge and
 * longitudes are wrapped into -180 to 180.
 */
export function projectPoint(point: WorldMapPoint): { x: number; y: number } {
  const lng = ((((point.lng + 180) % 360) + 360) % 360) - 180
  const lat = Math.min(LAND_MASK.north, Math.max(SOUTH, point.lat))
  return {
    x: lng + 180,
    y: LAND_MASK.north - lat + PAD,
  }
}

/**
 * The SVG path of an arc: a quadratic curve that bows north by a third of
 * the distance between its ends, so long routes rise higher than short ones.
 */
export function arcPath(from: WorldMapPoint, to: WorldMapPoint): string {
  const a = projectPoint(from)
  const b = projectPoint(to)
  const lift = Math.hypot(b.x - a.x, b.y - a.y) * 0.35
  const cx = (a.x + b.x) / 2
  const cy = (a.y + b.y) / 2 - lift
  const r = (n: number) => Math.round(n * 100) / 100
  return `M${r(a.x)} ${r(a.y)}Q${r(cx)} ${r(cy)} ${r(b.x)} ${r(b.y)}`
}

function samePlace(a: WorldMapPoint, b: WorldMapPoint): boolean {
  return Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lng - b.lng) < 0.01
}

/**
 * A dotted map of the world with pins and curved lines between places, for
 * a "where we are" or "where your data travels" section. The land is drawn
 * as a grid of dots from an embedded mask (Natural Earth, 2° cells, 84°N to
 * 58°S), so the map needs no image, no network request and no map library.
 * Set `markers` to pin places and `arcs` to join them, either as properties
 * or as JSON attributes; each place is `{ lat, lng, label }` in degrees. The
 * ends of every arc get a pin too. When the map scrolls into view the arcs
 * draw one after another, then a small light runs along each one, and the
 * pins pulse; everything pauses while the map is off screen. `show-labels`
 * writes each pin's label beside it. The map fills its container's width and
 * keeps its shape (360 by 146). It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable. The drawing is one image
 * named by `label` (default "World map"), and a visually hidden list after
 * it reads out every labelled pin and every arc with a label (an arc whose
 * ends are both labelled reads "From to To"), so the places are not lost to
 * a screen reader. The visible labels are hidden from assistive technology,
 * since the list already says them.
 *
 * Reduced motion: the arcs are drawn from the start, no light travels along
 * them, and the pins do not pulse.
 *
 * @csspart base - The box that holds the map and the pins.
 * @csspart map - The SVG with the land dots and the arcs.
 * @csspart land - The path that draws every land dot.
 * @csspart arc - Each arc's line.
 * @csspart beam - The light that runs along each arc once it is drawn.
 * @csspart marker - Each pin.
 * @csspart label - Each pin's label, with `show-labels`.
 *
 * @cssprop --world-map-dot-color - The colour of the land dots. Defaults to the foreground at low strength.
 * @cssprop --world-map-arc-color - The colour of the arcs and of the light on them. Defaults to `var(--color-accent)`.
 * @cssprop --world-map-marker-color - The colour of the pins. Defaults to `var(--color-accent)`.
 * @cssprop --world-map-arc-duration - How long each arc takes to draw. Defaults to `1.4s`.
 * @cssprop --world-map-arc-stagger - The wait between one arc starting to draw and the next. Defaults to `0.35s`.
 */
export class MoulWorldMap extends LitElement {
  static override styles = worldMapStyles

  static override properties = {
    label: { type: String },
    markers: { attribute: 'markers', converter: jsonArray },
    arcs: { attribute: 'arcs', converter: jsonArray },
    showLabels: { type: Boolean, reflect: true, attribute: 'show-labels' },
    isDrawing: { state: true },
  }

  /** The accessible name of the map. Defaults to `World map`. */
  declare label: string
  /** Places to pin, as `{ lat, lng, label }` in degrees. */
  declare markers: WorldMapMarker[]
  /** Lines to draw, as `{ from, to, label }`, each end a place. */
  declare arcs: WorldMapArc[]
  /** Write each pin's label beside it. */
  declare showLabels: boolean
  /** Whether the arcs are drawing (or drawn); false until the map has been in view. */
  private declare isDrawing: boolean

  private readonly inView: InViewController
  private resizeObserver: ResizeObserver | null = null

  constructor() {
    super()
    this.label = 'World map'
    this.markers = []
    this.arcs = []
    this.showLabels = false
    this.isDrawing = false
    this.inView = new InViewController(this, {
      threshold: 0.2,
      onChange: (isInView) => {
        if (isInView) this.isDrawing = true
      },
    })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(() => this.measure())
      this.resizeObserver.observe(this)
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }

  /** Draws the arcs again from the start, for a replay button. */
  public async play(): Promise<void> {
    this.isDrawing = false
    await this.updateComplete
    // Read layout so the restarted animations begin from their first frame.
    void this.shadowRoot?.querySelector('svg')?.getBoundingClientRect()
    this.isDrawing = true
    await this.updateComplete
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed)
    this.measure()
    // Without an observer the map counts as in view at once (see InViewController).
    if (this.inView.hasEntered) this.isDrawing = true
  }

  /**
   * Lines are drawn in map units, so a fixed on-screen thickness depends on
   * how wide the map is shown. This keeps the arcs about 1.5px thick and the
   * land dots at least 1.4px across on a small screen.
   */
  private measure(): void {
    const width = this.getBoundingClientRect().width
    const unit = width > 0 ? MAP_WIDTH / width : 0.5
    this.style.setProperty(
      '--_world-map-unit',
      String(Math.round(unit * 1000) / 1000),
    )
    this.placeLabels()
  }

  private get validMarkers(): WorldMapMarker[] {
    const markers = Array.isArray(this.markers)
      ? this.markers.filter(isPoint)
      : []
    // Every arc end is pinned, unless a marker already sits there.
    for (const arc of this.validArcs) {
      for (const end of [arc.from, arc.to]) {
        if (!markers.some((marker) => samePlace(marker, end))) markers.push(end)
      }
    }
    return markers
  }

  private get validArcs(): WorldMapArc[] {
    return Array.isArray(this.arcs) ? this.arcs.filter(isArc) : []
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    this.placeLabels()
  }

  /**
   * A label sits east of its pin unless that would run past the map's
   * eastern edge; then it sits to the west. Measured, because how much room
   * a label needs depends on its text and on how wide the map is shown.
   */
  private placeLabels(): void {
    const base = this.shadowRoot?.querySelector('[part="base"]')
    const labels = this.shadowRoot?.querySelectorAll<HTMLElement>('.label')
    if (!base || !labels?.length) return
    const edge = base.getBoundingClientRect().right
    for (const label of labels) {
      label.classList.remove('is-start')
      if (label.getBoundingClientRect().right > edge) {
        label.classList.add('is-start')
      }
    }
  }

  private renderMarker(marker: WorldMapMarker) {
    const { x, y } = projectPoint(marker)
    const left = (x / MAP_WIDTH) * 100
    const top = (y / MAP_HEIGHT) * 100
    return html`<span
      part="marker"
      class="marker"
      style="left: ${left}%; top: ${top}%"
    >
      ${
        this.showLabels && marker.label
          ? html`<span part="label" class="label">${marker.label}</span>`
          : nothing
      }
    </span>`
  }

  protected override render() {
    const arcs = this.validArcs
    const markers = this.validMarkers
    const spoken = [
      ...markers.map((marker) => marker.label).filter(Boolean),
      ...arcs
        .map(
          (arc) =>
            arc.label ??
            (arc.from.label && arc.to.label
              ? `${arc.from.label} to ${arc.to.label}`
              : ''),
        )
        .filter(Boolean),
    ] as string[]

    return html`<div
      part="base"
      class=${this.isDrawing ? 'base is-drawing' : 'base'}
    >
      <svg
        part="map"
        class="map"
        viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}"
        role="img"
        aria-label=${this.label || 'World map'}
      >
        <path part="land" class="land" d=${landDots()}></path>
        ${arcs.map((arc, index) => {
          const d = arcPath(arc.from, arc.to)
          return svg`<g style="--_world-map-index: ${index}">
            <path part="arc" class="arc" d=${d} pathLength="1"></path>
            <path part="beam" class="beam" d=${d} pathLength="1"></path>
          </g>`
        })}
      </svg>
      <div class="markers" aria-hidden="true">
        ${markers.map((marker) => this.renderMarker(marker))}
      </div>
      ${
        spoken.length > 0
          ? html`<ul class="visually-hidden">
              ${spoken.map((text) => html`<li>${text}</li>`)}
            </ul>`
          : nothing
      }
    </div>`
  }
}

defineElement('moul-world-map', MoulWorldMap)

declare global {
  interface HTMLElementTagNameMap {
    'moul-world-map': MoulWorldMap
  }
}
