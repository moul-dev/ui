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
import './LineChart/LineChart'
import './AreaChart/AreaChart'
import './BarChart/BarChart'
import './DoughnutChart/DoughnutChart'
import './TopList/TopList'
import './Stat/Stat'
import './Percentage/PercentageBar'
import './Percentage/PercentageCircle'
import { triggerResize } from '../test-setup'
import type { MoulAreaChart } from './AreaChart/AreaChart'
import { MoulBarChart } from './BarChart/BarChart'
import type { MoulChartContainer } from './ChartContainer/ChartContainer'
import type { MoulChartTooltip } from './ChartTooltip/ChartTooltip'
import { chartTooltipStyles } from './ChartTooltip/ChartTooltip.styles'
import { MoulDoughnutChart } from './DoughnutChart/DoughnutChart'
import type { MoulLineChart } from './LineChart/LineChart'
import { MoulPercentageBar } from './Percentage/PercentageBar'
import { MoulPercentageCircle } from './Percentage/PercentageCircle'
import { MoulStat } from './Stat/Stat'
import { MoulTopList } from './TopList/TopList'

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

      const headerSlot = container.shadowRoot?.querySelector(
        'slot[name="header"]',
      )
      const defaultSlot =
        container.shadowRoot?.querySelector('slot:not([name])')
      const legendSlot = container.shadowRoot?.querySelector(
        'slot[name="legend"]',
      )

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

      const emptySlot =
        container.shadowRoot?.querySelector('slot[name="empty"]')
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

      let resizeEventDetail: {
        width: number
        height: number
        breakpoint: string
      } | null = null
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
      const indicatorEl =
        tooltip.shadowRoot?.querySelector('[part="indicator"]')

      expect(labelEl?.textContent).toContain('March 2026')
      expect(valueEl?.textContent).toContain('$82,500')
      expect(indicatorEl?.getAttribute('style')).toContain(
        'var(--color-chart-3)',
      )
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

    it('CHART-TLP-06: Tooltip styles provide solid elevated fallback and progressive glass enhancement', () => {
      const stylesText = Array.isArray(chartTooltipStyles)
        ? chartTooltipStyles.map((s: any) => s.cssText ?? String(s)).join('\n')
        : ((chartTooltipStyles as any).cssText ?? String(chartTooltipStyles))

      // Solid elevated fallback when unsupported
      expect(stylesText).toMatch(/var\(--color-bg-elevated/)
      expect(stylesText).toMatch(/var\(--color-border-subtle/)
      // Progressive blur enhancement
      expect(stylesText).toMatch(
        /@supports\s*\([^)]*backdrop-filter:\s*blur\(12px\)/,
      )
      expect(stylesText).toMatch(/var\(--color-bg-glass/)
      expect(stylesText).toMatch(/var\(--color-border-glass/)
      expect(stylesText).toMatch(/backdrop-filter:\s*blur\(12px\)/)
    })

    it('CHART-TLP-07: Multi-series payload renders series items with indicators and labels', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)
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

      const labels = Array.from(
        tooltip.shadowRoot?.querySelectorAll('.tooltip-item [part="label"]') ??
          [],
      ).map((el) => el.textContent)
      expect(labels).toEqual(['Revenue', 'Profit'])

      const values = Array.from(
        tooltip.shadowRoot?.querySelectorAll('.tooltip-item [part="value"]') ??
          [],
      ).map((el) => el.textContent)
      expect(values).toEqual(['$50,000', '$12,000'])
    })

    it('CHART-TLP-08: Custom valueFormatter formats payload values correctly', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)
      tooltip.show({
        label: 'Summary',
        valueFormatter: (v) => `€${Number(v) * 2}`,
        payload: [{ name: 'Euro', value: 100 }],
      })
      await awaitNestedUpdates(tooltip)
      const valueEl = tooltip.shadowRoot?.querySelector(
        '.tooltip-item [part="value"]',
      )
      expect(valueEl?.textContent).toBe('€200')
    })

    it('CHART-TLP-09: Payload items with label/fallback color mapping', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)
      tooltip.show({
        x: 40,
        y: 60,
        payload: [{ label: 'Series Without Color', value: 300 }],
      })
      await awaitNestedUpdates(tooltip)

      const labelEl = tooltip.shadowRoot?.querySelector(
        '.tooltip-item [part="label"]',
      )
      expect(labelEl?.textContent).toBe('Series Without Color')
      const valueEl = tooltip.shadowRoot?.querySelector(
        '.tooltip-item [part="value"]',
      )
      expect(valueEl?.textContent).toBe('300')
      const indicator = tooltip.shadowRoot?.querySelector(
        '.tooltip-item [part="indicator"]',
      )
      expect(indicator?.getAttribute('style')).toContain('var(--color-chart-1)')
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

      const tooltip =
        container.querySelector<MoulChartTooltip>('#tooltip-instance')!
      expect(tooltip).toBeTruthy()
      expect(tooltip.isOpen).toBe(false)

      // Open tooltip
      tooltip.show({
        label: 'Integration Point',
        value: '999',
        color: 'var(--color-chart-1)',
        x: 100,
        y: 150,
      })
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
    {
      period: 'Q3',
      periodLabel: 'Q3',
      revenue: 180,
      profit: 70,
      expenses: 110,
    },
    { period: 'Q4', revenue: 320, profit: 140, expenses: 180 },
  ]

  const twoSeries: ChartSeries[] = [
    { key: 'revenue', name: 'Gross Revenue' },
    { key: 'profit', name: 'Net Profit' },
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
      expect(chart.shadowRoot?.querySelectorAll('svg circle')?.length).toBe(8)
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
      expect(
        Number.isFinite(parseFloat(circleSingle!.getAttribute('cx')!)),
      ).toBe(true)
      expect(
        Number.isFinite(parseFloat(circleSingle!.getAttribute('cy')!)),
      ).toBe(true)

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

      let gridLines = chart.shadowRoot?.querySelectorAll(
        'line.grid-line, [part~="grid"]',
      )
      expect(gridLines?.length).toBeGreaterThan(0)

      // Toggle off grid
      chart.showGrid = false
      await chart.updateComplete
      gridLines = chart.shadowRoot?.querySelectorAll(
        'line.grid-line, [part~="grid"]',
      )
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

    it('CHART-LINE-09: Fast-check property test: path data d starts with M and never contains NaN', async () => {
      await fc.assert(
        fc.asyncProperty(
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
      const topOpacity = parseFloat(
        stops0?.[0].getAttribute('stop-opacity') ?? '1',
      )
      expect(topOpacity).toBeGreaterThan(0)
      expect(topOpacity).toBeLessThanOrEqual(0.5)

      // Stop 1: offset 100% (bottom), zero opacity for smooth fadeout
      expect(stops0?.[1].getAttribute('offset')).toMatch(/100%?|1/)
      const botOpacity = parseFloat(
        stops0?.[1].getAttribute('stop-opacity') ?? '1',
      )
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
      const unstackedCircles =
        unstacked.shadowRoot?.querySelectorAll('svg circle')
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
        chart.shadowRoot?.querySelectorAll('path.chart-area, path.area-path')
          ?.length ?? 0,
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
        chart.shadowRoot?.querySelectorAll(
          'path.chart-area, path[part~="area"], path.area-path',
        )?.length,
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

    it('CHART-AREA-09: Fast-check property test: area path is closed and never contains NaN', async () => {
      await fc.assert(
        fc.asyncProperty(
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

      const lineChart = container.querySelector<MoulLineChart>(
        '#line-chart-instance',
      )!
      const tooltip =
        container.querySelector<MoulChartTooltip>('#tooltip-instance')!
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
      expect(
        tooltip.shadowRoot?.querySelector('[part="label"]')?.textContent,
      ).toContain('Q1')
      expect(
        tooltip.shadowRoot?.querySelector('[part="value"]')?.textContent,
      ).toContain('$100')

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

      const emptySlot =
        container.shadowRoot?.querySelector('slot[name="empty"]')
      expect(emptySlot).toBeTruthy()
      const areaChart = container.querySelector<MoulAreaChart>(
        '#area-chart-instance',
      )!
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

// ===========================================================================
// Milestone 3: Discrete & Categorical Charts Test Suite
// ===========================================================================
describe('Milestone 3: Discrete & Categorical Charts Test Suite', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.useRealTimers()
  })
  // -------------------------------------------------------------------------
  // 1. MoulBarChart
  // -------------------------------------------------------------------------
  describe('MoulBarChart (`moul-bar-chart`)', () => {
    const sampleBarData = [
      { name: 'Mon', sales: 120, leads: 50 },
      { name: 'Tue', sales: 200, leads: 80 },
      { name: 'Wed', sales: 150, leads: 60 },
      { name: 'Thu', sales: 300, leads: 120 },
      { name: 'Fri', sales: 250, leads: 90 },
    ]
    const barSeries: ChartSeries[] = [
      { key: 'sales', name: 'Sales', color: 'var(--color-chart-1)' },
      { key: 'leads', name: 'Leads', color: 'var(--color-chart-2)' },
    ]

    it('CHART-BAR-01: Custom Element registration and HTMLElementTagNameMap contract', () => {
      expect(customElements.get('moul-bar-chart')).toBeDefined()
      const element = document.createElement('moul-bar-chart')
      expect(element).toBeInstanceOf(MoulBarChart)
      expect(element.tagName.toLowerCase()).toBe('moul-bar-chart')
    })

    it('CHART-BAR-02: Vertical layout (grouped): renders N * S rect bars, distinct X offsets per series, valid non-NaN attributes', async () => {
      const el = await mount<MoulBarChart>(html`
          <moul-bar-chart
            .data=${sampleBarData}
            .series=${barSeries}
          ></moul-bar-chart>
        `)
      const bars =
        el.shadowRoot!.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars.length).toBe(10)

      bars.forEach((bar) => {
        const x = parseFloat(bar.getAttribute('x') || '0')
        const y = parseFloat(bar.getAttribute('y') || '0')
        const width = parseFloat(bar.getAttribute('width') || '0')
        const height = parseFloat(bar.getAttribute('height') || '0')
        expect(Number.isFinite(x)).toBe(true)
        expect(Number.isFinite(y)).toBe(true)
        expect(Number.isFinite(width)).toBe(true)
        expect(Number.isFinite(height)).toBe(true)
        expect(width).toBeGreaterThan(0)
        expect(height).toBeGreaterThan(0)
        expect(bar.getAttribute('x')?.includes('NaN')).toBe(false)
        expect(bar.getAttribute('y')?.includes('NaN')).toBe(false)
      })

      const firstCatSalesX = parseFloat(bars[0].getAttribute('x') || '0')
      const firstCatLeadsX = parseFloat(bars[1].getAttribute('x') || '0')
      expect(firstCatSalesX).not.toBe(firstCatLeadsX)
    })

    it('CHART-BAR-03: Vertical layout (stacked): bars share identical X and width, cumulative vertical stacking math', async () => {
      const el = await mount<MoulBarChart>(html`
          <moul-bar-chart
            .data=${sampleBarData}
            .series=${barSeries}
            stacked
          ></moul-bar-chart>
        `)
      const bars =
        el.shadowRoot!.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars.length).toBe(10)

      const bar0 = bars[0]
      const bar1 = bars[1]
      expect(bar0.getAttribute('x')).toBe(bar1.getAttribute('x'))
      expect(bar0.getAttribute('width')).toBe(bar1.getAttribute('width'))

      const y0 = parseFloat(bar0.getAttribute('y') || '0')
      const y1 = parseFloat(bar1.getAttribute('y') || '0')
      const h1 = parseFloat(bar1.getAttribute('height') || '0')
      expect(Math.abs(y1 + h1 - y0)).toBeLessThan(1)
    })

    it('CHART-BAR-04: Horizontal layout (layout="horizontal"): categorical Y axis, horizontal bar growth along X, grouped & stacked positioning', async () => {
      const el = await mount<MoulBarChart>(html`
          <moul-bar-chart
            .data=${sampleBarData}
            .series=${barSeries}
            layout="horizontal"
          ></moul-bar-chart>
        `)
      const bars =
        el.shadowRoot!.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars.length).toBe(10)

      const y0 = parseFloat(bars[0].getAttribute('y') || '0')
      const y1 = parseFloat(bars[1].getAttribute('y') || '0')
      expect(y0).not.toBe(y1)

      const stackedEl = await mount<MoulBarChart>(html`
          <moul-bar-chart
            .data=${sampleBarData}
            .series=${barSeries}
            layout="horizontal"
            stacked
          ></moul-bar-chart>
        `)
      const stackedBars =
        stackedEl.shadowRoot!.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(stackedBars.length).toBe(10)

      const sBar0 = stackedBars[0]
      const sBar1 = stackedBars[1]
      expect(sBar0.getAttribute('y')).toBe(sBar1.getAttribute('y'))
      expect(sBar0.getAttribute('height')).toBe(sBar1.getAttribute('height'))
      const x0 = parseFloat(sBar0.getAttribute('x') || '0')
      const w0 = parseFloat(sBar0.getAttribute('width') || '0')
      const x1 = parseFloat(sBar1.getAttribute('x') || '0')
      expect(Math.abs(x0 + w0 - x1)).toBeLessThan(1)
    })

    it('CHART-BAR-05: Multi-series color mapping (--color-chart-1 ... --color-chart-8) and custom series color overrides', async () => {
      const customSeries: ChartSeries[] = [
        { key: 'sales', name: 'Sales', color: '#ff3366' },
        { key: 'leads', name: 'Leads' },
      ]
      const el = await mount<MoulBarChart>(html`
          <moul-bar-chart
            .data=${sampleBarData}
            .series=${customSeries}
          ></moul-bar-chart>
        `)
      const bars =
        el.shadowRoot!.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars[0].getAttribute('fill')).toBe('#ff3366')
      expect(bars[1].getAttribute('fill')).toBe('var(--color-chart-2)')
    })

    it('CHART-BAR-06: Pointer interaction: pointerenter on <rect.chart-bar> dispatches point-hover and pointerleave dispatches point-leave', async () => {
      const el = await mount<MoulBarChart>(html`
          <moul-bar-chart
            .data=${sampleBarData}
            .series=${barSeries}
          ></moul-bar-chart>
        `)
      let hoveredDetail: PointHoverDetail | null = null
      el.addEventListener('point-hover', (e: Event) => {
        hoveredDetail = (e as CustomEvent<PointHoverDetail>).detail
      })
      let leaveFired = false
      el.addEventListener('point-leave', () => {
        leaveFired = true
      })

      const firstBar =
        el.shadowRoot!.querySelector<SVGRectElement>('rect.chart-bar')!
      firstBar.dispatchEvent(
        new PointerEvent('pointerenter', { bubbles: true }),
      )
      await awaitNestedUpdates(el)

      expect(hoveredDetail).not.toBeNull()
      expect(hoveredDetail?.label).toBe('Mon')
      expect(hoveredDetail?.value).toBe(120)
      expect(Number.isFinite(hoveredDetail?.x)).toBe(true)
      expect(Number.isFinite(hoveredDetail?.y)).toBe(true)
      expect(firstBar.classList.contains('is-active')).toBe(true)

      firstBar.dispatchEvent(
        new PointerEvent('pointerleave', { bubbles: true }),
      )
      await awaitNestedUpdates(el)

      expect(leaveFired).toBe(true)
      expect(firstBar.classList.contains('is-active')).toBe(false)
    })

    it('CHART-BAR-07: Empty state slot rendering when data = [] or null', async () => {
      const elEmpty = await mount<MoulBarChart>(html`
          <moul-bar-chart .data=${[]}></moul-bar-chart>
        `)
      expect(
        elEmpty.shadowRoot!.querySelector('slot[name="empty"]'),
      ).not.toBeNull()
      expect(
        elEmpty.shadowRoot!.querySelectorAll('rect.chart-bar').length,
      ).toBe(0)

      const elCustom = await mount<MoulBarChart>(html`
          <moul-bar-chart .data=${[]}>
            <div slot="empty" id="no-bars">Custom Empty Bars</div>
          </moul-bar-chart>
        `)
      expect(
        elCustom.shadowRoot!.querySelector('slot[name="empty"]'),
      ).not.toBeNull()
    })

    it('CHART-BAR-08: Domain resilience edge cases: single data point, all identical values, negative values, and subnormal ranges', async () => {
      const singleEl = await mount<MoulBarChart>(html`
          <moul-bar-chart
            .data=${[{ name: 'Single', val: 50 }]}
            .series=${[{ key: 'val', name: 'Val' }]}
          ></moul-bar-chart>
        `)
      const singleBar =
        singleEl.shadowRoot!.querySelector<SVGRectElement>('rect.chart-bar')
      expect(singleBar).not.toBeNull()
      expect(singleBar!.getAttribute('width')?.includes('NaN')).toBe(false)
      expect(singleBar!.getAttribute('height')?.includes('NaN')).toBe(false)

      const identicalEl = await mount<MoulBarChart>(html`
          <moul-bar-chart
            .data=${[{ name: 'A', v: 10 }, { name: 'B', v: 10 }]}
            .series=${[{ key: 'v', name: 'V' }]}
          ></moul-bar-chart>
        `)
      const idBars =
        identicalEl.shadowRoot!.querySelectorAll<SVGRectElement>(
          'rect.chart-bar',
        )
      expect(idBars[0].getAttribute('height')).toBe(
        idBars[1].getAttribute('height'),
      )

      const negEl = await mount<MoulBarChart>(html`
          <moul-bar-chart
            .data=${[{ name: 'Loss', v: -50 }, { name: 'Profit', v: 80 }]}
            .series=${[{ key: 'v', name: 'V' }]}
          ></moul-bar-chart>
        `)
      const negBars =
        negEl.shadowRoot!.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(negBars.length).toBe(2)
      expect(Number(negBars[0].getAttribute('height'))).toBeGreaterThan(0)
      expect(Number(negBars[1].getAttribute('height'))).toBeGreaterThan(0)

      const subnormalEl = await mount<MoulBarChart>(html`
          <moul-bar-chart
            .data=${[{ name: 'X', v: 0.00000001 }, { name: 'Y', v: 0.00000002 }]}
            .series=${[{ key: 'v', name: 'V' }]}
          ></moul-bar-chart>
        `)
      const subBars =
        subnormalEl.shadowRoot!.querySelectorAll<SVGRectElement>(
          'rect.chart-bar',
        )
      expect(subBars.length).toBe(2)
      expect(subBars[0].getAttribute('height')?.includes('NaN')).toBe(false)
    })

    it('CHART-BAR-09: Grid lines toggle (show-grid) and custom valueFormatter formatting ticks', async () => {
      const elGrid = await mount<MoulBarChart>(html`
          <moul-bar-chart
            .data=${sampleBarData}
            .series=${barSeries}
            show-grid
          ></moul-bar-chart>
        `)
      expect(
        elGrid.shadowRoot!.querySelectorAll('.grid-line').length,
      ).toBeGreaterThan(0)

      const elNoGrid = await mount<MoulBarChart>(html`
          <moul-bar-chart
            .data=${sampleBarData}
            .series=${barSeries}
            .showGrid=${false}
          ></moul-bar-chart>
        `)
      expect(elNoGrid.shadowRoot!.querySelectorAll('.grid-line').length).toBe(0)

      const elFmt = await mount<MoulBarChart>(html`
          <moul-bar-chart
            .data=${sampleBarData}
            .series=${barSeries}
            .valueFormatter=${(v: any) => `$${v}`}
          ></moul-bar-chart>
        `)
      const tickTexts = Array.from(
        elFmt.shadowRoot!.querySelectorAll('.axis-tick.y-tick'),
      ).map((t) => t.textContent?.trim())
      expect(tickTexts.some((t) => t?.startsWith('$'))).toBe(true)
    })

    it('CHART-BAR-10: Fast-check property test: arbitrary numerical matrices render valid non-NaN SVG rect elements', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 6 }),
              v1: fc.integer({ min: -500, max: 500 }),
              v2: fc.integer({ min: -500, max: 500 }),
            }),
            { minLength: 1, maxLength: 5 },
          ),
          async (matrix) => {
            const el = await mount<MoulBarChart>(html`
                <moul-bar-chart
                  .data=${matrix}
                  .series=${[
                    { key: 'v1', name: 'V1' },
                    { key: 'v2', name: 'V2' },
                  ]}
                ></moul-bar-chart>
              `)
            const rects =
              el.shadowRoot!.querySelectorAll<SVGRectElement>('rect.chart-bar')
            expect(rects.length).toBe(matrix.length * 2)
            rects.forEach((rect) => {
              expect(rect.getAttribute('x')?.includes('NaN')).toBe(false)
              expect(rect.getAttribute('y')?.includes('NaN')).toBe(false)
              expect(rect.getAttribute('width')?.includes('NaN')).toBe(false)
              expect(rect.getAttribute('height')?.includes('NaN')).toBe(false)
            })
            el.remove()
          },
        ),
        { numRuns: 10 },
      )
    })
  })

  // -------------------------------------------------------------------------
  // 2. MoulDoughnutChart
  // -------------------------------------------------------------------------
  describe('MoulDoughnutChart (`moul-doughnut-chart`)', () => {
    const sampleDoughnutData: DoughnutDataItem[] = [
      { name: 'Desktop', value: 400 },
      { name: 'Mobile', value: 300 },
      { name: 'Tablet', value: 200 },
      { name: 'Other', value: 100 },
    ]

    it('CHART-DGN-01: Custom Element registration and HTMLElementTagNameMap contract', () => {
      expect(customElements.get('moul-doughnut-chart')).toBeDefined()
      const element = document.createElement('moul-doughnut-chart')
      expect(element).toBeInstanceOf(MoulDoughnutChart)
      expect(element.tagName.toLowerCase()).toBe('moul-doughnut-chart')
    })

    it('CHART-DGN-02: Default property values', async () => {
      const el = await mount<MoulDoughnutChart>(
        html`<moul-doughnut-chart></moul-doughnut-chart>`,
      )
      expect(el.data).toEqual([])
      expect(el.innerRadiusRatio).toBe(0.6)
      expect(el.height).toBe(300)
      expect(el.centerLabel).toBe('')
      expect(el.centerSublabel).toBe('')
      expect(el.padAngle).toBe(0.02)
      expect(el.cornerRadius).toBe(4)
    })

    it('CHART-DGN-03: D3 Arc & Pie SVG slice generation with valid path data d', async () => {
      const el = await mount<MoulDoughnutChart>(html`
          <moul-doughnut-chart .data=${sampleDoughnutData}></moul-doughnut-chart>
        `)
      const slices = el.shadowRoot!.querySelectorAll<SVGPathElement>('.slice')
      expect(slices.length).toBe(4)

      slices.forEach((slice, idx) => {
        const d = slice.getAttribute('d')
        expect(d).toBeTruthy()
        expect(d?.startsWith('M')).toBe(true)
        expect(d?.endsWith('Z')).toBe(true)
        expect(d?.includes('NaN')).toBe(false)
        expect(slice.getAttribute('data-name')).toBe(
          sampleDoughnutData[idx].name,
        )
        expect(Number(slice.getAttribute('data-value'))).toBe(
          sampleDoughnutData[idx].value,
        )
      })
    })

    it('CHART-DGN-04: Modulo 8 color token mapping and custom slice color', async () => {
      const customData: DoughnutDataItem[] = [
        { name: 'Alpha', value: 10, color: '#ff0000' },
        { name: 'Beta', value: 20 },
        { name: 'Gamma', value: 30 },
      ]
      const el = await mount<MoulDoughnutChart>(html`
          <moul-doughnut-chart .data=${customData}></moul-doughnut-chart>
        `)
      const slices = el.shadowRoot!.querySelectorAll<SVGPathElement>('.slice')
      expect(slices[0].getAttribute('fill')).toBe('#ff0000')
      expect(slices[1].getAttribute('fill')).toBe('var(--color-chart-2)')
      expect(slices[2].getAttribute('fill')).toBe('var(--color-chart-3)')
    })

    it('CHART-DGN-05: Configurable inner-radius-ratio for pie vs doughnut', async () => {
      const pieEl = await mount<MoulDoughnutChart>(html`
          <moul-doughnut-chart .data=${sampleDoughnutData} inner-radius-ratio="0"></moul-doughnut-chart>
        `)
      expect(pieEl.effectiveInnerRadiusRatio).toBe(0)
      expect(pieEl.shadowRoot!.querySelector('.center-container')).toBeNull()

      const doughnutEl = await mount<MoulDoughnutChart>(html`
          <moul-doughnut-chart .data=${sampleDoughnutData} inner-radius-ratio="0.75"></moul-doughnut-chart>
        `)
      expect(doughnutEl.effectiveInnerRadiusRatio).toBe(0.75)
      expect(
        doughnutEl.shadowRoot!.querySelector('.center-container'),
      ).not.toBeNull()
    })

    it('CHART-DGN-06: Center slot and default center labels', async () => {
      const elLabels = await mount<MoulDoughnutChart>(html`
          <moul-doughnut-chart
            .data=${sampleDoughnutData}
            center-label="1,000"
            center-sublabel="Total Users"
          ></moul-doughnut-chart>
        `)
      const label = elLabels.shadowRoot!.querySelector('.center-label')
      const sublabel = elLabels.shadowRoot!.querySelector('.center-sublabel')
      expect(label?.textContent?.trim()).toBe('1,000')
      expect(sublabel?.textContent?.trim()).toBe('Total Users')

      const elSlot = await mount<MoulDoughnutChart>(html`
          <moul-doughnut-chart .data=${sampleDoughnutData}>
            <div slot="center" id="custom-kpi">Slotted KPI</div>
          </moul-doughnut-chart>
        `)
      const slot = elSlot.shadowRoot!.querySelector('slot[name="center"]')
      expect(slot).not.toBeNull()
    })

    it('CHART-DGN-07: Interactive slice hover expansion and point-hover event dispatch', async () => {
      const el = await mount<MoulDoughnutChart>(html`
          <moul-doughnut-chart .data=${sampleDoughnutData}></moul-doughnut-chart>
        `)
      let hoveredDetail: PointHoverDetail | null = null
      el.addEventListener('point-hover', (e: Event) => {
        hoveredDetail = (e as CustomEvent<PointHoverDetail>).detail
      })

      const slices = el.shadowRoot!.querySelectorAll<SVGPathElement>('.slice')
      const initialD = slices[0].getAttribute('d')

      slices[0].dispatchEvent(
        new PointerEvent('pointerenter', { bubbles: true }),
      )
      await awaitNestedUpdates(el)

      expect(hoveredDetail).not.toBeNull()
      expect(hoveredDetail?.label).toBe('Desktop')
      expect(hoveredDetail?.value).toBe(400)
      expect(Number.isFinite(hoveredDetail?.x)).toBe(true)
      expect(Number.isFinite(hoveredDetail?.y)).toBe(true)
      expect(slices[0].classList.contains('is-active')).toBe(true)
      expect(slices[0].getAttribute('d')).not.toBe(initialD)

      let leaveFired = false
      el.addEventListener('point-leave', () => {
        leaveFired = true
      })
      slices[0].dispatchEvent(
        new PointerEvent('pointerleave', { bubbles: true }),
      )
      await awaitNestedUpdates(el)

      expect(leaveFired).toBe(true)
      expect(slices[0].classList.contains('is-active')).toBe(false)
    })

    it('CHART-DGN-08: Domain safeguards: empty, all-zero, and single slice', async () => {
      const emptyEl = await mount<MoulDoughnutChart>(
        html`<moul-doughnut-chart></moul-doughnut-chart>`,
      )
      expect(
        emptyEl.shadowRoot!.querySelector('slot[name="empty"]'),
      ).not.toBeNull()

      const zeroEl = await mount<MoulDoughnutChart>(html`
          <moul-doughnut-chart .data=${[{ name: 'A', value: 0 }, { name: 'B', value: 0 }]}></moul-doughnut-chart>
        `)
      expect(zeroEl.shadowRoot!.querySelector('.empty-track')).not.toBeNull()

      const singleEl = await mount<MoulDoughnutChart>(html`
          <moul-doughnut-chart .data=${[{ name: 'Solo', value: 100 }]}></moul-doughnut-chart>
        `)
      const singleSlice =
        singleEl.shadowRoot!.querySelector<SVGPathElement>('.slice')
      expect(singleSlice).not.toBeNull()
      const d = singleSlice!.getAttribute('d')
      expect(d?.includes('NaN')).toBe(false)
      expect(d?.startsWith('M')).toBe(true)
    })

    it('CHART-DGN-09: Fast-check property test: path data d starts with M and never contains NaN', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 10 }),
              value: fc.integer({ min: 1, max: 1000 }),
            }),
            { minLength: 1, maxLength: 8 },
          ),
          async (dataItems) => {
            const el = await mount<MoulDoughnutChart>(html`
                <moul-doughnut-chart .data=${dataItems}></moul-doughnut-chart>
              `)
            const slices =
              el.shadowRoot!.querySelectorAll<SVGPathElement>('.slice')
            expect(slices.length).toBe(dataItems.length)
            slices.forEach((slice) => {
              const d = slice.getAttribute('d')
              expect(d).toBeTruthy()
              expect(d?.startsWith('M')).toBe(true)
              expect(d?.includes('NaN')).toBe(false)
            })
            el.remove()
          },
        ),
        { numRuns: 10 },
      )
    })
  })

  // -------------------------------------------------------------------------
  // 3. MoulTopList
  // -------------------------------------------------------------------------
  describe('MoulTopList (`moul-top-list`)', () => {
    const sampleTopListData: TopListItem[] = [
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
      expect(instance.tagName.toLowerCase()).toBe('moul-top-list')
    })

    it('CHART-TOP-02: Renders list of ranked items with labels, tracks, bars, and formatted values', async () => {
      const el = await mount<MoulTopList>(html`
          <moul-top-list .data=${sampleTopListData}></moul-top-list>
        `)
      const items = el.shadowRoot?.querySelectorAll('.item')
      expect(items?.length).toBe(5)
      expect(items?.[0].querySelector('.label')?.textContent?.trim()).toBe(
        'United States',
      )
      expect(items?.[0].querySelector('.value')?.textContent?.trim()).toBe(
        '4,500',
      )
    })

    it('CHART-TOP-03: Auto-calculates proportional bar widths based on maximum data value', async () => {
      const el = await mount<MoulTopList>(html`
          <moul-top-list .data=${sampleTopListData}></moul-top-list>
        `)
      const bars = el.shadowRoot?.querySelectorAll<HTMLElement>('.bar')
      expect(bars?.[0].style.width).toBe('100%')
      const expectedGermany = (2800 / 4500) * 100
      expect(parseFloat(bars?.[1].style.width || '0')).toBeCloseTo(
        expectedGermany,
        1,
      )
    })

    it('CHART-TOP-04: Explicit max or maxValue scales bar widths proportionally', async () => {
      const el = await mount<MoulTopList>(html`
          <moul-top-list .data=${sampleTopListData} .max=${9000}></moul-top-list>
        `)
      const bars = el.shadowRoot?.querySelectorAll<HTMLElement>('.bar')
      expect(bars?.[0].style.width).toBe('50%')
    })

    it('CHART-TOP-05: max-items limits rendered rows count', async () => {
      const el = await mount<MoulTopList>(html`
          <moul-top-list .data=${sampleTopListData} .maxItems=${3}></moul-top-list>
        `)
      const items = el.shadowRoot?.querySelectorAll('.item')
      expect(items?.length).toBe(3)
    })

    it('CHART-TOP-06: show-rank displays 1-based numerical badges and respects toggling', async () => {
      const el = await mount<MoulTopList>(html`
          <moul-top-list .data=${sampleTopListData} show-rank></moul-top-list>
        `)
      const ranks = el.shadowRoot?.querySelectorAll('.rank')
      expect(ranks?.length).toBe(5)
      expect(ranks?.[0].textContent?.trim()).toBe('1')
      expect(ranks?.[1].textContent?.trim()).toBe('2')
      expect(ranks?.[4].textContent?.trim()).toBe('5')

      el.showRank = false
      await awaitNestedUpdates(el)
      expect(el.shadowRoot?.querySelectorAll('.rank').length).toBe(0)
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
      expect(['#ff0000', 'rgb(255, 0, 0)']).toContain(
        bars?.[1].style.backgroundColor,
      )
      expect(bars?.[2].style.backgroundColor).toContain('var(--color-chart-3)')
    })

    it('CHART-TOP-08: custom valueFormatter formats displayed values and ARIA text', async () => {
      const el = await mount<MoulTopList>(html`
          <moul-top-list
            .data=${sampleTopListData}
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
          <moul-top-list .data=${sampleTopListData} interactive></moul-top-list>
        `)
      const spy = vi.fn()
      el.addEventListener('item-press', spy)

      const firstItem = el.shadowRoot?.querySelector<HTMLElement>('.item')
      firstItem?.click()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].detail).toEqual({
        item: sampleTopListData[0],
        index: 0,
      })

      firstItem?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      expect(spy).toHaveBeenCalledTimes(2)

      firstItem?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      expect(spy).toHaveBeenCalledTimes(3)
    })

    it('CHART-TOP-10: Accessible ARIA roles (list, listitem, progressbar, values)', async () => {
      const el = await mount<MoulTopList>(html`
          <moul-top-list .data=${sampleTopListData}></moul-top-list>
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
      const emptyEl = await mount<MoulTopList>(html`
          <moul-top-list .data=${[]}>
            <div slot="empty" id="custom-empty">Empty Dashboard</div>
          </moul-top-list>
        `)
      expect(
        emptyEl.shadowRoot?.querySelector('slot[name="empty"]'),
      ).toBeTruthy()
      expect(emptyEl.shadowRoot?.querySelectorAll('.item').length).toBe(0)

      const zeroEl = await mount<MoulTopList>(html`
          <moul-top-list .data=${[{ label: 'Zero', value: 0 }]}></moul-top-list>
        `)
      const zeroBar = zeroEl.shadowRoot?.querySelector<HTMLElement>('.bar')
      expect(zeroBar?.style.width).toBe('0%')

      const negEl = await mount<MoulTopList>(html`
          <moul-top-list .data=${[{ label: 'Loss', value: -100 }]}></moul-top-list>
        `)
      const negBar = negEl.shadowRoot?.querySelector<HTMLElement>('.bar')
      expect(negBar?.style.width).toBe('0%')
      expect(
        negEl.shadowRoot?.querySelector('.value')?.textContent?.trim(),
      ).toBe('-100')

      const missingLabelEl = await mount<MoulTopList>(html`
          <moul-top-list .data=${[{ value: 50 } as any]}></moul-top-list>
        `)
      expect(
        missingLabelEl.shadowRoot?.querySelector('.label')?.textContent?.trim(),
      ).toBe('Item 1')
    })
  })

  // -------------------------------------------------------------------------
  // 4. Integration Tests with Container & Tooltip
  // -------------------------------------------------------------------------
  describe('Integration: Discrete & Categorical Charts with Container & Tooltip', () => {
    it('CHART-INT-04: Slotted MoulBarChart in MoulChartContainer coordinates with MoulChartTooltip', async () => {
      const quarterlyBarData = [
        { quarter: 'Q1', revenue: 150 },
        { quarter: 'Q2', revenue: 250 },
      ]
      const container = await mount<MoulChartContainer>(html`
          <moul-chart-container title="Quarterly Bars">
            <div style="position: relative; width: 100%; height: 300px;">
              <moul-bar-chart
                id="bar-chart-instance"
                .data=${quarterlyBarData}
                x-key="quarter"
                .series=${[{ key: 'revenue', name: 'Revenue', color: 'var(--color-chart-1)' }]}
              ></moul-bar-chart>
              <moul-chart-tooltip id="bar-tooltip-instance"></moul-chart-tooltip>
            </div>
          </moul-chart-container>
        `)

      const barChart = container.querySelector<MoulBarChart>(
        '#bar-chart-instance',
      )!
      const tooltip = container.querySelector<MoulChartTooltip>(
        '#bar-tooltip-instance',
      )!
      expect(barChart).toBeTruthy()
      expect(tooltip).toBeTruthy()
      expect(tooltip.isOpen).toBe(false)

      barChart.addEventListener('point-hover', (e: Event) => {
        const detail = (e as CustomEvent<PointHoverDetail>).detail
        tooltip.show({
          label: detail.label,
          value: `$${detail.value}`,
          x: detail.x,
          y: detail.y,
        })
      })

      const bar =
        barChart.shadowRoot?.querySelector<SVGRectElement>('rect.chart-bar')
      expect(bar).toBeTruthy()

      bar!.dispatchEvent(
        new PointerEvent('pointerenter', { bubbles: true, composed: true }),
      )
      await awaitNestedUpdates(container)

      expect(tooltip.isOpen).toBe(true)
      expect(
        tooltip.shadowRoot?.querySelector('[part="label"]')?.textContent,
      ).toContain('Q1')
      expect(
        tooltip.shadowRoot?.querySelector('[part="value"]')?.textContent,
      ).toContain('$150')

      tooltip.hide()
      await awaitNestedUpdates(container)
      expect(tooltip.isOpen).toBe(false)
    })

    it('CHART-INT-05: Slotted MoulDoughnutChart in MoulChartContainer coordinates with MoulChartTooltip', async () => {
      const doughnutData: DoughnutDataItem[] = [
        { name: 'Direct', value: 500 },
        { name: 'Referral', value: 300 },
      ]
      const container = await mount<MoulChartContainer>(html`
          <moul-chart-container title="Traffic Breakdown">
            <div style="position: relative; width: 100%; height: 300px;">
              <moul-doughnut-chart
                id="doughnut-chart-instance"
                .data=${doughnutData}
              ></moul-doughnut-chart>
              <moul-chart-tooltip id="doughnut-tooltip-instance"></moul-chart-tooltip>
            </div>
          </moul-chart-container>
        `)

      const doughnutChart = container.querySelector<MoulDoughnutChart>(
        '#doughnut-chart-instance',
      )!
      const tooltip = container.querySelector<MoulChartTooltip>(
        '#doughnut-tooltip-instance',
      )!
      expect(doughnutChart).toBeTruthy()
      expect(tooltip).toBeTruthy()
      expect(tooltip.isOpen).toBe(false)

      doughnutChart.addEventListener('point-hover', (e: Event) => {
        const detail = (e as CustomEvent<PointHoverDetail>).detail
        tooltip.show({
          label: detail.label,
          value: `${detail.value} visits`,
          x: detail.x,
          y: detail.y,
        })
      })

      const slice =
        doughnutChart.shadowRoot?.querySelector<SVGPathElement>('.slice')
      expect(slice).toBeTruthy()

      slice!.dispatchEvent(
        new PointerEvent('pointerenter', { bubbles: true, composed: true }),
      )
      await awaitNestedUpdates(container)

      expect(tooltip.isOpen).toBe(true)
      expect(
        tooltip.shadowRoot?.querySelector('[part="label"]')?.textContent,
      ).toContain('Direct')
      expect(
        tooltip.shadowRoot?.querySelector('[part="value"]')?.textContent,
      ).toContain('500 visits')

      tooltip.hide()
      await awaitNestedUpdates(container)
      expect(tooltip.isOpen).toBe(false)
    })
  })

  describe('Milestone 4: Companion & Metric Indicators Test Suite', () => {
    describe('MoulStat (`moul-stat`)', () => {
      it('CHART-STAT-01: Custom Element registration and HTMLElementTagNameMap contract', async () => {
        const el = await mount<MoulStat>(html`<moul-stat></moul-stat>`)
        expect(el).toBeInstanceOf(MoulStat)
        expect(customElements.get('moul-stat')).toBeDefined()
      })

      it('CHART-STAT-02: Label, prefix, suffix, and spring animated display value', async () => {
        const el = await mount<MoulStat>(html`
          <moul-stat
            label="Total Revenue"
            .value=${1250}
            prefix="$"
            suffix="USD"
          ></moul-stat>
        `)
        expect(
          el.shadowRoot?.querySelector('[part="label"]')?.textContent,
        ).toBe('Total Revenue')
        expect(
          el.shadowRoot?.querySelector('[part="prefix"]')?.textContent,
        ).toBe('$')
        expect(
          el.shadowRoot?.querySelector('[part="suffix"]')?.textContent,
        ).toBe('USD')
        expect(
          el.shadowRoot?.querySelector('[part="value"]')?.textContent,
        ).toBe('1,250')
      })

      it('CHART-STAT-03: Reactive value updates', async () => {
        const el = await mount<MoulStat>(
          html`<moul-stat label="Users" .value=${100}></moul-stat>`,
        )
        expect(
          el.shadowRoot?.querySelector('[part="value"]')?.textContent,
        ).toBe('100')

        el.value = 500
        await awaitNestedUpdates(el)
        expect(el.targetValue).toBe(500)

        el.reset(500)
        await awaitNestedUpdates(el)
        expect(
          el.shadowRoot?.querySelector('[part="value"]')?.textContent,
        ).toBe('500')
      })

      it('CHART-STAT-04: Trend badge rendering (up, down, neutral) and trendValue', async () => {
        const el = await mount<MoulStat>(html`
          <moul-stat
            label="Conversion Rate"
            .value=${3.2}
            trend="up"
            trend-value="+14.2%"
          ></moul-stat>
        `)
        const badge = el.shadowRoot?.querySelector('.trend-badge')
        expect(badge).toBeTruthy()
        expect(badge?.classList.contains('trend-up')).toBe(true)
        expect(badge?.textContent).toContain('+14.2%')

        el.trend = 'down'
        el.trendValue = '-5.1%'
        await awaitNestedUpdates(el)
        const updatedBadge = el.shadowRoot?.querySelector('.trend-badge')
        expect(updatedBadge?.classList.contains('trend-down')).toBe(true)
        expect(updatedBadge?.textContent).toContain('-5.1%')
      })

      it('CHART-STAT-05: Tone and variant reflection', async () => {
        const el = await mount<MoulStat>(html`
          <moul-stat
            label="Success Metric"
            .value=${99}
            tone="success"
            variant="flat"
          ></moul-stat>
        `)
        expect(el.getAttribute('tone')).toBe('success')
        expect(el.getAttribute('variant')).toBe('flat')
      })

      it('CHART-STAT-06: Custom valueFormatter', async () => {
        const el = await mount<MoulStat>(html`
          <moul-stat
            label="File Size"
            .value=${1024}
            .valueFormatter=${(v: number) => `${v / 1024} MB`}
          ></moul-stat>
        `)
        expect(
          el.shadowRoot?.querySelector('[part="value"]')?.textContent,
        ).toBe('1 MB')
      })

      it('CHART-STAT-07: Slots (icon and footer)', async () => {
        const el = await mount<MoulStat>(html`
          <moul-stat label="Downloads" .value=${50}>
            <span slot="icon" id="custom-icon">★</span>
            <div slot="footer" id="custom-footer">Updated 5m ago</div>
          </moul-stat>
        `)
        const iconSlot = el.shadowRoot?.querySelector('slot[name="icon"]')
        const footerSlot = el.shadowRoot?.querySelector('slot[name="footer"]')
        expect(iconSlot).toBeTruthy()
        expect(footerSlot).toBeTruthy()
      })

      it('CHART-STAT-08: Sparkline SVG rendering with D3 scale and line generator', async () => {
        const el = await mount<MoulStat>(html`
          <moul-stat
            label="Weekly Signups"
            .value=${42}
            .sparklineData=${[10, 15, 8, 22, 35, 42]}
          ></moul-stat>
        `)
        const sparkline = el.shadowRoot?.querySelector('svg.sparkline-svg')
        expect(sparkline).toBeTruthy()
        const path = sparkline?.querySelector('path')
        expect(path?.getAttribute('d')).toMatch(/^M/)
        expect(path?.getAttribute('d')).not.toContain('NaN')
      })
    })

    describe('MoulPercentageBar (`moul-percentage-bar`)', () => {
      it('CHART-PBAR-01: Custom Element registration and HTMLElementTagNameMap contract', async () => {
        const el = await mount<MoulPercentageBar>(
          html`<moul-percentage-bar></moul-percentage-bar>`,
        )
        expect(el).toBeInstanceOf(MoulPercentageBar)
        expect(customElements.get('moul-percentage-bar')).toBeDefined()
      })

      it('CHART-PBAR-02: Accessible ARIA attributes', async () => {
        const el = await mount<MoulPercentageBar>(html`
          <moul-percentage-bar label="Disk Space" .value=${75}></moul-percentage-bar>
        `)
        expect(el.getAttribute('role')).toBe('progressbar')
        expect(el.getAttribute('aria-valuenow')).toBe('75')
        expect(el.getAttribute('aria-valuemin')).toBe('0')
        expect(el.getAttribute('aria-valuemax')).toBe('100')
        expect(el.getAttribute('aria-label')).toBe('Disk Space')
      })

      it('CHART-PBAR-03: Clamping values between 0 and 100', async () => {
        const el = await mount<MoulPercentageBar>(html`
          <moul-percentage-bar .value=${150}></moul-percentage-bar>
        `)
        expect(el.getAttribute('aria-valuenow')).toBe('100')
        const fill = el.shadowRoot?.querySelector('.bar-fill')
        expect(fill?.getAttribute('width')).toBe('100')

        el.value = -20
        await awaitNestedUpdates(el)
        expect(el.getAttribute('aria-valuenow')).toBe('0')
        expect(
          el.shadowRoot?.querySelector('.bar-fill')?.getAttribute('width'),
        ).toBe('0')
      })

      it('CHART-PBAR-04: SVG track and fill rect generation with D3 scaleLinear', async () => {
        const el = await mount<MoulPercentageBar>(html`
          <moul-percentage-bar .value=${60}></moul-percentage-bar>
        `)
        const track = el.shadowRoot?.querySelector('.bar-track')
        const fill = el.shadowRoot?.querySelector('.bar-fill')
        expect(track).toBeTruthy()
        expect(fill).toBeTruthy()
        expect(track?.getAttribute('width')).toBe('100')
        expect(fill?.getAttribute('width')).toBe('60')
      })

      it('CHART-PBAR-05: Sizes (sm, md, lg) and tones', async () => {
        const el = await mount<MoulPercentageBar>(html`
          <moul-percentage-bar size="lg" tone="success" .value=${85}></moul-percentage-bar>
        `)
        expect(el.getAttribute('size')).toBe('lg')
        expect(el.getAttribute('tone')).toBe('success')
      })

      it('CHART-PBAR-06: Custom valueFormatter and color override', async () => {
        const el = await mount<MoulPercentageBar>(html`
          <moul-percentage-bar
            .value=${40}
            color="#ff5500"
            .valueFormatter=${(v: number) => `${v} of 100 tasks`}
          ></moul-percentage-bar>
        `)
        expect(el.shadowRoot?.querySelector('.bar-value')?.textContent).toBe(
          '40 of 100 tasks',
        )
        const container = el.shadowRoot?.querySelector('.bar-container')
        expect(container?.getAttribute('style')).toContain(
          '--bar-color: #ff5500',
        )
      })
    })

    describe('MoulPercentageCircle (`moul-percentage-circle`)', () => {
      it('CHART-PCIR-01: Custom Element registration and HTMLElementTagNameMap contract', async () => {
        const el = await mount<MoulPercentageCircle>(
          html`<moul-percentage-circle></moul-percentage-circle>`,
        )
        expect(el).toBeInstanceOf(MoulPercentageCircle)
        expect(customElements.get('moul-percentage-circle')).toBeDefined()
      })

      it('CHART-PCIR-02: Accessible ARIA attributes', async () => {
        const el = await mount<MoulPercentageCircle>(html`
          <moul-percentage-circle label="Battery" .value=${80}></moul-percentage-circle>
        `)
        expect(el.getAttribute('role')).toBe('progressbar')
        expect(el.getAttribute('aria-valuenow')).toBe('80')
        expect(el.getAttribute('aria-valuemin')).toBe('0')
        expect(el.getAttribute('aria-valuemax')).toBe('100')
        expect(el.getAttribute('aria-label')).toBe('Battery')
      })

      it('CHART-PCIR-03: D3 Arc SVG path generation for track and progress fill', async () => {
        const el = await mount<MoulPercentageCircle>(html`
          <moul-percentage-circle .value=${50}></moul-percentage-circle>
        `)
        const track = el.shadowRoot?.querySelector('.circle-track')
        const fill = el.shadowRoot?.querySelector('.circle-fill')
        expect(track).toBeTruthy()
        expect(fill).toBeTruthy()
        expect(track?.getAttribute('d')).toMatch(/^M/)
        expect(fill?.getAttribute('d')).toMatch(/^M/)
        expect(track?.getAttribute('d')).not.toContain('NaN')
        expect(fill?.getAttribute('d')).not.toContain('NaN')
      })

      it('CHART-PCIR-04: Size (sm, md, lg, or number) and stroke width configuration', async () => {
        const el = await mount<MoulPercentageCircle>(html`
          <moul-percentage-circle size="lg" stroke-width="12" .value=${60}></moul-percentage-circle>
        `)
        const wrapper = el.shadowRoot?.querySelector(
          '.circle-wrapper',
        ) as HTMLElement
        expect(wrapper.style.width).toBe('120px')
        expect(wrapper.style.height).toBe('120px')

        el.size = 100
        await awaitNestedUpdates(el)
        expect(wrapper.style.width).toBe('100px')
        expect(wrapper.style.height).toBe('100px')
      })

      it('CHART-PCIR-05: Clamping value to [0, 100] and handling 0% fill', async () => {
        const el = await mount<MoulPercentageCircle>(html`
          <moul-percentage-circle .value=${0}></moul-percentage-circle>
        `)
        expect(el.getAttribute('aria-valuenow')).toBe('0')
        expect(el.shadowRoot?.querySelector('.circle-fill')).toBeNull()

        el.value = 120
        await awaitNestedUpdates(el)
        expect(el.getAttribute('aria-valuenow')).toBe('100')
        const fill = el.shadowRoot?.querySelector('.circle-fill')
        expect(fill).toBeTruthy()
        expect(fill?.getAttribute('d')).not.toContain('NaN')
      })

      it('CHART-PCIR-06: Center slot, value text, and label rendering', async () => {
        const el = await mount<MoulPercentageCircle>(html`
          <moul-percentage-circle label="Completed" .value=${92}></moul-percentage-circle>
        `)
        expect(el.shadowRoot?.querySelector('.circle-value')?.textContent).toBe(
          '92%',
        )
        expect(el.shadowRoot?.querySelector('.circle-label')?.textContent).toBe(
          'Completed',
        )
      })

      it('CHART-PCIR-07: Fast-check property test: path data d starts with M and never contains NaN', async () => {
        await fc.assert(
          fc.asyncProperty(fc.float({ min: -100, max: 200 }), async (val) => {
            const el = await mount<MoulPercentageCircle>(html`
              <moul-percentage-circle .value=${val}></moul-percentage-circle>
            `)
            const track = el.shadowRoot?.querySelector('.circle-track')
            expect(track?.getAttribute('d')).toMatch(/^M/)
            expect(track?.getAttribute('d')).not.toContain('NaN')

            const fill = el.shadowRoot?.querySelector('.circle-fill')
            if (fill) {
              expect(fill.getAttribute('d')).toMatch(/^M/)
              expect(fill.getAttribute('d')).not.toContain('NaN')
            }
          }),
          { numRuns: 20 },
        )
      })
    })
  })
})
