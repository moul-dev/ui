import { html, LitElement, nothing, type PropertyValues } from 'lit'
import {
  CanvasColorController,
  withAlpha,
} from '../../controllers/canvas-color.controller'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { globeStyles } from './Globe.styles'
import {
  type ArcPath,
  arcPath,
  arcPoint,
  easeInOut,
  type GlobeArc,
  type GlobeMarker,
  type GlobePoint,
  type GlobeView,
  isArc,
  isOccluded,
  isPoint,
  landPoints,
  landSamples,
  lngDelta,
  MAX_VIEW_LAT,
  parsePlace,
  samePlace,
  toVector,
  turnVector,
  type Vector,
  viewFor,
  viewTransform,
  wrapLng,
} from './globe-geometry'

export type { GlobeArc, GlobeMarker, GlobePoint, GlobeView }

const TAU = Math.PI * 2

/** Depth bands the land dots are drawn in, each one path, from the limb to the centre. */
const BUCKETS = 8
/** How long each arc takes to draw in, in milliseconds. */
const ARC_DURATION = 1400
/** The wait between one arc starting to draw and the next. */
const ARC_STAGGER = 350
/** How long the light takes to run the length of an arc. */
const LIGHT_PERIOD = 2600
/** How long a pin's pulse takes to spread and fade. */
const PULSE_PERIOD = 2200
/** How long `turnTo()` takes. */
const TURN_DURATION = 1100
/** Velocity left after a drag halves in about a quarter of a second. */
const INERTIA_MS = 380

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

const placeConverter = {
  fromAttribute: parsePlace,
  toAttribute(value: GlobePoint | null): string | null {
    return value ? `${value.lat}, ${value.lng}` : null
  },
}

interface PreparedArc {
  arc: GlobeArc
  path: ArcPath
  /** Sample count along the arc, plus one for the end. */
  steps: number
  /** Points along the arc before turning, packed x, y, z. */
  raw: Float32Array
  /** The same points turned to the current view. */
  turned: Float32Array
}

interface Turn {
  fromLat: number
  fromLng: number
  toLat: number
  /** Longitude to travel, the short way round. */
  deltaLng: number
  start: number
  resolve: () => void
}

type ColorName = 'dot' | 'sphere' | 'glow' | 'marker' | 'arc' | 'label'

/**
 * A globe drawn in dots that turns slowly on its axis, with pins on places
 * (`markers`) and arcs between them (`arcs`), for a "where we are" or "where
 * your requests travel" section. The land comes from the same embedded mask
 * as `<moul-world-map>` (Natural Earth, 2° cells, Antarctica left out),
 * sampled on an even lattice so the dots never bunch toward the poles: no
 * image, no request and no 3D library. Places are `{ lat, lng, label }` in
 * degrees, as properties or JSON attributes, and the ends of every arc are
 * pinned too. Each arc rises off the surface along the great circle between
 * its ends (long routes rise higher), draws in when the globe first comes
 * into view, then carries a travelling light. Drag to turn the globe; it
 * keeps turning a little after it is let go. `turnTo()` brings a place to the
 * front. The globe is square by default and fills its container's width. It
 * loads on demand from the canvas entry: `import '@moul-dev/web-component/canvas'`.
 *
 * Keyboard and screen readers: never focusable. The globe is one image named
 * by `label` (default "Globe"), followed by a visually hidden list that
 * reads every labelled pin and every arc with a label (an arc whose ends are
 * both labelled reads "From to To"), so the places are not lost to a screen
 * reader. Turning is a pointer gesture; give readers who need it another way
 * to reach a place, for example buttons that call `turnTo()`.
 *
 * Reduced motion: the globe holds still, centred on `center` (or the first
 * pin), with every arc drawn in full, no travelling light and no pulsing
 * pins. Dragging still turns it, since the reader's own hand moves it, but it
 * stops when let go, and `turnTo()` jumps instead of turning.
 *
 * @csspart base - The box that holds the canvas: one image to screen readers.
 * @csspart canvas - The canvas the globe is drawn on.
 *
 * @cssprop --globe-dot-color - The land dots, shaded by depth. Defaults to `var(--color-fg)`.
 * @cssprop --globe-sphere-color - The disc behind the dots. Defaults to `var(--color-bg-subtle)`.
 * @cssprop --globe-glow-color - The light around the rim. Defaults to `var(--color-accent)`.
 * @cssprop --globe-marker-color - The pins and their pulse. Defaults to `var(--color-accent)`.
 * @cssprop --globe-arc-color - The arcs and the light on them. Defaults to `var(--color-accent)`.
 * @cssprop --globe-label-color - The labels drawn with `show-labels`. Defaults to `var(--color-fg)`.
 */
export class MoulGlobe extends LitElement {
  static override styles = globeStyles

  static override properties = {
    label: { type: String },
    markers: { attribute: 'markers', converter: jsonArray },
    arcs: { attribute: 'arcs', converter: jsonArray },
    center: { attribute: 'center', converter: placeConverter },
    speed: { type: Number },
    showLabels: { type: Boolean, reflect: true, attribute: 'show-labels' },
    isPaused: { type: Boolean, reflect: true, attribute: 'is-paused' },
    isDragging: { state: true },
  }

  /** The accessible name of the globe. Defaults to `Globe`. */
  declare label: string
  /** Places to pin, as `{ lat, lng, label }` in degrees. */
  declare markers: GlobeMarker[]
  /** Arcs to draw, as `{ from, to, label }`, each end a place. */
  declare arcs: GlobeArc[]
  /**
   * The place the globe faces first, as `"lat, lng"` or JSON; under reduced
   * motion it faces it throughout. Defaults to the first pin.
   */
  declare center: GlobePoint | null
  /** How fast the globe turns on its own, in degrees a second; negative turns it the other way. Defaults to 8. */
  declare speed: number
  /** Draw each pin's label beside it. */
  declare showLabels: boolean
  /** Stop turning on its own. Dragging still turns it. */
  declare isPaused: boolean
  private declare isDragging: boolean

  /** The place at the centre of the visible face. */
  private view: GlobeView = { lat: 20, lng: 10 }
  private hasView = false
  private radius = 0
  private dotSize = 1.5
  private land: Float32Array = new Float32Array(0)
  private screen = new Float32Array(0)
  private bucketOf = new Uint8Array(0)
  private order = new Uint32Array(0)
  private readonly counts = new Uint32Array(BUCKETS)
  private readonly offsets = new Uint32Array(BUCKETS)
  private readonly turned = new Float32Array(3)
  private pins: Array<{ marker: GlobeMarker; vector: Vector }> = []
  private routes: PreparedArc[] = []
  private dotFills: string[] = []
  private gradients: {
    rim: CanvasGradient
    halo: CanvasGradient
    shade: CanvasGradient
  } | null = null
  private font = '500 12px sans-serif'

  /** Milliseconds of motion so far, the clock the arcs and pins run on. */
  private clock = 0
  private arcStart = 0
  private needsDraw = true
  private isReduced = false
  private stopWatchingMotion: (() => void) | null = null

  private dragId: number | null = null
  private dragX = 0
  private dragY = 0
  private dragTime = 0
  private hasMoved = false
  private velocityLat = 0
  private velocityLng = 0
  /** Fades the turning back in after a drag, 0 to 1. */
  private autoBlend = 1
  /** Set by `turnTo()`: the globe holds on its place until dragged. */
  private isHeld = false
  private turn: Turn | null = null

  private readonly palette = new CanvasColorController<ColorName>(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => ({
      dot: 'var(--globe-dot-color, var(--color-fg))',
      sphere: 'var(--globe-sphere-color, var(--color-bg-subtle))',
      glow: 'var(--globe-glow-color, var(--color-accent))',
      marker: 'var(--globe-marker-color, var(--color-accent))',
      arc: 'var(--globe-arc-color, var(--color-accent))',
      label: 'var(--globe-label-color, var(--color-fg))',
    }),
    onChange: () => {
      this.prepareColors()
      this.redraw()
    },
  })

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot.querySelector('canvas'),
    draw: (frame) => this.paint(frame),
    resize: ({ width, height }) => this.measure(width, height),
  })

  constructor() {
    super()
    this.label = 'Globe'
    this.markers = []
    this.arcs = []
    this.center = null
    this.speed = 8
    this.showLabels = false
    this.isPaused = false
    this.isDragging = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      if (isReduced) this.faceCenter()
      this.redraw()
    })
    this.addEventListener('pointerdown', this.handlePointerDown)
    this.addEventListener('pointermove', this.handlePointerMove)
    this.addEventListener('pointerup', this.handlePointerUp)
    this.addEventListener('pointercancel', this.handlePointerUp)
    this.addEventListener('lostpointercapture', this.handlePointerUp)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.removeEventListener('pointerdown', this.handlePointerDown)
    this.removeEventListener('pointermove', this.handlePointerMove)
    this.removeEventListener('pointerup', this.handlePointerUp)
    this.removeEventListener('pointercancel', this.handlePointerUp)
    this.removeEventListener('lostpointercapture', this.handlePointerUp)
    this.finishTurn()
    this.dragId = null
    this.isDragging = false
  }

  /** The place at the centre of the visible face now, in degrees. */
  public get currentView(): GlobeView {
    return { lat: this.view.lat, lng: this.view.lng }
  }

  /**
   * Turns the globe to bring a place to the front, then holds it there until
   * the globe is dragged. Takes a place, or the label of a pin or an arc end.
   * Resolves once the turn ends; under reduced motion, or while the globe is
   * off screen, it jumps there at once.
   */
  public turnTo(place: GlobePoint | string): Promise<void> {
    const target = typeof place === 'string' ? this.findPlace(place) : place
    if (!isPoint(target)) return Promise.resolve()
    const goal = viewFor(target)
    this.finishTurn()
    this.velocityLat = 0
    this.velocityLng = 0
    this.isHeld = true
    if (this.isReduced || !this.loop.isRunning) {
      this.view = goal
      this.redraw()
      return Promise.resolve()
    }
    return new Promise((resolve) => {
      this.turn = {
        fromLat: this.view.lat,
        fromLng: this.view.lng,
        toLat: goal.lat,
        deltaLng: lngDelta(this.view.lng, goal.lng),
        start: this.clock,
        resolve,
      }
    })
  }

  /** Draws the arcs in again from the start, for a replay button. */
  public play(): void {
    this.arcStart = this.clock
    this.redraw()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('markers') || changed.has('arcs')) this.prepareData()
    if (changed.has('center') || (!this.hasView && this.firstPlace())) {
      this.faceCenter()
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('showLabels') || changed.has('isPaused')) this.redraw()
  }

  private get pinnedMarkers(): GlobeMarker[] {
    return this.pins.map((pin) => pin.marker)
  }

  private firstPlace(): GlobePoint | null {
    if (isPoint(this.center)) return this.center
    return this.pins[0]?.marker ?? null
  }

  /** Puts `center`, or else the first pin, at the front. */
  private faceCenter(): void {
    const place = this.firstPlace()
    if (place) {
      this.view = viewFor(place)
      this.hasView = true
    }
    this.redraw()
  }

  private findPlace(name: string): GlobePoint | null {
    const wanted = name.trim().toLowerCase()
    return (
      this.pinnedMarkers.find(
        (marker) => marker.label?.trim().toLowerCase() === wanted,
      ) ?? null
    )
  }

  /** Validates the places and prepares each arc's points, once per change. */
  private prepareData(): void {
    const arcs = Array.isArray(this.arcs) ? this.arcs.filter(isArc) : []
    const markers = Array.isArray(this.markers)
      ? this.markers.filter(isPoint)
      : []
    // Every arc end is pinned, unless a marker already sits there.
    for (const arc of arcs) {
      for (const end of [arc.from, arc.to]) {
        if (!markers.some((marker) => samePlace(marker, end))) markers.push(end)
      }
    }
    this.pins = markers.map((marker) => ({
      marker,
      vector: toVector(marker.lat, marker.lng),
    }))
    this.routes = arcs.map((arc) => {
      const path = arcPath(arc.from, arc.to)
      const steps = Math.max(12, Math.ceil((path.angle / Math.PI) * 72)) + 1
      const raw = new Float32Array(steps * 3)
      const point: Vector = [0, 0, 0]
      for (let i = 0; i < steps; i++) {
        arcPoint(path, i / (steps - 1), point)
        raw[i * 3] = point[0]
        raw[i * 3 + 1] = point[1]
        raw[i * 3 + 2] = point[2]
      }
      return { arc, path, steps, raw, turned: new Float32Array(steps * 3) }
    })
    this.redraw()
  }

  /** Sizes the globe and its dot lattice to the canvas. */
  private measure(width: number, height: number): void {
    this.radius = Math.max(0, (Math.min(width, height) / 2) * 0.84)
    const samples = landSamples(this.radius)
    const land = landPoints(samples)
    if (land !== this.land) {
      this.land = land
      const count = land.length / 3
      this.screen = new Float32Array(count * 2)
      this.bucketOf = new Uint8Array(count)
      this.order = new Uint32Array(count)
    }
    const spacing = this.radius * Math.sqrt((4 * Math.PI) / samples)
    this.dotSize = Math.max(1.1, Math.min(3, spacing * 0.5))
    this.gradients = null
    this.needsDraw = true
  }

  private prepareColors(): void {
    const dot = this.palette.get('dot')
    this.dotFills = Array.from({ length: BUCKETS }, (_, bucket) =>
      withAlpha(dot, 0.12 + 0.68 * ((bucket + 0.5) / BUCKETS) ** 1.2),
    )
    this.gradients = null
    const family = this.isConnected ? getComputedStyle(this).fontFamily : ''
    this.font = `500 12px ${family || 'sans-serif'}`
  }

  private redraw(): void {
    this.needsDraw = true
    if (!this.loop.isRunning) this.loop.drawOnce()
  }

  /** Whether anything on the globe moves on its own right now. */
  private get isMoving(): boolean {
    if (this.isDragging || this.turn) return true
    if (this.isReduced) return false
    if (Math.abs(this.velocityLat) + Math.abs(this.velocityLng) > 0.01) {
      return true
    }
    if (!this.isPaused && !this.isHeld && this.speed !== 0) return true
    return this.routes.length > 0 || this.pins.length > 0
  }

  private advance(delta: number): void {
    if (this.isReduced) {
      this.velocityLat = 0
      this.velocityLng = 0
      return
    }
    this.clock += delta
    const turn = this.turn
    if (turn) {
      const progress = (this.clock - turn.start) / TURN_DURATION
      const eased = easeInOut(progress)
      this.view.lat = turn.fromLat + (turn.toLat - turn.fromLat) * eased
      this.view.lng = wrapLng(turn.fromLng + turn.deltaLng * eased)
      if (progress >= 1) this.finishTurn()
      return
    }
    if (this.isDragging) return
    const seconds = delta / 1000
    this.view.lng = wrapLng(this.view.lng + this.velocityLng * seconds)
    this.view.lat = clampLat(this.view.lat + this.velocityLat * seconds)
    const keep = Math.exp(-delta / INERTIA_MS)
    this.velocityLng *= keep
    this.velocityLat *= keep
    if (!this.isPaused && !this.isHeld) {
      this.autoBlend = Math.min(1, this.autoBlend + delta / 900)
      // Turning east, as the earth does: places from the west come into view.
      this.view.lng = wrapLng(
        this.view.lng - this.speed * seconds * this.autoBlend,
      )
    }
  }

  private finishTurn(): void {
    const turn = this.turn
    if (!turn) return
    this.turn = null
    this.view.lat = turn.toLat
    this.view.lng = wrapLng(turn.fromLng + turn.deltaLng)
    turn.resolve()
  }

  private paint(frame: CanvasFrame): void {
    const { context, width, height, delta } = frame
    if (!context || this.radius <= 0) return
    if (!this.needsDraw && !this.isMoving) return
    this.needsDraw = false
    this.advance(delta)
    if (this.dotFills.length === 0) this.prepareColors()

    const cx = width / 2
    const cy = height / 2
    const r = this.radius
    context.clearRect(0, 0, width, height)
    this.paintSphere(context, cx, cy, r)
    this.paintLand(context, cx, cy, r)
    this.paintArcs(context, cx, cy, r)
    this.paintPins(context, cx, cy, r, width)
  }

  private paintSphere(
    context: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
  ): void {
    if (!this.gradients) {
      const glow = this.palette.get('glow')
      const dot = this.palette.get('dot')
      const halo = context.createRadialGradient(
        cx,
        cy,
        r * 0.96,
        cx,
        cy,
        r * 1.18,
      )
      halo.addColorStop(0, withAlpha(glow, 0.2))
      halo.addColorStop(0.35, withAlpha(glow, 0.07))
      halo.addColorStop(1, withAlpha(glow, 0))
      const rim = context.createRadialGradient(cx, cy, r * 0.62, cx, cy, r)
      rim.addColorStop(0, withAlpha(glow, 0))
      rim.addColorStop(1, withAlpha(glow, 0.2))
      const shade = context.createRadialGradient(
        cx - r * 0.38,
        cy - r * 0.42,
        0,
        cx - r * 0.38,
        cy - r * 0.42,
        r * 1.25,
      )
      shade.addColorStop(0, withAlpha(dot, 0.07))
      shade.addColorStop(1, withAlpha(dot, 0))
      this.gradients = { halo, rim, shade }
    }
    const { halo, rim, shade } = this.gradients
    context.fillStyle = halo
    context.beginPath()
    context.arc(cx, cy, r * 1.18, 0, TAU)
    context.fill()
    context.beginPath()
    context.arc(cx, cy, r, 0, TAU)
    context.fillStyle = this.palette.get('sphere')
    context.fill()
    context.fillStyle = shade
    context.fill()
    context.fillStyle = rim
    context.fill()
  }

  /**
   * Turns every land dot, keeps the near side, sorts the dots into depth
   * bands (a counting sort, no allocation) and fills each band as one path.
   */
  private paintLand(
    context: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
  ): void {
    // Plain reads rather than destructuring, so the linter sees each field used.
    const land = this.land
    const screen = this.screen
    const bucketOf = this.bucketOf
    const order = this.order
    const counts = this.counts
    const offsets = this.offsets
    const count = land.length / 3
    const t = viewTransform(this.view)
    counts.fill(0)
    for (let i = 0; i < count; i++) {
      const x = land[i * 3]
      const y = land[i * 3 + 1]
      const z = land[i * 3 + 2]
      const x1 = x * t.cosLng - z * t.sinLng
      const z1 = x * t.sinLng + z * t.cosLng
      const y2 = y * t.cosLat - z1 * t.sinLat
      const z2 = y * t.sinLat + z1 * t.cosLat
      if (z2 <= 0.02) {
        bucketOf[i] = 255
        continue
      }
      const bucket = Math.min(BUCKETS - 1, (z2 * BUCKETS) | 0)
      bucketOf[i] = bucket
      counts[bucket] += 1
      screen[i * 2] = cx + r * x1
      screen[i * 2 + 1] = cy - r * y2
    }
    let total = 0
    for (let b = 0; b < BUCKETS; b++) {
      offsets[b] = total
      total += counts[b]
    }
    for (let i = 0; i < count; i++) {
      const bucket = bucketOf[i]
      if (bucket !== 255) order[offsets[bucket]++] = i
    }
    let start = 0
    for (let b = 0; b < BUCKETS; b++) {
      const end = start + counts[b]
      if (end > start) {
        const radius = (this.dotSize / 2) * (0.6 + 0.4 * ((b + 0.5) / BUCKETS))
        context.beginPath()
        for (let k = start; k < end; k++) {
          const i = order[k]
          const x = screen[i * 2]
          const y = screen[i * 2 + 1]
          context.moveTo(x + radius, y)
          context.arc(x, y, radius, 0, TAU)
        }
        context.fillStyle = this.dotFills[b]
        context.fill()
      }
      start = end
    }
  }

  private paintArcs(
    context: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
  ): void {
    if (this.routes.length === 0) return
    const t = viewTransform(this.view)
    const color = this.palette.get('arc')
    context.lineCap = 'round'
    context.lineJoin = 'round'
    this.routes.forEach((route, index) => {
      const { raw, turned, steps } = route
      for (let i = 0; i < steps; i++) {
        turnVector(raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2], t, turned, i * 3)
      }
      const since = this.clock - this.arcStart - index * ARC_STAGGER
      const progress = this.isReduced
        ? 1
        : Math.max(0, Math.min(1, since / ARC_DURATION))
      if (progress <= 0) return
      context.strokeStyle = color
      context.globalAlpha = 0.75
      context.lineWidth = 1.5
      strokeRange(context, turned, steps, 0, progress, cx, cy, r)
      context.globalAlpha = 1
      if (this.isReduced || progress < 1) return
      // A short light runs along the finished arc, start to end.
      const phase = ((since - ARC_DURATION) % LIGHT_PERIOD) / LIGHT_PERIOD
      const head = phase * 1.25
      const tail = Math.max(0, head - 0.16)
      if (tail >= 1) return
      context.globalAlpha = 0.28
      context.lineWidth = 5
      strokeRange(context, turned, steps, tail, Math.min(1, head), cx, cy, r)
      context.globalAlpha = 1
      context.lineWidth = 2
      strokeRange(
        context,
        turned,
        steps,
        Math.max(tail, head - 0.08),
        Math.min(1, head),
        cx,
        cy,
        r,
      )
    })
  }

  private paintPins(
    context: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    width: number,
  ): void {
    if (this.pins.length === 0) return
    const t = viewTransform(this.view)
    const color = this.palette.get('marker')
    const sphere = this.palette.get('sphere')
    const label = this.palette.get('label')
    const out = this.turned
    context.font = this.font
    context.textBaseline = 'middle'
    this.pins.forEach(({ marker, vector }, index) => {
      turnVector(vector[0], vector[1], vector[2], t, out)
      const z = out[2]
      if (z <= -0.02) return
      const fade = Math.min(1, (z + 0.02) / 0.2)
      const x = cx + r * out[0]
      const y = cy - r * out[1]
      const size = 3.2 * (0.7 + 0.3 * z)
      context.fillStyle = color
      if (!this.isReduced) {
        const phase = ((this.clock + index * 430) % PULSE_PERIOD) / PULSE_PERIOD
        context.globalAlpha = 0.35 * (1 - phase) * fade
        context.beginPath()
        context.arc(x, y, size + 10 * phase, 0, TAU)
        context.fill()
      }
      context.globalAlpha = fade
      context.beginPath()
      context.arc(x, y, size, 0, TAU)
      context.fill()
      context.lineWidth = 1.5
      context.strokeStyle = sphere
      context.stroke()

      if (this.showLabels && marker.label && z >= 0.12) {
        const text = marker.label
        const textWidth = context.measureText(text).width
        const toRight = x + size + 6 + textWidth < width - 4
        const tx = toRight ? x + size + 6 : x - size - 6 - textWidth
        const alpha = Math.min(1, (z - 0.12) / 0.2)
        context.globalAlpha = 0.85 * alpha
        context.lineWidth = 3
        context.strokeText(text, tx, y)
        context.globalAlpha = alpha
        context.fillStyle = label
        context.fillText(text, tx, y)
      }
      context.globalAlpha = 1
    })
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    this.dragId = event.pointerId
    this.dragX = event.clientX
    this.dragY = event.clientY
    this.dragTime = event.timeStamp
    this.hasMoved = false
    try {
      this.setPointerCapture(event.pointerId)
    } catch {
      // A synthetic or already-released pointer cannot be captured.
    }
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.dragId || this.radius <= 0) return
    const dx = event.clientX - this.dragX
    // A finger drags sideways only; up and down stays with the page (touch-action: pan-y).
    const dy = event.pointerType === 'touch' ? 0 : event.clientY - this.dragY
    if (!this.hasMoved && Math.hypot(dx, dy) < 3) return
    if (!this.hasMoved) {
      this.hasMoved = true
      this.isDragging = true
      this.isHeld = false
      this.finishTurn()
      this.velocityLat = 0
      this.velocityLng = 0
    }
    const degreesPerPixel = 180 / (Math.PI * this.radius)
    const deltaLng = -dx * degreesPerPixel
    const deltaLat = dy * degreesPerPixel
    this.view.lng = wrapLng(this.view.lng + deltaLng)
    this.view.lat = clampLat(this.view.lat + deltaLat)
    const elapsed = event.timeStamp - this.dragTime
    if (elapsed > 0) {
      const smoothing = 0.4
      this.velocityLng +=
        ((deltaLng / elapsed) * 1000 - this.velocityLng) * smoothing
      this.velocityLat +=
        ((deltaLat / elapsed) * 1000 - this.velocityLat) * smoothing
    }
    this.dragX = event.clientX
    this.dragY = event.clientY
    this.dragTime = event.timeStamp
    this.redraw()
  }

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.dragId) return
    this.dragId = null
    if (this.hasPointerCapture?.(event.pointerId)) {
      this.releasePointerCapture(event.pointerId)
    }
    if (!this.hasMoved) return
    this.isDragging = false
    this.autoBlend = 0
    // A pause before letting go means no fling; so does reduced motion or a cancelled drag.
    const idle = event.timeStamp - this.dragTime > 80
    if (this.isReduced || idle || event.type !== 'pointerup') {
      this.velocityLat = 0
      this.velocityLng = 0
    }
    const limit = 720
    this.velocityLng = Math.max(-limit, Math.min(limit, this.velocityLng))
    this.velocityLat = Math.max(-limit, Math.min(limit, this.velocityLat))
    this.redraw()
  }

  protected override render() {
    const spoken = [
      ...this.pinnedMarkers.map((marker) => marker.label).filter(Boolean),
      ...this.routes
        .map(
          ({ arc }) =>
            arc.label ??
            (arc.from.label && arc.to.label
              ? `${arc.from.label} to ${arc.to.label}`
              : ''),
        )
        .filter(Boolean),
    ] as string[]

    return html`<div
        part="base"
        class=${this.isDragging ? 'base is-dragging' : 'base'}
        role="img"
        aria-label=${this.label || 'Globe'}
      >
        <canvas part="canvas" aria-hidden="true"></canvas>
      </div>
      <span class="color-probe"></span>
      ${
        spoken.length > 0
          ? html`<ul class="visually-hidden">
              ${spoken.map((text) => html`<li>${text}</li>`)}
            </ul>`
          : nothing
      }`
  }
}

function clampLat(lat: number): number {
  return Math.max(-MAX_VIEW_LAT, Math.min(MAX_VIEW_LAT, lat))
}

/**
 * Strokes the part of an arc from `t0` to `t1` (fractions of its length),
 * lifting the pen wherever the arc passes behind the globe.
 */
function strokeRange(
  context: CanvasRenderingContext2D,
  turned: Float32Array,
  steps: number,
  t0: number,
  t1: number,
  cx: number,
  cy: number,
  r: number,
): void {
  if (t1 <= t0) return
  const last = steps - 1
  const startIndex = t0 * last
  const endIndex = t1 * last
  context.beginPath()
  let isDrawing = false
  const visit = (position: number): void => {
    const i = Math.min(last - 1, Math.floor(position))
    const f = position - i
    const a = i * 3
    const b = Math.min(last, i + 1) * 3
    const x = turned[a] + (turned[b] - turned[a]) * f
    const y = turned[a + 1] + (turned[b + 1] - turned[a + 1]) * f
    const z = turned[a + 2] + (turned[b + 2] - turned[a + 2]) * f
    if (isOccluded(x, y, z)) {
      isDrawing = false
      return
    }
    const sx = cx + r * x
    const sy = cy - r * y
    if (isDrawing) context.lineTo(sx, sy)
    else context.moveTo(sx, sy)
    isDrawing = true
  }
  visit(startIndex)
  for (let i = Math.floor(startIndex) + 1; i < endIndex; i++) visit(i)
  visit(endIndex)
  context.stroke()
}

defineElement('moul-globe', MoulGlobe)

declare global {
  interface HTMLElementTagNameMap {
    'moul-globe': MoulGlobe
  }
}
