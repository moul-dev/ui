# Handoff Report: Investigation of `moul-top-list` (Milestone 3)

## 1. Observation

### 1.1 Legacy Implementation (`ui/src/components/TopList/TopList.tsx` and `TopList.styles.ts`)
Legacy `TopList` is a React forwardRef component coupled to `@stylexjs/stylex`:
- **File**: `ui/src/components/TopList/TopList.tsx` (lines 1–7, 26–39, 47–51, 60–92):
  ```tsx
  'use client'
  import type { StyleXStyles } from '@stylexjs/stylex'
  import * as stylex from '@stylexjs/stylex'
  import * as React from 'react'
  import { tokens } from '../../tokens/tokens.stylex'
  import { CHART_COLORS } from '../ChartCommon'
  import { styles } from './TopList.styles'

  export interface TopListItem {
    label: string
    value: number
    color?: string
  }

  export interface TopListProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
    data: TopListItem[]
    maxValue?: number
    colors?: string[]
    barColor?: string
    multiColor?: boolean
    valueFormatter?: (value: number) => string
    style?: StyleXStyles
  }
  ```
- **Legacy Max calculation** (lines 47–51):
  ```tsx
  const computedMax = React.useMemo(() => {
    if (maxValue !== undefined) return maxValue
    if (data.length === 0) return 1
    return Math.max(...data.map((d) => d.value))
  }, [data, maxValue])
  ```
- **Legacy Row Layout in `TopList.styles.ts`** (lines 13–18):
  ```ts
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(100px, 1.5fr) 2fr minmax(60px, auto)',
    alignItems: 'center',
    gap: tokens.spacing4,
  }
  ```
- **Track & Bar** (`TopList.styles.ts` lines 27–38):
  ```ts
  track: {
    height: '6px',
    backgroundColor: tokens.colorNeutral200,
    borderRadius: tokens.radiusFull,
    width: '100%',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: tokens.radiusFull,
    transition: 'width 0.3s ease-in-out',
  }
  ```

### 1.2 Specification Contracts (`rdt/design.md` §8.1 & `ChartCommon.ts`)
- **`rdt/design.md` §8.1** (line 645):
  - Component Class: `MoulTopList`
  - Custom Element Tag: `moul-top-list`
  - Properties: `data: TopListItem[] = []`, `maxItems: number = 10` (`max-items`), `valueFormatter?: (v: number) => string`
  - Slots: `empty`
  - Events: `item-press`
  - Motion: Staggered row entrance (`y: [6, 0], opacity: [0, 1]`, `stagger(0.03)`) and bar width fill (`350ms`, `CHART_EASE`).
- **`ui/src/components/ChartCommon.ts`** (lines 15–20, 42–45):
  ```ts
  export interface TopListItem {
    label: string
    value: number
    color?: string
    [key: string]: unknown
  }

  export function getChartColor(index: number): string {
    const step = (((index % 8) + 8) % 8) + 1
    return `var(--color-chart-${step})`
  }
  ```
- **DISPATCH.md Requirements**:
  - Component tag: `moul-top-list`, class: `MoulTopList as TopList`, exported types (`TopListItem`).
  - Reactive properties: `data` (`TopListItem[]`), `max`, `valueFormatter`, `showRank` (boolean).
  - Layout: HTML list / cards with ranked items, label, formatted value, and horizontal proportional progress bar (`percentage = (item.value / maxValue) * 100`).
  - CSS tokens: progress bar fill styled with `item.color` or `getChartColor(idx)` or primary token.
  - Event contracts: clickable items dispatching `item-press` (`{ detail: { item: TopListItem, index: number } }`).
  - Accessibility: `role="list"`, `role="listitem"`, progress indicator `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax`.
  - Domain safeguards: empty data slot `<slot name="empty">`, 0 values, negative values, missing labels.

---

## 2. Logic Chain

1. **Architecture Migration from React/StyleX to Lit 3**:
   - `MoulTopList` extends `LitElement`, registered idempotently via `defineElement('moul-top-list', MoulTopList)`.
   - Styles are defined using Lit `css` with `resetStyles` included in `MoulTopList.styles = topListStyles`.
   - Removes `@stylexjs/stylex`, React `forwardRef`, `useMemo`, and banned dependencies.

2. **Properties Harmonization**:
   - `data`: `TopListItem[] = []` (`attribute: false`).
   - `max` & `maxValue`: Support both property `max` (attribute `max`) and legacy/alternative `maxValue` (attribute `max-value`).
   - `maxItems`: `number = 10` (attribute `max-items`). When positive, renders `this.data.slice(0, this.maxItems)`.
   - `showRank`: `boolean = false` (attribute `show-rank`, reflect `true`). When enabled, prepends a rank badge (`1`, `2`, `3`...).
   - `valueFormatter`: `((value: number) => string) | undefined` (`attribute: false`).
   - `multiColor`: `boolean = false` (attribute `multi-color`). When `true`, uses `getChartColor(index)`.
   - `barColor`: `string = 'var(--color-chart-1)'` (attribute `bar-color`).
   - `interactive`: `boolean = false` (attribute `interactive`, reflect `true`).

3. **Proportional Progress Bar Calculation & Safe Math**:
   - Clamped Item Value: `const clampedValue = Math.max(0, typeof item.value === 'number' && !Number.isNaN(item.value) ? item.value : 0)`.
   - Effective Maximum:
     - User-specified `max` / `maxValue` takes precedence if valid and > 0.
     - Otherwise, compute `Math.max(...positiveValues)`.
     - Fallback guard: clamp denominator to at least `1`. This guarantees no division by zero (`0 / 0 = NaN`) or `Infinity`.
   - Fill Percentage: `const percentage = Math.min(100, Math.max(0, (clampedValue / effectiveMax) * 100))`. Clamped strictly to `[0, 100]`.

4. **Color Hierarchy**:
   - `item.color` (item-specific override) -> `multiColor ? getChartColor(idx) : (barColor || 'var(--color-chart-1)')`.
   - Track color: `var(--color-neutral-200, light-dark(oklch(0.92 0 0), oklch(0.24 0 0)))`.

5. **Accessibility & ARIA Structure**:
   - Outer container: `<div class="container" part="container">`
   - List structure: `<ul class="list" role="list" part="list">`
   - Item row: `<li class="item" role="listitem" part="item">`
   - Progress bar track:
     `<div class="track" part="track" role="progressbar" aria-valuenow="${clampedValue}" aria-valuemin="0" aria-valuemax="${effectiveMax}" aria-label="${item.label}" aria-valuetext="${formattedValue}">`
   - Progress bar fill: `<div class="bar" part="bar" style="width: ${percentage}%; background-color: ${fill};"></div>`

6. **Event Dispatch & Interactivity**:
   - When clicked or triggered via keyboard (`Enter` or `Space`):
     Dispatches `item-press` with `CustomEvent('item-press', { detail: { item, index }, bubbles: true, composed: true, cancelable: true })`.
   - When `interactive` is true: adds `tabindex="0"`, `:hover` background `var(--color-bg-subtle)`, `:active` transform scale `0.995`, and accessible `:focus-visible` outline ring.

7. **Domain Safeguards & Edge Cases**:
   - Empty/Missing Data: Render `<div class="empty-state" part="empty"><slot name="empty"><p class="empty-message">No data available</p></slot></div>`.
   - Negative values: Value label renders negative string (e.g. `"-50"`), progress bar clamped to `0%`.
   - Value exceeding max: Clamped to `100%`.
   - Missing label: Fallback to `"Item ${idx + 1}"` to prevent displaying `undefined`.

8. **Micro-Motion**:
   - Staggered row entrance: `subtleAnimate(items, { transform: ['translateY(6px)', 'translateY(0px)'], opacity: [0, 1] }, { duration: 0.35, delay: stagger(0.03), ease: CHART_EASE })`.
   - Bar fill transition: CSS `transition: width 350ms cubic-bezier(0.22, 1, 0.36, 1)`.
   - Respects `prefersReducedMotion()`.

---

## 3. Caveats

- **`max` vs `maxValue` vs `maxItems`**:
  - `maxItems` limits the number of visible rows (e.g. top 5 items from a 50-item list).
  - `max` / `maxValue` specifies the progress scale denominator.
  - To support both legacy props and new contracts, the architecture supports both `max` and `maxValue`.
- **Keyboard navigation on List Items**:
  - Using `role="listitem"` with `tabindex="0"` allows items to be tabbed through in document order without violating list ARIA semantics. Pressing `Enter` or `Space` activates the item.
- **Empty State Slot**:
  - When custom content is placed in `<slot name="empty">`, it seamlessly replaces default text `"No data available"`.

---

## 4. Conclusion & Complete Implementation Blueprint

### 4.1 `ui/src/components/TopList/TopList.styles.ts`
```ts
import { type CSSResultGroup, css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const topListStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
    }

    .container {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
    }

    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
      width: 100%;
    }

    .item {
      display: grid;
      grid-template-columns: minmax(100px, 1.5fr) 2fr minmax(60px, auto);
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      padding: var(--spacing-1, 0.25rem) var(--spacing-2, 0.5rem);
      border-radius: var(--radius-md, 0.75rem);
      transition: background-color 150ms ease, transform 150ms ease;
      user-select: none;
      box-sizing: border-box;
    }

    :host([show-rank]) .item,
    .item.has-rank {
      grid-template-columns: 2rem minmax(100px, 1.5fr) 2fr minmax(60px, auto);
    }

    .item--interactive {
      cursor: pointer;
    }

    .item--interactive:hover {
      background-color: var(--color-bg-subtle, oklch(0.97 0 0));
    }

    .item--interactive:active {
      transform: scale(0.995);
      background-color: var(--color-neutral-200, oklch(0.92 0 0));
    }

    .item--interactive:focus-visible {
      outline: 2px solid var(--color-border-focus);
      outline-offset: 2px;
    }

    .rank {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg-subtle, oklch(0.42 0 0));
      text-align: center;
      font-variant-numeric: tabular-nums;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.5rem;
      height: 1.5rem;
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-bg-subtle, oklch(0.97 0 0));
    }

    .label {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg, inherit);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .track {
      height: 6px;
      background-color: var(--color-neutral-200, oklch(0.92 0 0));
      border-radius: var(--radius-full, 9999px);
      width: 100%;
      overflow: hidden;
      position: relative;
    }

    .bar {
      height: 100%;
      border-radius: var(--radius-full, 9999px);
      transition: width 350ms cubic-bezier(0.22, 1, 0.36, 1);
      min-width: 0;
      background-color: var(--color-chart-1);
    }

    .value {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg, inherit);
      text-align: end;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 120px;
      color: var(--color-fg-subtle, oklch(0.42 0 0));
      font-size: var(--font-size-sm, 0.875rem);
      padding: var(--spacing-4, 1rem);
      text-align: center;
    }

    .empty-message {
      margin: 0;
    }
  `,
]

export const styles = topListStyles
export default topListStyles
```

### 4.2 `ui/src/components/TopList/TopList.ts`
```ts
import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import {
  CHART_EASE,
  prefersReducedMotion,
  stagger,
  subtleAnimate,
} from '../../utils/motion'
import { getChartColor, type TopListItem } from '../ChartCommon'
import { topListStyles } from './TopList.styles'

export type { TopListItem }

export interface TopListProps {
  data?: TopListItem[]
  max?: number
  maxValue?: number
  maxItems?: number
  valueFormatter?: (value: number) => string
  showRank?: boolean
  multiColor?: boolean
  barColor?: string
  interactive?: boolean
}

export class MoulTopList extends LitElement {
  static override styles = topListStyles

  static override properties = {
    data: { attribute: false },
    max: { type: Number },
    maxValue: { type: Number, attribute: 'max-value' },
    maxItems: { type: Number, attribute: 'max-items' },
    valueFormatter: { attribute: false },
    showRank: { type: Boolean, attribute: 'show-rank', reflect: true },
    multiColor: { type: Boolean, attribute: 'multi-color' },
    barColor: { type: String, attribute: 'bar-color' },
    interactive: { type: Boolean, reflect: true },
  }

  declare data: TopListItem[]
  declare max?: number
  declare maxValue?: number
  declare maxItems: number
  declare valueFormatter?: (value: number) => string
  declare showRank: boolean
  declare multiColor: boolean
  declare barColor: string
  declare interactive: boolean

  constructor() {
    super()
    this.data = []
    this.max = undefined
    this.maxValue = undefined
    this.maxItems = 10
    this.valueFormatter = undefined
    this.showRank = false
    this.multiColor = false
    this.barColor = 'var(--color-chart-1)'
    this.interactive = false
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('data')) {
      this.animateEntrance()
    }
  }

  private animateEntrance(): void {
    if (prefersReducedMotion()) return

    const items = this.renderRoot?.querySelectorAll<HTMLElement>('.item')
    if (items && items.length > 0) {
      subtleAnimate(
        items,
        { transform: ['translateY(6px)', 'translateY(0px)'], opacity: [0, 1] },
        { duration: 0.35, delay: stagger(0.03), ease: CHART_EASE }
      )
    }
  }

  private handleItemPress(item: TopListItem, index: number): void {
    const event = new CustomEvent('item-press', {
      detail: { item, index },
      bubbles: true,
      composed: true,
      cancelable: true,
    })
    this.dispatchEvent(event)
  }

  private handleKeyDown(e: KeyboardEvent, item: TopListItem, index: number): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      this.handleItemPress(item, index)
    }
  }

  override render() {
    if (!this.data || this.data.length === 0) {
      return html`
        <div class="empty-state" part="empty">
          <slot name="empty">
            <p class="empty-message">No data available</p>
          </slot>
        </div>
      `
    }

    const items = this.maxItems > 0 ? this.data.slice(0, this.maxItems) : this.data

    if (items.length === 0) {
      return html`
        <div class="empty-state" part="empty">
          <slot name="empty">
            <p class="empty-message">No data available</p>
          </slot>
        </div>
      `
    }

    // Determine effective max
    const userMax = this.max ?? this.maxValue
    let computedMax = 1
    if (typeof userMax === 'number' && !Number.isNaN(userMax) && userMax > 0) {
      computedMax = userMax
    } else {
      const positiveValues = items
        .map((d) => (typeof d.value === 'number' && !Number.isNaN(d.value) ? d.value : 0))
        .filter((v) => v > 0)
      computedMax = positiveValues.length > 0 ? Math.max(...positiveValues) : 1
    }

    return html`
      <div class="container" part="container">
        <ul class="list" role="list" part="list">
          ${items.map((item, idx) => {
            const rawValue = typeof item.value === 'number' && !Number.isNaN(item.value) ? item.value : 0
            const clampedValue = Math.max(0, rawValue)
            const percentage = Math.min(100, Math.max(0, (clampedValue / computedMax) * 100))

            const fill = item.color
              ? item.color
              : this.multiColor
                ? getChartColor(idx)
                : this.barColor || 'var(--color-chart-1)'

            const formattedValue = this.valueFormatter
              ? this.valueFormatter(rawValue)
              : rawValue.toLocaleString()

            const labelText = item.label || `Item ${idx + 1}`

            return html`
              <li
                class="item ${this.showRank ? 'has-rank' : ''} ${this.interactive ? 'item--interactive' : ''}"
                role="listitem"
                part="item"
                data-index="${idx}"
                tabindex="${this.interactive ? 0 : -1}"
                @click="${() => this.handleItemPress(item, idx)}"
                @keydown="${(e: KeyboardEvent) => this.handleKeyDown(e, item, idx)}"
              >
                ${this.showRank ? html`<span class="rank" part="rank">${idx + 1}</span>` : ''}

                <span class="label" part="label" title="${labelText}">
                  ${labelText}
                </span>

                <div
                  class="track"
                  part="track"
                  role="progressbar"
                  aria-valuenow="${clampedValue}"
                  aria-valuemin="0"
                  aria-valuemax="${computedMax}"
                  aria-label="${labelText}"
                  aria-valuetext="${formattedValue}"
                >
                  <div
                    class="bar"
                    part="bar"
                    style="width: ${percentage}%; background-color: ${fill};"
                  ></div>
                </div>

                <span class="value" part="value">${formattedValue}</span>
              </li>
            `
          })}
        </ul>
      </div>
    `
  }
}

defineElement('moul-top-list', MoulTopList)

export { MoulTopList as TopList }

declare global {
  interface HTMLElementTagNameMap {
    'moul-top-list': MoulTopList
  }
}
```

### 4.3 `ui/src/components/TopList/index.ts`
```ts
export type { TopListItem, TopListProps } from './TopList'
export { MoulTopList, MoulTopList as TopList } from './TopList'
```

### 4.4 `ui/src/index.ts` Updates
```ts
export type { TopListItem, TopListProps } from './components/TopList'
export { MoulTopList, MoulTopList as TopList } from './components/TopList'
```

### 4.5 Recommended Test Suite Cases (`ui/src/components/Charts.test.ts`)
```ts
describe('MoulTopList (`moul-top-list`)', () => {
  const sampleData: TopListItem[] = [
    { label: 'United States', value: 4500 },
    { label: 'Germany', value: 2800 },
    { label: 'Japan', value: 1900 },
    { label: 'United Kingdom', value: 1200 },
    { label: 'France', value: 800 },
  ]

  it('CHART-TOP-01: Custom Element registration and HTMLElementTagNameMap contract', () => {
    const ctor = customElements.get('moul-top-list')
    expect(ctor).toBeDefined()
    const instance = document.createElement('moul-top-list')
    expect(instance).toBeInstanceOf(MoulTopList)
  })

  it('CHART-TOP-02: Renders list of ranked items with labels, tracks, bars, and formatted values', async () => {
    const el = await mount<MoulTopList>(html`
      <moul-top-list .data=${sampleData}></moul-top-list>
    `)
    const items = el.shadowRoot?.querySelectorAll('.item')
    expect(items?.length).toBe(5)
    expect(items?.[0].querySelector('.label')?.textContent?.trim()).toBe('United States')
    expect(items?.[0].querySelector('.value')?.textContent?.trim()).toBe('4,500')
  })

  it('CHART-TOP-03: Auto-calculates proportional bar widths based on maximum data value', async () => {
    const el = await mount<MoulTopList>(html`
      <moul-top-list .data=${sampleData}></moul-top-list>
    `)
    const bars = el.shadowRoot?.querySelectorAll<HTMLElement>('.bar')
    // Max is 4500
    // US: 4500 / 4500 = 100%
    expect(bars?.[0].style.width).toBe('100%')
    // Germany: 2800 / 4500 = 62.222...%
    const expectedGermany = (2800 / 4500) * 100
    expect(parseFloat(bars?.[1].style.width || '0')).toBeCloseTo(expectedGermany, 1)
  })

  it('CHART-TOP-04: Explicit max or maxValue scales bar widths proportionally', async () => {
    const el = await mount<MoulTopList>(html`
      <moul-top-list .data=${sampleData} .max=${9000}></moul-top-list>
    `)
    const bars = el.shadowRoot?.querySelectorAll<HTMLElement>('.bar')
    // US: 4500 / 9000 = 50%
    expect(bars?.[0].style.width).toBe('50%')
  })

  it('CHART-TOP-05: max-items limits rendered rows count', async () => {
    const el = await mount<MoulTopList>(html`
      <moul-top-list .data=${sampleData} .maxItems=${3}></moul-top-list>
    `)
    const items = el.shadowRoot?.querySelectorAll('.item')
    expect(items?.length).toBe(3)
  })

  it('CHART-TOP-06: show-rank displays 1-based numerical badges', async () => {
    const el = await mount<MoulTopList>(html`
      <moul-top-list .data=${sampleData} show-rank></moul-top-list>
    `)
    const ranks = el.shadowRoot?.querySelectorAll('.rank')
    expect(ranks?.length).toBe(5)
    expect(ranks?.[0].textContent?.trim()).toBe('1')
    expect(ranks?.[1].textContent?.trim()).toBe('2')
    expect(ranks?.[4].textContent?.trim()).toBe('5')
  })

  it('CHART-TOP-07: multi-color cycles getChartColor while item.color overrides', async () => {
    const customData: TopListItem[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 50, color: '#ff0000' },
      { label: 'C', value: 20 },
    ]
    const el = await mount<MoulTopList>(html`
      <moul-top-list .data=${customData} multi-color></moul-top-list>
    `)
    const bars = el.shadowRoot?.querySelectorAll<HTMLElement>('.bar')
    expect(bars?.[0].style.backgroundColor).toContain('var(--color-chart-1)')
    expect(bars?.[1].style.backgroundColor).toBe('rgb(255, 0, 0)') // #ff0000
    expect(bars?.[2].style.backgroundColor).toContain('var(--color-chart-3)')
  })

  it('CHART-TOP-08: custom valueFormatter formats displayed values and ARIA text', async () => {
    const el = await mount<MoulTopList>(html`
      <moul-top-list
        .data=${sampleData}
        .valueFormatter=${(v: number) => `$${v / 1000}k`}
      ></moul-top-list>
    `)
    const valueEl = el.shadowRoot?.querySelector('.value')
    expect(valueEl?.textContent?.trim()).toBe('$4.5k')
    const track = el.shadowRoot?.querySelector('.track')
    expect(track?.getAttribute('aria-valuetext')).toBe('$4.5k')
  })

  it('CHART-TOP-09: item-press event dispatched on click and Enter/Space keyboard activation', async () => {
    const el = await mount<MoulTopList>(html`
      <moul-top-list .data=${sampleData} interactive></moul-top-list>
    `)
    const spy = vi.fn()
    el.addEventListener('item-press', spy)

    const firstItem = el.shadowRoot?.querySelector<HTMLElement>('.item')
    firstItem?.click()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].detail).toEqual({
      item: sampleData[0],
      index: 0,
    })

    // Keyboard trigger (Enter key)
    firstItem?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(spy).toHaveBeenCalledTimes(2)

    // Keyboard trigger (Space key)
    firstItem?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    expect(spy).toHaveBeenCalledTimes(3)
  })

  it('CHART-TOP-10: Accessible ARIA roles (list, listitem, progressbar, values)', async () => {
    const el = await mount<MoulTopList>(html`
      <moul-top-list .data=${sampleData}></moul-top-list>
    `)
    const list = el.shadowRoot?.querySelector('ul')
    expect(list?.getAttribute('role')).toBe('list')

    const items = el.shadowRoot?.querySelectorAll('li')
    expect(items?.[0].getAttribute('role')).toBe('listitem')

    const track = el.shadowRoot?.querySelector('.track')
    expect(track?.getAttribute('role')).toBe('progressbar')
    expect(track?.getAttribute('aria-valuenow')).toBe('4500')
    expect(track?.getAttribute('aria-valuemin')).toBe('0')
    expect(track?.getAttribute('aria-valuemax')).toBe('4500')
    expect(track?.getAttribute('aria-label')).toBe('United States')
  })

  it('CHART-TOP-11: Edge cases: empty data slot, 0 max, negative values, and missing label', async () => {
    // 1. Empty data renders empty slot
    const emptyEl = await mount<MoulTopList>(html`
      <moul-top-list .data=${[]}>
        <div slot="empty" id="custom-empty">Empty Dashboard</div>
      </moul-top-list>
    `)
    expect(emptyEl.shadowRoot?.querySelector('slot[name="empty"]')).toBeTruthy()
    expect(emptyEl.shadowRoot?.querySelectorAll('.item').length).toBe(0)

    // 2. All zero values
    const zeroEl = await mount<MoulTopList>(html`
      <moul-top-list .data=${[{ label: 'Zero', value: 0 }]}></moul-top-list>
    `)
    const zeroBar = zeroEl.shadowRoot?.querySelector<HTMLElement>('.bar')
    expect(zeroBar?.style.width).toBe('0%')

    // 3. Negative values
    const negEl = await mount<MoulTopList>(html`
      <moul-top-list .data=${[{ label: 'Loss', value: -100 }]}></moul-top-list>
    `)
    const negBar = negEl.shadowRoot?.querySelector<HTMLElement>('.bar')
    expect(negBar?.style.width).toBe('0%')
    expect(negEl.shadowRoot?.querySelector('.value')?.textContent?.trim()).toBe('-100')

    // 4. Missing label
    const missingLabelEl = await mount<MoulTopList>(html`
      <moul-top-list .data=${[{ value: 50 } as any]}></moul-top-list>
    `)
    expect(missingLabelEl.shadowRoot?.querySelector('.label')?.textContent?.trim()).toBe('Item 1')
  })
})
```

---

## 5. Verification Method

1. **Unit & Integration Test Execution**:
   Run Vitest test suite on `Charts.test.ts`:
   ```bash
   ./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts
   ```
   *Expected outcome*: All 41 existing tests + new 11 TopList tests pass (52/52 passing).

2. **Zero-React Dependency Guard**:
   Run the verification CLI:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected outcome*: Exits with code 0 (`Zero disallowed React/legacy packages found`).

3. **Biome Linting & Formatting**:
   Run lint check on component folder:
   ```bash
   node node_modules/.bin/biome check ui/src/components/TopList
   ```
   *Expected outcome*: 0 errors, 0 warnings.

4. **Build Verification**:
   Build the UI package:
   ```bash
   bun --cwd ui build
   ```
   *Expected outcome*: Vite compiles `dist/moul-ui.js` and `dist/src/index.d.ts` without errors.

5. **Invalidation Conditions**:
   - Any React, StyleX, or Recharts import in `TopList.ts` or `TopList.styles.ts`.
   - Progress bar fill failing to clamp to `[0, 100]`.
   - Division by zero producing `NaN` in CSS width when data values are 0 or empty.
   - Missing `item-press` custom event or incorrect detail payload.
   - Missing ARIA `role="list"`, `role="listitem"`, or `role="progressbar"`.
