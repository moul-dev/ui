# Handoff Report: Milestone 1 Test Plan (`moul-chart-container` & `moul-chart-tooltip`)

**Agent**: `explorer_m1_3`  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_3`  
**Milestone**: Milestone 1 — Chart Container, Tooltip & Common Helpers Test Plan  
**Target File**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_3/handoff.md`  
**Date**: 2026-10-17  

---

## 1. Observation

### 1.1 Existing Test Harness & Browser Shims (`ui/src/test-setup.ts`)

Direct examination of `ui/src/test-setup.ts` reveals key browser shims and test harness utilities:

1. **Native Popover API Shim** (lines 376–441):
   ```typescript
   HtmlElementClass.prototype.showPopover = function (this: HTMLElement): void {
     if (this.getAttribute('popover') === null) {
       throw new DOMException(
         "Failed to execute 'showPopover' on 'HTMLElement': Element does not have a 'popover' attribute.",
         'InvalidStateError',
       )
     }
     if (!this.isConnected) {
       throw new DOMException(
         "Failed to execute 'showPopover' on 'HTMLElement': The element is not in a Document.",
         'InvalidStateError',
       )
     }
     const isOpen =
       this.hasAttribute(':popover-open') ||
       this.classList.contains(':popover-open')
     if (isOpen) return
     ...
     this.setAttribute(':popover-open', '')
     this.classList.add(':popover-open')
     ...
   }
   ```
   - Calling `showPopover()` throws a `DOMException` with `InvalidStateError` if `popover` attribute is absent or if the element is not connected to the document.
   - Popover visibility is tracked via `:popover-open` attribute and class; queried via `element.matches(':popover-open')`.
   - `hidePopover()` removes `:popover-open`.

2. **Deterministic `ResizeObserver` Controller** (lines 485–617):
   ```typescript
   export function triggerResize(
     element: Element,
     options: TriggerResizeOptions,
   ): void {
     const width = options.width
     const height = options.height ?? 0
     ...
     const entry: ResizeObserverEntry = {
       target: element,
       contentRect: contentRect as DOMRectReadOnly,
       borderBoxSize: Object.freeze([{ inlineSize: width, blockSize: height }]),
       contentBoxSize: Object.freeze([{ inlineSize: width, blockSize: height }]),
       ...
     }
     for (const record of activeObservers) {
       if (record.observedElements.has(element)) {
         record.callback([entry], record.observer)
       }
     }
   }
   ```
   - Synchronously updates `element.getBoundingClientRect()` and executes the registered observer callbacks.
   - Exported as `triggerResize` from `../test-setup` and globally exposed as `window.__triggerResize`.

### 1.2 Testing Patterns in `Overlays.test.ts` & `Surfaces.test.ts`

Direct examination of `ui/src/components/Overlays.test.ts` and `ui/src/components/Surfaces.test.ts` reveals the established testing pattern:

1. **Mounting & Update Synchronization** (`Overlays.test.ts` lines 20–42):
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

   async function mount<T extends HTMLElement>(template: unknown): Promise<T> {
     const container = document.createElement('div')
     document.body.appendChild(container)
     render(template, container)
     const element = container.firstElementChild as T
     await awaitNestedUpdates(element)
     return element
   }
   ```

2. **Teardown & Cleanup** (`Overlays.test.ts` lines 69–73):
   ```typescript
   afterEach(() => {
     document.body.innerHTML = ''
     vi.restoreAllMocks()
     vi.useRealTimers()
   })
   ```

3. **Popover Assertion Pattern** (`Overlays.test.ts` lines 248–272):
   ```typescript
   expect(popover.isOpen).toBe(false)
   // Trigger open
   triggerWrapper?.click()
   await awaitNestedUpdates(popover)
   expect(popover.isOpen).toBe(true)
   expect(innerPopover?.matches(':popover-open')).toBe(true)
   // Close
   await popover.setOpen(false)
   await awaitNestedUpdates(popover)
   expect(popover.isOpen).toBe(false)
   ```

4. **Empty State & Slot Inspection Pattern** (`Surfaces.test.ts` lines 306–336):
   ```typescript
   expect(emptyState.shadowRoot?.querySelector('[part="title"] slot[name="title"]')).toBeTruthy()
   expect(emptyState.shadowRoot?.querySelector('[part="description"]')).toBeTruthy()
   ```

### 1.3 Breakpoint Computation in `LayoutIndicatorController` (`ui/src/controllers/layout-indicator.controller.ts`)

Lines 18–24 define the breakpoint logic:
```typescript
export function computeBreakpoint(width: number): Breakpoint {
  if (!Number.isFinite(width) || width < 480) return 'xs'
  if (width < 768) return 'sm'
  if (width < 1024) return 'md'
  if (width < 1280) return 'lg'
  return 'xl'
}
```
For `width: 600`, `computeBreakpoint(600)` yields `'sm'` (since `480 <= 600 < 768`).

### 1.4 Specification & Contract for Milestone 1

From `PROJECT.md` (lines 43–78) and `ORIGINAL_REQUEST.md`:
1. `moul-chart-container`:
   - Properties: `title: string = ''`, `description: string = ''`, `height: number = 300`, `isEmpty: boolean = false` (`is-empty`)
   - Uses `LayoutIndicatorController` with `observeDimensions: true`.
   - Slots: default, `header`, `empty`, `legend`.
   - Event: `viewport-resize` with `{ detail: { width: number, height: number, breakpoint: string } }`.
2. `moul-chart-tooltip`:
   - Properties: `label: string = ''`, `value: string = ''`, `color: string = 'var(--color-chart-1)'`, `isOpen: boolean = false` (`is-open`), `x: number = 0`, `y: number = 0`.
   - Uses native Popover API (`popover="manual"`) and `OverlayPresenceController`.
   - Methods: `show(...)` or `showPopover()`, `hide()` or `hidePopover()`.
3. `ChartCommon.ts`:
   - Helper `getChartColor(index: number): string` returns `var(--color-chart-1)` through `var(--color-chart-8)` with modulo 8 wrapping.
   - Exported interfaces: `ChartSeries`, `DoughnutDataItem`, `TopListItem`, `PointHoverDetail`.

---

## 2. Logic Chain

1. **Test Environment Compatibility**:
   - Because `test-setup.ts` enforces `popover` attribute presence and `this.isConnected` before allowing `showPopover()` to succeed (Observation 1.1), `moul-chart-tooltip` tests must always mount the element to `document.body` via `mount()` and ensure `popover="manual"` is configured on the host or its popover container.
2. **Deterministic Resizing Mechanism**:
   - `LayoutIndicatorController` adds a `ResizeObserver` on `hostConnected()`.
   - Invoking `triggerResize(container, { width: 600, height: 300 })` immediately invokes the registered observer callback with `entry.contentRect` having `width: 600, height: 300`.
   - `LayoutIndicatorController` calculates `nextBp = computeBreakpoint(600)` which evaluates to `'sm'` (Observation 1.3).
   - `MoulChartContainer` intercepts dimension changes and dispatches the `viewport-resize` event with `{ width: 600, height: 300, breakpoint: 'sm' }`.
3. **Empty State Conditional Rendering**:
   - When `container.isEmpty = true` or `is-empty` attribute is set, `MoulChartContainer` renders `<slot name="empty">` and hides the default visualization slot or SVG container.
   - When `isEmpty = false`, `<slot name="empty">` is unmounted/hidden and default `<slot>` is active.
4. **Tooltip Lifecycle & Positioning**:
   - Initially, `isOpen = false` and `:popover-open` is absent.
   - Calling `show({ label: 'Revenue', value: '$120K', color: 'var(--color-chart-3)', x: 150, y: 80 })`:
     - Updates `isOpen` to `true`.
     - Adds `:popover-open` to the popover element.
     - Renders indicator swatch with `var(--color-chart-3)`, label text `'Revenue'`, and value text `'$120K'`.
     - Updates styling positions to `150px` / `80px` (via inline style `left`/`top` or `transform`).
   - Calling `hide()` or `hidePopover()` removes `:popover-open` and reverts `isOpen` to `false`.
5. **Color Indexing & Modulo 8 Math**:
   - CSS tokens define 8 chart colors: `--color-chart-1` through `--color-chart-8`.
   - `getChartColor(index)` must map:
     - 0 -> `--color-chart-1`
     - 1 -> `--color-chart-2`
     - 7 -> `--color-chart-8`
     - 8 -> `--color-chart-1` (wrapping)
     - Using standard modulo arithmetic: `((index % 8) + 8) % 8 + 1` handles both positive and negative integer indices.

---

## 3. Caveats

1. **Happy-DOM Element Geometry**:
   - Happy-DOM does not compute actual bounding box dimensions via `getBBox()` or `getBoundingClientRect()` from CSS layout. All dimension tests must rely on `triggerResize(element, { width, height })` which explicitly injects mock `DOMRect` values.
2. **Reduced Motion & Async Transitions**:
   - `OverlayPresenceController` applies entrance/exit transitions with `motion`. In tests, `await awaitNestedUpdates(element)` ensures Lit has finished rendering DOM updates. To avoid timer flakiness, animations should be tested with immediate settlement or `await element.updateComplete`.
3. **Scope Boundary**:
   - Milestone 1 encompasses `ChartCommon.ts`, `MoulChartContainer`, and `MoulChartTooltip`. Actual SVG geometry path generation (Line, Area, Bar, Doughnut) is scheduled for Milestones 2–3 and should not be asserted in Milestone 1 test suites.

---

## 4. Conclusion & Complete Milestone 1 Test Plan

The Milestone 1 test suite comprises 16 specific unit and integration tests across 4 suites:

### 4.1 Test Case Matrix

| ID | Component | Description | Assertion Criteria |
|---|---|---|---|
| `CHART-COM-01` | `ChartCommon` | Base palette mapping (indices 0 to 7) | `getChartColor(i)` equals `'var(--color-chart-${i + 1})'` for `i` in `[0, 7]` |
| `CHART-COM-02` | `ChartCommon` | Modulo 8 wrapping | `getChartColor(8)` -> `'var(--color-chart-1)'`; `getChartColor(15)` -> `'var(--color-chart-8)'` |
| `CHART-COM-03` | `ChartCommon` | Negative & arbitrary integers (property test) | Property test with `fast-check`: any integer wraps correctly to `--color-chart-1..8` |
| `CHART-COM-04` | `ChartCommon` | Exported interfaces contract | Type verification of `ChartSeries`, `DoughnutDataItem`, `TopListItem`, `PointHoverDetail` |
| `CHART-CNT-01` | `MoulChartContainer` | Custom Element registration & instance | `customElements.get('moul-chart-container')` returns ctor; `document.createElement` is `MoulChartContainer` |
| `CHART-CNT-02` | `MoulChartContainer` | Title & description rendering | Renders `title` and `description` text in shadow DOM; updates on property change |
| `CHART-CNT-03` | `MoulChartContainer` | Slotted content & structure | Renders default `<slot>` for chart body, `<slot name="header">`, and `<slot name="legend">` |
| `CHART-CNT-04` | `MoulChartContainer` | Empty state with `is-empty` attribute | When `is-empty` is set, renders `<slot name="empty">` and hides default chart viewport |
| `CHART-CNT-05` | `MoulChartContainer` | Deterministic resize to 600x300 | `triggerResize(container, { width: 600, height: 300 })` dispatches `viewport-resize` with `{ width: 600, height: 300, breakpoint: 'sm' }` |
| `CHART-CNT-06` | `MoulChartContainer` | Multi-breakpoint resize sequence | Sequential resize tests for `xs` (320px), `md` (800px), `lg` (1100px), and `xl` (1440px) |
| `CHART-CNT-07` | `MoulChartContainer` | Observer disconnect on removal | `container.remove()` cleans up `ResizeObserver`; subsequent resizes do not emit |
| `CHART-TLP-01` | `MoulChartTooltip` | Custom Element registration & instance | `customElements.get('moul-chart-tooltip')` returns ctor; `document.createElement` is `MoulChartTooltip` |
| `CHART-TLP-02` | `MoulChartTooltip` | Initial closed state | `isOpen` is `false`; host/popover element has `popover="manual"`; `:popover-open` false |
| `CHART-TLP-03` | `MoulChartTooltip` | Calling `show(...)` or `showPopover()` | Sets `isOpen = true`, `:popover-open` is true; renders series color, label, and value |
| `CHART-TLP-04` | `MoulChartTooltip` | Positioning style updates (`x`, `y`) | Updates style coordinates (`left`/`top` or `transform`) matching specified `x` and `y` |
| `CHART-TLP-05` | `MoulChartTooltip` | Calling `hide()` or `hidePopover()` | Sets `isOpen = false`, removes `:popover-open`, closes popover cleanly |
| `CHART-INT-01` | Integration | Slotted Tooltip in Container | Mounting `<moul-chart-tooltip>` inside `<moul-chart-container>` operates without conflict during resize and hover |

---

### 4.2 Complete Executable Test Suite Implementation

The implementer can drop the following test suite into `ui/src/components/Charts.test.ts` (or `ui/src/components/ChartContainer/ChartContainer.test.ts` & `ui/src/components/ChartTooltip/ChartTooltip.test.ts`):

```typescript
import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  type ChartSeries,
  type DoughnutDataItem,
  getChartColor,
  type PointHoverDetail,
  type TopListItem,
} from './ChartCommon'
import './ChartContainer/ChartContainer'
import './ChartTooltip/ChartTooltip'
import { triggerResize } from '../test-setup'
import type { MoulChartContainer } from './ChartContainer/ChartContainer'
import type { MoulChartTooltip } from './ChartTooltip/ChartTooltip'

// Universal Lit nested updates awaiter
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

// Universal DOM mounting helper
async function mount<T extends HTMLElement>(template: unknown): Promise<T> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  render(template, container)
  const element = container.firstElementChild as T
  await awaitNestedUpdates(element)
  return element
}

describe('Milestone 1: Chart Foundation & Tooltip Test Suite', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  // ===========================================================================
  // 1. ChartCommon Utilities & Contracts
  // ===========================================================================
  describe('ChartCommon Utilities (`ChartCommon.ts`)', () => {
    it('CHART-COM-01: Base palette mapping (indices 0 to 7)', () => {
      expect(getChartColor(0)).toBe('var(--color-chart-1)')
      expect(getChartColor(1)).toBe('var(--color-chart-2)')
      expect(getChartColor(2)).toBe('var(--color-chart-3)')
      expect(getChartColor(3)).toBe('var(--color-chart-4)')
      expect(getChartColor(4)).toBe('var(--color-chart-5)')
      expect(getChartColor(5)).toBe('var(--color-chart-6)')
      expect(getChartColor(6)).toBe('var(--color-chart-7)')
      expect(getChartColor(7)).toBe('var(--color-chart-8)')
    })

    it('CHART-COM-02: Modulo 8 wrapping for indices >= 8', () => {
      expect(getChartColor(8)).toBe('var(--color-chart-1)')
      expect(getChartColor(9)).toBe('var(--color-chart-2)')
      expect(getChartColor(15)).toBe('var(--color-chart-8)')
      expect(getChartColor(16)).toBe('var(--color-chart-1)')
      expect(getChartColor(23)).toBe('var(--color-chart-8)')
      expect(getChartColor(24)).toBe('var(--color-chart-1)')
    })

    it('CHART-COM-03: Arbitrary integer and negative index wrapping via fast-check', () => {
      fc.assert(
        fc.property(fc.integer({ min: -10000, max: 10000 }), (index) => {
          const color = getChartColor(index)
          const expectedNumber = (((index % 8) + 8) % 8) + 1
          expect(color).toBe(`var(--color-chart-${expectedNumber})`)
        }),
      )
    })

    it('CHART-COM-04: Interface contracts compile and conform to data structures', () => {
      const series: ChartSeries = {
        key: 'revenue',
        name: 'Gross Revenue',
        color: 'var(--color-chart-1)',
        strokeWidth: 2,
      }
      expect(series.key).toBe('revenue')

      const doughnutItem: DoughnutDataItem = {
        name: 'Desktop',
        value: 450,
        color: 'var(--color-chart-2)',
      }
      expect(doughnutItem.value).toBe(450)

      const topListItem: TopListItem = {
        label: 'Product A',
        value: 1200,
        color: 'var(--color-chart-3)',
      }
      expect(topListItem.label).toBe('Product A')

      const hoverDetail: PointHoverDetail = {
        point: { x: 10, y: 20 },
        series,
        value: 1200,
        label: 'Q1',
        x: 100,
        y: 200,
      }
      expect(hoverDetail.value).toBe(1200)
    })
  })

  // ===========================================================================
  // 2. MoulChartContainer (`moul-chart-container`)
  // ===========================================================================
  describe('MoulChartContainer (`moul-chart-container`)', () => {
    it('CHART-CNT-01: Custom Element registration and instance check', () => {
      const ctor = customElements.get('moul-chart-container')
      expect(ctor).toBeDefined()

      const container = document.createElement('moul-chart-container')
      expect(container).toBeInstanceOf(ctor!)
    })

    it('CHART-CNT-02: Title and description rendering and reactive update', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container
          title="Sales Overview"
          description="Quarterly revenue metrics"
        >
          <div id="chart-content">Chart Body</div>
        </moul-chart-container>
      `)

      expect(container.title).toBe('Sales Overview')
      expect(container.description).toBe('Quarterly revenue metrics')

      const titleEl = container.shadowRoot?.querySelector('[part="title"]')
      const descEl = container.shadowRoot?.querySelector('[part="description"]')
      expect(titleEl?.textContent).toContain('Sales Overview')
      expect(descEl?.textContent).toContain('Quarterly revenue metrics')

      // Reactive update
      container.title = 'Updated Sales'
      container.description = 'Updated Description'
      await container.updateComplete

      expect(titleEl?.textContent).toContain('Updated Sales')
      expect(descEl?.textContent).toContain('Updated Description')
    })

    it('CHART-CNT-03: Slotted content and layout structure', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container>
          <div slot="header" id="custom-header">Custom Header</div>
          <div id="main-chart">Main Chart Content</div>
          <div slot="legend" id="custom-legend">Legend Content</div>
        </moul-chart-container>
      `)

      const headerSlot = container.shadowRoot?.querySelector('slot[name="header"]')
      const defaultSlot = container.shadowRoot?.querySelector('slot:not([name])')
      const legendSlot = container.shadowRoot?.querySelector('slot[name="legend"]')

      expect(headerSlot).toBeTruthy()
      expect(defaultSlot).toBeTruthy()
      expect(legendSlot).toBeTruthy()
    })

    it('CHART-CNT-04: Empty state rendering when is-empty is set', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container is-empty>
          <div id="chart-geom">Hidden Chart Geometries</div>
          <div slot="empty" id="custom-empty-msg">No Data Available</div>
        </moul-chart-container>
      `)

      expect(container.hasAttribute('is-empty')).toBe(true)
      expect(container.isEmpty).toBe(true)

      const emptySlot = container.shadowRoot?.querySelector('slot[name="empty"]')
      expect(emptySlot).toBeTruthy()

      // Toggle off empty state
      container.isEmpty = false
      await container.updateComplete
      expect(container.hasAttribute('is-empty')).toBe(false)
    })

    it('CHART-CNT-05: Deterministic resize to 600x300 and viewport-resize event detail', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      let resizeEventDetail: { width: number; height: number; breakpoint: string } | null = null
      container.addEventListener('viewport-resize', (e: Event) => {
        resizeEventDetail = (e as CustomEvent).detail
      })

      // Trigger deterministic resize
      triggerResize(container, { width: 600, height: 300 })
      await awaitNestedUpdates(container)

      expect(resizeEventDetail).not.toBeNull()
      expect(resizeEventDetail!.width).toBe(600)
      expect(resizeEventDetail!.height).toBe(300)
      expect(resizeEventDetail!.breakpoint).toBe('sm') // 480 <= width < 768 is 'sm'
    })

    it('CHART-CNT-06: Breakpoint transitions across all supported widths', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      const recordedBreakpoints: string[] = []
      container.addEventListener('viewport-resize', (e: Event) => {
        recordedBreakpoints.push((e as CustomEvent).detail.breakpoint)
      })

      triggerResize(container, { width: 320, height: 200 }) // xs (<480)
      await awaitNestedUpdates(container)

      triggerResize(container, { width: 800, height: 400 }) // md (768-1023)
      await awaitNestedUpdates(container)

      triggerResize(container, { width: 1100, height: 500 }) // lg (1024-1279)
      await awaitNestedUpdates(container)

      triggerResize(container, { width: 1440, height: 600 }) // xl (>=1280)
      await awaitNestedUpdates(container)

      expect(recordedBreakpoints).toEqual(['xs', 'md', 'lg', 'xl'])
    })

    it('CHART-CNT-07: Observer disconnects cleanly when element is removed', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      let callCount = 0
      container.addEventListener('viewport-resize', () => {
        callCount++
      })

      triggerResize(container, { width: 500, height: 300 })
      await awaitNestedUpdates(container)
      expect(callCount).toBe(1)

      // Remove from document
      container.remove()

      // Subsequent resize must not dispatch events
      triggerResize(container, { width: 900, height: 450 })
      await awaitNestedUpdates(container)
      expect(callCount).toBe(1)
    })
  })

  // ===========================================================================
  // 3. MoulChartTooltip (`moul-chart-tooltip`)
  // ===========================================================================
  describe('MoulChartTooltip (`moul-chart-tooltip`)', () => {
    it('CHART-TLP-01: Custom Element registration and instance check', () => {
      const ctor = customElements.get('moul-chart-tooltip')
      expect(ctor).toBeDefined()

      const tooltip = document.createElement('moul-chart-tooltip')
      expect(tooltip).toBeInstanceOf(ctor!)
    })

    it('CHART-TLP-02: Initial closed state and popover="manual" configuration', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      expect(tooltip.isOpen).toBe(false)
      const popoverEl = tooltip.popoverEl ?? tooltip
      expect(popoverEl.getAttribute('popover')).toBe('manual')
      expect(popoverEl.matches(':popover-open')).toBe(false)
    })

    it('CHART-TLP-03: Calling show(...) opens popover and renders indicator, label, and value', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      tooltip.show({
        label: 'March 2026',
        value: '$82,500',
        color: 'var(--color-chart-3)',
        x: 180,
        y: 95,
      })
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isOpen).toBe(true)
      const popoverEl = tooltip.popoverEl ?? tooltip
      expect(popoverEl.matches(':popover-open')).toBe(true)

      const labelEl = tooltip.shadowRoot?.querySelector('[part="label"]')
      const valueEl = tooltip.shadowRoot?.querySelector('[part="value"]')
      const indicatorEl = tooltip.shadowRoot?.querySelector('[part="indicator"]')

      expect(labelEl?.textContent).toContain('March 2026')
      expect(valueEl?.textContent).toContain('$82,500')
      expect(indicatorEl?.getAttribute('style')).toContain('var(--color-chart-3)')
    })

    it('CHART-TLP-04: Coordinate positioning updates inline coordinates', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      tooltip.show({
        label: 'Point A',
        value: '100',
        x: 120,
        y: 65,
      })
      await awaitNestedUpdates(tooltip)

      const popoverEl = tooltip.popoverEl ?? tooltip
      const styleAttr = popoverEl.getAttribute('style') ?? ''
      // Coordinates can be applied via top/left or transform
      const hasLeftTop = styleAttr.includes('120px') && styleAttr.includes('65px')
      const hasTransform =
        popoverEl.style.transform.includes('120px') && popoverEl.style.transform.includes('65px')
      expect(hasLeftTop || hasTransform).toBe(true)

      // Reposition dynamically
      tooltip.show({
        label: 'Point B',
        value: '200',
        x: 240,
        y: 130,
      })
      await awaitNestedUpdates(tooltip)

      const updatedStyle = popoverEl.getAttribute('style') ?? ''
      const updatedLeftTop = updatedStyle.includes('240px') && updatedStyle.includes('130px')
      const updatedTransform =
        popoverEl.style.transform.includes('240px') && popoverEl.style.transform.includes('130px')
      expect(updatedLeftTop || updatedTransform).toBe(true)
    })

    it('CHART-TLP-05: Calling hide() or hidePopover() closes the popover', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      tooltip.show({ label: 'Item', value: '42', x: 50, y: 50 })
      await awaitNestedUpdates(tooltip)
      expect(tooltip.isOpen).toBe(true)

      tooltip.hide()
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isOpen).toBe(false)
      const popoverEl = tooltip.popoverEl ?? tooltip
      expect(popoverEl.matches(':popover-open')).toBe(false)
    })
  })

  // ===========================================================================
  // 4. Integration Test: Container + Tooltip Slotted Collaboration
  // ===========================================================================
  describe('Integration: Container & Tooltip Collaboration', () => {
    it('CHART-INT-01: Slotted tooltip inside chart container maintains state during viewport resizes', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container title="Integrated Dashboard">
          <div id="chart-viewport" style="position: relative; width: 600px; height: 300px;">
            <moul-chart-tooltip id="tooltip-instance"></moul-chart-tooltip>
          </div>
        </moul-chart-container>
      `)

      const tooltip = container.querySelector<MoulChartTooltip>('#tooltip-instance')!
      expect(tooltip).toBeTruthy()
      expect(tooltip.isOpen).toBe(false)

      // Open tooltip
      tooltip.show({ label: 'Integration Point', value: '999', color: 'var(--color-chart-1)', x: 100, y: 150 })
      await awaitNestedUpdates(container)
      expect(tooltip.isOpen).toBe(true)

      // Resize container
      let resizeEmitted = false
      container.addEventListener('viewport-resize', () => {
        resizeEmitted = true
      })
      triggerResize(container, { width: 800, height: 400 })
      await awaitNestedUpdates(container)

      expect(resizeEmitted).toBe(true)
      // Tooltip state remains consistent
      expect(tooltip.isOpen).toBe(true)

      // Hide tooltip
      tooltip.hide()
      await awaitNestedUpdates(container)
      expect(tooltip.isOpen).toBe(false)
    })
  })
})
```

---

## 5. Verification Method

Once Milestone 1 is implemented, the implementation agent can verify correctness using:

1. **Run Vitest Test Suite**:
   ```bash
   bun --cwd ui test src/components/Charts.test.ts
   ```
   *(or `bun run test` / `vitest run` targeting the chart test files)*.  
   Expected outcome: All 16 tests across the 4 suites pass with 0 failures.

2. **Run Biome Linter & Formatter**:
   ```bash
   bun run lint
   ```
   Expected outcome: Clean linting check across all created files without banned imports or syntax violations.

3. **Check Disallowed React Imports Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   Expected outcome: Exit code 0, confirming zero forbidden React/Recharts dependencies.

### Invalidation Conditions
- Any test attempting to call `showPopover()` before mounting the tooltip element to the document (will throw unhandled `DOMException`).
- `getChartColor(8)` returning anything other than `'var(--color-chart-1)'`.
- Calling `triggerResize(container, { width: 600, height: 300 })` failing to dispatch `viewport-resize` or dispatching an incorrect breakpoint (`computeBreakpoint(600)` must be `'sm'`).
- Missing `<slot name="empty">` in `MoulChartContainer` when `is-empty` attribute is present.
