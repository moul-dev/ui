/**
 * Spotlight geometry shared by `<moul-tour>` and `<moul-focus-mode>`: a dim
 * layer over the viewport with a rounded hole cut around one element.
 *
 * The hole is a `clip-path: path(evenodd, …)` on the dim layer rather than an
 * SVG, so the area inside the hole is clipped out of hit testing too: clicks
 * there reach whatever is underneath.
 */
import type { AnimationPlaybackControls } from 'motion'
import { animate } from 'motion'
import { prefersReducedMotion } from '../../utils/motion'

/** The hole, in viewport pixels. */
export interface SpotRect {
  x: number
  y: number
  width: number
  height: number
  radius: number
}

export type SpotSide = 'top' | 'bottom' | 'left' | 'right'

/** The library's snappy spring (`SPRING_SNAPPY`), typed for a value animation. */
const SPOT_SPRING = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
  mass: 0.8,
} as const

const round = (value: number): number => Math.round(value * 100) / 100

/**
 * Path data for a `width` × `height` layer with `spot` cut out of it, to be
 * filled with the even-odd rule. With no spot (or an empty one) the layer is
 * whole.
 */
export function spotPath(
  width: number,
  height: number,
  spot: SpotRect | null,
): string {
  const outer = `M0 0H${round(width)}V${round(height)}H0Z`
  if (!spot || spot.width <= 0 || spot.height <= 0) return outer
  const x = round(spot.x)
  const y = round(spot.y)
  const right = round(spot.x + spot.width)
  const bottom = round(spot.y + spot.height)
  const r = round(
    Math.max(0, Math.min(spot.radius, spot.width / 2, spot.height / 2)),
  )
  return (
    `${outer}M${round(x + r)} ${y}H${round(right - r)}` +
    `A${r} ${r} 0 0 1 ${right} ${round(y + r)}V${round(bottom - r)}` +
    `A${r} ${r} 0 0 1 ${round(right - r)} ${bottom}H${round(x + r)}` +
    `A${r} ${r} 0 0 1 ${x} ${round(bottom - r)}V${round(y + r)}` +
    `A${r} ${r} 0 0 1 ${round(x + r)} ${y}Z`
  )
}

/** The `clip-path` value that dims the viewport around `spot`. */
export function spotClipPath(spot: SpotRect | null): string {
  const width = typeof window === 'undefined' ? 0 : window.innerWidth
  const height = typeof window === 'undefined' ? 0 : window.innerHeight
  return `path(evenodd, "${spotPath(width, height, spot)}")`
}

/**
 * The hole around `element`: its border box grown by `padding` on every side.
 * Null when there is no element or it has no box (`display: none`).
 */
export function measureSpot(
  element: Element | null,
  padding: number,
  radius: number,
): SpotRect | null {
  if (!element?.isConnected) return null
  const box = element.getBoundingClientRect()
  if (box.width <= 0 && box.height <= 0) return null
  return {
    x: box.left - padding,
    y: box.top - padding,
    width: box.width + padding * 2,
    height: box.height + padding * 2,
    radius,
  }
}

/** The whole viewport as a hole, so the dim layer covers nothing. */
export function viewportSpot(): SpotRect {
  return {
    x: 0,
    y: 0,
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
    radius: 0,
  }
}

/**
 * A length in pixels read from an element's computed `border-top-left-radius`,
 * so a corner radius can come from a token such as `--radius-xl`.
 */
export function readRadius(probe: Element | null | undefined): number {
  if (!probe || typeof getComputedStyle !== 'function') return 0
  const value = Number.parseFloat(getComputedStyle(probe).borderTopLeftRadius)
  return Number.isFinite(value) ? value : 0
}

/** A point at the centre of `spot`: where a hole grows from and shrinks to. */
function collapse(spot: SpotRect): SpotRect {
  return {
    x: spot.x + spot.width / 2,
    y: spot.y + spot.height / 2,
    width: 0,
    height: 0,
    radius: 0,
  }
}

function mix(from: SpotRect, to: SpotRect, progress: number): SpotRect {
  const at = (a: number, b: number) => a + (b - a) * progress
  return {
    x: at(from.x, to.x),
    y: at(from.y, to.y),
    width: Math.max(0, at(from.width, to.width)),
    height: Math.max(0, at(from.height, to.height)),
    radius: Math.max(0, at(from.radius, to.radius)),
  }
}

export interface SpotlightMoveOptions {
  /** Where to start instead of where the hole is now. */
  from?: SpotRect | null
  /** Jump instead of springing. */
  instant?: boolean
}

/**
 * Moves the hole: springs it from one rectangle to the next, lets a scroll or
 * resize retarget a move in flight, and jumps under reduced motion. `draw` is
 * called with each rectangle to show.
 */
export class Spotlight {
  /** The hole as last drawn. */
  public rect: SpotRect | null = null

  private from: SpotRect | null = null
  private to: SpotRect | null = null
  /** Where the move ends; null when it ends with no hole. */
  private end: SpotRect | null = null
  private controls: AnimationPlaybackControls | null = null
  private settle: (() => void) | null = null

  private readonly draw: (rect: SpotRect | null) => void

  constructor(draw: (rect: SpotRect | null) => void) {
    this.draw = draw
  }

  public get isMoving(): boolean {
    return this.controls !== null
  }

  /** Springs the hole to `next`; resolves when it arrives or another move cuts in. */
  public moveTo(
    next: SpotRect | null,
    { from, instant = false }: SpotlightMoveOptions = {},
  ): Promise<void> {
    this.stop()
    const start = from === undefined ? this.rect : from
    if (instant || prefersReducedMotion() || (!start && !next)) {
      this.set(next)
      return Promise.resolve()
    }
    // A missing end grows from, or shrinks to, a point at the other one's centre.
    this.from = start ?? collapse(next as SpotRect)
    this.to = next ?? collapse(start as SpotRect)
    this.end = next
    this.apply(this.from)
    const controls = animate(0, 1, {
      ...SPOT_SPRING,
      onUpdate: (progress: number) => {
        if (this.from && this.to) {
          this.apply(mix(this.from, this.to, progress))
        }
      },
    })
    this.controls = controls
    return new Promise<void>((resolve) => {
      this.settle = resolve
      controls.finished.then(
        () => {
          if (this.controls !== controls) return
          this.controls = null
          this.settle = null
          this.set(this.end)
          resolve()
        },
        () => {},
      )
    })
  }

  /**
   * Keeps the hole on a target that moved (scroll, resize): retargets a move
   * in flight, or redraws at once.
   */
  public follow(next: SpotRect | null): void {
    if (this.controls && next) {
      this.to = next
      this.end = next
      return
    }
    if (this.controls) return
    this.set(next)
  }

  /** Draws `rect` at once, stopping any move. */
  public set(rect: SpotRect | null): void {
    this.stop()
    this.apply(rect)
  }

  public stop(): void {
    this.controls?.stop()
    this.controls = null
    const settle = this.settle
    this.settle = null
    settle?.()
  }

  private apply(rect: SpotRect | null): void {
    this.rect = rect
    this.draw(rect)
  }
}

export interface CardPlacement {
  left: number
  top: number
  /** The side of the hole the card sits on; `center` when it is centred in the viewport. */
  side: SpotSide | 'center'
}

const OPPOSITE: Record<SpotSide, SpotSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

const AUTO_ORDER: SpotSide[] = ['bottom', 'top', 'right', 'left']

/**
 * Where a `card` box goes beside `spot` in a `view` box: on the preferred side
 * if it fits, else the opposite side, else any side that fits, else centred.
 * Along the side it is centred on the hole and kept `margin` inside the view.
 */
export function placeCard(
  spot: SpotRect | null,
  card: { width: number; height: number },
  view: { width: number; height: number },
  placement: SpotSide | 'auto' = 'auto',
  gap = 12,
  margin = 12,
): CardPlacement {
  const centred: CardPlacement = {
    left: Math.max(margin, (view.width - card.width) / 2),
    top: Math.max(margin, (view.height - card.height) / 2),
    side: 'center',
  }
  if (!spot) return centred

  const spotRight = spot.x + spot.width
  const spotBottom = spot.y + spot.height
  const fits: Record<SpotSide, boolean> = {
    bottom: spotBottom + gap + card.height <= view.height - margin,
    top: spot.y - gap - card.height >= margin,
    right: spotRight + gap + card.width <= view.width - margin,
    left: spot.x - gap - card.width >= margin,
  }
  const order =
    placement === 'auto'
      ? AUTO_ORDER
      : [
          placement,
          OPPOSITE[placement],
          ...AUTO_ORDER.filter(
            (side) => side !== placement && side !== OPPOSITE[placement],
          ),
        ]
  const side = order.find((candidate) => fits[candidate])
  if (!side) return centred

  const clamp = (value: number, size: number, extent: number) =>
    Math.min(Math.max(value, margin), Math.max(margin, extent - margin - size))
  if (side === 'top' || side === 'bottom') {
    return {
      side,
      left: clamp(
        spot.x + spot.width / 2 - card.width / 2,
        card.width,
        view.width,
      ),
      top: side === 'bottom' ? spotBottom + gap : spot.y - gap - card.height,
    }
  }
  return {
    side,
    top: clamp(
      spot.y + spot.height / 2 - card.height / 2,
      card.height,
      view.height,
    ),
    left: side === 'right' ? spotRight + gap : spot.x - gap - card.width,
  }
}
