/**
 * The maths behind `<moul-icon-cloud>`: icons spread evenly over a sphere,
 * and the turns that spin it. Pure functions, tested without a canvas.
 *
 * Coordinates: a unit sphere with x to the right, y up and z toward the
 * viewer. A turn is a 3×3 rotation matrix, row by row.
 */

export type Vector3 = [number, number, number]

/** A 3×3 rotation matrix, row-major. */
export type Matrix3 = Float64Array

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/**
 * `count` points spread evenly over a unit sphere (a Fibonacci lattice), as
 * vectors. The first point is near the top and the last near the bottom, each
 * a golden angle round from the one before, so no two crowd together.
 */
export function fibonacciSphere(count: number): Vector3[] {
  const n = Math.max(0, Math.floor(count))
  const points: Vector3[] = []
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n
    const ring = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = i * GOLDEN_ANGLE
    points.push([Math.cos(theta) * ring, y, Math.sin(theta) * ring])
  }
  return points
}

export function identity(): Matrix3 {
  return new Float64Array([1, 0, 0, 0, 1, 0, 0, 0, 1])
}

/**
 * The rotation by `angle` radians about the axis (`x`, `y`, `z`), which need
 * not be unit length (Rodrigues' formula). A zero axis gives no turn.
 */
export function axisAngle(
  x: number,
  y: number,
  z: number,
  angle: number,
  out: Matrix3 = identity(),
): Matrix3 {
  const length = Math.hypot(x, y, z)
  if (length < 1e-9 || angle === 0) {
    out.set([1, 0, 0, 0, 1, 0, 0, 0, 1])
    return out
  }
  const ux = x / length
  const uy = y / length
  const uz = z / length
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const t = 1 - c
  out[0] = t * ux * ux + c
  out[1] = t * ux * uy - s * uz
  out[2] = t * ux * uz + s * uy
  out[3] = t * ux * uy + s * uz
  out[4] = t * uy * uy + c
  out[5] = t * uy * uz - s * ux
  out[6] = t * ux * uz - s * uy
  out[7] = t * uy * uz + s * ux
  out[8] = t * uz * uz + c
  return out
}

/** `a × b`: apply `b` first, then `a`. Safe when `out` is `a` or `b`. */
export function multiply(
  a: Matrix3,
  b: Matrix3,
  out: Matrix3 = identity(),
): Matrix3 {
  const r0 = a[0] * b[0] + a[1] * b[3] + a[2] * b[6]
  const r1 = a[0] * b[1] + a[1] * b[4] + a[2] * b[7]
  const r2 = a[0] * b[2] + a[1] * b[5] + a[2] * b[8]
  const r3 = a[3] * b[0] + a[4] * b[3] + a[5] * b[6]
  const r4 = a[3] * b[1] + a[4] * b[4] + a[5] * b[7]
  const r5 = a[3] * b[2] + a[4] * b[5] + a[5] * b[8]
  const r6 = a[6] * b[0] + a[7] * b[3] + a[8] * b[6]
  const r7 = a[6] * b[1] + a[7] * b[4] + a[8] * b[7]
  const r8 = a[6] * b[2] + a[7] * b[5] + a[8] * b[8]
  out[0] = r0
  out[1] = r1
  out[2] = r2
  out[3] = r3
  out[4] = r4
  out[5] = r5
  out[6] = r6
  out[7] = r7
  out[8] = r8
  return out
}

/** The vector turned by `m`, written into `out`. */
export function apply(
  m: Matrix3,
  v: Vector3,
  out: Vector3 = [0, 0, 0],
): Vector3 {
  const [x, y, z] = v
  out[0] = m[0] * x + m[1] * y + m[2] * z
  out[1] = m[3] * x + m[4] * y + m[5] * z
  out[2] = m[6] * x + m[7] * y + m[8] * z
  return out
}

/**
 * Pulls a matrix back to a pure rotation (Gram–Schmidt on its rows), since
 * thousands of small turns multiplied together slowly drift from one.
 */
export function orthonormalize(m: Matrix3): Matrix3 {
  let length = Math.hypot(m[0], m[1], m[2]) || 1
  m[0] /= length
  m[1] /= length
  m[2] /= length
  const dot = m[0] * m[3] + m[1] * m[4] + m[2] * m[5]
  m[3] -= dot * m[0]
  m[4] -= dot * m[1]
  m[5] -= dot * m[2]
  length = Math.hypot(m[3], m[4], m[5]) || 1
  m[3] /= length
  m[4] /= length
  m[5] /= length
  m[6] = m[1] * m[5] - m[2] * m[4]
  m[7] = m[2] * m[3] - m[0] * m[5]
  m[8] = m[0] * m[4] - m[1] * m[3]
  return m
}

/**
 * The turn that carries a drag of (`dx`, `dy`) CSS pixels on a sphere of
 * `radius` pixels: the front of the sphere follows the pointer. Screen y
 * runs down while the sphere's y runs up, hence the signs.
 */
export function dragRotation(
  dx: number,
  dy: number,
  radius: number,
  out: Matrix3 = identity(),
): Matrix3 {
  const distance = Math.hypot(dx, dy)
  if (radius <= 0 || distance === 0) return axisAngle(0, 0, 0, 0, out)
  return axisAngle(dy, dx, 0, distance / radius, out)
}

/**
 * The axis and angle that turn the point `p` (already turned) to the front
 * of the sphere, (0, 0, 1), the shortest way.
 */
export function turnToFront(p: Vector3): { axis: Vector3; angle: number } {
  const length = Math.hypot(p[0], p[1], p[2]) || 1
  const z = p[2] / length
  const angle = Math.acos(Math.max(-1, Math.min(1, z)))
  // p × (0, 0, 1); straight behind, any axis in the screen's plane will do.
  const axis: Vector3 =
    Math.hypot(p[0], p[1]) < 1e-9 ? [0, 1, 0] : [p[1], -p[0], 0]
  return { axis, angle }
}

/** How big and how opaque an icon looks at depth `z` (-1 at the back, 1 at the front). */
export function depthStyle(z: number): { scale: number; alpha: number } {
  const t = (Math.max(-1, Math.min(1, z)) + 1) / 2
  return { scale: 0.5 + 0.5 * t, alpha: 0.18 + 0.82 * t * t }
}

/** Eases a turn out (cubic). */
export function easeOut(t: number): number {
  const clamped = Math.max(0, Math.min(1, t))
  return 1 - (1 - clamped) ** 3
}
