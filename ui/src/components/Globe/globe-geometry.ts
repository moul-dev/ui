/**
 * The maths behind `<moul-globe>`: where the land dots sit on the sphere,
 * how a place turns into view, and the great-circle arcs between places.
 * Pure functions, so they are tested without a canvas.
 *
 * Coordinates: a unit sphere with x to the right, y up and z toward the
 * viewer. A view is the place at the centre of the visible face.
 */
import { LAND_MASK } from '../WorldMap/land-mask'

/** A place, in degrees: latitude north positive, longitude east positive. */
export interface GlobePoint {
  lat: number
  lng: number
  /** A name for the place, drawn with `show-labels` and read by screen readers. */
  label?: string
}

/** A pin on the globe. */
export type GlobeMarker = GlobePoint

/** A great-circle arc from one place to another. */
export interface GlobeArc {
  from: GlobePoint
  to: GlobePoint
  /** What the arc means, read by screen readers. Defaults to "From to To" when both ends are labelled. */
  label?: string
}

/** The place at the centre of the visible face, in degrees. */
export interface GlobeView {
  lat: number
  lng: number
}

export type Vector = [number, number, number]

const RADIANS = Math.PI / 180
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/** How far north or south the view may tilt, in degrees. */
export const MAX_VIEW_LAT = 70

/** A place as a unit vector, before any turning: (0, 0, 1) is 0°N 0°E. */
export function toVector(lat: number, lng: number): Vector {
  const phi = lat * RADIANS
  const lambda = lng * RADIANS
  const cosPhi = Math.cos(phi)
  return [cosPhi * Math.sin(lambda), Math.sin(phi), cosPhi * Math.cos(lambda)]
}

/** A unit vector back to latitude and longitude, in degrees. */
export function toPlace(vector: Vector): GlobeView {
  const [x, y, z] = vector
  return {
    lat: Math.asin(Math.max(-1, Math.min(1, y))) / RADIANS,
    lng: Math.atan2(x, z) / RADIANS,
  }
}

/** The sines and cosines a view needs, worked out once per frame. */
export interface ViewTransform {
  sinLat: number
  cosLat: number
  sinLng: number
  cosLng: number
}

export function viewTransform(view: GlobeView): ViewTransform {
  const lat = view.lat * RADIANS
  const lng = view.lng * RADIANS
  return {
    sinLat: Math.sin(lat),
    cosLat: Math.cos(lat),
    sinLng: Math.sin(lng),
    cosLng: Math.cos(lng),
  }
}

/**
 * Turns the vector (`x`, `y`, `z`) so the view's place faces the viewer,
 * writing the result into `out` at `offset`. North stays up: the globe turns
 * about its own axis by the view's longitude, then tips by its latitude.
 */
export function turnVector(
  x: number,
  y: number,
  z: number,
  t: ViewTransform,
  out: Float32Array | number[],
  offset = 0,
): void {
  // About the polar axis, so the view's longitude comes to the front...
  const x1 = x * t.cosLng - z * t.sinLng
  const z1 = x * t.sinLng + z * t.cosLng
  // ...then about the horizontal axis, so its latitude does too.
  out[offset] = x1
  out[offset + 1] = y * t.cosLat - z1 * t.sinLat
  out[offset + 2] = y * t.sinLat + z1 * t.cosLat
}

/** Where a place appears for a view: x right, y up, z toward the viewer (negative is the far side). */
export function projectPlace(point: GlobePoint, view: GlobeView): Vector {
  const out: Vector = [0, 0, 0]
  const [x, y, z] = toVector(point.lat, point.lng)
  turnVector(x, y, z, viewTransform(view), out)
  return out
}

/** 1 when the mask's cell at `row` and `column` is land, else 0. Rows past the mask are sea; columns wrap. */
function cellValue(row: number, column: number, bytes: string): number {
  const { columns, rows } = LAND_MASK
  if (row < 0 || row >= rows) return 0
  const wrapped = ((column % columns) + columns) % columns
  const cell = row * columns + wrapped
  return bytes.charCodeAt(cell >> 3) & (0x80 >> (cell & 7)) ? 1 : 0
}

/**
 * Whether the land mask counts this place as land. The four nearest cell
 * centres are blended (bilinear) and held to a threshold a little under
 * one half, which turns the 2° cells’ staircase coastlines into smooth
 * diagonals and keeps narrow islands. Beyond the mask (the poles) is sea.
 */
export function isLand(lat: number, lng: number, bytes: string): boolean {
  const { step, north } = LAND_MASK
  // Fractional row and column, measured between cell centres.
  const row = (north - lat) / step
  const column = (wrapLng(lng) + 180) / step - 0.5
  const r0 = Math.floor(row)
  const c0 = Math.floor(column)
  const fr = row - r0
  const fc = column - c0
  const top =
    cellValue(r0, c0, bytes) * (1 - fc) + cellValue(r0, c0 + 1, bytes) * fc
  const bottom =
    cellValue(r0 + 1, c0, bytes) * (1 - fc) +
    cellValue(r0 + 1, c0 + 1, bytes) * fc
  return top * (1 - fr) + bottom * fr >= 0.42
}

let maskBytes: string | null = null

function landBytes(): string {
  if (maskBytes === null) {
    maskBytes = typeof atob === 'function' ? atob(LAND_MASK.bits) : ''
  }
  return maskBytes
}

/**
 * Points spread evenly over a sphere: a Fibonacci lattice of `count`
 * points, as unit vectors packed x, y, z.
 */
export function fibonacciSphere(count: number): Float32Array {
  const n = Math.max(1, Math.floor(count))
  const points = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n
    const ring = Math.sqrt(1 - y * y)
    const theta = i * GOLDEN_ANGLE
    points[i * 3] = Math.cos(theta) * ring
    points[i * 3 + 1] = y
    points[i * 3 + 2] = Math.sin(theta) * ring
  }
  return points
}

const landCache = new Map<number, Float32Array>()

/**
 * The land dots: an even lattice of `samples` points over the whole sphere,
 * kept where the land mask says land. Even spacing keeps the dots from
 * bunching toward the poles, as a latitude-longitude grid would.
 */
export function landPoints(samples: number): Float32Array {
  const key = Math.round(samples)
  const cached = landCache.get(key)
  if (cached) return cached
  const bytes = landBytes()
  const lattice = fibonacciSphere(key)
  const kept: number[] = []
  for (let i = 0; i < lattice.length; i += 3) {
    const vector: Vector = [lattice[i], lattice[i + 1], lattice[i + 2]]
    const { lat, lng } = toPlace(vector)
    if (isLand(lat, lng, bytes)) kept.push(vector[0], vector[1], vector[2])
  }
  const points = new Float32Array(kept)
  landCache.set(key, points)
  return points
}

/**
 * How many lattice points to sample for a globe of `radius` CSS pixels, so
 * dots sit about `spacing` pixels apart. Held between 6,000 and 28,000:
 * fewer looks sparse, and more is finer than the 2° mask can show.
 */
export function landSamples(radius: number, spacing = 4.5): number {
  const target = (4 * Math.PI * radius * radius) / (spacing * spacing)
  // Round to steps of 2,000 so small resizes reuse the cached lattice.
  const stepped = Math.round(target / 2000) * 2000
  return Math.max(6000, Math.min(28000, stepped))
}

/** The angle between two unit vectors, in radians. */
export function angleBetween(a: Vector, b: Vector): number {
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  return Math.acos(Math.max(-1, Math.min(1, dot)))
}

/** An arc, prepared once: its ends as vectors, the angle between them and how high it rises. */
export interface ArcPath {
  from: Vector
  to: Vector
  /** The angle between the ends, in radians. */
  angle: number
  /** How far the middle rises above the surface, as a fraction of the radius. */
  height: number
}

/** Prepares an arc. Long routes rise higher than short ones, as on a flight map. */
export function arcPath(from: GlobePoint, to: GlobePoint): ArcPath {
  const a = toVector(from.lat, from.lng)
  const b = toVector(to.lat, to.lng)
  const angle = angleBetween(a, b)
  return { from: a, to: b, angle, height: 0.06 + 0.3 * (angle / Math.PI) }
}

/**
 * The point `t` (0 to 1) of the way along an arc, lifted off the surface:
 * spherical interpolation between the ends, raised by `height` at the
 * middle and not at all at the ends. Written into `out`.
 */
export function arcPoint(
  arc: ArcPath,
  t: number,
  out: number[] | Vector,
): void {
  const { from: a, to: b, angle } = arc
  let wa = 1 - t
  let wb = t
  if (angle > 1e-4) {
    const sin = Math.sin(angle)
    if (sin > 1e-4) {
      wa = Math.sin((1 - t) * angle) / sin
      wb = Math.sin(t * angle) / sin
    }
  }
  let x = a[0] * wa + b[0] * wb
  let y = a[1] * wa + b[1] * wb
  let z = a[2] * wa + b[2] * wb
  const length = Math.hypot(x, y, z) || 1
  const lift = (1 + arc.height * Math.sin(Math.PI * t)) / length
  x *= lift
  y *= lift
  z *= lift
  out[0] = x
  out[1] = y
  out[2] = z
}

/**
 * Whether a turned point (x right, y up, z toward the viewer) is hidden
 * behind the globe: on the far side and inside the disc's outline. A raised
 * arc point past the outline stays visible even on the far side.
 */
export function isOccluded(x: number, y: number, z: number): boolean {
  return z < 0 && x * x + y * y < 1
}

/** The view that puts a place at the centre, with the tilt held to `MAX_VIEW_LAT`. */
export function viewFor(point: GlobePoint): GlobeView {
  return {
    lat: Math.max(-MAX_VIEW_LAT, Math.min(MAX_VIEW_LAT, point.lat)),
    lng: wrapLng(point.lng),
  }
}

/** A longitude wrapped into -180 to 180. */
export function wrapLng(lng: number): number {
  // Already in range: return it untouched, so 104.92 stays 104.92.
  if (lng >= -180 && lng < 180) return lng
  return ((((lng + 180) % 360) + 360) % 360) - 180
}

/** The signed change from one longitude to another the short way round, -180 to 180. */
export function lngDelta(from: number, to: number): number {
  return wrapLng(to - from)
}

/** Eases a turn in and out (cubic). */
export function easeInOut(t: number): number {
  const clamped = Math.max(0, Math.min(1, t))
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - (-2 * clamped + 2) ** 3 / 2
}

/**
 * Reads a `center` attribute: `"11.56, 104.92"` or JSON `{ "lat": …, "lng": … }`.
 * Returns null for anything else.
 */
export function parsePlace(value: string | null): GlobePoint | null {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<GlobePoint>
      return isPoint(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  const parts = trimmed.split(/[\s,]+/).map(Number)
  if (parts.length === 2 && parts.every(Number.isFinite)) {
    return { lat: parts[0], lng: parts[1] }
  }
  return null
}

export function isPoint(value: unknown): value is GlobePoint {
  const point = value as GlobePoint | null
  return (
    typeof point === 'object' &&
    point !== null &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng)
  )
}

export function isArc(value: unknown): value is GlobeArc {
  const arc = value as GlobeArc | null
  return (
    typeof arc === 'object' &&
    arc !== null &&
    isPoint(arc.from) &&
    isPoint(arc.to)
  )
}

export function samePlace(a: GlobePoint, b: GlobePoint): boolean {
  return Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lng - b.lng) < 0.01
}
