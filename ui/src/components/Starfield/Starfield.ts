import { html, LitElement, type PropertyValues } from 'lit'
import {
  CanvasColorController,
  withAlpha,
} from '../../controllers/canvas-color.controller'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import { defineElement } from '../../utils/define-element'
import { createRandom } from '../../utils/noise'
import { starfieldStyles } from './Starfield.styles'

/** Shooting stars a minute when `shooting-stars` is written without a value. */
export const DEFAULT_SHOOTING_STARS = 6
/** Meteors at once when `meteors` is written without a value. */
export const DEFAULT_METEORS = 10
/** The most meteors a field draws at once. */
export const MAX_METEORS = 40
/** The most stars a field draws, however large it is. */
export const MAX_STARS = 700
/** Stars per 10,000 px² when `density` is not set. */
const DEFAULT_DENSITY = 3.5
/** Shooting stars in flight at once, at most. */
const MAX_SHOOTING = 3

/** Sprite resolution in device pixels: a round star, and a streak with a bright head. */
const DOT_SIZE = 32
const STREAK_WIDTH = 256
const STREAK_HEIGHT = 16

/** The three layers of stars: how many of them, how big, how bright and how fast they drift. */
const LAYERS = [
  { share: 0.62, radius: [0.35, 0.75], alpha: [0.3, 0.55], drift: 1.2 },
  { share: 0.28, radius: [0.7, 1.15], alpha: [0.5, 0.8], drift: 2.4 },
  { share: 0.1, radius: [1.1, 1.7], alpha: [0.8, 1], drift: 4 },
] as const

interface Star {
  x: number
  y: number
  radius: number
  alpha: number
  /** Index into LAYERS. */
  layer: number
  phase: number
  /** Twinkle rate in radians per second. */
  rate: number
}

interface Streak {
  /** Head position, CSS pixels. */
  x: number
  y: number
  /** Unit direction of travel, in screen coordinates (y down). */
  dx: number
  dy: number
  /** Pixels per second. */
  speed: number
  length: number
  alpha: number
  /** Shooting stars only: milliseconds lived, and the life they get. */
  age: number
  life: number
}

/**
 * `shooting-stars` and `meteors` both turn on when written alone; a value
 * sets how many. A missing, negative or unreadable value turns them off.
 */
function streakConverter(fallback: number) {
  return {
    fromAttribute(value: string | null): number {
      if (value === null) return 0
      if (value.trim() === '') return fallback
      const number = Number(value)
      return Number.isFinite(number) && number > 0 ? number : 0
    },
    toAttribute(value: number): string | null {
      return value > 0 ? String(value) : null
    },
  }
}

export const shootingStarsConverter = streakConverter(DEFAULT_SHOOTING_STARS)
export const meteorsConverter = streakConverter(DEFAULT_METEORS)

/** How many stars a `width` × `height` field holds at `density` per 10,000 px². */
export function starCount(
  width: number,
  height: number,
  density: number,
): number {
  if (!(width > 0) || !(height > 0) || !(density > 0)) return 0
  return Math.min(MAX_STARS, Math.round(((width * height) / 10000) * density))
}

/**
 * The direction meteors fall for `angle` in degrees, measured as in
 * mathematics: 0 is to the right and 90 is up, so 270 is straight down and
 * 240 is down and to the left. Returned in screen coordinates, y down.
 */
export function meteorDirection(angle: number): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180
  return { x: Math.cos(radians), y: -Math.sin(radians) }
}

/** The stars of a field, laid out from `seed`, so a still frame is the same every time. */
export function seedStars(
  count: number,
  width: number,
  height: number,
  seed: number,
): Star[] {
  const random = createRandom(seed)
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    const pick = random()
    const layer = pick < LAYERS[0].share ? 0 : pick < 0.9 ? 1 : 2
    const spec = LAYERS[layer]
    stars.push({
      x: random() * width,
      y: random() * height,
      radius: spec.radius[0] + random() * (spec.radius[1] - spec.radius[0]),
      alpha: spec.alpha[0] + random() * (spec.alpha[1] - spec.alpha[0]),
      layer,
      phase: random() * Math.PI * 2,
      rate: 0.6 + random() * 1.8,
    })
  }
  return stars
}

const parseNumber = (value: unknown, fallback: number): number => {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) && number >= 0 ? number : fallback
}

/**
 * A night sky drawn on a canvas: stars in three layers of depth that drift
 * slowly and twinkle, the nearest with a soft glow. `shooting-stars` adds an
 * occasional streak across the sky in a random direction (the attribute
 * alone means about six a minute; a number sets how many), and `meteors`
 * rains thin streaks with fading tails, all falling at `angle` (the
 * attribute alone means ten at once). `density` sets how many stars there
 * are per 10,000 px², `twinkle` how much they flicker and `speed` how fast
 * everything moves. Stars take `color`, the foreground colour by default,
 * so put the element on a dark surface for a night sky, or give a section
 * `color-scheme: dark` to keep it dark in both themes.
 *
 * Keyboard and screen readers: the element is never focusable and adds no
 * role. The canvas is decoration, hidden from screen readers and from the
 * pointer, so wrapped content is read, focused and clicked as it is.
 *
 * Reduced motion: the sky is drawn once from a fixed seed and holds still:
 * the stars do not twinkle or drift, meteors stay where they are as fixed
 * streaks, and no shooting stars cross.
 *
 * @slot - Content shown over the sky. Leave it empty to use the element as a background layer.
 * @csspart canvas - The canvas the sky is drawn on.
 */
export class MoulStarfield extends LitElement {
  static override styles = starfieldStyles

  static override properties = {
    density: { type: Number },
    twinkle: { type: Number },
    speed: { type: Number },
    shootingStars: {
      attribute: 'shooting-stars',
      converter: shootingStarsConverter,
    },
    meteors: { converter: meteorsConverter },
    angle: { type: Number },
    color: { type: String },
    seed: { type: Number },
  }

  /** Stars per 10,000 px². Defaults to 3.5; at most 700 stars in all. */
  declare density: number
  /** How much the stars flicker, from 0 (steady) to 1. Defaults to 0.5. */
  declare twinkle: number
  /** Multiplies the drift, the twinkle and the streaks. Defaults to 1. */
  declare speed: number
  /** Shooting stars a minute, on average; 0 (default) for none, and the attribute alone means 6. */
  declare shootingStars: number
  /** Meteors falling at once; 0 (default) for none, and the attribute alone means 10. At most 40. */
  declare meteors: number
  /** Direction the meteors fall, in degrees: 270 is straight down, 240 (default) down and to the left, 300 down and to the right. */
  declare angle: number
  /** Colour of the stars and streaks, any CSS colour or token. Defaults to the foreground colour. */
  declare color: string
  /** Seed for the layout; change it to give two skies on one page different stars. Defaults to 1. */
  declare seed: number

  private stars: Star[] = []
  private meteorList: Streak[] = []
  private shooting: Streak[] = []
  private random: () => number = createRandom(1)
  private fieldWidth = 0
  private fieldHeight = 0
  private dotSprite: HTMLCanvasElement | null = null
  private streakSprite: HTMLCanvasElement | null = null
  private spriteKey = ''

  private readonly palette = new CanvasColorController(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => ({ star: this.color || 'var(--color-foreground)' }),
    onChange: () => {
      this.spriteKey = ''
      this.loop.drawOnce()
    },
  })

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot.querySelector('canvas'),
    resize: ({ width, height }) => this.layout(width, height, false),
    draw: (frame) => this.paint(frame),
  })

  constructor() {
    super()
    this.density = DEFAULT_DENSITY
    this.twinkle = 0.5
    this.speed = 1
    this.shootingStars = 0
    this.meteors = 0
    this.angle = 240
    this.color = ''
    this.seed = 1
  }

  /** Stars, meteors and shooting stars drawn right now. */
  public get counts(): { stars: number; meteors: number; shooting: number } {
    return {
      stars: this.stars.length,
      meteors: this.meteorList.length,
      shooting: this.shooting.length,
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('color')) this.palette.refresh()
    const relayout =
      changed.has('density') || changed.has('seed') || changed.has('meteors')
    if (relayout || changed.has('angle')) {
      this.layout(this.fieldWidth, this.fieldHeight, true)
      this.loop.drawOnce()
    } else if (changed.has('twinkle') || changed.has('speed')) {
      this.loop.drawOnce()
    }
  }

  private get direction(): { x: number; y: number } {
    return meteorDirection(parseNumber(this.angle, 240))
  }

  private layout(width: number, height: number, isReset: boolean): void {
    const seed = Math.round(parseNumber(this.seed, 1))
    const count = starCount(
      width,
      height,
      parseNumber(this.density, DEFAULT_DENSITY),
    )
    if (isReset || this.stars.length === 0) {
      this.stars = seedStars(count, width, height, seed)
    } else {
      const sx = this.fieldWidth > 0 ? width / this.fieldWidth : 1
      const sy = this.fieldHeight > 0 ? height / this.fieldHeight : 1
      for (const star of this.stars) {
        star.x *= sx
        star.y *= sy
      }
      if (this.stars.length !== count) {
        this.stars = seedStars(count, width, height, seed)
      }
    }
    this.fieldWidth = width
    this.fieldHeight = height

    const meteors = Math.min(
      MAX_METEORS,
      Math.round(parseNumber(this.meteors, 0)),
    )
    if (isReset || this.meteorList.length !== meteors) {
      // Meteors start spread across the sky, so the first frame is already a shower.
      this.random = createRandom(seed * 7919 + 3)
      this.meteorList = []
      for (let i = 0; i < meteors; i++) {
        const meteor = this.newMeteor()
        meteor.x = this.random() * width
        meteor.y = this.random() * height
        this.meteorList.push(meteor)
      }
      this.shooting = []
    }
  }

  private newMeteor(): Streak {
    const { x: dx, y: dy } = this.direction
    const width = this.fieldWidth
    const height = this.fieldHeight
    const length = 60 + this.random() * 110
    // Enter from the edge the meteors come from, a little way upstream so they do not pop in.
    const along = this.random()
    const back = length + this.random() * height * 0.6
    let x: number
    let y: number
    if (this.random() < Math.abs(dy) / (Math.abs(dx) + Math.abs(dy))) {
      x = along * width * 1.2 - width * 0.1
      y = dy > 0 ? -back : height + back
    } else {
      x = dx > 0 ? -back : width + back
      y = along * height
    }
    return {
      x,
      y,
      dx,
      dy,
      speed: 240 + this.random() * 320,
      length,
      alpha: 0.45 + this.random() * 0.5,
      age: 0,
      life: 0,
    }
  }

  private newShootingStar(): Streak {
    const width = this.fieldWidth
    const height = this.fieldHeight
    // Mostly downward, to the left or the right.
    const toRight = this.random() < 0.5
    const degrees = toRight
      ? 300 + this.random() * 40
      : 200 + this.random() * 40
    const { x: dx, y: dy } = meteorDirection(degrees)
    return {
      x: width * (0.1 + this.random() * 0.8),
      y: height * this.random() * 0.45,
      dx,
      dy,
      speed: 650 + this.random() * 450,
      length: 90 + this.random() * 90,
      alpha: 0.85 + this.random() * 0.15,
      age: 0,
      life: 650 + this.random() * 500,
    }
  }

  private ensureSprites(pixelRatio: number): boolean {
    const color = this.palette.get('star')
    const key = `${color}|${pixelRatio}`
    if (this.dotSprite && this.streakSprite && this.spriteKey === key) {
      return true
    }
    if (typeof document === 'undefined') return false
    const dot = this.dotSprite ?? document.createElement('canvas')
    dot.width = DOT_SIZE
    dot.height = DOT_SIZE
    const dotContext = dot.getContext('2d')
    const streak = this.streakSprite ?? document.createElement('canvas')
    streak.width = STREAK_WIDTH
    streak.height = STREAK_HEIGHT
    const streakContext = streak.getContext('2d')
    if (!dotContext || !streakContext) return false

    const c = DOT_SIZE / 2
    dotContext.clearRect(0, 0, DOT_SIZE, DOT_SIZE)
    const glow = dotContext.createRadialGradient(c, c, 0, c, c, c)
    glow.addColorStop(0, withAlpha(color, 1))
    glow.addColorStop(0.25, withAlpha(color, 0.9))
    glow.addColorStop(0.4, withAlpha(color, 0.25))
    glow.addColorStop(1, withAlpha(color, 0))
    dotContext.fillStyle = glow
    dotContext.fillRect(0, 0, DOT_SIZE, DOT_SIZE)

    // A tail fading in from the left to a bright head on the right.
    const mid = STREAK_HEIGHT / 2
    streakContext.clearRect(0, 0, STREAK_WIDTH, STREAK_HEIGHT)
    const tail = streakContext.createLinearGradient(0, 0, STREAK_WIDTH, 0)
    tail.addColorStop(0, withAlpha(color, 0))
    tail.addColorStop(0.75, withAlpha(color, 0.45))
    tail.addColorStop(1, withAlpha(color, 1))
    streakContext.fillStyle = tail
    streakContext.beginPath()
    streakContext.moveTo(0, mid)
    streakContext.lineTo(STREAK_WIDTH - mid, mid - 1.5)
    streakContext.lineTo(STREAK_WIDTH - mid, mid + 1.5)
    streakContext.closePath()
    streakContext.fill()
    const head = streakContext.createRadialGradient(
      STREAK_WIDTH - mid,
      mid,
      0,
      STREAK_WIDTH - mid,
      mid,
      mid,
    )
    head.addColorStop(0, withAlpha(color, 1))
    head.addColorStop(0.3, withAlpha(color, 0.6))
    head.addColorStop(1, withAlpha(color, 0))
    streakContext.fillStyle = head
    streakContext.fillRect(
      STREAK_WIDTH - STREAK_HEIGHT,
      0,
      STREAK_HEIGHT,
      STREAK_HEIGHT,
    )

    this.dotSprite = dot
    this.streakSprite = streak
    this.spriteKey = key
    return true
  }

  private step(delta: number): void {
    const seconds = delta / 1000
    if (seconds <= 0) return
    const speed = parseNumber(this.speed, 1)
    const width = this.fieldWidth
    const height = this.fieldHeight
    for (const star of this.stars) {
      star.x -= LAYERS[star.layer].drift * speed * seconds
      if (star.x < -2) star.x += width + 4
    }
    for (let i = 0; i < this.meteorList.length; i++) {
      const meteor = this.meteorList[i]
      meteor.x += meteor.dx * meteor.speed * speed * seconds
      meteor.y += meteor.dy * meteor.speed * speed * seconds
      const tailX = meteor.x - meteor.dx * meteor.length
      const tailY = meteor.y - meteor.dy * meteor.length
      if (
        tailX < -20 ||
        tailX > width + 20 ||
        tailY < -20 ||
        tailY > height + 20
      ) {
        // Gone past the edge it falls toward: start again upstream.
        const goingOut =
          (meteor.dx > 0 && tailX > width) ||
          (meteor.dx < 0 && tailX < 0) ||
          (meteor.dy > 0 && tailY > height) ||
          (meteor.dy < 0 && tailY < 0)
        if (goingOut) this.meteorList[i] = this.newMeteor()
      }
    }

    const rate = parseNumber(this.shootingStars, 0)
    if (
      rate > 0 &&
      this.shooting.length < MAX_SHOOTING &&
      this.random() < (rate / 60) * seconds * Math.max(speed, 0.05)
    ) {
      this.shooting.push(this.newShootingStar())
    }
    for (let i = this.shooting.length - 1; i >= 0; i--) {
      const star = this.shooting[i]
      star.age += delta * Math.max(speed, 0.05)
      star.x += star.dx * star.speed * speed * seconds
      star.y += star.dy * star.speed * speed * seconds
      if (star.age >= star.life) this.shooting.splice(i, 1)
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
    if (!this.ensureSprites(pixelRatio)) return
    this.step(delta)
    const dot = this.dotSprite as HTMLCanvasElement
    const streak = this.streakSprite as HTMLCanvasElement
    const twinkle = Math.min(1, parseNumber(this.twinkle, 0.5))
    const clock = (time / 1000) * parseNumber(this.speed, 1)

    for (const star of this.stars) {
      const flicker =
        1 - twinkle * 0.5 * (1 + Math.sin(star.phase + clock * star.rate))
      const alpha = star.alpha * flicker
      if (alpha < 0.02) continue
      if (star.layer === 2) {
        // The nearest stars carry a faint halo.
        const halo = star.radius * 7
        context.globalAlpha = alpha * 0.22
        context.drawImage(dot, star.x - halo, star.y - halo, halo * 2, halo * 2)
      }
      // The sprite's core is a quarter of it, so draw it four radii wide.
      const extent = star.radius * 4
      context.globalAlpha = alpha
      context.drawImage(
        dot,
        star.x - extent,
        star.y - extent,
        extent * 2,
        extent * 2,
      )
    }

    for (const meteor of this.meteorList) {
      this.paintStreak(context, streak, meteor, meteor.alpha, 1.6, pixelRatio)
    }
    for (const star of this.shooting) {
      const progress = star.age / star.life
      // Flares in quickly, then fades out over the rest of its life.
      const envelope =
        progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85
      this.paintStreak(
        context,
        streak,
        star,
        star.alpha * envelope,
        2.4,
        pixelRatio,
      )
    }
    context.globalAlpha = 1
  }

  /** Stamps the streak sprite from the tail to the head, turned along the direction of travel. */
  private paintStreak(
    context: CanvasRenderingContext2D,
    sprite: HTMLCanvasElement,
    streak: Streak,
    alpha: number,
    thickness: number,
    pixelRatio: number,
  ): void {
    if (alpha < 0.02) return
    const cos = streak.dx * pixelRatio
    const sin = streak.dy * pixelRatio
    context.globalAlpha = alpha
    context.setTransform(
      cos,
      sin,
      -sin,
      cos,
      streak.x * pixelRatio,
      streak.y * pixelRatio,
    )
    const height = thickness * 4
    // The head sits half a sprite-height in from the sprite's right edge.
    const headInset = (height / STREAK_HEIGHT) * (STREAK_HEIGHT / 2)
    context.drawImage(
      sprite,
      -streak.length,
      -height / 2,
      streak.length + headInset,
      height,
    )
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  }

  protected override render() {
    return html`
      <canvas part="canvas" aria-hidden="true"></canvas>
      <span class="color-probe"></span>
      <div class="content"><slot></slot></div>
    `
  }
}

defineElement('moul-starfield', MoulStarfield)

declare global {
  interface HTMLElementTagNameMap {
    'moul-starfield': MoulStarfield
  }
}
