import { html, LitElement, type PropertyValues } from 'lit'
import {
  PointerController,
  type PointerState,
} from '../../controllers/pointer.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { magneticStyles } from './Magnetic.styles'

const DEFAULT_STRENGTH = 0.3
const DEFAULT_REACH = 40

const POINTER_PREFIX = '--_magnetic-pointer'

export interface MagneticOffset {
  /** Horizontal drift in pixels; positive is toward the right. */
  x: number
  /** Vertical drift in pixels; positive is down. */
  y: number
  /** How strongly the pointer pulls, 0 (out of reach) to 1 (over the box). */
  pull: number
}

/**
 * How far a box drifts toward a pointer at (`x`, `y`), measured from the
 * box's top-left corner. Over the box the pull is full; past its edge it
 * fades smoothly to nothing over `reach` pixels, so the box never jumps as
 * the pointer comes into reach.
 */
export function magneticOffset(
  x: number,
  y: number,
  width: number,
  height: number,
  strength: number,
  reach: number,
): MagneticOffset {
  const dx = x - width / 2
  const dy = y - height / 2
  const outX = Math.max(0, Math.abs(dx) - width / 2)
  const outY = Math.max(0, Math.abs(dy) - height / 2)
  const outside = Math.hypot(outX, outY)
  let pull: number
  if (outside === 0) pull = 1
  else if (reach <= 0 || outside >= reach) pull = 0
  else {
    const t = 1 - outside / reach
    pull = t * t * (3 - 2 * t)
  }
  return { x: dx * strength * pull, y: dy * strength * pull, pull }
}

/**
 * Wraps one button or link and pulls it toward the pointer, as if the
 * pointer were a magnet: once the pointer comes within `reach` pixels of the
 * control it drifts after it by `strength` of the distance, and when the
 * pointer moves away it springs back to its place. The pull fades in
 * smoothly over the reach, so the control never jumps. The drift is also
 * written as `--magnetic-x` and `--magnetic-y`, so a label or an icon inside
 * the control can follow a little further for depth. Only a mouse or a pen
 * pulls; on a touch screen the control stays put. The control moves by a
 * transform alone, and the space it takes in the layout never changes. It
 * lives in the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. Focus goes
 * straight to the wrapped control, which keeps its own name and role, and
 * nothing moves when it is focused or pressed from the keyboard.
 *
 * Reduced motion: the control stays in its place and does not follow the
 * pointer.
 *
 * @slot - The one button or link to pull.
 *
 * @csspart body - The wrapper that drifts; it holds the control.
 *
 * @cssprop --magnetic-x - Written by the element: the horizontal drift, in `px`. Use it inside the control to move a label further.
 * @cssprop --magnetic-y - Written by the element: the vertical drift, in `px`.
 * @cssprop --magnetic-duration - How long the control takes to spring back. Defaults to `700ms`.
 */
export class MoulMagnetic extends LitElement {
  static override styles = magneticStyles

  static override properties = {
    strength: { type: Number },
    reach: { type: Number },
  }

  /** The share of the distance to the pointer the control drifts, 0 to 1. Defaults to 0.3. */
  declare strength: number
  /** How far past the control's edge, in pixels, the pointer still pulls. Defaults to 40. */
  declare reach: number

  private isReduced = false
  private stopWatchingMotion: (() => void) | null = null
  private resizeObserver: ResizeObserver | null = null
  /** The host's resting size, measured lazily and dropped when it resizes. */
  private size: { width: number; height: number } | null = null
  /** The last drift written, so an unchanged one is not written again. */
  private written = ''

  constructor() {
    super()
    this.strength = DEFAULT_STRENGTH
    this.reach = DEFAULT_REACH
    // The pointer can pull from outside the box, so it is followed page-wide.
    new PointerController(this, {
      scope: 'window',
      pointerTypes: ['mouse', 'pen'],
      prefix: POINTER_PREFIX,
      // The controller always writes the pointer position as variables. The
      // drift is all this element needs, so they go to an unrendered probe,
      // where a write restyles nothing.
      styleTarget: () => this.probeEl,
      onFrame: this.handlePointerFrame,
    })
  }

  /** Whether the pointer is pulling the control right now. */
  public get isPulled(): boolean {
    return this.bodyEl?.classList.contains('is-active') ?? false
  }

  private get probeEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('.probe') ?? null
  }

  private get bodyEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('[part="body"]') ?? null
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      if (isReduced) this.release()
    })
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(() => {
        this.size = null
      })
      this.resizeObserver.observe(this)
    }
    document.addEventListener('pointerout', this.handleDocumentPointerOut)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    document.removeEventListener('pointerout', this.handleDocumentPointerOut)
    this.size = null
    this.release()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('strength')) {
      const value = Number(this.strength)
      this.strength = Number.isFinite(value)
        ? Math.min(1, Math.max(0, value))
        : DEFAULT_STRENGTH
    }
    if (changed.has('reach')) {
      const value = Number(this.reach)
      this.reach = Number.isFinite(value) && value >= 0 ? value : DEFAULT_REACH
    }
  }

  /** The pointer left the window: let go. */
  private readonly handleDocumentPointerOut = (event: PointerEvent): void => {
    if (!event.relatedTarget) this.release()
  }

  private readonly handlePointerFrame = (state: PointerState): void => {
    if (this.isReduced) return
    if (!this.size) {
      const rect = this.getBoundingClientRect()
      this.size = { width: rect.width, height: rect.height }
    }
    const offset = magneticOffset(
      state.x,
      state.y,
      this.size.width,
      this.size.height,
      this.strength,
      this.reach,
    )
    this.write(offset.x, offset.y, offset.pull > 0)
  }

  private release(): void {
    this.write(0, 0, false)
  }

  private write(x: number, y: number, isActive: boolean): void {
    const body = this.bodyEl
    if (!body) return
    const key = `${round(x)}|${round(y)}|${isActive}`
    if (key === this.written) return
    this.written = key
    body.style.setProperty('--magnetic-x', `${round(x)}px`)
    body.style.setProperty('--magnetic-y', `${round(y)}px`)
    body.classList.toggle('is-active', isActive)
  }

  protected override render() {
    return html`<span part="body" class="body"><slot></slot></span
      ><span class="probe" hidden></span>`
  }
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}

defineElement('moul-magnetic', MoulMagnetic)

declare global {
  interface HTMLElementTagNameMap {
    'moul-magnetic': MoulMagnetic
  }
}
