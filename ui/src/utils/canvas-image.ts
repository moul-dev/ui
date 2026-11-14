/**
 * Loading images for the canvas elements that draw or read them (image
 * effects, the image loader, the zoom grid, the icon cloud).
 *
 * Drawing any image works. Reading its pixels back (`getImageData`) works
 * only for same-origin images and for cross-origin ones served with CORS
 * headers and loaded with `crossorigin`; otherwise the canvas is "tainted"
 * and the read throws. `readPixels` turns that into `null`, so an element can
 * fall back to showing the plain image.
 */

/**
 * Loads an image and waits until it can be drawn. `crossOrigin` is passed
 * through (`anonymous` or `use-credentials`); leave it out for same-origin
 * images. Rejects when the image fails to load or decode.
 */
export function loadImage(
  src: string,
  crossOrigin?: string | null,
): Promise<HTMLImageElement> {
  const image = new Image()
  if (crossOrigin != null) image.crossOrigin = crossOrigin
  image.decoding = 'async'
  image.src = src
  if (typeof image.decode === 'function') {
    return image.decode().then(() => image)
  }
  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`[moul] Could not load ${src}.`))
  })
}

/** Waits for an `<img>` already in the page (a slotted image) to load, without loading it again. */
export function imageReady(image: HTMLImageElement): Promise<HTMLImageElement> {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve(image)
  return new Promise((resolve, reject) => {
    image.addEventListener('load', () => resolve(image), { once: true })
    image.addEventListener(
      'error',
      () =>
        reject(
          new Error(`[moul] Could not load ${image.currentSrc || image.src}.`),
        ),
      { once: true },
    )
  })
}

export type ImageFit = 'cover' | 'contain' | 'fill'

/** Where to draw a `sourceWidth` × `sourceHeight` image to fit a `width` × `height` box, like `object-fit`. */
export function fitRect(
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
  fit: ImageFit = 'cover',
): { x: number; y: number; width: number; height: number } {
  if (fit === 'fill' || sourceWidth <= 0 || sourceHeight <= 0) {
    return { x: 0, y: 0, width, height }
  }
  const scale =
    fit === 'cover'
      ? Math.max(width / sourceWidth, height / sourceHeight)
      : Math.min(width / sourceWidth, height / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  return {
    x: (width - drawWidth) / 2,
    y: (height - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  }
}

/**
 * The pixels of `source` drawn into a `width` × `height` box with the given
 * fit, or `null` when the browser will not hand them over (a cross-origin
 * image without CORS, or no canvas support).
 */
export function readPixels(
  source: CanvasImageSource & {
    naturalWidth?: number
    naturalHeight?: number
    width?: number | SVGAnimatedLength
    height?: number | SVGAnimatedLength
  },
  width: number,
  height: number,
  fit: ImageFit = 'cover',
): ImageData | null {
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))
  try {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return null
    const sourceWidth =
      source.naturalWidth ||
      (typeof source.width === 'number' ? source.width : w)
    const sourceHeight =
      source.naturalHeight ||
      (typeof source.height === 'number' ? source.height : h)
    const rect = fitRect(sourceWidth, sourceHeight, w, h, fit)
    context.drawImage(source, rect.x, rect.y, rect.width, rect.height)
    return context.getImageData(0, 0, w, h)
  } catch {
    return null
  }
}

/** Relative luminance (0 dark to 1 light) of an sRGB pixel given as bytes. */
export function luminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}
