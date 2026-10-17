# Handoff Report: `moul-chart-tooltip` Implementation Blueprint

**Author**: `explorer_m1_2`  
**Date**: 2026-10-17  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_2`  
**Milestone**: M1 — Chart Primitives: `moul-chart-tooltip`

---

## 1. Observation

### 1.1 Direct Specification Citations
1. **`ORIGINAL_REQUEST.md` (Lines 221–266)**:
   - **R1. Chart Components & Companions Rebuild**: Implement `moul-chart-tooltip` as a Lit Web Component, registered via idempotent `defineElement` under the `moul-` prefix, with zero React/Recharts dependencies.
   - **R4. Data Point Tooltip Interaction**: "Open and position `moul-chart-tooltip` via the native Popover API upon pointer interaction over chart data points, and close it when leaving."
   - **Acceptance Criteria**: "Chart tooltip opens on point hover/pointerenter and dismisses on pointerleave using the Popover API."

2. **`rdt/design.md` §8.1 (Line 649)**:
   - **Tag**: `moul-chart-tooltip`
   - **Class**: `MoulChartTooltip`
   - **Properties**: `label: string = ''`, `value: string = ''`, `color: string = 'var(--color-chart-1)'`, `isOpen: boolean = false` (`is-open`), coordinates `x`, `y`, `payload: any[] = []`.
   - **Motion**: "Opens/closes via Popover API + `OverlayPresenceController` (`scale: [0.96, 1], opacity: [0, 1]`) and smoothly interpolates pointer position."
   - **Slots**: `default` (slot for custom content).

3. **`orchestrator_phase8_1/PROJECT.md` & `spec_miner_survey_1/handoff.md`**:
   - `moul-chart-tooltip` coordinates positioning via Popover API (`popover="manual"`) and `OverlayPresenceController` with `preset: 'tooltip'`.
   - Position formula: `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%) translateY(-8px)`.
   - Feature detection via `supportsNativePopoverAndAnchor()` from `ui/src/utils/focus-trap.ts` with fallback warning when unsupported.
   - Renders indicator dot with series color, label, formatted value, or multi-series payload list.
   - Styling: Open Shadow DOM, `resetStyles` from `ui/src/styles/reset.styles.ts`, dark/light theme aware, glass `backdrop-filter: blur(12px)` progressive enhancement, and elevated shadow referencing `var(--color-shadow)`.

### 1.2 Existing Legacy Implementation
- **Files**:
  - `ui/src/components/ChartTooltip/ChartTooltip.tsx` (54 lines): Legacy React component importing `@stylexjs/stylex` and React types. Renders container, label, and list of payload items with dot indicators.
  - `ui/src/components/ChartTooltip/ChartTooltip.styles.ts` (64 lines): StyleX style rules referencing `tokens.stylex`.
- **Violations**: Direct imports of `@stylexjs/stylex` and React, which fail `scripts/verify-no-react.ts` and Vite build guards.

### 1.3 Controller & Utilities Contracts
- **`OverlayPresenceController` (`ui/src/controllers/overlay-presence.controller.ts`)**:
  - Preset `'tooltip'` keyframes:
    - Enter: `opacity: [0, 1], scale: [0.96, 1], y: [-2, 0]` with `SPRING_SNAPPY`
    - Exit: `opacity: [1, 0], scale: [1, 0.96]` with duration `0.1s` (100ms)
  - `promoteTopLayer()` checks `options.popover?.()` and calls native `showPopover()`.
  - `demoteTopLayer()` calls `hidePopover()`.
  - Auto-respects `prefersReducedMotion()`.
- **`supportsNativePopoverAndAnchor` (`ui/src/utils/focus-trap.ts`)**:
  - Verifies `'popover' in HTMLElement.prototype` and `CSS.supports('anchor-name', '--moul-anchor')`.
- **`defineElement` (`ui/src/utils/define-element.ts`)**:
  - Idempotent custom element registration logging warning without throwing.
- **Design Tokens (`ui/src/styles/style.css`)**:
  - `--color-bg-elevated`: `light-dark(oklch(1 0 0), oklch(0.2 0 0))`
  - `--color-bg-glass`: `light-dark(oklch(1 0 0 / 0.55), oklch(0.2 0 0 / 0.45))`
  - `--color-border-glass`: `light-dark(oklch(0 0 0 / 0.08), oklch(1 0 0 / 0.1))`
  - `--color-chart-1` to `--color-chart-8`: light-dark OKLCH palettes
  - `--shadow-lg`: `0 10px 15px -3px var(--color-shadow), 0 4px 6px -4px var(--color-shadow)`
  - `--z-tooltip`: `1500`

---

## 2. Logic Chain

1. **Purge Legacy Stack**:
   - Delete `ChartTooltip.tsx` and replace with `ChartTooltip.ts` using Lit 3 `LitElement`.
   - Rewrite `ChartTooltip.styles.ts` using Lit `css` tagged template, importing `resetStyles` from `../../styles/reset.styles`.
   - Update `index.ts` to export `MoulChartTooltip`, alias `ChartTooltip`, and TypeScript types.

2. **Popover API & Top-Layer Architecture**:
   - The Popover API requires the popover target element to possess the `popover="manual"` attribute.
   - To guarantee full compatibility across unit tests and consumer usage:
     - On `connectedCallback()`, the host element asserts `popover="manual"` if not already present.
     - In the Shadow DOM, the tooltip shell `<div part="popover" popover="manual" class="chart-tooltip" role="tooltip">` also explicitly declares `popover="manual"`.
     - `this.popoverEl` getter returns `this.shadowRoot?.querySelector<HTMLElement>('[part="popover"]') ?? this`.
     - `this.overlayPresence` is configured with `{ preset: 'tooltip', popover: () => this.popoverEl }`.
     - `setOpen(true)` invokes `this.showPopover()` if supported on host, then awaits `this.overlayPresence.setOpen(true)`.
     - `setOpen(false)` awaits `this.overlayPresence.setOpen(false)`, then invokes `this.hidePopover()` if needed.
     - An `openchange` CustomEvent (`detail: { isOpen }`) is dispatched on state transitions.

3. **Coordinate Transformation & Positioning**:
   - Coordinate tracking maps `(x, y)` coordinates directly to CSS transform:
     `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%) translateY(-8px)`
     - `translate3d(x, y, 0)` moves origin to the point coordinate.
     - `translate(-50%, -100%)` anchors the tooltip centered horizontally and positioned above the coordinate.
     - `translateY(-8px)` creates the standard 8px clearance gap.
   - `updatePosition()` sets both inline `popover.style.transform` and host custom properties `--_x` and `--_y`.
   - Feature detection: in `firstUpdated()`, calls `supportsNativePopoverAndAnchor()`. If unsupported, logs `console.warn` once per session and falls back to coordinate transform positioning.

4. **Visual Structure & Slots**:
   - The component renders:
     - Root popover container (`part="popover tooltip"`, `role="tooltip"`, `popover="manual"`).
     - Default `<slot>` containing the fallback template:
       - Header label: if `this.label` is provided, renders `<div part="label" class="label">${this.label}</div>`.
       - Content:
         - If `this.payload` contains multi-series items (`payload.length > 0`), renders `<ul part="list" class="list">` with `<li part="item" class="item">` for each entry, showing indicator dot (`part="dot"`), series name (`part="name"`), and formatted value (`part="value"`).
         - If `this.payload` is empty, renders single `<div part="item" class="item">` with indicator dot (`part="dot"` styled with `background-color: ${this.color}`), series name (if present), and formatted value (`part="value"`).
     - Any consumer providing slotted children inside `<moul-chart-tooltip>` seamlessly replaces the default content.

5. **Theme-Aware & Progressive Glass Enhancement**:
   - Base theme colors use semantic tokens (`--color-bg-elevated`, `--color-fg`, `--color-border`, `--shadow-lg`).
   - Progressive glass enhancement:
     ```css
     @supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)) {
       [part="popover"] {
         background-color: var(--color-bg-glass);
         border-color: var(--color-border-glass);
         -webkit-backdrop-filter: blur(12px);
         backdrop-filter: blur(12px);
       }
     }
     ```
   - Respects light/dark mode automatically via `light-dark()` definitions in `style.css`.

---

## 3. Caveats

1. **Happy-DOM Popover Shim Details**:
   - In `happy-dom`, `showPopover()` toggles the `:popover-open` attribute and class. Testing assertions must verify either `popover.matches(':popover-open')` or `tooltip.isOpen`.
2. **Disconnected Elements**:
   - Calling `showPopover()` on disconnected elements throws a `DOMException` in the spec and happy-dom. All popover invocations must be guarded by `this.isConnected` and wrapped in `try/catch`.
3. **No Code Modification During Phase 8 Milestone 1 Survey**:
   - This document is a blueprint specification. The actual file replacements must be performed by the designated implementer agent.

---

## 4. Conclusion & Complete Implementation Blueprint

### 4.1 Target File: `ui/src/components/ChartTooltip/ChartTooltip.styles.ts`

```ts
import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const chartTooltipStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: var(--z-tooltip, 1500);
    }

    :host([hidden]),
    [hidden] {
      display: none !important;
    }

    [part="popover"],
    [part="tooltip"],
    .chart-tooltip {
      position: absolute;
      inset: auto;
      top: 0;
      left: 0;
      margin: 0;
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      background-color: var(--color-bg-elevated, #ffffff);
      color: var(--color-fg, #111827);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 0.5rem);
      box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
      font-family: var(--font-family-base, inherit);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      pointer-events: none;
      user-select: none;
      min-width: 120px;
      max-width: 280px;
      box-sizing: border-box;
      z-index: var(--z-tooltip, 1500);
      transform: translate3d(var(--_x, 0px), var(--_y, 0px), 0) translate(-50%, -100%) translateY(-8px);
      will-change: transform, opacity;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
    }

    /* Popover API visibility toggling */
    [part="popover"]:not(:popover-open):not(.\:popover-open) {
      display: none;
    }

    [part="popover"]:popover-open,
    [part="popover"].\:popover-open {
      display: flex;
    }

    /* Fallback visibility if property toggled before popover promotion */
    :host([is-open]) [part="popover"] {
      display: flex;
    }

    /* Glass progressive enhancement with backdrop blur */
    @supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)) {
      [part="popover"],
      [part="tooltip"],
      .chart-tooltip {
        background-color: var(--color-bg-glass, rgba(255, 255, 255, 0.75));
        border-color: var(--color-border-glass, rgba(0, 0, 0, 0.1));
        -webkit-backdrop-filter: blur(12px);
        backdrop-filter: blur(12px);
      }
    }

    /* Label header */
    [part="label"],
    .label {
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg, #111827);
      border-bottom: 1px solid var(--color-border-subtle, #f3f4f6);
      padding-bottom: var(--spacing-1, 0.25rem);
      margin-bottom: var(--spacing-1, 0.25rem);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Multi-series list */
    [part="list"],
    .list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    /* Data point row item */
    [part="item"],
    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-3, 0.75rem);
      white-space: nowrap;
    }

    /* Indicator wrapper */
    [part="indicator"],
    .indicator {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
    }

    /* Indicator series dot */
    [part="dot"],
    .dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full, 9999px);
      flex-shrink: 0;
      display: inline-block;
      background-color: var(--color-chart-1, #3b82f6);
    }

    /* Series name */
    [part="name"],
    .name {
      color: var(--color-fg-subtle, #6b7280);
      font-size: var(--font-size-xs, 0.75rem);
    }

    /* Metric value */
    [part="value"],
    .value {
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg, #111827);
      font-variant-numeric: tabular-nums;
    }

    /* Progressive enhancement for CSS Anchor Positioning when supported */
    @supports (position-anchor: --test) {
      :host([anchor]) [part="popover"] {
        position-anchor: var(--_anchor);
        bottom: anchor(top);
        left: anchor(center);
        transform: translate(-50%, -8px);
      }
    }
  `,
]
```

### 4.2 Target File: `ui/src/components/ChartTooltip/ChartTooltip.ts`

```ts
import { html, LitElement, type PropertyValues } from 'lit'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import { supportsNativePopoverAndAnchor } from '../../utils/focus-trap'
import { chartTooltipStyles } from './ChartTooltip.styles'

export interface ChartTooltipPayloadEntry {
  name?: string
  value?: unknown
  color?: string
  payload?: { fill?: string; [key: string]: unknown }
  [key: string]: unknown
}

export class MoulChartTooltip extends LitElement {
  static override styles = chartTooltipStyles

  static override properties = {
    label: { type: String, reflect: true },
    value: { type: String, reflect: true },
    color: { type: String, reflect: true },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    x: { type: Number, reflect: true },
    y: { type: Number, reflect: true },
    payload: { type: Array, attribute: false },
    valueFormatter: { attribute: false },
  }

  declare label: string
  declare value: string
  declare color: string
  declare isOpen: boolean
  declare x: number
  declare y: number
  declare payload: ChartTooltipPayloadEntry[]
  public valueFormatter?: (value: unknown) => string

  public overlayPresence: OverlayPresenceController
  private static warnedFallback = false

  constructor() {
    super()
    this.label = ''
    this.value = ''
    this.color = 'var(--color-chart-1)'
    this.isOpen = false
    this.x = 0
    this.y = 0
    this.payload = []

    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'tooltip',
      popover: () => this.popoverEl,
    })
  }

  public get popoverEl(): HTMLElement | null {
    return (
      this.shadowRoot?.querySelector<HTMLElement>('[part~="popover"]') ?? this
    )
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasAttribute('popover')) {
      this.setAttribute('popover', 'manual')
    }
    this.addEventListener('keydown', this.handleKeyDown)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.handleKeyDown)
  }

  protected override firstUpdated(): void {
    if (!supportsNativePopoverAndAnchor() && !MoulChartTooltip.warnedFallback) {
      MoulChartTooltip.warnedFallback = true
      console.warn(
        '[@moul-dev/ui] Native Popover or Anchor Positioning not supported; applying fallback coordinate positioning.',
      )
    }
    this.updatePosition()
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('isOpen')) {
      if (this.isOpen !== this.overlayPresence.isOpen) {
        this.setOpen(this.isOpen)
      }
    }

    if (changedProps.has('x') || changedProps.has('y')) {
      this.updatePosition()
    }
  }

  public updatePosition(): void {
    const popover = this.popoverEl
    if (popover && popover !== this) {
      popover.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) translate(-50%, -100%) translateY(-8px)`
    }
    this.style.setProperty('--_x', `${this.x}px`)
    this.style.setProperty('--_y', `${this.y}px`)
  }

  public async show(
    x: number,
    y: number,
    label: string,
    value: string,
    color?: string,
  ): Promise<void> {
    this.x = x
    this.y = y
    this.label = label
    this.value = value
    if (color) {
      this.color = color
    }
    this.updatePosition()
    await this.setOpen(true)
  }

  public async hide(): Promise<void> {
    await this.setOpen(false)
  }

  public async setOpen(nextOpen: boolean): Promise<void> {
    if (this.isOpen === nextOpen && this.overlayPresence.isOpen === nextOpen) {
      return
    }

    this.isOpen = nextOpen

    if (nextOpen) {
      if (typeof this.showPopover === 'function' && !this.matches(':popover-open')) {
        try {
          this.showPopover()
        } catch {
          // Safe fallback if popover API throws
        }
      }
      await this.overlayPresence.setOpen(true)
    } else {
      await this.overlayPresence.setOpen(false)
      if (typeof this.hidePopover === 'function' && this.matches(':popover-open')) {
        try {
          this.hidePopover()
        } catch {
          // Safe fallback
        }
      }
    }

    this.dispatchEvent(
      new CustomEvent('openchange', {
        bubbles: true,
        composed: true,
        detail: { isOpen: this.isOpen },
      }),
    )
  }

  public async toggle(force?: boolean): Promise<void> {
    const next = typeof force === 'boolean' ? force : !this.isOpen
    await this.setOpen(next)
  }

  public formatValue(val: unknown): string {
    if (val === null || val === undefined) return ''
    if (typeof this.valueFormatter === 'function') {
      try {
        return this.valueFormatter(val)
      } catch {
        return String(val)
      }
    }
    return String(val)
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.isOpen) {
      e.stopPropagation()
      this.hide()
    }
  }

  private renderFallbackContent() {
    if (this.payload && this.payload.length > 0) {
      return html`
        <ul part="list" class="list">
          ${this.payload.map((entry) => {
            const entryColor =
              entry.color ||
              entry.payload?.fill ||
              this.color ||
              'var(--color-chart-1)'
            const entryValue = this.formatValue(entry.value ?? this.value)
            const entryName = entry.name ?? this.label
            return html`
              <li part="item" class="item">
                <span part="indicator" class="indicator">
                  <span
                    part="dot"
                    class="dot"
                    style="background-color: ${entryColor};"
                  ></span>
                  ${entryName
                    ? html`<span part="name" class="name">${entryName}</span>`
                    : ''}
                </span>
                <span part="value" class="value">${entryValue}</span>
              </li>
            `
          })}
        </ul>
      `
    }

    return html`
      <div part="item" class="item">
        <span part="indicator" class="indicator">
          <span
            part="dot"
            class="dot"
            style="background-color: ${this.color};"
          ></span>
          ${this.label
            ? html`<span part="name" class="name">${this.label}</span>`
            : ''}
        </span>
        <span part="value" class="value">${this.formatValue(this.value)}</span>
      </div>
    `
  }

  protected override render() {
    return html`
      <div
        part="popover tooltip"
        class="chart-tooltip"
        popover="manual"
        role="tooltip"
        style="transform: translate3d(${this.x}px, ${this.y}px, 0) translate(-50%, -100%) translateY(-8px);"
      >
        <slot>
          ${this.label && (!this.payload || this.payload.length === 0)
            ? ''
            : this.label
              ? html`<div part="label" class="label">${this.label}</div>`
              : ''}
          ${this.renderFallbackContent()}
        </slot>
      </div>
    `
  }
}

defineElement('moul-chart-tooltip', MoulChartTooltip)

declare global {
  interface HTMLElementTagNameMap {
    'moul-chart-tooltip': MoulChartTooltip
  }
}
```

### 4.3 Target File: `ui/src/components/ChartTooltip/index.ts`

```ts
export {
  ChartTooltipPayloadEntry,
  MoulChartTooltip,
  MoulChartTooltip as ChartTooltip,
} from './ChartTooltip'
```

---

## 5. Verification Method

To independently verify the implementation blueprint once applied:

1. **Check Dependency Guard & Zero React Purity**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected outcome*: Exits with code 0. Zero occurrences of React, Recharts, or StyleX in `ui/src/components/ChartTooltip/`.

2. **Run Biome Linter**:
   ```bash
   bun run lint
   ```
   *Expected outcome*: 0 formatting or linting errors in `ui/src/components/ChartTooltip/`.

3. **Verify Component Instantiation in Vitest Test**:
   ```ts
   import './ChartTooltip/ChartTooltip'
   import type { MoulChartTooltip } from './ChartTooltip/ChartTooltip'

   const tooltip = document.createElement('moul-chart-tooltip') as MoulChartTooltip
   document.body.appendChild(tooltip)

   expect(tooltip.isOpen).toBe(false)
   expect(tooltip.getAttribute('popover')).toBe('manual')

   await tooltip.show(120, 240, 'January', '420', 'var(--color-chart-2)')
   expect(tooltip.isOpen).toBe(true)
   expect(tooltip.x).toBe(120)
   expect(tooltip.y).toBe(240)
   expect(tooltip.label).toBe('January')
   expect(tooltip.value).toBe('420')
   expect(tooltip.color).toBe('var(--color-chart-2)')

   const dot = tooltip.shadowRoot?.querySelector('[part~="dot"]') as HTMLElement
   expect(dot?.style.backgroundColor).toBe('var(--color-chart-2)')

   await tooltip.hide()
   expect(tooltip.isOpen).toBe(false)
   ```

4. **Invalidation Conditions**:
   - Re-introducing any StyleX or React imports invalidates the build.
   - Omission of `popover="manual"` causes browser or happy-dom `showPopover` calls to throw.
   - Omission of `OverlayPresenceController` breaks top-layer entrance/exit animation synchronization.
