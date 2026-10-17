# Phase 8 Foundation Survey: Charts & Data Visualization Infrastructure

## 1. Observation

Direct observations from the `@moul-dev/ui` codebase:

### 1.1 `ui/package.json` Dependencies & Versions
- **Dependencies (`ui/package.json:63-70`)**:
  - `"@lit-labs/virtualizer": "^2.1.0"`
  - `"@lit/context": "^1.1.3"`
  - `"d3-scale": "^4.0.2"`
  - `"d3-shape": "^3.2.0"`
  - `"lit": "^3.2.1"`
  - `"motion": "^13.4.1"`
- **DevDependencies (`ui/package.json:71-85`)**:
  - `"@types/d3-scale": "^4.0.8"`
  - `"@types/d3-shape": "^3.1.6"`
  - `"fast-check": "^3.23.2"`
  - `"happy-dom": "^16.8.1"`
  - `"typescript": "~6.0.2"`
  - `"vite": "^8.0.12"`
  - `"vitest": "^2.1.8"`
- **Package Location & Resolution**:
  - Packages are installed in `ui/node_modules/` (`d3-scale`, `d3-shape`, `motion`, `lit`).
  - `d3-scale` exposes scale functions: `scaleLinear`, `scaleBand`, `scalePoint`, `scaleTime`, `scaleLog`, `scalePow`, `scaleSqrt`, etc.
  - `d3-shape` exposes curve generators and shapes: `line`, `area`, `arc`, `pie`, `curveMonotoneX`, `curveLinear`, `curveBasis`, `curveStep`, etc.
  - `banReactImportsPlugin` (`ui/vite.config.ts:7-15`) strictly bans:
    - `'react'`, `'react-dom'`, `'react-aria'`, `'react-aria-components'`, `'@stylexjs/stylex'`, `'@lit/react'`, `'motion/react'`.
    - Only vanilla `motion` (`import { animate, stagger } from 'motion'`) is allowed.

### 1.2 `ui/src/styles/style.css` Design Tokens
- **Chart Series Colors (`ui/src/styles/style.css:320-329`)**:
  ```css
  /* ── Chart Colors (8 steps) ───────────────────────────────────── */
  --color-chart-1: light-dark(oklch(0.6 0.18 250), oklch(0.65 0.16 250));
  --color-chart-2: light-dark(oklch(0.75 0.15 75), oklch(0.75 0.14 75));
  --color-chart-3: light-dark(oklch(0.65 0.18 5), oklch(0.68 0.16 5));
  --color-chart-4: light-dark(oklch(0.62 0.2 300), oklch(0.65 0.18 300));
  --color-chart-5: light-dark(oklch(0.68 0.16 195), oklch(0.7 0.14 195));
  --color-chart-6: light-dark(oklch(0.58 0.16 45), oklch(0.62 0.15 45));
  --color-chart-7: light-dark(oklch(0.64 0.17 145), oklch(0.68 0.15 145));
  --color-chart-8: light-dark(oklch(0.6 0 0), oklch(0.65 0 0));
  ```
- **Semantic Surface & Text Aliases (`ui/src/styles/style.css:135-155`)**:
  - `--color-bg`, `--color-bg-subtle`, `--color-bg-elevated`
  - `--color-fg`, `--color-fg-subtle`, `--color-fg-on-primary`
  - `--color-border`, `--color-border-subtle`, `--color-border-focus`
  - `--color-bg-glass`, `--color-border-glass`, `--color-shadow`, `--color-overlay`
- **Typography (`ui/src/styles/style.css:262-288`)**:
  - Scales `--font-size-xs` (`calc(0.75rem * var(--brand-font-scale, 1))`) through `--font-size-4xl` (`calc(2.25rem * var(--brand-font-scale, 1))`)
  - Font weights `--font-weight-normal: 400`, `--font-weight-medium: 500`, `--font-weight-semibold: 600`, `--font-weight-bold: 700`
  - Font family `--font-family-base: var(--brand-font-family, inherit)`
- **Spacing & Radius (`ui/src/styles/style.css:290-305`)**:
  - Spacing steps `--spacing-1` (0.25rem) to `--spacing-8` (2rem)
  - Radii `--radius-none: 0`, `--radius-sm: calc(0.375rem * var(--brand-radius-factor, 1))`, `--radius-md: calc(0.75rem * var(--brand-radius-factor, 1))`, `--radius-lg: calc(1.25rem * var(--brand-radius-factor, 1))`, `--radius-full: 9999px`
- **Z-Index (`ui/src/styles/style.css:314-319`)**:
  - `--z-base: 0`, `--z-dropdown: 1000`, `--z-modal: 1300`, `--z-tooltip: 1500`, `--z-toast: 1700`

### 1.3 `ui/src/styles/reset.styles.ts` Shadow DOM Reset Rules
- Exports `resetStyles` (`CSSResultGroup`).
- Invariant rules:
  - `*, *::before, *::after { box-sizing: border-box; }`
  - `:host { box-sizing: border-box; font-family: var(--font-family-base, inherit); font-size: var(--font-size-md, 1rem); line-height: var(--line-height-md, 1.5rem); color: var(--color-fg, inherit); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }`
  - `:host([hidden]), [hidden] { display: none !important; }`
  - Accessible focus indicator: `:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }`
- Standard component adoption pattern:
  `static override styles = [resetStyles, componentStyles]`

### 1.4 `ui/src/controllers/` Reactive Controllers Analysis
1. **`LayoutIndicatorController` (`layout-indicator.controller.ts`)**:
   - **Properties**: `breakpoint: Breakpoint` ('xs' | 'sm' | 'md' | 'lg' | 'xl'), `width: number`, `height: number`
   - **Options**: `{ observeDimensions?: boolean, initialBreakpoint?: Breakpoint }`
   - **Lifecycle**: Initializes in constructor via `this.host.addController(this)`. In `hostConnected`, creates `ResizeObserver` observing host, sets initial dimensions from `getBoundingClientRect`. On `hostDisconnected`, disconnects observer and cleans up.
   - **Trigger**: When `breakpoint` changes, or when `observeDimensions: true` and either `width` or `height` changes, calls `this.host.requestUpdate()`.
   - **Chart Integration**: Crucial for `moul-chart-container`. Initializing with `{ observeDimensions: true }` ensures that any viewport resize (e.g. browser resize or container dimension change) triggers a host re-render to recalculate SVG paths and D3 scales.
2. **`NumberSpringController` (`number-spring.controller.ts`)**:
   - **Properties**: `targetValue: number`, `displayValue: number`
   - **Options**: `{ initialValue?: number, stiffness?: number (260), damping?: number (28), mass?: number (1), threshold?: number (0.5), onUpdate?: (val) => void }`
   - **Methods**: `setTarget(newTarget: number)` (animates `displayValue` toward target with spring physics; snaps within threshold; collapses to instant change if `prefersReducedMotion()`), `reset(value: number)` (instantly sets target and display value).
   - **Lifecycle**: Cleans up active `motion` `AnimationPlaybackControls` on `hostDisconnected`.
   - **Chart Integration**: Essential for `moul-stat`, `moul-percentage-bar`, and `moul-percentage-circle` numeric interpolation.
3. **`OverlayPresenceController` (`overlay-presence.controller.ts`)**:
   - **Properties**: `isOpen: boolean`, `isMounted: boolean`
   - **Options**: `{ preset?: OverlayPreset ('modal' | 'popover' | 'tooltip' | ...), popover?: () => HTMLElement | null, target?: () => HTMLElement | null, onOpenChange?: (open: boolean) => void }`
   - **Methods**: `setOpen(nextOpen: boolean)`, `toggle(force?: boolean)`.
   - **Lifecycle**: Safely invokes `popover.showPopover()` and `popover.hidePopover()`, coordinates top-layer promotion, animates enter keyframes (`scale: [0.96, 1], y: [-2, 0], opacity: [0, 1]`) and exit keyframes (`opacity: [1, 0], scale: [1, 0.96]`), prevents rapid-toggle race conditions.
   - **Chart Integration**: Essential for `moul-chart-tooltip` data point hover/focus popovers.
4. **`PressController` (`press.controller.ts`)**:
   - **Properties**: `isPressed: boolean`, `isHovered: boolean`, `isFocusVisible: boolean`
   - **Options**: `{ scaleOnPress?: boolean | number, hoverLift?: boolean | number, target?: () => HTMLElement | null, disabled?: () => boolean }`
   - **Methods & Lifecycle**: Listens to pointerdown/up/cancel/enter/leave and keydown/keyup on host. Synchronizes `aria-pressed`. Triggers spring scale (`0.97`) and hover lift (`-2px`) via `SPRING_SNAPPY` / `SPRING_GENTLE`.
   - **Chart Integration**: Used on interactive chart elements: `moul-top-list` rows, clickable chart legend items, interactive slices/bars.

### 1.5 `ui/src/utils/` Core Utilities Analysis
1. **`defineElement(tagName: string, ctor: CustomElementConstructor)` (`define-element.ts`)**:
   - Idempotently checks `customElements.get(tagName)`. If already registered, logs `console.warn` without throwing or overriding.
2. **`motion.ts` Constants & Utilities**:
   - `SPRING_SNAPPY`: `{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }`
   - `SPRING_GENTLE`: `{ type: 'spring', stiffness: 320, damping: 28, mass: 1 }`
   - `IOS_SHEET_CURVE`: `[0.32, 0.72, 0, 1] as const`
   - `CHART_EASE`: `[0.22, 1, 0.36, 1] as const` (custom cubic bezier for SVG path morphing & chart transitions)
   - `prefersReducedMotion()`: reads `window.matchMedia('(prefers-reduced-motion: reduce)').matches`
   - `subtleAnimate(target, keyframes, options)`: animates DOM/SVG elements; forces `duration: 0` when `prefersReducedMotion()` is active
   - `stagger`: re-exported from `motion` for staggered bar growth and doughnut slice entrances
3. **`warnMissingLabel(host, description, hasVisibleLabel)` (`warn-missing-label.ts`)**:
   - Emits `console.warn` in non-production environments when interactive or icon elements lack `aria-label`, `aria-labelledby`, or visible text.

### 1.6 `ui/src/index.ts` Barrel Organization & TypeScript Map
- **Current Chart Exports (`ui/src/index.ts:10-11, 48-49, 81-88, 123-124, 155-156, 220-223, 297-298, 358-359`)**:
  - Legacy React exports: `AreaChart`, `BarChart`, `ChartContainer`, `ChartTooltip`, `DoughnutChart`, `LineChart`, `PercentageBar`, `PercentageCircle`, `Stat`, `TopList`.
  - Legacy files in `ui/src/components/`: `.tsx` files importing `react`, `recharts`, `@stylexjs/stylex`.
- **Existing Custom Elements in `HTMLElementTagNameMap` (`ui/src/index.ts:451-516`)**:
  - Phases 4–7 custom elements are registered with both dual exports (e.g. `export { MoulButton, MoulButton as Button }`) and `HTMLElementTagNameMap['moul-button']: MoulButton`.
  - Phase 8 chart components (`moul-chart-container`, `moul-chart-tooltip`, `moul-line-chart`, `moul-area-chart`, `moul-bar-chart`, `moul-doughnut-chart`, `moul-top-list`, `moul-stat`, `moul-percentage-bar`, `moul-percentage-circle`) must replace the legacy exports and be added to `HTMLElementTagNameMap`.

### 1.7 Test Harness Infrastructure
- `ui/src/test-setup.ts` configures `happy-dom` with:
  - Deterministic `MockResizeObserver` with global helper `window.__triggerResize(element, { width, height })` (`test-setup.ts:605-617`).
  - Popover API shims (`showPopover`, `hidePopover`, `togglePopover`, `:popover-open`).
  - `ElementInternals` shims and Web Animations API / CSS.supports mocks.
  - Vitest runs via `./ui/node_modules/.bin/vitest run --root ui`.

---

## 2. Logic Chain

1. **Phase Purge & Zero-React Requirement**:
   - From `scripts/verify-no-react.ts` and `banReactImportsPlugin` in `ui/vite.config.ts`, any import of `react`, `recharts`, `@stylexjs/*`, or `motion/react` is prohibited and fails CI.
   - The existing chart files in `ui/src/components/*/*Chart.tsx` are legacy React/Recharts files from before the rebuild.
   - Therefore, all 7 chart components and 2 companions must be converted to `.ts` files implementing Lit 3 `LitElement` classes.
2. **SVG & D3 Math Integration**:
   - `d3-scale` (`scaleLinear`, `scaleBand`, `scalePoint`) maps data domains to SVG coordinate ranges based on container `width` and `height`.
   - `d3-shape` (`line`, `area`, `arc`, `pie`, `curveMonotoneX`) generates SVG `<path d="...">` attribute strings directly.
   - Native SVG generation avoids any third-party React chart libraries and executes deterministically in both browser and happy-dom test environments.
3. **Color Token Layering**:
   - In `ui/src/styles/style.css`, `--color-chart-1` through `--color-chart-8` are defined using `light-dark(oklch(...), oklch(...))`.
   - SVG geometries (strokes, fills) can reference these directly via CSS custom properties (`stroke="var(--color-chart-1)"` or `fill="url(#gradient-1)"`).
   - Legacy `ChartCommon.ts` currently imports `tokens.stylex`. This must be updated to export CSS variable strings (`var(--color-chart-N)`) and TypeScript types (`ChartSeries`).
4. **Motion & Accessibility Orchestration**:
   - `subtleAnimate` from `ui/src/utils/motion.ts` works directly on SVG elements (`SVGPathElement`, `SVGRectElement`, `SVGCircleElement`) and automatically respects `prefers-reduced-motion: reduce`.
   - `CHART_EASE` (`[0.22, 1, 0.36, 1]`) provides smooth 350ms path morphs.
   - `NumberSpringController` provides spring-physics interpolation for `moul-stat`, snapping within 0.5 threshold.
   - `LayoutIndicatorController` with `observeDimensions: true` provides reactive re-rendering when the chart container resizes, dispatching `viewport-resize`.
   - `OverlayPresenceController` with `preset: 'tooltip'` coordinates native Popover API data-point tooltips.

---

## 3. Caveats

- **Happy-DOM SVG Measurement Limitations**:
  - `happy-dom` does not implement full SVG layout geometry engines (`getBBox()`, `getComputedTextLength()`).
  - Scales and layout dimensions must rely on explicit `width` / `height` properties or `LayoutIndicatorController` (tested via `__triggerResize`) rather than SVG DOM measurement methods.
- **D3 Type Declarations**:
  - `d3-scale` and `d3-shape` types require `@types/d3-scale` and `@types/d3-shape`, which are verified in `devDependencies`. Generic scale types should accommodate standard data shapes (`Record<string, unknown>[]`).
- No other caveats.

---

## 4. Conclusion

The monorepo infrastructure is 100% prepared to implement Phase 8:
1. `d3-scale`, `d3-shape`, `motion`, `lit`, and their types are installed, verified, and importable.
2. Design tokens `--color-chart-1` through `--color-chart-8`, typography, spacing, radius, and shadows are defined and verified in `ui/src/styles/style.css`.
3. `resetStyles` is verified in `ui/src/styles/reset.styles.ts`.
4. All required reactive controllers (`LayoutIndicatorController`, `NumberSpringController`, `OverlayPresenceController`, `PressController`) and utilities (`defineElement`, `subtleAnimate`, `CHART_EASE`, `prefersReducedMotion`, `stagger`, `warnMissingLabel`) are implemented, tested, and passing.
5. `ui/src/index.ts` is ready to replace legacy React chart exports with modern Lit custom elements and register them in `HTMLElementTagNameMap`.
6. `happy-dom` test harness with `__triggerResize` is verified and ready for `ui/src/components/Charts.test.ts`.

### Component Implementation Matrix for Phase 8:

| Element Tag | Class Name | File Path | Controllers & Utilities | Key Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| `moul-chart-container` | `MoulChartContainer` | `ui/src/components/ChartContainer/ChartContainer.ts` | `LayoutIndicatorController` (`observeDimensions: true`), `defineElement` | Responsive container, header/legend/empty slots, dispatches `viewport-resize` |
| `moul-chart-tooltip` | `MoulChartTooltip` | `ui/src/components/ChartTooltip/ChartTooltip.ts` | `OverlayPresenceController` (`preset: 'tooltip'`), Popover API, `defineElement` | Data-point tooltip, Popover API `showPopover`/`hidePopover`, coordinates tracking |
| `moul-line-chart` | `MoulLineChart` | `ui/src/components/LineChart/LineChart.ts` | `d3-scale`, `d3-shape` (`line`, `curveMonotoneX`), `subtleAnimate`, `CHART_EASE`, `warnMissingLabel` | Multi-series SVG line chart, grid lines, point hover dispatch, empty state slot |
| `moul-area-chart` | `MoulAreaChart` | `ui/src/components/AreaChart/AreaChart.ts` | `d3-scale`, `d3-shape` (`area`, `line`), `subtleAnimate`, `CHART_EASE` | Gradient filled area paths, stacked/single modes, point hover dispatch |
| `moul-bar-chart` | `MoulBarChart` | `ui/src/components/BarChart/BarChart.ts` | `d3-scale` (`scaleBand`, `scaleLinear`), `subtleAnimate`, `stagger(0.025)` | Horizontal/vertical bars, grouped/stacked, rounded corners, point hover dispatch |
| `moul-doughnut-chart` | `MoulDoughnutChart` | `ui/src/components/DoughnutChart/DoughnutChart.ts` | `d3-shape` (`pie`, `arc`), `subtleAnimate`, `stagger(0.04)` | Arc slices, inner radius ratio, center label slot, point hover expansion |
| `moul-top-list` | `MoulTopList` | `ui/src/components/TopList/TopList.ts` | `subtleAnimate`, `stagger(0.03)`, `CHART_EASE`, `PressController` | Horizontal ranked bars, relative value scaling, `item-press` event |
| `moul-stat` | `MoulStat` | `ui/src/components/Stat/Stat.ts` | `NumberSpringController`, `semanticToneStyles`, `defineElement` | Animated numeric ticker, trend badge (up/down/neutral), icon & footer slots |
| `moul-percentage-bar` | `MoulPercentageBar` | `ui/src/components/Percentage/PercentageBar.ts` | `SPRING_GENTLE`, `subtleAnimate`, `semanticToneStyles` | Progress track and fill, `role="progressbar"`, aria value attrs |
| `moul-percentage-circle` | `MoulPercentageCircle` | `ui/src/components/Percentage/PercentageCircle.ts` | `SPRING_GENTLE`, `subtleAnimate`, `semanticToneStyles` | SVG circular arc progress, `stroke-dashoffset` animation, label slot |

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Dependencies & Node Module Resolution**:
   ```bash
   node -e "const d3Scale = require('./ui/node_modules/d3-scale'); const d3Shape = require('./ui/node_modules/d3-shape'); const motion = require('./ui/node_modules/motion'); const lit = require('./ui/node_modules/lit'); console.log('All packages load successfully');"
   ```
2. **Verify CSS Chart Tokens**:
   Inspect `ui/src/styles/style.css` lines 320–329 for `--color-chart-1` through `--color-chart-8`.
3. **Verify Zero-React Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
4. **Verify Existing Controllers and Token Test Suites**:
   ```bash
   ./ui/node_modules/.bin/vitest run --root ui src/controllers/Controllers.test.ts
   ./ui/node_modules/.bin/vitest run --root ui src/tokens/tokens.test.ts
   ```
5. **Verify Biome Linter on Foundation**:
   ```bash
   ./node_modules/.bin/biome check ui/src/controllers ui/src/utils
   ```
