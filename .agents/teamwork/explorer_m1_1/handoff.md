# Handoff Report: Phase 8 Milestone 1 Implementation Blueprint

**Author**: `explorer_m1_1`  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_1`  
**Date**: 2026-10-17  
**Scope**: `ui/src/components/ChartCommon.ts` and `moul-chart-container` (`ui/src/components/ChartContainer/`)  

---

## 1. Observation

### 1.1 Existing Source Files Inspected
1. **`ui/src/components/ChartCommon.ts`** (Lines 1–13):
   ```ts
   import { tokens } from '../tokens/tokens.stylex'

   export const CHART_COLORS = [
     tokens.colorChart1,
     tokens.colorChart2,
     tokens.colorChart3,
     tokens.colorChart4,
     tokens.colorChart5,
     tokens.colorChart6,
     tokens.colorChart7,
     tokens.colorChart8,
   ]
   ```
   *Observation*: Contains legacy StyleX import (`../tokens/tokens.stylex`), which violates the Zero-React / Zero-StyleX architectural mandate. Lacks required data interfaces (`ChartSeries`, `DoughnutDataItem`, `TopListItem`, `PointHoverDetail`) and `getChartColor` helper function.

2. **`ui/src/components/ChartContainer/ChartContainer.tsx`** (Lines 1–137):
   *Observation*: Implemented as a React component (`React.forwardRef`) using `@stylexjs/stylex`, React Aria types, and JSX. It must be replaced with a pure Lit 3 `LitElement` custom element in `ChartContainer.ts`.

3. **`ui/src/components/ChartContainer/ChartContainer.styles.ts`** (Lines 1–118):
   *Observation*: Uses `stylex.create(...)` with legacy tokens. It must be rewritten as a Lit CSS template (`import { css } from 'lit'`) utilizing `resetStyles` and CSS Custom Property tokens from `style.css`.

4. **`ui/src/components/ChartContainer/index.ts`** (Lines 1–3):
   ```ts
   export type { ChartContainerProps, LegendItem } from './ChartContainer'
   export { ChartContainer } from './ChartContainer'
   ```
   *Observation*: Exports legacy types. Needs to export `MoulChartContainer`, `ChartContainer` alias, and TypeScript interfaces.

5. **`ui/src/controllers/layout-indicator.controller.ts`** (Lines 26–88):
   *Observation*: Exposes `LayoutIndicatorController` with options `{ observeDimensions?: boolean, initialBreakpoint?: Breakpoint }`. Tracks `width`, `height`, and `breakpoint` (`xs` | `sm` | `md` | `lg` | `xl`). When `observeDimensions: true`, invokes `this.host.requestUpdate()` on every width or height change. Does not dispatch DOM events directly; the host element is responsible for dispatching `viewport-resize`.

6. **`ui/src/utils/define-element.ts`** (Lines 8–23):
   *Observation*: Exports `defineElement(tagName: string, ctor: CustomElementConstructor): void` with idempotent registration check (`customElements.get(tagName)`) and non-throwing warning.

7. **`ui/src/styles/reset.styles.ts`** (Lines 9–81):
   *Observation*: Exports `resetStyles: CSSResultGroup = css`...'` setting box-sizing, font-family inheritance, and accessibility defaults.

8. **`ui/src/styles/style.css`** (Lines 321–328):
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

9. **`ui/src/test-setup.ts`** (Lines 535–585):
   *Observation*: Exports `triggerResize(element, { width, height })`, updating `element.getBoundingClientRect()` and synchronously triggering `ResizeObserver` callbacks in Happy DOM.

---

## 2. Logic Chain

### 2.1 `ChartCommon.ts` Architecture & Contracts
- **Reasoning**: All upcoming chart components (`moul-line-chart`, `moul-area-chart`, `moul-bar-chart`, `moul-doughnut-chart`, `moul-top-list`) rely on unified data models and color token mapping.
- **Color Helper**: `getChartColor(index: number): string` returns `var(--color-chart-${(index % 8) + 1})`. To handle negative numbers, floating-point indices, or non-finite inputs deterministically, the index normalization formula is `((Math.floor(index) % 8) + 8) % 8`.
- **Legacy Compatibility**: Keeping `CHART_COLORS` as an immutable array of `['var(--color-chart-1)', ..., 'var(--color-chart-8)']` avoids breaking existing consumers while completely purging `tokens.stylex`.

### 2.2 `moul-chart-container` Architecture & Contracts
- **Lit 3 Custom Element**: Subclasses `LitElement`, using `static override styles = chartContainerStyles` with `resetStyles`.
- **Registration**: Registered under tag `'moul-chart-container'` via idempotent `defineElement` and exported with `MoulChartContainer` and `ChartContainer` alias.
- **Properties & Reflection**:
  - `title`: `{ type: String, reflect: true }`, default `''`
  - `description`: `{ type: String, reflect: true }`, default `''`
  - `height`: `{ type: Number, reflect: true }`, default `300`
  - `isEmpty`: `{ type: Boolean, reflect: true, attribute: 'is-empty' }`, default `false`
- **Reactive Controller Integration**:
  - `layout = new LayoutIndicatorController(this, { observeDimensions: true })`
  - Observes host element dimensions via `ResizeObserver`.
  - On dimension changes, detects width/height/breakpoint updates and dispatches:
    ```ts
    new CustomEvent('viewport-resize', {
      bubbles: true,
      composed: true,
      detail: { width, height, breakpoint },
    })
    ```
  - Emits both upon initial measurement (`width > 0 || height > 0`) and subsequent dimension changes.
- **Slot Composition & Empty State Gating**:
  - `<slot name="header">`: Contains header markup. If `title` or `description` is provided and no light DOM replaces the slot, renders default `<h3 class="title">` and `<p class="description">`.
  - `<slot name="legend">`: Slotted legend elements.
  - Body viewport (`part="body"`, height controlled by `this.height`):
    - When `isEmpty` is `false`: Renders `<div part="content" class="content"><slot></slot></div>`.
    - When `isEmpty` is `true`: Renders `<div part="empty" class="empty-container"><slot name="empty"><p class="empty-message">No data available</p></slot></div>`.
- **CSS Design Token Styling**:
  - Uses CSS custom properties: `--color-bg`, `--color-border-subtle`, `--radius-lg`, `--spacing-1` through `--spacing-6`, `--font-size-sm`, `--font-size-lg`, `--font-weight-semibold`, `--color-fg`, `--color-fg-subtle`, `--shadow-sm`.

---

## 3. Caveats

1. **Deletion of `ChartContainer.tsx`**: When creating `ChartContainer.ts`, `ChartContainer.tsx` must be removed from `ui/src/components/ChartContainer/` to eliminate banned React/StyleX imports from Vite/Rollup compilation.
2. **ResizeObserver in Happy DOM**: In tests, custom elements do not have intrinsic layout dimensions unless set via `triggerResize(element, { width: 600, height: 350 })`. The `viewport-resize` event listener should be attached before triggering resize, and `await element.updateComplete` should be awaited.
3. **No Caveats on Dependencies**: `d3-scale`, `d3-shape`, `lit`, and `motion` are already installed and declared in `ui/package.json`.

---

## 4. Conclusion & Complete Implementation Blueprint

### File 1: `ui/src/components/ChartCommon.ts`

```ts
/**
 * Moul UI - Shared Chart Interfaces and Color Utilities
 * Zero-React, CSS token-driven chart data contracts.
 */

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

/**
 * Returns the CSS design token variable for a chart series by index (1 to 8).
 * Loops cyclically modulo 8.
 */
export function getChartColor(index: number): string {
  const normalized = Number.isFinite(index)
    ? ((Math.floor(index) % 8) + 8) % 8
    : 0
  return `var(--color-chart-${normalized + 1})`
}

/**
 * Array of all 8 CSS chart color variables.
 */
export const CHART_COLORS: readonly string[] = Object.freeze([
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
  'var(--color-chart-8)',
])
```

---

### File 2: `ui/src/components/ChartContainer/ChartContainer.ts`

```ts
import { html, LitElement, type PropertyValues } from 'lit'
import {
  type Breakpoint,
  LayoutIndicatorController,
} from '../../controllers/layout-indicator.controller'
import { defineElement } from '../../utils/define-element'
import { chartContainerStyles } from './ChartContainer.styles'

export interface LegendItem {
  name: string
  value?: string | number
  color?: string
}

export interface ChartContainerProps {
  title?: string
  description?: string
  height?: number
  isEmpty?: boolean
}

/**
 * Moul UI - Responsive Chart Container
 *
 * Provides a responsive viewport for SVG charts with header, legend,
 * and empty fallback slots. Dispatches `viewport-resize` on dimension changes.
 */
export class MoulChartContainer extends LitElement {
  static override styles = chartContainerStyles

  static override properties = {
    title: { type: String, reflect: true },
    description: { type: String, reflect: true },
    height: { type: Number, reflect: true },
    isEmpty: { type: Boolean, reflect: true, attribute: 'is-empty' },
  }

  declare title: string
  declare description: string
  declare height: number
  declare isEmpty: boolean

  public layout: LayoutIndicatorController

  private _initialized = false
  private _lastReportedWidth = 0
  private _lastReportedHeight = 0
  private _lastReportedBreakpoint: Breakpoint = 'md'

  constructor() {
    super()
    this.title = ''
    this.description = ''
    this.height = 300
    this.isEmpty = false

    this.layout = new LayoutIndicatorController(this, {
      observeDimensions: true,
    })
  }

  public get currentWidth(): number {
    return this.layout.width
  }

  public get currentHeight(): number {
    return this.layout.height
  }

  public get currentBreakpoint(): Breakpoint {
    return this.layout.breakpoint
  }

  public override requestUpdate(
    name?: PropertyKey,
    oldValue?: unknown,
    options?: PropertyDeclaration,
  ): void {
    super.requestUpdate(name, oldValue, options)
    this._checkViewportResize()
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    this._checkViewportResize()
  }

  private _checkViewportResize(): void {
    if (!this.layout) return
    const w = this.layout.width
    const h = this.layout.height
    const bp = this.layout.breakpoint

    const hasChanged =
      w !== this._lastReportedWidth ||
      h !== this._lastReportedHeight ||
      bp !== this._lastReportedBreakpoint

    if (!this._initialized) {
      if (w > 0 || h > 0) {
        this._initialized = true
        this._lastReportedWidth = w
        this._lastReportedHeight = h
        this._lastReportedBreakpoint = bp
        this._emitViewportResize(w, h, bp)
      }
    } else if (hasChanged) {
      this._lastReportedWidth = w
      this._lastReportedHeight = h
      this._lastReportedBreakpoint = bp
      this._emitViewportResize(w, h, bp)
    }
  }

  private _emitViewportResize(
    width: number,
    height: number,
    breakpoint: Breakpoint,
  ): void {
    this.dispatchEvent(
      new CustomEvent('viewport-resize', {
        bubbles: true,
        composed: true,
        detail: {
          width,
          height,
          breakpoint,
        },
      }),
    )
  }

  protected override render() {
    const hasHeader = Boolean(this.title || this.description)

    return html`
      <header part="header" class="header">
        <slot name="header">
          ${hasHeader
            ? html`
                <div class="header-content">
                  ${this.title ? html`<h3 part="title" class="title">${this.title}</h3>` : ''}
                  ${this.description ? html`<p part="description" class="description">${this.description}</p>` : ''}
                </div>
              `
            : ''}
        </slot>
      </header>

      <div part="legend" class="legend">
        <slot name="legend"></slot>
      </div>

      <div
        part="body"
        class="body"
        style="height: ${this.height}px;"
      >
        ${this.isEmpty
          ? html`
              <div part="empty" class="empty-container">
                <slot name="empty">
                  <p class="empty-message" part="empty-message">No data available</p>
                </slot>
              </div>
            `
          : html`
              <div part="content" class="content">
                <slot></slot>
              </div>
            `}
      </div>
    `
  }
}

defineElement('moul-chart-container', MoulChartContainer)

declare global {
  interface HTMLElementTagNameMap {
    'moul-chart-container': MoulChartContainer
  }
}
```

---

### File 3: `ui/src/components/ChartContainer/ChartContainer.styles.ts`

```ts
import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const chartContainerStyles = [
  resetStyles,
  css`
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      background-color: var(--color-bg, #ffffff);
      border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.08));
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--spacing-6, 1.5rem);
      gap: var(--spacing-4, 1rem);
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      box-shadow: var(--shadow-sm, 0 1px 2px 0 var(--color-shadow, rgba(0, 0, 0, 0.05)));
      position: relative;
      width: 100%;
    }

    :host([hidden]) {
      display: none !important;
    }

    [part="header"],
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-4, 1rem);
      box-sizing: border-box;
    }

    :host(:not([title]):not([description])) [part="header"]:empty,
    :host(:not([title]):not([description])) slot[name="header"]:empty {
      display: none;
    }

    .header-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
    }

    [part="title"],
    .title {
      margin: 0;
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: var(--font-weight-semibold, 600);
      line-height: var(--line-height-lg, 1.75rem);
      color: var(--color-fg, inherit);
    }

    [part="description"],
    .description {
      margin: 0;
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-fg-subtle, #6b7280);
      line-height: var(--line-height-sm, 1.25rem);
    }

    [part="legend"],
    .legend {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-fg-subtle, #6b7280);
    }

    [part="legend"]:empty,
    slot[name="legend"]:empty {
      display: none;
    }

    [part="body"],
    .body {
      position: relative;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      min-height: 120px;
    }

    [part="content"],
    .content {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    [part="empty"],
    .empty-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      color: var(--color-fg-subtle, #6b7280);
      font-size: var(--font-size-sm, 0.875rem);
      width: 100%;
      height: 100%;
      text-align: center;
      padding: var(--spacing-4, 1rem);
      box-sizing: border-box;
    }

    .empty-message,
    [part="empty-message"] {
      margin: 0;
      color: var(--color-fg-subtle, #6b7280);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }
  `,
]
```

---

### File 4: `ui/src/components/ChartContainer/index.ts`

```ts
export { MoulChartContainer, MoulChartContainer as ChartContainer } from './ChartContainer'
export type { ChartContainerProps, LegendItem } from './ChartContainer'
```

---

## 5. Verification Method

To independently verify this implementation:

1. **Verify No React Dependencies or Imports**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected outcome*: Exit code 0, 0 prohibited packages or imports.

2. **Verify Biome Linting and Formatting**:
   ```bash
   bun run lint
   ```
   *Expected outcome*: Clean pass with 0 errors.

3. **Verify Vitest Unit & Integration Test Suite**:
   Create or run test suite verifying:
   - Registration of `moul-chart-container` in `customElements` and `HTMLElementTagNameMap`.
   - `getChartColor(0)` returns `var(--color-chart-1)`, `getChartColor(7)` returns `var(--color-chart-8)`, `getChartColor(8)` returns `var(--color-chart-1)`.
   - Default slot rendered when `isEmpty` is `false`.
   - Empty slot with `<p class="empty-message">No data available</p>` rendered when `isEmpty` is `true`.
   - `viewport-resize` event dispatched with `{ width, height, breakpoint }` on `triggerResize`.
   - `customElements.define` deduplication warning without throwing.
   ```bash
   bun run --cwd ui test
   ```
