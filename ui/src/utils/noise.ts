/**
 * Seeded randomness and smooth noise for the canvas elements: the same seed
 * draws the same field, so a still frame under reduced motion and a test
 * snapshot are stable.
 */

/** A seeded random number generator (mulberry32): call it for the next number in [0, 1). */
export function createRandom(seed = 1): () => number {
  let state = seed >>> 0 || 1
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GRAD3 = new Float32Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0,
  -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
])

const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6
const F3 = 1 / 3
const G3 = 1 / 6

export interface Noise {
  /** Smooth noise in [-1, 1] at a 2D point. */
  noise2(x: number, y: number): number
  /** Smooth noise in [-1, 1] at a 3D point; use the third axis for time. */
  noise3(x: number, y: number, z: number): number
}

/**
 * Simplex noise (after Stefan Gustavson's public-domain reference), seeded.
 * Neighbouring points give neighbouring values, which makes it the base of
 * flowing waves, drifting particles and flow fields.
 */
export function createNoise(seed = 1): Noise {
  const random = createRandom(seed)
  const perm = new Uint8Array(512)
  const permMod12 = new Uint8Array(512)
  const source = new Uint8Array(256)
  for (let i = 0; i < 256; i++) source[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const swap = source[i]
    source[i] = source[j]
    source[j] = swap
  }
  for (let i = 0; i < 512; i++) {
    perm[i] = source[i & 255]
    permMod12[i] = perm[i] % 12
  }

  function noise2(xin: number, yin: number): number {
    const s = (xin + yin) * F2
    const i = Math.floor(xin + s)
    const j = Math.floor(yin + s)
    const t = (i + j) * G2
    const x0 = xin - (i - t)
    const y0 = yin - (j - t)
    const i1 = x0 > y0 ? 1 : 0
    const j1 = x0 > y0 ? 0 : 1
    const x1 = x0 - i1 + G2
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1 + 2 * G2
    const y2 = y0 - 1 + 2 * G2
    const ii = i & 255
    const jj = j & 255
    let n = 0
    let t0 = 0.5 - x0 * x0 - y0 * y0
    if (t0 > 0) {
      const g = permMod12[ii + perm[jj]] * 3
      t0 *= t0
      n += t0 * t0 * (GRAD3[g] * x0 + GRAD3[g + 1] * y0)
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1
    if (t1 > 0) {
      const g = permMod12[ii + i1 + perm[jj + j1]] * 3
      t1 *= t1
      n += t1 * t1 * (GRAD3[g] * x1 + GRAD3[g + 1] * y1)
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2
    if (t2 > 0) {
      const g = permMod12[ii + 1 + perm[jj + 1]] * 3
      t2 *= t2
      n += t2 * t2 * (GRAD3[g] * x2 + GRAD3[g + 1] * y2)
    }
    return 70 * n
  }

  function noise3(xin: number, yin: number, zin: number): number {
    const s = (xin + yin + zin) * F3
    const i = Math.floor(xin + s)
    const j = Math.floor(yin + s)
    const k = Math.floor(zin + s)
    const t = (i + j + k) * G3
    const x0 = xin - (i - t)
    const y0 = yin - (j - t)
    const z0 = zin - (k - t)
    let i1: number
    let j1: number
    let k1: number
    let i2: number
    let j2: number
    let k2: number
    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1
        j1 = 0
        k1 = 0
        i2 = 1
        j2 = 1
        k2 = 0
      } else if (x0 >= z0) {
        i1 = 1
        j1 = 0
        k1 = 0
        i2 = 1
        j2 = 0
        k2 = 1
      } else {
        i1 = 0
        j1 = 0
        k1 = 1
        i2 = 1
        j2 = 0
        k2 = 1
      }
    } else if (y0 < z0) {
      i1 = 0
      j1 = 0
      k1 = 1
      i2 = 0
      j2 = 1
      k2 = 1
    } else if (x0 < z0) {
      i1 = 0
      j1 = 1
      k1 = 0
      i2 = 0
      j2 = 1
      k2 = 1
    } else {
      i1 = 0
      j1 = 1
      k1 = 0
      i2 = 1
      j2 = 1
      k2 = 0
    }
    const x1 = x0 - i1 + G3
    const y1 = y0 - j1 + G3
    const z1 = z0 - k1 + G3
    const x2 = x0 - i2 + 2 * G3
    const y2 = y0 - j2 + 2 * G3
    const z2 = z0 - k2 + 2 * G3
    const x3 = x0 - 1 + 3 * G3
    const y3 = y0 - 1 + 3 * G3
    const z3 = z0 - 1 + 3 * G3
    const ii = i & 255
    const jj = j & 255
    const kk = k & 255
    let n = 0
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0
    if (t0 > 0) {
      const g = permMod12[ii + perm[jj + perm[kk]]] * 3
      t0 *= t0
      n += t0 * t0 * (GRAD3[g] * x0 + GRAD3[g + 1] * y0 + GRAD3[g + 2] * z0)
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1
    if (t1 > 0) {
      const g = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3
      t1 *= t1
      n += t1 * t1 * (GRAD3[g] * x1 + GRAD3[g + 1] * y1 + GRAD3[g + 2] * z1)
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2
    if (t2 > 0) {
      const g = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3
      t2 *= t2
      n += t2 * t2 * (GRAD3[g] * x2 + GRAD3[g + 1] * y2 + GRAD3[g + 2] * z2)
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3
    if (t3 > 0) {
      const g = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3
      t3 *= t3
      n += t3 * t3 * (GRAD3[g] * x3 + GRAD3[g + 1] * y3 + GRAD3[g + 2] * z3)
    }
    return 32 * n
  }

  return { noise2, noise3 }
}
