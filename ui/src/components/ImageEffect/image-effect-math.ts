/**
 * The arithmetic behind `<moul-image-effect>`, apart from any canvas, so it
 * can be tested and reasoned about on its own.
 */

export const IMAGE_EFFECTS = [
  'pixelate',
  'dither',
  'ascii',
  'chromatic',
  'wave',
  'particles',
] as const

export type ImageEffectName = (typeof IMAGE_EFFECTS)[number]

/** A known effect name, or `pixelate` for anything else. */
export function normalizeEffect(value: unknown): ImageEffectName {
  return IMAGE_EFFECTS.includes(value as ImageEffectName)
    ? (value as ImageEffectName)
    : 'pixelate'
}

/** `intensity` held between 0 and 1; anything unreadable is 0.5. */
export function clampIntensity(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5
}

/**
 * The one size each effect's intensity sets, in CSS pixels. Higher always
 * means further from the photograph:
 *
 * - pixelate: block size, 4 to 32
 * - dither: dot size, 1 to 5
 * - ascii: character height, 6 to 18
 * - chromatic: how far the colour channels split, 2 to 16
 * - wave: wave height, 2 to 20
 * - particles: space between dots, 3 to 10
 */
export function effectScale(
  effect: ImageEffectName,
  intensity: number,
): number {
  const t = clampIntensity(intensity)
  switch (effect) {
    case 'pixelate':
      return 4 + t * 28
    case 'dither':
      return 1 + t * 4
    case 'ascii':
      return 6 + t * 12
    case 'chromatic':
      return 2 + t * 14
    case 'wave':
      return 2 + t * 18
    case 'particles':
      return 3 + t * 7
  }
}

/** The 8×8 Bayer matrix, as thresholds between 0 and 1 for ordered dithering. */
export const BAYER_8: Float32Array = (() => {
  const base = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36,
    14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41,
    51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55,
    23, 61, 29, 53, 21,
  ]
  return Float32Array.from(base, (value) => (value + 0.5) / 64)
})()

/** The ordered-dither threshold for the cell at column `x`, row `y`. */
export function bayerThreshold(x: number, y: number): number {
  return BAYER_8[((y & 7) << 3) | (x & 7)]
}

/** Characters from empty to dense: more ink, darker on light paper. */
export const ASCII_RAMP = ' .,:;-=+*#%@'

/** The ramp index for an ink coverage between 0 and 1. */
export function glyphIndex(
  coverage: number,
  levels = ASCII_RAMP.length,
): number {
  const c = Math.min(1, Math.max(0, coverage))
  return Math.min(levels - 1, Math.round(c * (levels - 1)))
}

/**
 * How much ink a cell of the given luminance (0 dark to 1 light) takes. On
 * light paper ink is dark, so dark parts take the most; on dark paper (the
 * dark theme) the ink is the light colour, and light parts take the most.
 * Either way the picture reads the right way round.
 */
export function inkCoverage(lum: number, inkIsLight: boolean): number {
  return inkIsLight ? lum : 1 - lum
}

/**
 * Stretches luminance values in place to span 0 to 1, so a flat photograph
 * still uses the whole range of dots or characters.
 */
export function stretchLevels(values: Float32Array): Float32Array {
  let min = 1
  let max = 0
  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    if (v < min) min = v
    if (v > max) max = v
  }
  const range = max - min
  if (range < 1e-3) return values
  for (let i = 0; i < values.length; i++) {
    values[i] = (values[i] - min) / range
  }
  return values
}

/** 1 at the centre of a spotlight, easing along a cosine to 0 at `radius`. */
export function spotlight(distance: number, radius: number): number {
  if (!(radius > 0) || distance >= radius) return 0
  return 0.5 + 0.5 * Math.cos((Math.PI * Math.max(0, distance)) / radius)
}

/**
 * How far the row at `y` is pushed sideways at `time` (milliseconds) by a
 * wave of the given height and length, travelling down at `speed` pixels
 * per second.
 */
export function waveOffset(
  y: number,
  time: number,
  amplitude: number,
  wavelength: number,
  speed: number,
): number {
  if (!(wavelength > 0)) return 0
  return (
    amplitude *
    Math.sin(((y - (speed * time) / 1000) / wavelength) * Math.PI * 2)
  )
}

const LITTLE_ENDIAN = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1

/**
 * A colour (0 to 1 channels) packed as one pixel of a `Uint32Array` view of
 * `ImageData`, in the platform's byte order.
 */
export function packRgba(r: number, g: number, b: number, a: number): number {
  const R = Math.round(Math.min(1, Math.max(0, r)) * 255)
  const G = Math.round(Math.min(1, Math.max(0, g)) * 255)
  const B = Math.round(Math.min(1, Math.max(0, b)) * 255)
  const A = Math.round(Math.min(1, Math.max(0, a)) * 255)
  return LITTLE_ENDIAN
    ? ((A << 24) | (B << 16) | (G << 8) | R) >>> 0
    : ((R << 24) | (G << 16) | (B << 8) | A) >>> 0
}
