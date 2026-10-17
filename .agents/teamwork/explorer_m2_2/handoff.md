# Handoff Report: Complete Implementation Blueprint for `moul-area-chart`

**Agent**: `explorer_m2_2`  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_2`  
**Milestone**: Phase 8 Milestone 2 (Continuous Coordinate Charts: Area Chart)  
**Date**: 2026-10-17  

---

## 1. Observation

### 1.1 Authoritative Requirement Sources
1. **`ORIGINAL_REQUEST.md` (Lines 221–266, Phase 8 Requirements)**:
   - "Implement `moul-chart-container`, `moul-chart-tooltip`, `moul-line-chart`, `moul-area-chart`, `moul-bar-chart`, `moul-doughnut-chart`, `moul-top-list`, `moul-stat`, `moul-percentage-bar`, and `moul-percentage-circle` as Lit Web Components, registered via idempotent `defineElement` under the `moul-` prefix, with zero React/Recharts dependencies." (Line 231)
   - "Generate SVG geometries using `d3-scale` and `d3-shape` without third-party chart wrappers, styling chart series with `--color-chart-1` through `--color-chart-8` CSS design tokens." (Line 234)
   - "When data is null, undefined, or empty `[]`, `<slot name="empty">` is rendered instead of chart geometries." (Line 260)
   - "Line and Area charts render valid SVG `<path>` elements using D3 curves and project coordinates with D3 scales." (Line 253)

2. **`orchestrator_phase8_1/PROJECT.md` (Lines 23, 44–72, 92–95)**:
   - Line 23: "`moul-area-chart`: D3 area generator, linearGradient fills, stacked/unstacked support, stroke path, point-hover dispatch".
   - Line 45–50: `ChartSeries` interface: `{ key: string; name?: string; color?: string; strokeWidth?: number }`.
   - Line 63–70: `PointHoverDetail` interface: `{ point?: Record<string, unknown>; series?: ChartSeries | string; value: unknown; label: string; x: number; y: number }`.
   - Line 76: "`moul-line-chart`, `moul-area-chart`, `moul-bar-chart`, `moul-doughnut-chart` emit `point-hover`: `{ detail: PointHoverDetail }`".
   - Line 92–95: File structure: `ui/src/components/AreaChart/AreaChart.ts` and `AreaChart.styles.ts`.

3. **`spec_miner_survey_1/handoff.md` (Section 2.2 #4, Lines 239–256)**:
   - Tag: `moul-area-chart`, Class: `MoulAreaChart`.
   - Properties:
     - `data`: `Record<string, unknown>[] = []` (`attribute: false`)
     - `xKey`: `string = 'name'` (attribute `x-key`)
     - `series`: `ChartSeries[] = []` (`attribute: false`)
     - `height`: `number = 300` (attribute `height`, type `Number`)
     - `stacked`: `boolean = false` (attribute `stacked`, type `Boolean`)
     - `showGrid`: `boolean = true` (attribute `show-grid`, type `Boolean`)
     - `valueFormatter`: `((value: any) => string) | undefined` (`attribute: false`)
   - D3 Pipeline:
     - When `stacked` is true: Computes cumulative baseline offsets per category across series.
     - `areaGenerator = area<Record<string, unknown>>().x(d => xScale(...)).y0(d => yScale(y0)).y1(d => yScale(y1)).curve(curveMonotoneX)`.
     - SVG `<defs><linearGradient id="..."><stop offset="0%" stop-opacity="0.25" /><stop offset="100%" stop-opacity="0" /></linearGradient></defs>`.
     - Top boundary stroke generated via `line<Record<string, unknown>>()`.
   - Motion: Area `<path>` + fill opacity animated `[0, 1]` over `350ms` with `CHART_EASE` via `subtleAnimate`.

4. **Legacy Component Audit (`ui/src/components/AreaChart/`)**:
   - `AreaChart.tsx` (lines 1–159): Legacy React component importing `react`, `recharts`, and `@stylexjs/stylex`. Violates zero-React dependency rule.
   - `AreaChart.styles.ts` (lines 1–9): Legacy StyleX stylesheet using `stylex.create({ wrapper: { width: '100%', position: 'relative' } })`.
   - `index.ts` (lines 1–3): Exports `AreaChartProps` and `AreaChart`.

5. **Monorepo Shared Foundations**:
   - `ui/src/components/ChartCommon.ts`: Exports `ChartSeries`, `PointHoverDetail`, `getChartColor(index: number): string`.
   - `ui/src/styles/reset.styles.ts`: Exports shared Lit CSS `resetStyles`.
   - `ui/src/utils/motion.ts`: Exports `CHART_EASE`, `prefersReducedMotion()`, `subtleAnimate()`.
   - `ui/src/utils/define-element.ts`: Exports idempotent `defineElement(tagName, ctor)`.
   - `ui/src/controllers/layout-indicator.controller.ts`: Exports `LayoutIndicatorController` observing host width and height with `observeDimensions: true`.

---

## 2. Logic Chain

1. **Element Lifecycle & Custom Element Registration**:
   - `MoulAreaChart` extends `LitElement`.
   - It is registered via `defineElement('moul-area-chart', MoulAreaChart)` in `ui/src/components/AreaChart/AreaChart.ts`.
   - The TypeScript global declaration augments `HTMLElementTagNameMap`:
     ```ts
     declare global {
       interface HTMLElementTagNameMap {
         'moul-area-chart': MoulAreaChart
       }
     }
     ```
   - For backwards compatibility and barrel export convenience, `export { MoulAreaChart, MoulAreaChart as AreaChart }` is exported from `index.ts`.

2. **Responsive Viewport Integration**:
   - In fluid dashboards and layouts, chart width depends on parent containers (such as `moul-chart-container` or flexbox grids).
   - `MoulAreaChart` instantiates `new LayoutIndicatorController(this, { observeDimensions: true })`.
   - It falls back gracefully to `this.layout.width || 500` and `this.height || 300` when rendered in non-layout DOM environments (e.g., Happy-DOM unit tests before `triggerResize`), avoiding `NaN` or divide-by-zero errors.

3. **D3 Mathematical Pipeline & Stacking Algorithm**:
   - **X Domain & Scale**:
     - Categories are extracted from `data.map(d => String(d[xKey] ?? ''))`.
     - `xScale = scalePoint<string>().domain(categories).range([padding.left, width - padding.right])`.
     - When single data point exists (`categories.length === 1`), `scalePoint` projects the coordinate to the midpoint of the range.
   - **Y Domain & Scale**:
     - Unstacked mode (`stacked = false`):
       - Each series starts from baseline 0: `y0 = 0`, `y1 = val`.
       - Min/Max scanned across all individual series values: `domainMin = minY < 0 ? minY : 0`, `domainMax = maxY > 0 ? maxY : 1`.
     - Stacked mode (`stacked = true`):
       - For each category index `i` across data items, cumulative baseline accumulators track running sums:
         - Positive values: `posBaselines[i]` accumulates upwards: `y0 = posBaselines[i]`, `y1 = posBaselines[i] + val`, `posBaselines[i] += val`.
         - Negative values: `negBaselines[i]` accumulates downwards: `y0 = negBaselines[i]`, `y1 = negBaselines[i] + val`, `negBaselines[i] += val`.
       - Min/Max scanned across cumulative baselines: `domainMin = min(0, ...negBaselines)`, `domainMax = max(1, ...posBaselines)`.
     - Safeguard: If `domainMin === domainMax`, `domainMax = domainMin + 1` to prevent divide-by-zero in `scaleLinear`.
     - `yScale = scaleLinear().domain([domainMin, domainMax]).range([height - padding.bottom, padding.top]).nice()`.
   - **D3 Shape Area and Boundary Stroke**:
     - `areaGen = area<Point>().x(p => xScale(p.xVal) ?? padding.left).y0(p => yScale(p.y0)).y1(p => yScale(p.y1)).curve(curveMonotoneX)`.
     - `lineGen = line<Point>().x(p => xScale(p.xVal) ?? padding.left).y(p => yScale(p.y1)).curve(curveMonotoneX)`.
     - Fallback for single data point (`points.length === 1`): constructs valid deterministic SVG path starting with `'M'` without failing.

4. **SVG Defs & Linear Gradient Fills**:
   - For each series `s` at index `idx`:
     - Series color is determined by `s.color ?? getChartColor(idx)`.
     - Instance-unique gradient ID: `area-grad-${this.chartId}-${s.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`.
     - SVG `<defs>` block defines `<linearGradient id="..." x1="0" y1="0" x2="0" y2="1">` with `<stop offset="0%" stop-color="${color}" stop-opacity="0.25" />` and `<stop offset="100%" stop-color="${color}" stop-opacity="0" />`.
     - Area `<path>` references `fill="url(#${gradId})"`.
     - Upper boundary stroke `<path>` renders `stroke="${color}" stroke-width="${s.strokeWidth ?? 2}" fill="none"`.

5. **Interactive Data Point Hover**:
   - Each data point renders a visual `<circle class="point-marker">` and an enlarged interactive hit area `<circle class="point-hit-target">` with `cursor="pointer"`.
   - On `pointerenter`, dispatches `CustomEvent<PointHoverDetail>('point-hover', { bubbles: true, composed: true, detail: { point: rawData, series: s, value: rawVal, label: xVal, x: cx, y: cy } })`.
   - On `pointerleave`, dispatches `CustomEvent('point-leave', { bubbles: true, composed: true })`.

6. **Empty State Gating**:
   - If `!data || !Array.isArray(data) || data.length === 0`:
     - Component renders `<div part="empty" class="empty-state"><slot name="empty"></slot></div>`.
     - Bypasses SVG rendering, D3 generator calls, and scale calculations completely.

7. **Motion & Accessibility**:
   - On initial render and updates to `data`, `series`, or `stacked`, calls `animateAreaPaths()`.
   - Animates area and stroke paths with `subtleAnimate(paths, { opacity: [0, 1] }, { duration: 0.35, ease: CHART_EASE })`.
   - If `prefersReducedMotion()` is true, `subtleAnimate` automatically collapses duration to 0, immediately rendering static geometry.

8. **Shadow DOM Styles**:
   - `AreaChart.styles.ts` exports `areaChartStyles: CSSResultGroup = [resetStyles, css`...`]` composing `resetStyles`.
   - Styles use CSS custom properties (`--color-border-subtle`, `--color-fg-subtle`, `--color-bg`, `--font-size-xs`, `--font-family-base`).
   - Zero React or StyleX imports.

---

## 3. Caveats

1. **Legacy React File Deletion**:
   - `ui/src/components/AreaChart/AreaChart.tsx` must be removed when the worker implements the new Lit files, or else `scripts/verify-no-react.ts` will fail on the existing `recharts` and `@stylexjs/stylex` imports.
2. **Happy-DOM Element Dimensions**:
   - In Happy-DOM test environments, `host.getBoundingClientRect()` defaults to zero until `triggerResize` is invoked. The component's fallback width `this.layout.width || 500` ensures initial renders produce valid SVG viewBox and path geometries during tests prior to resize triggers.
3. **Stacked Mode with Negative Values**:
   - The algorithm splits positive and negative cumulative baselines (`posBaselines` and `negBaselines`). This prevents negative values from canceling positive stacks, correctly matching D3 stack semantics.

---

## 4. Conclusion & Complete Implementation Blueprint

### 4.1 Target File 1: `ui/src/components/AreaChart/AreaChart.styles.ts`

```ts
import { css, type CSSResultGroup } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const areaChartStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      position: relative;
      user-select: none;
    }

    .chart-container {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .chart-svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .grid-line {
      stroke: var(--color-border-subtle, oklch(0.84 0 0));
      stroke-dasharray: 3 3;
      stroke-width: 1;
    }

    .axis-label {
      fill: var(--color-fg-subtle, oklch(0.42 0 0));
      font-size: var(--font-size-xs, 0.75rem);
      font-family: var(--font-family-base, inherit);
    }

    .axis-label-x {
      text-anchor: middle;
      dominant-baseline: hanging;
    }

    .axis-label-y {
      text-anchor: end;
      dominant-baseline: central;
    }

    .area-path {
      pointer-events: none;
    }

    .stroke-path {
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      pointer-events: none;
    }

    .point-marker {
      stroke: var(--color-bg, #ffffff);
      stroke-width: 2;
      transition: r 150ms ease, transform 150ms ease;
    }

    .point-hit-target {
      fill: transparent;
      cursor: pointer;
    }

    .point-hit-target:hover + .point-marker,
    .point-marker:hover {
      r: 6;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      min-height: 200px;
    }
  `,
]

export default areaChartStyles
```

---

### 4.2 Target File 2: `ui/src/components/AreaChart/AreaChart.ts`

```ts
import { scaleLinear, scalePoint } from 'd3-scale'
import { area, curveMonotoneX, line } from 'd3-shape'
import { html, LitElement, type PropertyValues } from 'lit'

import { LayoutIndicatorController } from '../../controllers/layout-indicator.controller'
import { defineElement } from '../../utils/define-element'
import { CHART_EASE, prefersReducedMotion, subtleAnimate } from '../../utils/motion'
import { type ChartSeries, getChartColor, type PointHoverDetail } from '../ChartCommon'
import { areaChartStyles } from './AreaChart.styles'

export interface AreaChartPointData {
  xVal: string
  rawVal: number
  y0: number
  y1: number
  rawData: Record<string, unknown>
}

export class MoulAreaChart extends LitElement {
  static override styles = areaChartStyles

  static override properties = {
    data: { attribute: false },
    xKey: { type: String, attribute: 'x-key' },
    series: { attribute: false },
    height: { type: Number },
    stacked: { type: Boolean },
    showGrid: { type: Boolean, attribute: 'show-grid' },
    valueFormatter: { attribute: false },
  }

  declare data: Record<string, unknown>[]
  declare xKey: string
  declare series: ChartSeries[]
  declare height: number
  declare stacked: boolean
  declare showGrid: boolean
  declare valueFormatter?: (value: any) => string

  public layout: LayoutIndicatorController

  private chartId = Math.random().toString(36).slice(2, 9)

  constructor() {
    super()
    this.data = []
    this.xKey = 'name'
    this.series = []
    this.height = 300
    this.stacked = false
    this.showGrid = true
    this.valueFormatter = undefined

    this.layout = new LayoutIndicatorController(this, {
      observeDimensions: true,
    })
  }

  public get hasData(): boolean {
    return Array.isArray(this.data) && this.data.length > 0
  }

  public get effectiveSeries(): ChartSeries[] {
    if (Array.isArray(this.series) && this.series.length > 0) {
      return this.series
    }
    if (!this.hasData) {
      return []
    }
    const first = this.data[0]
    if (!first) return []
    return Object.keys(first)
      .filter((k) => k !== this.xKey && typeof first[k] === 'number')
      .map((k, idx) => ({
        key: k,
        name: k,
        color: getChartColor(idx),
      }))
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (
      changedProps.has('data') ||
      changedProps.has('series') ||
      changedProps.has('stacked')
    ) {
      this.animateAreaPaths()
    }
  }

  private animateAreaPaths(): void {
    if (prefersReducedMotion()) return

    const areaPaths = this.renderRoot.querySelectorAll('.area-path')
    const strokePaths = this.renderRoot.querySelectorAll('.stroke-path')

    if (areaPaths.length > 0) {
      subtleAnimate(
        areaPaths,
        { opacity: [0, 1] },
        { duration: 0.35, ease: CHART_EASE },
      )
    }
    if (strokePaths.length > 0) {
      subtleAnimate(
        strokePaths,
        { opacity: [0, 1] },
        { duration: 0.35, ease: CHART_EASE },
      )
    }
  }

  private handlePointHover(
    point: AreaChartPointData,
    s: ChartSeries,
    x: number,
    y: number,
    _event: PointerEvent,
  ): void {
    const detail: PointHoverDetail = {
      point: point.rawData,
      series: s,
      value: point.rawVal,
      label: point.xVal,
      x,
      y,
    }

    this.dispatchEvent(
      new CustomEvent<PointHoverDetail>('point-hover', {
        bubbles: true,
        composed: true,
        detail,
      }),
    )
  }

  private handlePointLeave(): void {
    this.dispatchEvent(
      new CustomEvent('point-leave', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  protected override render() {
    if (!this.hasData) {
      return html`
        <div part="empty" class="empty-state">
          <slot name="empty"></slot>
        </div>
      `
    }

    const seriesList = this.effectiveSeries
    if (seriesList.length === 0) {
      return html`
        <div part="empty" class="empty-state">
          <slot name="empty"></slot>
        </div>
      `
    }

    const width = this.layout.width > 0 ? this.layout.width : 500
    const height = this.height > 0 ? this.height : 300

    const padding = {
      top: 16,
      right: 16,
      bottom: 28,
      left: 40,
    }

    // X Scale
    const xCategories = this.data.map((d) => String(d[this.xKey] ?? ''))
    const xScale = scalePoint<string>()
      .domain(xCategories)
      .range([padding.left, width - padding.right])

    // Accumulators for stacked mode
    const posBaselines = new Array(this.data.length).fill(0)
    const negBaselines = new Array(this.data.length).fill(0)

    // Build series points
    const seriesPointsList: {
      series: ChartSeries
      color: string
      gradId: string
      points: AreaChartPointData[]
    }[] = []

    let minY = 0
    let maxY = 0

    seriesList.forEach((s, sIdx) => {
      const color = s.color ?? getChartColor(sIdx)
      const gradId = `area-grad-${this.chartId}-${s.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`
      const points: AreaChartPointData[] = []

      this.data.forEach((d, i) => {
        const xVal = String(d[this.xKey] ?? '')
        const raw = d[s.key]
        const val =
          typeof raw === 'number' && Number.isFinite(raw)
            ? raw
            : Number(raw) || 0

        let y0 = 0
        let y1 = 0

        if (this.stacked) {
          if (val >= 0) {
            y0 = posBaselines[i]
            y1 = posBaselines[i] + val
            posBaselines[i] += val
          } else {
            y0 = negBaselines[i]
            y1 = negBaselines[i] + val
            negBaselines[i] += val
          }
        } else {
          y0 = 0
          y1 = val
        }

        minY = Math.min(minY, y0, y1)
        maxY = Math.max(maxY, y0, y1)

        points.push({
          xVal,
          rawVal: val,
          y0,
          y1,
          rawData: d,
        })
      })

      seriesPointsList.push({
        series: s,
        color,
        gradId,
        points,
      })
    })

    // Y Scale domain bounds
    let domainMin = minY < 0 ? minY : 0
    let domainMax = maxY > 0 ? maxY : 1
    if (domainMin === domainMax) {
      domainMax = domainMin + 1
    }

    const yScale = scaleLinear()
      .domain([domainMin, domainMax])
      .range([height - padding.bottom, padding.top])
      .nice()

    // Area & Line Generators
    const areaGen = area<AreaChartPointData>()
      .x((p) => xScale(p.xVal) ?? padding.left)
      .y0((p) => yScale(p.y0))
      .y1((p) => yScale(p.y1))
      .curve(curveMonotoneX)

    const lineGen = line<AreaChartPointData>()
      .x((p) => xScale(p.xVal) ?? padding.left)
      .y((p) => yScale(p.y1))
      .curve(curveMonotoneX)

    const yTicks = yScale.ticks(5)

    return html`
      <div
        part="container"
        class="chart-container"
        style="height: ${height}px;"
        @pointerleave=${this.handlePointLeave}
      >
        <svg
          part="svg"
          class="chart-svg"
          viewBox="0 0 ${width} ${height}"
          preserveAspectRatio="none"
        >
          <defs>
            ${seriesPointsList.map(
              (item) => html`
                <linearGradient
                  id="${item.gradId}"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stop-color="${item.color}"
                    stop-opacity="0.25"
                  ></stop>
                  <stop
                    offset="100%"
                    stop-color="${item.color}"
                    stop-opacity="0"
                  ></stop>
                </linearGradient>
              `,
            )}
          </defs>

          <!-- Grid Lines and Y-Axis Labels -->
          ${
            this.showGrid
              ? html`
                <g part="grid" class="grid-group">
                  ${yTicks.map(
                    (tick) => html`
                      <line
                        class="grid-line"
                        x1="${padding.left}"
                        y1="${yScale(tick)}"
                        x2="${width - padding.right}"
                        y2="${yScale(tick)}"
                      ></line>
                      <text
                        class="axis-label axis-label-y"
                        x="${padding.left - 8}"
                        y="${yScale(tick)}"
                      >
                        ${
                          this.valueFormatter
                            ? this.valueFormatter(tick)
                            : String(tick)
                        }
                      </text>
                    `,
                  )}
                </g>
              `
              : ''
          }

          <!-- X-Axis Labels -->
          <g part="x-axis" class="axis-group-x">
            ${xCategories.map(
              (cat) => html`
                <text
                  class="axis-label axis-label-x"
                  x="${xScale(cat) ?? padding.left}"
                  y="${height - padding.bottom + 8}"
                >
                  ${cat}
                </text>
              `,
            )}
          </g>

          <!-- Area Paths and Boundary Lines -->
          <g part="series" class="series-group">
            ${seriesPointsList.map((item) => {
              let areaPathD = areaGen(item.points) ?? ''
              let strokePathD = lineGen(item.points) ?? ''

              // Single point fallback: deterministic M path
              if (item.points.length === 1) {
                const pt = item.points[0]
                const px = xScale(pt.xVal) ?? padding.left
                const pyTop = yScale(pt.y1)
                const pyBot = yScale(pt.y0)
                areaPathD = `M ${px - 2} ${pyBot} L ${px - 2} ${pyTop} L ${px + 2} ${pyTop} L ${px + 2} ${pyBot} Z`
                strokePathD = `M ${px - 2} ${pyTop} L ${px + 2} ${pyTop}`
              }

              return html`
                <g class="series-layer" data-series="${item.series.key}">
                  <path
                    class="area-path"
                    part="area"
                    d="${areaPathD}"
                    fill="url(#${item.gradId})"
                  ></path>
                  <path
                    class="stroke-path"
                    part="stroke"
                    d="${strokePathD}"
                    stroke="${item.color}"
                    stroke-width="${item.series.strokeWidth ?? 2}"
                    fill="none"
                  ></path>
                </g>
              `
            })}
          </g>

          <!-- Interactive Data Points -->
          <g part="points" class="points-group">
            ${seriesPointsList.map((item) =>
              item.points.map((pt) => {
                const cx = xScale(pt.xVal) ?? padding.left
                const cy = yScale(pt.y1)
                return html`
                  <g class="point-group">
                    <circle
                      class="point-marker"
                      part="point"
                      cx="${cx}"
                      cy="${cy}"
                      r="4"
                      fill="${item.color}"
                    ></circle>
                    <circle
                      class="point-hit-target"
                      cx="${cx}"
                      cy="${cy}"
                      r="14"
                      @pointerenter=${(e: PointerEvent) =>
                        this.handlePointHover(
                          pt,
                          item.series,
                          cx,
                          cy,
                          e,
                        )}
                      @pointerleave=${this.handlePointLeave}
                    ></circle>
                  </g>
                `
              }),
            )}
          </g>
        </svg>
      </div>
    `
  }
}

defineElement('moul-area-chart', MoulAreaChart)

export { MoulAreaChart as AreaChart }

declare global {
  interface HTMLElementTagNameMap {
    'moul-area-chart': MoulAreaChart
  }
}
```

---

### 4.3 Target File 3: `ui/src/components/AreaChart/index.ts`

```ts
export type { AreaChartPointData } from './AreaChart'
export { MoulAreaChart, MoulAreaChart as AreaChart } from './AreaChart'
```

---

## 5. Verification Method

Once implemented by the worker agent, verify the implementation via the following independent checks:

1. **Verify Registration & HTMLElementTagNameMap**:
   ```ts
   import './components/AreaChart/AreaChart'
   import { MoulAreaChart } from './components/AreaChart/AreaChart'

   expect(customElements.get('moul-area-chart')).toBe(MoulAreaChart)
   const el = document.createElement('moul-area-chart')
   expect(el instanceof MoulAreaChart).toBe(true)
   ```

2. **Verify SVG Area and Boundary Stroke Path Generation**:
   Mount `<moul-area-chart>` with test data:
   ```ts
   const chart = await mount<MoulAreaChart>(html`
     <moul-area-chart
       .data=${[
         { month: 'Jan', desktop: 100, mobile: 50 },
         { month: 'Feb', desktop: 150, mobile: 80 },
       ]}
       .series=${[
         { key: 'desktop', name: 'Desktop' },
         { key: 'mobile', name: 'Mobile' },
       ]}
     ></moul-area-chart>
   `)
   const areaPaths = chart.shadowRoot?.querySelectorAll('.area-path')
   expect(areaPaths?.length).toBe(2)
   expect(areaPaths?.[0].getAttribute('d')?.startsWith('M')).toBe(true)
   ```

3. **Verify Gradient Defs and Opacity**:
   ```ts
   const gradients = chart.shadowRoot?.querySelectorAll('linearGradient')
   expect(gradients?.length).toBe(2)
   const stops = gradients?.[0].querySelectorAll('stop')
   expect(stops?.[0].getAttribute('stop-opacity')).toBe('0.25')
   expect(stops?.[1].getAttribute('stop-opacity')).toBe('0')
   ```

4. **Verify Stacked Mode Calculation**:
   Mount with `stacked = true` vs `stacked = false`:
   ```ts
   const unstacked = await mount<MoulAreaChart>(html`
     <moul-area-chart
       .data=${[{ month: 'Jan', a: 10, b: 20 }]}
       .series=${[{ key: 'a' }, { key: 'b' }]}
     ></moul-area-chart>
   `)
   const stacked = await mount<MoulAreaChart>(html`
     <moul-area-chart
       .data=${[{ month: 'Jan', a: 10, b: 20 }]}
       .series=${[{ key: 'a' }, { key: 'b' }]}
       .stacked=${true}
     ></moul-area-chart>
   `)
   ```
   Inspect marker `cy` coordinates: In stacked mode, series `b`'s `cy` must be shifted upward (smaller `cy` value in SVG space) compared to unstacked mode.

5. **Verify Point Hover Custom Event**:
   ```ts
   let hoverDetail: PointHoverDetail | null = null
   chart.addEventListener('point-hover', ((e: CustomEvent<PointHoverDetail>) => {
     hoverDetail = e.detail
   }) as EventListener)

   const hitTarget = chart.shadowRoot?.querySelector<SVGCircleElement>('.point-hit-target')
   hitTarget?.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, composed: true }))
   expect(hoverDetail).not.toBeNull()
   expect(hoverDetail?.label).toBe('Jan')
   ```

6. **Verify Empty State Gating**:
   ```ts
   const emptyChart = await mount<MoulAreaChart>(html`
     <moul-area-chart .data=${[]}>
       <div slot="empty">No Data</div>
     </moul-area-chart>
   `)
   expect(emptyChart.shadowRoot?.querySelector('svg')).toBeNull()
   expect(emptyChart.shadowRoot?.querySelector('slot[name="empty"]')).not.toBeNull()
   ```

7. **Verify Zero React & Package Cleanliness**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected outcome*: Exit code 0, 0 banned React packages.

8. **Verify Linter**:
   ```bash
   bun run lint
   ```
   *Expected outcome*: 0 errors.
