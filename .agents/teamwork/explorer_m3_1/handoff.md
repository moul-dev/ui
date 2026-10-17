# Handoff Report: MoulBarChart (`moul-bar-chart`) Architecture & Specification

## 1. Observation

### 1.1 Legacy Implementation State
- **File**: `ui/src/components/BarChart/BarChart.tsx` (164 lines)
  - Directly imports `recharts` (`Bar`, `CartesianGrid`, `Cell`, `BarChart as RechartsBarChart`, `ResponsiveContainer`, `Tooltip`, `XAxis`, `YAxis`) and `@stylexjs/stylex`.
  - Violates R1 and R2 zero-React / zero-Recharts mandate.
- **File**: `ui/src/components/BarChart/BarChart.styles.ts` (9 lines)
  - Uses `import * as stylex from '@stylexjs/stylex'` and `stylex.create`. Must be replaced with Lit `css` tagged template using `resetStyles`.
- **File**: `ui/src/components/BarChart/index.ts` (3 lines)
  - Re-exports `BarChartProps` and `BarChart`. Must export `MoulBarChart`, `BarChart`, and `BarChartProps`.

### 1.2 Specification & Foundation State
- **Design Spec**: `rdt/design.md` §8.1 (Line 643):
  - Tag: `moul-bar-chart`
  - Class: `MoulBarChart`
  - Properties: `data: Record<string, unknown>[] = []`, `xKey: string = 'name'` (`x-key`), `series: ChartSeries[] = []` (`attribute: false`), `height: number = 300`, `layout: 'horizontal' | 'vertical' = 'vertical'`, `stacked: boolean = false`, `showGrid: boolean = true` (`show-grid`), `valueFormatter?: (value: any) => string`.
  - Motion: Staggered bar growth (`scaleY: [0, 1]` or `scaleX: [0, 1]`, `350ms`, `delay: stagger(0.025)`).
  - Slots: `empty`
  - Events: `point-hover`
- **Shared Foundation**:
  - `ui/src/components/ChartCommon.ts`: exports `ChartSeries`, `PointHoverDetail`, `CHART_COLORS`, `getChartColor(index: number)`.
  - `ui/src/controllers/layout-indicator.controller.ts`: `LayoutIndicatorController` with `{ observeDimensions: true }`.
  - `ui/src/utils/motion.ts`: `subtleAnimate`, `CHART_EASE`, `prefersReducedMotion`, `stagger`.
  - `ui/src/utils/define-element.ts`: idempotent `defineElement('moul-bar-chart', MoulBarChart)`.
  - `ui/src/components/Charts.test.ts`: 41 passing tests for Milestones 1 & 2 (`ChartContainer`, `ChartTooltip`, `LineChart`, `AreaChart`).

---

## 2. Logic Chain

### 2.1 Component Structure & Registration
To align with `MoulLineChart` and `MoulAreaChart`:
1. `MoulBarChart` extends `LitElement`.
2. Decorated / configured with `static override styles = barChartStyles`.
3. Declares reactive properties with exact attribute reflections:
   - `data`: `{ attribute: false }`
   - `xKey`: `{ type: String, attribute: 'x-key' }` (default `'name'`)
   - `series`: `{ attribute: false }` (default `[]`)
   - `height`: `{ type: Number }` (default `300`)
   - `layout`: `{ type: String }` (default `'vertical'`)
   - `stacked`: `{ type: Boolean }` (default `false`) with boolean attribute converter
   - `showGrid`: `{ type: Boolean, attribute: 'show-grid' }` (default `true`) with boolean attribute converter
   - `valueFormatter`: `{ attribute: false }`
4. Idempotently registers `moul-bar-chart` via `defineElement`.
5. Exports `MoulBarChart as BarChart` and augments `HTMLElementTagNameMap`.

### 2.2 D3 Scale & Math Formulation
The core challenge in a robust bar chart is managing two orthogonal axes across two layout modes (`vertical` vs `horizontal`) and two stacking modes (`grouped` vs `stacked`).

#### 2.2.1 Axis Roles by Layout
- **Vertical Layout (`layout === 'vertical'`, Default)**:
  - Bars stand vertically like columns.
  - Categorical Axis: **X-axis** (horizontal, range: `[padding.left, width - padding.right]`).
  - Metric Axis: **Y-axis** (vertical, range: `[height - padding.bottom, padding.top]`).
  - Baseline: `y0 = Math.min(Math.max(yScale(0), padding.top), height - padding.bottom)`.
- **Horizontal Layout (`layout === 'horizontal'`)**:
  - Bars extend horizontally from left to right like rows.
  - Categorical Axis: **Y-axis** (vertical, range: `[padding.top, height - padding.bottom]`).
  - Metric Axis: **X-axis** (horizontal, range: `[padding.left, width - padding.right]`).
  - Baseline: `x0 = Math.min(Math.max(xScale(0), padding.left), width - padding.right)`.

#### 2.2.2 Categorical Scale (`scaleBand`)
```ts
const categories = this.data.map((d) => String(d[this.xKey] ?? ''))
// For vertical layout:
const catScale = scaleBand<string>()
  .domain(categories)
  .range([padding.left, width - padding.right])
  .paddingInner(0.2)
  .paddingOuter(0.1)

// For horizontal layout:
const catScale = scaleBand<string>()
  .domain(categories)
  .range([padding.top, height - padding.bottom])
  .paddingInner(0.2)
  .paddingOuter(0.1)
```

#### 2.2.3 Sub-Band Scale for Grouped Mode (`stacked === false`)
Within each category band of bandwidth `catScale.bandwidth()`:
```ts
const seriesKeys = activeSeries.map((s) => s.key)
const seriesSubScale = scaleBand<string>()
  .domain(seriesKeys)
  .range([0, catScale.bandwidth()])
  .padding(0.05)
```
- In vertical layout:
  `barX = (catScale(cat) ?? 0) + (seriesSubScale(s.key) ?? 0)`
  `barWidth = Math.max(1, seriesSubScale.bandwidth())`
- In horizontal layout:
  `barY = (catScale(cat) ?? 0) + (seriesSubScale(s.key) ?? 0)`
  `barHeight = Math.max(1, seriesSubScale.bandwidth())`

#### 2.2.4 Cumulative Stacking Math (`stacked === true`)
In stacked mode, all series share the full category bandwidth:
- Vertical: `barX = catScale(cat) ?? 0`, `barWidth = Math.max(1, catScale.bandwidth())`.
- Horizontal: `barY = catScale(cat) ?? 0`, `barHeight = Math.max(1, catScale.bandwidth())`.
Per category `i`:
- Maintain two running accumulators: `posSum = 0`, `negSum = 0`.
- For each series `s`:
  - `val = Number(d[s.key])`
  - If `val >= 0`:
    - Base is `posSum`, end is `posSum + val`, `posSum += val`.
  - If `val < 0`:
    - Base is `negSum`, end is `negSum + val`, `negSum += val`.
- In vertical layout:
  - If `val >= 0`: `barY = yScale(end)`, `barHeight = Math.max(0, yScale(base) - yScale(end))`.
  - If `val < 0`: `barY = yScale(base)`, `barHeight = Math.max(0, yScale(end) - yScale(base))`.
- In horizontal layout:
  - If `val >= 0`: `barX = xScale(base)`, `barWidth = Math.max(0, xScale(end) - xScale(base))`.
  - If `val < 0`: `barX = xScale(end)`, `barWidth = Math.max(0, xScale(base) - xScale(end))`.

#### 2.2.5 Metric Domain Safeguards
- Collect all raw values (grouped) or cumulative sums (stacked).
- Ensure `rawMax = Math.max(...values)` and `rawMin = Math.min(...values)`.
- If all values non-negative: domain is `[0, rawMax > 0 ? rawMax : 1]`.
- If all values negative: domain is `[rawMin < 0 ? rawMin : -1, 0]`.
- If mixed: domain is `[rawMin, rawMax]`.
- Degenerate domain safeguard: `if (Math.abs(domainMax - domainMin) < 1e-6)`, expand to `[0, 1]` or `[-1, 1]`.
- Use `.nice()` on `scaleLinear()`.

### 2.3 SVG Geometries & Interactivity
Each bar is rendered as an SVG `<rect>` element:
```html
<rect
  class="chart-bar ${isActive ? 'is-active' : ''}"
  part="bar"
  data-series-key="${s.key}"
  data-category="${cat}"
  x="${barX}"
  y="${barY}"
  width="${barWidth}"
  height="${barHeight}"
  fill="${color}"
  rx="3"
  ry="3"
  cursor="pointer"
  @pointerenter=${(e: PointerEvent) => this.handleBarEnter(e, d, s, anchorX, anchorY, val, cat)}
  @pointerleave=${(e: PointerEvent) => this.handleBarLeave(e)}
/>
```
- Coordinates for `point-hover`:
  - Vertical layout: `anchorX = barX + barWidth / 2`, `anchorY = barY`.
  - Horizontal layout: `anchorX = val >= 0 ? barX + barWidth : barX`, `anchorY = barY + barHeight / 2`.
- Event payload matches `PointHoverDetail`:
  ```ts
  {
    point: d,
    series: s,
    value: val,
    label: cat,
    x: anchorX,
    y: anchorY,
  }
  ```

### 2.4 Animations
- `subtleAnimate(bars, { opacity: [0, 1] }, { duration: 0.35, ease: CHART_EASE, delay: stagger(0.025) })`.
- Respects `prefersReducedMotion()`.

---

## 3. Caveats

1. **Recharts Legacy Inversion**: Legacy `BarChart.tsx` inherited Recharts' inverse naming where `layout="horizontal"` meant vertical columns and `layout="vertical"` meant horizontal bars. The Lit 3 component adheres strictly to `rdt/design.md` §8.1 where `layout="vertical"` (default) produces vertical bars (`scaleY: [0, 1]`) and `layout="horizontal"` produces horizontal bars (`scaleX: [0, 1]`).
2. **Padding in Horizontal Layout**: Horizontal layout with long category labels on the Y-axis requires adequate left padding (e.g., 64–72px vs 48px for vertical) to prevent tick label clipping.
3. **Happy-DOM SVG Testing**: In Happy-DOM, SVG elements do not calculate `getBBox()` or client layout bounding boxes. All scale computations and geometric attributes (`x`, `y`, `width`, `height`, `d`) are verified via attribute inspection and mathematical projections.

---

## 4. Conclusion & Recommended Blueprint

### 4.1 Target Files to Implement in Milestone 3
1. **`ui/src/components/BarChart/BarChart.styles.ts`**: Pure Lit CSS styles importing `resetStyles`, defining `:host`, `.chart-svg`, `.chart-bar`, `.grid-line`, `.axis-line`, `.axis-tick`, `[part="empty"]`, `.empty-state`.
2. **`ui/src/components/BarChart/BarChart.ts`**: Lit 3 Web Component `MoulBarChart` implementing D3 `scaleBand` & `scaleLinear`, 4-way layout matrix (grouped/stacked × vertical/horizontal), `LayoutIndicatorController`, pointer events, and motion.
3. **`ui/src/components/BarChart/index.ts`**: Export `MoulBarChart`, `MoulBarChart as BarChart`, `BarChartProps`.
4. **`ui/src/components/Charts.test.ts`**: Append Milestone 3 `MoulBarChart` test suite (11 test cases).

### 4.2 Complete Implementation Blueprints

#### Blueprint for `BarChart.styles.ts`:
```ts
import { type CSSResultGroup, css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const barChartStyles: CSSResultGroup = [
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

    .chart-bar {
      cursor: pointer;
      transition: opacity 0.15s ease, filter 0.15s ease;
    }

    .chart-bar:hover,
    .chart-bar.is-active {
      filter: brightness(1.1);
      opacity: 0.9;
    }

    [part="empty"],
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
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

export const styles = barChartStyles
export default barChartStyles
```

#### Blueprint for `BarChart.ts`:
```ts
import { scaleBand, scaleLinear } from 'd3-scale'
import { html, LitElement, type PropertyValues, svg } from 'lit'

import { LayoutIndicatorController } from '../../controllers/layout-indicator.controller'
import { defineElement } from '../../utils/define-element'
import {
  CHART_EASE,
  prefersReducedMotion,
  stagger,
  subtleAnimate,
} from '../../utils/motion'
import {
  type ChartSeries,
  getChartColor,
  type PointHoverDetail,
} from '../ChartCommon'
import { barChartStyles } from './BarChart.styles'

export interface BarChartProps {
  data?: Record<string, unknown>[]
  xKey?: string
  series?: ChartSeries[]
  height?: number
  layout?: 'vertical' | 'horizontal'
  stacked?: boolean
  showGrid?: boolean
  valueFormatter?: (value: any) => string
}

export interface ActiveBarState {
  seriesKey: string
  category: string
  index: number
}

export class MoulBarChart extends LitElement {
  static override styles = barChartStyles

  static override properties = {
    data: { attribute: false },
    xKey: { type: String, attribute: 'x-key' },
    series: { attribute: false },
    height: { type: Number },
    layout: { type: String },
    stacked: {
      type: Boolean,
      converter: {
        fromAttribute: (val: string | null) => val !== null && val !== 'false',
        toAttribute: (val: boolean) => (val ? '' : null),
      },
    },
    showGrid: {
      type: Boolean,
      attribute: 'show-grid',
      converter: {
        fromAttribute: (val: string | null) => val !== null && val !== 'false',
        toAttribute: (val: boolean) => (val ? '' : null),
      },
    },
    valueFormatter: { attribute: false },
  }

  declare data: Record<string, unknown>[]
  declare xKey: string
  declare series: ChartSeries[]
  declare height: number
  declare layout: 'vertical' | 'horizontal'
  declare stacked: boolean
  declare showGrid: boolean
  declare valueFormatter?: (value: any) => string

  public layoutController: LayoutIndicatorController
  private activeBar: ActiveBarState | null = null

  constructor() {
    super()
    this.data = []
    this.xKey = 'name'
    this.series = []
    this.height = 300
    this.layout = 'vertical'
    this.stacked = false
    this.showGrid = true
    this.valueFormatter = undefined

    this.layoutController = new LayoutIndicatorController(this, {
      observeDimensions: true,
    })
  }

  public get containerWidth(): number {
    return this.layoutController.width > 0
      ? this.layoutController.width
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
      changedProps.has('layout') ||
      changedProps.has('stacked')
    ) {
      this.animateBars()
    }
  }

  private animateBars(): void {
    if (prefersReducedMotion()) return

    const bars = this.renderRoot?.querySelectorAll<SVGRectElement>(
      'rect.chart-bar, [part~="bar"]',
    )
    if (bars && bars.length > 0) {
      subtleAnimate(
        bars,
        { opacity: [0, 1] },
        { duration: 0.35, ease: CHART_EASE, delay: stagger(0.025) },
      )
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
        const num = typeof val === 'number' ? val : Number(val)
        return (
          (typeof val === 'number' ||
            (typeof val === 'string' && val.trim() !== '')) &&
          Number.isFinite(num)
        )
      })
      .map((key, idx) => ({
        key,
        name: key,
        color: getChartColor(idx),
      }))
  }

  private handleBarEnter(
    _event: PointerEvent,
    item: Record<string, unknown>,
    seriesItem: ChartSeries,
    anchorX: number,
    anchorY: number,
    val: number,
    category: string,
    dIdx: number,
  ): void {
    this.activeBar = {
      seriesKey: seriesItem.key,
      category,
      index: dIdx,
    }
    this.requestUpdate()

    this.dispatchEvent(
      new CustomEvent<PointHoverDetail>('point-hover', {
        bubbles: true,
        composed: true,
        detail: {
          point: item,
          series: seriesItem,
          value: val,
          label: category,
          x: anchorX,
          y: anchorY,
        },
      }),
    )
  }

  private handleBarLeave(_event: PointerEvent): void {
    this.activeBar = null
    this.requestUpdate()

    this.dispatchEvent(
      new CustomEvent('point-leave', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  // Render method implements full 4-way layout matrix with domain safeguards
  // (detailed in Section 2.2)
}

defineElement('moul-bar-chart', MoulBarChart)
export { MoulBarChart as BarChart }

declare global {
  interface HTMLElementTagNameMap {
    'moul-bar-chart': MoulBarChart
  }
}
```

---

## 5. Verification Method

### 5.1 Test Suite Specifications (`Charts.test.ts`)
Add `describe('MoulBarChart (\`moul-bar-chart\`)')` with the following 10 tests:

1. **CHART-BAR-01**: Custom element registration & `HTMLElementTagNameMap` contract.
2. **CHART-BAR-02**: Vertical layout (grouped): renders `N * S` `<rect>` bars, distinct X offsets per series, valid non-NaN attributes.
3. **CHART-BAR-03**: Vertical layout (stacked): bars share identical X and width, cumulative vertical stacking math (`y` shifts).
4. **CHART-BAR-04**: Horizontal layout (`layout="horizontal"`): categorical Y axis, horizontal bar growth along X, grouped & stacked positioning.
5. **CHART-BAR-05**: Multi-series color mapping (`--color-chart-1` ... `--color-chart-8`) and custom series color overrides.
6. **CHART-BAR-06**: Pointer interaction: `pointerenter` on `<rect.chart-bar>` dispatches `point-hover` with correct `PointHoverDetail`, and `pointerleave` dispatches `point-leave`.
7. **CHART-BAR-07**: Empty state slot rendering when `data = []`, `data = null`, or `data = undefined`.
8. **CHART-BAR-08**: Domain resilience edge cases: single data point, all identical values, negative values, and subnormal ranges.
9. **CHART-BAR-09**: Grid lines toggle (`show-grid`) and custom `valueFormatter` formatting ticks.
10. **CHART-BAR-10**: Fast-check property test: arbitrary numerical matrices render valid non-NaN SVG `<rect>` elements.
11. **CHART-INT-04**: Integration test: `moul-bar-chart` slotted in `moul-chart-container` triggers `moul-chart-tooltip` popover on hover.

### 5.2 Independent Verification Commands
```bash
# 1. Run full test suite in happy-dom environment
cd ui && ./node_modules/.bin/vitest run src/components/Charts.test.ts

# 2. Verify zero-React / zero-StyleX rule
bun scripts/verify-no-react.ts ui

# 3. Biome linting check
bun run lint
```
Invalidation conditions:
- Any `NaN` in SVG `x`, `y`, `width`, or `height`.
- Missing `point-hover` event dispatch on bar pointerenter.
- React, Recharts, or StyleX imports present in `BarChart.ts` or `BarChart.styles.ts`.
