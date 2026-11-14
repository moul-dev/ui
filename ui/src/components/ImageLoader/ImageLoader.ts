import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { CanvasColorController } from '../../controllers/canvas-color.controller'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import { fitRect, type ImageFit, loadImage } from '../../utils/canvas-image'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion } from '../../utils/motion'
import { createNoise } from '../../utils/noise'
import { imageLoaderStyles } from './ImageLoader.styles'

export type ImageLoaderPhase = 'waiting' | 'revealing' | 'revealed'

export interface ImageLoaderRevealDetail {
  /** The image that finished revealing. */
  src: string
}

/** Block sizes behind the scan line, from the coarsest to the last before sharp, as multiples of `pixel-size`. */
const REVEAL_LEVELS = [2, 1, 0.5, 0.25] as const

/** Height of each band of one block size behind the scan line, as a fraction of the element's height. */
const BAND = 0.09

/** Smooth in and out, for the scan line's travel. */
export function easeInOut(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

/**
 * Where the scan line is, in CSS pixels from the top, `elapsed` milliseconds
 * into a reveal of `duration`. It travels past the bottom by the depth of
 * the bands behind it, so the last band also clears the image.
 */
export function scanPosition(
  elapsed: number,
  duration: number,
  height: number,
): number {
  const progress = duration > 0 ? elapsed / duration : 1
  const depth = height * BAND * REVEAL_LEVELS.length
  return easeInOut(progress) * (height + depth)
}

/**
 * The block size, in CSS pixels, of band `index` behind the scan line
 * (0 is the band touching it, the coarsest), never below one pixel.
 */
export function bandBlockSize(index: number, pixelSize: number): number {
  const level = REVEAL_LEVELS[Math.min(index, REVEAL_LEVELS.length - 1)]
  return Math.max(1, pixelSize * level)
}

/**
 * An image that appears as if it were being generated. Until it has loaded,
 * and for as long as `is-loading` is set, a soft grid of pixels shimmers in
 * its place; then a scan line sweeps down, and behind it coarse blocks of the
 * image resolve into finer ones until the sharp picture shows. Use it for an
 * image that takes a while to arrive, such as one an AI model is drawing:
 * set `is-loading` while you wait and point `src` at the result.
 *
 * Give `width` and `height` (the image's own size, as on an `<img>`) to
 * reserve its shape before it loads, or size the element with CSS.
 *
 * Keyboard and screen readers: one image, named by `alt`, and not
 * focusable. It is marked busy (`aria-busy`) until the image has revealed,
 * so a screen reader waits for the picture rather than announcing a
 * placeholder. An empty `alt` marks it as decorative and hides it.
 *
 * Reduced motion: the loading grid is drawn once and does not shimmer, and
 * the image appears at once, without the scan.
 *
 * @csspart base - The box that is the image to screen readers.
 * @csspart canvas - The canvas the grid and the image are drawn on.
 * @cssprop --image-loader-color - Colour of the loading grid. Defaults to `--color-surface-secondary`.
 * @cssprop --image-loader-highlight - Colour the grid shimmers toward. Defaults to a mix of the accent and the grid colour.
 * @cssprop --image-loader-scan - Colour of the scan line. Defaults to `--color-accent`.
 * @fires reveal - The image has finished revealing. `detail.src` is the image.
 * @fires load - The image has loaded.
 * @fires error - The image could not be loaded.
 */
export class MoulImageLoader extends LitElement {
  static override styles = imageLoaderStyles

  static override properties = {
    src: { type: String },
    alt: { type: String },
    width: { type: Number },
    height: { type: Number },
    fit: { type: String },
    crossOrigin: { type: String, attribute: 'crossorigin' },
    isLoading: { type: Boolean, reflect: true, attribute: 'is-loading' },
    duration: { type: Number },
    pixelSize: { type: Number, attribute: 'pixel-size' },
    phase: { state: true },
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
  /** `anonymous` or `use-credentials` for a cross-origin image; not needed to draw it. */
  declare crossOrigin: string | null
  /** Keep showing the loading grid, even once the image has loaded, until this is turned off. */
  declare isLoading: boolean
  /** Length of the reveal, in milliseconds. Defaults to 1800. */
  declare duration: number
  /** Size of the loading grid's pixels, in CSS pixels; the reveal starts from blocks twice this size. Defaults to 12. */
  declare pixelSize: number
  /** Where the element is: waiting for the image, revealing it, or revealed. */
  declare phase: ImageLoaderPhase

  private image: HTMLImageElement | null = null
  private imageToken = 0
  private elapsed = 0
  private warnedAlt = false
  private readonly noise = createNoise(7)
  /** One small canvas per block size behind the scan line, rebuilt when the size or image changes. */
  private levels: HTMLCanvasElement[] = []
  private levelsKey = ''
  private sharp: HTMLCanvasElement | null = null
  private sharpKey = ''
  /** A strip holding the scan line's glow, rebuilt when its colour changes. */
  private glow: HTMLCanvasElement | null = null

  private readonly palette = new CanvasColorController(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => ({
      base: 'var(--image-loader-color, var(--color-surface-secondary))',
      highlight:
        'var(--image-loader-highlight, color-mix(in oklab, var(--color-accent) 35%, var(--color-surface-secondary)))',
      scan: 'var(--image-loader-scan, var(--color-accent))',
    }),
    onChange: () => {
      this.glow = null
      this.loop.drawOnce()
    },
  })

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot.querySelector('canvas'),
    draw: (frame) => this.paint(frame),
    resize: () => {
      this.levelsKey = ''
    },
    autoStart: false,
  })

  constructor() {
    super()
    this.src = ''
    this.alt = null
    this.width = null
    this.height = null
    this.fit = 'cover'
    this.crossOrigin = null
    this.isLoading = false
    this.duration = 1800
    this.pixelSize = 12
    this.phase = 'waiting'
  }

  /** Plays the reveal again from the start, once the image has loaded. Resolves when it has revealed. */
  public replay(): Promise<void> {
    if (!this.image) return Promise.resolve()
    const revealed = new Promise<void>((resolve) => {
      this.addEventListener('reveal', () => resolve(), { once: true })
    })
    this.beginReveal()
    return revealed
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('width') || changed.has('height')) this.applyRatio()
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('src') || changed.has('crossOrigin')) void this.loadSource()
    if (changed.has('isLoading')) {
      if (this.isLoading) this.toWaiting()
      else this.maybeReveal()
    }
    if (changed.has('fit') || changed.has('pixelSize')) {
      this.levelsKey = ''
      this.loop.drawOnce()
    }
    if (!this.warnedAlt && this.alt === null && this.src) {
      this.warnedAlt = true
      console.warn(
        '[@moul-dev/web-component] <moul-image-loader> has no alt text. Describe the image in "alt", or set alt="" if it is decorative.',
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
    this.levelsKey = ''
    this.toWaiting()
    if (!this.src) return
    try {
      const image = await loadImage(this.src, this.crossOrigin)
      if (token !== this.imageToken) return
      this.image = image
      this.applyRatio()
      this.dispatchEvent(new Event('load'))
      this.maybeReveal()
    } catch {
      if (token !== this.imageToken) return
      this.dispatchEvent(new Event('error'))
    }
  }

  private toWaiting(): void {
    this.phase = 'waiting'
    this.elapsed = 0
    this.loop.start()
    this.loop.drawOnce()
  }

  private maybeReveal(): void {
    if (this.image && !this.isLoading && this.phase === 'waiting') {
      this.beginReveal()
    }
  }

  private beginReveal(): void {
    this.elapsed = 0
    if (prefersReducedMotion() || !(Number(this.duration) > 0)) {
      this.finish()
      return
    }
    this.phase = 'revealing'
    this.loop.start()
    this.loop.drawOnce()
  }

  private finish(): void {
    this.phase = 'revealed'
    this.loop.stop()
    this.loop.drawOnce()
    this.dispatchEvent(
      new CustomEvent<ImageLoaderRevealDetail>('reveal', {
        bubbles: true,
        composed: true,
        detail: { src: this.src },
      }),
    )
  }

  private paint(frame: CanvasFrame): void {
    const { context, width, height, delta, time, pixelRatio } = frame
    if (!context) return
    context.clearRect(0, 0, width, height)
    const image = this.image

    if (this.phase === 'revealed' && image) {
      this.drawSharp(context, image, width, height, 0, height, pixelRatio)
      return
    }
    if (this.phase !== 'revealing' || !image) {
      this.drawGrid(context, width, height, time, 0)
      return
    }

    this.elapsed += delta
    const duration = Math.max(1, Number(this.duration) || 1)
    // Whole pixels, so neighbouring bands meet without a hairline between them.
    const scanY = Math.round(scanPosition(this.elapsed, duration, height))
    const band = height * BAND
    const pixelSize = Math.max(2, Number(this.pixelSize) || 12)
    this.buildLevels(image, width, height, pixelSize)

    // Still to come: the grid below the scan line.
    if (scanY < height) this.drawGrid(context, width, height, time, scanY)
    // Behind it, bands of finer and finer blocks, then the sharp image.
    let bottom = Math.min(height, scanY)
    for (let index = 0; index < this.levels.length && bottom > 0; index++) {
      const top = Math.max(0, Math.round(scanY - band * (index + 1)))
      if (top < bottom) {
        context.save()
        context.beginPath()
        context.rect(0, top, width, bottom - top)
        context.clip()
        context.imageSmoothingEnabled = false
        const level = this.levels[index]
        context.drawImage(
          level,
          0,
          0,
          level.width,
          level.height,
          0,
          0,
          width,
          height,
        )
        context.restore()
      }
      bottom = top
    }
    if (bottom > 0) {
      this.drawSharp(context, image, width, height, 0, bottom, pixelRatio)
    }
    if (scanY > 0 && scanY < height + 2) this.drawScan(context, width, scanY)

    if (this.elapsed >= duration) this.finish()
  }

  /** The image, fitted, between `top` and `bottom`. */
  private drawSharp(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    width: number,
    height: number,
    top: number,
    bottom: number,
    pixelRatio: number,
  ): void {
    const sharp = this.sharpBitmap(image, width, height, pixelRatio)
    if (!sharp || bottom <= top) return
    // Copy only the rows in view: cheaper than clipping a full draw.
    const ky = sharp.height / height
    const sy = Math.max(0, Math.floor(top * ky))
    const sh = Math.min(sharp.height, Math.ceil(bottom * ky)) - sy
    if (sh <= 0) return
    context.imageSmoothingEnabled = true
    context.drawImage(sharp, 0, sy, sharp.width, sh, 0, sy / ky, width, sh / ky)
  }

  /**
   * The image fitted to the box at device resolution, drawn once, so a
   * reveal copies pixels on each frame instead of decoding the image again
   * (or re-rasterising it, for an SVG).
   */
  private sharpBitmap(
    image: HTMLImageElement,
    width: number,
    height: number,
    pixelRatio: number,
  ): HTMLCanvasElement | null {
    const bitmapWidth = Math.max(1, Math.round(width * pixelRatio))
    const bitmapHeight = Math.max(1, Math.round(height * pixelRatio))
    const key = `${image.src}|${bitmapWidth}x${bitmapHeight}|${this.fit}`
    if (this.sharp && this.sharpKey === key) return this.sharp
    const canvas = this.sharp ?? document.createElement('canvas')
    canvas.width = bitmapWidth
    canvas.height = bitmapHeight
    const context = canvas.getContext('2d')
    if (!context) return null
    const rect = fitRect(
      image.naturalWidth || width,
      image.naturalHeight || height,
      width,
      height,
      this.fit,
    )
    context.clearRect(0, 0, bitmapWidth, bitmapHeight)
    context.imageSmoothingQuality = 'high'
    context.drawImage(
      image,
      rect.x * pixelRatio,
      rect.y * pixelRatio,
      rect.width * pixelRatio,
      rect.height * pixelRatio,
    )
    this.sharp = canvas
    this.sharpKey = key
    return canvas
  }

  /** The loading grid from `top` down: soft pixels that drift between two colours. */
  private drawGrid(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    top: number,
  ): void {
    const size = Math.max(2, Number(this.pixelSize) || 12)
    const gap = size >= 6 ? 1 : 0
    const columns = Math.ceil(width / size)
    const rows = Math.ceil(height / size)
    const firstRow = Math.max(0, Math.floor(top / size))
    const t = time * 0.00035
    // A slow diagonal sweep of light, on top of the noise.
    const sweep = ((time * 0.00022) % 1.6) - 0.3
    const diagonal = width + height
    context.fillStyle = this.palette.get('base')
    context.fillRect(0, firstRow * size, width, height - firstRow * size)
    context.fillStyle = this.palette.get('highlight')
    for (let row = firstRow; row < rows; row++) {
      const y = row * size
      for (let column = 0; column < columns; column++) {
        const x = column * size
        const n = this.noise.noise3(column * 0.18, row * 0.18, t)
        const d = (x + y) / diagonal - sweep
        const light = Math.max(0, 1 - Math.abs(d) * 6)
        const alpha = Math.min(1, Math.max(0, 0.35 + n * 0.4 + light * 0.45))
        if (alpha < 0.02) continue
        context.globalAlpha = alpha
        context.fillRect(x + gap, y + gap, size - gap, size - gap)
      }
    }
    context.globalAlpha = 1
    if (gap > 0) {
      // Fine lines between the pixels, in the base colour, keep the grid legible.
      context.fillStyle = this.palette.get('base')
      for (let column = 0; column <= columns; column++) {
        context.fillRect(column * size, firstRow * size, gap, height)
      }
      for (let row = firstRow; row <= rows; row++) {
        context.fillRect(0, row * size, width, gap)
      }
    }
  }

  /** A thin line in the scan colour, with a soft glow trailing above it. */
  private drawScan(
    context: CanvasRenderingContext2D,
    width: number,
    y: number,
  ): void {
    const glow = this.glowStrip()
    if (glow) context.drawImage(glow, 0, y - 28, width, 28)
    context.fillStyle = this.palette.get('scan')
    context.fillRect(0, y - 1, width, 2)
  }

  private glowStrip(): HTMLCanvasElement | null {
    if (this.glow) return this.glow
    const strip = document.createElement('canvas')
    strip.width = 1
    strip.height = 32
    const context = strip.getContext('2d')
    if (!context) return null
    const scan = this.palette.get('scan')
    const gradient = context.createLinearGradient(0, 0, 0, 32)
    gradient.addColorStop(0, 'transparent')
    gradient.addColorStop(1, scan)
    context.globalAlpha = 0.45
    context.fillStyle = gradient
    context.fillRect(0, 0, 1, 32)
    this.glow = strip
    return strip
  }

  /** Draws the image once per block size into small canvases, scaled up later without smoothing. */
  private buildLevels(
    image: HTMLImageElement,
    width: number,
    height: number,
    pixelSize: number,
  ): void {
    const key = `${width}x${height}:${pixelSize}:${this.fit}:${image.src}`
    if (key === this.levelsKey) return
    this.levelsKey = key
    const rect = fitRect(
      image.naturalWidth || width,
      image.naturalHeight || height,
      width,
      height,
      this.fit,
    )
    this.levels = REVEAL_LEVELS.map((_, index) => {
      const block = bandBlockSize(index, pixelSize)
      const canvas = this.levels[index] ?? document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(width / block))
      canvas.height = Math.max(1, Math.round(height / block))
      const context = canvas.getContext('2d')
      if (context) {
        const kx = canvas.width / width
        const ky = canvas.height / height
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.imageSmoothingEnabled = true
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
    })
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
        aria-busy=${!decorative && this.phase !== 'revealed' ? 'true' : nothing}
      >
        <canvas part="canvas" aria-hidden="true"></canvas>
      </div>
      <span class="color-probe"></span>
    `
  }
}

defineElement('moul-image-loader', MoulImageLoader)

declare global {
  interface HTMLElementTagNameMap {
    'moul-image-loader': MoulImageLoader
  }
}
