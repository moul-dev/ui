# Handoff Report: Milestone 2 — Test Specification for `MoulLineChart` & `MoulAreaChart`

**Agent**: `explorer_m2_3`  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_3`  
**Milestone**: Phase 8 Milestone 2 (Continuous Coordinate Charts — Test Suite Specification)  
**Date**: 2026-10-17  

---

## 1. Observation

### 1.1 Specifications and Reference Architecture
1. **`ORIGINAL_REQUEST.md` (Lines 221–266)**:
   - Line 231: Rebuild Category 1 — Charts & Data Visualization as Lit Web Components powered by `d3-scale`, `d3-shape`, and `motion`.
   - Line 233–235: SVG geometries must use `d3-scale` and `d3-shape`, styling series with `--color-chart-1` through `--color-chart-8`.
   - Line 236–238: Renders `<slot name="empty">` when data is missing or empty `[]`. Animates SVG path transitions with `motion` (duration 200–500ms, respecting `prefers-reduced-motion: reduce`).
   - Line 239–241: Hover interactions dispatch `point-hover` event and coordinate with `moul-chart-tooltip`.
   - Line 248–254: Verification tests in `ui/src/components/Charts.test.ts` must cover SVG path rendering, empty state handling, responsive resize, and interactive point hover behavior.

2. **`rdt/design.md` § 8.1 (Lines 637–642)**:
   - **`MoulLineChart` (`moul-line-chart`)**:
     - Properties: `data: Record<string, unknown>[] = []`, `xKey: string = 'name'`, `series: ChartSeries[] = []`, `height: number = 300`, `showGrid: boolean = true`, `curve: string = 'monotoneX'`, `valueFormatter?: (value: any) => string`.
     - Slots: `empty`.
     - Events: `point-hover` (`detail: PointHoverDetail`).
   - **`MoulAreaChart` (`moul-area-chart`)**:
     - Properties: `data: Record<string, unknown>[] = []`, `xKey: string = 'name'`, `series: ChartSeries[] = []`, `height: number = 300`, `stacked: boolean = false`, `showGrid: boolean = true`, `valueFormatter?: (value: any) => string`.
     - Slots: `empty`.
     - Events: `point-hover` (`detail: PointHoverDetail`).

3. **Existing Testing Infrastructure (`ui/src/components/Charts.test.ts` lines 1–43)**:
   - Vitest test runner with `happy-dom`.
   - Helper `awaitNestedUpdates(root: Element): Promise<void>` synchronizes Lit reactive rendering lifecycles across shadow DOM trees.
   - Helper `mount<T extends HTMLElement>(template: unknown): Promise<T>` appends container to `document.body`, renders template via `lit.render`, awaits nested updates, and returns typed instance.
   - Teardown: `afterEach` clears `document.body.innerHTML = ''`, restores mocks, and restores real timers.
   - Happy-DOM limitations (from `ui/src/test-setup.ts` and `explorer_survey_3/handoff.md` § 1.1): Happy-DOM does NOT evaluate graphical layouts (`getBBox()`, `getTotalLength()` return 0 or undefined). All assertions must target deterministic SVG DOM attributes (`d`, `cx`, `cy`, `fill`, `stroke`, `stop-opacity`).

4. **Shared Contracts (`ui/src/components/ChartCommon.ts` lines 1–45)**:
   - `ChartSeries`: `{ key: string, name?: string, color?: string, strokeWidth?: number }`
   - `PointHoverDetail`: `{ point?: Record<string, unknown>, series?: ChartSeries | string, value: unknown, label: string, x: number, y: number }`
   - `getChartColor(index: number): string` returns `var(--color-chart-${(((index % 8) + 8) % 8) + 1})`.

---

## 2. Logic Chain

1. **Test Suite Organization**:
   - `Charts.test.ts` currently hosts Milestone 1 suites (ChartCommon, MoulChartContainer, MoulChartTooltip, and integration).
   - Milestone 2 requires two new comprehensive describe blocks:
     - `MoulLineChart (moul-line-chart)`: 9 detailed test cases covering registration, D3 line path generation, series color tokens, interactive marker circles, `point-hover` event dispatch, empty state rendering, domain resilience (single point, flat horizontal domain, negative numbers), grid toggle, and fast-check property testing.
     - `MoulAreaChart (moul-area-chart)`: 9 detailed test cases covering registration, D3 area fill and upper boundary stroke paths, `<defs><linearGradient>` with opacity stops, mathematical proof of stacking upward shift, interactive point hover event dispatch, empty state slot gating, custom series color overrides, dynamic `stacked` property toggles, and fast-check property testing.
     - Integration suite: Continuous coordinate charts inside `moul-chart-container` wired to `moul-chart-tooltip`.

2. **SVG Path Validation Logic**:
   - D3 `line().curve(curveMonotoneX)` generates an open SVG path string starting with `'M'` followed by curve commands (`'C'` or `'L'`).
   - D3 `area().curve(curveMonotoneX)` generates a closed SVG path string starting with `'M'` along the top contour and terminating with `'Z'` after tracing the baseline contour.
   - Neither path may ever contain `NaN` or `undefined`.
   - The top boundary of an area chart is an open stroke line path with `fill="none"` and `stroke` matching the series color.

3. **Color Mapping Logic**:
   - If `series[i].color` is omitted, the stroke / fill MUST default to `getChartColor(i)`.
   - If `series[i].color` is explicitly specified (e.g. `'var(--color-chart-5)'`), that value MUST take precedence.
   - For $>8$ series, colors cycle through `--color-chart-1` through `--color-chart-8` modulo 8.

4. **Mathematical Verification of Stacked vs Unstacked Area Charts**:
   - In SVG coordinate space, `(0, 0)` is the top-left corner; increasing Y moves downward.
   - In unstacked mode, for series $B$ with value $v_B$, the top coordinate is $yScale(v_B)$ and the baseline is $yScale(0) = \text{height} - \text{paddingBottom}$.
   - In stacked mode, series $B$ sits on top of series $A$ with value $v_A$. Its baseline is $yScale(v_A)$ and its top coordinate is $yScale(v_A + v_B)$.
   - Because $v_A + v_B > v_B$ (for positive values), $yScale(v_A + v_B)$ is closer to the top of the SVG, meaning:
     $$\text{cy}_{\text{stacked}} < \text{cy}_{\text{unstacked}}$$
   - Furthermore, the baseline for series $B$ is strictly above the chart bottom:
     $$\text{baseline}_{\text{stacked}} < \text{baseline}_{\text{unstacked}}$$
   - Asserting this inequality rigorously verifies that stacking mathematics are genuinely applied.

5. **Interactive Marker Point & Event Dispatch Logic**:
   - Each data point in each series corresponds to a projected `<circle>` element at `(cx, cy)`.
   - Dispatching `new PointerEvent('pointerenter', { bubbles: true, composed: true })` on any circle must trigger a custom event `'point-hover'` on the chart host.
   - The event's `detail` must conform to `PointHoverDetail` with finite numbers for `x` and `y` matching `cx` and `cy`, and valid `value` and `label`.

6. **Empty State Invariant**:
   - When `data` is `[]`, `null`, or `undefined`:
     - `<slot name="empty">` must be rendered in the ShadowRoot.
     - SVG data `<path>` and `<circle>` elements must NOT be rendered.
   - When `data` is subsequently populated with valid rows:
     - `<slot name="empty">` is removed, and SVG geometries are rendered.

---

## 3. Caveats

1. **Happy-DOM SVG Limitations**:
   - As observed in `test-setup.ts`, Happy-DOM does not execute graphical layout calculations (`getBBox()`, `getPointAtLength()`, or `getTotalLength()` return 0 or undefined).
   - Tests must NOT assert on bounding box dimensions; instead, tests assert on SVG DOM attributes (`d`, `cx`, `cy`, `stroke`, `fill`, `stop-opacity`, `id`).
2. **Motion Animation Settling in Unit Tests**:
   - `subtleAnimate` uses `CHART_EASE` over 350ms. In unit test environments where `prefers-reduced-motion` is mocked or duration collapses to 0, geometries apply immediately. Tests await `awaitNestedUpdates(chart)` to ensure reactive DOM commits are settled before inspecting attributes.
3. **No Implementation in This Agent**:
   - Under read-only constraints, this explorer formulated the test specifications and executable snippets without modifying `ui/src/components/Charts.test.ts` directly.

---

## 4. Conclusion & Complete Executable Test Specifications

The complete executable test specification for `MoulLineChart` and `MoulAreaChart` is formulated below. It contains **20 distinct tests** across 3 describe blocks ready to be appended to `ui/src/components/Charts.test.ts`.

### Executable Code Specification for `ui/src/components/Charts.test.ts`

```typescript
// =============================================================================
// Milestone 2: Continuous Coordinate Charts Test Suite
// Components: MoulLineChart (moul-line-chart) & MoulAreaChart (moul-area-chart)
// =============================================================================

describe('Milestone 2: Continuous Coordinate Charts Test Suite', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  // Sample continuous test datasets
  const quarterlyData = [
    { period: 'Q1', revenue: 100, profit: 40, expenses: 60 },
    { period: 'Q2', revenue: 220, profit: 90, expenses: 130 },
    { period: 'Q3', periodLabel: 'Q3', revenue: 180, profit: 70, expenses: 110 },
    { period: 'Q4', revenue: 320, profit: 140, expenses: 180 },
  ]

  const twoSeries: ChartSeries[] = [
    { key: 'revenue', name: 'Gross Revenue' },
    { key: 'profit', name: 'Net Profit' },
  ]

  const threeSeries: ChartSeries[] = [
    { key: 'revenue', name: 'Revenue' },
    { key: 'expenses', name: 'Expenses' },
    { key: 'profit', name: 'Profit' },
  ]

  // ===========================================================================
  // 5. MoulLineChart (`moul-line-chart`)
  // ===========================================================================
  describe('MoulLineChart (`moul-line-chart`)', () => {
    it('CHART-LINE-01: Custom Element registration and HTMLElementTagNameMap contract', () => {
      const ctor = customElements.get('moul-line-chart')
      expect(ctor).toBeDefined()

      const chart = document.createElement('moul-line-chart')
      expect(chart).toBeInstanceOf(ctor!)
      expect(chart.tagName.toLowerCase()).toBe('moul-line-chart')
    })

    it('CHART-LINE-02: D3 SVG <path> generation, curveMonotoneX interpolation, and valid path data d', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${quarterlyData}
          x-key="period"
          .series=${twoSeries}
          height="300"
        ></moul-line-chart>
      `)

      const svg = chart.shadowRoot?.querySelector('svg')
      expect(svg).toBeTruthy()

      // Should render one line path per series
      const linePaths = chart.shadowRoot?.querySelectorAll(
        'path.chart-line, path[part~="line"], path.line-path',
      )
      expect(linePaths?.length).toBe(2)

      for (let i = 0; i < (linePaths?.length ?? 0); i++) {
        const path = linePaths![i]
        const d = path.getAttribute('d')
        expect(d).toBeTruthy()
        // D3 path must begin with Move command 'M'
        expect(d!.startsWith('M')).toBe(true)
        // Must contain cubic bezier curves from curveMonotoneX or line commands
        expect(d!.includes('C') || d!.includes('L')).toBe(true)
        // Must never produce NaN or undefined
        expect(d!.includes('NaN')).toBe(false)
        expect(d!.includes('undefined')).toBe(false)
      }
    })

    it('CHART-LINE-03: Multi-series color token mapping (--color-chart-1 through --color-chart-8) and custom color', async () => {
      const customSeries: ChartSeries[] = [
        { key: 'revenue' }, // defaults to --color-chart-1
        { key: 'expenses' }, // defaults to --color-chart-2
        { key: 'profit', color: 'var(--color-chart-5)' }, // explicit override
      ]

      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${quarterlyData}
          x-key="period"
          .series=${customSeries}
        ></moul-line-chart>
      `)

      const linePaths = chart.shadowRoot?.querySelectorAll(
        'path.chart-line, path[part~="line"], path.line-path',
      )
      expect(linePaths?.length).toBe(3)

      const stroke0 =
        linePaths![0].getAttribute('stroke') ??
        (linePaths![0] as SVGPathElement).style.stroke
      const stroke1 =
        linePaths![1].getAttribute('stroke') ??
        (linePaths![1] as SVGPathElement).style.stroke
      const stroke2 =
        linePaths![2].getAttribute('stroke') ??
        (linePaths![2] as SVGPathElement).style.stroke

      expect(stroke0).toContain('var(--color-chart-1)')
      expect(stroke1).toContain('var(--color-chart-2)')
      expect(stroke2).toContain('var(--color-chart-5)')
    })

    it('CHART-LINE-04: Interactive marker <circle> elements rendered at projected coordinates', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${quarterlyData}
          x-key="period"
          .series=${twoSeries}
          height="300"
        ></moul-line-chart>
      `)

      // 4 periods x 2 series = 8 data point circles
      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(8)

      const cxValues: number[] = []
      const cyValues: number[] = []

      for (let i = 0; i < (circles?.length ?? 0); i++) {
        const circle = circles![i]
        const cx = parseFloat(circle.getAttribute('cx') ?? 'NaN')
        const cy = parseFloat(circle.getAttribute('cy') ?? 'NaN')

        expect(Number.isFinite(cx)).toBe(true)
        expect(Number.isFinite(cy)).toBe(true)
        cxValues.push(cx)
        cyValues.push(cy)
      }

      // First series circles (indices 0..3) should have monotonically increasing cx values
      expect(cxValues[1]).toBeGreaterThan(cxValues[0])
      expect(cxValues[2]).toBeGreaterThan(cxValues[1])
      expect(cxValues[3]).toBeGreaterThan(cxValues[2])

      // In SVG, Y coordinates are inverted (0 at top, 300 at bottom).
      // Since Q2 revenue (220) > Q1 revenue (100), cy for Q2 must be less than cy for Q1.
      expect(cyValues[1]).toBeLessThan(cyValues[0])
    })

    it('CHART-LINE-05: Pointer hover interaction on marker circles dispatches point-hover event', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${quarterlyData}
          x-key="period"
          .series=${twoSeries}
        ></moul-line-chart>
      `)

      let receivedDetail: PointHoverDetail | null = null
      chart.addEventListener('point-hover', (e: Event) => {
        receivedDetail = (e as CustomEvent<PointHoverDetail>).detail
      })

      const firstCircle = chart.shadowRoot?.querySelector('svg circle')
      expect(firstCircle).toBeTruthy()

      // Simulate pointerenter on the first marker circle
      firstCircle!.dispatchEvent(
        new PointerEvent('pointerenter', { bubbles: true, composed: true }),
      )
      await awaitNestedUpdates(chart)

      expect(receivedDetail).not.toBeNull()
      expect(receivedDetail!.label).toBe('Q1')
      expect(receivedDetail!.value).toBe(100)
      expect(receivedDetail!.x).toBeCloseTo(
        parseFloat(firstCircle!.getAttribute('cx')!),
        1,
      )
      expect(receivedDetail!.y).toBeCloseTo(
        parseFloat(firstCircle!.getAttribute('cy')!),
        1,
      )
      expect(receivedDetail!.point).toEqual(quarterlyData[0])
    })

    it('CHART-LINE-06: Empty state slot rendering when data is empty array, null, or undefined', async () => {
      // 1. Empty array
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${[]}
          x-key="period"
          .series=${twoSeries}
        >
          <div slot="empty" id="custom-empty">No Chart Data</div>
        </moul-line-chart>
      `)

      expect(chart.shadowRoot?.querySelector('slot[name="empty"]')).toBeTruthy()
      expect(
        chart.shadowRoot?.querySelectorAll(
          'path.chart-line, path[part~="line"], path.line-path',
        )?.length ?? 0,
      ).toBe(0)
      expect(
        chart.shadowRoot?.querySelectorAll('svg circle')?.length ?? 0,
      ).toBe(0)

      // 2. Null data
      chart.data = null as any
      await chart.updateComplete
      expect(chart.shadowRoot?.querySelector('slot[name="empty"]')).toBeTruthy()

      // 3. Undefined data
      chart.data = undefined as any
      await chart.updateComplete
      expect(chart.shadowRoot?.querySelector('slot[name="empty"]')).toBeTruthy()

      // 4. Reactive recovery when valid data is supplied
      chart.data = quarterlyData
      await chart.updateComplete
      expect(chart.shadowRoot?.querySelector('slot[name="empty"]')).toBeFalsy()
      expect(
        chart.shadowRoot?.querySelectorAll(
          'path.chart-line, path[part~="line"], path.line-path',
        )?.length,
      ).toBe(2)
      expect(
        chart.shadowRoot?.querySelectorAll('svg circle')?.length,
      ).toBe(8)
    })

    it('CHART-LINE-07: Domain resilience edge cases: single data point, identical values, negative values', async () => {
      // Case A: Single data point does not emit NaN
      const singlePoint = [{ period: 'Only', val: 50 }]
      const chartSingle = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${singlePoint}
          x-key="period"
          .series=${[{ key: 'val' }]}
        ></moul-line-chart>
      `)
      const circleSingle = chartSingle.shadowRoot?.querySelector('svg circle')
      expect(circleSingle).toBeTruthy()
      expect(Number.isFinite(parseFloat(circleSingle!.getAttribute('cx')!))).toBe(true)
      expect(Number.isFinite(parseFloat(circleSingle!.getAttribute('cy')!))).toBe(true)

      // Case B: Identical Y values (scale domain [50, 50] zero-delta safeguard)
      const identicalPoints = [
        { period: 'P1', val: 50 },
        { period: 'P2', val: 50 },
      ]
      const chartFlat = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${identicalPoints}
          x-key="period"
          .series=${[{ key: 'val' }]}
        ></moul-line-chart>
      `)
      const pathFlat = chartFlat.shadowRoot?.querySelector(
        'path.chart-line, path[part~="line"], path.line-path',
      )
      expect(pathFlat).toBeTruthy()
      const dFlat = pathFlat!.getAttribute('d')
      expect(dFlat!.includes('NaN')).toBe(false)

      // Case C: Negative Y values correctly plotted
      const negativePoints = [
        { period: 'Jan', temp: -15 },
        { period: 'Feb', temp: 25 },
      ]
      const chartNeg = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${negativePoints}
          x-key="period"
          .series=${[{ key: 'temp' }]}
        ></moul-line-chart>
      `)
      const circlesNeg = chartNeg.shadowRoot?.querySelectorAll('svg circle')
      expect(circlesNeg?.length).toBe(2)
      // Positive temperature (25) must have smaller cy (higher up) than negative temperature (-15)
      const cyNeg = parseFloat(circlesNeg![0].getAttribute('cy')!)
      const cyPos = parseFloat(circlesNeg![1].getAttribute('cy')!)
      expect(cyPos).toBeLessThan(cyNeg)
    })

    it('CHART-LINE-08: Grid lines toggle (show-grid), custom xKey, and dynamic height property update', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${quarterlyData}
          x-key="period"
          .series=${twoSeries}
          show-grid
          height="300"
        ></moul-line-chart>
      `)

      let gridLines = chart.shadowRoot?.querySelectorAll('line.grid-line, [part~="grid"]')
      expect(gridLines?.length).toBeGreaterThan(0)

      // Toggle off grid
      chart.showGrid = false
      await chart.updateComplete
      gridLines = chart.shadowRoot?.querySelectorAll('line.grid-line, [part~="grid"]')
      expect(gridLines?.length ?? 0).toBe(0)

      // Dynamic height update
      chart.height = 450
      await chart.updateComplete
      const svg = chart.shadowRoot?.querySelector('svg')
      expect(
        svg?.getAttribute('height') === '450' ||
          svg?.getAttribute('viewBox')?.includes('450'),
      ).toBe(true)
    })

    it('CHART-LINE-09: Fast-check property test: path data d starts with M and never contains NaN', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              x: fc.string({ minLength: 1, maxLength: 8 }),
              val: fc.double({ min: -10000, max: 10000, noNaN: true }),
            }),
            { minLength: 2, maxLength: 10 },
          ),
          async (generatedData) => {
            const chart = await mount<MoulLineChart>(html`
              <moul-line-chart
                .data=${generatedData}
                x-key="x"
                .series=${[{ key: 'val' }]}
              ></moul-line-chart>
            `)

            const path = chart.shadowRoot?.querySelector(
              'path.chart-line, path[part~="line"], path.line-path',
            )
            expect(path).toBeTruthy()
            const d = path!.getAttribute('d')
            expect(d).toBeTruthy()
            expect(d!.startsWith('M')).toBe(true)
            expect(d!.includes('NaN')).toBe(false)
            chart.remove()
          },
        ),
      )
    })
  })

  // ===========================================================================
  // 6. MoulAreaChart (`moul-area-chart`)
  // ===========================================================================
  describe('MoulAreaChart (`moul-area-chart`)', () => {
    it('CHART-AREA-01: Custom Element registration and HTMLElementTagNameMap contract', () => {
      const ctor = customElements.get('moul-area-chart')
      expect(ctor).toBeDefined()

      const chart = document.createElement('moul-area-chart')
      expect(chart).toBeInstanceOf(ctor!)
      expect(chart.tagName.toLowerCase()).toBe('moul-area-chart')
    })

    it('CHART-AREA-02: D3 Area path rendering: closed area fill <path> and top boundary stroke <path>', async () => {
      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${quarterlyData}
          x-key="period"
          .series=${twoSeries}
          height="300"
        ></moul-area-chart>
      `)

      // Area fill paths (closed geometries with fill)
      const areaPaths = chart.shadowRoot?.querySelectorAll(
        'path.chart-area, path[part~="area"], path.area-path',
      )
      expect(areaPaths?.length).toBe(2)

      for (let i = 0; i < (areaPaths?.length ?? 0); i++) {
        const areaPath = areaPaths![i]
        const d = areaPath.getAttribute('d')
        expect(d).toBeTruthy()
        expect(d!.startsWith('M')).toBe(true)
        // Closed area path must terminate with Z command
        expect(d!.includes('Z')).toBe(true)
        expect(d!.includes('NaN')).toBe(false)
      }

      // Top boundary stroke paths (open contour)
      const strokePaths = chart.shadowRoot?.querySelectorAll(
        'path.chart-line, path[part~="line"], path.area-stroke',
      )
      expect(strokePaths?.length).toBe(2)

      for (let i = 0; i < (strokePaths?.length ?? 0); i++) {
        const strokePath = strokePaths![i]
        const d = strokePath.getAttribute('d')
        expect(d).toBeTruthy()
        expect(d!.startsWith('M')).toBe(true)
        // Upper line contour is not closed with Z
        expect(d!.endsWith('Z')).toBe(false)
        expect(d!.includes('NaN')).toBe(false)
      }
    })

    it('CHART-AREA-03: <defs><linearGradient> definition with semi-transparent stops matching series color', async () => {
      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${quarterlyData}
          x-key="period"
          .series=${twoSeries}
        ></moul-area-chart>
      `)

      const defs = chart.shadowRoot?.querySelector('defs')
      expect(defs).toBeTruthy()

      const gradients = defs?.querySelectorAll('linearGradient')
      expect(gradients?.length).toBe(2)

      // Inspect first gradient
      const grad0 = gradients?.[0]
      expect(grad0).toBeTruthy()
      expect(grad0?.id).toBeTruthy()

      const stops0 = grad0?.querySelectorAll('stop')
      expect(stops0?.length).toBeGreaterThanOrEqual(2)

      // Stop 0: offset 0% (top), non-zero opacity
      expect(stops0?.[0].getAttribute('offset')).toMatch(/0%?/)
      const topOpacity = parseFloat(stops0?.[0].getAttribute('stop-opacity') ?? '1')
      expect(topOpacity).toBeGreaterThan(0)
      expect(topOpacity).toBeLessThanOrEqual(0.5)

      // Stop 1: offset 100% (bottom), zero opacity for smooth fadeout
      expect(stops0?.[1].getAttribute('offset')).toMatch(/100%?|1/)
      const botOpacity = parseFloat(stops0?.[1].getAttribute('stop-opacity') ?? '1')
      expect(botOpacity).toBe(0)

      // Area fill path references the gradient ID
      const areaPath0 = chart.shadowRoot?.querySelector(
        'path.chart-area, path[part~="area"], path.area-path',
      )
      expect(areaPath0?.getAttribute('fill')).toContain(`url(#${grad0?.id})`)
    })

    it('CHART-AREA-04: Stacked mode shifts area geometry upward compared to unstacked mode', async () => {
      // Mount unstacked
      const unstacked = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${quarterlyData}
          x-key="period"
          .series=${twoSeries}
          .stacked=${false}
          height="300"
        ></moul-area-chart>
      `)

      // Mount stacked
      const stacked = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${quarterlyData}
          x-key="period"
          .series=${twoSeries}
          .stacked=${true}
          height="300"
        ></moul-area-chart>
      `)

      // Compare Series 1 (Net Profit) marker circles for Q1
      // In unstacked: profit value is 40 plotted from baseline 0
      // In stacked: profit sits atop revenue 100, plotted at 100 + 40 = 140
      const unstackedCircles = unstacked.shadowRoot?.querySelectorAll('svg circle')
      const stackedCircles = stacked.shadowRoot?.querySelectorAll('svg circle')

      expect(unstackedCircles?.length).toBe(8)
      expect(stackedCircles?.length).toBe(8)

      // Series 1 circle for Q1 is index 4 (since series 0 has 4 circles)
      const unstackedCy = parseFloat(unstackedCircles![4].getAttribute('cy')!)
      const stackedCy = parseFloat(stackedCircles![4].getAttribute('cy')!)

      // In SVG coordinates, a higher accumulated value (140 vs 40) is positioned higher up physically,
      // which corresponds to a smaller numeric cy value!
      expect(stackedCy).toBeLessThan(unstackedCy)
    })

    it('CHART-AREA-05: Interactive point hover dispatches point-hover event with valid detail', async () => {
      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${quarterlyData}
          x-key="period"
          .series=${twoSeries}
        ></moul-area-chart>
      `)

      let receivedDetail: PointHoverDetail | null = null
      chart.addEventListener('point-hover', (e: Event) => {
        receivedDetail = (e as CustomEvent<PointHoverDetail>).detail
      })

      const firstCircle = chart.shadowRoot?.querySelector('svg circle')
      expect(firstCircle).toBeTruthy()

      firstCircle!.dispatchEvent(
        new PointerEvent('pointerenter', { bubbles: true, composed: true }),
      )
      await awaitNestedUpdates(chart)

      expect(receivedDetail).not.toBeNull()
      expect(receivedDetail!.label).toBe('Q1')
      expect(receivedDetail!.value).toBe(100)
      expect(Number.isFinite(receivedDetail!.x)).toBe(true)
      expect(Number.isFinite(receivedDetail!.y)).toBe(true)
    })

    it('CHART-AREA-06: Empty state slot rendering when data is empty array, null, or undefined', async () => {
      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${[]}
          x-key="period"
          .series=${twoSeries}
        >
          <div slot="empty" id="no-area">No Data Available</div>
        </moul-area-chart>
      `)

      expect(chart.shadowRoot?.querySelector('slot[name="empty"]')).toBeTruthy()
      expect(
        chart.shadowRoot?.querySelectorAll('path.chart-area, path.area-path')?.length ?? 0,
      ).toBe(0)

      // Null data
      chart.data = null as any
      await chart.updateComplete
      expect(chart.shadowRoot?.querySelector('slot[name="empty"]')).toBeTruthy()

      // Undefined data
      chart.data = undefined as any
      await chart.updateComplete
      expect(chart.shadowRoot?.querySelector('slot[name="empty"]')).toBeTruthy()

      // Restoring data removes empty slot and renders geometries
      chart.data = quarterlyData
      await chart.updateComplete
      expect(chart.shadowRoot?.querySelector('slot[name="empty"]')).toBeFalsy()
      expect(
        chart.shadowRoot?.querySelectorAll('path.chart-area, path[part~="area"], path.area-path')?.length,
      ).toBe(2)
    })

    it('CHART-AREA-07: Multi-series color mapping, gradient references, and custom series color', async () => {
      const seriesWithCustom: ChartSeries[] = [
        { key: 'revenue', color: 'var(--color-chart-4)' },
        { key: 'profit' }, // falls back to var(--color-chart-2)
      ]

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${quarterlyData}
          x-key="period"
          .series=${seriesWithCustom}
        ></moul-area-chart>
      `)

      const strokePaths = chart.shadowRoot?.querySelectorAll(
        'path.chart-line, path[part~="line"], path.area-stroke',
      )
      expect(strokePaths?.length).toBe(2)

      const stroke0 =
        strokePaths![0].getAttribute('stroke') ??
        (strokePaths![0] as SVGPathElement).style.stroke
      const stroke1 =
        strokePaths![1].getAttribute('stroke') ??
        (strokePaths![1] as SVGPathElement).style.stroke

      expect(stroke0).toContain('var(--color-chart-4)')
      expect(stroke1).toContain('var(--color-chart-2)')
    })

    it('CHART-AREA-08: Dynamic stacked attribute toggle reactively recalculates area geometries', async () => {
      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${quarterlyData}
          x-key="period"
          .series=${twoSeries}
          height="300"
        ></moul-area-chart>
      `)

      expect(chart.stacked).toBe(false)
      const circlesInitial = chart.shadowRoot?.querySelectorAll('svg circle')
      const initialProfitCy = parseFloat(circlesInitial![4].getAttribute('cy')!)

      // Toggle stacked to true
      chart.stacked = true
      await chart.updateComplete

      const circlesUpdated = chart.shadowRoot?.querySelectorAll('svg circle')
      const updatedProfitCy = parseFloat(circlesUpdated![4].getAttribute('cy')!)

      // Shifted upward in stacked configuration
      expect(updatedProfitCy).toBeLessThan(initialProfitCy)
    })

    it('CHART-AREA-09: Fast-check property test: area path is closed and never contains NaN', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              x: fc.string({ minLength: 1, maxLength: 8 }),
              rev: fc.double({ min: 1, max: 1000, noNaN: true }),
              exp: fc.double({ min: 1, max: 1000, noNaN: true }),
            }),
            { minLength: 2, maxLength: 8 },
          ),
          async (sampleData) => {
            const chart = await mount<MoulAreaChart>(html`
              <moul-area-chart
                .data=${sampleData}
                x-key="x"
                .series=${[
                  { key: 'rev', name: 'Revenue' },
                  { key: 'exp', name: 'Expenses' },
                ]}
                stacked
              ></moul-area-chart>
            `)

            const areaPaths = chart.shadowRoot?.querySelectorAll(
              'path.chart-area, path[part~="area"], path.area-path',
            )
            expect(areaPaths?.length).toBe(2)

            for (let i = 0; i < (areaPaths?.length ?? 0); i++) {
              const d = areaPaths![i].getAttribute('d')
              expect(d).toBeTruthy()
              expect(d!.startsWith('M')).toBe(true)
              expect(d!.includes('Z')).toBe(true)
              expect(d!.includes('NaN')).toBe(false)
            }

            chart.remove()
          },
        ),
      )
    })
  })

  // ===========================================================================
  // 7. Integration: Continuous Coordinate Charts with Container & Tooltip
  // ===========================================================================
  describe('Integration: Continuous Coordinate Charts with Container & Tooltip', () => {
    it('CHART-INT-02: Slotted MoulLineChart in MoulChartContainer coordinates with MoulChartTooltip', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container title="Continuous Revenue Trends">
          <div id="chart-viewport" style="position: relative; width: 600px; height: 300px;">
            <moul-line-chart
              id="line-chart-instance"
              .data=${quarterlyData}
              x-key="period"
              .series=${twoSeries}
            ></moul-line-chart>
            <moul-chart-tooltip id="tooltip-instance"></moul-chart-tooltip>
          </div>
        </moul-chart-container>
      `)

      const lineChart = container.querySelector<MoulLineChart>('#line-chart-instance')!
      const tooltip = container.querySelector<MoulChartTooltip>('#tooltip-instance')!
      expect(lineChart).toBeTruthy()
      expect(tooltip).toBeTruthy()
      expect(tooltip.isOpen).toBe(false)

      // Wire up hover event to show tooltip
      lineChart.addEventListener('point-hover', (e: Event) => {
        const detail = (e as CustomEvent<PointHoverDetail>).detail
        tooltip.show({
          label: detail.label,
          value: `$${detail.value}`,
          x: detail.x,
          y: detail.y,
        })
      })

      // Hover a point on the chart
      const point = lineChart.shadowRoot?.querySelector('svg circle')
      expect(point).toBeTruthy()

      point!.dispatchEvent(
        new PointerEvent('pointerenter', { bubbles: true, composed: true }),
      )
      await awaitNestedUpdates(container)

      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.shadowRoot?.querySelector('[part="label"]')?.textContent).toContain('Q1')
      expect(tooltip.shadowRoot?.querySelector('[part="value"]')?.textContent).toContain('$100')

      // Dismiss tooltip
      tooltip.hide()
      await awaitNestedUpdates(container)
      expect(tooltip.isOpen).toBe(false)
    })

    it('CHART-INT-03: Area chart inside container reacts to container dimensions and empty state', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container is-empty>
          <moul-area-chart
            id="area-chart-instance"
            .data=${[]}
            .series=${twoSeries}
          ></moul-area-chart>
          <div slot="empty" id="dashboard-empty">No Chart Data Present</div>
        </moul-chart-container>
      `)

      const emptySlot = container.shadowRoot?.querySelector('slot[name="empty"]')
      expect(emptySlot).toBeTruthy()
      const areaChart = container.querySelector<MoulAreaChart>('#area-chart-instance')!
      expect(areaChart).toBeTruthy()

      // When container toggles empty state off and area chart receives data
      container.isEmpty = false
      areaChart.data = quarterlyData
      await awaitNestedUpdates(container)

      const areaPaths = areaChart.shadowRoot?.querySelectorAll(
        'path.chart-area, path[part~="area"], path.area-path',
      )
      expect(areaPaths?.length).toBe(2)
    })
  })
})
```

---

## 5. Verification Method

To independently verify this test specification once `LineChart.ts` and `AreaChart.ts` are implemented:

1. **Verify TypeScript compilation**:
   ```bash
   node ui/node_modules/.bin/tsc --noEmit --project ui/tsconfig.json
   ```
   *Expected result*: Exit code 0, 0 type errors.

2. **Run Vitest on the complete Charts test suite**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts
   ```
   *Expected result*: All Milestone 1 and Milestone 2 test suites pass 100% green.

3. **Run Biome check**:
   ```bash
   ./node_modules/.bin/biome check ui/src/components/Charts.test.ts
   ```
   *Expected result*: Clean check, 0 errors.

4. **Verify Zero-React guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected result*: Exit code 0, zero disallowed dependencies or imports.

### Invalidation Conditions
- Any test assertion relying on Happy-DOM's unsupported `getBBox()` or `getTotalLength()`.
- Line or Area path `d` strings containing `NaN` or failing to start with `'M'`.
- Area path failing to close with `'Z'` or lacking `<defs><linearGradient>` stops.
- Stacked area chart failing to shift coordinates upward (`stackedCy >= unstackedCy`).
- Point hover failing to emit `point-hover` event or omitting projected coordinate numbers.
- Empty data rendering geometries instead of `<slot name="empty">`.
