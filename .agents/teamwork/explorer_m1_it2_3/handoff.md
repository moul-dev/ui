# Handoff Report: Multi-Series Payload Rendering & Backward Compatibility for MoulChartTooltip

**Agent**: `explorer_m1_it2_3`  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_it2_3`  
**Target Milestone**: Milestone 1 Iteration 2 — Chart Infrastructure Remediation  
**Date**: 2026-10-17  
**Status**: COMPLETE (Investigation & Design Proposal)

---

## 1. Observation

### 1.1 Current Tooltip Implementation (`ui/src/components/ChartTooltip/ChartTooltip.ts`)
- **Lines 6–13**: `ChartTooltipShowOptions` accepts an optional `payload?: unknown[]`:
  ```ts
  export interface ChartTooltipShowOptions {
    label: string
    value: string
    color?: string
    x?: number
    y?: number
    payload?: unknown[]
  }
  ```
- **Lines 18–35**: Property declaration declares `payload: { attribute: false }` and `declare payload: unknown[]`, initialized to `[]` in `constructor()` (line 46).
- **Lines 116–118**: `show(options)` copies `optionsOrX.payload` to `this.payload`:
  ```ts
  if (optionsOrX.payload !== undefined) {
    this.payload = optionsOrX.payload
  }
  ```
- **Lines 159–174**: The Lit `render()` method strictly renders a single indicator, single label, and single value, ignoring `this.payload` entirely:
  ```ts
  protected override render() {
    return html`
      <div part="container" class="tooltip-container">
        <div part="header" class="tooltip-header">
          <span
            part="indicator"
            class="indicator"
            style="background-color: ${this.color};"
          ></span>
          <span part="label" class="label">${this.label}</span>
          <span part="value" class="value">${this.value}</span>
        </div>
        <slot></slot>
      </div>
    `
  }
  ```

### 1.2 Reviewer Finding 3 from `reviewer_m1_2/handoff.md`
- In `reviewer_m1_2/handoff.md` lines 173–177:
  > **[Minor] Finding 3: Multi-Series Payload Rendering Ignored in Default Template**  
  > - Location: `ui/src/components/ChartTooltip/ChartTooltip.ts:160–174`  
  > - Issue: `ChartTooltip` accepts `payload: unknown[]`, but `render()` does not render multi-series payload items if present.  
  > - Suggested Fix: Add support for rendering a list of items when `payload && payload.length > 0`.

### 1.3 Legacy Implementation Reference (`ui/src/components/ChartTooltip/ChartTooltip.tsx`)
- In the legacy React component, `payload` was rendered as a list when present (lines 26–50):
  ```tsx
  {label && <div {...stylex.props(styles.label)}>{label}</div>}
  <ul {...stylex.props(styles.list)}>
    {payload.map((entry, idx) => {
      const formattedValue = valueFormatter ? valueFormatter(entry.value) : entry.value
      return (
        <li key={idx} {...stylex.props(styles.item)}>
          <span {...stylex.props(styles.indicator)}>
            <span {...stylex.props(styles.dot)} style={{ backgroundColor: entry.color || entry.payload?.fill || 'var(--colorPrimary500)' }} />
            <span {...stylex.props(styles.name)}>{entry.name}</span>
          </span>
          <span {...stylex.props(styles.value)}>{formattedValue}</span>
        </li>
      )
    })}
  </ul>
  ```

### 1.4 Test Suite Constraints & Assertions
- In `ui/src/components/Charts.test.ts` (lines 317–327):
  ```ts
  const labelEl = tooltip.shadowRoot?.querySelector('[part="label"]')
  const valueEl = tooltip.shadowRoot?.querySelector('[part="value"]')
  const indicatorEl = tooltip.shadowRoot?.querySelector('[part="indicator"]')
  expect(labelEl?.textContent).toContain('March 2026')
  expect(valueEl?.textContent).toContain('$82,500')
  expect(indicatorEl?.getAttribute('style')).toContain('var(--color-chart-3)')
  ```
- In `ui/src/components/chart-tooltip-challenge.test.ts` (`CHALLENGE-TLP-17`, lines 430–445):
  ```ts
  const customPayload = [{ id: 'series-a', rawValue: 1234 }]
  tooltip.show({
    label: 'With Payload',
    value: '100%',
    color: '#ffaa00',
    x: 30,
    y: 40,
    payload: customPayload,
  })
  await awaitNestedUpdates(tooltip)
  expect(tooltip.color).toBe('#ffaa00')
  expect(tooltip.payload).toEqual(customPayload)
  const indicator = tooltip.shadowRoot?.querySelector('[part="indicator"]')
  expect(indicator?.getAttribute('style')).toContain('#ffaa00')
  ```
  **Critical Observation**: `CHALLENGE-TLP-17` passes BOTH single-series fields (`label: 'With Payload'`, `value: '100%'`, `color: '#ffaa00'`) AND `payload: customPayload`, and asserts that `querySelector('[part="indicator"]')` has style `#ffaa00`.

### 1.5 Attribute Selector Semantics in `happy-dom`
- An empirical run in `happy-dom` verified:
  - Exact selector `[part="indicator"]` matches an element with `part="indicator"`.
  - Exact selector `[part="indicator"]` does **NOT** match an element with multi-token `part="item-indicator indicator"`.
  - Therefore, exact part names (`part="indicator"`, `part="label"`, `part="value"`, `part="title"`, `part="item"`, `part="list"`) must be retained as single atomic tokens for complete test compatibility.

---

## 2. Logic Chain

1. **Dual Render Modality**:
   - Charts have two usage patterns for tooltips:
     - **Pattern A (Single-Series)**: Single series data points (e.g. Doughnut slice, single-line hover, Stat metric). The hover event supplies `label`, `value`, and `color`. `payload` is empty or omitted.
     - **Pattern B1 (Multi-Series in place of single value)**: Hovering across a category axis in multi-series charts (e.g. LineChart, AreaChart, BarChart with 3 series). `label` provides the category/date (e.g. `"March 2026"`), while `payload` provides array entries `[{ name, value, color }, ...]`. `value` is omitted or empty.
     - **Pattern B2 (Multi-Series alongside single value)**: Hovering where a summary/total or headline metric is provided alongside sub-items (and specifically verified in `CHALLENGE-TLP-17`). `label` and `value` are both present, accompanied by `payload`.
2. **Backward Compatibility Guarantee**:
   - When `payload` is empty (`!Array.isArray(this.payload) || this.payload.length === 0`), the template must render exactly as it does today:
     `<div part="header" class="tooltip-header"><span part="indicator" ...></span><span part="label">${this.label}</span><span part="value">${this.value}</span></div><slot></slot>`.
   - This ensures 100% preservation of `CHART-TLP-01` through `CHART-TLP-05` and `CHALLENGE-TLP-01` through `CHALLENGE-TLP-21`.
3. **Multi-Series Header Differentiation**:
   - In Multi-Series Mode (`hasPayload = true`):
     - If `this.value` is present (`hasSingleValue = true`): Render the summary header with `part="indicator"` (styled with `this.color`), `part="label"`, and `part="value"`. This directly satisfies `CHALLENGE-TLP-17`.
     - If `this.value` is empty and `this.label` is present: Render the category title `<div part="header" class="tooltip-header tooltip-title"><span part="title" class="title">${this.label}</span></div>`. No single indicator dot is rendered beside the category title, avoiding misleading single-color attribution for multi-series categories.
4. **Multi-Series Items List**:
   - Render `<ul part="list" class="tooltip-list">`.
   - Map each item in `this.payload`:
     - Extract `name` (checking `name ?? label ?? key`).
     - Extract `value` (checking `value ?? rawValue`, formatted via `this.valueFormatter` if present).
     - Extract `color` (checking `color ?? fill ?? stroke ?? payload?.fill`, falling back to `getChartColor(index)` from `ChartCommon.ts`).
     - Render `<li part="item" class="tooltip-item">` with `.tooltip-item-series` containing `part="indicator"`, `part="label"`, and on the right `part="value"`.
5. **State Resetting**:
   - When `show()` is called with options lacking `payload`, `this.payload` must reset to `[]` (avoiding state leakage from previous multi-series hover).

---

## 3. Caveats

1. **Shadow DOM Parts Inheritance**:
   Consumers styling tooltip elements using CSS Shadow Parts (`moul-chart-tooltip::part(...)`) will style both single-series and multi-series indicators via `::part(indicator)`, labels via `::part(label)`, and values via `::part(value)`. Additional specific parts `::part(title)`, `::part(list)`, and `::part(item)` are introduced for multi-series without breaking existing styles.
2. **Reviewer Finding 1 & Finding 2 Coordination**:
   `ChartTooltip.ts` also contains the doubled-offset coordinate bug (`Finding 1`) and missing glass backdrop-filter progressive enhancement (`Finding 2`). The proposed templates below include fixes for all three findings so the remediation worker can apply them cleanly in a single pass.

---

## 4. Conclusion & Concrete Code Recommendations

### 4.1 Interface Contract Definition (`ui/src/components/ChartCommon.ts`)
Add `ChartTooltipPayloadEntry` and augment `PointHoverDetail` in `ui/src/components/ChartCommon.ts`:

```ts
export interface ChartTooltipPayloadEntry {
  name?: string
  label?: string
  key?: string
  value?: unknown
  rawValue?: unknown
  color?: string
  fill?: string
  stroke?: string
  payload?: Record<string, unknown>
  [key: string]: unknown
}

export interface PointHoverDetail {
  point?: Record<string, unknown>
  series?: ChartSeries | string
  value?: unknown
  label: string
  x: number
  y: number
  payload?: (ChartTooltipPayloadEntry | unknown)[]
}
```

### 4.2 Complete Recommended Code: `ui/src/components/ChartTooltip/ChartTooltip.ts`

```ts
import { html, LitElement, type PropertyValues } from 'lit'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import { getChartColor } from '../ChartCommon'
import { chartTooltipStyles } from './ChartTooltip.styles'

export interface ChartTooltipPayloadEntry {
  name?: string
  label?: string
  key?: string
  value?: unknown
  rawValue?: unknown
  color?: string
  fill?: string
  stroke?: string
  payload?: Record<string, unknown>
  [key: string]: unknown
}

export interface ChartTooltipShowOptions {
  label?: string
  value?: string
  color?: string
  x?: number
  y?: number
  payload?: (ChartTooltipPayloadEntry | unknown)[]
  valueFormatter?: (value: unknown) => string
}

export class MoulChartTooltip extends LitElement {
  static override styles = chartTooltipStyles

  static override properties = {
    label: { type: String },
    value: { type: String },
    color: { type: String },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    x: { type: Number },
    y: { type: Number },
    payload: { attribute: false },
    valueFormatter: { attribute: false },
  }

  declare label: string
  declare value: string
  declare color: string
  declare isOpen: boolean
  declare x: number
  declare y: number
  declare payload: (ChartTooltipPayloadEntry | unknown)[]
  declare valueFormatter?: (value: unknown) => string

  public overlayPresence: OverlayPresenceController

  constructor() {
    super()
    this.label = ''
    this.value = ''
    this.color = 'var(--color-chart-1)'
    this.isOpen = false
    this.x = 0
    this.y = 0
    this.payload = []
    this.valueFormatter = undefined
    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'tooltip',
      popover: () => this.popoverEl,
    })
  }

  public get popoverEl(): HTMLElement {
    return this
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasAttribute('popover')) {
      this.setAttribute('popover', 'manual')
    }
    this.updatePosition()
  }

  public updatePosition(): void {
    // Finding 1 fix: Anchor coordinates via left/top; transform applies pin offset only
    this.style.left = `${this.x}px`
    this.style.top = `${this.y}px`
    this.style.transform = 'translate(-50%, -100%) translateY(-8px)'
  }

  public override showPopover(): void {
    if (!this.isConnected) return
    try {
      if (!this.matches(':popover-open')) {
        super.showPopover()
      }
    } catch {
      this.setAttribute(':popover-open', '')
      this.classList.add(':popover-open')
    }
    this.isOpen = true
  }

  public override hidePopover(): void {
    if (!this.isConnected) return
    try {
      if (this.matches(':popover-open')) {
        super.hidePopover()
      }
    } catch {
      this.removeAttribute(':popover-open')
      this.classList.remove(':popover-open')
    }
    this.isOpen = false
  }

  public show(
    optionsOrX?: ChartTooltipShowOptions | number,
    y?: number,
    label?: string,
    value?: string,
    color?: string,
  ): void {
    if (typeof optionsOrX === 'object' && optionsOrX !== null) {
      this.label = optionsOrX.label !== undefined ? String(optionsOrX.label) : ''
      this.value = optionsOrX.value !== undefined ? String(optionsOrX.value) : ''
      if (optionsOrX.color !== undefined) {
        this.color = optionsOrX.color
      }
      if (optionsOrX.x !== undefined) {
        this.x = optionsOrX.x
      }
      if (optionsOrX.y !== undefined) {
        this.y = optionsOrX.y
      }
      this.payload = optionsOrX.payload !== undefined && Array.isArray(optionsOrX.payload)
        ? optionsOrX.payload
        : []
      if (optionsOrX.valueFormatter !== undefined) {
        this.valueFormatter = optionsOrX.valueFormatter
      }
    } else if (typeof optionsOrX === 'number') {
      this.x = optionsOrX
      this.y = y ?? 0
      this.label = label !== undefined ? String(label) : ''
      this.value = value !== undefined ? String(value) : ''
      if (color !== undefined) {
        this.color = color
      }
      this.payload = []
    } else {
      this.payload = []
    }

    this.isOpen = true
    this.updatePosition()
    this.showPopover()
    this.overlayPresence.setOpen(true)
    this.requestUpdate()
  }

  public hide(): void {
    this.isOpen = false
    this.hidePopover()
    this.overlayPresence.setOpen(false)
    this.requestUpdate()
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('x') || changedProps.has('y')) {
      this.updatePosition()
    }

    if (changedProps.has('isOpen')) {
      if (this.isOpen) {
        this.showPopover()
      } else {
        this.hidePopover()
      }
    }
  }

  private formatPayloadEntry(entry: unknown, index: number): {
    name: string
    value: string
    color: string
  } {
    if (typeof entry === 'object' && entry !== null) {
      const item = entry as Record<string, unknown>
      const name =
        typeof item.name === 'string'
          ? item.name
          : typeof item.label === 'string'
            ? item.label
            : typeof item.key === 'string'
              ? item.key
              : ''

      const rawVal = item.value !== undefined ? item.value : item.rawValue
      let formattedVal = ''
      if (rawVal !== undefined && rawVal !== null) {
        formattedVal = this.valueFormatter
          ? this.valueFormatter(rawVal)
          : String(rawVal)
      }

      const color =
        typeof item.color === 'string'
          ? item.color
          : typeof item.fill === 'string'
            ? item.fill
            : typeof item.stroke === 'string'
              ? item.stroke
              : typeof (item.payload as Record<string, unknown>)?.fill === 'string'
                ? ((item.payload as Record<string, unknown>).fill as string)
                : getChartColor(index)

      return { name, value: formattedVal, color }
    }

    const formattedVal = this.valueFormatter
      ? this.valueFormatter(entry)
      : entry !== undefined && entry !== null
        ? String(entry)
        : ''

    return {
      name: '',
      value: formattedVal,
      color: getChartColor(index),
    }
  }

  protected override render() {
    const hasPayload = Array.isArray(this.payload) && this.payload.length > 0

    // Single-series rendering (no payload or empty payload) — 100% backward compatible
    if (!hasPayload) {
      return html`
        <div part="container" class="tooltip-container">
          <div part="header" class="tooltip-header">
            <span
              part="indicator"
              class="indicator"
              style="background-color: ${this.color};"
            ></span>
            <span part="label" class="label">${this.label}</span>
            <span part="value" class="value">${this.value}</span>
          </div>
          <slot></slot>
        </div>
      `
    }

    // Multi-series rendering with payload items
    const hasSingleValue = this.value !== '' && this.value !== undefined
    const hasLabel = this.label !== '' && this.label !== undefined

    return html`
      <div part="container" class="tooltip-container">
        ${hasSingleValue
          ? html`
              <div part="header" class="tooltip-header">
                <span
                  part="indicator"
                  class="indicator"
                  style="background-color: ${this.color};"
                ></span>
                <span part="label" class="label">${this.label}</span>
                <span part="value" class="value">${this.value}</span>
              </div>
            `
          : hasLabel
            ? html`
                <div part="header" class="tooltip-header tooltip-title">
                  <span part="title" class="title">${this.label}</span>
                </div>
              `
            : ''}

        <ul part="list" class="tooltip-list">
          ${this.payload.map((entry, idx) => {
            const item = this.formatPayloadEntry(entry, idx)
            return html`
              <li part="item" class="tooltip-item">
                <div class="tooltip-item-series">
                  <span
                    part="indicator"
                    class="indicator"
                    style="background-color: ${item.color};"
                  ></span>
                  ${item.name
                    ? html`<span part="label" class="label">${item.name}</span>`
                    : ''}
                </div>
                ${item.value
                  ? html`<span part="value" class="value">${item.value}</span>`
                  : ''}
              </li>
            `
          })}
        </ul>
        <slot></slot>
      </div>
    `
  }
}

defineElement('moul-chart-tooltip', MoulChartTooltip)

export { MoulChartTooltip as ChartTooltip }

declare global {
  interface HTMLElementTagNameMap {
    'moul-chart-tooltip': MoulChartTooltip
  }
}
```

### 4.3 Complete Recommended Code: `ui/src/components/ChartTooltip/ChartTooltip.styles.ts`

```ts
import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const chartTooltipStyles = [
  resetStyles,
  css`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      z-index: var(--z-tooltip, 1500);
      margin: 0;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--color-fg, inherit);
      pointer-events: none;
      user-select: none;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
    }

    :host(:not([is-open])) {
      display: none;
    }

    :host([is-open]) {
      display: block;
    }

    :host(:not(:popover-open):not(.\:popover-open)):not([is-open]) {
      display: none;
    }

    :host(:popover-open),
    :host(.\:popover-open) {
      display: block;
    }

    [part="container"],
    .tooltip-container {
      display: inline-flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      background-color: var(--color-bg-elevated, #ffffff);
      border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.1));
      border-radius: var(--radius-md, 0.5rem);
      box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg, #111827);
      white-space: nowrap;
      pointer-events: none;
    }

    /* Finding 2 fix: Glass backdrop-filter progressive enhancement */
    @supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)) {
      [part="container"],
      .tooltip-container {
        background-color: var(--color-bg-glass, rgba(255, 255, 255, 0.85));
        border-color: var(--color-border-glass, rgba(0, 0, 0, 0.1));
        -webkit-backdrop-filter: blur(12px);
        backdrop-filter: blur(12px);
      }
    }

    [part="header"],
    .tooltip-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
    }

    [part="title"],
    .tooltip-title {
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg, #111827);
    }

    /* Finding 3: Multi-series list & item layout */
    [part="list"],
    .tooltip-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    [part="item"],
    .tooltip-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-3, 0.75rem);
    }

    .tooltip-item-series {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
    }

    [part="indicator"],
    .indicator {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full, 9999px);
      flex-shrink: 0;
      display: inline-block;
    }

    [part="label"],
    .label {
      color: var(--color-fg-subtle, #6b7280);
      font-weight: var(--font-weight-medium, 500);
    }

    [part="value"],
    .value {
      color: var(--color-fg, #111827);
      font-weight: var(--font-weight-semibold, 600);
    }
  `,
]

export const styles = chartTooltipStyles
```

---

## 5. Verification Method

To independently verify the implementation when applied by the remediation worker:

1. **Verify Unit & Multi-Series Tests in Vitest**:
   Add the following tests to `ui/src/components/Charts.test.ts`:
   ```ts
   it('CHART-TLP-06: Multi-series payload renders series items with indicators and labels', async () => {
     const tooltip = await mount<MoulChartTooltip>(html`<moul-chart-tooltip></moul-chart-tooltip>`)
     tooltip.show({
       label: 'Q1 Metrics',
       x: 100,
       y: 50,
       payload: [
         { name: 'Revenue', value: '$50,000', color: 'var(--color-chart-1)' },
         { name: 'Profit', value: '$12,000', color: 'var(--color-chart-2)' },
       ],
     })
     await awaitNestedUpdates(tooltip)

     const titleEl = tooltip.shadowRoot?.querySelector('[part="title"]')
     expect(titleEl?.textContent).toBe('Q1 Metrics')

     const items = tooltip.shadowRoot?.querySelectorAll('[part="item"]')
     expect(items?.length).toBe(2)

     const labels = Array.from(tooltip.shadowRoot?.querySelectorAll('[part="label"]') ?? []).map(el => el.textContent)
     expect(labels).toEqual(['Revenue', 'Profit'])

     const values = Array.from(tooltip.shadowRoot?.querySelectorAll('[part="value"]') ?? []).map(el => el.textContent)
     expect(values).toEqual(['$50,000', '$12,000'])
   })

   it('CHART-TLP-07: Custom valueFormatter formats payload values correctly', async () => {
     const tooltip = await mount<MoulChartTooltip>(html`<moul-chart-tooltip></moul-chart-tooltip>`)
     tooltip.show({
       label: 'Summary',
       valueFormatter: (v) => `€${Number(v) * 2}`,
       payload: [{ name: 'Euro', value: 100 }],
     })
     await awaitNestedUpdates(tooltip)
     const valueEl = tooltip.shadowRoot?.querySelector('[part="value"]')
     expect(valueEl?.textContent).toBe('€200')
   })
   ```

2. **Execute Full Vitest Suite**:
   ```bash
   ./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts src/components/chart-tooltip-challenge.test.ts
   ```
   *Expected outcome*: 100% tests pass (17/17 + 21/21 + new multi-series tests).

3. **Verify Linter Cleanliness**:
   ```bash
   ./node_modules/.bin/biome check ui/src/components/ChartTooltip ui/src/components/ChartCommon.ts
   ```
   *Expected outcome*: 0 errors, 0 warnings.

4. **Verify Disallowed React Dependency Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected outcome*: 0 disallowed packages.
