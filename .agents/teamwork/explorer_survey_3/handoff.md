# Handoff Report: Phase 8 Charts Testing Infrastructure & Acceptance Strategy

**Agent**: `explorer_survey_3`  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_survey_3`  
**Milestone**: Phase 8 Category 1 — Charts & Data Visualization Testing Infrastructure & Test Suite Specifications  
**Date**: 2026-10-17  

---

## 1. Observation

### 1.1 Test Harness & Happy-DOM Environment (`ui/src/test-setup.ts`)
- **File**: `ui/src/test-setup.ts` (lines 1–618)
- **Web Animations API & Media Queries** (lines 27–53):
  - `BaseElementClass.prototype.getAnimations = () => []`
  - `CSS.supports = (_property: string, _value?: string) => false`
  - `window.matchMedia` mocked with `matches: false` by default, extensible per-test.
- **ElementInternals** (lines 56–239):
  - `MockElementInternalsImpl` provides full form-associated custom element emulation with `setFormValue`, `setValidity`, `reportValidity`, `validity`.
- **Native `<dialog>` Shim** (lines 241–319):
  - `HTMLDialogElement` shim tracks `open`, `showModal()`, `close()`.
  - Line 290–295: `showModal()` throws `DOMException` with `InvalidStateError` when `!this.isConnected`, exactly matching native browser behavior.
- **Popover API Shim** (lines 321–483):
  - `MockToggleEvent` implements `beforetoggle` and `toggle` events.
  - Line 376–411: `HtmlElementClass.prototype.showPopover` requires `popover` attribute (`if (this.getAttribute('popover') === null)` throws `DOMException`), requires `this.isConnected` (`throws DOMException`), and toggles `:popover-open` attribute and class.
  - Line 413–441: `hidePopover` removes `:popover-open`.
  - Line 468–482: `BaseElementClass.prototype.matches(':popover-open')` evaluates whether `:popover-open` attribute or class is present.
- **Deterministic `ResizeObserver` Controller** (lines 485–617):
  - `MockResizeObserver` records all observed elements and options in `activeObservers`.
  - `triggerResize(element: Element, options: TriggerResizeOptions)` (and `window.__triggerResize`) synchronously updates `element.getBoundingClientRect()` and dispatches `ResizeObserverEntry` records to all observers.
- **SVG Engine in Happy-DOM**:
  - Happy-DOM supports SVG parsing (`<svg>`, `<path>`, `<rect>`, `<circle>`, `<g>`, `<defs>`, `<linearGradient>`, `<stop>`, `<text>`) and DOM attribute reading/writing.
  - **Crucial limitation**: Happy-DOM does NOT compute graphical layouts or bounding boxes (`getBBox()`, `getPointAtLength()`, `getTotalLength()` return undefined or 0). All SVG geometries in charts must be computed via pure mathematical functions (`d3-scale`, `d3-shape`) without relying on browser layout engines.

### 1.2 Existing Component Test Suites (`ui/src/components/*.test.ts`)
Direct inspection of `Actions.test.ts` (662 lines), `Surfaces.test.ts` (742 lines), `Overlays.test.ts` (384 lines), and `Controllers.test.ts` (960 lines) reveals the universal testing pattern used throughout the repository:
1. **Mounting Helper**:
   ```typescript
   async function mount<T extends HTMLElement>(template: unknown): Promise<T> {
     const container = document.createElement('div')
     document.body.appendChild(container)
     render(template, container)
     const element = container.firstElementChild as T
     await awaitNestedUpdates(element)
     return element
   }
   ```
2. **Lit Reactive Lifecycle Synchronization**:
   ```typescript
   async function awaitNestedUpdates(root: Element): Promise<void> {
     if ('updateComplete' in root && (root as LitElement).updateComplete) {
       await (root as LitElement).updateComplete
     }
     const children = Array.from(root.querySelectorAll('*'))
     await Promise.all(
       children.map((child) => {
         if ('updateComplete' in child && (child as LitElement).updateComplete) {
           return (child as LitElement).updateComplete
         }
         return Promise.resolve()
       }),
     )
   }
   ```
3. **Clean Teardown**:
   ```typescript
   afterEach(() => {
     document.body.innerHTML = ''
     vi.restoreAllMocks()
     vi.useRealTimers()
   })
   ```
4. **Pointer Event Simulation**:
   ```typescript
   element.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
   element.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
   ```
5. **Deterministic Resize Testing**:
   ```typescript
   import { triggerResize } from '../test-setup'
   triggerResize(chartContainer, { width: 640, height: 320 })
   ```

### 1.3 Repository Chart Assets Survey
- Existing directories in `ui/src/components/`:
  - `LineChart/` (`LineChart.tsx`, `LineChart.styles.ts`)
  - `AreaChart/` (`AreaChart.tsx`, `AreaChart.styles.ts`)
  - `BarChart/` (`BarChart.tsx`, `BarChart.styles.ts`)
  - `DoughnutChart/` (`DoughnutChart.tsx`, `DoughnutChart.styles.ts`)
  - `ChartContainer/` (`ChartContainer.tsx`, `ChartContainer.styles.ts`)
  - `ChartTooltip/` (`ChartTooltip.tsx`, `ChartTooltip.styles.ts`)
  - `Stat/` (`Stat.tsx`, `Stat.styles.ts`)
  - `Percentage/` (`PercentageBar.tsx`, `PercentageCircle.tsx`, `Percentage.styles.ts`)
  - `TopList/` (`TopList.tsx`, `TopList.styles.ts`)
  - `ChartCommon.ts`
- **Finding**: These files are legacy React/Recharts/StyleX implementations. None have been migrated yet to Lit Web Components.
- **Dependencies in `ui/package.json`**:
  - `d3-scale: ^4.0.2` and `d3-shape: ^3.2.0` are installed in dependencies.
  - `@types/d3-scale: ^4.0.8` and `@types/d3-shape: ^3.1.6` are installed in devDependencies.
  - `motion: ^13.4.1` is installed.
  - `fast-check: ^3.23.2` is installed.
- **Design Tokens in `ui/src/styles/style.css`**:
  - Lines 320–328 define `--color-chart-1` through `--color-chart-8` using `light-dark(oklch(...), oklch(...))`.
- **CSS Tones in `ui/src/styles/semantic-tones.ts`**:
  - `SemanticTone` (`primary`, `accent`, `success`, `warning`, `error`) and `VisualVariant` (`solid`, `flat`, `shadow`, `bordered`, `glass`) with `normalizeTone` and `normalizeVariant`.
- **Controllers in `ui/src/controllers/`**:
  - `LayoutIndicatorController` (`layout-indicator.controller.ts`) supports `observeDimensions: true`.
  - `NumberSpringController` (`number-spring.controller.ts`) animates `displayValue` and clamps within `[-999_999_999, 999_999_999]`.
  - `OverlayPresenceController` (`overlay-presence.controller.ts`) manages `'popover'` and `'tooltip'` presets.

---

## 2. Logic Chain

1. **Happy-DOM Shims & Chart Capabilities**:
   - `test-setup.ts` already provides working shims for `Popover API` (`showPopover`, `hidePopover`, `:popover-open`) and deterministic `ResizeObserver` (`triggerResize`).
   - For `moul-chart-tooltip`: Because `showPopover()` strictly validates that the element has a `popover` attribute and is attached to the document, `MoulChartTooltip` must set `this.setAttribute('popover', 'manual')` (or `popover="auto"`) on connected callback or in template, and tests must mount the element before opening.
   - For `moul-chart-container`: `LayoutIndicatorController(this, { observeDimensions: true })` captures dimension changes. Tests can call `triggerResize(container, { width, height })` to test breakpoint changes (`xs`, `sm`, `md`, `lg`, `xl`) and re-rendering of the SVG viewport.
   - For SVG paths: D3 generators (`line()`, `area()`, `pie()`, `arc()`, `scaleLinear()`, `scaleBand()`, `scalePoint()`) do not rely on browser DOM geometry; they compute path data strings (`d="M..."`) directly. Tests can inspect `<path d="...">` attribute values, point coordinates `<circle cx cy>`, and bar rectangles `<rect x y width height>`.

2. **10 Required Components & Custom Element Tags**:
   Per `ORIGINAL_REQUEST.md` (lines 230–232 & 248) and `rdt/design.md` (lines 640–649):
   | # | Class | Tag Name | Key Roles |
   |---|---|---|---|
   | 1 | `MoulChartContainer` | `moul-chart-container` | Responsive viewport, header/empty/legend slots, `LayoutIndicatorController` |
   | 2 | `MoulChartTooltip` | `moul-chart-tooltip` | Popover API (`popover="manual"`), `OverlayPresenceController`, coordinate positioning |
   | 3 | `MoulLineChart` | `moul-line-chart` | D3 `line()`, `curveMonotoneX`, `scalePoint`/`scaleLinear`, circles, `point-hover` event |
   | 4 | `MoulAreaChart` | `moul-area-chart` | D3 `area()`, `<linearGradient>` fill, upper stroke path, `point-hover` event |
   | 5 | `MoulBarChart` | `moul-bar-chart` | D3 `scaleBand` & `scaleLinear`, vertical & horizontal layouts, `point-hover` event |
   | 6 | `MoulDoughnutChart` | `moul-doughnut-chart` | D3 `pie()` & `arc()`, `inner-radius-ratio`, center label / slot, `point-hover` event |
   | 7 | `MoulTopList` | `moul-top-list` | Ranked items, horizontal bars, `max-items`, `valueFormatter`, `item-press` event |
   | 8 | `MoulStat` | `moul-stat` | Metric display, `NumberSpringController` interpolation, trend badge, tones/variants |
   | 9 | `MoulPercentageBar` | `moul-percentage-bar` | `role="progressbar"`, fill width proportional to `0–100%`, semantic tones |
   | 10 | `MoulPercentageCircle` | `moul-percentage-circle` | SVG circle arc, `stroke-dashoffset` fill proportional to `0–100%`, label |

3. **Empty State Slot Contract**:
   - Requirement 7.5 and Design Section 8.1 specify that when `data` is `null`, `undefined`, or `[]` (or when `is-empty` attribute is set on `moul-chart-container`), the chart component or container MUST render `<slot name="empty">` in place of the SVG geometries.
   - Tests must assert that `<slot name="empty">` is present in the ShadowRoot and no `<path class="chart-line">` or data `<circle>` elements are rendered when data is missing.

4. **Zero-React Purity**:
   - `scripts/verify-no-react.ts` and `banReactImportsPlugin` in `ui/vite.config.ts` enforce that no React or StyleX dependencies are present.
   - `Charts.test.ts` should explicitly verify that chart exports are native Lit components and contain no React imports.

---

## 3. Caveats

1. **SVG Geometry Testing in Happy-DOM**:
   - Do NOT test chart rendering using `element.getBBox()` or `path.getTotalLength()`, as Happy-DOM does not compute actual SVG bounding boxes.
   - Instead, assert deterministic DOM attributes: `d` path strings (checking `d.startsWith('M')`), coordinates `cx`/`cy`, `x`/`y`/`width`/`height` on `<rect>`, and `stroke-dashoffset` on circles.
2. **Popover Attachment Requirement**:
   - Calling `showPopover()` on an unattached element throws a `DOMException` in both native browsers and Happy-DOM's shim. Tests MUST attach elements using `mount()` before invoking `showPopover()` or hovering points.
3. **Motion Animation Timing**:
   - `motion` animations take 200–500ms. In unit tests, components should either be tested with reduced motion (`prefersReducedMotion()`) or awaited via `await element.updateComplete` / settled spring thresholds to ensure tests remain instantaneous and flakiness-free.

---

## 4. Conclusion & Test Specification for `ui/src/components/Charts.test.ts`

The test file `ui/src/components/Charts.test.ts` should be structured into 11 test suites covering all 10 custom elements and the purity contract:

### Suite 1: Component Registration & HTML Tag Map (`CHART-REG-01` .. `CHART-REG-10`)
- **`CHART-REG-01`**: `moul-chart-container` is registered via `defineElement`, instance of `MoulChartContainer`, and `customElements.get('moul-chart-container')` returns constructor.
- **`CHART-REG-02`**: `moul-chart-tooltip` is registered via `defineElement`.
- **`CHART-REG-03`**: `moul-line-chart` is registered via `defineElement`.
- **`CHART-REG-04`**: `moul-area-chart` is registered via `defineElement`.
- **`CHART-REG-05`**: `moul-bar-chart` is registered via `defineElement`.
- **`CHART-REG-06`**: `moul-doughnut-chart` is registered via `defineElement`.
- **`CHART-REG-07`**: `moul-top-list` is registered via `defineElement`.
- **`CHART-REG-08`**: `moul-stat` is registered via `defineElement`.
- **`CHART-REG-09`**: `moul-percentage-bar` is registered via `defineElement`.
- **`CHART-REG-10`**: `moul-percentage-circle` is registered via `defineElement`.
- **`CHART-REG-11`**: Idempotent registration safeguard: re-invoking `defineElement` for any chart tag emits `console.warn` without throwing.

### Suite 2: Zero-React Purity & Barrel Exports (`CHART-PUR-01`)
- **`CHART-PUR-01`**: Verify all 10 component classes and helper types are exported from `ui/src/index.ts`.
- **`CHART-PUR-02`**: Confirm zero dependencies or imports of `react`, `react-dom`, `recharts`, or `@stylexjs/stylex`.

### Suite 3: `MoulChartContainer` (`CHART-CNT-01` .. `CHART-CNT-04`)
- **`CHART-CNT-01`**: Default layout: renders `title`, `description`, and slotted chart content.
- **`CHART-CNT-02`**: Empty state: when `is-empty` is set or child chart has empty data, renders `<slot name="empty">` and hides the SVG viewport.
- **`CHART-CNT-03`**: Slots: supports `<slot name="header">`, default `<slot>`, `<slot name="empty">`, and `<slot name="legend">`.
- **`CHART-CNT-04`**: Responsive resize: `triggerResize(container, { width: 400, height: 250 })` updates `LayoutIndicatorController` dimensions, updates breakpoint, and dispatches `viewport-resize` custom event.

### Suite 4: `MoulChartTooltip` (`CHART-TLP-01` .. `CHART-TLP-03`)
- **`CHART-TLP-01`**: Popover API attribute: host or popover container has `popover="manual"`; initializes in closed state (`isOpen = false`).
- **`CHART-TLP-02`**: Show / Hide interaction: calling `showPopover()` or `setOpen(true)` marks `:popover-open`, renders `label`, `value`, and series `color`; `hidePopover()` or `setOpen(false)` closes it.
- **`CHART-TLP-03`**: Positioning: updates style `transform` or `top`/`left` coordinates based on pointer client coordinates.

### Suite 5: `MoulLineChart` (`CHART-LINE-01` .. `CHART-LINE-04`)
- **`CHART-LINE-01`**: D3 Path & Scales: renders SVG `<path>` with valid `d` string generated via D3 line generator (`d="M..."`) across data series.
- **`CHART-LINE-02`**: Color token styling: series stroke styles reference `--color-chart-1` through `--color-chart-8`.
- **`CHART-LINE-03`**: Interactive data points: renders marker `<circle>` elements at calculated coordinate positions; `pointerenter` on a point dispatches `point-hover` with `{ data, series, x, y, value }`.
- **`CHART-LINE-04`**: Empty state handling: when `data` is `[]`, `null`, or `undefined`, renders `<slot name="empty">` and omits series paths.

### Suite 6: `MoulAreaChart` (`CHART-AREA-01` .. `CHART-AREA-04`)
- **`CHART-AREA-01`**: D3 Area Path: renders closed SVG `<path>` for the area fill and upper line `<path>` for stroke.
- **`CHART-AREA-02`**: Linear gradient definitions: renders `<defs><linearGradient>` with gradient stops for opacity fill.
- **`CHART-AREA-03`**: Interactive point hover: `point-hover` event dispatch on data point hover.
- **`CHART-AREA-04`**: Empty state handling when data is missing or empty.

### Suite 7: `MoulBarChart` (`CHART-BAR-01` .. `CHART-BAR-05`)
- **`CHART-BAR-01`**: Vertical layout (default): renders SVG `<rect>` elements scaled vertically using D3 `scaleBand` (X) and `scaleLinear` (Y).
- **`CHART-BAR-02`**: Horizontal layout: when `layout="horizontal"`, renders SVG `<rect>` elements scaled horizontally (Y is `scaleBand`, X is `scaleLinear`).
- **`CHART-BAR-03`**: Series color tokens: bars styled with `--color-chart-1` through `--color-chart-8`.
- **`CHART-BAR-04`**: Bar hover interaction: `pointerenter` on a bar dispatches `point-hover` event.
- **`CHART-BAR-05`**: Empty state handling when data is empty/null/undefined.

### Suite 8: `MoulDoughnutChart` (`CHART-DNT-01` .. `CHART-DNT-04`)
- **`CHART-DNT-01`**: D3 Arc & Pie generation: renders SVG `<path>` arc slices generated via `d3.pie()` and `d3.arc()`.
- **`CHART-DNT-02`**: Inner radius ratio: supports configurable `inner-radius-ratio` (e.g. `0.65`) creating a hollow doughnut center.
- **`CHART-DNT-03`**: Center label & slot: renders `center-label` text or slotted `<slot name="center">`.
- **`CHART-DNT-04`**: Empty state rendering when data is empty.

### Suite 9: `MoulTopList` (`CHART-TOP-01` .. `CHART-TOP-04`)
- **`CHART-TOP-01`**: Ranked items: renders row list with 1-based ranks, labels, proportional progress fill bars, and values.
- **`CHART-TOP-02`**: Clamping with `max-items`: truncates rendered list to `maxItems` (default 10).
- **`CHART-TOP-03`**: Custom `valueFormatter`: applies custom value formatter callback to formatted value output.
- **`CHART-TOP-04`**: Item press interaction: clicking/pressing an item dispatches `item-press` custom event with `{ item, index }`; renders `<slot name="empty">` when data is empty.

### Suite 10: `MoulStat` (`CHART-STAT-01` .. `CHART-STAT-04`)
- **`CHART-STAT-01`**: Metric card display: renders `label`, `prefix`, `suffix`, and numeric value.
- **`CHART-STAT-02`**: `NumberSpringController` integration: numeric value changes interpolate smoothly and snap to target.
- **`CHART-STAT-03`**: Trend badge: displays trend indicator (`up`, `down`, `neutral`) with `trend-value`.
- **`CHART-STAT-04`**: Semantic tones & variants: applies `semanticToneStyles` across tones (`primary`, `success`, `error`, etc.) and visual variants (`flat`, `solid`, `bordered`, `glass`).

### Suite 11: `MoulPercentageBar` & `MoulPercentageCircle` (`CHART-PRG-01` .. `CHART-PRG-05`)
- **`CHART-PRG-01`**: PercentageBar ARIA contract: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`.
- **`CHART-PRG-02`**: PercentageBar fill width: clamps value `0–100` and sets `width: ${clamped}%`.
- **`CHART-PRG-03`**: PercentageCircle SVG: renders background track `<circle>` and foreground progress circle with calculated `stroke-dashoffset`.
- **`CHART-PRG-04`**: Label toggle: displays `${Math.round(clamped)}%` when `show-label` is true, hides when false.
- **`CHART-PRG-05`**: Fast-check property test: values from `-1000` to `1000` clamp strictly within `[0, 100]`.

---

## 5. Verification Method

Once Phase 8 implementation is completed, run these commands to independently verify all acceptance criteria:

1. **Run Unit Tests for Charts Suite**:
   ```bash
   bun run test ui/src/components/Charts.test.ts
   ```
   *(or from inside the `ui` directory)*:
   ```bash
   cd ui && bun run test src/components/Charts.test.ts
   ```
   *Expected result*: 100% passing tests across all 11 suites.

2. **Run Biome Linter / Formatter**:
   ```bash
   bun run lint
   ```
   *Expected result*: 0 lint or formatting errors on all modified files.

3. **Verify Zero-React Package & Import Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected result*: Exit code 0, reporting zero banned React dependencies.

4. **Build Library & Custom Elements Manifest**:
   ```bash
   bun run build:ui
   ```
   *Expected result*: Clean build generating `ui/dist/moul-ui.js`, `ui/dist/assets/style.css`, and `ui/dist/custom-elements.json`.

### Invalidation Conditions
- Any chart file importing `react`, `react-dom`, `recharts`, or `@stylexjs/stylex`.
- Any chart component failing to register in `HTMLElementTagNameMap`.
- Chart geometries relying on unsupported Happy-DOM layout APIs (`getBBox()`, `getTotalLength()`).
- Tooltip failing to initialize `popover="manual"`, throwing `DOMException` on `showPopover()`.
- Missing `<slot name="empty">` when data is null, undefined, or empty `[]`.
