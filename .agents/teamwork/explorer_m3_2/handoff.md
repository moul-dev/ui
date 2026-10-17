# Implementation Blueprint: `moul-doughnut-chart` (`MoulDoughnutChart`)

**Investigator**: `explorer_m3_2`  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m3_2`  
**Target Component**: `moul-doughnut-chart` (`ui/src/components/DoughnutChart/DoughnutChart.ts`, `DoughnutChart.styles.ts`, and `index.ts`)  
**Parent Orchestrator**: `4562f942-bc5a-4d72-ad00-d87e731f5321`  
**Date**: 2026-10-17  

---

## 1. Observation

### 1.1 Direct Specification Citations

1. **`ORIGINAL_REQUEST.md` (Lines 221–266)**:
   > "Implement Phase 8 of the design specification: Rebuild Category 1 — Charts & Data Visualization (7 Components + 2 Companions) as Lit Web Components powered by `d3-scale`, `d3-shape`, and `motion`."  
   > - **R1. Chart Components & Companions Rebuild**: Implement `moul-doughnut-chart` as a Lit Web Component, registered via idempotent `defineElement` under the `moul-` prefix, with zero React/Recharts dependencies.  
   > - **R2. SVG Geometry & Color Token Mapping**: Generate SVG geometries using `d3-scale` and `d3-shape` without third-party chart wrappers, styling chart series with `--color-chart-1` through `--color-chart-8` CSS design tokens.  
   > - **R3. Responsive Viewports, Empty States & Micro-Animations**: Render `<slot name="empty">` when data is missing or empty. Animate SVG path/geometry transitions with `motion` (duration 200–500ms, respecting `prefers-reduced-motion: reduce`).  
   > - **R4. Data Point Tooltip Interaction**: Open and position `moul-chart-tooltip` via pointer interaction over chart data points.  
   > - **R5. Verification Test Suite**: Provide unit and integration tests in `ui/src/components/Charts.test.ts`.

2. **`orchestrator_phase8_2/PROJECT.md` (Lines 24, 37, 41–74)**:
   > - Feature 7: `moul-doughnut-chart` — D3 pie & arc generators, inner-radius-ratio, center label/slot, slice hover expansion (Milestone 3).  
   > - Code layout: `ui/src/components/DoughnutChart/DoughnutChart.ts` and `DoughnutChart.styles.ts`.

3. **`rdt/design.md` §8.1 (Line 644)**:
   > | 4 | `MoulDoughnutChart` | `moul-doughnut-chart` | `data: DoughnutDataItem[] = []`<br>`innerRadiusRatio: number = 0.65` (`inner-radius-ratio`)<br>`height: number = 280`<br>`centerLabel: string = ''` (`center-label`)<br>**Motion:** Staggered arc slice entrance (`scale: [0.88, 1], opacity: [0, 1]`, `380ms`, `stagger(0.04)`) and active slice hover expansion | `empty`, `center` | `point-hover` |

4. **`DISPATCH.md` Instructions**:
   > Task: Investigate `moul-doughnut-chart` (`DoughnutChart.ts` and `DoughnutChart.styles.ts`).  
   > 1. Inspect legacy `ui/src/components/DoughnutChart/DoughnutChart.tsx` and requirements in `rdt/design.md` §8.1.  
   > 2. Specify Lit 3 component architecture:  
   >    - Component tag: `moul-doughnut-chart`, class: `MoulDoughnutChart as DoughnutChart`, exported types (`DoughnutDataItem` from `ChartCommon.ts`).  
   >    - Reactive properties: `data` (`DoughnutDataItem[]`), `innerRadiusRatio` (`inner-radius-ratio`, default `0.6`), `height`, `valueFormatter`, `centerLabel`, `centerSublabel`.  
   >    - D3 pipeline: `pie<DoughnutDataItem>()` & `arc()` from `d3-shape`. Arc slices, inner/outer radius, padAngle.  
   >    - Slices: SVG `<path>` elements with color assignment (`getChartColor(idx)` or `item.color`), slice hover expansion (subtle radius enlargement or scale), `part="slice"`.  
   >    - Center slot: `<slot name="center">` rendering custom center content or default `centerLabel` / `centerSublabel`.  
   >    - Event contracts: pointerenter/pointerleave dispatching `point-hover` (`PointHoverDetail`).  
   >    - Domain safeguards: empty data slot `<slot name="empty">`, all-zero values, single slice (360 deg arc).  
   > 3. Recommend complete implementation blueprint and test cases for the worker.

### 1.2 Legacy Codebase Inspection

1. **`ui/src/components/DoughnutChart/DoughnutChart.tsx`**:
   - 85 lines using React, Recharts (`RechartsPieChart`, `ResponsiveContainer`, `Tooltip`, `Pie`, `Cell`), and StyleX (`@stylexjs/stylex`).
   - Imports and dependencies violate the monorepo zero-React guard (`scripts/verify-no-react.ts`).
   - Must be deleted and replaced with Lit 3 `DoughnutChart.ts`.

2. **`ui/src/components/DoughnutChart/DoughnutChart.styles.ts`**:
   - Contains `@stylexjs/stylex` styles (`stylex.create({ wrapper: { ... } })`).
   - Must be replaced with Lit `css` tagged template strings inheriting `resetStyles` from `../../styles/reset.styles`.

3. **`ui/src/components/DoughnutChart/index.ts`**:
   - Currently exports legacy React types:
     ```ts
     export type { DoughnutChartProps } from './DoughnutChart'
     export { DoughnutChart } from './DoughnutChart'
     ```
   - Must export `MoulDoughnutChart`, `DoughnutChart`, and `DoughnutChartProps`.

4. **`ui/src/components/ChartCommon.ts`**:
   - Exports `DoughnutDataItem`:
     ```ts
     export interface DoughnutDataItem {
       name: string
       value: number
       color?: string
       [key: string]: unknown
     }
     ```
   - Exports `PointHoverDetail`:
     ```ts
     export interface PointHoverDetail {
       point?: Record<string, unknown>
       series?: ChartSeries | string
       value: unknown
       label: string
       x: number
       y: number
     }
     ```
   - Exports `getChartColor(index: number): string` mapping modulo 8 to `var(--color-chart-1)` through `var(--color-chart-8)`.

5. **Existing Verification Suite**:
   - Running `node ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts` executes 41 tests across Milestones 1 and 2, passing 100% in ~1.30s.

---

## 2. Logic Chain

### 2.1 Component Identity & Registration
- The custom element inherits from `LitElement` and registers via `defineElement('moul-doughnut-chart', MoulDoughnutChart)` from `../../utils/define-element`.
- Augmented into global `HTMLElementTagNameMap` with `'moul-doughnut-chart': MoulDoughnutChart`.
- Class alias exported as `export { MoulDoughnutChart as DoughnutChart }` for seamless imports.
- Open Shadow DOM with CSS custom property theming via `style.css` and `resetStyles`.

### 2.2 Reactive Properties & Reflection
Adhering to Lit 3 standards without TypeScript experimental decorator dependencies:
- `data`: `{ attribute: false }`, typed as `DoughnutDataItem[]`, default `[]`.
- `innerRadiusRatio`: `{ type: Number, attribute: 'inner-radius-ratio' }`, default `0.6` (clamped to `[0, 0.95]`).
  - When `0`, renders a solid pie chart with zero inner cutout (`innerRadius = 0`).
  - When `0.6` (default) or any ratio up to `0.95`, renders a doughnut ring with an inner hole.
- `height`: `{ type: Number }`, default `280`.
- `valueFormatter`: `{ attribute: false }`, typed as `((value: any) => string) | undefined`, default `undefined`.
- `centerLabel`: `{ type: String, attribute: 'center-label' }`, default `''`.
- `centerSublabel`: `{ type: String, attribute: 'center-sublabel' }`, default `''`.
- `padAngle`: `{ type: Number, attribute: 'pad-angle' }`, default `0.02`.
- `cornerRadius`: `{ type: Number, attribute: 'corner-radius' }`, default `4`.

### 2.3 Responsive Sizing via `LayoutIndicatorController`
- Incorporates `LayoutIndicatorController(this, { observeDimensions: true })`.
- Width: `this.layout.width > 0 ? this.layout.width : (this.clientWidth > 0 ? this.clientWidth : 280)`.
- Height: `this.height > 0 ? this.height : (this.layout.height > 0 ? this.layout.height : 280)`.
- Circle center: `cx = width / 2`, `cy = height / 2`.
- Base outer radius: `maxRadius - padding`, where `padding = 16` allows for the 6px slice hover expansion without clipping against viewBox boundaries.
- Base inner radius: `outerRadius * effectiveInnerRadiusRatio`.

### 2.4 D3 Pie & Arc Pipeline
- **Pie Generator**:
  ```ts
  const isSingleSlice = positiveItems.length <= 1
  const pieGen = pie<DoughnutDataItem>()
    .value((d) => Math.max(0, Number(d.value) || 0))
    .sort(null) // Preserves input order
    .padAngle(isSingleSlice ? 0 : this.padAngle)
  ```
  - When there is only 1 positive item, setting `padAngle: 0` ensures a seamless 360-degree closed circular arc without a gap artifact.
- **Arc Generator**:
  ```ts
  const baseArcGen = arc<PieArcDatum<DoughnutDataItem>>()
    .innerRadius(innerRadius)
    .cornerRadius(isSingleSlice ? 0 : this.cornerRadius)
  ```
- **Slice Outer Radius Expansion**:
  - For each slice datum `d`:
    ```ts
    const isActive = this.activeSliceIndex === idx
    const currentOuterRadius = isActive ? outerRadius + 6 : outerRadius
    const pathD = baseArcGen.outerRadius(currentOuterRadius)(d)
    ```
  - Centroid calculation: `centroid = baseArcGen.centroid(d)` computes exact `[x, y]` midpoint of the slice arc.

### 2.5 Slice Rendering, Color Assignment & Events
- Each slice is rendered as an SVG `<path>`:
  - `class="slice ${isActive ? 'is-active' : ''}"`
  - `part="slice"`
  - `d="${pathD}"`
  - `fill="${item.color || getChartColor(d.index)}"`
  - `stroke="var(--color-bg, #ffffff)"`
  - `stroke-width="1.5"`
  - `role="graphics-symbol"`
  - `aria-label="${d.data.name}: ${formattedValue}"`
  - `tabindex="0"`
- Hover & Focus Interaction:
  - `@pointerenter` and `@focus` trigger `handleSliceEnter(event, d, idx, centroid, cx, cy)`:
    - Sets `this.activeSliceIndex = idx` and requests update.
    - Dispatches bubbling/composed `point-hover` CustomEvent with `PointHoverDetail`:
      ```ts
      {
        point: d.data,
        series: { key: d.data.name, name: d.data.name, color: sliceColor },
        value: formattedValue,
        label: d.data.name,
        x: Math.round(cx + centroid[0]),
        y: Math.round(cy + centroid[1]),
      }
      ```
  - `@pointerleave` and `@blur` trigger `handleSliceLeave()`:
    - Clears `this.activeSliceIndex = null` and requests update.
    - Dispatches bubbling/composed `point-leave` CustomEvent.

### 2.6 Center Slot & Overlay Architecture
- Center content is rendered inside `.center-container` positioned over the center hole:
  - Diameter: `2 * innerRadius`.
  - Position: `left: ${cx - innerRadius}px; top: ${cy - innerRadius}px; width: ${2 * innerRadius}px; height: ${2 * innerRadius}px`.
  - Structure:
    ```html
    <div class="center-container" part="center" style="...">
      <slot name="center">
        ${this.centerLabel || this.centerSublabel ? html`
          <div class="center-labels">
            ${this.centerLabel ? html`<div class="center-label" part="center-label">${this.centerLabel}</div>` : ''}
            ${this.centerSublabel ? html`<div class="center-sublabel" part="center-sublabel">${this.centerSublabel}</div>` : ''}
          </div>
        ` : ''}
      </slot>
    </div>
    ```
- When `innerRadiusRatio: 0` (`innerRadius === 0`, solid pie mode), the center container is not rendered.

### 2.7 Domain Safeguards & Edge Cases
1. **Empty / Null / Undefined Data**:
   - When `!this.data || !Array.isArray(this.data) || this.data.length === 0`, early returns `<div part="empty" class="empty-state"><slot name="empty"><p class="empty-message">No data available</p></slot></div>`.
2. **All-Zero Values**:
   - When all item values are 0 (or negative clamped to 0), `totalPositive === 0`.
   - Renders a clean neutral SVG `<circle class="empty-track">` with stroke `var(--color-border-subtle)` to indicate an empty gauge without generating `NaN` or crashing D3 arc calculations.
3. **Single Slice**:
   - Single item spanning 100% of data sets `padAngle: 0` and `cornerRadius: 0`, generating a continuous $0 \to 2\pi$ circular or annular arc.
4. **Invalid / Extreme Ratio**:
   - Clamped to `[0, 0.95]` via `effectiveInnerRadiusRatio`, preventing negative radii or inner radius exceeding outer radius.

---

## 3. Caveats

1. **SVG `<slot>` Limitations**: SVG 1.1/2 elements do not reliably support slotted HTML content across browsers without `<foreignObject>`. The center slot is therefore implemented as an HTML `div.center-container` positioned over the SVG using CSS absolute positioning within `div.chart-wrapper`. This is 100% standards-compliant and works identically in all browsers and `happy-dom`.
2. **Reduced Motion**: When `prefersReducedMotion()` is active, slice entrance animations via `subtleAnimate` automatically collapse duration to 0.
3. **Tooltip Integration**: `moul-doughnut-chart` dispatches `point-hover` with centroid-derived `(x, y)` coordinates. When paired with `moul-chart-tooltip`, the tooltip automatically binds to these coordinates and displays the slice's series name and value.

---

## 4. Conclusion & Implementation Blueprint

### 4.1 `ui/src/components/DoughnutChart/DoughnutChart.ts`

```ts
import { arc, pie, type PieArcDatum } from 'd3-shape'
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
  type DoughnutDataItem,
  getChartColor,
  type PointHoverDetail,
} from '../ChartCommon'
import { doughnutChartStyles } from './DoughnutChart.styles'

export interface DoughnutChartProps {
  data?: DoughnutDataItem[]
  innerRadiusRatio?: number
  height?: number
  centerLabel?: string
  centerSublabel?: string
  padAngle?: number
  cornerRadius?: number
  valueFormatter?: (value: any) => string
}

export class MoulDoughnutChart extends LitElement {
  static override styles = doughnutChartStyles

  static override properties = {
    data: { attribute: false },
    innerRadiusRatio: { type: Number, attribute: 'inner-radius-ratio' },
    height: { type: Number },
    centerLabel: { type: String, attribute: 'center-label' },
    centerSublabel: { type: String, attribute: 'center-sublabel' },
    padAngle: { type: Number, attribute: 'pad-angle' },
    cornerRadius: { type: Number, attribute: 'corner-radius' },
    valueFormatter: { attribute: false },
  }

  declare data: DoughnutDataItem[]
  declare innerRadiusRatio: number
  declare height: number
  declare centerLabel: string
  declare centerSublabel: string
  declare padAngle: number
  declare cornerRadius: number
  declare valueFormatter?: (value: any) => string

  public layout: LayoutIndicatorController
  private activeSliceIndex: number | null = null

  constructor() {
    super()
    this.data = []
    this.innerRadiusRatio = 0.6
    this.height = 280
    this.centerLabel = ''
    this.centerSublabel = ''
    this.padAngle = 0.02
    this.cornerRadius = 4
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
        : 280
  }

  public get containerHeight(): number {
    return this.height > 0
      ? this.height
      : this.layout.height > 0
        ? this.layout.height
        : 280
  }

  public get effectiveInnerRadiusRatio(): number {
    const ratio = Number(this.innerRadiusRatio)
    if (!Number.isFinite(ratio) || ratio <= 0) return 0
    return Math.min(0.95, ratio)
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    if (
      changedProps.has('data') ||
      changedProps.has('innerRadiusRatio') ||
      changedProps.has('height')
    ) {
      this.animateSlices()
    }
  }

  private animateSlices(): void {
    if (prefersReducedMotion()) return

    const slices = this.renderRoot?.querySelectorAll<SVGPathElement>('.slice')
    if (slices && slices.length > 0) {
      subtleAnimate(
        slices,
        { opacity: [0, 1] },
        { duration: 0.38, delay: stagger(0.04), ease: CHART_EASE },
      )
    }
  }

  private handleSliceEnter(
    _event: PointerEvent | FocusEvent,
    d: PieArcDatum<DoughnutDataItem>,
    index: number,
    centroid: [number, number],
    cx: number,
    cy: number,
  ): void {
    this.activeSliceIndex = index
    this.requestUpdate()

    const formattedValue = this.valueFormatter
      ? this.valueFormatter(d.data.value)
      : d.data.value

    const sliceColor = d.data.color || getChartColor(d.index)

    const detail: PointHoverDetail = {
      point: d.data as Record<string, unknown>,
      series: {
        key: d.data.name,
        name: d.data.name,
        color: sliceColor,
      },
      value: formattedValue,
      label: d.data.name,
      x: Math.round(cx + centroid[0]),
      y: Math.round(cy + centroid[1]),
    }

    this.dispatchEvent(
      new CustomEvent<PointHoverDetail>('point-hover', {
        bubbles: true,
        composed: true,
        detail,
      }),
    )
  }

  private handleSliceLeave(_event?: PointerEvent | FocusEvent): void {
    this.activeSliceIndex = null
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
    const cx = width / 2
    const cy = height / 2

    // Allow 16px padding for slice hover expansion so it doesn't clip
    const padding = 16
    const maxRadius = Math.max(10, Math.min(width, height) / 2 - padding)
    const outerRadius = maxRadius
    const innerRadius = outerRadius * this.effectiveInnerRadiusRatio

    const totalPositive = this.data.reduce(
      (sum, item) => sum + Math.max(0, Number(item?.value) || 0),
      0,
    )

    // Check if single positive slice
    const positiveItems = this.data.filter(
      (item) => (Number(item?.value) || 0) > 0,
    )
    const isSingleSlice = positiveItems.length <= 1

    const pieGen = pie<DoughnutDataItem>()
      .value((d) => Math.max(0, Number(d.value) || 0))
      .sort(null)
      .padAngle(isSingleSlice ? 0 : this.padAngle)

    const arcs = pieGen(this.data)

    const baseArcGen = arc<PieArcDatum<DoughnutDataItem>>()
      .innerRadius(innerRadius)
      .cornerRadius(isSingleSlice ? 0 : this.cornerRadius)

    return html`
      <div class="chart-wrapper" part="wrapper" style="height: ${height}px">
        <svg
          class="chart-svg"
          viewBox="0 0 ${width} ${height}"
          preserveAspectRatio="xMidYMid meet"
          part="svg"
          role="img"
          aria-label="${this.centerLabel || 'Doughnut chart'}"
        >
          <g transform="translate(${cx}, ${cy})">
            ${totalPositive === 0
              ? svg`
                  <circle
                    class="empty-track"
                    cx="0"
                    cy="0"
                    r="${(outerRadius + innerRadius) / 2}"
                    stroke="var(--color-border-subtle, #e5e7eb)"
                    stroke-width="${Math.max(2, outerRadius - innerRadius)}"
                    fill="none"
                  />
                `
              : arcs.map((d, idx) => {
                  if (d.startAngle === d.endAngle) return svg``

                  const isActive = this.activeSliceIndex === idx
                  const currentOuterRadius = isActive
                    ? outerRadius + 6
                    : outerRadius

                  const pathD = baseArcGen.outerRadius(currentOuterRadius)(d)
                  if (!pathD) return svg``

                  const color = d.data.color || getChartColor(d.index)
                  const centroid = baseArcGen.centroid(d)
                  const formattedValue = this.valueFormatter
                    ? this.valueFormatter(d.data.value)
                    : String(d.data.value)

                  return svg`
                    <path
                      class="slice ${isActive ? 'is-active' : ''}"
                      part="slice"
                      data-index="${idx}"
                      data-name="${d.data.name}"
                      data-value="${d.data.value}"
                      d="${pathD}"
                      fill="${color}"
                      stroke="var(--color-bg, #ffffff)"
                      stroke-width="1.5"
                      role="graphics-symbol"
                      aria-label="${d.data.name}: ${formattedValue}"
                      tabindex="0"
                      @pointerenter="${(e: PointerEvent) =>
                        this.handleSliceEnter(e, d, idx, centroid, cx, cy)}"
                      @pointerleave="${(e: PointerEvent) =>
                        this.handleSliceLeave(e)}"
                      @focus="${(e: FocusEvent) =>
                        this.handleSliceEnter(e, d, idx, centroid, cx, cy)}"
                      @blur="${(e: FocusEvent) => this.handleSliceLeave(e)}"
                    />
                  `
                })}
          </g>
        </svg>

        ${innerRadius > 0
          ? html`
              <div
                class="center-container"
                part="center"
                style="width: ${innerRadius * 2}px; height: ${innerRadius * 2}px; left: ${cx - innerRadius}px; top: ${cy - innerRadius}px;"
              >
                <slot name="center">
                  ${this.centerLabel || this.centerSublabel
                    ? html`
                        <div class="center-labels">
                          ${this.centerLabel
                            ? html`<div class="center-label" part="center-label">${this.centerLabel}</div>`
                            : ''}
                          ${this.centerSublabel
                            ? html`<div class="center-sublabel" part="center-sublabel">${this.centerSublabel}</div>`
                            : ''}
                        </div>
                      `
                    : ''}
                </slot>
              </div>
            `
          : ''}
      </div>
    `
  }
}

defineElement('moul-doughnut-chart', MoulDoughnutChart)

export { MoulDoughnutChart as DoughnutChart }

declare global {
  interface HTMLElementTagNameMap {
    'moul-doughnut-chart': MoulDoughnutChart
  }
}
```

### 4.2 `ui/src/components/DoughnutChart/DoughnutChart.styles.ts`

```ts
import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const doughnutChartStyles = [
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

    .chart-wrapper {
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chart-svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .slice {
      cursor: pointer;
      outline: none;
      transition: filter 0.15s ease, opacity 0.15s ease;
    }

    .slice:hover,
    .slice.is-active {
      filter: brightness(1.1);
    }

    .slice:focus-visible {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 2px;
    }

    .empty-track {
      pointer-events: none;
    }

    .center-container {
      position: absolute;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      border-radius: 50%;
      box-sizing: border-box;
      padding: var(--spacing-2, 0.5rem);
    }

    .center-labels {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }

    .center-label {
      font-size: var(--font-size-xl, 1.25rem);
      font-weight: 700;
      color: var(--color-fg, inherit);
      line-height: 1.2;
    }

    .center-sublabel {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg-subtle, #6b7280);
      line-height: 1.2;
    }

    ::slotted([slot="center"]) {
      pointer-events: auto;
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

export const styles = doughnutChartStyles
export default doughnutChartStyles
```

### 4.3 `ui/src/components/DoughnutChart/index.ts`

```ts
export type { DoughnutChartProps } from './DoughnutChart'
export { DoughnutChart, MoulDoughnutChart } from './DoughnutChart'
```

### 4.4 Unit Test Suite Blueprint for `Charts.test.ts`

To be included in `ui/src/components/Charts.test.ts` under `Milestone 3: Discrete & Categorical Charts Test Suite`:

```ts
import './DoughnutChart/DoughnutChart'
import type { MoulDoughnutChart } from './DoughnutChart/DoughnutChart'

describe('MoulDoughnutChart (`moul-doughnut-chart`)', () => {
  const sampleData: DoughnutDataItem[] = [
    { name: 'Desktop', value: 400 },
    { name: 'Mobile', value: 300 },
    { name: 'Tablet', value: 200 },
    { name: 'Other', value: 100 },
  ]

  it('CHART-DGN-01: Custom Element registration and HTMLElementTagNameMap contract', () => {
    expect(customElements.get('moul-doughnut-chart')).toBeDefined()
    const element = document.createElement('moul-doughnut-chart')
    expect(element).toBeInstanceOf(HTMLElement)
    expect(element.tagName.toLowerCase()).toBe('moul-doughnut-chart')
  })

  it('CHART-DGN-02: Default property values', async () => {
    const el = await mount<MoulDoughnutChart>(html`<moul-doughnut-chart></moul-doughnut-chart>`)
    expect(el.data).toEqual([])
    expect(el.innerRadiusRatio).toBe(0.6)
    expect(el.height).toBe(280)
    expect(el.centerLabel).toBe('')
    expect(el.centerSublabel).toBe('')
    expect(el.padAngle).toBe(0.02)
    expect(el.cornerRadius).toBe(4)
  })

  it('CHART-DGN-03: D3 Arc & Pie SVG slice generation with valid path data d', async () => {
    const el = await mount<MoulDoughnutChart>(html`
      <moul-doughnut-chart .data=${sampleData}></moul-doughnut-chart>
    `)
    const slices = el.shadowRoot!.querySelectorAll<SVGPathElement>('.slice')
    expect(slices.length).toBe(4)

    slices.forEach((slice, idx) => {
      const d = slice.getAttribute('d')
      expect(d).toBeTruthy()
      expect(d?.startsWith('M')).toBe(true)
      expect(d?.endsWith('Z')).toBe(true)
      expect(d?.includes('NaN')).toBe(false)
      expect(slice.getAttribute('data-name')).toBe(sampleData[idx].name)
      expect(Number(slice.getAttribute('data-value'))).toBe(sampleData[idx].value)
    })
  })

  it('CHART-DGN-04: Modulo 8 color token mapping and custom slice color', async () => {
    const customData: DoughnutDataItem[] = [
      { name: 'Alpha', value: 10, color: '#ff0000' },
      { name: 'Beta', value: 20 },
      { name: 'Gamma', value: 30 },
    ]
    const el = await mount<MoulDoughnutChart>(html`
      <moul-doughnut-chart .data=${customData}></moul-doughnut-chart>
    `)
    const slices = el.shadowRoot!.querySelectorAll<SVGPathElement>('.slice')
    expect(slices[0].getAttribute('fill')).toBe('#ff0000')
    expect(slices[1].getAttribute('fill')).toBe('var(--color-chart-2)')
    expect(slices[2].getAttribute('fill')).toBe('var(--color-chart-3)')
  })

  it('CHART-DGN-05: Configurable inner-radius-ratio for pie vs doughnut', async () => {
    // Solid Pie (ratio 0)
    const pieEl = await mount<MoulDoughnutChart>(html`
      <moul-doughnut-chart .data=${sampleData} inner-radius-ratio="0"></moul-doughnut-chart>
    `)
    expect(pieEl.effectiveInnerRadiusRatio).toBe(0)
    expect(pieEl.shadowRoot!.querySelector('.center-container')).toBeNull()

    // Doughnut (ratio 0.75)
    const doughnutEl = await mount<MoulDoughnutChart>(html`
      <moul-doughnut-chart .data=${sampleData} inner-radius-ratio="0.75"></moul-doughnut-chart>
    `)
    expect(doughnutEl.effectiveInnerRadiusRatio).toBe(0.75)
    expect(doughnutEl.shadowRoot!.querySelector('.center-container')).not.toBeNull()
  })

  it('CHART-DGN-06: Center slot and default center labels', async () => {
    // Default labels
    const elLabels = await mount<MoulDoughnutChart>(html`
      <moul-doughnut-chart
        .data=${sampleData}
        center-label="1,000"
        center-sublabel="Total Users"
      ></moul-doughnut-chart>
    `)
    const label = elLabels.shadowRoot!.querySelector('.center-label')
    const sublabel = elLabels.shadowRoot!.querySelector('.center-sublabel')
    expect(label?.textContent?.trim()).toBe('1,000')
    expect(sublabel?.textContent?.trim()).toBe('Total Users')

    // Custom center slot
    const elSlot = await mount<MoulDoughnutChart>(html`
      <moul-doughnut-chart .data=${sampleData}>
        <div slot="center" id="custom-kpi">Slotted KPI</div>
      </moul-doughnut-chart>
    `)
    const slot = elSlot.shadowRoot!.querySelector('slot[name="center"]')
    expect(slot).not.toBeNull()
  })

  it('CHART-DGN-07: Interactive slice hover expansion and point-hover event dispatch', async () => {
    const el = await mount<MoulDoughnutChart>(html`
      <moul-doughnut-chart .data=${sampleData}></moul-doughnut-chart>
    `)
    let hoveredDetail: PointHoverDetail | null = null
    el.addEventListener('point-hover', (e: Event) => {
      hoveredDetail = (e as CustomEvent<PointHoverDetail>).detail
    })

    const slices = el.shadowRoot!.querySelectorAll<SVGPathElement>('.slice')
    const initialD = slices[0].getAttribute('d')

    slices[0].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
    await awaitNestedUpdates(el)

    expect(hoveredDetail).not.toBeNull()
    expect(hoveredDetail?.label).toBe('Desktop')
    expect(hoveredDetail?.value).toBe(400)
    expect(Number.isFinite(hoveredDetail?.x)).toBe(true)
    expect(Number.isFinite(hoveredDetail?.y)).toBe(true)
    expect(slices[0].classList.contains('is-active')).toBe(true)
    // Slice radius expands on active hover
    expect(slices[0].getAttribute('d')).not.toBe(initialD)

    let leaveFired = false
    el.addEventListener('point-leave', () => {
      leaveFired = true
    })
    slices[0].dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
    await awaitNestedUpdates(el)

    expect(leaveFired).toBe(true)
    expect(slices[0].classList.contains('is-active')).toBe(false)
  })

  it('CHART-DGN-08: Domain safeguards: empty, all-zero, and single slice', async () => {
    // Empty data renders slot
    const emptyEl = await mount<MoulDoughnutChart>(html`<moul-doughnut-chart></moul-doughnut-chart>`)
    expect(emptyEl.shadowRoot!.querySelector('slot[name="empty"]')).not.toBeNull()

    // All zero values renders track without NaN
    const zeroEl = await mount<MoulDoughnutChart>(html`
      <moul-doughnut-chart .data=${[{ name: 'A', value: 0 }, { name: 'B', value: 0 }]}></moul-doughnut-chart>
    `)
    expect(zeroEl.shadowRoot!.querySelector('.empty-track')).not.toBeNull()

    // Single 100% slice renders continuous closed circle
    const singleEl = await mount<MoulDoughnutChart>(html`
      <moul-doughnut-chart .data=${[{ name: 'Solo', value: 100 }]}></moul-doughnut-chart>
    `)
    const singleSlice = singleEl.shadowRoot!.querySelector<SVGPathElement>('.slice')
    expect(singleSlice).not.toBeNull()
    const d = singleSlice!.getAttribute('d')
    expect(d?.includes('NaN')).toBe(false)
    expect(d?.startsWith('M')).toBe(true)
  })

  it('CHART-DGN-09: Fast-check property test: path data d starts with M and never contains NaN', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 10 }),
            value: fc.integer({ min: 1, max: 1000 }),
          }),
          { minLength: 1, maxLength: 8 },
        ),
        async (dataItems) => {
          const el = await mount<MoulDoughnutChart>(html`
            <moul-doughnut-chart .data=${dataItems}></moul-doughnut-chart>
          `)
          const slices = el.shadowRoot!.querySelectorAll<SVGPathElement>('.slice')
          expect(slices.length).toBe(dataItems.length)
          slices.forEach((slice) => {
            const d = slice.getAttribute('d')
            expect(d).toBeTruthy()
            expect(d?.startsWith('M')).toBe(true)
            expect(d?.includes('NaN')).toBe(false)
          })
          el.remove()
        },
      ),
      { numRuns: 10 },
    )
  })
})
```

---

## 5. Verification Method

To verify the implementation once executed by the worker:
1. **Vitest Unit Test Suite**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts
   ```
   *Expected Result*: All existing tests (Milestones 1 & 2) and new DoughnutChart tests (CHART-DGN-01 through CHART-DGN-09) pass 100%.

2. **Dependency & Zero-React Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected Result*: Exit code 0, 0 banned React packages.

3. **Biome Code Linter**:
   ```bash
   bun run lint
   ```
   *Expected Result*: Passes without errors on `ui/src/components/DoughnutChart`.

4. **Invalidation Conditions**:
   - Any import of `react`, `react-dom`, `recharts`, or `@stylexjs/stylex`.
   - SVG path strings generating `NaN`.
   - Lack of `part="slice"`, `part="center"`, or missing `point-hover` event dispatch.
