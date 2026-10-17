# Implementation Blueprint: `moul-line-chart` (`MoulLineChart`)

**Investigator**: `explorer_m2_1`  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_1`  
**Target Component**: `moul-line-chart` (`ui/src/components/LineChart/LineChart.ts` & `LineChart.styles.ts`)  
**Date**: 2026-10-17  

---

## 1. Observation

### 1.1 Direct Specification Citations

1. **`ORIGINAL_REQUEST.md` (Lines 221–266)**:
   > "Implement Phase 8 of the design specification: Rebuild Category 1 — Charts & Data Visualization (7 Components + 2 Companions) as Lit Web Components powered by `d3-scale`, `d3-shape`, and `motion`."  
   > - **R1. Chart Components & Companions Rebuild**: Implement `moul-line-chart` ... as Lit Web Components, registered via idempotent `defineElement` under the `moul-` prefix, with zero React/Recharts dependencies.  
   > - **R2. SVG Geometry & Color Token Mapping**: Generate SVG geometries using `d3-scale` and `d3-shape` without third-party chart wrappers, styling chart series with `--color-chart-1` through `--color-chart-8` CSS design tokens.  
   > - **R3. Responsive Viewports, Empty States & Micro-Animations**: Render `<slot name="empty">` when data is missing or empty. Animate SVG path/geometry transitions with `motion` (duration 200–500ms, respecting `prefers-reduced-motion: reduce`).  
   > - **R4. Data Point Tooltip Interaction**: Open and position `moul-chart-tooltip` via pointer interaction over chart data points.  
   > - **R5. Verification Test Suite**: Unit and integration tests in `ui/src/components/Charts.test.ts`.

2. **`orchestrator_phase8_1/PROJECT.md` (Lines 22, 43–72, 80–112)**:
   > - Feature 4: `moul-line-chart` — D3 line generator, curveMonotoneX, multi-series SVG paths, hover circles, point-hover dispatch (Milestone 2).
   > - Shared interfaces in `ChartCommon.ts`: `ChartSeries` (`key`, `name?`, `color?`, `strokeWidth?`), `PointHoverDetail` (`point?`, `series?`, `value`, `label`, `x`, `y`), and `getChartColor(index: number): string`.
   > - Event contract: `moul-line-chart` emits `point-hover: { detail: PointHoverDetail }`.
   > - Code layout: `ui/src/components/LineChart/LineChart.ts` and `LineChart.styles.ts`.

3. **`spec_miner_survey_1/handoff.md` (Section 2.2 #3, Lines 216–238; Section 1.3 Edge Cases 5–8)**:
   > - Class `MoulLineChart` extending `LitElement`, registered as `moul-line-chart`.
   > - Properties: `data: Record<string, unknown>[] = []`, `xKey: string = 'name'`, `series: ChartSeries[] = []`, `height: number = 300`, `showGrid: boolean = true`, `curve: string = 'monotoneX'`, `valueFormatter?: (value: any) => string`.
   > - D3 pipeline:
   >   - `xScale = scalePoint().domain(data.map(d => String(d[xKey]))).range([paddingLeft, width - paddingRight])`
   >   - `yScale = scaleLinear().domain([minY <= 0 ? minY : 0, maxY || 1]).range([height - paddingBottom, paddingTop]).nice()`
   >   - `lineGenerator = line<Record<string, unknown>>().x(d => xScale(String(d[xKey])) ?? 0).y(d => yScale(Number(d[s.key])) ?? 0).curve(curveMonotoneX)`
   > - Edge Cases:
   >   - Single data point (`data.length === 1`): Renders single coordinate point `<circle>` without `NaN` in SVG path string.
   >   - All identical Y values (e.g. all 0 or all 100): Domain automatically expanded to avoid division by zero.
   >   - Negative values: Y-axis scale domain adjusts to `[minVal, maxVal]` with baseline at appropriate Y position.
   >   - Series color wrapping: Modulo 8 palette across `var(--color-chart-1)` through `var(--color-chart-8)`.
   > - Motion: SVG `<path>` morphs/draws over `350ms` using `CHART_EASE` via `subtleAnimate`.
   > - Empty state: When `!data || data.length === 0`, renders `<slot name="empty"></slot>`.

4. **Existing Codebase State**:
   - `ui/src/components/ChartCommon.ts`: Exports `ChartSeries`, `PointHoverDetail`, `CHART_COLORS`, `getChartColor(index: number)`.
   - `ui/src/utils/motion.ts`: Exports `CHART_EASE = [0.22, 1, 0.36, 1]`, `subtleAnimate`, `prefersReducedMotion`.
   - `ui/src/styles/reset.styles.ts`: Exports `resetStyles` Lit CSSResultGroup.
   - `ui/src/utils/define-element.ts`: Exports idempotent `defineElement(tagName, ctor)`.
   - `ui/src/controllers/layout-indicator.controller.ts`: Exports `LayoutIndicatorController`.
   - Legacy files `ui/src/components/LineChart/LineChart.tsx` and `LineChart.styles.ts` contain banned React/StyleX/Recharts dependencies (`import * as stylex from '@stylexjs/stylex'`, `from 'recharts'`).
   - Milestone 1 tests currently pass 100% (21/21 tests in `Charts.test.ts`).
   - Linter (`biome check`) passes with 0 errors on existing components.
   - `verify-no-react.ts all` exits with code 0.

---

## 2. Logic Chain

### 2.1 Component Architecture & Registration
- The component must extend `LitElement` and be registered idempotently via `defineElement('moul-line-chart', MoulLineChart)` from `../../utils/define-element`.
- To enable TypeScript DOM autocomplete and type checking, `HTMLElementTagNameMap` is augmented with `'moul-line-chart': MoulLineChart`.
- Class alias export `export { MoulLineChart as LineChart }` ensures ergonomic module imports.

### 2.2 Property Definitions & Reflection
Consistent with `MoulChartContainer` and Lit 3 standards without decorator dependencies:
- `data`: `{ attribute: false }`, typed as `Record<string, unknown>[]`, default `[]`.
- `xKey`: `{ type: String, attribute: 'x-key' }`, default `'name'`.
- `series`: `{ attribute: false }`, typed as `ChartSeries[]`, default `[]`.
- `height`: `{ type: Number }`, default `300`.
- `showGrid`: `{ type: Boolean, attribute: 'show-grid' }`, default `true`.
- `curve`: `{ type: String }`, default `'monotoneX'`.
- `valueFormatter`: `{ attribute: false }`, typed as `((value: any) => string) | undefined`, default `undefined`.

### 2.3 Viewport Sizing & Responsive Integration
- `MoulLineChart` incorporates `LayoutIndicatorController(this, { observeDimensions: true })`.
- Effective width calculation: `this.layout.width > 0 ? this.layout.width : (this.clientWidth > 0 ? this.clientWidth : 600)`.
- Effective height calculation: `this.height > 0 ? this.height : 300`.
- This ensures deterministic behavior across environments (real browser, flex/grid container, `triggerResize`, or `happy-dom` before measurement).
- SVG `<svg>` renders with `viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet"`.

### 2.4 D3 Pipeline & Domain Safeguards
The coordinate pipeline uses `scalePoint` and `scaleLinear` from `d3-scale`, and `line` from `d3-shape`.

1. **Empty State Safeguard**:
   - If `!this.data || !Array.isArray(this.data) || this.data.length === 0`:
     Early return rendering:
     ```html
     <div part="empty" class="empty-state">
       <slot name="empty">
         <p class="empty-message">No data available</p>
       </slot>
     </div>
     ```
   - No SVG or D3 computations are executed when data is absent.

2. **Series Resolution**:
   - If `this.series && this.series.length > 0`, use `this.series`.
   - If `this.series` is empty `[]`, automatically extract series from numeric keys present in `this.data[0]` (excluding `this.xKey`), assigning color via `getChartColor(index)`.

3. **X-Scale (`scalePoint`)**:
   - Domain: `this.data.map(d => String(d[this.xKey] ?? ''))`.
   - Range: `[padding.left, width - padding.right]`.
   - Padding bounds: `padding = { top: 20, right: 24, bottom: 32, left: 48 }`.
   - Single data point (`data.length === 1`): `scalePoint` returns the exact midpoint of the range without error.

4. **Y-Scale Domain Safeguards (`scaleLinear`)**:
   - Extract numeric values across all data items and active series:
     `const rawVal = Number(d[s.key])` where `!Number.isNaN(rawVal) && Number.isFinite(rawVal)`.
   - If no valid numbers exist: domain is `[0, 1]`.
   - Otherwise, `rawMinY = Math.min(...yValues)`, `rawMaxY = Math.max(...yValues)`.
   - **All-identical Y values safeguard**:
     - If `rawMinY === rawMaxY`:
       - If `rawMinY === 0`: `minY = 0, maxY = 1`.
       - If `rawMinY > 0`: `minY = 0, maxY = rawMaxY * 1.2`.
       - If `rawMinY < 0`: `minY = rawMinY * 1.2, maxY = 0`.
   - **Negative values safeguard**:
     - If `rawMinY < 0`: preserve negative `minY = rawMinY`, `maxY = Math.max(0, rawMaxY)`.
     - If `rawMinY >= 0`: start baseline at `minY = 0`, `maxY = rawMaxY || 1`.
   - Range: `[height - padding.bottom, padding.top]`.
   - Apply `.nice()` to generate clean human-readable tick intervals.

5. **Curve Factory**:
   - Maps `this.curve` to D3 curve generators:
     - `'monotoneX'` -> `curveMonotoneX` (default)
     - `'linear'` -> `curveLinear`
     - `'natural'` -> `curveNatural`
     - `'step'` -> `curveStep`
     - `'stepAfter'` -> `curveStepAfter`
     - `'stepBefore'` -> `curveStepBefore`

6. **Missing / Null Value Handling**:
   - `line.defined(d => { const val = d[s.key]; return val !== null && val !== undefined && !Number.isNaN(Number(val)); })` ensures gaps in data do not produce `NaN` path segments.

### 2.5 Multi-Series SVG Geometry & Grid Lines
- **Grid lines**: When `showGrid` is true:
  - Generate horizontal lines for `yScale.ticks(5)`:
    `<line class="grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" />`
  - Render Y-axis tick labels:
    `<text class="axis-tick y-tick" x="${padding.left - 8}" y="${y}">${formatted}</text>`
- **X-axis labels**:
  - For each point: `<text class="axis-tick x-tick" x="${x}" y="${height - padding.bottom + 18}">${label}</text>`
  - Baseline: `<line class="axis-line" x1="${padding.left}" y1="${yScale(0) ?? (height - padding.bottom)}" x2="${width - padding.right}" y2="${...}" />`
- **Series Paths**:
  - For each series `s` (index `idx`):
    `<path class="series-path" data-series-key="${s.key}" d="${pathD}" stroke="${s.color || getChartColor(idx)}" stroke-width="${s.strokeWidth ?? 2}" fill="none" />`
- **Interactive Points**:
  - For each data point `d` of series `s`:
    - Point marker circle: `<circle class="point-marker ${isActive ? 'is-active' : ''}" cx="${cx}" cy="${cy}" r="${isActive ? 6 : 4}" stroke="${strokeColor}" fill="var(--color-bg, #ffffff)" />`
    - Invisible hit area: `<circle class="point-hit" cx="${cx}" cy="${cy}" r="12" @pointerenter="${...}" @pointerleave="${...}" />`

### 2.6 Interactive Hover & Event Contracts
- On `pointerenter` on a data point:
  - Dispatches `CustomEvent<PointHoverDetail>('point-hover', { bubbles: true, composed: true, detail: { point: d, series: s, value: d[s.key], label: String(d[this.xKey] ?? ''), x: cx, y: cy } })`.
  - Sets internal `activePoint = { seriesKey: s.key, index: dIdx }` and requests update.
- On `pointerleave`:
  - Dispatches `CustomEvent('point-leave', { bubbles: true, composed: true })`.
  - Clears `activePoint = null` and requests update.

### 2.7 Motion & Accessibility
- In `updated(changedProperties)`:
  - When `data`, `series`, or `curve` changes:
    - Queries `.series-path` elements in `this.renderRoot`.
    - Invokes `subtleAnimate(path, { opacity: [0, 1] }, { duration: 0.35, ease: CHART_EASE })`.
    - `subtleAnimate` from `../../utils/motion` automatically inspects `prefersReducedMotion()`, collapsing duration to 0 when reduced motion is requested.

### 2.8 Styling & Design Tokens
- Pure Lit `css` composed with `resetStyles`:
  - No imports from React, React Aria, StyleX, or Recharts.
  - Full theme responsiveness via `var(--color-bg)`, `var(--color-fg)`, `var(--color-fg-subtle)`, `var(--color-border-subtle)`, `var(--color-chart-1)` through `var(--color-chart-8)`.

---

## 3. Caveats

1. **Test Environment Viewport Measurement (`happy-dom`)**:
   - In `happy-dom`, elements have `clientWidth = 0` and `clientHeight = 0` unless explicitly resized.
   - The blueprint specifies fallback dimensions `width = 600, height = 300` when unmeasured, and integrates `LayoutIndicatorController` so `triggerResize(element, { width: 800, height: 400 })` updates dynamically in tests.
2. **SVG Path Geometry in Headless Tests**:
   - `happy-dom` simulates SVG elements but does not calculate physical text glyph bounding boxes (`getBBox`). The SVG paths generated by `d3-shape` are pure mathematical strings (e.g. `M48,120C120,80...`) and can be asserted directly via `getAttribute('d')`.
3. **Legacy File Deprecation**:
   - The implementer must remove `ui/src/components/LineChart/LineChart.tsx` and replace `LineChart.styles.ts` to satisfy `verify-no-react.ts`.

---

## 4. Conclusion (Implementation Blueprint)

Here is the complete, production-ready implementation blueprint for `moul-line-chart`.

### 4.1 `ui/src/components/LineChart/LineChart.styles.ts`

```ts
import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const lineChartStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      position: relative;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      overflow: hidden;
    }

    .chart-svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .grid-line {
      stroke: var(--color-border-subtle, #e5e7eb);
      stroke-dasharray: 3 3;
      stroke-width: 1;
      shape-rendering: crispEdges;
    }

    .axis-line {
      stroke: var(--color-border-subtle, #e5e7eb);
      stroke-width: 1;
      shape-rendering: crispEdges;
    }

    .axis-tick {
      fill: var(--color-fg-subtle, #6b7280);
      font-size: 11px;
      font-family: var(--font-family-base, inherit);
      user-select: none;
    }

    .series-path {
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      pointer-events: stroke;
      transition: stroke-width 0.15s ease;
    }

    .point-marker {
      fill: var(--color-bg, #ffffff);
      cursor: pointer;
      transform-origin: center;
      transition: r 0.15s ease;
    }

    .point-marker:hover,
    .point-marker.is-active {
      r: 6;
    }

    .point-hit {
      fill: transparent;
      cursor: pointer;
    }

    [part="empty"],
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 200px;
      color: var(--color-fg-subtle, #6b7280);
      font-size: var(--font-size-sm, 0.875rem);
      padding: var(--spacing-8, 2rem) var(--spacing-4, 1rem);
      text-align: center;
    }

    .empty-message {
      margin: 0;
    }
  `,
]

export const styles = lineChartStyles
```

---

### 4.2 `ui/src/components/LineChart/LineChart.ts`

```ts
import { html, LitElement, type PropertyValues, svg } from 'lit'
import { scaleLinear, scalePoint } from 'd3-scale'
import {
  type CurveFactory,
  curveLinear,
  curveMonotoneX,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
  line,
} from 'd3-shape'

import { LayoutIndicatorController } from '../../controllers/layout-indicator.controller'
import { defineElement } from '../../utils/define-element'
import { CHART_EASE, subtleAnimate } from '../../utils/motion'
import {
  type ChartSeries,
  getChartColor,
  type PointHoverDetail,
} from '../ChartCommon'
import { lineChartStyles } from './LineChart.styles'

export interface ActivePointState {
  seriesKey: string
  index: number
}

function resolveCurveFactory(curveName: string): CurveFactory {
  switch (curveName) {
    case 'linear':
      return curveLinear
    case 'natural':
      return curveNatural
    case 'step':
      return curveStep
    case 'stepAfter':
      return curveStepAfter
    case 'stepBefore':
      return curveStepBefore
    case 'monotoneX':
    default:
      return curveMonotoneX
  }
}

export class MoulLineChart extends LitElement {
  static override styles = lineChartStyles

  static override properties = {
    data: { attribute: false },
    xKey: { type: String, attribute: 'x-key' },
    series: { attribute: false },
    height: { type: Number },
    showGrid: { type: Boolean, attribute: 'show-grid' },
    curve: { type: String },
    valueFormatter: { attribute: false },
  }

  declare data: Record<string, unknown>[]
  declare xKey: string
  declare series: ChartSeries[]
  declare height: number
  declare showGrid: boolean
  declare curve: string
  declare valueFormatter?: (value: any) => string

  public layout: LayoutIndicatorController
  private activePoint: ActivePointState | null = null

  constructor() {
    super()
    this.data = []
    this.xKey = 'name'
    this.series = []
    this.height = 300
    this.showGrid = true
    this.curve = 'monotoneX'
    this.valueFormatter = undefined

    this.layout = new LayoutIndicatorController(this, {
      observeDimensions: true,
    })
  }

  public get containerWidth(): number {
    return this.layout.width > 0
      ? this.layout.width
      : this.clientWidth > 0
        ? this.clientWidth
        : 600
  }

  public get containerHeight(): number {
    return this.height > 0 ? this.height : 300
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (
      changedProps.has('data') ||
      changedProps.has('series') ||
      changedProps.has('curve')
    ) {
      this.animatePaths()
    }
  }

  private animatePaths(): void {
    const paths =
      this.renderRoot?.querySelectorAll<SVGPathElement>('.series-path')
    if (paths && paths.length > 0) {
      paths.forEach((path) => {
        subtleAnimate(
          path,
          { opacity: [0, 1] },
          { duration: 0.35, ease: CHART_EASE },
        )
      })
    }
  }

  private getActiveSeries(): ChartSeries[] {
    if (this.series && this.series.length > 0) {
      return this.series
    }

    if (!this.data || this.data.length === 0) {
      return []
    }

    const firstItem = this.data[0] || {}
    return Object.keys(firstItem)
      .filter((key) => key !== this.xKey)
      .filter((key) => {
        const val = firstItem[key]
        return typeof val === 'number' || !Number.isNaN(Number(val))
      })
      .map((key, idx) => ({
        key,
        name: key,
        color: getChartColor(idx),
      }))
  }

  private handlePointEnter(
    _event: PointerEvent,
    item: Record<string, unknown>,
    seriesItem: ChartSeries,
    cx: number,
    cy: number,
    dIdx: number,
  ): void {
    this.activePoint = {
      seriesKey: seriesItem.key,
      index: dIdx,
    }
    this.requestUpdate()

    const rawValue = item[seriesItem.key]
    const label = String(item[this.xKey] ?? '')

    this.dispatchEvent(
      new CustomEvent<PointHoverDetail>('point-hover', {
        bubbles: true,
        composed: true,
        detail: {
          point: item,
          series: seriesItem,
          value: rawValue,
          label,
          x: cx,
          y: cy,
        },
      }),
    )
  }

  private handlePointLeave(_event: PointerEvent): void {
    this.activePoint = null
    this.requestUpdate()

    this.dispatchEvent(
      new CustomEvent('point-leave', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  protected override render() {
    // 1. Domain safeguard: empty data check
    if (!this.data || !Array.isArray(this.data) || this.data.length === 0) {
      return html`
        <div part="empty" class="empty-state">
          <slot name="empty">
            <p class="empty-message">No data available</p>
          </slot>
        </div>
      `
    }

    const width = this.containerWidth
    const height = this.containerHeight
    const padding = { top: 20, right: 24, bottom: 32, left: 48 }
    const activeSeriesList = this.getActiveSeries()

    // 2. X-Scale (scalePoint)
    const xLabels = this.data.map((d) => String(d[this.xKey] ?? ''))
    const xScale = scalePoint<string>()
      .domain(xLabels)
      .range([padding.left, width - padding.right])

    // 3. Y-Scale Domain Safeguards
    const yValues: number[] = []
    for (const d of this.data) {
      for (const s of activeSeriesList) {
        const raw = d[s.key]
        if (raw !== null && raw !== undefined) {
          const num = Number(raw)
          if (!Number.isNaN(num) && Number.isFinite(num)) {
            yValues.push(num)
          }
        }
      }
    }

    let minY = 0
    let maxY = 1

    if (yValues.length > 0) {
      const rawMinY = Math.min(...yValues)
      const rawMaxY = Math.max(...yValues)

      if (rawMinY === rawMaxY) {
        // All-identical values safeguard
        if (rawMinY === 0) {
          minY = 0
          maxY = 1
        } else if (rawMinY > 0) {
          minY = 0
          maxY = rawMaxY * 1.2
        } else {
          minY = rawMinY * 1.2
          maxY = 0
        }
      } else {
        // Normal domain calculation with negative safeguards
        if (rawMinY < 0) {
          minY = rawMinY
          maxY = Math.max(0, rawMaxY)
        } else {
          minY = 0
          maxY = rawMaxY || 1
        }
      }
    }

    const yScale = scaleLinear()
      .domain([minY, maxY])
      .range([height - padding.bottom, padding.top])
      .nice()

    const curveFactory = resolveCurveFactory(this.curve)

    // 4. Grid & Axis Ticks
    const yTicks = yScale.ticks(5)
    const baselineY = yScale(0) ?? height - padding.bottom

    return html`
      <div style="width: 100%; height: ${height}px; position: relative;">
        <svg
          class="chart-svg"
          viewBox="0 0 ${width} ${height}"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Line chart"
        >
          <!-- Grid Lines -->
          ${
            this.showGrid
              ? svg`
                <g class="grid-group" aria-hidden="true">
                  ${yTicks.map((tick) => {
                    const yPos = yScale(tick)
                    return svg`
                      <line
                        class="grid-line"
                        x1="${padding.left}"
                        y1="${yPos}"
                        x2="${width - padding.right}"
                        y2="${yPos}"
                      />
                    `
                  })}
                </g>
              `
              : ''
          }

          <!-- X Axis Baseline -->
          <line
            class="axis-line"
            x1="${padding.left}"
            y1="${baselineY}"
            x2="${width - padding.right}"
            y2="${baselineY}"
          />

          <!-- Y Axis Labels -->
          <g class="y-axis-labels" aria-hidden="true">
            ${yTicks.map((tick) => {
              const yPos = yScale(tick)
              const formatted = this.valueFormatter
                ? this.valueFormatter(tick)
                : String(tick)
              return svg`
                <text
                  class="axis-tick y-tick"
                  x="${padding.left - 8}"
                  y="${yPos}"
                  text-anchor="end"
                  dominant-baseline="middle"
                >
                  ${formatted}
                </text>
              `
            })}
          </g>

          <!-- X Axis Labels -->
          <g class="x-axis-labels" aria-hidden="true">
            ${this.data.map((d) => {
              const label = String(d[this.xKey] ?? '')
              const xPos = xScale(label) ?? 0
              return svg`
                <text
                  class="axis-tick x-tick"
                  x="${xPos}"
                  y="${height - padding.bottom + 18}"
                  text-anchor="middle"
                  dominant-baseline="hanging"
                >
                  ${label}
                </text>
              `
            })}
          </g>

          <!-- Series Lines -->
          <g class="series-lines-group">
            ${activeSeriesList.map((s, sIdx) => {
              const color = s.color || getChartColor(sIdx)
              const strokeWidth = s.strokeWidth ?? 2

              const lineGenerator = line<Record<string, unknown>>()
                .defined((d) => {
                  const val = d[s.key]
                  return (
                    val !== null &&
                    val !== undefined &&
                    !Number.isNaN(Number(val))
                  )
                })
                .x((d) => xScale(String(d[this.xKey] ?? '')) ?? 0)
                .y((d) => yScale(Number(d[s.key])) ?? 0)
                .curve(curveFactory)

              const pathD = lineGenerator(this.data) ?? ''

              return svg`
                <path
                  class="series-path"
                  data-series-key="${s.key}"
                  d="${pathD}"
                  stroke="${color}"
                  stroke-width="${strokeWidth}"
                />
              `
            })}
          </g>

          <!-- Data Points & Hit Areas -->
          <g class="series-points-group">
            ${activeSeriesList.map((s, sIdx) => {
              const color = s.color || getChartColor(sIdx)

              return this.data.map((d, dIdx) => {
                const rawVal = d[s.key]
                if (
                  rawVal === null ||
                  rawVal === undefined ||
                  Number.isNaN(Number(rawVal))
                ) {
                  return svg``
                }

                const cx = xScale(String(d[this.xKey] ?? '')) ?? 0
                const cy = yScale(Number(rawVal)) ?? 0
                const isActive =
                  this.activePoint?.seriesKey === s.key &&
                  this.activePoint?.index === dIdx

                return svg`
                  <g class="point-group" data-series="${s.key}" data-index="${dIdx}">
                    <circle
                      class="point-marker ${isActive ? 'is-active' : ''}"
                      cx="${cx}"
                      cy="${cy}"
                      r="${isActive ? 6 : 4}"
                      stroke="${color}"
                      stroke-width="2"
                    />
                    <circle
                      class="point-hit"
                      cx="${cx}"
                      cy="${cy}"
                      r="12"
                      @pointerenter="${(e: PointerEvent) =>
                        this.handlePointEnter(e, d, s, cx, cy, dIdx)}"
                      @pointerleave="${(e: PointerEvent) =>
                        this.handlePointLeave(e)}"
                    />
                  </g>
                `
              })
            })}
          </g>
        </svg>
      </div>
    `
  }
}

defineElement('moul-line-chart', MoulLineChart)

export { MoulLineChart as LineChart }

declare global {
  interface HTMLElementTagNameMap {
    'moul-line-chart': MoulLineChart
  }
}
```

---

### 4.3 Proposed Milestone 2 Test Suite (`Charts.test.ts`)

```ts
import './LineChart/LineChart'
import type { MoulLineChart } from './LineChart/LineChart'

describe('Milestone 2: Continuous Coordinate Charts — MoulLineChart (`moul-line-chart`)', () => {
  it('CHART-LINE-01: Custom Element registration and instance check', () => {
    const ctor = customElements.get('moul-line-chart')
    expect(ctor).toBeDefined()

    const chart = document.createElement('moul-line-chart')
    expect(chart).toBeInstanceOf(ctor!)
  })

  it('CHART-LINE-02: Property defaults', () => {
    const chart = document.createElement('moul-line-chart') as MoulLineChart
    expect(chart.data).toEqual([])
    expect(chart.xKey).toBe('name')
    expect(chart.series).toEqual([])
    expect(chart.height).toBe(300)
    expect(chart.showGrid).toBe(true)
    expect(chart.curve).toBe('monotoneX')
    expect(chart.valueFormatter).toBeUndefined()
  })

  it('CHART-LINE-03: Empty state slot rendered when data is empty or null', async () => {
    const chart = await mount<MoulLineChart>(html`
      <moul-line-chart>
        <div slot="empty" id="custom-empty">Empty Dataset</div>
      </moul-line-chart>
    `)

    expect(chart.shadowRoot?.querySelector('slot[name="empty"]')).toBeTruthy()
    expect(chart.shadowRoot?.querySelector('svg')).toBeNull()

    // Pass data dynamically -> renders SVG
    chart.data = [
      { name: 'Jan', val: 10 },
      { name: 'Feb', val: 20 },
    ]
    await chart.updateComplete
    expect(chart.shadowRoot?.querySelector('svg')).toBeTruthy()
  })

  it('CHART-LINE-04: Multi-series line rendering and color token assignment', async () => {
    const chart = await mount<MoulLineChart>(html`
      <moul-line-chart
        .data=${[
          { month: 'Q1', revenue: 100, cost: 60 },
          { month: 'Q2', revenue: 150, cost: 80 },
          { month: 'Q3', revenue: 130, cost: 70 },
        ]}
        x-key="month"
        .series=${[
          { key: 'revenue', name: 'Revenue', color: 'var(--color-chart-1)' },
          { key: 'cost', name: 'Cost', color: 'var(--color-chart-2)' },
        ]}
      ></moul-line-chart>
    `)

    const paths = chart.shadowRoot?.querySelectorAll('.series-path')
    expect(paths?.length).toBe(2)

    const revPath = chart.shadowRoot?.querySelector(
      '.series-path[data-series-key="revenue"]',
    )
    const costPath = chart.shadowRoot?.querySelector(
      '.series-path[data-series-key="cost"]',
    )

    expect(revPath?.getAttribute('stroke')).toBe('var(--color-chart-1)')
    expect(costPath?.getAttribute('stroke')).toBe('var(--color-chart-2)')
    expect(revPath?.getAttribute('d')).toMatch(/^M/)
  })

  it('CHART-LINE-05: Auto-detected series when series property is omitted', async () => {
    const chart = await mount<MoulLineChart>(html`
      <moul-line-chart
        .data=${[
          { name: 'A', alpha: 10, beta: 20 },
          { name: 'B', alpha: 30, beta: 40 },
        ]}
      ></moul-line-chart>
    `)

    const paths = chart.shadowRoot?.querySelectorAll('.series-path')
    expect(paths?.length).toBe(2)
  })

  it('CHART-LINE-06: Grid lines visibility toggling via show-grid attribute', async () => {
    const chart = await mount<MoulLineChart>(html`
      <moul-line-chart
        .data=${[{ name: 'X', y: 5 }, { name: 'Y', y: 10 }]}
        show-grid="false"
      ></moul-line-chart>
    `)

    expect(chart.shadowRoot?.querySelector('.grid-group')).toBeNull()

    chart.showGrid = true
    await chart.updateComplete
    expect(chart.shadowRoot?.querySelector('.grid-group')).toBeTruthy()
  })

  it('CHART-LINE-07: Interactive hover dispatches point-hover with PointHoverDetail', async () => {
    const chart = await mount<MoulLineChart>(html`
      <moul-line-chart
        .data=${[{ name: 'Jan', val: 50 }, { name: 'Feb', val: 80 }]}
        .series=${[{ key: 'val', name: 'Metric' }]}
      ></moul-line-chart>
    `)

    let hoverDetail: PointHoverDetail | null = null
    chart.addEventListener('point-hover', (e: Event) => {
      hoverDetail = (e as CustomEvent<PointHoverDetail>).detail
    })

    const firstHit = chart.shadowRoot?.querySelector('.point-hit')
    expect(firstHit).toBeTruthy()

    firstHit?.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
    await chart.updateComplete

    expect(hoverDetail).not.toBeNull()
    expect(hoverDetail!.label).toBe('Jan')
    expect(hoverDetail!.value).toBe(50)
    expect(typeof hoverDetail!.x).toBe('number')
    expect(typeof hoverDetail!.y).toBe('number')
  })

  it('CHART-LINE-08: Domain safeguard: single data point renders without NaN', async () => {
    const chart = await mount<MoulLineChart>(html`
      <moul-line-chart
        .data=${[{ name: 'Only', value: 42 }]}
        .series=${[{ key: 'value' }]}
      ></moul-line-chart>
    `)

    const path = chart.shadowRoot?.querySelector('.series-path')
    const dAttr = path?.getAttribute('d') ?? ''
    expect(dAttr).not.toContain('NaN')

    const marker = chart.shadowRoot?.querySelector('.point-marker')
    expect(marker?.getAttribute('cx')).not.toContain('NaN')
    expect(marker?.getAttribute('cy')).not.toContain('NaN')
  })

  it('CHART-LINE-09: Domain safeguard: all-identical Y values avoids zero-span error', async () => {
    const chart = await mount<MoulLineChart>(html`
      <moul-line-chart
        .data=${[
          { name: 'A', value: 100 },
          { name: 'B', value: 100 },
        ]}
        .series=${[{ key: 'value' }]}
      ></moul-line-chart>
    `)

    const path = chart.shadowRoot?.querySelector('.series-path')
    expect(path?.getAttribute('d')).not.toContain('NaN')
  })

  it('CHART-LINE-10: Domain safeguard: negative values domain expansion', async () => {
    const chart = await mount<MoulLineChart>(html`
      <moul-line-chart
        .data=${[
          { name: 'A', value: -50 },
          { name: 'B', value: 25 },
        ]}
        .series=${[{ key: 'value' }]}
      ></moul-line-chart>
    `)

    const path = chart.shadowRoot?.querySelector('.series-path')
    expect(path?.getAttribute('d')).not.toContain('NaN')
  })

  it('CHART-LINE-11: Responsive dimension resize via triggerResize updates viewBox', async () => {
    const chart = await mount<MoulLineChart>(html`
      <moul-line-chart
        .data=${[{ name: 'A', v: 10 }, { name: 'B', v: 20 }]}
      ></moul-line-chart>
    `)

    triggerResize(chart, { width: 900, height: 450 })
    await awaitNestedUpdates(chart)

    const svgEl = chart.shadowRoot?.querySelector('svg')
    expect(svgEl?.getAttribute('viewBox')).toBe('0 0 900 300')
  })
})
```

---

## 5. Verification Method

To independently verify this implementation blueprint:

1. **Verify No React Dependencies**:
   ```bash
   node -e "require('child_process').execSync('bun ./scripts/verify-no-react.ts all', {stdio: 'inherit'})"
   ```
   *Expected outcome*: Exit code 0, 0 disallowed React/legacy packages found.

2. **Verify Component Unit & Integration Tests**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts
   ```
   *Expected outcome*: All existing M1 tests plus the new M2 `moul-line-chart` test suites pass 100% green.

3. **Verify Linter & Formatter**:
   ```bash
   node node_modules/.bin/biome check ui/src/components/LineChart
   ```
   *Expected outcome*: 0 Biome lint or formatting errors.

4. **Verify Type Checking & Library Build**:
   ```bash
   bun run --cwd ui build
   ```
   *Expected outcome*: Successful Vite library compilation producing `dist/moul-ui.js` and `dist/src/index.d.ts`.
