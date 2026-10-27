# Handoff Report: ChartTooltip Coordinate Positioning Remediation (Finding 1)

**Agent**: `explorer_m1_it2_1`  
**Role**: Explorer (Investigation & Synthesis)  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_it2_1`  
**Target Component**: `MoulChartTooltip` (`ui/src/components/ChartTooltip/ChartTooltip.ts`)  
**Topic**: Remediation of Doubled Coordinate Positioning Offset (Reviewer Finding 1)  
**Date**: 2026-10-17  

---

## 1. Observation

### 1.1 Current Implementation in `ChartTooltip.ts`
In `ui/src/components/ChartTooltip/ChartTooltip.ts`, lines 65–69:
```ts
public updatePosition(): void {
  this.style.left = `${this.x}px`
  this.style.top = `${this.y}px`
  this.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) translate(-50%, -100%) translateY(-8px)`
}
```

### 1.2 Stylesheet Declaration in `ChartTooltip.styles.ts`
In `ui/src/components/ChartTooltip/ChartTooltip.styles.ts`, lines 7–12:
```css
:host {
  position: absolute;
  top: 0;
  left: 0;
  z-index: var(--z-tooltip, 1500);
  margin: 0;
...
```

### 1.3 Test Assertion in `Charts.test.ts` (`CHART-TLP-04`)
In `ui/src/components/Charts.test.ts`, lines 329–368:
```ts
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
  const hasLeftTop =
    styleAttr.includes('120px') && styleAttr.includes('65px')
  const hasTransform =
    popoverEl.style.transform.includes('120px') &&
    popoverEl.style.transform.includes('65px')
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
  const updatedLeftTop =
    updatedStyle.includes('240px') && updatedStyle.includes('130px')
  const updatedTransform =
    popoverEl.style.transform.includes('240px') &&
    popoverEl.style.transform.includes('130px')
  expect(updatedLeftTop || updatedTransform).toBe(true)
})
```

### 1.4 Test Assertions in `chart-tooltip-challenge.test.ts`
In `ui/src/components/chart-tooltip-challenge.test.ts`, lines 132, 198–201, 221–222, and 237–238:
- Line 132: `expect(tooltip.style.left).toBe('400px')`
- Lines 198–201:
  ```ts
  expect(tooltip.style.left).toBe('-999999px')
  expect(tooltip.style.top).toBe('-500000px')
  expect(tooltip.style.transform).toContain('-999999px')
  expect(tooltip.style.transform).toContain('-500000px')
  ```
- Lines 221–222:
  ```ts
  expect(tooltip.style.left).toBe(`${Number.MAX_SAFE_INTEGER}px`)
  expect(tooltip.style.top).toBe(`${Number.MAX_SAFE_INTEGER}px`)
  ```
- Lines 237–238:
  ```ts
  expect(Number.parseFloat(tooltip.style.left)).toBeCloseTo(x, 4)
  expect(Number.parseFloat(tooltip.style.top)).toBeCloseTo(y, 4)
  ```
The stress challenge suite explicitly asserted on **both** properties because it was authored against the buggy duplicate implementation.

---

## 2. Logic Chain

1. **Visual Displacement Physics**:
   - In CSS layout, visual positioning is the composite vector: `P_final = Origin + (left, top) + transform_matrix`.
   - When `:host` has `position: absolute;`, setting `left: x` and `top: y` places the box origin at `(x, y)`.
   - Adding `transform: translate3d(x, y, 0)` shifts the element an additional `(x, y)` relative to its box origin.
   - The resulting visual displacement is `x + x = 2x` and `y + y = 2y`, rendering the tooltip at twice the expected offset from the data point.

2. **Analysis of Candidate Fix 1 (Transform-Based Coordinates — RECOMMENDED)**:
   - Setting:
     ```ts
     public updatePosition(): void {
       this.style.left = '0px'
       this.style.top = '0px'
       this.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) translate(-50%, -100%) translateY(-8px)`
     }
     ```
   - **Performance**: High-frequency mouse movements (e.g. skimming 100+ points on a continuous LineChart) update only the GPU compositor layer without triggering browser layout recalculation (Reflow).
   - **Subpixel Precision**: Continuous D3 scales generate fractional coordinates (e.g. `123.456px`). `translate3d` preserves subpixel interpolation in the GPU rasterizer, preventing 1px jitter/snapping that occurs when browser layout engines round CSS `left`/`top` lengths.
   - **Override Protection**: Explicitly assigning `left = '0px'` and `top = '0px'` inline has `(1-0-0-0)` specificity, neutralizing any user-agent stylesheet popover defaults (such as `:popover-open { inset: 0; margin: auto; }`) and clearing any residual inline offsets.
   - **Compliance with `CHART-TLP-04`**: In `Charts.test.ts`, `hasTransform` checks `popoverEl.style.transform.includes('120px') && popoverEl.style.transform.includes('65px')`. This is strictly `true`. `hasLeftTop || hasTransform` evaluates to `true`.

3. **Analysis of Candidate Fix 2 (Left/Top-Based Coordinates — VIABLE ALTERNATIVE)**:
   - Setting:
     ```ts
     public updatePosition(): void {
       this.style.left = `${this.x}px`
       this.style.top = `${this.y}px`
       this.style.transform = 'translate(-50%, -100%) translateY(-8px)'
     }
     ```
   - **Separation of Concerns**: Coordinate position `(x, y)` is stored on box properties; `transform` handles purely local centering and margin offsets.
   - **Reflow Penalty**: Modifying `left` and `top` triggers layout recomputation on every pointermove event. On dense continuous charts or low-power mobile devices, this can cause frame drops.
   - **Compliance with `CHART-TLP-04`**: `styleAttr` contains `'120px'` and `'65px'` in `left` and `top`. `hasLeftTop` evaluates to `true`. `hasLeftTop || hasTransform` passes cleanly.

4. **Test Suite Impact**:
   - `Charts.test.ts` (`CHART-TLP-04`): Spec-authored with `hasLeftTop || hasTransform`. Both Candidate Fix 1 and Candidate Fix 2 pass 100% without modifying `Charts.test.ts`.
   - `chart-tooltip-challenge.test.ts`: Because lines 198–201 assert both `style.left === '-999999px'` and `style.transform.includes('-999999px')`, fixing the duplicate offset in source code will require adjusting the challenge test assertions to match the chosen strategy.

5. **Animation Decoupling (Enhancement Recommendation)**:
   - In `ChartTooltip.ts`, `OverlayPresenceController` preset `'tooltip'` executes keyframe spring animations: `{ opacity: [0, 1], scale: [0.96, 1], y: [-2, 0] }`.
   - Passing `target: () => this.shadowRoot?.querySelector('[part="container"]') as HTMLElement | null` to `OverlayPresenceControllerOptions` delegates the spring micro-animation to the inner visual card (`part="container"`), completely decoupling it from the host element's coordinate translation.

---

## 3. Caveats

- **Challenge Test Suite Update**: `chart-tooltip-challenge.test.ts` was authored by the challenge agent asserting on the pre-review buggy state. When the worker applies either fix, the assertions in `chart-tooltip-challenge.test.ts` that check the eliminated property must be aligned (e.g. checking `tooltip.style.transform` instead of `tooltip.style.left`).
- **Popover Top Layer**: In browsers with native Popover API, elements promoted to the top layer have containing block root behavior unless anchored. Pinning `top: 0px; left: 0px;` and using `translate3d(x, y, 0)` within the chart container's relative viewport ensures proper visual tracking.

---

## 4. Conclusion & Proposed Code Changes

### Primary Recommendation: Option 1 (GPU-Accelerated Transform Positioning)

#### Proposed Changes to `ui/src/components/ChartTooltip/ChartTooltip.ts`

**Lines 65–69:**
```ts
<<<< BEFORE
  public updatePosition(): void {
    this.style.left = `${this.x}px`
    this.style.top = `${this.y}px`
    this.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) translate(-50%, -100%) translateY(-8px)`
  }
====
  public updatePosition(): void {
    this.style.left = '0px'
    this.style.top = '0px'
    this.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) translate(-50%, -100%) translateY(-8px)`
  }
>>>> AFTER
```

**Lines 47–51 (Decouple spring animation to inner container):**
```ts
<<<< BEFORE
    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'tooltip',
      popover: () => this.popoverEl,
    })
====
    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'tooltip',
      popover: () => this.popoverEl,
      target: () =>
        this.shadowRoot?.querySelector<HTMLElement>('[part="container"]') ??
        null,
    })
>>>> AFTER
```

#### Synchronous Updates for `ui/src/components/chart-tooltip-challenge.test.ts` (when using Option 1)
- Line 132:
  ```ts
  expect(tooltip.style.transform).toContain('400px')
  expect(tooltip.x).toBe(400)
  ```
- Lines 198–201:
  ```ts
  expect(tooltip.style.left).toBe('0px')
  expect(tooltip.style.top).toBe('0px')
  expect(tooltip.style.transform).toContain('-999999px')
  expect(tooltip.style.transform).toContain('-500000px')
  ```
- Lines 221–222:
  ```ts
  expect(tooltip.style.transform).toContain(`${Number.MAX_SAFE_INTEGER}px`)
  expect(tooltip.x).toBe(Number.MAX_SAFE_INTEGER)
  ```
- Lines 237–238:
  ```ts
  expect(tooltip.style.transform).toContain(`${x}px`)
  expect(tooltip.style.transform).toContain(`${y}px`)
  ```

---

### Alternative Implementation: Option 2 (Left/Top Coordinates)

If the team prefers `left`/`top` CSS properties for Cartesian coordinates:

```ts
<<<< BEFORE
  public updatePosition(): void {
    this.style.left = `${this.x}px`
    this.style.top = `${this.y}px`
    this.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) translate(-50%, -100%) translateY(-8px)`
  }
====
  public updatePosition(): void {
    this.style.left = `${this.x}px`
    this.style.top = `${this.y}px`
    this.style.transform = 'translate(-50%, -100%) translateY(-8px)'
  }
>>>> AFTER
```

#### Synchronous Updates for `ui/src/components/chart-tooltip-challenge.test.ts` (when using Option 2)
- Lines 200–201: Remove or replace with `expect(tooltip.style.transform).toBe('translate(-50%, -100%) translateY(-8px)')`.

---

## 5. Verification Method

Once the worker implements the chosen fix:

1. **Verify `CHART-TLP-04` in `Charts.test.ts`**:
   ```bash
   ./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts
   ```
   *Expected outcome*: 17/17 tests pass (100% green). `CHART-TLP-04` passes with either option.

2. **Verify Challenge Test Suite**:
   ```bash
   ./ui/node_modules/.bin/vitest run --root ui src/components/chart-tooltip-challenge.test.ts
   ```
   *Expected outcome*: 21/21 tests pass after updating duplicate assertions.

3. **Verify Lint & Formatting**:
   ```bash
   ./node_modules/.bin/biome check ui/src/components/ChartTooltip ui/src/components/Charts.test.ts
   ```
   *Expected outcome*: 0 errors, 0 warnings.
