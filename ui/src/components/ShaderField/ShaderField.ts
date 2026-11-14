import { html, LitElement, type PropertyValues } from 'lit'
import {
  CanvasColorController,
  type Rgba,
} from '../../controllers/canvas-color.controller'
import {
  type CanvasFrame,
  CanvasLoopController,
  type CanvasLoopControllerOptions,
} from '../../controllers/canvas-loop.controller'
import { CanvasPointerController } from '../../controllers/canvas-pointer.controller'
import { defineElement } from '../../utils/define-element'
import { createRandom } from '../../utils/noise'
import { createProgram, watchContextLoss } from '../../utils/webgl'
import { shaderFieldStyles } from './ShaderField.styles'
import {
  fragmentSource,
  NOISE_PERIOD,
  noiseTexels,
  type ShaderFieldUniform,
  type ShaderFieldVariant,
  UNIFORMS,
  VERTEX_SOURCE,
  wrapDrift,
} from './shaders'

export type { ShaderFieldVariant } from './shaders'
export type ShaderFieldShape = 'dot' | 'square'

const VARIANTS: readonly ShaderFieldVariant[] = ['dither', 'clouds']
const SHAPES: readonly ShaderFieldShape[] = ['dot', 'square']

/** Palette slots the shader reads; fewer colours repeat the last one. */
const SLOTS = ['c0', 'c1', 'c2', 'c3'] as const
type Slot = (typeof SLOTS)[number]

/**
 * Theme colours used when `colors` is not set. The dither runs from the
 * surface through a soft accent to the accent. The clouds are lit surface
 * colour drifting over an accent-tinted sky that deepens toward the top.
 */
export const SHADER_FIELD_DEFAULT_COLORS: Record<
  ShaderFieldVariant,
  readonly string[]
> = {
  // Mixed in oklab: in oklch a neutral surface (hue 0) would pull a blue accent through pink.
  dither: [
    'var(--color-surface)',
    'color-mix(in oklab, var(--color-accent) 30%, var(--color-surface))',
    'var(--color-accent)',
  ],
  clouds: [
    'color-mix(in oklab, var(--color-accent) 30%, var(--color-background))',
    'light-dark(color-mix(in oklab, var(--color-accent) 8%, var(--color-surface)), color-mix(in oklab, var(--color-foreground) 26%, color-mix(in oklab, var(--color-accent) 30%, var(--color-background))))',
    'light-dark(var(--color-surface), color-mix(in oklab, var(--color-foreground) 55%, color-mix(in oklab, var(--color-accent) 30%, var(--color-background))))',
    'color-mix(in oklab, var(--color-accent) 58%, var(--color-background))',
  ],
}

/** CSS pixels across one noise feature at `scale` 1. */
const FEATURE_SIZE: Record<ShaderFieldVariant, number> = {
  dither: 110,
  clouds: 130,
}

/**
 * Highest pixel ratio drawn. Dots need a sharp edge; squares are drawn at
 * one device pixel per CSS pixel and scaled up without smoothing; clouds
 * are soft, so they are drawn at CSS resolution and cost a quarter as much
 * on a 2x screen.
 */
function maxRatioFor(
  variant: ShaderFieldVariant,
  shape: ShaderFieldShape,
): number {
  if (variant === 'clouds') return 1
  return shape === 'square' ? 1 : 1.5
}

/**
 * Splits a list of CSS colours on its top-level commas, so
 * `var(--a), color-mix(in oklch, red 30%, blue)` is two colours. A JSON
 * array (`["red", "blue"]`) is read as is.
 */
export function parseColorList(value: string | null | undefined): string[] {
  const text = value?.trim() ?? ''
  if (!text) return []
  if (text.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((c): c is string => typeof c === 'string' && c.trim() !== '')
          .map((c) => c.trim())
      }
    } catch {
      // Not JSON after all: fall through to the comma split.
    }
  }
  const colors: string[] = []
  let depth = 0
  let current = ''
  for (const char of text) {
    if (char === '(') depth++
    if (char === ')') depth = Math.max(0, depth - 1)
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

interface GlState {
  gl: WebGLRenderingContext
  program: WebGLProgram
  variant: ShaderFieldVariant
  buffer: WebGLBuffer
  texture: WebGLTexture
  locations: Record<ShaderFieldUniform, WebGLUniformLocation | null>
  position: number
}

/**
 * A full-bleed background field drawn by a fragment shader on the GPU, for
 * heroes and sections that want texture and slow movement without an image
 * or a video. `variant="dither"` (the default) is a field of dots or square
 * pixels quantised through an ordered Bayer dither into two to four
 * colours, following slowly drifting noise. `variant="clouds"` is soft
 * fractal cloud drifting and billowing over a sky. Colours come from the
 * theme or from `colors`, and follow a theme switch without recompiling.
 * With `interactive`, the field swells or parts around the pointer.
 *
 * Where WebGL is unavailable, turned off or lost, the element shows a still
 * CSS gradient of the same colours instead and sets `is-fallback`. Removed
 * from the page, it gives its WebGL context back, so a single-page app can
 * create and drop fields freely.
 *
 * Keyboard and screen readers: the field is decoration: its canvas is hidden
 * from screen readers and never takes focus. Content slotted inside reads
 * and tabs as usual; keep its contrast against the field in mind, for
 * example with `density` or a panel behind the text.
 *
 * Reduced motion: the field is drawn once and holds still, and the pointer
 * no longer moves it. A theme switch or a new colour still redraws it.
 *
 * @slot - Content shown over the field.
 * @csspart canvas - The canvas the field is drawn on.
 * @csspart fallback - The CSS gradient shown when WebGL is unavailable.
 * @csspart content - The wrapper around the slotted content.
 */
export class MoulShaderField extends LitElement {
  static override styles = shaderFieldStyles

  static override properties = {
    variant: { type: String, reflect: true },
    colors: {
      converter: {
        fromAttribute: (value: string | null) => parseColorList(value),
        toAttribute: (value: string[]) => value.join(', '),
      },
    },
    speed: { type: Number },
    fieldScale: { type: Number, attribute: 'scale' },
    pixelSize: { type: Number, attribute: 'pixel-size' },
    density: { type: Number },
    shape: { type: String, reflect: true },
    interactive: { type: Boolean, reflect: true },
    seed: { type: Number },
  }

  /** `dither` (default): dithered dots or pixels. `clouds`: drifting fractal clouds. */
  declare variant: ShaderFieldVariant
  /**
   * Up to four CSS colours or tokens, as a property array or as a
   * comma-separated (or JSON) attribute. Dither: the background, then each
   * ink from faint to strong. Clouds: the sky, the cloud, its lit rim and
   * the sky at the top. Defaults to theme colours.
   */
  declare colors: string[]
  /** How fast the field drifts: 1 is calm, 0 holds it still. Defaults to 1. */
  declare speed: number
  /** Size of the noise features: 2 doubles them, 0.5 halves them. Attribute `scale`. Defaults to 1. */
  declare fieldScale: number
  /** Size of one dither cell, in CSS pixels. Defaults to 6. */
  declare pixelSize: number
  /** How much of the field is inked (dither) or clouded (clouds), from 0 to 1. Defaults to 0.5. */
  declare density: number
  /** Dither cells as round `dot`s (default) or `square` pixels. */
  declare shape: ShaderFieldShape
  /** The pointer swells the dither or parts and lights the clouds under it. */
  declare interactive: boolean
  /**
   * Which stretch of the endless field is shown. Fields with the same seed
   * and size look the same; give two fields on one page different seeds.
   * Defaults to 3.
   */
  declare seed: number

  private glState: GlState | null = null
  private glFailed = false
  /**
   * Set when the element gave its context back on removal. Kept because a
   * lost context hands out no extensions, and this one asks for it again.
   */
  private released: WEBGL_lose_context | null = null
  private releaseTimer: ReturnType<typeof setTimeout> | undefined
  private stopWatchingLoss: (() => void) | null = null
  private watchedCanvas: HTMLCanvasElement | null = null
  /** Seconds of drift, scaled by `speed`, kept here so a speed change does not jump. */
  private clock = 0
  private pointerX = 0
  private pointerY = 0
  private pointerStrength = 0
  private hasPointerPosition = false

  private readonly palette = new CanvasColorController<Slot>(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => {
      const list = this.resolvedSources()
      return Object.fromEntries(
        SLOTS.map((slot, i) => [slot, list[Math.min(i, list.length - 1)]]),
      ) as Record<Slot, string>
    },
    onChange: () => this.loop.drawOnce(),
  })

  private readonly loop = new CanvasLoopController<'webgl'>(
    this,
    this.loopOptions(),
  )

  private readonly pointer = new CanvasPointerController(this)

  constructor() {
    super()
    this.variant = 'dither'
    this.colors = []
    this.speed = 1
    this.fieldScale = 1
    this.pixelSize = 6
    this.density = 0.5
    this.shape = 'dot'
    this.interactive = false
    this.seed = 3
  }

  private loopOptions(): CanvasLoopControllerOptions<'webgl'> {
    const host = this
    return {
      canvas: () => host.renderRoot.querySelector('canvas'),
      context: 'webgl',
      contextAttributes: {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: 'low-power',
      },
      draw: (frame) => host.paint(frame),
      // Read whenever the loop measures, so it follows the current variant and shape.
      get maxPixelRatio() {
        return maxRatioFor(host.currentVariant, host.currentShape)
      },
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    clearTimeout(this.releaseTimer)
    this.releaseTimer = undefined
    const released = this.released
    this.released = null
    if (released && this.loop.context?.isContextLost()) {
      released.restoreContext()
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    // A move within the page reconnects in the same task: only a real removal frees the GPU.
    clearTimeout(this.releaseTimer)
    this.releaseTimer = setTimeout(() => {
      this.releaseTimer = undefined
      if (!this.isConnected) this.releaseGl()
    }, 0)
  }

  /** Whether the field is being drawn with WebGL, rather than shown as the CSS fallback. */
  public get isWebgl(): boolean {
    return !this.hasAttribute('is-fallback')
  }

  private get currentVariant(): ShaderFieldVariant {
    return VARIANTS.includes(this.variant) ? this.variant : 'dither'
  }

  private get currentShape(): ShaderFieldShape {
    return SHAPES.includes(this.shape) ? this.shape : 'dot'
  }

  /** The colours to draw with: the author's, or the variant's theme colours. */
  private resolvedSources(): string[] {
    const own = (this.colors ?? []).filter(
      (c) => typeof c === 'string' && c.trim(),
    )
    const list =
      own.length > 0
        ? own.slice(0, 4)
        : [...SHADER_FIELD_DEFAULT_COLORS[this.currentVariant]]
    // Two colours at least: one alone draws a flat fill.
    return list.length === 1 ? [list[0], list[0]] : list
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    this.watchCanvas()
    if (changed.has('colors') || changed.has('variant')) this.palette.refresh()
    if (changed.has('variant') || changed.has('shape')) {
      this.remeasure()
    }
    if (!this.loop.context && this.watchedCanvas) this.showFallback(true)
    if (changed.has('speed') || changed.has('interactive')) this.syncLoop()
    this.loop.drawOnce()
  }

  /** Runs the loop only when there is something to animate and WebGL to draw it with. */
  private syncLoop(): void {
    const isStill = this.numberOr(this.speed, 1) === 0 && !this.interactive
    if (isStill || this.hasAttribute('is-fallback')) this.loop.stop()
    else this.loop.start()
  }

  private watchCanvas(): void {
    const canvas = this.renderRoot.querySelector('canvas')
    if (!canvas || canvas === this.watchedCanvas) return
    this.stopWatchingLoss?.()
    this.watchedCanvas = canvas
    this.stopWatchingLoss = watchContextLoss(
      canvas,
      () => {
        // The GPU took the context: its objects are gone.
        this.glState = null
        this.showFallback(true)
      },
      () => {
        this.glFailed = false
        this.showFallback(false)
        this.syncLoop()
        this.loop.drawOnce()
      },
    )
  }

  /**
   * Asks the loop to size the canvas again after the pixel-ratio cap changed
   * (a new variant or shape); the loop only measures on resize by itself.
   */
  private remeasure(): void {
    const loop = this.loop as unknown as { measure?: () => void }
    if (typeof loop.measure === 'function') loop.measure()
  }

  private showFallback(isFallback: boolean): void {
    this.toggleAttribute('is-fallback', isFallback)
    if (isFallback) this.loop.stop()
  }

  private numberOr(value: number, fallback: number): number {
    return Number.isFinite(value) ? value : fallback
  }

  /** Frees the program, buffer and texture, and gives the context back to the browser. */
  private releaseGl(): void {
    const gl = this.loop.context ?? this.glState?.gl ?? null
    this.disposeGl()
    if (gl && !gl.isContextLost()) {
      const extension = gl.getExtension('WEBGL_lose_context')
      if (extension) {
        extension.loseContext()
        this.released = extension
      }
    }
  }

  private disposeGl(): void {
    const state = this.glState
    this.glState = null
    if (!state || state.gl.isContextLost()) return
    state.gl.deleteProgram(state.program)
    state.gl.deleteBuffer(state.buffer)
    state.gl.deleteTexture(state.texture)
  }

  /** Builds (or rebuilds, after a variant change or a lost context) everything the GPU needs. */
  private ensureGl(gl: WebGLRenderingContext): GlState | null {
    const variant = this.currentVariant
    if (this.glState?.gl === gl && this.glState.variant === variant) {
      return this.glState
    }
    if (this.glFailed) return null
    try {
      if (this.glState?.gl === gl) {
        // Same context, new variant: keep the buffer and texture, swap the program.
        gl.deleteProgram(this.glState.program)
        const program = createProgram(
          gl,
          VERTEX_SOURCE,
          fragmentSource(variant),
        )
        this.glState = {
          ...this.glState,
          program,
          variant,
          ...this.lookup(gl, program),
        }
        return this.glState
      }
      const program = createProgram(gl, VERTEX_SOURCE, fragmentSource(variant))
      const buffer = gl.createBuffer()
      const texture = gl.createTexture()
      if (!buffer || !texture)
        throw new Error('[moul] WebGL could not allocate.')
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      // One triangle that covers the canvas.
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      )
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        NOISE_PERIOD,
        NOISE_PERIOD,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        noiseTexels(createRandom(7)),
      )
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
      this.glState = {
        gl,
        program,
        variant,
        buffer,
        texture,
        ...this.lookup(gl, program),
      }
      return this.glState
    } catch (error) {
      // A driver that cannot compile the shader: show the gradient, once.
      this.glFailed = true
      this.glState = null
      console.warn(
        '[moul] <moul-shader-field> fell back to a CSS gradient.',
        error,
      )
      this.showFallback(true)
      return null
    }
  }

  private lookup(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
  ): Pick<GlState, 'locations' | 'position'> {
    const locations = Object.fromEntries(
      UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]),
    ) as Record<ShaderFieldUniform, WebGLUniformLocation | null>
    return { locations, position: gl.getAttribLocation(program, 'a_position') }
  }

  /** Eases the pointer's place and pull toward where the pointer is now. */
  private followPointer(delta: number): void {
    const state = this.pointer.state
    const isActive =
      this.interactive &&
      state.isInside &&
      (state.pointerType !== 'touch' || state.isDown)
    if (isActive) {
      if (!this.hasPointerPosition) {
        this.pointerX = state.x
        this.pointerY = state.y
        this.hasPointerPosition = true
      }
      const follow = 1 - Math.exp(-delta / 90)
      this.pointerX += (state.x - this.pointerX) * follow
      this.pointerY += (state.y - this.pointerY) * follow
    }
    const ease = 1 - Math.exp(-delta / (isActive ? 160 : 420))
    this.pointerStrength += ((isActive ? 1 : 0) - this.pointerStrength) * ease
    if (this.pointerStrength < 0.001 && !isActive)
      this.hasPointerPosition = false
  }

  private paint(frame: CanvasFrame<'webgl'>): void {
    const gl = frame.context
    if (!gl || gl.isContextLost()) return
    const state = this.ensureGl(gl)
    if (!state) return
    const variant = state.variant
    const speed = Math.max(0, this.numberOr(this.speed, 1))
    this.clock += (frame.delta / 1000) * speed
    this.followPointer(frame.delta)

    // The seed starts each layer somewhere else in the endless field.
    const seed = this.numberOr(this.seed, 3) * 7.31
    const t = this.clock
    const { locations: u } = state
    gl.viewport(0, 0, frame.canvas.width, frame.canvas.height)
    gl.useProgram(state.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, state.texture)
    gl.uniform1i(u.u_noise, 0)
    gl.uniform2f(u.u_resolution, frame.canvas.width, frame.canvas.height)
    gl.uniform1f(u.u_ratio, frame.pixelRatio)
    // Three layers drifting at their own pace and heading, wrapped where the noise repeats.
    gl.uniform2f(
      u.u_drift1,
      wrapDrift(t * 0.045 + seed),
      wrapDrift(t * 0.018 + seed * 0.37),
    )
    gl.uniform2f(
      u.u_drift2,
      wrapDrift(-t * 0.026 + seed * 1.71),
      wrapDrift(t * 0.034 + seed * 0.53),
    )
    gl.uniform2f(
      u.u_drift3,
      wrapDrift(t * 0.06 + seed * 0.29),
      wrapDrift(-t * 0.012 + seed * 1.13),
    )
    const scale = Math.max(0.05, this.numberOr(this.fieldScale, 1))
    gl.uniform1f(u.u_frequency, 1 / (FEATURE_SIZE[variant] * scale))
    gl.uniform1f(
      u.u_density,
      Math.min(1, Math.max(0, this.numberOr(this.density, 0.5))),
    )
    for (const slot of SLOTS) {
      const [r, g, b, a]: Rgba = this.palette.rgba(slot)
      gl.uniform4f(u[`u_${slot}`], r, g, b, a)
    }
    gl.uniform1f(u.u_count, Math.min(4, this.resolvedSources().length))
    gl.uniform1f(
      u.u_cell,
      Math.min(64, Math.max(2, this.numberOr(this.pixelSize, 6))),
    )
    gl.uniform1f(u.u_shape, this.currentShape === 'dot' ? 1 : 0)
    gl.uniform2f(u.u_pointer, this.pointerX, this.pointerY)
    gl.uniform1f(u.u_pointer_strength, this.pointerStrength)
    gl.uniform1f(
      u.u_pointer_radius,
      Math.max(80, Math.min(frame.width, frame.height) * 0.28),
    )

    gl.bindBuffer(gl.ARRAY_BUFFER, state.buffer)
    gl.enableVertexAttribArray(state.position)
    gl.vertexAttribPointer(state.position, 2, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  protected override render() {
    const sources = this.resolvedSources()
    const at = (i: number) => sources[Math.min(i, sources.length - 1)]
    // The fallback is plain CSS, so it takes the colours as written: tokens follow the theme.
    const fallback = `--_c0: ${at(0)}; --_c1: ${at(1)}; --_c2: ${at(2)}; --_c3: ${at(3)}`
    return html`
      <div class="layer" aria-hidden="true">
        <canvas part="canvas" aria-hidden="true"></canvas>
        <div part="fallback" class="fallback" style=${fallback}></div>
      </div>
      <span class="color-probe"></span>
      <div part="content" class="content"><slot></slot></div>
    `
  }
}

defineElement('moul-shader-field', MoulShaderField)

declare global {
  interface HTMLElementTagNameMap {
    'moul-shader-field': MoulShaderField
  }
}
