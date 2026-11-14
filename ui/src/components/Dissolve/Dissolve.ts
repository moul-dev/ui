import { html, LitElement, type PropertyValues } from 'lit'
import { CanvasColorController } from '../../controllers/canvas-color.controller'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { createNoise, type Noise } from '../../utils/noise'
import { dissolveStyles } from './Dissolve.styles'
import {
  type ItemColors,
  particleColor,
  sampleItemColors,
} from './dissolve-colors'
import {
  bandPoint,
  DISSOLVE_EDGE,
  type DissolveDirection,
  normalizeDirection,
  particleBudget,
  sweepProgress,
  sweepVector,
  uncoveredBand,
} from './dissolve-sweep'

export type { DissolveDirection } from './dissolve-sweep'

/** Milliseconds the fade takes under reduced motion. */
const REDUCED_FADE = 200
/** Milliseconds the item's height takes to close up, with `collapse`. */
const COLLAPSE_DURATION = 260
/** Longest a particle drifts, in seconds; the run ends this long after the sweep at most. */
const MAX_LIFE = 1.25

interface Particles {
  x: Float32Array
  y: Float32Array
  vx: Float32Array
  vy: Float32Array
  age: Float32Array
  life: Float32Array
  size: Float32Array
  color: Int16Array
  count: number
}

interface Run {
  resolve: () => void
  elapsed: number
  progress: number
  /** Fractional particles carried over to the next frame. */
  carry: number
  budget: number
  width: number
  height: number
  sample: ItemColors
  particles: Particles
  sweepDone: boolean
  collapseDone: boolean
  wasInert: boolean
  safety: ReturnType<typeof setTimeout> | null
}

function createParticles(capacity: number): Particles {
  return {
    x: new Float32Array(capacity),
    y: new Float32Array(capacity),
    vx: new Float32Array(capacity),
    vy: new Float32Array(capacity),
    age: new Float32Array(capacity),
    life: new Float32Array(capacity),
    size: new Float32Array(capacity),
    color: new Int16Array(capacity),
    count: 0,
  }
}

/**
 * Wraps an item, such as a list row, a card or a tag, and breaks it into dust
 * when it is removed. Call `dissolve()`: the item is wiped away from one side
 * (`direction`) while particles in its own colours peel off the moving edge
 * and drift away, then the promise resolves and `dissolveend` fires. With
 * `collapse` the space it took closes up, and with `remove-on-end` the
 * element removes itself, so `await row.dissolve()` is a complete delete.
 * The item is not turned into an image: the wipe is a mask over the real
 * content, and the dust takes the colours read from it (backgrounds, borders
 * and text) at the point each grain leaves.
 *
 * Keyboard and screen readers: never focusable itself; the item keeps its own
 * semantics until it dissolves. From the first frame of `dissolve()` the item
 * is `inert`, so it can be neither pressed again nor read out; move focus
 * somewhere sensible (the next row, a heading) before you call it, because
 * focus inside an inert item is lost. Announce the deletion in words, for
 * example with a toast that offers an undo.
 *
 * Reduced motion: the item fades out over 200 ms with no dust and no wipe,
 * then the promise resolves and `dissolveend` fires as usual; `collapse`
 * closes the space at once.
 *
 * @slot - The item to dissolve.
 * @csspart canvas - The full-viewport canvas the dust is drawn on while the item dissolves.
 * @csspart content - The wrapper around the item that the wipe masks.
 * @fires dissolveend - Once the item has gone, before `remove-on-end` removes it.
 */
export class MoulDissolve extends LitElement {
  static override styles = dissolveStyles

  static override properties = {
    direction: { type: String, reflect: true },
    duration: { type: Number },
    collapse: { type: Boolean, reflect: true },
    removeOnEnd: { type: Boolean, attribute: 'remove-on-end' },
  }

  /** The way the wipe travels and the dust drifts: `right` (default), `left`, `up` or `down`. */
  declare direction: DissolveDirection
  /** Milliseconds the wipe takes to cross the item. Defaults to 900; the dust drifts on for up to 1.25 s more. */
  declare duration: number
  /** Close up the space the item took once it has gone. */
  declare collapse: boolean
  /** Remove the element from the page once it has gone. */
  declare removeOnEnd: boolean

  private run: Run | null = null
  private pending: Promise<void> | null = null
  private fade: Animation | null = null
  private closing: Animation | null = null
  private noise: Noise | null = null
  /** Whether the item was inert before it dissolved, to restore on `reset()`. */
  private inertBefore: boolean | null = null
  private stopWatchingMotion: (() => void) | null = null

  private readonly palette = new CanvasColorController(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => ({ dust: 'var(--color-muted)' }),
  })

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot.querySelector('canvas'),
    autoStart: false,
    draw: (frame) => this.step(frame),
  })

  constructor() {
    super()
    this.direction = 'right'
    this.duration = 900
    this.collapse = false
    this.removeOnEnd = false
  }

  /** Whether the item has dissolved (and has not been brought back with `reset()`). */
  public get isDissolved(): boolean {
    return this.hasAttribute('is-dissolved')
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      // Turning reduced motion on mid-way skips straight to the end.
      if (isReduced && this.run) this.finishNow()
    })
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    if (this.run && !this.removeOnEnd) this.cancelRun()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('direction')) {
      const normalized = normalizeDirection(this.direction)
      if (normalized !== this.direction) this.direction = normalized
    }
  }

  /**
   * Dissolves the item. Resolves once it has gone (and has been removed,
   * with `remove-on-end`). Calling it again while it runs returns the same
   * promise; calling it on a dissolved item resolves at once.
   */
  public dissolve(): Promise<void> {
    if (this.pending) return this.pending
    if (this.isDissolved || !this.isConnected) return Promise.resolve()
    this.pending = new Promise<void>((resolve) => {
      if (prefersReducedMotion()) this.fadeOut(resolve)
      else void this.begin(resolve)
    }).finally(() => {
      this.pending = null
    })
    return this.pending
  }

  /** Brings a dissolved item back at once, or stops a dissolve part way. */
  public reset(): void {
    this.cancelRun()
    this.fade?.cancel()
    this.fade = null
    this.closing?.cancel()
    this.closing = null
    if (this.inertBefore !== null) {
      this.inert = this.inertBefore
      this.inertBefore = null
    }
    this.removeAttribute('is-dissolved')
    this.removeAttribute('data-dissolving')
    this.content()?.style.removeProperty('--_dissolve')
  }

  private content(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>('.content')
  }

  private async begin(resolve: () => void): Promise<void> {
    await this.updateComplete
    const rect = this.getBoundingClientRect()
    const budget = particleBudget(rect.width, rect.height)
    const run: Run = {
      resolve,
      elapsed: 0,
      progress: 0,
      carry: 0,
      budget,
      width: rect.width,
      height: rect.height,
      sample: sampleItemColors(this, rect),
      particles: createParticles(Math.max(1, budget)),
      sweepDone: false,
      collapseDone: !this.collapse,
      wasInert: this.inert,
      // If frames never come (a hidden tab, no canvas), finish anyway.
      safety: setTimeout(
        () => this.finishNow(),
        Math.max(0, this.duration) + MAX_LIFE * 1000 + 1500,
      ),
    }
    if (run.sample.colors.length === 0) {
      run.sample.colors.push(this.palette.get('dust'))
      run.sample.texts.fill(0)
    }
    this.run = run
    this.noise ??= createNoise(7)
    this.inert = true
    this.toggleAttribute('data-dissolving', true)
    this.content()?.style.setProperty('--_dissolve', '0')
    const canvas = this.renderRoot.querySelector('canvas')
    try {
      canvas?.showPopover?.()
    } catch {
      // Without the Popover API the fixed canvas still covers the viewport.
    }
    this.loop.start()
  }

  /** Reduced motion: a short fade, no wipe and no dust. */
  private fadeOut(resolve: () => void): void {
    const wasInert = this.inert
    this.inert = true
    const content = this.content()
    const done = (): void => {
      this.run = null
      this.finalize(resolve, wasInert)
    }
    if (content && typeof content.animate === 'function') {
      this.fade = content.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: REDUCED_FADE,
        easing: 'ease-out',
        fill: 'forwards',
      })
      this.fade.finished.then(done, done)
    } else {
      setTimeout(done, REDUCED_FADE)
    }
  }

  private step(frame: CanvasFrame): void {
    const run = this.run
    if (!run) {
      this.loop.stop()
      return
    }
    const dt = frame.delta / 1000
    run.elapsed += frame.delta
    const previous = run.progress
    run.progress = sweepProgress(run.elapsed, Math.max(0, this.duration))
    this.content()?.style.setProperty('--_dissolve', run.progress.toFixed(4))
    this.shed(run, previous, run.progress)
    this.drift(run, dt, frame.time / 1000)
    this.paint(frame, run)

    if (!run.sweepDone && run.progress >= 1) {
      run.sweepDone = true
      if (this.collapse) this.closeUp(run)
    }
    if (run.sweepDone && run.collapseDone && run.particles.count === 0) {
      this.finishNow()
    }
  }

  /** Sheds the particles of the strip the edge uncovered between two frames. */
  private shed(run: Run, from: number, to: number): void {
    const [start, end] = uncoveredBand(from, to, DISSOLVE_EDGE)
    const wanted = (end - start) * run.budget + run.carry
    const count = Math.floor(wanted)
    run.carry = wanted - count
    const particles = run.particles
    const direction = this.direction
    const sweep = sweepVector(direction)
    for (let n = 0; n < count && particles.count < particles.x.length; n++) {
      const i = particles.count++
      const along = start + Math.random() * (end - start)
      const point = bandPoint(
        direction,
        along,
        Math.random(),
        run.width,
        run.height,
      )
      const speed = 25 + Math.random() * 85
      const side = (Math.random() - 0.5) * 50
      particles.x[i] = point.x
      particles.y[i] = point.y
      // Along the sweep, a little to either side, and rising like ash.
      particles.vx[i] = sweep.x * speed + sweep.y * side
      particles.vy[i] =
        sweep.y * speed +
        sweep.x * side -
        (sweep.y === 0 ? 15 + Math.random() * 45 : 0)
      particles.age[i] = 0
      particles.life[i] = 0.55 + Math.random() * (MAX_LIFE - 0.55)
      particles.size[i] = 1.3 + Math.random() * 2
      const color = particleColor(
        run.sample,
        point.x,
        point.y,
        run.width,
        run.height,
        Math.random(),
      )
      particles.color[i] = color === -1 ? 0 : color
    }
  }

  /** Moves every grain on by `dt` seconds and drops the ones that have faded. */
  private drift(run: Run, dt: number, time: number): void {
    const p = run.particles
    const noise = this.noise
    const sweep = sweepVector(this.direction)
    let write = 0
    for (let i = 0; i < p.count; i++) {
      const age = p.age[i] + dt
      if (age >= p.life[i]) continue
      // Wind along the sweep, and a slow swirl from smooth noise.
      const swirl = noise
        ? noise.noise3(p.x[i] * 0.012, p.y[i] * 0.012, time * 0.6)
        : 0
      const vx = p.vx[i] + (sweep.x * 90 + Math.cos(swirl * Math.PI) * 40) * dt
      const vy = p.vy[i] + (sweep.y * 90 + Math.sin(swirl * Math.PI) * 40) * dt
      p.x[write] = p.x[i] + vx * dt
      p.y[write] = p.y[i] + vy * dt
      p.vx[write] = vx
      p.vy[write] = vy
      p.age[write] = age
      p.life[write] = p.life[i]
      p.size[write] = p.size[i]
      p.color[write] = p.color[i]
      write++
    }
    p.count = write
  }

  private paint(frame: CanvasFrame, run: Run): void {
    const context = frame.context
    if (!context) return
    context.clearRect(0, 0, frame.width, frame.height)
    const rect = this.getBoundingClientRect()
    const p = run.particles
    const colors = run.sample.colors
    // One colour at a time, so the fill changes a dozen times, not a thousand.
    for (let c = 0; c < colors.length; c++) {
      context.fillStyle = colors[c]
      for (let i = 0; i < p.count; i++) {
        if (p.color[i] !== c) continue
        const t = p.age[i] / p.life[i]
        context.globalAlpha = (1 - t) * (1 - t * 0.3)
        const size = p.size[i] * (1 - t * 0.4)
        context.fillRect(
          rect.left + p.x[i] - size / 2,
          rect.top + p.y[i] - size / 2,
          size,
          size,
        )
      }
    }
    context.globalAlpha = 1
  }

  /** Closes the space the item took, with `collapse`. */
  private closeUp(run: Run): void {
    if (typeof this.animate !== 'function') {
      run.collapseDone = true
      return
    }
    const height = this.getBoundingClientRect().height
    const style = getComputedStyle(this)
    this.closing = this.animate(
      [
        {
          height: `${height}px`,
          marginTop: style.marginTop,
          marginBottom: style.marginBottom,
          overflow: 'clip',
        },
        {
          height: '0px',
          marginTop: '0px',
          marginBottom: '0px',
          overflow: 'clip',
        },
      ],
      {
        duration: COLLAPSE_DURATION,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      },
    )
    const done = (): void => {
      run.collapseDone = true
      // The particles may have finished first: end now instead of on a frame.
      if (this.run === run && run.particles.count === 0) this.finishNow()
    }
    this.closing.finished.then(done, done)
  }

  /** Ends the run that is in progress, wherever it is. */
  private finishNow(): void {
    const run = this.run
    if (!run) return
    this.run = null
    if (run.safety) clearTimeout(run.safety)
    this.hideCanvas()
    this.finalize(run.resolve, run.wasInert)
  }

  /** Stops a run without finishing it: no event, the item is left as it is. */
  private cancelRun(): void {
    const run = this.run
    if (!run) return
    this.run = null
    if (run.safety) clearTimeout(run.safety)
    this.hideCanvas()
    this.inert = run.wasInert
    this.removeAttribute('data-dissolving')
    run.resolve()
  }

  private hideCanvas(): void {
    this.loop.stop()
    const canvas = this.renderRoot.querySelector('canvas')
    const context = this.loop.context
    if (context && canvas) {
      context.save()
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.restore()
    }
    try {
      if (canvas?.matches(':popover-open')) canvas.hidePopover()
    } catch {
      // See begin().
    }
  }

  /** Marks the item gone, tells the page, and removes it with `remove-on-end`. */
  private finalize(resolve: () => void, wasInert: boolean): void {
    this.toggleAttribute('is-dissolved', true)
    this.removeAttribute('data-dissolving')
    // The animations held the end state; the attribute holds it from here.
    this.closing?.cancel()
    this.closing = null
    this.fade?.cancel()
    this.fade = null
    this.inertBefore = wasInert
    this.dispatchEvent(
      new CustomEvent('dissolveend', { bubbles: true, composed: true }),
    )
    if (this.removeOnEnd) this.remove()
    resolve()
  }

  protected override render() {
    return html`
      <div class="content" part="content"><slot></slot></div>
      <canvas part="canvas" popover="manual" aria-hidden="true"></canvas>
      <span class="color-probe"></span>
    `
  }
}

defineElement('moul-dissolve', MoulDissolve)

declare global {
  interface HTMLElementTagNameMap {
    'moul-dissolve': MoulDissolve
  }
}
