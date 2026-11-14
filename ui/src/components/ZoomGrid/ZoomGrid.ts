import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { CanvasColorController } from '../../controllers/canvas-color.controller'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import { CanvasPointerController } from '../../controllers/canvas-pointer.controller'
import { fitRect, type ImageFit, loadImage } from '../../utils/canvas-image'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion } from '../../utils/motion'
import { zoomGridStyles } from './ZoomGrid.styles'

/** How quickly a box eases toward its new size, in milliseconds (time constant). */
const EASE_MS = 110

/** Weights closer than this to their target count as settled, and the loop stops. */
const SETTLED = 0.001

/**
 * How strongly a box at `distance` from the pointer swells: 1 under the
 * pointer, falling along a cosine to 0 at `radius` and beyond.
 */
export function zoomFalloff(distance: number, radius: number): number {
  if (!(radius > 0)) return 0
  const t = Math.min(1, Math.abs(distance) / radius)
  return 0.5 + 0.5 * Math.cos(Math.PI * t)
}

/**
 * The size each of `count` columns (or rows) wants to be, as a weight: 1 at
 * rest, up to `zoom` for the one under the pointer. Distances are measured
 * from each track's resting centre, so the layout never chases itself.
 * `pointer` is null when no pointer is over the grid.
 */
export function trackTargets(
  count: number,
  size: number,
  pointer: number | null,
  radius: number,
  zoom: number,
  out: Float32Array,
): Float32Array {
  const step = count > 0 ? size / count : 0
  for (let i = 0; i < count; i++) {
    out[i] =
      pointer === null
        ? 1
        : 1 +
          (Math.max(1, zoom) - 1) *
            zoomFalloff((i + 0.5) * step - pointer, radius)
  }
  return out
}

/**
 * Lays tracks of the given weights across `size`, with `gap` between them,
 * writing each track's start and length. The tracks always fill the size, so
 * one that swells makes the others give way.
 */
export function layoutTracks(
  weights: ArrayLike<number>,
  count: number,
  size: number,
  gap: number,
  starts: Float32Array,
  lengths: Float32Array,
): void {
  let total = 0
  for (let i = 0; i < count; i++) total += weights[i]
  const free = Math.max(0, size - gap * (count - 1))
  let position = 0
  for (let i = 0; i < count; i++) {
    const length = total > 0 ? (free * weights[i]) / total : 0
    starts[i] = position
    lengths[i] = length
    position += length + gap
  }
}

function clampInt(
  value: number,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = Math.round(Number(value))
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

/**
 * An image cut into a grid of boxes that swell and zoom in around the
 * pointer, the rest of the grid giving way, and ease back when it leaves.
 * Each box shows a closer view of the part of the image it covers, as if a
 * loupe passed over a contact sheet. Set `columns`, `rows` and `gap`; `zoom`
 * is how far the box under the pointer swells and `radius` how many boxes
 * around it follow.
 *
 * Give `width` and `height` (the image's own size, as on an `<img>`) to
 * reserve its shape before it loads, or size the element with CSS.
 *
 * Keyboard and screen readers: one image, named by `alt`, and not
 * focusable; the zoom is a pointer effect with nothing to operate. An empty
 * `alt` marks the image as decorative and hides it.
 *
 * Reduced motion: the image is drawn once as a plain grid of boxes and does
 * not swell under the pointer.
 *
 * @csspart base - The box that is the image to screen readers.
 * @csspart canvas - The canvas the grid is drawn on.
 * @cssprop --zoom-grid-placeholder - Colour of the boxes before the image loads. Defaults to `--color-surface-secondary`.
 * @fires load - The image has loaded and is drawn.
 * @fires error - The image could not be loaded.
 */
export class MoulZoomGrid extends LitElement {
  static override styles = zoomGridStyles

  static override properties = {
    src: { type: String },
    alt: { type: String },
    width: { type: Number },
    height: { type: Number },
    fit: { type: String },
    crossOrigin: { type: String, attribute: 'crossorigin' },
    columns: { type: Number },
    rows: { type: Number },
    gap: { type: Number },
    zoom: { type: Number },
    radius: { type: Number },
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
  /** Boxes across. Defaults to 8. */
  declare columns: number
  /** Boxes down. Defaults to 6. */
  declare rows: number
  /** Space between boxes, in CSS pixels. Defaults to 2. */
  declare gap: number
  /** How far the box under the pointer swells, as a multiple of its resting size. Defaults to 2.4. */
  declare zoom: number
  /** How far the swell reaches, in boxes. Defaults to 1.6. */
  declare radius: number

  private image: HTMLImageElement | null = null
  private bitmap: HTMLCanvasElement | null = null
  private bitmapKey = ''
  private imageToken = 0
  private warnedAlt = false
  private colWeights = new Float32Array(0)
  private rowWeights = new Float32Array(0)
  private colTargets = new Float32Array(0)
  private rowTargets = new Float32Array(0)
  private colStarts = new Float32Array(0)
  private colLengths = new Float32Array(0)
  private rowStarts = new Float32Array(0)
  private rowLengths = new Float32Array(0)

  private readonly palette = new CanvasColorController(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => ({
      placeholder:
        'var(--zoom-grid-placeholder, var(--color-surface-secondary))',
    }),
    onChange: () => this.loop.drawOnce(),
  })

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot.querySelector('canvas'),
    draw: (frame) => this.paint(frame),
    autoStart: false,
    maxPixelRatio: 2,
  })

  private readonly pointer = new CanvasPointerController(this, {
    onMove: () => this.wake(),
    onDown: () => this.wake(),
    onUp: () => this.wake(),
    onLeave: () => this.wake(),
  })

  constructor() {
    super()
    this.src = ''
    this.alt = null
    this.width = null
    this.height = null
    this.fit = 'cover'
    this.crossOrigin = null
    this.columns = 8
    this.rows = 6
    this.gap = 2
    this.zoom = 2.4
    this.radius = 1.6
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('width') || changed.has('height')) this.applyRatio()
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('src') || changed.has('crossOrigin')) void this.loadSource()
    if (!this.warnedAlt && this.alt === null && this.src) {
      this.warnedAlt = true
      console.warn(
        '[@moul-dev/web-component] <moul-zoom-grid> has no alt text. Describe the image in "alt", or set alt="" if it is decorative.',
      )
    }
    if (
      changed.has('columns') ||
      changed.has('rows') ||
      changed.has('gap') ||
      changed.has('fit')
    ) {
      this.loop.drawOnce()
    }
  }

  /** Columns and rows as whole numbers in a sensible range. */
  private get grid(): { columns: number; rows: number } {
    return {
      columns: clampInt(this.columns, 1, 48, 8),
      rows: clampInt(this.rows, 1, 48, 6),
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
    this.loop.drawOnce()
    if (!this.src) return
    try {
      const image = await loadImage(this.src, this.crossOrigin)
      if (token !== this.imageToken) return
      this.image = image
      this.applyRatio()
      this.loop.drawOnce()
      this.dispatchEvent(new Event('load'))
    } catch {
      if (token !== this.imageToken) return
      this.dispatchEvent(new Event('error'))
    }
  }

  /** Runs the loop until the boxes settle; nothing moves under reduced motion. */
  private wake(): void {
    if (prefersReducedMotion() || !this.image) return
    this.loop.start()
  }

  /** The pointer's place along each axis, or null when it is not over the grid. */
  private pointerAt(): { x: number | null; y: number | null } {
    const state = this.pointer.state
    const active =
      state.isInside && (state.pointerType !== 'touch' || state.isDown)
    return active ? { x: state.x, y: state.y } : { x: null, y: null }
  }

  private ensureTracks(columns: number, rows: number): void {
    if (this.colWeights.length !== columns) {
      this.colWeights = new Float32Array(columns).fill(1)
      this.colTargets = new Float32Array(columns)
      this.colStarts = new Float32Array(columns)
      this.colLengths = new Float32Array(columns)
    }
    if (this.rowWeights.length !== rows) {
      this.rowWeights = new Float32Array(rows).fill(1)
      this.rowTargets = new Float32Array(rows)
      this.rowStarts = new Float32Array(rows)
      this.rowLengths = new Float32Array(rows)
    }
  }

  /** Eases weights toward their targets; returns whether all have settled. */
  private ease(
    weights: Float32Array,
    targets: Float32Array,
    k: number,
  ): boolean {
    let settled = true
    for (let i = 0; i < weights.length; i++) {
      const diff = targets[i] - weights[i]
      if (Math.abs(diff) > SETTLED) {
        weights[i] += diff * k
        settled = false
      } else {
        weights[i] = targets[i]
      }
    }
    return settled
  }

  private paint({
    context,
    width,
    height,
    delta,
    pixelRatio,
  }: CanvasFrame): void {
    if (!context) return
    const { columns, rows } = this.grid
    const gap = Math.max(0, Number(this.gap) || 0)
    this.ensureTracks(columns, rows)
    context.clearRect(0, 0, width, height)

    const reduced = prefersReducedMotion()
    const { x, y } = reduced ? { x: null, y: null } : this.pointerAt()
    const reach = Math.max(0, Number(this.radius) || 0)
    const zoom = Math.max(1, Number(this.zoom) || 1)
    trackTargets(
      columns,
      width,
      x,
      (reach * width) / columns,
      zoom,
      this.colTargets,
    )
    trackTargets(
      rows,
      height,
      y,
      (reach * height) / rows,
      zoom,
      this.rowTargets,
    )
    let settled: boolean
    if (reduced || !this.image) {
      this.colWeights.fill(1)
      this.rowWeights.fill(1)
      settled = true
    } else {
      const k = 1 - Math.exp(-delta / EASE_MS)
      const colsSettled = this.ease(this.colWeights, this.colTargets, k)
      const rowsSettled = this.ease(this.rowWeights, this.rowTargets, k)
      settled = colsSettled && rowsSettled
    }
    layoutTracks(
      this.colWeights,
      columns,
      width,
      gap,
      this.colStarts,
      this.colLengths,
    )
    layoutTracks(
      this.rowWeights,
      rows,
      height,
      gap,
      this.rowStarts,
      this.rowLengths,
    )

    const image = this.image
    if (!image) {
      context.fillStyle = this.palette.get('placeholder')
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          context.fillRect(
            this.colStarts[c],
            this.rowStarts[r],
            this.colLengths[c],
            this.rowLengths[r],
          )
        }
      }
      this.loop.stop()
      return
    }

    const fitted = fitRect(
      image.naturalWidth || width,
      image.naturalHeight || height,
      width,
      height,
      this.fit,
    )
    const bitmap = this.raster(
      image,
      fitted.width,
      fitted.height,
      zoom,
      pixelRatio,
    )
    if (!bitmap) return
    // Bitmap pixels per box pixel.
    const scaleX = bitmap.width / fitted.width
    const scaleY = bitmap.height / fitted.height
    const restWidth = (width - gap * (columns - 1)) / columns
    const restHeight = (height - gap * (rows - 1)) / rows
    context.imageSmoothingQuality = 'high'

    for (let r = 0; r < rows; r++) {
      const boxHeight = this.rowLengths[r]
      const centreY = r * (restHeight + gap) + restHeight / 2
      for (let c = 0; c < columns; c++) {
        const boxWidth = this.colLengths[c]
        const centreX = c * (restWidth + gap) + restWidth / 2
        // A box that swells shows less of the image, larger: its own part, closer.
        const magnify = Math.max(
          boxWidth / restWidth,
          boxHeight / restHeight,
          Number.EPSILON,
        )
        const viewWidth = boxWidth / magnify
        const viewHeight = boxHeight / magnify
        this.drawPart(
          context,
          bitmap,
          (centreX - viewWidth / 2 - fitted.x) * scaleX,
          (centreY - viewHeight / 2 - fitted.y) * scaleY,
          viewWidth * scaleX,
          viewHeight * scaleY,
          this.colStarts[c],
          this.rowStarts[r],
          boxWidth,
          boxHeight,
        )
      }
    }

    if (settled && x === null && y === null) this.loop.stop()
  }

  /**
   * The image drawn once into a bitmap the size it fills on screen, with room
   * to zoom, so each frame copies pixels rather than decoding or
   * re-rasterising the image (an SVG would be drawn afresh for every box).
   * Copying parts of a bitmap is also the one way to address parts of an SVG
   * image reliably: browsers disagree on the coordinates of its source rect.
   */
  private raster(
    image: HTMLImageElement,
    width: number,
    height: number,
    zoom: number,
    pixelRatio: number,
  ): HTMLCanvasElement | null {
    const detail = Math.min(2.5, zoom) * pixelRatio
    // At most 4096 pixels a side, and 16 million in all.
    const limit = Math.min(
      4096 / Math.max(width, height),
      Math.sqrt(16e6 / Math.max(1, width * height)),
    )
    const factor = Math.max(0.1, Math.min(detail, limit))
    const bitmapWidth = Math.max(1, Math.round(width * factor))
    const bitmapHeight = Math.max(1, Math.round(height * factor))
    const key = `${image.src}|${bitmapWidth}x${bitmapHeight}`
    if (this.bitmap && this.bitmapKey === key) return this.bitmap
    const canvas = this.bitmap ?? document.createElement('canvas')
    canvas.width = bitmapWidth
    canvas.height = bitmapHeight
    const context = canvas.getContext('2d')
    if (!context) return null
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, bitmapWidth, bitmapHeight)
    this.bitmap = canvas
    this.bitmapKey = key
    return canvas
  }

  /**
   * Draws the part of the bitmap at (sx, sy, sw, sh) into the box at
   * (dx, dy, dw, dh), trimmed to the bitmap's bounds so no browser is asked
   * for pixels outside it (Safari draws nothing then).
   */
  private drawPart(
    context: CanvasRenderingContext2D,
    bitmap: HTMLCanvasElement,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ): void {
    if (sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0) return
    const left = Math.max(0, sx)
    const top = Math.max(0, sy)
    const right = Math.min(bitmap.width, sx + sw)
    const bottom = Math.min(bitmap.height, sy + sh)
    if (right <= left || bottom <= top) return
    const kx = dw / sw
    const ky = dh / sh
    context.drawImage(
      bitmap,
      left,
      top,
      right - left,
      bottom - top,
      dx + (left - sx) * kx,
      dy + (top - sy) * ky,
      (right - left) * kx,
      (bottom - top) * ky,
    )
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

defineElement('moul-zoom-grid', MoulZoomGrid)

declare global {
  interface HTMLElementTagNameMap {
    'moul-zoom-grid': MoulZoomGrid
  }
}
