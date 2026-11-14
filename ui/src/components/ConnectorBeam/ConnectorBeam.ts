import { html, LitElement, nothing, type PropertyValues, svg } from 'lit'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { watchReducedMotion } from '../../utils/motion'
import { connectorBeamStyles } from './ConnectorBeam.styles'

/** A point in the beam's own box, in CSS pixels from its top-left corner. */
export interface ConnectorBeamPoint {
  x: number
  y: number
}

const DEFAULT_DURATION = 3000

/**
 * The SVG path from `start` to `end`: a straight line, or with `curvature` a
 * quadratic curve whose control point sits midway between the ends, lifted
 * by `curvature` pixels (a negative value bows the line downward).
 */
export function connectorBeamPath(
  start: ConnectorBeamPoint,
  end: ConnectorBeamPoint,
  curvature = 0,
): string {
  const round = (value: number) => Math.round(value * 100) / 100
  const s = `${round(start.x)},${round(start.y)}`
  const e = `${round(end.x)},${round(end.y)}`
  if (!curvature) return `M ${s} L ${e}`
  const cx = (start.x + end.x) / 2
  const cy = (start.y + end.y) / 2 - curvature
  return `M ${s} Q ${round(cx)},${round(cy)} ${e}`
}

/** The centre of `box`, in the coordinates of `frame`, moved by an offset. */
function centreIn(
  box: DOMRect,
  frame: DOMRect,
  dx: number,
  dy: number,
): ConnectorBeamPoint {
  return {
    x: box.left - frame.left + box.width / 2 + dx,
    y: box.top - frame.top + box.height / 2 + dy,
  }
}

/** A number attribute as a usable offset or time: `fallback` when unset or not finite. */
function finite(value: number | null | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

interface BeamGeometry {
  d: string
  start: ConnectorBeamPoint
  end: ConnectorBeamPoint
}

/**
 * A line between two elements with a short light running along it, to show
 * that one thing feeds another: sources flowing into a hub, a request
 * travelling from a browser to a server. Put it inside the box that holds
 * both elements and name them by id with `from` and `to`; it covers the box
 * as a layer (`position: absolute; inset: 0; z-index: -1`), so give the box
 * `position: relative` and `isolation: isolate`, and the line runs behind
 * the elements, from the centre of one to the centre of the other.
 * `curvature` bows it into an arc, the `*-offset` attributes move its ends,
 * `is-reversed` sends the light the other way, and `duration` and `delay`
 * time it, so several beams in one box can take turns. The line is redrawn
 * only when the box or either element changes size; the light is a CSS
 * animation that stops while the box is off screen. It lives in the effects
 * entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The line is
 * decorative and hidden from assistive technology, so say in the content
 * what connects to what if it matters. Where the system forces its own
 * colours (Windows high contrast) the line is drawn in the system's text
 * colour and the light is left out.
 *
 * Reduced motion: the light does not run. The line stays, drawn in the
 * beam's colours, so the connection still shows.
 *
 * @csspart svg - The drawing that covers the box.
 * @csspart track - The line from one element to the other.
 * @csspart light - The light that runs along the line.
 *
 * @cssprop --connector-beam-width - Width of the line. Defaults to `2px`.
 * @cssprop --connector-beam-track - Colour of the line. Defaults to `var(--color-border)`.
 * @cssprop --connector-beam-from - Colour of the light at the `from` end. Defaults to `var(--color-chart-4)`.
 * @cssprop --connector-beam-to - Colour of the light at the `to` end. Defaults to `var(--color-accent)`.
 */
export class MoulConnectorBeam extends LitElement {
  static override styles = connectorBeamStyles

  static override properties = {
    from: { type: String, reflect: true },
    to: { type: String, reflect: true },
    curvature: { type: Number },
    isReversed: { type: Boolean, reflect: true, attribute: 'is-reversed' },
    duration: { type: Number },
    delay: { type: Number },
    startXOffset: { type: Number, attribute: 'start-x-offset' },
    startYOffset: { type: Number, attribute: 'start-y-offset' },
    endXOffset: { type: Number, attribute: 'end-x-offset' },
    endYOffset: { type: Number, attribute: 'end-y-offset' },
    geometry: { state: true },
  }

  /** The id of the element the line starts at, in the same document or shadow root. */
  declare from: string
  /** The id of the element the line ends at, in the same document or shadow root. */
  declare to: string
  /** How far, in pixels, the middle of the line is lifted into an arc. 0 (default) draws it straight; a negative value bows it downward. */
  declare curvature: number
  /** Run the light from `to` back to `from`. */
  declare isReversed: boolean
  /** Milliseconds the light takes from one end to the other. Defaults to 3000. */
  declare duration: number
  /** Milliseconds before the light first sets off, so beams in one box can take turns. Defaults to 0. */
  declare delay: number
  /** Moves the start of the line right (negative: left) of the `from` element's centre, in pixels. */
  declare startXOffset: number
  /** Moves the start of the line down (negative: up) from the `from` element's centre, in pixels. */
  declare startYOffset: number
  /** Moves the end of the line right (negative: left) of the `to` element's centre, in pixels. */
  declare endXOffset: number
  /** Moves the end of the line down (negative: up) from the `to` element's centre, in pixels. */
  declare endYOffset: number
  /** The line as last measured, or null until both ends are found and laid out. */
  private declare geometry: BeamGeometry | null

  private readonly inView: InViewController
  private resizeObserver: ResizeObserver | null = null
  private mutationObserver: MutationObserver | null = null
  private observedEnds: [Element | null, Element | null] = [null, null]
  private stopWatchingMotion: (() => void) | null = null
  private frame = 0

  constructor() {
    super()
    this.from = ''
    this.to = ''
    this.curvature = 0
    this.isReversed = false
    this.duration = DEFAULT_DURATION
    this.delay = 0
    this.startXOffset = 0
    this.startYOffset = 0
    this.endXOffset = 0
    this.endYOffset = 0
    this.geometry = null
    // The light is paused through a class, so `is-offscreen` and reduced
    // motion never fight over the Web Animations API.
    this.inView = new InViewController(this, { pauseOffscreen: false })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('aria-hidden', 'true')
    // Reduced motion is CSS only; re-render so a test or a paused light picks it up.
    this.stopWatchingMotion = watchReducedMotion(() => this.requestUpdate())
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.scheduleMeasure, { passive: true })
    }
    if (this.hasUpdated) this.bind()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.scheduleMeasure)
    }
    this.unbind()
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed)
    this.bind()
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (
      this.hasUpdated &&
      (changed.has('from') || changed.has('to')) &&
      (changed.get('from') !== undefined || changed.get('to') !== undefined)
    ) {
      this.bind()
    } else if (
      changed.has('curvature') ||
      changed.has('startXOffset') ||
      changed.has('startYOffset') ||
      changed.has('endXOffset') ||
      changed.has('endYOffset')
    ) {
      this.scheduleMeasure()
    }
    if (changed.has('duration') || changed.has('delay')) {
      const duration = Math.max(1, finite(this.duration, DEFAULT_DURATION))
      this.style.setProperty('--_connector-beam-duration', `${duration}ms`)
      this.style.setProperty(
        '--_connector-beam-delay',
        `${Math.max(0, finite(this.delay, 0))}ms`,
      )
    }
  }

  /** The two elements, looked up by id in the beam's own document or shadow root. */
  private findEnds(): [Element | null, Element | null] {
    const root = this.getRootNode() as Document | ShadowRoot
    const find = (id: string) =>
      id ? (root.getElementById?.(id) ?? null) : null
    return [find(this.from), find(this.to)]
  }

  /** Watches the box and both ends for size changes, or waits for an end that is not in the page yet. */
  private bind(): void {
    if (!this.isConnected) return
    const ends = this.findEnds()
    const isMissing = (this.from && !ends[0]) || (this.to && !ends[1])
    this.watchRoot(isMissing ? (this.getRootNode() as Node) : null)

    const [start, end] = ends
    if (
      this.resizeObserver &&
      start === this.observedEnds[0] &&
      end === this.observedEnds[1]
    ) {
      return
    }
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.observedEnds = ends
    if (!start || !end) {
      this.geometry = null
      return
    }
    if (typeof ResizeObserver === 'function') {
      // Observing reports each element once straight away, so this also draws the first line.
      this.resizeObserver = new ResizeObserver(this.scheduleMeasure)
      this.resizeObserver.observe(this)
      if (this.parentElement) this.resizeObserver.observe(this.parentElement)
      this.resizeObserver.observe(start)
      this.resizeObserver.observe(end)
    } else {
      this.scheduleMeasure()
    }
  }

  private unbind(): void {
    this.watchRoot(null)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.observedEnds = [null, null]
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  private watchRoot(root: Node | null): void {
    if (!root) {
      this.mutationObserver?.disconnect()
      this.mutationObserver = null
      return
    }
    if (this.mutationObserver || typeof MutationObserver !== 'function') return
    this.mutationObserver = new MutationObserver(() => this.bind())
    this.mutationObserver.observe(root, {
      childList: true,
      subtree: true,
      attributeFilter: ['id'],
    })
  }

  /** Measures on the next frame, once, however many observers fired. */
  private readonly scheduleMeasure = (): void => {
    if (!this.isConnected || this.frame) return
    if (typeof requestAnimationFrame !== 'function') {
      this.measure()
      return
    }
    this.frame = requestAnimationFrame(() => {
      this.frame = 0
      this.measure()
    })
  }

  /** Reads where both ends sit in the beam's box and redraws the line. Runs only after a size change. */
  private measure(): void {
    const [startEl, endEl] = this.observedEnds
    if (!startEl || !endEl || !startEl.isConnected || !endEl.isConnected) {
      this.geometry = null
      return
    }
    const frame = this.getBoundingClientRect()
    const start = centreIn(
      startEl.getBoundingClientRect(),
      frame,
      finite(this.startXOffset, 0),
      finite(this.startYOffset, 0),
    )
    const end = centreIn(
      endEl.getBoundingClientRect(),
      frame,
      finite(this.endXOffset, 0),
      finite(this.endYOffset, 0),
    )
    const d = connectorBeamPath(start, end, finite(this.curvature, 0))
    if (this.geometry?.d === d) return
    this.geometry = { d, start, end }
  }

  protected override render() {
    const geometry = this.geometry
    const classes = this.inView.isInView ? 'svg' : 'svg is-offscreen'
    return html`<svg
      part="svg"
      class=${classes}
      aria-hidden="true"
      focusable="false"
    >
      ${
        geometry
          ? svg`<defs>
            <linearGradient
              id="gradient"
              gradientUnits="userSpaceOnUse"
              x1=${geometry.start.x}
              y1=${geometry.start.y}
              x2=${geometry.end.x}
              y2=${geometry.end.y}
            >
              <stop class="stop-from" offset="0"></stop>
              <stop class="stop-to" offset="1"></stop>
            </linearGradient>
          </defs>
          <path part="track" class="track" d=${geometry.d}></path>
          <g part="light" class="light">
            <path class="halo" d=${geometry.d} pathLength="1000"></path>
            <path class="core" d=${geometry.d} pathLength="1000"></path>
          </g>`
          : nothing
      }
    </svg>`
  }
}

defineElement('moul-connector-beam', MoulConnectorBeam)

declare global {
  interface HTMLElementTagNameMap {
    'moul-connector-beam': MoulConnectorBeam
  }
}
