import { html, LitElement, type PropertyValues } from 'lit'
import {
  CanvasColorController,
  withAlpha,
} from '../../controllers/canvas-color.controller'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import { CanvasPointerController } from '../../controllers/canvas-pointer.controller'
import { defineElement } from '../../utils/define-element'
import { createNoise, createRandom, type Noise } from '../../utils/noise'
import { particlesStyles } from './Particles.styles'

export type ParticlesVariant = 'particles' | 'sparkles' | 'links'
export type ParticlesPointer = 'repel' | 'attract' | 'none'

const VARIANTS: readonly ParticlesVariant[] = ['particles', 'sparkles', 'links']
const POINTERS: readonly ParticlesPointer[] = ['repel', 'attract', 'none']

/** Particles per 10,000 px² when `density` is not set. */
const DEFAULT_DENSITY: Record<ParticlesVariant, number> = {
  particles: 3,
  sparkles: 5,
  links: 1.6,
}

/** The most particles a field draws, however large it is. */
export const MAX_PARTICLES: Record<ParticlesVariant, number> = {
  particles: 360,
  sparkles: 260,
  links: 160,
}

/** Size in CSS pixels when `size` is not set: a dot's radius, or a glint's half length. */
const DEFAULT_SIZE: Record<ParticlesVariant, number> = {
  particles: 2.2,
  sparkles: 7,
  links: 2,
}

/** Drift speed in CSS pixels per second at `speed="1"`. */
const DRIFT: Record<ParticlesVariant, number> = {
  particles: 12,
  sparkles: 5,
  links: 16,
}

/** How far the pointer reaches, in CSS pixels. */
export const POINTER_RADIUS = 120
/** Speed the pointer adds at its centre, in CSS pixels per second per second. */
const POINTER_STRENGTH = 1400
/** Particles closer than this are joined by a line in `links`. */
export const LINK_DISTANCE = 110
/** How quickly a push from the pointer dies away, per second. */
const DAMPING = 3.2
/** Three line strengths, so all of a field's lines take three strokes. */
const LINK_BUCKETS = 3
/** Sprite resolution in device pixels. */
const SPRITE_SIZE = 64

interface Particle {
  x: number
  y: number
  /** Velocity added by the pointer, px/s; it decays back to 0. */
  pushX: number
  pushY: number
  /** 0.35 (far, small, slow, faint) to 1 (near). */
  depth: number
  /** Direction of the drift, in radians, before the noise bends it. */
  heading: number
  /** Sparkles: milliseconds into this glint's life, and its length. */
  age: number
  life: number
  /** Sparkles: a glint is drawn upright or turned 45°. */
  turned: boolean
}

/** How many particles a `width` × `height` field holds at `density` per 10,000 px². */
export function particleCount(
  width: number,
  height: number,
  density: number,
  max: number,
): number {
  if (!(width > 0) || !(height > 0) || !(density > 0)) return 0
  return Math.min(max, Math.round(((width * height) / 10000) * density))
}

/**
 * The push the pointer gives a particle `distance` pixels away, from 0 at
 * the edge of its reach to 1 at its centre. Positive pushes away, negative
 * pulls in. `attract` pulls from afar but pushes back within a fifth of the
 * radius, so particles gather in a ring around the pointer rather than in a
 * single spot.
 */
export function pointerPush(
  distance: number,
  radius: number,
  mode: ParticlesPointer,
): number {
  if (mode === 'none' || distance >= radius || radius <= 0) return 0
  const reach = 1 - distance / radius
  const strength = reach * reach
  if (mode === 'repel') return strength
  return distance < radius * 0.2 ? strength * 0.6 : -strength * 0.7
}

/** The particles of a field, laid out from `seed`, so a still frame is the same every time. */
export function seedParticles(
  count: number,
  width: number,
  height: number,
  seed: number,
): Particle[] {
  const random = createRandom(seed)
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    particles.push(spawn(random, width, height, true))
  }
  return particles
}

function spawn(
  random: () => number,
  width: number,
  height: number,
  isFirst: boolean,
): Particle {
  const life = 1400 + random() * 2200
  return {
    x: random() * width,
    y: random() * height,
    pushX: 0,
    pushY: 0,
    depth: 0.35 + random() * 0.65,
    heading: random() * Math.PI * 2,
    // The first glints start part-way through their lives, so they do not all flash together.
    age: isFirst ? random() * life : 0,
    life,
    turned: random() < 0.35,
  }
}

const parseNumber = (value: unknown, fallback: number): number => {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) && number >= 0 ? number : fallback
}

/**
 * A field of particles behind a hero or a section, drawn on a canvas. With
 * `variant="particles"` (the default) soft dots of three depths drift on a
 * slow current; `sparkles` makes them four-point glints that fade in, shine
 * and fade out, like light caught on dust; `links` joins dots that come
 * close with faint lines, a constellation that redraws itself as it drifts.
 * The pointer pushes particles away (`pointer="repel"`, the default), draws
 * them in (`attract`) or leaves them be (`none`); in `links` it is joined to
 * the dots near it too. `density` sets how many there are per 10,000 px²,
 * `size` how big, `speed` how fast, and `color` their colour. Wrap content
 * in it, or leave it empty and use it as a background layer.
 *
 * Keyboard and screen readers: the element is never focusable and adds no
 * role. The canvas is decoration, hidden from screen readers and from the
 * pointer, so wrapped content is read, focused and clicked as it is.
 *
 * Reduced motion: the field is drawn once, from a fixed seed, and does not
 * move; the pointer no longer pushes it.
 *
 * @slot - Content shown over the field. Leave it empty to use the element as a background layer.
 * @csspart canvas - The canvas the particles are drawn on.
 */
export class MoulParticles extends LitElement {
  static override styles = particlesStyles

  static override properties = {
    variant: { type: String, reflect: true },
    density: { type: Number },
    size: { type: Number },
    speed: { type: Number },
    color: { type: String },
    pointer: { type: String },
    seed: { type: Number },
  }

  /** `particles` (soft dots), `sparkles` (twinkling glints) or `links` (dots joined by lines). Defaults to `particles`. */
  declare variant: ParticlesVariant
  /** Particles per 10,000 px². Defaults to 3 for particles, 5 for sparkles and 1.6 for links; capped at 360, 260 and 160 in all. */
  declare density: number | undefined
  /** A dot's radius, or a glint's half length, in CSS pixels. Defaults to 2.2 (particles), 7 (sparkles) and 2 (links). */
  declare size: number | undefined
  /** Multiplies the drift and the twinkle. Defaults to 1; 0 holds the field still. */
  declare speed: number
  /** Colour of the particles and lines, any CSS colour or token. Defaults to the accent colour. */
  declare color: string
  /** What the pointer does: `repel` (default), `attract` or `none`. */
  declare pointer: ParticlesPointer
  /** Seed for the layout; change it to give two fields on one page different patterns. Defaults to 1. */
  declare seed: number

  private particles: Particle[] = []
  private random: () => number = createRandom(1)
  private noise: Noise = createNoise(1)
  private fieldWidth = 0
  private fieldHeight = 0
  private sprite: HTMLCanvasElement | null = null
  private spriteKey = ''
  private pairs = new Uint16Array(0)
  private pairBuckets = new Uint8Array(0)

  private readonly palette = new CanvasColorController(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => ({ main: this.color || 'var(--color-accent)' }),
    onChange: () => {
      this.spriteKey = ''
      this.loop.drawOnce()
    },
  })

  private readonly pointerState = new CanvasPointerController(this)

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot.querySelector('canvas'),
    resize: ({ width, height }) => this.layout(width, height),
    draw: (frame) => this.paint(frame),
  })

  constructor() {
    super()
    this.variant = 'particles'
    this.density = undefined
    this.size = undefined
    this.speed = 1
    this.color = ''
    this.pointer = 'repel'
    this.seed = 1
  }

  /** The number of particles drawn right now. */
  public get particleTotal(): number {
    return this.particles.length
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('variant') && !VARIANTS.includes(this.variant)) {
      this.variant = 'particles'
    }
    if (changed.has('pointer') && !POINTERS.includes(this.pointer)) {
      this.pointer = 'repel'
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('color')) this.palette.refresh()
    if (changed.has('variant')) this.spriteKey = ''
    if (
      (changed.has('variant') ||
        changed.has('density') ||
        changed.has('seed')) &&
      this.hasUpdated
    ) {
      this.particles = []
      this.layout(this.fieldWidth, this.fieldHeight)
      this.loop.drawOnce()
    } else if (changed.has('size') || changed.has('speed')) {
      this.loop.drawOnce()
    }
  }

  private get resolvedDensity(): number {
    return parseNumber(this.density, DEFAULT_DENSITY[this.variant])
  }

  private get resolvedSize(): number {
    return Math.max(0.5, parseNumber(this.size, DEFAULT_SIZE[this.variant]))
  }

  /** Matches the particles to the field's size: rescales the ones there are, then adds or drops to the new count. */
  private layout(width: number, height: number): void {
    const count = particleCount(
      width,
      height,
      this.resolvedDensity,
      MAX_PARTICLES[this.variant],
    )
    if (this.particles.length === 0) {
      const seed = Math.round(parseNumber(this.seed, 1))
      this.random = createRandom(seed * 7919 + 1)
      this.noise = createNoise(seed)
      this.particles = seedParticles(count, width, height, seed)
    } else {
      const sx = this.fieldWidth > 0 ? width / this.fieldWidth : 1
      const sy = this.fieldHeight > 0 ? height / this.fieldHeight : 1
      for (const particle of this.particles) {
        particle.x *= sx
        particle.y *= sy
      }
      while (this.particles.length < count) {
        this.particles.push(spawn(this.random, width, height, true))
      }
      if (this.particles.length > count) this.particles.length = count
    }
    this.fieldWidth = width
    this.fieldHeight = height
    if (this.variant === 'links') {
      const maxPairs = (count * (count - 1)) / 2
      if (this.pairBuckets.length < maxPairs) {
        this.pairs = new Uint16Array(maxPairs * 2)
        this.pairBuckets = new Uint8Array(maxPairs)
      }
    }
  }

  /** Renders the dot or glint once per colour and pixel ratio; frames stamp it. */
  private ensureSprite(pixelRatio: number): HTMLCanvasElement | null {
    const color = this.palette.get('main')
    const key = `${this.variant}|${color}|${pixelRatio}`
    if (this.sprite && this.spriteKey === key) return this.sprite
    if (typeof document === 'undefined') return null
    const sprite = this.sprite ?? document.createElement('canvas')
    sprite.width = SPRITE_SIZE
    sprite.height = SPRITE_SIZE
    const context = sprite.getContext('2d')
    if (!context) return null
    const c = SPRITE_SIZE / 2
    context.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
    if (this.variant === 'sparkles') {
      // A soft halo, then a four-point star whose arms thin to nothing.
      const halo = context.createRadialGradient(c, c, 0, c, c, c * 0.5)
      halo.addColorStop(0, withAlpha(color, 0.55))
      halo.addColorStop(1, withAlpha(color, 0))
      context.fillStyle = halo
      context.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
      const arm = context.createRadialGradient(c, c, 0, c, c, c)
      arm.addColorStop(0, withAlpha(color, 1))
      arm.addColorStop(0.45, withAlpha(color, 0.75))
      arm.addColorStop(1, withAlpha(color, 0))
      context.fillStyle = arm
      const w = c * 0.12
      context.beginPath()
      context.moveTo(c, 0)
      context.quadraticCurveTo(c + w, c - w, SPRITE_SIZE, c)
      context.quadraticCurveTo(c + w, c + w, c, SPRITE_SIZE)
      context.quadraticCurveTo(c - w, c + w, 0, c)
      context.quadraticCurveTo(c - w, c - w, c, 0)
      context.fill()
    } else {
      // A solid core inside a faint glow, so small dots stay crisp.
      const glow = context.createRadialGradient(c, c, 0, c, c, c)
      glow.addColorStop(0, withAlpha(color, 1))
      glow.addColorStop(0.32, withAlpha(color, 0.95))
      glow.addColorStop(0.42, withAlpha(color, 0.28))
      glow.addColorStop(1, withAlpha(color, 0))
      context.fillStyle = glow
      context.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
    }
    this.sprite = sprite
    this.spriteKey = key
    return sprite
  }

  private step(delta: number, time: number): void {
    const seconds = delta / 1000
    if (seconds <= 0) return
    const speed = parseNumber(this.speed, 1)
    const drift = DRIFT[this.variant] * speed
    const width = this.fieldWidth
    const height = this.fieldHeight
    const margin = 24
    const pointer = this.pointerState.state
    const mode = this.pointer
    const reach = POINTER_RADIUS
    const pushing =
      mode !== 'none' && pointer.hasPointer && pointer.isInside && reach > 0
    const damping = Math.exp(-DAMPING * seconds)
    const isSparkles = this.variant === 'sparkles'
    const flow = time * 0.00004 * speed
    for (const particle of this.particles) {
      const bend =
        this.noise.noise3(particle.x * 0.0018, particle.y * 0.0018, flow) * 1.6
      const heading = particle.heading + bend
      let vx = Math.cos(heading) * drift * particle.depth
      // Glints rise a little, like dust in warm air.
      let vy =
        Math.sin(heading) * drift * particle.depth -
        (isSparkles ? drift * 0.6 : 0)
      if (pushing) {
        const dx = particle.x - pointer.x
        const dy = particle.y - pointer.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance > 0.001 && distance < reach) {
          const push = pointerPush(distance, reach, mode) * POINTER_STRENGTH
          particle.pushX += (dx / distance) * push * seconds
          particle.pushY += (dy / distance) * push * seconds
        }
      }
      particle.pushX *= damping
      particle.pushY *= damping
      vx += particle.pushX
      vy += particle.pushY
      particle.x += vx * seconds
      particle.y += vy * seconds
      if (particle.x < -margin) particle.x += width + margin * 2
      else if (particle.x > width + margin) particle.x -= width + margin * 2
      if (particle.y < -margin) particle.y += height + margin * 2
      else if (particle.y > height + margin) particle.y -= height + margin * 2

      if (isSparkles) {
        particle.age += delta * Math.max(speed, 0.05)
        if (particle.age >= particle.life) {
          particle.age = 0
          particle.life = 1400 + this.random() * 2200
          particle.x = this.random() * width
          particle.y = this.random() * height
          particle.turned = this.random() < 0.35
        }
      }
    }
  }

  private paint({
    context,
    width,
    height,
    pixelRatio,
    delta,
    time,
  }: CanvasFrame): void {
    if (!context) return
    context.clearRect(0, 0, width, height)
    if (this.particles.length === 0) return
    this.step(delta, time)
    const sprite = this.ensureSprite(pixelRatio)
    if (!sprite) return
    if (this.variant === 'links') this.paintLinks(context)
    const size = this.resolvedSize
    const isSparkles = this.variant === 'sparkles'
    for (const particle of this.particles) {
      let alpha: number
      let extent: number
      if (isSparkles) {
        const life = Math.sin((Math.PI * particle.age) / particle.life)
        const shine = life * life
        alpha = shine * (0.55 + 0.45 * particle.depth)
        extent = size * (0.45 + 0.55 * shine) * (0.6 + 0.4 * particle.depth)
      } else {
        alpha = 0.3 + 0.7 * particle.depth
        // The sprite's core is a third of it, so draw it three radii wide.
        extent = size * (0.55 + 0.45 * particle.depth) * 3
      }
      if (alpha < 0.02) continue
      context.globalAlpha = alpha
      if (isSparkles && particle.turned) {
        // A glint turned 45°: rotate around its centre, then restore the field's scale.
        const cos = Math.SQRT1_2 * pixelRatio
        context.setTransform(
          cos,
          cos,
          -cos,
          cos,
          particle.x * pixelRatio,
          particle.y * pixelRatio,
        )
        context.drawImage(sprite, -extent, -extent, extent * 2, extent * 2)
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      } else {
        context.drawImage(
          sprite,
          particle.x - extent,
          particle.y - extent,
          extent * 2,
          extent * 2,
        )
      }
    }
    context.globalAlpha = 1
  }

  /** Lines between near particles, sorted into three strengths so they take three strokes. */
  private paintLinks(context: CanvasRenderingContext2D): void {
    const particles = this.particles
    const count = particles.length
    const limit = LINK_DISTANCE * LINK_DISTANCE
    const pairs = this.pairs
    const buckets = this.pairBuckets
    let total = 0
    for (let i = 0; i < count; i++) {
      const a = particles[i]
      for (let j = i + 1; j < count; j++) {
        const b = particles[j]
        const dx = a.x - b.x
        if (dx > LINK_DISTANCE || dx < -LINK_DISTANCE) continue
        const dy = a.y - b.y
        const squared = dx * dx + dy * dy
        if (squared >= limit) continue
        const closeness = 1 - Math.sqrt(squared) / LINK_DISTANCE
        pairs[total * 2] = i
        pairs[total * 2 + 1] = j
        buckets[total] = Math.min(
          LINK_BUCKETS - 1,
          Math.floor(closeness * LINK_BUCKETS),
        )
        total++
      }
    }
    context.strokeStyle = this.palette.get('main')
    context.lineWidth = 1
    for (let bucket = 0; bucket < LINK_BUCKETS; bucket++) {
      context.beginPath()
      let drawn = 0
      for (let k = 0; k < total; k++) {
        if (buckets[k] !== bucket) continue
        const a = particles[pairs[k * 2]]
        const b = particles[pairs[k * 2 + 1]]
        context.moveTo(a.x, a.y)
        context.lineTo(b.x, b.y)
        drawn++
      }
      if (drawn === 0) continue
      context.globalAlpha = 0.1 + (0.4 * (bucket + 1)) / LINK_BUCKETS
      context.stroke()
    }

    // The pointer joins the constellation while it is over the field.
    const pointer = this.pointerState.state
    if (
      this.pointer !== 'none' &&
      pointer.hasPointer &&
      pointer.isInside &&
      this.loop.isRunning
    ) {
      const reach = LINK_DISTANCE * 1.4
      for (let bucket = 0; bucket < LINK_BUCKETS; bucket++) {
        context.beginPath()
        let drawn = 0
        for (const particle of particles) {
          const dx = particle.x - pointer.x
          const dy = particle.y - pointer.y
          const squared = dx * dx + dy * dy
          if (squared >= reach * reach) continue
          const closeness = 1 - Math.sqrt(squared) / reach
          if (
            Math.min(LINK_BUCKETS - 1, Math.floor(closeness * LINK_BUCKETS)) !==
            bucket
          ) {
            continue
          }
          context.moveTo(pointer.x, pointer.y)
          context.lineTo(particle.x, particle.y)
          drawn++
        }
        if (drawn === 0) continue
        context.globalAlpha = 0.12 + (0.4 * (bucket + 1)) / LINK_BUCKETS
        context.stroke()
      }
    }
    context.globalAlpha = 1
  }

  protected override render() {
    return html`
      <canvas part="canvas" aria-hidden="true"></canvas>
      <span class="color-probe"></span>
      <div class="content"><slot></slot></div>
    `
  }
}

defineElement('moul-particles', MoulParticles)

declare global {
  interface HTMLElementTagNameMap {
    'moul-particles': MoulParticles
  }
}
