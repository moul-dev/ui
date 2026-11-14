import { html, LitElement, nothing, type PropertyValues } from 'lit'
import {
  CanvasColorController,
  colorToRgba,
} from '../../controllers/canvas-color.controller'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import { CanvasPointerController } from '../../controllers/canvas-pointer.controller'
import {
  fitRect,
  type ImageFit,
  loadImage,
  luminance,
} from '../../utils/canvas-image'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion } from '../../utils/motion'
import { createRandom } from '../../utils/noise'
import { imageEffectStyles } from './ImageEffect.styles'
import {
  ASCII_RAMP,
  bayerThreshold,
  clampIntensity,
  effectScale,
  glyphIndex,
  type ImageEffectName,
  inkCoverage,
  normalizeEffect,
  packRgba,
  spotlight,
  stretchLevels,
  waveOffset,
} from './image-effect-math'

/**
 * Masks that keep one colour channel each. They are channel arithmetic for
 * the colour split, not theme colours.
 */
const CHANNEL_MASKS = [
  'color(srgb 1 0 0)',
  'color(srgb 0 1 0)',
  'color(srgb 0 0 1)',
] as const

/** At most this many particles, however large the image. */
const MAX_PARTICLES = 16000

/** Effects that read the image's pixels, and fall back to the plain image when they cannot. */
const READS_PIXELS = new Set<ImageEffectName>(['dither', 'ascii', 'particles'])

interface SampledGrid {
  columns: number
  rows: number
  data: ImageData
}

/**
 * The image's pixels on a grid of `cellWidth` × `cellHeight` cells covering
 * a `width` × `height` box with the given fit, or null when the browser
 * will not hand them over (a cross-origin image without CORS).
 */
function sampleGrid(
  image: HTMLImageElement,
  width: number,
  height: number,
  cellWidth: number,
  cellHeight: number,
  fit: ImageFit,
): SampledGrid | null {
  const columns = Math.max(1, Math.ceil(width / cellWidth))
  const rows = Math.max(1, Math.ceil(height / cellHeight))
  try {
    const canvas = document.createElement('canvas')
    canvas.width = columns
    canvas.height = rows
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return null
    const rect = fitRect(
      image.naturalWidth || width,
      image.naturalHeight || height,
      width,
      height,
      fit,
    )
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(
      image,
      rect.x / cellWidth,
      rect.y / cellHeight,
      rect.width / cellWidth,
      rect.height / cellHeight,
    )
    return { columns, rows, data: context.getImageData(0, 0, columns, rows) }
  } catch {
    return null
  }
}

/** Luminance of each sampled cell, 0 to 1; see-through cells count as paper. */
function luminances(grid: SampledGrid): {
  values: Float32Array
  opaque: Uint8Array
} {
  const { data } = grid.data
  const count = grid.columns * grid.rows
  const values = new Float32Array(count)
  const opaque = new Uint8Array(count)
  for (let i = 0; i < count; i++) {
    const o = i * 4
    values[i] = luminance(data[o], data[o + 1], data[o + 2])
    opaque[i] = data[o + 3] >= 128 ? 1 : 0
  }
  return { values, opaque }
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  return canvas
}

interface DitherCache {
  columns: number
  rows: number
  dot: number
  coverage: Float32Array
  image: ImageData
  view: Uint32Array
  canvas: HTMLCanvasElement
  ink: number
  paper: number
  inkIsLight: boolean
  drawnLens: number
}

interface AsciiCache {
  columns: number
  rows: number
  cellWidth: number
  cellHeight: number
  coverage: Float32Array
  inkIsLight: boolean
  atlas: HTMLCanvasElement
  slotWidth: number
  slotHeight: number
  /** The whole picture, drawn once; the spotlight redraws only the cells around the pointer. */
  base: HTMLCanvasElement
}

interface ParticleCache {
  count: number
  homeX: Float32Array
  homeY: Float32Array
  x: Float32Array
  y: Float32Array
  vx: Float32Array
  vy: Float32Array
  phase: Float32Array
  color: Uint32Array
  dot: number
  spacing: number
  width: number
  height: number
  image: ImageData
  view: Uint32Array
  canvas: HTMLCanvasElement
}

/**
 * One image drawn with an effect: `pixelate` (blocks), `dither` (dots in two
 * colours), `ascii` (characters by brightness), `chromatic` (the colour
 * channels split apart), `wave` (rows swaying on a travelling wave) or
 * `particles` (the picture as dots that drift and scatter). With
 * `interactive` the pointer takes part: the blocks resolve under it, the
 * dots and characters brighten around it, the colour split follows it, a
 * ripple spreads from it and the particles scatter from it, then spring
 * back. `intensity` (0 to 1) sets how far the picture moves from the photo.
 *
 * Dither, ASCII and particles read the image's pixels, which a browser
 * allows only for same-origin images or cross-origin ones served with CORS
 * headers and loaded with `crossorigin="anonymous"`. When it refuses, the
 * element shows the plain image instead and says so in the console.
 *
 * Keyboard and screen readers: one image, named by `alt`, and not
 * focusable; the effect is visual and has nothing to operate. An empty
 * `alt` marks it as decorative and hides it.
 *
 * Reduced motion: each effect is drawn once as a still picture: no drift,
 * no wave travelling, and the pointer no longer changes it.
 *
 * @csspart base - The box that is the image to screen readers.
 * @csspart canvas - The canvas the effect is drawn on.
 * @cssprop --image-effect-color - Ink of the two-colour effects (dither, ascii). Defaults to `--color-foreground`.
 * @cssprop --image-effect-background - Paper of the two-colour effects. Defaults to `--color-surface`.
 * @fires load - The image has loaded and is drawn.
 * @fires error - The image could not be loaded.
 */
export class MoulImageEffect extends LitElement {
  static override styles = imageEffectStyles

  static override properties = {
    src: { type: String },
    alt: { type: String },
    width: { type: Number },
    height: { type: Number },
    fit: { type: String },
    crossOrigin: { type: String, attribute: 'crossorigin' },
    effect: { type: String, reflect: true },
    intensity: { type: Number },
    interactive: { type: Boolean, reflect: true },
    color: { type: String },
    background: { type: String },
  }

  /** The image's address. */
  declare src: string
  /** What the image shows, read by screen readers. An empty string marks it as decorative. */
  declare alt: string | null
  /** The image's own width; with `height`, reserves its shape before it loads. */
  declare width: number | null
  /** The image's own height; with `width`, reserves its shape before it loads. */
  declare height: number | null
  /** How the image fills the box: `cover` (default), `contain` or `fill`. */
  declare fit: ImageFit
  /** `anonymous` or `use-credentials`, so a cross-origin image's pixels can be read. */
  declare crossOrigin: string | null
  /** The effect: `pixelate` (default), `dither`, `ascii`, `chromatic`, `wave` or `particles`. */
  declare effect: ImageEffectName
  /** How far the picture moves from the photograph, from 0 to 1. Defaults to 0.5. */
  declare intensity: number
  /** Let the pointer take part in the effect. */
  declare interactive: boolean
  /** Ink of the dither and ASCII effects, any CSS colour or token. Defaults to the text colour. */
  declare color: string
  /** Paper of the dither and ASCII effects. Defaults to the surface colour. */
  declare background: string

  private image: HTMLImageElement | null = null
  private imageToken = 0
  private warnedAlt = false
  private warnedPixels = false
  private cacheKey = ''
  private unreadable = false
  private fitted: HTMLCanvasElement | null = null
  private levels: HTMLCanvasElement[] = []
  private channels: HTMLCanvasElement[] = []
  private dither: DitherCache | null = null
  private ascii: AsciiCache | null = null
  private particles: ParticleCache | null = null
  /** How open the pointer's spotlight is, 0 to 1. */
  private lens = 0
  private lensX = 0
  private lensY = 0
  private splitX = 0
  private splitY = 0
  private settled = true

  private readonly palette = new CanvasColorController(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => ({
      ink: this.color || 'var(--image-effect-color, var(--color-foreground))',
      paper:
        this.background ||
        'var(--image-effect-background, var(--color-surface))',
      placeholder: 'var(--color-surface-secondary)',
    }),
    onChange: () => this.loop.drawOnce(),
  })

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot.querySelector('canvas'),
    draw: (frame) => this.paint(frame),
    autoStart: false,
  })

  private readonly pointer = new CanvasPointerController(this, {
    onMove: () => this.syncLoop(),
    onDown: () => this.syncLoop(),
    onUp: () => this.syncLoop(),
    onLeave: () => this.syncLoop(),
  })

  constructor() {
    super()
    this.src = ''
    this.alt = null
    this.width = null
    this.height = null
    this.fit = 'cover'
    this.crossOrigin = null
    this.effect = 'pixelate'
    this.intensity = 0.5
    this.interactive = false
    this.color = ''
    this.background = ''
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('effect')) {
      const effect = normalizeEffect(this.effect)
      if (effect !== this.effect) this.effect = effect
    }
    if (changed.has('width') || changed.has('height')) this.applyRatio()
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('src') || changed.has('crossOrigin')) void this.loadSource()
    if (changed.has('color') || changed.has('background')) {
      this.palette.refresh()
    }
    if (
      changed.has('effect') ||
      changed.has('intensity') ||
      changed.has('fit') ||
      changed.has('interactive')
    ) {
      this.loop.drawOnce()
      this.syncLoop()
    }
    if (!this.warnedAlt && this.alt === null && this.src) {
      this.warnedAlt = true
      console.warn(
        '[@moul-dev/web-component] <moul-image-effect> has no alt text. Describe the image in "alt", or set alt="" if it is decorative.',
      )
    }
  }

  private applyRatio(): void {
    const width = Number(this.width)
    const height = Number(this.height)
    if (width > 0 && height > 0) {
      this.style.setProperty('--_ratio', `${width} / ${height}`)
    } else if (this.image?.naturalWidth && this.image.naturalHeight) {
      this.style.setProperty(
        '--_ratio',
        `${this.image.naturalWidth} / ${this.image.naturalHeight}`,
      )
    }
  }

  private async loadSource(): Promise<void> {
    const token = ++this.imageToken
    this.image = null
    this.cacheKey = ''
    this.warnedPixels = false
    this.loop.drawOnce()
    this.syncLoop()
    if (!this.src) return
    try {
      const image = await loadImage(this.src, this.crossOrigin)
      if (token !== this.imageToken) return
      this.image = image
      this.applyRatio()
      this.loop.drawOnce()
      this.syncLoop()
      this.dispatchEvent(new Event('load'))
    } catch {
      if (token !== this.imageToken) return
      this.dispatchEvent(new Event('error'))
    }
  }

  private pointerActive(): boolean {
    const state = this.pointer.state
    return state.isInside && (state.pointerType !== 'touch' || state.isDown)
  }

  /** Whether the current effect needs frames: it moves by itself, or is easing after the pointer. */
  private needsLoop(): boolean {
    if (!this.image || prefersReducedMotion()) return false
    const effect = this.effect
    if (this.unreadable && READS_PIXELS.has(effect)) return false
    if (effect === 'wave' || effect === 'particles') return true
    if (effect === 'chromatic' && !this.interactive) return true
    if (!this.interactive) return false
    return this.pointerActive() || !this.settled
  }

  private syncLoop(): void {
    if (this.needsLoop()) this.loop.start()
    else this.loop.stop()
  }

  private lensRadius(width: number, height: number): number {
    return Math.min(180, Math.max(48, Math.min(width, height) * 0.24))
  }

  private paint(frame: CanvasFrame): void {
    const { context, width, height, delta, time, pixelRatio } = frame
    if (!context) return
    context.clearRect(0, 0, width, height)
    const image = this.image
    if (!image) {
      context.fillStyle = this.palette.get('placeholder')
      context.fillRect(0, 0, width, height)
      return
    }

    const reduced = prefersReducedMotion()
    const effect = this.effect
    this.prepare(image, width, height, pixelRatio)

    // The pointer's spotlight opens over the image and closes after it.
    const active = !reduced && this.interactive && this.pointerActive()
    const state = this.pointer.state
    if (active) {
      this.lensX = state.x
      this.lensY = state.y
    }
    const k = delta > 0 ? 1 - Math.exp(-delta / 140) : 0
    const lensTarget = active ? 1 : 0
    this.lens = reduced ? 0 : this.lens + (lensTarget - this.lens) * k
    if (Math.abs(this.lens - lensTarget) < 0.002) this.lens = lensTarget
    this.settled = this.lens === lensTarget

    if (this.unreadable && READS_PIXELS.has(effect)) {
      this.drawPlain(context, width, height)
    } else if (effect === 'pixelate') {
      this.drawPixelate(context, width, height)
    } else if (effect === 'dither') {
      this.drawDither(context, width, height)
    } else if (effect === 'ascii') {
      this.drawAscii(context, width, height)
    } else if (effect === 'chromatic') {
      this.drawChromatic(context, width, height, time, k, active, reduced)
    } else if (effect === 'wave') {
      this.drawWave(context, width, height, time, pixelRatio)
    } else {
      this.drawParticles(context, width, height, time, delta, active, reduced)
    }

    if (!this.needsLoop()) this.loop.stop()
  }

  /** Builds what the current effect draws from, once per size, image, intensity and colours. */
  private prepare(
    image: HTMLImageElement,
    width: number,
    height: number,
    pixelRatio: number,
  ): void {
    const effect = this.effect
    const scale = effectScale(effect, clampIntensity(this.intensity))
    const ink = this.palette.get('ink')
    const paper = this.palette.get('paper')
    const key = [
      effect,
      width,
      height,
      pixelRatio,
      scale,
      this.fit,
      image.src,
      READS_PIXELS.has(effect) ? `${ink}|${paper}` : '',
    ].join('|')
    if (key === this.cacheKey) return
    this.cacheKey = key
    this.unreadable = false
    this.fitted = null
    this.levels = []
    this.channels = []
    this.dither = null
    this.ascii = null
    this.particles = null

    if (effect === 'pixelate' || effect === 'chromatic' || effect === 'wave') {
      this.fitted = this.buildFitted(image, width, height, pixelRatio)
    }
    if (effect === 'pixelate') {
      this.levels = [scale, scale / 2, scale / 4].map((block) =>
        this.buildLevel(image, width, height, Math.max(1, block)),
      )
    } else if (effect === 'chromatic') {
      this.channels = this.buildChannels()
    } else if (effect === 'dither') {
      this.dither = this.buildDither(image, width, height, scale, ink, paper)
    } else if (effect === 'ascii') {
      this.ascii = this.buildAscii(
        image,
        width,
        height,
        scale,
        ink,
        paper,
        pixelRatio,
      )
    } else if (effect === 'particles') {
      this.particles = this.buildParticles(image, width, height, scale)
    }

    if (READS_PIXELS.has(effect) && this.unreadable && !this.warnedPixels) {
      this.warnedPixels = true
      console.warn(
        `[@moul-dev/web-component] <moul-image-effect> could not read the pixels of "${this.src}", so it shows the plain image. A cross-origin image needs CORS headers and crossorigin="anonymous".`,
      )
    }
  }

  /** The image fitted to the box at device resolution. */
  private buildFitted(
    image: HTMLImageElement,
    width: number,
    height: number,
    pixelRatio: number,
  ): HTMLCanvasElement {
    const canvas = makeCanvas(width * pixelRatio, height * pixelRatio)
    const context = canvas.getContext('2d')
    if (context) {
      const rect = fitRect(
        image.naturalWidth || width,
        image.naturalHeight || height,
        width,
        height,
        this.fit,
      )
      const kx = canvas.width / width
      const ky = canvas.height / height
      context.imageSmoothingQuality = 'high'
      context.drawImage(
        image,
        rect.x * kx,
        rect.y * ky,
        rect.width * kx,
        rect.height * ky,
      )
    }
    return canvas
  }

  /** The image drawn small, one pixel per block, to be scaled up without smoothing. */
  private buildLevel(
    image: HTMLImageElement,
    width: number,
    height: number,
    block: number,
  ): HTMLCanvasElement {
    const canvas = makeCanvas(width / block, height / block)
    const context = canvas.getContext('2d')
    if (context) {
      const rect = fitRect(
        image.naturalWidth || width,
        image.naturalHeight || height,
        width,
        height,
        this.fit,
      )
      const kx = canvas.width / width
      const ky = canvas.height / height
      context.imageSmoothingQuality = 'high'
      context.drawImage(
        image,
        rect.x * kx,
        rect.y * ky,
        rect.width * kx,
        rect.height * ky,
      )
    }
    return canvas
  }

  /** One canvas per colour channel; drawn back with `lighter` they add up to the image. */
  private buildChannels(): HTMLCanvasElement[] {
    const fitted = this.fitted
    if (!fitted) return []
    return CHANNEL_MASKS.map((mask) => {
      const canvas = makeCanvas(fitted.width, fitted.height)
      const context = canvas.getContext('2d')
      if (!context) return canvas
      context.drawImage(fitted, 0, 0)
      context.globalCompositeOperation = 'multiply'
      context.fillStyle = mask
      context.fillRect(0, 0, canvas.width, canvas.height)
      // Multiplying painted the see-through parts too; keep only the image's own shape.
      context.globalCompositeOperation = 'destination-in'
      context.drawImage(fitted, 0, 0)
      context.globalCompositeOperation = 'source-over'
      return canvas
    })
  }

  private buildDither(
    image: HTMLImageElement,
    width: number,
    height: number,
    dot: number,
    ink: string,
    paper: string,
  ): DitherCache | null {
    const grid = sampleGrid(image, width, height, dot, dot, this.fit)
    if (!grid) {
      this.unreadable = true
      return null
    }
    const inkRgba = colorToRgba(ink)
    const paperRgba = colorToRgba(paper)
    const inkIsLight =
      luminance(inkRgba[0] * 255, inkRgba[1] * 255, inkRgba[2] * 255) >
      luminance(paperRgba[0] * 255, paperRgba[1] * 255, paperRgba[2] * 255)
    const { values, opaque } = luminances(grid)
    stretchLevels(values)
    const coverage = new Float32Array(values.length)
    for (let i = 0; i < values.length; i++) {
      coverage[i] = opaque[i] ? inkCoverage(values[i], inkIsLight) : 0
    }
    const canvas = makeCanvas(grid.columns, grid.rows)
    const context = canvas.getContext('2d')
    const out = context
      ? context.createImageData(grid.columns, grid.rows)
      : new ImageData(grid.columns, grid.rows)
    return {
      columns: grid.columns,
      rows: grid.rows,
      dot,
      coverage,
      image: out,
      view: new Uint32Array(out.data.buffer),
      canvas,
      ink: packRgba(...inkRgba),
      paper: packRgba(...paperRgba),
      inkIsLight,
      // Forces the first fill.
      drawnLens: -1,
    }
  }

  private buildAscii(
    image: HTMLImageElement,
    width: number,
    height: number,
    cellHeight: number,
    ink: string,
    paper: string,
    pixelRatio: number,
  ): AsciiCache | null {
    const cellWidth = cellHeight * 0.6
    const grid = sampleGrid(
      image,
      width,
      height,
      cellWidth,
      cellHeight,
      this.fit,
    )
    if (!grid) {
      this.unreadable = true
      return null
    }
    const inkRgba = colorToRgba(ink)
    const paperRgba = colorToRgba(paper)
    const inkIsLight =
      luminance(inkRgba[0] * 255, inkRgba[1] * 255, inkRgba[2] * 255) >
      luminance(paperRgba[0] * 255, paperRgba[1] * 255, paperRgba[2] * 255)
    const { values, opaque } = luminances(grid)
    stretchLevels(values)
    const coverage = new Float32Array(values.length)
    for (let i = 0; i < values.length; i++) {
      coverage[i] = opaque[i] ? inkCoverage(values[i], inkIsLight) : 0
    }

    // One slot per character of the ramp, in the ink colour, at device resolution.
    const slotWidth = Math.ceil(cellWidth * pixelRatio)
    const slotHeight = Math.ceil(cellHeight * pixelRatio)
    const atlas = makeCanvas(slotWidth * ASCII_RAMP.length, slotHeight)
    const atlasContext = atlas.getContext('2d')
    if (atlasContext) {
      const family =
        getComputedStyle(this).getPropertyValue('--font-family-mono').trim() ||
        'ui-monospace, SFMono-Regular, Menlo, monospace'
      // Bold, so thin strokes survive at small sizes and the picture keeps its contrast.
      atlasContext.font = `700 ${Math.round(cellHeight * 0.95 * pixelRatio)}px ${family}`
      atlasContext.textAlign = 'center'
      atlasContext.textBaseline = 'middle'
      atlasContext.fillStyle = ink
      for (let i = 1; i < ASCII_RAMP.length; i++) {
        atlasContext.fillText(
          ASCII_RAMP[i],
          (i + 0.5) * slotWidth,
          slotHeight * 0.54,
        )
      }
    }

    const cache: AsciiCache = {
      columns: grid.columns,
      rows: grid.rows,
      cellWidth,
      cellHeight,
      coverage,
      inkIsLight,
      atlas,
      slotWidth,
      slotHeight,
      base: makeCanvas(width * pixelRatio, height * pixelRatio),
    }
    const baseContext = cache.base.getContext('2d')
    if (baseContext) {
      baseContext.scale(pixelRatio, pixelRatio)
      baseContext.fillStyle = paper
      baseContext.fillRect(0, 0, width, height)
      this.drawGlyphs(baseContext, cache, 0, 0, grid.columns, grid.rows, 0)
    }
    return cache
  }

  private buildParticles(
    image: HTMLImageElement,
    width: number,
    height: number,
    requested: number,
  ): ParticleCache | null {
    // Widen the spacing on a large image so the count stays bounded.
    const spacing = Math.max(
      requested,
      Math.sqrt((width * height) / MAX_PARTICLES),
    )
    const grid = sampleGrid(image, width, height, spacing, spacing, this.fit)
    if (!grid) {
      this.unreadable = true
      return null
    }
    const source = new Uint32Array(grid.data.data.buffer)
    const alpha = grid.data.data
    let count = 0
    for (let i = 0; i < source.length; i++) if (alpha[i * 4 + 3] >= 32) count++
    const homeX = new Float32Array(count)
    const homeY = new Float32Array(count)
    const color = new Uint32Array(count)
    const phase = new Float32Array(count)
    const random = createRandom(11)
    let n = 0
    for (let row = 0; row < grid.rows; row++) {
      for (let column = 0; column < grid.columns; column++) {
        const i = row * grid.columns + column
        if (alpha[i * 4 + 3] < 32) continue
        homeX[n] = (column + 0.5) * spacing
        homeY[n] = (row + 0.5) * spacing
        // Opaque, so dots never blend into the page by accident.
        color[n] = source[i] | packRgba(0, 0, 0, 1)
        phase[n] = random() * Math.PI * 2
        n++
      }
    }
    const bufferWidth = Math.max(1, Math.ceil(width))
    const bufferHeight = Math.max(1, Math.ceil(height))
    const canvas = makeCanvas(bufferWidth, bufferHeight)
    const context = canvas.getContext('2d')
    const out = context
      ? context.createImageData(bufferWidth, bufferHeight)
      : new ImageData(bufferWidth, bufferHeight)
    return {
      count,
      homeX,
      homeY,
      x: Float32Array.from(homeX),
      y: Float32Array.from(homeY),
      vx: new Float32Array(count),
      vy: new Float32Array(count),
      phase,
      color,
      dot: Math.max(1, Math.round(spacing * 0.62)),
      spacing,
      width: bufferWidth,
      height: bufferHeight,
      image: out,
      view: new Uint32Array(out.data.buffer),
      canvas,
    }
  }

  private drawPlain(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    const image = this.image
    if (!image) return
    const rect = fitRect(
      image.naturalWidth || width,
      image.naturalHeight || height,
      width,
      height,
      this.fit,
    )
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height)
  }

  private drawPixelate(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    const [coarse] = this.levels
    if (!coarse) return
    context.imageSmoothingEnabled = false
    context.drawImage(
      coarse,
      0,
      0,
      coarse.width,
      coarse.height,
      0,
      0,
      width,
      height,
    )
    if (this.lens <= 0.01) return
    // Rings of finer blocks around the pointer, sharp at the centre.
    const radius = this.lensRadius(width, height) * this.lens
    const rings = [radius, radius * 0.72, radius * 0.46]
    for (let i = 0; i < rings.length; i++) {
      const level = this.levels[i + 1]
      const source = level ?? this.fitted
      if (!source) continue
      context.save()
      context.beginPath()
      context.arc(this.lensX, this.lensY, rings[i], 0, Math.PI * 2)
      context.clip()
      context.imageSmoothingEnabled = !level
      context.drawImage(
        source,
        0,
        0,
        source.width,
        source.height,
        0,
        0,
        width,
        height,
      )
      context.restore()
    }
  }

  private drawDither(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    const cache = this.dither
    if (!cache) return
    const { columns, rows, dot, coverage, view, ink, paper, inkIsLight } = cache
    // Recompute only while the spotlight is open or has just closed.
    if (this.lens > 0 || cache.drawnLens !== 0) {
      const radius = this.lensRadius(width, height)
      const reach = radius * this.lens
      for (let row = 0; row < rows; row++) {
        const cy = (row + 0.5) * dot - this.lensY
        for (let column = 0; column < columns; column++) {
          const i = row * columns + column
          let c = coverage[i]
          if (reach > 0) {
            const cx = (column + 0.5) * dot - this.lensX
            const boost = spotlight(Math.hypot(cx, cy), reach) * 0.55
            c += inkIsLight ? boost : -boost
          }
          view[i] = c > bayerThreshold(column, row) ? ink : paper
        }
      }
      cache.canvas.getContext('2d')?.putImageData(cache.image, 0, 0)
      cache.drawnLens = this.lens
    }
    context.imageSmoothingEnabled = false
    context.drawImage(
      cache.canvas,
      0,
      0,
      columns,
      rows,
      0,
      0,
      columns * dot,
      rows * dot,
    )
  }

  private drawAscii(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    const cache = this.ascii
    if (!cache) return
    context.drawImage(cache.base, 0, 0, width, height)
    if (this.lens <= 0.01) return
    // Redraw only the cells under the spotlight, brighter toward its centre.
    const radius = this.lensRadius(width, height) * this.lens
    const first = Math.max(
      0,
      Math.floor((this.lensX - radius) / cache.cellWidth),
    )
    const last = Math.min(
      cache.columns,
      Math.ceil((this.lensX + radius) / cache.cellWidth),
    )
    const top = Math.max(
      0,
      Math.floor((this.lensY - radius) / cache.cellHeight),
    )
    const bottom = Math.min(
      cache.rows,
      Math.ceil((this.lensY + radius) / cache.cellHeight),
    )
    context.fillStyle = this.palette.get('paper')
    context.fillRect(
      first * cache.cellWidth,
      top * cache.cellHeight,
      (last - first) * cache.cellWidth,
      (bottom - top) * cache.cellHeight,
    )
    this.drawGlyphs(context, cache, first, top, last, bottom, radius)
  }

  private drawGlyphs(
    context: CanvasRenderingContext2D,
    cache: AsciiCache,
    first: number,
    top: number,
    last: number,
    bottom: number,
    radius: number,
  ): void {
    const { columns, cellWidth, cellHeight, coverage, inkIsLight, atlas } =
      cache
    for (let row = top; row < bottom; row++) {
      const y = row * cellHeight
      const dy = y + cellHeight / 2 - this.lensY
      for (let column = first; column < last; column++) {
        let c = coverage[row * columns + column]
        if (radius > 0) {
          const dx = column * cellWidth + cellWidth / 2 - this.lensX
          const boost = spotlight(Math.hypot(dx, dy), radius) * 0.5
          c += inkIsLight ? boost : -boost
        }
        const index = glyphIndex(c)
        if (index === 0) continue
        context.drawImage(
          atlas,
          index * cache.slotWidth,
          0,
          cache.slotWidth,
          cache.slotHeight,
          column * cellWidth,
          y,
          cellWidth,
          cellHeight,
        )
      }
    }
  }

  private drawChromatic(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    k: number,
    active: boolean,
    reduced: boolean,
  ): void {
    if (this.channels.length < 3) return
    const max = effectScale('chromatic', clampIntensity(this.intensity))
    let targetX: number
    let targetY: number
    if (!this.interactive) {
      // A slow circle, breathing in and out.
      const angle = time * 0.0005
      const reach = max * (0.7 + 0.3 * Math.sin(time * 0.0011))
      targetX = Math.cos(angle) * reach
      targetY = Math.sin(angle) * reach
    } else if (active) {
      // Away from the centre, toward the pointer.
      let dx = (this.lensX - width / 2) / (width / 2)
      let dy = (this.lensY - height / 2) / (height / 2)
      const length = Math.hypot(dx, dy)
      if (length > 1) {
        dx /= length
        dy /= length
      }
      targetX = dx * max
      targetY = dy * max
    } else {
      targetX = max * 0.4
      targetY = 0
    }
    if (!this.interactive || reduced || k === 0) {
      this.splitX = targetX
      this.splitY = targetY
    } else {
      this.splitX += (targetX - this.splitX) * k
      this.splitY += (targetY - this.splitY) * k
      if (Math.hypot(targetX - this.splitX, targetY - this.splitY) > 0.05) {
        this.settled = false
      }
    }
    // Drawn a little larger than the box, so a shifted channel never leaves an edge bare.
    const over = max
    const offsets = [
      [this.splitX, this.splitY],
      [0, 0],
      [-this.splitX, -this.splitY],
    ]
    context.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 3; i++) {
      context.drawImage(
        this.channels[i],
        offsets[i][0] - over,
        offsets[i][1] - over,
        width + over * 2,
        height + over * 2,
      )
    }
    context.globalCompositeOperation = 'source-over'
  }

  private drawWave(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    pixelRatio: number,
  ): void {
    const fitted = this.fitted
    if (!fitted) return
    const amplitude = effectScale('wave', clampIntensity(this.intensity))
    const wavelength = Math.min(160, Math.max(40, height * 0.28))
    const base = this.interactive ? amplitude * 0.35 : amplitude
    const ripple = this.interactive ? amplitude * 1.2 * this.lens : 0
    const reach = this.lensRadius(width, height)
    const over = amplitude * 1.6
    // Strips two CSS pixels tall, cut on whole device pixels.
    const step = Math.max(1, Math.round(2 * pixelRatio))
    context.imageSmoothingEnabled = true
    for (let row = 0; row < fitted.height; row += step) {
      const y = row / pixelRatio
      let dx = waveOffset(y, time, base, wavelength, 60)
      if (ripple > 0.01) {
        const distance = Math.abs(y - this.lensY)
        dx +=
          ripple *
          Math.exp(-((distance / reach) ** 2)) *
          Math.sin((distance / (wavelength * 0.5) - time * 0.004) * Math.PI * 2)
      }
      const rows = Math.min(step, fitted.height - row)
      context.drawImage(
        fitted,
        0,
        row,
        fitted.width,
        rows,
        dx - over,
        y,
        width + over * 2,
        rows / pixelRatio + 0.5,
      )
    }
  }

  private drawParticles(
    context: CanvasRenderingContext2D,
    _width: number,
    _height: number,
    time: number,
    delta: number,
    active: boolean,
    reduced: boolean,
  ): void {
    const cache = this.particles
    if (!cache) return
    const { count, homeX, homeY, x, y, vx, vy, phase, color, dot, view } = cache
    const dt = Math.min(2.5, delta / 16.67)
    // A shimmer, not a scramble: the picture must stay readable at rest.
    const drift = reduced ? 0 : cache.spacing * (this.interactive ? 0.08 : 0.14)
    const push = active ? this.lensRadius(cache.width, cache.height) * 0.75 : 0
    const px = this.lensX
    const py = this.lensY
    const damping = dt > 0 ? 0.86 ** dt : 1
    for (let i = 0; i < count; i++) {
      if (reduced) {
        x[i] = homeX[i]
        y[i] = homeY[i]
        continue
      }
      if (dt === 0) continue
      const p = phase[i]
      const tx = homeX[i] + Math.sin(p + time * 0.0011) * drift
      const ty = homeY[i] + Math.cos(p * 1.3 + time * 0.0009) * drift
      let ax = (tx - x[i]) * 0.045
      let ay = (ty - y[i]) * 0.045
      if (push > 0) {
        const dx = x[i] - px
        const dy = y[i] - py
        const d2 = dx * dx + dy * dy
        if (d2 < push * push && d2 > 0.01) {
          const d = Math.sqrt(d2)
          const force = (1 - d / push) ** 2 * 5
          ax += (dx / d) * force
          ay += (dy / d) * force
        }
      }
      vx[i] = (vx[i] + ax * dt) * damping
      vy[i] = (vy[i] + ay * dt) * damping
      x[i] += vx[i] * dt
      y[i] += vy[i] * dt
    }

    view.fill(0)
    const w = cache.width
    const h = cache.height
    const half = dot / 2
    for (let i = 0; i < count; i++) {
      const left = Math.round(x[i] - half)
      const top = Math.round(y[i] - half)
      if (left >= w || top >= h || left + dot <= 0 || top + dot <= 0) continue
      const x0 = Math.max(0, left)
      const x1 = Math.min(w, left + dot)
      const y0 = Math.max(0, top)
      const y1 = Math.min(h, top + dot)
      const c = color[i]
      for (let yy = y0; yy < y1; yy++) {
        view.fill(c, yy * w + x0, yy * w + x1)
      }
    }
    cache.canvas.getContext('2d')?.putImageData(cache.image, 0, 0)
    context.imageSmoothingEnabled = false
    context.drawImage(cache.canvas, 0, 0, w, h)
  }

  protected override render() {
    const decorative = this.alt === ''
    return html`
      <div
        part="base"
        class="base"
        role=${decorative ? nothing : 'img'}
        aria-label=${decorative ? nothing : (this.alt ?? nothing)}
        aria-hidden=${decorative ? 'true' : nothing}
      >
        <canvas part="canvas" aria-hidden="true"></canvas>
      </div>
      <span class="color-probe"></span>
    `
  }
}

defineElement('moul-image-effect', MoulImageEffect)

declare global {
  interface HTMLElementTagNameMap {
    'moul-image-effect': MoulImageEffect
  }
}
