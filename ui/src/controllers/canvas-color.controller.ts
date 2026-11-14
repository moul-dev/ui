import { css, type ReactiveController, type ReactiveControllerHost } from 'lit'

/** Red, green, blue and alpha, each from 0 to 1, in sRGB. */
export type Rgba = [number, number, number, number]

export interface CanvasColorControllerOptions<N extends string> {
  /**
   * An empty `<span class="color-probe">` in the host's shadow root, styled by
   * `canvasColorProbeStyles`. Resolved after each update until found.
   */
  probe: () => HTMLElement | null
  /**
   * The colours to resolve, by name, as CSS values: `var(--color-accent)`,
   * `light-dark(…)`, `color-mix(…)`, `oklch(…)` and `currentColor` all work.
   * Read again on every refresh, so it can return attribute values. Up to
   * ten colours; keep the names in the same order between calls.
   */
  colors: () => Record<N, string>
  /** Called once the colours have been resolved again and differ from before. */
  onChange?: () => void
}

/** Colour properties the watch probe carries, one per configured colour. */
const WATCHED_PROPERTIES = [
  'color',
  'background-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'text-decoration-color',
  'caret-color',
  'column-rule-color',
] as const

/**
 * Styles for the probe span. Its colours change only when the page's do (a
 * theme switch, a new brand hue), and the 1 ms transition turns that change
 * into an event the controller listens for.
 */
export const canvasColorProbeStyles = css`
  .color-probe {
    position: absolute;
    inset: 0 auto auto 0;
    width: 0;
    height: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    border: 0 solid;
    transition-property: color, background-color, border-color, outline-color,
      text-decoration-color, caret-color, column-rule-color;
    transition-duration: 1ms;
    transition-timing-function: step-end;
  }
`

let scratch: CanvasRenderingContext2D | null | undefined

/** A 1×1 canvas for turning any CSS colour into sRGB bytes. */
function scratchContext(): CanvasRenderingContext2D | null {
  if (scratch !== undefined) return scratch
  scratch = null
  if (typeof document === 'undefined') return scratch
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    scratch = canvas.getContext('2d', { willReadFrequently: true }) ?? null
  } catch {
    scratch = null
  }
  return scratch
}

const rgbaCache = new Map<string, Rgba>()

/**
 * Any CSS colour a canvas accepts (`oklch(…)`, `rgb(…)`, `#hex`, a name) as
 * sRGB red, green, blue and alpha from 0 to 1, for WebGL uniforms and pixel
 * work. Unparseable colours come back opaque black.
 */
export function colorToRgba(color: string): Rgba {
  const cached = rgbaCache.get(color)
  if (cached) return cached
  let result: Rgba | null = null
  const context = scratchContext()
  if (context) {
    context.clearRect(0, 0, 1, 1)
    context.fillStyle = '#000'
    context.fillStyle = color
    context.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data
    result = [r / 255, g / 255, b / 255, a / 255]
  } else {
    // No canvas (a test environment): read rgb() and hex by hand.
    const rgb = color.match(
      /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?/,
    )
    const hex = color.match(/^#([0-9a-f]{6})$/i)
    if (rgb) {
      const alpha = rgb[4]
        ? rgb[4].endsWith('%')
          ? Number.parseFloat(rgb[4]) / 100
          : Number(rgb[4])
        : 1
      result = [
        Number(rgb[1]) / 255,
        Number(rgb[2]) / 255,
        Number(rgb[3]) / 255,
        alpha,
      ]
    } else if (hex) {
      const n = Number.parseInt(hex[1], 16)
      result = [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1]
    }
  }
  const value: Rgba = result ?? [0, 0, 0, 1]
  if (rgbaCache.size > 256) rgbaCache.clear()
  rgbaCache.set(color, value)
  return value
}

/** `rgb(r g b / alpha)` for a colour and an alpha from 0 to 1, multiplied into its own. */
export function withAlpha(color: string, alpha: number): string {
  const [r, g, b, a] = colorToRgba(color)
  return `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)} / ${Math.max(0, Math.min(1, a * alpha))})`
}

/**
 * Resolves token colours for drawing on a canvas, which accepts neither
 * `var()` nor `light-dark()`, and resolves them again when the page's
 * colours change: a theme switch, a `data-theme` on an ancestor, a new brand
 * hue, or the system's dark mode. Read them in `draw` with `get` (a colour
 * string for a 2D context) or `rgba` (numbers for WebGL).
 *
 * Call `refresh()` when an attribute that names a colour changes.
 */
export class CanvasColorController<N extends string = string>
  implements ReactiveController
{
  private readonly host: ReactiveControllerHost & HTMLElement
  private readonly options: CanvasColorControllerOptions<N>
  private probe: HTMLElement | null = null
  private resolved = new Map<N, string>()
  private frame = 0
  private rootObserver: MutationObserver | null = null
  private schemeQuery: MediaQueryList | null = null

  private readonly schedule = (): void => {
    if (this.frame || typeof requestAnimationFrame !== 'function') {
      if (!this.frame) this.refresh()
      return
    }
    this.frame = requestAnimationFrame(() => {
      this.frame = 0
      this.refresh()
    })
  }

  private readonly handleVisibility = (): void => {
    if (document.visibilityState === 'visible') this.schedule()
  }

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: CanvasColorControllerOptions<N>,
  ) {
    this.host = host
    this.options = options
    host.addController(this)
  }

  public hostConnected(): void {
    if (typeof document === 'undefined') return
    // A theme set on <html> or <body>, or the system switching to dark.
    if (typeof MutationObserver === 'function') {
      this.rootObserver = new MutationObserver(this.schedule)
      for (const node of [document.documentElement, document.body]) {
        if (node) {
          this.rootObserver.observe(node, {
            attributes: true,
            attributeFilter: ['class', 'style', 'data-theme'],
          })
        }
      }
    }
    if (typeof window.matchMedia === 'function') {
      this.schemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.schemeQuery.addEventListener?.('change', this.schedule)
    }
    document.addEventListener('visibilitychange', this.handleVisibility)
    this.attach()
  }

  public hostUpdated(): void {
    if (!this.probe) this.attach()
  }

  public hostDisconnected(): void {
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
    this.rootObserver?.disconnect()
    this.rootObserver = null
    this.schemeQuery?.removeEventListener?.('change', this.schedule)
    this.schemeQuery = null
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibility)
    }
    this.probe?.removeEventListener('transitionrun', this.schedule)
    this.probe?.removeEventListener('transitionend', this.schedule)
    this.probe = null
  }

  /** The resolved colour, as a string a 2D context's `fillStyle` takes. */
  public get(name: N): string {
    if (!this.resolved.has(name)) this.refresh()
    return this.resolved.get(name) ?? 'currentColor'
  }

  /** The resolved colour as sRGB numbers from 0 to 1, for WebGL. */
  public rgba(name: N): Rgba {
    return colorToRgba(this.get(name))
  }

  /** Resolves every colour again now; calls `onChange` if any changed. */
  public refresh(): void {
    const sources = this.options.colors()
    const probe = this.probe ?? this.options.probe()
    const names = Object.keys(sources) as N[]
    let changed = false
    const next = new Map<N, string>()
    names.forEach((name, index) => {
      const source = sources[name]
      let value = source
      // One probe property per colour, so up to ten colours are resolved and watched.
      const property = WATCHED_PROPERTIES[index]
      if (probe?.isConnected && property) {
        // Writing the same source again starts no transition, so this never loops.
        if (probe.style.getPropertyValue(property) !== source) {
          probe.style.setProperty(property, source)
        }
        value = getComputedStyle(probe).getPropertyValue(property) || source
      }
      if (!value || value.includes('var(') || value.includes('light-dark(')) {
        value =
          (this.host.isConnected && getComputedStyle(this.host).color) ||
          'currentColor'
      }
      next.set(name, value)
      if (this.resolved.get(name) !== value) changed = true
    })
    if (next.size !== this.resolved.size) changed = true
    this.resolved = next
    if (changed) this.options.onChange?.()
  }

  private attach(): void {
    const probe = this.options.probe()
    if (!probe) return
    this.probe = probe
    probe.setAttribute('aria-hidden', 'true')
    probe.addEventListener('transitionrun', this.schedule)
    probe.addEventListener('transitionend', this.schedule)
    this.refresh()
  }
}
