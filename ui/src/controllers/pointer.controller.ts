import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { prefersReducedMotion, watchReducedMotion } from '../utils/motion'

export type PointerEdge = 'top' | 'right' | 'bottom' | 'left'

export interface PointerState {
  /** Pointer offset from the target's left edge, in CSS pixels. */
  x: number
  /** Pointer offset from the target's top edge, in CSS pixels. */
  y: number
  /** 0 at the target's left edge, 1 at its right edge; past either edge it runs beyond 0 to 1. */
  ratioX: number
  /** 0 at the target's top edge, 1 at its bottom edge; past either edge it runs beyond 0 to 1. */
  ratioY: number
  /** Whether the pointer is over the target's box. */
  isInside: boolean
  /** The edge the pointer crossed when it last entered the target, or null before it has. */
  entryEdge: PointerEdge | null
  /** `mouse`, `pen` or `touch`, from the last pointer event; empty before the first one. */
  pointerType: string
}

export interface PointerControllerOptions {
  /**
   * Element whose box the position is measured against. Defaults to the host.
   * Resolved on every frame, so it can live in the host's shadow root.
   */
  target?: () => HTMLElement | null
  /** Element that receives the CSS variables. Defaults to the target. */
  styleTarget?: () => HTMLElement | null
  /**
   * `element` (default) follows the pointer only while it is over the host.
   * `window` follows it anywhere on the page, for effects that react to a
   * pointer that is near the element but not on it.
   */
  scope?: 'element' | 'window'
  /** Pointer types to follow. Defaults to every type. */
  pointerTypes?: readonly string[]
  /** Prefix for the CSS variables. Defaults to `--pointer`. */
  prefix?: string
  /** Called once per frame in which the pointer moved, after the variables are written. */
  onFrame?: (state: PointerState) => void
  /** Ask the host to re-render when the pointer enters or leaves the target. Defaults to false. */
  updateOnEnterLeave?: boolean
  /**
   * Keep following the pointer when the user asks for reduced motion.
   * Defaults to false: the variables rest at the centre of the target and
   * `onFrame` stops until the setting is turned off.
   */
  trackWhenReducedMotion?: boolean
}

/**
 * Follows the pointer over an element and writes its position as CSS
 * variables, at most once per animation frame, so effects such as a
 * spotlight, a tilt or a magnifier can be written in CSS:
 *
 * - `--pointer-x`, `--pointer-y`: offset from the target's top-left corner, in `px`.
 * - `--pointer-ratio-x`, `--pointer-ratio-y`: the same offset as a fraction of
 *   the target's width and height, unitless.
 *
 * The variables are not written until the pointer first moves, so give every
 * `var()` a fallback (`var(--pointer-x, 50%)`). Movement never re-renders the
 * host; read `state` or pass `onFrame` for script-driven effects.
 */
export class PointerController implements ReactiveController {
  public readonly state: PointerState = {
    x: 0,
    y: 0,
    ratioX: 0.5,
    ratioY: 0.5,
    isInside: false,
    entryEdge: null,
    pointerType: '',
  }

  private readonly host: ReactiveControllerHost & HTMLElement
  private readonly options: PointerControllerOptions
  private frame = 0
  private clientX = 0
  private clientY = 0
  private hasPointer = false
  private isReduced = false
  private stopWatchingMotion: (() => void) | null = null

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.accepts(event)) return
    this.clientX = event.clientX
    this.clientY = event.clientY
    this.hasPointer = true
    this.state.pointerType = event.pointerType
    this.schedule()
  }

  private readonly handlePointerLeave = (event: PointerEvent): void => {
    if (!this.accepts(event)) return
    this.hasPointer = false
    this.schedule()
  }

  private readonly handleScroll = (): void => {
    // The page moved under a pointer that did not: the offset changed.
    if (this.hasPointer) this.schedule()
  }

  private readonly flush = (): void => {
    this.frame = 0
    if (this.isReduced && !this.options.trackWhenReducedMotion) return
    const target = this.resolveTarget()
    if (!target) return

    const rect = target.getBoundingClientRect()
    const x = this.clientX - rect.left
    const y = this.clientY - rect.top
    const wasInside = this.state.isInside
    const isInside =
      this.hasPointer && x >= 0 && y >= 0 && x <= rect.width && y <= rect.height

    this.state.x = x
    this.state.y = y
    this.state.ratioX = rect.width > 0 ? x / rect.width : 0.5
    this.state.ratioY = rect.height > 0 ? y / rect.height : 0.5
    this.state.isInside = isInside
    if (isInside && !wasInside) {
      this.state.entryEdge = closestEdge(x, y, rect.width, rect.height)
    }

    if (this.hasPointer) this.write(target)
    this.options.onFrame?.(this.state)
    if (this.options.updateOnEnterLeave && isInside !== wasInside) {
      this.host.requestUpdate()
    }
  }

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: PointerControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    this.host.addController(this)
  }

  public hostConnected(): void {
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      if (isReduced && !this.options.trackWhenReducedMotion) this.rest()
      else if (this.hasPointer) this.schedule()
    })

    const source = this.listenTarget()
    source?.addEventListener(
      'pointermove',
      this.handlePointerMove as EventListener,
      {
        passive: true,
      },
    )
    if (this.options.scope !== 'window') {
      this.host.addEventListener('pointerleave', this.handlePointerLeave)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handleScroll, {
        passive: true,
        capture: true,
      })
    }
  }

  public hostDisconnected(): void {
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.listenTarget()?.removeEventListener(
      'pointermove',
      this.handlePointerMove as EventListener,
    )
    this.host.removeEventListener('pointerleave', this.handlePointerLeave)
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll, { capture: true })
    }
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
    this.hasPointer = false
    this.state.isInside = false
  }

  /** The names of the variables this controller writes, for use in styles and tests. */
  public get properties(): {
    x: string
    y: string
    ratioX: string
    ratioY: string
  } {
    const prefix = this.options.prefix ?? '--pointer'
    return {
      x: `${prefix}-x`,
      y: `${prefix}-y`,
      ratioX: `${prefix}-ratio-x`,
      ratioY: `${prefix}-ratio-y`,
    }
  }

  private accepts(event: PointerEvent): boolean {
    const types = this.options.pointerTypes
    return !types || types.includes(event.pointerType)
  }

  private listenTarget(): EventTarget | null {
    if (this.options.scope === 'window') {
      return typeof window === 'undefined' ? null : window
    }
    return this.host
  }

  private resolveTarget(): HTMLElement | null {
    return this.options.target ? this.options.target() : this.host
  }

  private resolveStyleTarget(target: HTMLElement): HTMLElement {
    return this.options.styleTarget?.() ?? target
  }

  private schedule(): void {
    if (this.frame || typeof requestAnimationFrame !== 'function') return
    this.frame = requestAnimationFrame(this.flush)
  }

  private write(target: HTMLElement): void {
    const style = this.resolveStyleTarget(target).style
    const names = this.properties
    style.setProperty(names.x, `${round(this.state.x)}px`)
    style.setProperty(names.y, `${round(this.state.y)}px`)
    style.setProperty(names.ratioX, String(round(this.state.ratioX, 4)))
    style.setProperty(names.ratioY, String(round(this.state.ratioY, 4)))
  }

  /** Parks the variables at the centre of the target, where a still effect looks neutral. */
  private rest(): void {
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
    const target = this.resolveTarget()
    if (!target) return
    const rect = target.getBoundingClientRect()
    this.state.x = rect.width / 2
    this.state.y = rect.height / 2
    this.state.ratioX = 0.5
    this.state.ratioY = 0.5
    this.write(target)
  }
}

/** The edge of a `width` × `height` box nearest to the point (`x`, `y`). */
export function closestEdge(
  x: number,
  y: number,
  width: number,
  height: number,
): PointerEdge {
  const distances: Array<[PointerEdge, number]> = [
    ['top', y],
    ['right', width - x],
    ['bottom', height - y],
    ['left', x],
  ]
  let nearest = distances[0]
  for (const entry of distances) {
    if (entry[1] < nearest[1]) nearest = entry
  }
  return nearest[0]
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
