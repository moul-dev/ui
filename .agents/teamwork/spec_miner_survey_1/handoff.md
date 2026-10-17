# Phase 8: Charts & Data Visualization (Category 1) — Specification Analysis Report

**Investigator**: `spec_miner_survey_1`  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_survey_1`  
**Milestone**: Phase 8: Category 1 — Charts & Data Visualization (7 Components + 2 Companions + Container)  
**Date**: 2026-10-17  

---

## 1. Observation

### 1.1 Authoritative Specification Citations

1. **`ORIGINAL_REQUEST.md` (Lines 221–266)**:
   > "Implement Phase 8 of the design specification: Rebuild Category 1 — Charts & Data Visualization (7 Components + 2 Companions) as Lit Web Components powered by `d3-scale`, `d3-shape`, and `motion`."  
   > - **R1. Chart Components & Companions Rebuild:** Implement `moul-chart-container`, `moul-chart-tooltip`, `moul-line-chart`, `moul-area-chart`, `moul-bar-chart`, `moul-doughnut-chart`, `moul-top-list`, `moul-stat`, `moul-percentage-bar`, and `moul-percentage-circle` as Lit Web Components, registered via idempotent `defineElement` under the `moul-` prefix, with zero React/Recharts dependencies.  
   > - **R2. SVG Geometry & Color Token Mapping:** Generate SVG geometries using `d3-scale` and `d3-shape` without third-party chart wrappers, styling chart series with `--color-chart-1` through `--color-chart-8` CSS design tokens.  
   > - **R3. Responsive Viewports, Empty States & Micro-Animations:** Make `moul-chart-container` responsive to dimension changes via `LayoutIndicatorController` and render `<slot name="empty">` when data is missing or empty. Animate SVG path/geometry transitions with `motion` (duration 200–500ms, respecting `prefers-reduced-motion: reduce`) and numeric stat changes with `NumberSpringController`.  
   > - **R4. Data Point Tooltip Interaction:** Open and position `moul-chart-tooltip` via the native Popover API upon pointer interaction over chart data points, and close it when leaving.  
   > - **R5. Verification Test Suite:** Provide unit and integration tests in `ui/src/components/Charts.test.ts` covering SVG path rendering, empty state handling, responsive resize triggers, and interactive point hover behavior.

2. **`rdt/requirements.md` (Requirement 7: Lines 147–161)**:
   > - **Req 7.1:** THE Library SHALL implement LineChart, AreaChart, BarChart, DoughnutChart, TopList, Stat, and PercentageBar as LitElements that render SVG using `d3-scale` for axis scaling and `d3-shape` for path generation.  
   > - **Req 7.2:** THE Library SHALL implement PercentageCircle as a LitElement that renders an SVG arc using `d3-shape`.  
   > - **Req 7.3:** WHEN a chart component's data property is updated, THE Library SHALL animate the SVG path transition using the `motion` library with a duration between 200 ms and 500 ms.  
   > - **Req 7.4:** THE Library SHALL implement ChartContainer as a LitElement that provides a responsive SVG viewport, re-rendering the chart SVG whenever the LayoutIndicatorController reports a dimension change.  
   > - **Req 7.5:** IF a chart component's data property is `null`, `undefined`, or an array with length zero, THEN THE Library SHALL render the empty state slot within the ChartContainer in place of the SVG.  
   > - **Req 7.6:** THE Library SHALL use `--color-chart-1` through `--color-chart-8` CSS custom properties from the CSS_Token_Layer for chart series colors.  
   > - **Req 7.7:** WHEN the pointer enters a chart data point's hit area, THE Library SHALL open the ChartTooltip LitElement via the Popover API, displaying the data point's label and value.  
   > - **Req 7.8:** WHEN the pointer leaves a chart data point's hit area, THE Library SHALL close the ChartTooltip via the Popover API.

3. **`rdt/design.md` (Section 8.1: Lines 635–650)**:
   > "All chart components use `d3-scale` (`scaleLinear`, `scaleBand`, `scalePoint`, `scaleTime`) and `d3-shape` (`line`, `area`, `pie`, `arc`, `curveMonotoneX`), style series with `--color-chart-1` through `--color-chart-8`, animate SVG path/geometry updates with `motion` (`200ms–500ms`, default `350ms` via `subtleAnimate` + `CHART_EASE`), and render an empty state `<slot name="empty">` inside `moul-chart-container` when `data` is `null`, `undefined`, or `[]`."

4. **`rdt/tasks.md` (Phase 8: Tasks 8.1–8.5, Lines 168–183)**:
   > - **Task 8.1:** Implement `moul-chart-container` and `moul-chart-tooltip` (Responsive SVG viewport re-rendering on `LayoutIndicatorController` resize, `<slot name="empty">`, Popover API tooltip with coordinates).  
   > - **Task 8.2:** Implement `moul-line-chart` and `moul-area-chart` (SVG paths using `d3-scale` and `d3-shape`, `--color-chart-1`–`--color-chart-8`, 350ms motion transitions).  
   > - **Task 8.3:** Implement `moul-bar-chart` and `moul-doughnut-chart` (horizontal/vertical layout, arc slices with `inner-radius-ratio`, staggered motion).  
   > - **Task 8.4:** Implement `moul-top-list`, `moul-stat`, `moul-percentage-bar`, and `moul-percentage-circle` (scaled horizontal bars, `NumberSpringController` KPI cards, SVG arc progress).  
   > - **Task 8.5:** Write Chart Component Tests (`ui/src/components/Charts.test.ts`).

5. **Token Definitions (`ui/src/styles/style.css`, Lines 321–328)**:
   ```css
   --color-chart-1: light-dark(oklch(0.6 0.18 250), oklch(0.65 0.16 250));
   --color-chart-2: light-dark(oklch(0.75 0.15 75), oklch(0.75 0.14 75));
   --color-chart-3: light-dark(oklch(0.65 0.18 5), oklch(0.68 0.16 5));
   --color-chart-4: light-dark(oklch(0.62 0.2 300), oklch(0.65 0.18 300));
   --color-chart-5: light-dark(oklch(0.68 0.16 195), oklch(0.7 0.14 195));
   --color-chart-6: light-dark(oklch(0.58 0.16 45), oklch(0.62 0.15 45));
   --color-chart-7: light-dark(oklch(0.64 0.17 145), oklch(0.68 0.15 145));
   --color-chart-8: light-dark(oklch(0.6 0 0), oklch(0.65 0 0));
   ```

6. **Current Codebase State**:
   - `ui/package.json` already contains `d3-scale: "^4.0.2"`, `d3-shape: "^3.2.0"`, `lit: "^3.2.1"`, `motion: "^13.4.1"`.
   - Existing chart folders (`ui/src/components/{ChartContainer,ChartTooltip,LineChart,AreaChart,BarChart,DoughnutChart,TopList,Stat,Percentage}`) still contain legacy React (`.tsx`) files importing `react`, `recharts`, and `@stylexjs/stylex`.
   - `scripts/verify-no-react.ts` strictly bans `react`, `recharts`, and `@stylexjs/*`.
   - Controllers already exist and are tested: `LayoutIndicatorController`, `NumberSpringController`, `OverlayPresenceController`.
   - Test environment setup (`ui/src/test-setup.ts`) provides `MockResizeObserver`, `triggerResize`, and Popover API shims.

---

### 1.2 Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Chart Container | `moul-chart-container` | Responsive wrapper component hosting SVG charts, managing viewport dimensions and empty fallback state | `title: string = ''`, `description: string = ''`, `height: number = 300`, `isEmpty: boolean = false` (`is-empty`), slots: `default`, `header`, `empty`, `legend` | Emits `viewport-resize` (`{ detail: { width, height, breakpoint } }`); renders card shell with title/desc, legend, and chart viewport | Renders `<slot name="empty">` or default "No data available" when `isEmpty` is true or child chart has empty data | `rdt/design.md` § 8.1, `rdt/requirements.md` Req 7.4–7.5 |
| 2 | Chart Tooltip | `moul-chart-tooltip` | Popover API-driven data hover tooltip floating over data points with spring positioning | `label: string = ''`, `value: string = ''`, `color: string = 'var(--color-chart-1)'`, `isOpen: boolean = false` (`is-open`), `x: number = 0`, `y: number = 0`, `payload: any[] = []`, slot: `default` | Floating top-layer popover rendering indicator dot, label, and formatted value | Falls back to fixed positioning (`supportsNativePopoverAndAnchor`) with `console.warn` if Popover API is unavailable | `rdt/design.md` § 8.1 & § 7.1, `rdt/requirements.md` Req 7.7–7.8 |
| 3 | Time Series / Line | `moul-line-chart` | D3-scale & D3-shape powered multi-series line chart with smooth curves and animated stroke transitions | `data: Record<string, unknown>[] = []`, `xKey: string = 'name'` (`x-key`), `series: ChartSeries[] = []`, `height: number = 300`, `showGrid: boolean = true` (`show-grid`), slot: `empty` | Emits `point-hover` (`{ detail: { point, series, x, y, value, label } }`); renders SVG `<path>` and hit `<circle>`s | If data is `null`, `undefined`, or `[]`, renders `<slot name="empty">`; clamps single-point or identical-value domains | `rdt/design.md` § 8.1, `rdt/requirements.md` Req 7.1, 7.3, 7.6 |
| 4 | Gradient Area | `moul-area-chart` | Multi-series area chart with D3 curves, semi-transparent gradient fills, and stacking support | `data: Record<string, unknown>[] = []`, `xKey: string = 'name'` (`x-key`), `series: ChartSeries[] = []`, `height: number = 300`, `stacked: boolean = false`, `showGrid: boolean = true`, slot: `empty` | Emits `point-hover`; renders SVG area `<path>` with `<linearGradient>` and boundary stroke `<path>` | Renders `<slot name="empty">` on empty data; clamps domain when min == max | `rdt/design.md` § 8.1, `rdt/requirements.md` Req 7.1, 7.3, 7.6 |
| 5 | Bar Visualization | `moul-bar-chart` | Vertical and horizontal bar chart supporting grouped, stacked, and categorical coloring modes | `data: Record<string, unknown>[] = []`, `xKey: string = 'name'` (`x-key`), `series: ChartSeries[] = []`, `height: number = 300`, `layout: 'horizontal' \| 'vertical' = 'vertical'`, `stacked: boolean = false`, `showGrid: boolean = true`, `categorical: boolean = false`, slot: `empty` | Emits `point-hover`; renders SVG `<rect>` elements with rounded corners | Renders `<slot name="empty">` on empty data; non-numeric values rendered as zero-height/width | `rdt/design.md` § 8.1, `rdt/requirements.md` Req 7.1, 7.3 |
| 6 | Circular Part-to-Whole | `moul-doughnut-chart` | D3 pie & arc generator doughnut/pie chart with configurable inner cutout and center label slot | `data: DoughnutDataItem[] = []`, `innerRadiusRatio: number = 0.65` (`inner-radius-ratio`), `height: number = 280`, `centerLabel: string = ''` (`center-label`), `centerValue: string = ''`, slots: `empty`, `center` | Emits `point-hover`; renders SVG arc slice `<path>`s centered at `(cx, cy)` | Renders `<slot name="empty">` on empty data; all-zero data avoids NaN in D3 arc computation | `rdt/design.md` § 8.1, `rdt/requirements.md` Req 7.1, 7.3 |
| 7 | Ranked Bar List | `moul-top-list` | Ranked list visualization mapping rows to proportional horizontal progress bars | `data: TopListItem[] = []`, `maxItems: number = 10` (`max-items`), `maxValue?: number` (`max-value`), `barColor: string = 'var(--color-chart-1)'`, `multiColor: boolean = false` (`multi-color`), `valueFormatter?: (v: number) => string`, slot: `empty` | Emits `item-press` (`{ detail: { item, index } }`); renders ranked rows with labels, filled bar tracks, and formatted values | Empty state rendered on empty data; division-by-zero guarded if max value is 0 | `rdt/design.md` § 8.1, `rdt/requirements.md` Req 7.1, 7.3 |
| 8 | KPI Metric Card | `moul-stat` | Metric card displaying formatted numeric KPI with spring physics ticker and trend status indicator | `label: string = ''`, `value: number = 0`, `prefix: string = ''`, `suffix: string = ''`, `trend: 'up' \| 'down' \| 'neutral' = 'neutral'`, `trendValue: string = ''` (`trend-value`), `trendLabel: string = ''` (`trend-label`), `tone: SemanticTone = 'primary'`, `variant: VisualVariant = 'flat'`, slots: `icon`, `footer`, `default` | Renders styled card with spring-animated counter, status badge (`+12.4%`), trend arrow icon, and slotted icon/footer | Values outside `[-999_999_999, 999_999_999]` clamped by `NumberSpringController`; non-numeric values default to 0 | `rdt/design.md` § 8.1, `rdt/requirements.md` Req 7.1 |
| 9 | Linear Progress Bar | `moul-percentage-bar` | Horizontal progress bar displaying completion percentage (0–100) with smooth spring fill transition | `value: number = 0` (0–100), `size: 'sm' \| 'md' \| 'lg' = 'md'`, `tone: SemanticTone = 'primary'`, `color: string = ''`, `label: string = ''`, `showLabel: boolean = true` (`show-label`), `showValueText: boolean = true` (`show-value-text`), slots: `label`, `default` | Renders track and spring-animated fill bar with header label and percentage string | Clamps `value < 0` to 0 and `value > 100` to 100 | `rdt/design.md` § 8.1, `rdt/requirements.md` Req 7.1, 7.3 |
| 10 | Circular Progress Ring | `moul-percentage-circle` | SVG circular progress ring displaying completion percentage (0–100) via D3 arc / stroke-dashoffset | `value: number = 0` (0–100), `size: number = 80`, `strokeWidth: number = 8` (`stroke-width`), `tone: SemanticTone = 'primary'`, `color: string = ''`, `label: string = ''`, `showLabel: boolean = true` (`show-label`), `showValueText: boolean = true` (`show-value-text`), slots: `label`, `center` | Renders SVG background ring and animated foreground stroke with centered percentage text | Clamps `value` to 0–100; strokeWidth guarded against exceeding `size / 2` | `rdt/design.md` § 8.1, `rdt/requirements.md` Req 7.1, 7.2, 7.3 |

---

### 1.3 Edge Cases Discovered

| # | Feature | Input / Condition | Observed Behavior |
|---|---------|-------------------|-------------------|
| 1 | `moul-chart-container` | Slotted chart data is `null`, `undefined`, or `[]` | Renders `<slot name="empty">` containing empty fallback state instead of broken SVG viewport |
| 2 | `moul-chart-container` | Container resized via window resize or CSS flex/grid layout change | `LayoutIndicatorController` observes dimension change, triggers `requestUpdate()`, and emits `viewport-resize` event |
| 3 | `moul-chart-tooltip` | Browser does not support native Popover API or CSS Anchor Positioning | Emits `console.warn` once per instance and falls back to fixed coordinates positioning without throwing |
| 4 | `moul-chart-tooltip` | Pointer moves rapidly between adjacent data points | `OverlayPresenceController` transitions coordinates smoothly without rapid open/close unmount flickering |
| 5 | `moul-line-chart` | Dataset with single data point (`data.length === 1`) | SVG path cannot compute curve; renders single coordinate point `<circle>` without `NaN` in SVG path string |
| 6 | `moul-line-chart` | Dataset where all Y values are identical (e.g., all 0 or all 100) | `scaleLinear` domain `[val, val]` causes division by zero; domain automatically expanded to `[val - 1, val + 1]` or `[0, val || 1]` |
| 7 | `moul-line-chart` | Dataset with negative values | Y-axis scale domain adjusts to `[minVal, maxVal]` with baseline at appropriate Y position |
| 8 | `moul-line-chart` & `moul-area-chart` | More than 8 series provided | Color palette loops smoothly modulo 8 across `var(--color-chart-1)` through `var(--color-chart-8)` |
| 9 | `moul-area-chart` | `stacked: true` | Accumulates baseline offset per category; upper area stacks above previous series rather than overlapping from 0 |
| 10 | `moul-bar-chart` | `layout: 'horizontal'` vs `'vertical'` | Inverts axis scales: category axis uses `scaleBand` on Y (horizontal) vs X (vertical); value axis uses `scaleLinear` on X vs Y |
| 11 | `moul-doughnut-chart` | `innerRadiusRatio: 0` | Renders standard solid pie chart; ratio `0.65` renders doughnut; values clamped to `[0, 0.95]` |
| 12 | `moul-doughnut-chart` | Single data item (100% slice) | D3 pie generator creates 0 to 2π arc; renders seamless full circular slice |
| 13 | `moul-top-list` | `data` contains values with `Math.max(...) === 0` | Avoids `0 / 0 = NaN`; default scale max becomes 1 with 0% bar fill |
| 14 | `moul-stat` | Target value exceeds `999,999,999` or drops below `-999,999,999` | `NumberSpringController` clamps input to `[-999_999_999, 999_999_999]` and snaps when delta `<= 0.5` |
| 15 | All Chart Components | `prefers-reduced-motion: reduce` is enabled | `subtleAnimate` / `prefersReducedMotion()` collapses animation duration to 0, applying final SVG geometry immediately |

---

## 2. Logic Chain & Component Contract Breakdown

### 2.1 Shared Registration, Types & Token Architecture

All 10 elements must adhere to the monorepo's strict architectural standards:
1. **Registration**: Idempotent registration using `defineElement(tagName, constructor)` imported from `../../utils/define-element`. Emits a warning on duplicate registration without throwing.
2. **Global Typings**: Every component must augment `HTMLElementTagNameMap`:
   ```ts
   declare global {
     interface HTMLElementTagNameMap {
       'moul-chart-container': MoulChartContainer
       'moul-chart-tooltip': MoulChartTooltip
       'moul-line-chart': MoulLineChart
       'moul-area-chart': MoulAreaChart
       'moul-bar-chart': MoulBarChart
       'moul-doughnut-chart': MoulDoughnutChart
       'moul-top-list': MoulTopList
       'moul-stat': MoulStat
       'moul-percentage-bar': MoulPercentageBar
       'moul-percentage-circle': MoulPercentageCircle
     }
   }
   ```
3. **Zero-React Strict Rule**: Zero imports from `react`, `react-dom`, `recharts`, or `@stylexjs/*`.
4. **Color Tokens**: Standard palette maps to CSS custom properties:
   - Series 1: `var(--color-chart-1)`
   - Series 2: `var(--color-chart-2)`
   - Series 3: `var(--color-chart-3)`
   - Series 4: `var(--color-chart-4)`
   - Series 5: `var(--color-chart-5)`
   - Series 6: `var(--color-chart-6)`
   - Series 7: `var(--color-chart-7)`
   - Series 8: `var(--color-chart-8)`
   - Helper function `getChartColor(index: number): string` returns `var(--color-chart-${(index % 8) + 1})`.

5. **Shared Data Interfaces** (in `ui/src/components/ChartCommon.ts`):
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
   ```

---

### 2.2 Deep Dive: The 10 Elements

#### 1. `moul-chart-container` (`MoulChartContainer`)
- **Purpose**: Container card providing responsive SVG viewport calculation and empty state gating.
- **Properties & Attributes**:
  - `title`: `string = ''` (reflected attribute `title`)
  - `description`: `string = ''` (reflected attribute `description`)
  - `height`: `number = 300` (reflected attribute `height`, type `Number`)
  - `isEmpty`: `boolean = false` (reflected attribute `is-empty`, type `Boolean`)
- **Controllers**:
  - `LayoutIndicatorController(this, { observeDimensions: true })`
  - Reacts to width/height resize, recalculates SVG viewport bounds, and calls `this.requestUpdate()`.
- **Slots**:
  - `default`: Slotted chart component.
  - `header`: Custom header layout (replaces or augments title/description).
  - `empty`: Custom empty state markup shown when `isEmpty` is true or slotted chart is empty.
  - `legend`: Optional slotted legend or metadata section.
- **Events**:
  - `viewport-resize`: Emitted when dimensions change (`detail: { width: number, height: number, breakpoint: string }`).
- **Empty State Rule**:
  - When `isEmpty` is `true`, renders `<slot name="empty"><p class="empty-message">No data available</p></slot>` in place of the default chart slot.

#### 2. `moul-chart-tooltip` (`MoulChartTooltip`)
- **Purpose**: Lightweight Popover API tooltip that floats over hovered chart points.
- **Properties & Attributes**:
  - `label`: `string = ''` (attribute `label`)
  - `value`: `string = ''` (attribute `value`)
  - `color`: `string = 'var(--color-chart-1)'` (attribute `color`)
  - `isOpen`: `boolean = false` (reflected attribute `is-open`, type `Boolean`)
  - `x`: `number = 0` (property `x`, coordinate in px)
  - `y`: `number = 0` (property `y`, coordinate in px)
  - `payload`: `any[] = []` (property `payload`, optional multi-series data)
- **Controllers & Popover API**:
  - Composes `OverlayPresenceController(this, { preset: 'tooltip', popover: () => this.popoverEl })`.
  - Inner popover container has `popover="manual"`.
  - When opened via `show(x: number, y: number, label: string, value: string, color?: string)`:
    - Sets coordinates `x`, `y` and opens via `setOpen(true)`.
    - Coordinates applied via inline style: `transform: translate3d(${x}px, ${y}px, 0) translate(-50%, -100%) translateY(-8px)`.
    - Uses CSS Anchor Positioning when supported (`position-anchor`), or fallback fixed positioning with `console.warn` when unsupported.
  - When closed via `hide()` or `setOpen(false)`:
    - Plays tooltip exit animation (`opacity: [1, 0], scale: [1, 0.96]`, `140ms`) and hides popover.
- **Slots**:
  - `default`: Allows consumers to provide arbitrary custom tooltip content.

#### 3. `moul-line-chart` (`MoulLineChart`)
- **Purpose**: Multi-series line chart with D3 curves and motion path draw transitions.
- **Properties & Attributes**:
  - `data`: `Record<string, unknown>[] = []` (`attribute: false`)
  - `xKey`: `string = 'name'` (attribute `x-key`)
  - `series`: `ChartSeries[] = []` (`attribute: false`)
  - `height`: `number = 300` (attribute `height`, type `Number`)
  - `showGrid`: `boolean = true` (attribute `show-grid`, type `Boolean`)
  - `curve`: `string = 'monotoneX'` (attribute `curve`)
  - `valueFormatter`: `((value: any) => string) | undefined` (`attribute: false`)
- **D3 Pipeline**:
  - `d3-scale`:
    - `xScale = scalePoint().domain(data.map(d => String(d[xKey]))).range([paddingLeft, width - paddingRight])`
    - `yScale = scaleLinear().domain([minY <= 0 ? minY : 0, maxY || 1]).range([height - paddingBottom, paddingTop]).nice()`
  - `d3-shape`:
    - `lineGenerator = line<Record<string, unknown>>().x(d => xScale(String(d[xKey])) ?? 0).y(d => yScale(Number(d[s.key])) ?? 0).curve(curveMonotoneX)`
- **Motion & Interactions**:
  - SVG `<path>` morphs/draws over `350ms` using `CHART_EASE` via `subtleAnimate`.
  - Hover circles on data points scale `1 -> 1.35` via `SPRING_SNAPPY` on `pointerenter`.
  - Pointer hover dispatches `point-hover` event and opens `moul-chart-tooltip`.
- **Empty State**:
  - When `!data || data.length === 0`, renders `<slot name="empty"></slot>`.

#### 4. `moul-area-chart` (`MoulAreaChart`)
- **Purpose**: Area chart with gradient fills and stacked or overlapping curves.
- **Properties & Attributes**:
  - `data`: `Record<string, unknown>[] = []` (`attribute: false`)
  - `xKey`: `string = 'name'` (attribute `x-key`)
  - `series`: `ChartSeries[] = []` (`attribute: false`)
  - `height`: `number = 300` (attribute `height`, type `Number`)
  - `stacked`: `boolean = false` (attribute `stacked`, type `Boolean`)
  - `showGrid`: `boolean = true` (attribute `show-grid`, type `Boolean`)
  - `valueFormatter`: `((value: any) => string) | undefined` (`attribute: false`)
- **D3 Pipeline**:
  - When `stacked` is true: Computes cumulative baseline offsets per category across series.
  - `areaGenerator = area<Record<string, unknown>>().x(d => xScale(...)).y0(d => yScale(y0)).y1(d => yScale(y1)).curve(curveMonotoneX)`
  - Renders unique SVG `<defs><linearGradient id="..."><stop offset="0%" stop-opacity="0.25" /><stop offset="100%" stop-opacity="0" /></linearGradient></defs>`.
  - Top boundary stroke generated via `line<Record<string, unknown>>()`.
- **Motion**:
  - Area `<path>` + fill opacity animated `[0, 1]` over `350ms` with `CHART_EASE`.

#### 5. `moul-bar-chart` (`MoulBarChart`)
- **Purpose**: Vertical and horizontal bar chart with grouped, stacked, or categorical layout.
- **Properties & Attributes**:
  - `data`: `Record<string, unknown>[] = []` (`attribute: false`)
  - `xKey`: `string = 'name'` (attribute `x-key`)
  - `series`: `ChartSeries[] = []` (`attribute: false`)
  - `height`: `number = 300` (attribute `height`, type `Number`)
  - `layout`: `'horizontal' | 'vertical' = 'vertical'` (attribute `layout`)
  - `stacked`: `boolean = false` (attribute `stacked`, type `Boolean`)
  - `categorical`: `boolean = false` (attribute `categorical`, type `Boolean`)
  - `showGrid`: `boolean = true` (attribute `show-grid`, type `Boolean`)
  - `valueFormatter`: `((value: any) => string) | undefined` (`attribute: false`)
- **D3 Pipeline**:
  - Vertical: Category axis on X via `scaleBand().padding(0.2)`; value axis on Y via `scaleLinear()`.
  - Horizontal: Category axis on Y via `scaleBand().padding(0.2)`; value axis on X via `scaleLinear()`.
  - Sub-series grouping: Sub-scale `scaleBand().domain(seriesKeys).range([0, categoryBand.bandwidth()]).padding(0.05)`.
- **Motion**:
  - Staggered bar growth: `scaleY: [0, 1]` (vertical) or `scaleX: [0, 1]` (horizontal) over `350ms` with `delay: stagger(0.025)`.
- **Events**:
  - Emits `point-hover` on bar pointer interaction.

#### 6. `moul-doughnut-chart` (`MoulDoughnutChart`)
- **Purpose**: Part-to-whole circular visualization with configurable inner cutout and center label.
- **Properties & Attributes**:
  - `data`: `DoughnutDataItem[] = []` (`attribute: false`)
  - `innerRadiusRatio`: `number = 0.65` (attribute `inner-radius-ratio`, type `Number`)
  - `height`: `number = 280` (attribute `height`, type `Number`)
  - `centerLabel`: `string = ''` (attribute `center-label`)
  - `centerValue`: `string = ''` (attribute `center-value`)
  - `padAngle`: `number = 0.03`
  - `cornerRadius`: `number = 4`
- **D3 Pipeline**:
  - `pieGenerator = pie<DoughnutDataItem>().value(d => Math.max(0, d.value)).sort(null).padAngle(this.padAngle)`
  - `arcGenerator = arc<PieArcDatum<DoughnutDataItem>>().innerRadius(outerRadius * this.innerRadiusRatio).outerRadius(outerRadius).cornerRadius(this.cornerRadius)`
- **Slots**:
  - `empty`: Gated when data is empty.
  - `center`: Custom center text or KPI widget.
- **Motion**:
  - Staggered arc slice entrance: `scale: [0.88, 1], opacity: [0, 1]` over `380ms` with `stagger(0.04)`.
  - Active hovered slice expands outer radius by `4px` with `SPRING_SNAPPY`.

#### 7. `moul-top-list` (`MoulTopList`)
- **Purpose**: Ranked list of metrics with scaled horizontal progress tracks.
- **Properties & Attributes**:
  - `data`: `TopListItem[] = []` (`attribute: false`)
  - `maxItems`: `number = 10` (attribute `max-items`, type `Number`)
  - `maxValue`: `number | undefined = undefined` (attribute `max-value`, type `Number`)
  - `barColor`: `string = 'var(--color-chart-1)'` (attribute `bar-color`)
  - `multiColor`: `boolean = false` (attribute `multi-color`, type `Boolean`)
  - `valueFormatter`: `((v: number) => string) | undefined` (`attribute: false`)
- **Rendering**:
  - Slices `data.slice(0, this.maxItems)`.
  - Computes `computedMax = this.maxValue ?? Math.max(...data.map(d => d.value), 1)`.
  - Percentage: `Math.min(100, Math.max(0, (item.value / computedMax) * 100))`.
  - Colors: row index modulo 8 token if `multiColor` is true, otherwise `barColor`.
- **Motion**:
  - Staggered row entrance: `y: [6, 0], opacity: [0, 1]` with `stagger(0.03)`.
  - Bar width animation: `350ms` with `CHART_EASE`.
- **Events**:
  - Emits `item-press` (`{ detail: { item, index } }`).

#### 8. `moul-stat` (`MoulStat`)
- **Purpose**: Key performance indicator (KPI) card with spring-animated numeric counter.
- **Properties & Attributes**:
  - `label`: `string = ''` (reflected attribute `label`)
  - `value`: `number = 0` (reflected attribute `value`, type `Number`)
  - `prefix`: `string = ''` (attribute `prefix`)
  - `suffix`: `string = ''` (attribute `suffix`)
  - `trend`: `'up' | 'down' | 'neutral' = 'neutral'` (reflected attribute `trend`)
  - `trendValue`: `string = ''` (attribute `trend-value`)
  - `trendLabel`: `string = ''` (attribute `trend-label`)
  - `tone`: `SemanticTone = 'primary'` (reflected attribute `tone`, normalized via `normalizeTone`)
  - `variant`: `VisualVariant = 'flat'` (reflected attribute `variant`, normalized via `normalizeVariant`)
- **Controllers**:
  - Composes `NumberSpringController(this, { initialValue: this.value })`.
  - On `updated(changedProperties)`: calls `this.numberSpring.setTarget(this.value)`.
  - Numeric display shows `${this.prefix}${Math.round(this.numberSpring.displayValue).toLocaleString()}${this.suffix}`.
- **Styling**:
  - Uses `semanticToneStyles` across 25 tone × variant combinations.
  - Trend badge with up/down arrow SVG icons.
- **Slots**:
  - `icon`: Custom KPI icon in header.
  - `footer`: Supplemental text/stats below the value.
  - `default`: Supplemental body content.

#### 9. `moul-percentage-bar` (`MoulPercentageBar`)
- **Purpose**: Linear percentage completion bar (0–100%).
- **Properties & Attributes**:
  - `value`: `number = 0` (reflected attribute `value`, type `Number`, clamped 0–100)
  - `size`: `'sm' | 'md' | 'lg' = 'md'` (reflected attribute `size`)
  - `tone`: `SemanticTone = 'primary'` (reflected attribute `tone`)
  - `color`: `string = ''` (attribute `color`, defaults to `var(--color-chart-1)`)
  - `label`: `string = ''` (attribute `label`)
  - `showLabel`: `boolean = true` (attribute `show-label`, type `Boolean`)
  - `showValueText`: `boolean = true` (attribute `show-value-text`, type `Boolean`)
- **Motion**:
  - Fill bar animated via `SPRING_GENTLE` (`350ms`).
- **Slots**:
  - `label`: Custom label slot.

#### 10. `moul-percentage-circle` (`MoulPercentageCircle`)
- **Purpose**: Circular SVG arc progress ring (0–100%).
- **Properties & Attributes**:
  - `value`: `number = 0` (reflected attribute `value`, type `Number`, clamped 0–100)
  - `size`: `number = 80` (attribute `size`, type `Number`, diameter in px)
  - `strokeWidth`: `number = 8` (attribute `stroke-width`, type `Number`, stroke thickness in px)
  - `tone`: `SemanticTone = 'primary'` (reflected attribute `tone`)
  - `color`: `string = ''` (attribute `color`, defaults to `var(--color-chart-1)`)
  - `label`: `string = ''` (attribute `label`)
  - `showLabel`: `boolean = true` (attribute `show-label`, type `Boolean`)
  - `showValueText`: `boolean = true` (attribute `show-value-text`, type `Boolean`)
- **SVG Geometry**:
  - `radius = (this.size - this.strokeWidth) / 2`
  - `circumference = 2 * Math.PI * radius`
  - `dashoffset = circumference - (clampedValue / 100) * circumference`
  - Background track `<circle>` and foreground progress `<circle>` with `stroke-dasharray="${circumference}" stroke-dashoffset="${dashoffset}" stroke-linecap="round"`.
- **Motion**:
  - Animated `stroke-dashoffset` transition (`SPRING_GENTLE`, `350ms`).
- **Slots**:
  - `label`: Custom label slot.
  - `center`: Custom center content slot (overriding default percentage text).

---

## 3. Caveats

1. **D3 Dependencies in Build Pipeline**:
   `d3-scale` and `d3-shape` are ESM packages already listed in `ui/package.json`. No external CSS or polyfills are needed for D3, but care must be taken in Vitest/happy-dom tests so that SVG path and bounding box measurements do not fail when `getBBox()` is not fully implemented in happy-dom.
2. **Happy-DOM SVG & ResizeObserver Mocking**:
   In test environments (`happy-dom`), `getBoundingClientRect()` on SVG elements or custom elements returns all zeroes unless mocked or triggered via `triggerResize(element, { width: 600, height: 300 })`. Tests in `ui/src/components/Charts.test.ts` should use `triggerResize` from `ui/src/test-setup.ts`.
3. **Popover API in Tests**:
   The test environment includes the Popover shim (`showPopover`, `hidePopover`, `togglePopover`, `:popover-open`). Tooltip assertions can test `isOpen` and `popoverEl.matches(':popover-open')`.
4. **Existing React Artifacts**:
   The existing `.tsx` files in `ui/src/components/{ChartContainer,ChartTooltip,LineChart,AreaChart,BarChart,DoughnutChart,TopList,Stat,Percentage}` must be replaced with clean Lit `.ts` components as part of Phase 8 execution.

---

## 4. Conclusion

The specification for Phase 8: Category 1 — Charts & Data Visualization is fully mapped and verified. All 10 elements:
- Have clearly specified attributes, reflected properties, slots, and events.
- Implement responsive SVG viewport rendering via `LayoutIndicatorController`.
- Gate empty states with `<slot name="empty">`.
- Use `d3-scale` and `d3-shape` for mathematical scaling, curves, and arc generation.
- Style series with `--color-chart-1` through `--color-chart-8`.
- Animate geometry transitions with `motion` presets (`350ms`, `CHART_EASE`, `SPRING_SNAPPY`, `SPRING_GENTLE`, `stagger`) and numbers with `NumberSpringController`.
- Drive interactive point tooltips via the native Popover API.
- Fully adhere to the Zero-React policy, idempotent `defineElement`, and `HTMLElementTagNameMap` contracts.

---

## 5. Verification Method

To independently verify this specification and validate the future Phase 8 implementation:

1. **Verify No React Dependencies**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected outcome*: Exit code 0, 0 banned packages/imports.

2. **Verify Component Unit & Integration Tests**:
   ```bash
   bun run test ui/src/components/Charts.test.ts
   ```
   *Expected outcome*: 100% passing tests for:
   - Registration of all 10 elements in `customElements` and `HTMLElementTagNameMap`.
   - SVG path rendering for `moul-line-chart`, `moul-area-chart`, `moul-bar-chart`, `moul-doughnut-chart`, `moul-percentage-bar`, and `moul-percentage-circle`.
   - Responsive viewport resize on `moul-chart-container` via `triggerResize`.
   - Empty state slot rendering when `data = []`, `data = null`, or `isEmpty = true`.
   - Popover tooltip show/hide interaction on pointerenter/pointerleave.
   - `NumberSpringController` interpolation on `moul-stat`.

3. **Verify Linter & Formatter**:
   ```bash
   bun run lint
   ```
   *Expected outcome*: 0 Biome lint errors.

4. **Verify TypeScript compilation**:
   ```bash
   bun run --cwd ui build
   ```
   *Expected outcome*: Successful build of `dist/moul-ui.js`, `dist/assets/style.css`, and `dist/src/index.d.ts`.
