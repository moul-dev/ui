# Project: Phase 8 — Category 1: Charts & Data Visualization Rebuild

## Architecture
Category 1 — Charts & Data Visualization comprises 10 custom elements and shared helpers built on Lit 3, `d3-scale`, `d3-shape`, and `motion`.
- All custom elements inherit from `LitElement` and use `resetStyles` from `ui/src/styles/reset.styles.ts`.
- Pure D3 math computes scales, curves, and arcs without external chart wrapper libraries.
- CSS Custom Property Tokens `--color-chart-1` through `--color-chart-8` from `ui/src/styles/style.css` style all data series.
- Idempotent element registration via `defineElement` from `ui/src/utils/define-element.ts`.
- Responsive viewport measurement via `LayoutIndicatorController` with `observeDimensions: true`.
- Tooltip coordination via native Popover API (`popover="manual"`) and `OverlayPresenceController`.
- KPI and count animations via `NumberSpringController`.
- Transitions animated with `subtleAnimate`, `CHART_EASE`, `SPRING_SNAPPY`, and `SPRING_GENTLE`, respecting `prefersReducedMotion()`.
- Zero dependencies or imports on React, React Aria, StyleX, Recharts, or `@lit/react`.

## Feature Inventory
Every feature identified during survey is inventoried below with assigned milestone.
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | `moul-chart-container` | Responsive viewport, header/empty/legend slots, LayoutIndicatorController, dispatches viewport-resize | M1 | `rdt/design.md` §8.1 |
| 2 | `moul-chart-tooltip` | Popover API tooltip, coordinates positioning, series color/value formatting | M1 | `rdt/design.md` §8.1 |
| 3 | `ChartCommon.ts` | Shared types (`ChartSeries`, `DoughnutDataItem`, `TopListItem`, `PointHoverDetail`) and `getChartColor` helper | M1 | `rdt/design.md` §8.1 |
| 4 | `moul-line-chart` | D3 line generator, curveMonotoneX, multi-series SVG paths, hover circles, point-hover dispatch | M2 | `rdt/design.md` §8.1 |
| 5 | `moul-area-chart` | D3 area generator, linearGradient fills, stacked/unstacked support, stroke path, point-hover dispatch | M2 | `rdt/design.md` §8.1 |
| 6 | `moul-bar-chart` | D3 scaleBand & scaleLinear, horizontal & vertical layouts, grouped/stacked bars, point-hover dispatch | M3 | `rdt/design.md` §8.1 |
| 7 | `moul-doughnut-chart` | D3 pie & arc generators, inner-radius-ratio, center label/slot, slice hover expansion | M3 | `rdt/design.md` §8.1 |
| 8 | `moul-top-list` | Ranked items list, proportional progress bars, item-press event dispatch, custom valueFormatter | M3 | `rdt/design.md` §8.1 |
| 9 | `moul-stat` | Metric KPI card, NumberSpringController animated ticker, trend badge, semantic tones & variants | M4 | `rdt/design.md` §8.1 |
| 10 | `moul-percentage-bar` | Linear progress bar, 0–100 clamping, role="progressbar", semantic tones | M4 | `rdt/design.md` §8.1 |
| 11 | `moul-percentage-circle` | SVG circular arc progress ring, stroke-dashoffset animation, center label slot | M4 | `rdt/design.md` §8.1 |
| 12 | `ui/src/index.ts` Exports | Export all 10 component classes, interfaces, and augment `HTMLElementTagNameMap` | M5 | `ORIGINAL_REQUEST.md` |
| 13 | `ui/src/components/Charts.test.ts` | 11 comprehensive test suites in Vitest + happy-dom covering all components and acceptance criteria | M5 | `ORIGINAL_REQUEST.md` |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Chart Container & Tooltip Foundation | `ChartCommon.ts`, `moul-chart-container`, `moul-chart-tooltip` | None | DONE |
| M2 | Continuous Coordinate Charts | `moul-line-chart`, `moul-area-chart` | M1 | IN_PROGRESS |
| M3 | Discrete & Categorical Charts | `moul-bar-chart`, `moul-doughnut-chart`, `moul-top-list` | M1 | PLANNED |
| M4 | Companion & Micro Indicators | `moul-stat`, `moul-percentage-bar`, `moul-percentage-circle` | None | PLANNED |
| M5 | Integration, Exports & Full Test Suite | Barrel exports in `ui/src/index.ts`, `Charts.test.ts`, zero-React & lint verification | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### `ChartCommon.ts`
```ts
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
export function getChartColor(index: number): string
```

### Event Contracts
- `moul-chart-container` emits `viewport-resize`: `{ detail: { width: number, height: number, breakpoint: string } }`
- `moul-line-chart`, `moul-area-chart`, `moul-bar-chart`, `moul-doughnut-chart` emit `point-hover`: `{ detail: PointHoverDetail }`
- `moul-top-list` emits `item-press`: `{ detail: { item: TopListItem, index: number } }`

## Code Layout
```
ui/src/components/
├── ChartCommon.ts
├── ChartContainer/
│   ├── ChartContainer.ts
│   └── ChartContainer.styles.ts
├── ChartTooltip/
│   ├── ChartTooltip.ts
│   └── ChartTooltip.styles.ts
├── LineChart/
│   ├── LineChart.ts
│   └── LineChart.styles.ts
├── AreaChart/
│   ├── AreaChart.ts
│   └── AreaChart.styles.ts
├── BarChart/
│   ├── BarChart.ts
│   └── BarChart.styles.ts
├── DoughnutChart/
│   ├── DoughnutChart.ts
│   └── DoughnutChart.styles.ts
├── TopList/
│   ├── TopList.ts
│   └── TopList.styles.ts
├── Stat/
│   ├── Stat.ts
│   └── Stat.styles.ts
├── Percentage/
│   ├── PercentageBar.ts
│   ├── PercentageCircle.ts
│   └── Percentage.styles.ts
└── Charts.test.ts
```
