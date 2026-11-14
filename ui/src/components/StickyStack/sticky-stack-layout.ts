/**
 * The scroll arithmetic behind `moul-sticky-stack`, kept free of the DOM so
 * it can be tested without layout.
 *
 * Scroll positions are measured as `offset`: how far the host's top edge has
 * travelled above the top of the visible area, in pixels (negative while the
 * host is still below it). Progress is the host's native view timeline, 0 as
 * its top edge comes into view and 1 as its bottom edge leaves:
 * `progress = (offset + port) / (port + hostHeight)`.
 */

/** One child of the stack, measured in its normal-flow place. */
export interface StackChildBox {
  /** Distance from the host's top edge to the child's top edge, ignoring `position: sticky`. */
  top: number
  /** The child's layout height, which a `scale` never changes. */
  height: number
  /** The child's resolved sticky `top`, in pixels from the top of the visible area. */
  stuck: number
}

export interface StackRange {
  /** The offset at which the child sticks. */
  stick: number
  /** The offset at which the next child starts to slide over this one. */
  start: number
  /** `start` as view-timeline progress. */
  from: number
  /** 1 / (progress from `start` to the moment the last child sticks); 0 when the child never shrinks. */
  span: number
  /** 0 for the child on top of the pile, 1 for the one at the bottom; how far it shrinks and dims. */
  depth: number
}

/** A covered child whose shrink would have no length jumps to its end instead. */
const STEP_SPAN = 10_000

export function stackRanges(
  children: readonly StackChildBox[],
  port: number,
  hostHeight: number,
): StackRange[] {
  const count = children.length
  const travel = port + hostHeight
  const toProgress = (offset: number): number =>
    travel > 0 ? (offset + port) / travel : 0
  const sticks = children.map((child) => child.top - child.stuck)
  const end = count > 0 ? sticks[count - 1] : 0

  return children.map((child, index) => {
    const depth = count > 1 ? (count - 1 - index) / (count - 1) : 0
    const next = children[index + 1]
    // The next child's top edge meets this one's bottom edge while this one is stuck.
    const start = next ? next.top - child.height - child.stuck : sticks[index]
    const from = toProgress(start)
    const to = toProgress(end)
    let span = 0
    if (depth > 0) span = to - from > 1e-6 ? 1 / (to - from) : STEP_SPAN
    return {
      stick: sticks[index],
      start,
      from: round(from),
      span: round(span),
      depth: round(depth),
    }
  })
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000
}
