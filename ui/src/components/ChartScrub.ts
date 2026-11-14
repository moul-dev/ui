import { css, type ReactiveController, type ReactiveControllerHost } from 'lit'
import type { PointHoverEntry } from './ChartCommon'

export interface ChartScrubOptions {
  /** How many columns (x categories) the chart has. */
  count(): number
  /** The x of column `index`, in SVG user units. */
  xAt(index: number): number
  /** The SVG viewBox size, to turn client pixels into user units. */
  viewSize(): { width: number; height: number }
  /**
   * Called whenever the pointer or a key moves the scrub, and with `null` when
   * it stops. `pointerY` is the pointer's height in user units, or `null` when
   * a key moved it, so the chart can pick the series nearest the pointer.
   */
  onChange(index: number | null, pointerY: number | null): void
}

/**
 * Scrubbing for the category charts (`moul-area-chart`, `moul-line-chart`),
 * the chart-sized twin of `moul-stat`'s sparkline: the pointer snaps to the
 * nearest column, and the plot is one tab stop exposed as a `role="slider"`
 * whose arrow keys step through the columns. The chart renders the guide,
 * the dots and the slider attributes from `index`; this controller only
 * decides which column is active.
 */
export class ChartScrubController implements ReactiveController {
  /** The scrubbed column, or `null` when nothing is scrubbed. */
  public index: number | null = null

  private readonly host: ReactiveControllerHost
  private readonly options: ChartScrubOptions

  constructor(host: ReactiveControllerHost, options: ChartScrubOptions) {
    this.host = host
    this.options = options
    host.addController(this)
  }

  public hostDisconnected(): void {
    this.index = null
  }

  /** Moves the scrub to `index` (clamped), or stops it with `null`. */
  public set(index: number | null, pointerY: number | null = null): void {
    const count = this.options.count()
    const next =
      index === null || count === 0
        ? null
        : Math.min(Math.max(Math.round(index), 0), count - 1)
    if (next === this.index && pointerY === null) return
    this.index = next
    this.host.requestUpdate()
    this.options.onChange(next, pointerY)
  }

  /** The column nearest to user-unit `x`. */
  public nearest(x: number): number | null {
    const count = this.options.count()
    let best: number | null = null
    let distance = Number.POSITIVE_INFINITY
    for (let i = 0; i < count; i++) {
      const d = Math.abs(this.options.xAt(i) - x)
      if (d < distance) {
        distance = d
        best = i
      }
    }
    return best
  }

  /** Snaps to the column under the pointer; touch scrubs horizontally and scrolls vertically (`touch-action: pan-y`). */
  public readonly handlePointer = (event: PointerEvent): void => {
    const el = event.currentTarget as HTMLElement | null
    const rect = el?.getBoundingClientRect()
    if (!rect?.width || !rect.height) return
    const view = this.options.viewSize()
    const x = ((event.clientX - rect.left) * view.width) / rect.width
    const y = ((event.clientY - rect.top) * view.height) / rect.height
    const index = this.nearest(x)
    if (index !== null) this.set(index, y)
  }

  public readonly handleLeave = (): void => {
    this.set(null)
  }

  /** Keyboard focus (not a click) shows the latest column, the one `aria-valuenow` already names. */
  public readonly handleFocus = (event: FocusEvent): void => {
    if (this.index !== null) return
    let isKeyboard = false
    try {
      isKeyboard = (event.currentTarget as Element).matches(':focus-visible')
    } catch {
      isKeyboard = false
    }
    if (isKeyboard) this.set(this.options.count() - 1)
  }

  /** Arrow keys step through the columns from the latest one; Home and End jump; Escape stops. */
  public readonly handleKeydown = (event: KeyboardEvent): void => {
    const count = this.options.count()
    if (!count) return
    if (event.key === 'Escape') {
      if (this.index === null) return
      event.preventDefault()
      this.set(null)
      return
    }
    const current = this.index ?? count - 1
    const steps: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowDown: current - 1,
      ArrowRight: current + 1,
      ArrowUp: current + 1,
      Home: 0,
      End: count - 1,
    }
    const next = steps[event.key]
    if (next === undefined) return
    event.preventDefault()
    this.set(next)
  }
}

/** The column's reading as one sentence, e.g. "Mar: Desktop 237, Mobile 120" (just "Mar: 237" for one series). */
export function scrubValueText(
  label: string,
  entries: PointHoverEntry[],
  format: (value: unknown) => string,
): string {
  const values =
    entries.length === 1
      ? format(entries[0]?.value)
      : entries
          .map((entry) => `${entry.name} ${format(entry.value)}`)
          .join(', ')
  return label ? `${label}: ${values}` : values
}

/** Where a point sits in the plot, as percentages, so overlays track the SVG at any scale. */
export function plotPosition(
  x: number,
  y: number,
  view: { width: number; height: number },
): string {
  const left = view.width > 0 ? (x / view.width) * 100 : 0
  const top = view.height > 0 ? (y / view.height) * 100 : 0
  return `left: ${left.toFixed(3)}%; top: ${top.toFixed(3)}%`
}

/**
 * The scrub guide, dots and focus ring. The scrub container is the element
 * with `data-scrub`; it must be `position: relative` and match the SVG's box.
 */
export const chartScrubStyles = css`
  [data-scrub] {
    outline: none;
    /* Horizontal drags scrub; vertical ones still scroll the page. */
    touch-action: pan-y;
    -webkit-user-select: none;
    user-select: none;
    border-radius: var(--radius-md, 0.5rem);
  }

  /* Inset, so a host that clips its overflow still shows it. */
  [data-scrub]:focus-visible {
    box-shadow: inset 0 0 0 2px var(--color-focus, currentColor);
  }

  .scrub-guide,
  .scrub-dot {
    position: absolute;
    pointer-events: none;
    opacity: 0;
    transition:
      opacity var(--duration-fast, 150ms) var(--ease-smooth, ease),
      left 90ms var(--ease-out, ease-out),
      top 90ms var(--ease-out, ease-out);
  }

  [data-scrub][data-active] .scrub-guide,
  [data-scrub][data-active] .scrub-dot {
    opacity: 1;
  }

  /* Positions use physical sides: time runs left to right in every writing direction. */
  .scrub-guide {
    width: 1px;
    translate: -50% 0;
    background-image: repeating-linear-gradient(
      to bottom,
      color-mix(in oklch, var(--color-muted, currentColor) 70%, transparent) 0 3px,
      transparent 3px 7px
    );
  }

  .scrub-dot {
    width: 0.625rem;
    height: 0.625rem;
    translate: -50% -50%;
    border-radius: var(--radius-full, 9999px);
    background-color: var(--_scrub-color, currentColor);
    box-shadow: 0 0 0 2px var(--color-surface, transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    .scrub-guide,
    .scrub-dot {
      transition: none;
    }
  }
`
