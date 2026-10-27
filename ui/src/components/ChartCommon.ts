export interface ChartSeries {
  key: string
  name?: string
  color?: string
  strokeWidth?: number
}

export interface DoughnutDataItem {
  name: string
  value: number
  color?: string
  [key: string]: unknown
}

export interface TopListItem {
  label: string
  value: number
  color?: string
  [key: string]: unknown
}

export interface HeatmapDataItem {
  /** A day (`'2025-10-24'`), a timestamp, or a `Date`. Date-only strings are read as local days. */
  date: string | number | Date
  /** Defaults to 1, so a list of raw events counts itself. */
  value?: number
  [key: string]: unknown
}

export interface FunnelStage {
  label: string
  value: number
  color?: string
  [key: string]: unknown
}

export interface PointHoverDetail {
  point?: Record<string, unknown>
  series?: ChartSeries | string
  value: unknown
  label: string
  x: number
  y: number
}

export const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
  'var(--color-chart-8)',
] as const

export function getChartColor(index: number): string {
  const step = (((index % 8) + 8) % 8) + 1
  return `var(--color-chart-${step})`
}

/**
 * Places a chart hover card (see `chartHoverCardStyles`) centered above `anchor`,
 * in the coordinates of `frame`, its offset parent. The card is clamped to the
 * frame's edges and flips below the anchor when there's no room above.
 */
export function placeHoverCard(
  card: HTMLElement,
  frame: HTMLElement,
  anchor: DOMRect,
  gap = 8,
): void {
  const box = frame.getBoundingClientRect()
  const width = card.offsetWidth
  const height = card.offsetHeight
  const center = anchor.left + anchor.width / 2 - box.left
  const x = Math.min(
    Math.max(center - width / 2, 0),
    Math.max(box.width - width, 0),
  )
  const above = anchor.top - box.top - gap - height
  const y = above >= 0 ? above : anchor.bottom - box.top + gap
  card.style.translate = `${Math.round(x)}px ${Math.round(y)}px`
}
