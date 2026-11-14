/**
 * The maths of a press burst, kept apart from the element so it can be
 * tested without a canvas.
 */

export type PressParticleShape = 'circle' | 'square' | 'star' | 'glyph'

export interface PressParticle {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  spin: number
  size: number
  age: number
  life: number
  /** Index into the resolved colours. */
  color: number
  /** Index into the glyphs, for the `glyph` shape. */
  glyph: number
  alive: boolean
}

export interface BurstSettings {
  count: number
  /** Direction of the throw in degrees: 90 is straight up, 0 to the right. */
  angle: number
  /** Width of the cone around `angle`, in degrees. */
  spread: number
  /** Launch speed in CSS pixels per second. */
  velocity: number
  /** Particle size in CSS pixels. */
  size: number
  colorCount: number
  glyphCount: number
}

/** Air resistance per second: a particle slows quickly, then falls. */
export const PRESS_DRAG = 1.6
/** Seconds a particle fades out over at the end of its life. */
export const PRESS_FADE = 0.35
/** Seconds a particle takes to grow to full size, so it pops out of the press. */
export const PRESS_GROW = 0.08
/** Particles alive at once, across every burst of one element. */
export const MAX_PRESS_PARTICLES = 400

/** A fresh, dead particle for the pool. */
export function emptyParticle(): PressParticle {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    spin: 0,
    size: 0,
    age: 0,
    life: 0,
    color: 0,
    glyph: 0,
    alive: false,
  }
}

/**
 * Sets `particle` off from (`x`, `y`): a random direction inside the cone, a
 * random share of the speed, a spin, a size and a life.
 */
export function launchParticle(
  particle: PressParticle,
  x: number,
  y: number,
  settings: BurstSettings,
  random: () => number,
  index: number,
): void {
  const direction =
    ((settings.angle + (random() - 0.5) * settings.spread) * Math.PI) / 180
  const speed = settings.velocity * (0.45 + random() * 0.55)
  particle.x = x
  particle.y = y
  particle.vx = Math.cos(direction) * speed
  particle.vy = -Math.sin(direction) * speed
  particle.rotation = random() * Math.PI * 2
  particle.spin = (random() - 0.5) * 10
  particle.size = settings.size * (0.6 + random() * 0.7)
  particle.age = 0
  particle.life = 0.9 + random() * 0.6
  particle.color = settings.colorCount > 0 ? index % settings.colorCount : 0
  particle.glyph =
    settings.glyphCount > 0 ? Math.floor(random() * settings.glyphCount) : 0
  particle.alive = true
}

/**
 * Moves a particle on by `dt` seconds under drag and `gravity` (CSS pixels
 * per second squared). Returns false once it has run its life or fallen
 * past `floor`.
 */
export function stepParticle(
  particle: PressParticle,
  dt: number,
  gravity: number,
  floor: number,
): boolean {
  const damping = Math.exp(-PRESS_DRAG * dt)
  particle.age += dt
  particle.vx *= damping
  particle.vy = particle.vy * damping + gravity * dt
  particle.x += particle.vx * dt
  particle.y += particle.vy * dt
  particle.rotation += particle.spin * dt
  return particle.age < particle.life && particle.y < floor + particle.size * 2
}

/** Opacity from 0 to 1: full until the last `PRESS_FADE` seconds, then fading. */
export function particleAlpha(particle: PressParticle): number {
  const remaining = particle.life - particle.age
  return remaining >= PRESS_FADE ? 1 : Math.max(0, remaining / PRESS_FADE)
}

/** Size multiplier from 0 to 1 as the particle pops out of the press. */
export function particleGrowth(particle: PressParticle): number {
  return Math.min(1, particle.age / PRESS_GROW)
}

/**
 * Splits a `glyphs` attribute into glyphs: by whitespace when it has any,
 * otherwise into user-perceived characters, so `🎉✨` and `🎉 ✨` both give
 * two glyphs and a flag or a family emoji stays whole.
 */
export function splitGlyphs(value: string): string[] {
  const trimmed = value.trim()
  if (!trimmed) return []
  if (/\s/.test(trimmed)) return trimmed.split(/\s+/)
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    })
    return [...segmenter.segment(trimmed)].map((part) => part.segment)
  }
  return [...trimmed]
}

/**
 * Splits a list of CSS colours on its top-level commas, so
 * `rgb(1, 2, 3), var(--color-accent)` is two colours. A JSON array works too.
 */
export function splitColorList(value: string | null | undefined): string[] {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return []
  if (trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      }
    } catch {
      // Not JSON: read it as a comma-separated list.
    }
  }
  const colors: string[] = []
  let depth = 0
  let current = ''
  for (const char of trimmed) {
    if (char === '(') depth += 1
    else if (char === ')') depth = Math.max(0, depth - 1)
    if (char === ',' && depth === 0) {
      if (current.trim()) colors.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) colors.push(current.trim())
  return colors
}
