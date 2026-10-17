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
