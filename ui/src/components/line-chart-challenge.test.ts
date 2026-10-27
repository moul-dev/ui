import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import './LineChart/LineChart'
import type { MoulLineChart, PointHoverDetail } from '../index'

// Universal Lit update helper
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

// Helper to extract path data `d` from MoulLineChart
function getChartPathD(chart: MoulLineChart, seriesKey?: string): string {
  const selector = seriesKey
    ? `path.series-path[data-series-key="${seriesKey}"]`
    : 'path.series-path, path.chart-line'
  const path = chart.shadowRoot?.querySelector<SVGPathElement>(selector)
  return path?.getAttribute('d') ?? ''
}

// Strict SVG path validator: checks for NaN, undefined, null, and valid SVG commands
function assertValidSvgPath(d: string, allowEmpty = false): void {
  if (!d && allowEmpty) return

  expect(d).toBeTruthy()
  expect(d).not.toMatch(/NaN/i)
  expect(d).not.toMatch(/undefined/i)
  expect(d).not.toMatch(/null/i)
  expect(d).not.toMatch(/Infinity/i)

  // Must start with Move command
  expect(d.trim().startsWith('M')).toBe(true)

  // Tokenize and verify all numbers are finite
  const numbers = d.match(/[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g)
  if (numbers) {
    for (const numStr of numbers) {
      const val = parseFloat(numStr)
      expect(Number.isFinite(val)).toBe(true)
    }
  }
}

describe('Adversarial Stress Suite: MoulLineChart (`moul-line-chart`)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  // =========================================================================
  // 1. Pathological Data: 0 Points (Empty / Null / Undefined)
  // =========================================================================
  describe('Pathological Data: 0 Points (Empty, Null, Undefined)', () => {
    it('renders empty state slot with fallback message when data is an empty array', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${[]}
          x-key="name"
          .series=${[{ key: 'value' }]}
        ></moul-line-chart>
      `)

      const emptySlot = chart.shadowRoot?.querySelector('slot[name="empty"]')
      expect(emptySlot).toBeTruthy()
      expect(chart.shadowRoot?.querySelector('svg')).toBeNull()
      expect(
        chart.shadowRoot?.querySelector('.empty-message')?.textContent,
      ).toBe('No data available')
    })

    it('renders empty state without runtime error when data is null', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${null as any}
          x-key="name"
          .series=${[{ key: 'value' }]}
        ></moul-line-chart>
      `)

      expect(chart.shadowRoot?.querySelector('[part="empty"]')).toBeTruthy()
      expect(chart.shadowRoot?.querySelector('svg')).toBeNull()
    })

    it('renders empty state without runtime error when data is undefined', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${undefined as any}
          x-key="name"
          .series=${[{ key: 'value' }]}
        ></moul-line-chart>
      `)

      expect(chart.shadowRoot?.querySelector('[part="empty"]')).toBeTruthy()
      expect(chart.shadowRoot?.querySelector('svg')).toBeNull()
    })

    it('reactively switches between populated and empty states', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${[{ name: 'A', value: 100 }, { name: 'B', value: 200 }]}
          x-key="name"
          .series=${[{ key: 'value' }]}
        ></moul-line-chart>
      `)

      expect(chart.shadowRoot?.querySelector('svg')).toBeTruthy()
      expect(chart.shadowRoot?.querySelector('[part="empty"]')).toBeNull()

      // Transition to empty
      chart.data = []
      await chart.updateComplete

      expect(chart.shadowRoot?.querySelector('svg')).toBeNull()
      expect(chart.shadowRoot?.querySelector('[part="empty"]')).toBeTruthy()

      // Transition back to populated
      chart.data = [
        { name: 'Jan', value: 50 },
        { name: 'Feb', value: 75 },
      ]
      await chart.updateComplete

      expect(chart.shadowRoot?.querySelector('svg')).toBeTruthy()
      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)
    })
  })

  // =========================================================================
  // 2. Pathological Data: 1 Point
  // =========================================================================
  describe('Pathological Data: 1 Point', () => {
    it('renders a single point with valid move command path and finite coordinates', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${[{ period: 'Q1', revenue: 500 }]}
          x-key="period"
          .series=${[{ key: 'revenue' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)
      expect(pathD.startsWith('M')).toBe(true)

      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(1)
      const cx = parseFloat(circles![0].getAttribute('cx')!)
      const cy = parseFloat(circles![0].getAttribute('cy')!)
      expect(Number.isFinite(cx)).toBe(true)
      expect(Number.isFinite(cy)).toBe(true)
    })

    it('renders single point with value 0 without emitting NaN', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${[{ period: 'Zero', revenue: 0 }]}
          x-key="period"
          .series=${[{ key: 'revenue' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)

      const circle = chart.shadowRoot?.querySelector('svg circle')
      expect(circle).toBeTruthy()
      const cy = parseFloat(circle!.getAttribute('cy')!)
      expect(Number.isFinite(cy)).toBe(true)
    })

    it('renders single point with negative value without emitting NaN', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${[{ period: 'Negative', revenue: -150 }]}
          x-key="period"
          .series=${[{ key: 'revenue' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)

      const circle = chart.shadowRoot?.querySelector('svg circle')
      expect(circle).toBeTruthy()
      const cy = parseFloat(circle!.getAttribute('cy')!)
      expect(Number.isFinite(cy)).toBe(true)
    })

    it('dispatches point-hover event when hovering over single point circle', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${[{ period: 'Solo', val: 777 }]}
          x-key="period"
          .series=${[{ key: 'val', name: 'Metric' }]}
        ></moul-line-chart>
      `)

      let hoveredDetail: PointHoverDetail | null = null
      chart.addEventListener('point-hover', (e: Event) => {
        hoveredDetail = (e as CustomEvent<PointHoverDetail>).detail
      })

      const circle = chart.shadowRoot?.querySelector('svg circle')
      expect(circle).toBeTruthy()

      circle!.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
      await chart.updateComplete

      expect(hoveredDetail).not.toBeNull()
      expect(hoveredDetail!.value).toBe(777)
      expect(hoveredDetail!.label).toBe('Solo')
      expect(Number.isFinite(hoveredDetail!.x)).toBe(true)
      expect(Number.isFinite(hoveredDetail!.y)).toBe(true)
    })
  })

  // =========================================================================
  // 3. Pathological Data: 2 Identical Points (Same X, Same Y, or Both)
  // =========================================================================
  describe('Pathological Data: Identical Points & Zero Delta', () => {
    it('handles 2 identical points with same X key and same Y value', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${[
            { item: 'Duplicate', score: 85 },
            { item: 'Duplicate', score: 85 },
          ]}
          x-key="item"
          .series=${[{ key: 'score' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)

      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(2)
      for (const circle of Array.from(circles!)) {
        const cx = parseFloat(circle.getAttribute('cx')!)
        const cy = parseFloat(circle.getAttribute('cy')!)
        expect(Number.isFinite(cx)).toBe(true)
        expect(Number.isFinite(cy)).toBe(true)
      }
    })

    it('handles 2 identical X keys with different Y values (vertical coincident line)', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${[
            { item: 'SameKey', score: 10 },
            { item: 'SameKey', score: 90 },
          ]}
          x-key="item"
          .series=${[{ key: 'score' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)
    })

    it('handles 2 different X keys with identical Y values (flat horizontal line)', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${[{ item: 'Step1', score: 42 }, { item: 'Step2', score: 42 }]}
          x-key="item"
          .series=${[{ key: 'score' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)

      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(2)
      const cy1 = parseFloat(circles![0].getAttribute('cy')!)
      const cy2 = parseFloat(circles![1].getAttribute('cy')!)
      expect(cy1).toBe(cy2)
      expect(Number.isFinite(cy1)).toBe(true)
    })

    it('handles 5 consecutive identical points without mathematical breakdown', async () => {
      const identicalFive = Array.from({ length: 5 }, (_, i) => ({
        step: `S${i}`,
        val: 100,
      }))
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${identicalFive}
          x-key="step"
          .series=${[{ key: 'val' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)

      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(5)
    })
  })

  // =========================================================================
  // 4. Pathological Data: All Zero Y Values
  // =========================================================================
  describe('Pathological Data: All Zero Y Values', () => {
    it('safely scales and renders when all Y values across all points are zero', async () => {
      const zeroData = [
        { period: 'Jan', count: 0 },
        { period: 'Feb', count: 0 },
        { period: 'Mar', count: 0 },
        { period: 'Apr', count: 0 },
      ]
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${zeroData}
          x-key="period"
          .series=${[{ key: 'count' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)

      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(4)

      for (const circle of Array.from(circles!)) {
        const cy = parseFloat(circle.getAttribute('cy')!)
        expect(Number.isFinite(cy)).toBe(true)
      }

      // Axis lines and ticks should be rendered with finite coordinates
      const axisLine = chart.shadowRoot?.querySelector('line.axis-line')
      expect(axisLine).toBeTruthy()
      expect(Number.isFinite(parseFloat(axisLine!.getAttribute('y1')!))).toBe(
        true,
      )
    })

    it('EMPIRICAL VERIFICATION: renders subnormal floating point numbers near 0 without RangeError or NaN', async () => {
      const subnormalData = [
        { period: 'A', val: -5e-324 },
        { period: 'B', val: 5e-324 },
      ]

      let thrownError: Error | null = null
      let chart: MoulLineChart | null = null
      try {
        chart = await mount<MoulLineChart>(html`
          <moul-line-chart
            .data=${subnormalData}
            x-key="period"
            .series=${[{ key: 'val' }]}
          ></moul-line-chart>
        `)
      } catch (err: any) {
        thrownError = err
      }

      expect(thrownError).toBeNull()
      expect(chart).not.toBeNull()

      const d = getChartPathD(chart!)
      assertValidSvgPath(d)

      // Circles must be rendered with finite coordinates
      const circles = chart!.shadowRoot?.querySelectorAll('circle.point-marker')
      expect(circles?.length).toBe(2)
      for (const circle of Array.from(circles ?? [])) {
        const cy = parseFloat(circle.getAttribute('cy') ?? 'NaN')
        const cx = parseFloat(circle.getAttribute('cx') ?? 'NaN')
        expect(Number.isFinite(cx)).toBe(true)
        expect(Number.isFinite(cy)).toBe(true)
      }
    })

    it('EMPIRICAL VERIFICATION: stress-tests exact dispatch counterexample [[{"x":" ","val":5e-324},{"x":" ","val":-5e-324}]]', async () => {
      const counterexampleData = [
        { x: ' ', val: 5e-324 },
        { x: ' ', val: -5e-324 },
      ]

      let thrownError: Error | null = null
      let chart: MoulLineChart | null = null
      try {
        chart = await mount<MoulLineChart>(html`
          <moul-line-chart
            .data=${counterexampleData}
            x-key="x"
            .series=${[{ key: 'val' }]}
          ></moul-line-chart>
        `)
      } catch (err: any) {
        thrownError = err
      }

      expect(thrownError).toBeNull()
      expect(chart).not.toBeNull()

      const d = getChartPathD(chart!)
      assertValidSvgPath(d)
      expect(d.startsWith('M')).toBe(true)
      expect(d.includes('NaN')).toBe(false)
      expect(d.includes('Infinity')).toBe(false)

      const circles = chart!.shadowRoot?.querySelectorAll('circle.point-marker')
      expect(circles?.length).toBe(2)
      for (const circle of Array.from(circles ?? [])) {
        const cy = parseFloat(circle.getAttribute('cy') ?? 'NaN')
        expect(Number.isFinite(cy)).toBe(true)
      }
    })

    it('EMPIRICAL VERIFICATION: stress-tests diverse subnormal arrays (identical, single-sided, and multi-point)', async () => {
      const subnormalSuites = [
        // Identical positive subnormals
        [
          { x: 'P1', val: 5e-324 },
          { x: 'P2', val: 5e-324 },
        ],
        // Identical negative subnormals
        [
          { x: 'N1', val: -5e-324 },
          { x: 'N2', val: -5e-324 },
        ],
        // Zero with positive subnormal
        [
          { x: 'Z0', val: 0 },
          { x: 'Z1', val: 5e-324 },
        ],
        // Zero with negative subnormal
        [
          { x: 'Z0', val: 0 },
          { x: 'Z1', val: -5e-324 },
        ],
        // Multi-point subnormal array straddling zero
        [
          { x: 'A', val: -5e-324 },
          { x: 'B', val: 0 },
          { x: 'C', val: 5e-324 },
          { x: 'D', val: 1e-320 },
        ],
        // Extreme values near IEEE-754 underflow threshold 1e-300
        [
          { x: 'U1', val: -1e-300 },
          { x: 'U2', val: 1e-300 },
        ],
      ]

      for (const suiteData of subnormalSuites) {
        const chart = await mount<MoulLineChart>(html`
          <moul-line-chart
            .data=${suiteData}
            x-key="x"
            .series=${[{ key: 'val' }]}
          ></moul-line-chart>
        `)

        const d = getChartPathD(chart)
        assertValidSvgPath(d)
        expect(d.startsWith('M')).toBe(true)
        expect(d.includes('NaN')).toBe(false)
        expect(d.includes('Infinity')).toBe(false)

        const circles = chart.shadowRoot?.querySelectorAll(
          'circle.point-marker',
        )
        expect(circles?.length).toBe(suiteData.length)
        for (const circle of Array.from(circles ?? [])) {
          const cy = parseFloat(circle.getAttribute('cy') ?? 'NaN')
          expect(Number.isFinite(cy)).toBe(true)
        }
      }
    })
  })

  // =========================================================================
  // 5. Pathological Data: Negative Y Values
  // =========================================================================
  describe('Pathological Data: Negative Y Values', () => {
    it('correctly maps all negative Y values so that more negative values appear lower in SVG', async () => {
      const negativeData = [
        { day: 'Mon', temp: -50 },
        { day: 'Tue', temp: -20 },
        { day: 'Wed', temp: -10 },
      ]
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${negativeData}
          x-key="day"
          .series=${[{ key: 'temp' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)

      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(3)

      const cy0 = parseFloat(circles![0].getAttribute('cy')!) // -50
      const cy1 = parseFloat(circles![1].getAttribute('cy')!) // -20
      const cy2 = parseFloat(circles![2].getAttribute('cy')!) // -10

      // In SVG, higher Y value on screen = larger cy. So -50 is lower on chart -> larger cy
      expect(cy0).toBeGreaterThan(cy1)
      expect(cy1).toBeGreaterThan(cy2)
    })

    it('correctly spans negative and positive values with baseline positioned between them', async () => {
      const bipolarData = [
        { quarter: 'Q1', profit: -200 },
        { quarter: 'Q2', profit: 0 },
        { quarter: 'Q3', profit: 300 },
      ]
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${bipolarData}
          x-key="quarter"
          .series=${[{ key: 'profit' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)

      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(3)

      const cyNeg = parseFloat(circles![0].getAttribute('cy')!)
      const cyZero = parseFloat(circles![1].getAttribute('cy')!)
      const cyPos = parseFloat(circles![2].getAttribute('cy')!)

      expect(cyPos).toBeLessThan(cyZero)
      expect(cyZero).toBeLessThan(cyNeg)
    })

    it('handles identical negative Y values without division by zero', async () => {
      const identicalNeg = [
        { period: 'A', loss: -35 },
        { period: 'B', loss: -35 },
      ]
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${identicalNeg}
          x-key="period"
          .series=${[{ key: 'loss' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)

      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(2)
      expect(parseFloat(circles![0].getAttribute('cy')!)).toBe(
        parseFloat(circles![1].getAttribute('cy')!),
      )
    })
  })

  // =========================================================================
  // 6. Pathological Data: Mixed Null / Undefined / Non-Numeric Values
  // =========================================================================
  describe('Pathological Data: Mixed Null, Undefined, and Corrupted Values', () => {
    it('handles null and undefined values in series data gracefully without NaN in path', async () => {
      const raggedData = [
        { t: '1', val: 10 },
        { t: '2', val: null },
        { t: '3', val: undefined },
        { t: '4', val: 25 },
        { t: '5', val: null },
        { t: '6', val: 40 },
      ]
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${raggedData}
          x-key="t"
          .series=${[{ key: 'val' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      // Discontinuous path or filtered path must never contain NaN or undefined
      assertValidSvgPath(pathD, true)

      // Circles should only be rendered for valid numbers (10, 25, 40)
      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(3)
    })

    it('handles string numeric values by converting them to valid numbers', async () => {
      const stringData = [
        { t: '1', val: '10' },
        { t: '2', val: '30' },
        { t: '3', val: '50' },
      ]
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${stringData}
          x-key="t"
          .series=${[{ key: 'val' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)

      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(3)
    })

    it('handles NaN and non-numeric strings in records without throwing or emitting NaN', async () => {
      const corruptedData = [
        { t: '1', val: 10 },
        { t: '2', val: 'invalid-number' },
        { t: '3', val: NaN },
        { t: '4', val: 50 },
      ]
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${corruptedData}
          x-key="t"
          .series=${[{ key: 'val' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD, true)

      // Only valid numbers 10 and 50 get circles
      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(2)
    })

    it('handles completely null series data without throwing', async () => {
      const allNullData = [
        { t: '1', val: null },
        { t: '2', val: undefined },
      ]
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${allNullData}
          x-key="t"
          .series=${[{ key: 'val' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      // d may be empty, but must never contain NaN
      expect(pathD.includes('NaN')).toBe(false)
      expect(pathD.includes('undefined')).toBe(false)

      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(0)
    })

    it('handles missing xKey in data items gracefully with empty string fallback', async () => {
      const missingKeys = [
        { val: 10 }, // no 'x' property
        { x: 'B', val: 20 },
      ]
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${missingKeys}
          x-key="x"
          .series=${[{ key: 'val' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)

      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(2)
    })
  })

  // =========================================================================
  // 7. Pathological Data: 100+ Points Stress Test
  // =========================================================================
  describe('Pathological Data: 100+ Points Stress Test', () => {
    it('renders 120 points smoothly with valid path and exact circle count', async () => {
      const data120 = Array.from({ length: 120 }, (_, i) => ({
        idx: `P${i}`,
        metric: Math.sin(i / 10) * 100 + 150,
      }))

      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${data120}
          x-key="idx"
          .series=${[{ key: 'metric' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)

      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(120)

      // Hover verification on sample points (first, middle, last)
      let lastHover: PointHoverDetail | null = null
      chart.addEventListener('point-hover', (e: Event) => {
        lastHover = (e as CustomEvent<PointHoverDetail>).detail
      })

      // Hover first point
      circles![0].dispatchEvent(
        new PointerEvent('pointerenter', { bubbles: true }),
      )
      expect(lastHover).not.toBeNull()
      expect(lastHover!.label).toBe('P0')

      // Hover middle point
      circles![59].dispatchEvent(
        new PointerEvent('pointerenter', { bubbles: true }),
      )
      expect(lastHover!.label).toBe('P59')

      // Hover last point
      circles![119].dispatchEvent(
        new PointerEvent('pointerenter', { bubbles: true }),
      )
      expect(lastHover!.label).toBe('P119')
    })

    it('renders 250 points without performance degradation or coordinate overflow', async () => {
      const start = performance.now()
      const data250 = Array.from({ length: 250 }, (_, i) => ({
        step: `${i}`,
        val: i * 2,
      }))

      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${data250}
          x-key="step"
          .series=${[{ key: 'val' }]}
        ></moul-line-chart>
      `)

      const duration = performance.now() - start
      expect(duration).toBeLessThan(1000) // Must mount in under 1 second

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)

      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(250)
    })
  })

  // =========================================================================
  // 8. Curve Interpolation Variations
  // =========================================================================
  describe('Curve Interpolation Options', () => {
    const curvePoints = [
      { x: '1', y: 10 },
      { x: '2', y: 40 },
      { x: '3', y: 20 },
      { x: '4', y: 80 },
    ]

    const supportedCurves = [
      'linear',
      'natural',
      'step',
      'stepAfter',
      'stepBefore',
      'monotoneX',
    ]

    for (const c of supportedCurves) {
      it(`renders valid path without NaN using curve="${c}"`, async () => {
        const chart = await mount<MoulLineChart>(html`
          <moul-line-chart
            .data=${curvePoints}
            x-key="x"
            .series=${[{ key: 'y' }]}
            curve=${c}
          ></moul-line-chart>
        `)

        const pathD = getChartPathD(chart)
        assertValidSvgPath(pathD)
      })
    }

    it('falls back to curveMonotoneX when given unrecognized curve string', async () => {
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${curvePoints}
          x-key="x"
          .series=${[{ key: 'y' }]}
          curve="non-existent-curve"
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      assertValidSvgPath(pathD)
    })
  })

  // =========================================================================
  // 9. Multi-Series and Auto-Series Discovery
  // =========================================================================
  describe('Multi-Series and Auto-Series Discovery', () => {
    it('automatically discovers numeric series keys when series property is not specified', async () => {
      const data = [
        { label: 'Q1', revenue: 100, profit: 40 },
        { label: 'Q2', revenue: 150, profit: 60 },
      ]
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${data}
          x-key="label"
        ></moul-line-chart>
      `)

      const paths = chart.shadowRoot?.querySelectorAll('path.series-path')
      expect(paths?.length).toBe(2)

      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(4) // 2 points * 2 series

      for (const p of Array.from(paths!)) {
        assertValidSvgPath(p.getAttribute('d') ?? '')
      }
    })

    it('handles missing series keys in data without throwing or emitting NaN', async () => {
      const data = [
        { label: 'A', actual: 100 },
        { label: 'B', actual: 200 },
      ]
      const chart = await mount<MoulLineChart>(html`
        <moul-line-chart
          .data=${data}
          x-key="label"
          .series=${[{ key: 'nonexistentKey' }]}
        ></moul-line-chart>
      `)

      const pathD = getChartPathD(chart)
      expect(pathD.includes('NaN')).toBe(false)
      expect(pathD.includes('undefined')).toBe(false)
    })
  })

  // =========================================================================
  // 10. Fast-Check Property Stress Testing (100 Randomized Executions)
  // =========================================================================
  describe('Fast-Check Randomized Property Testing', () => {
    it('strictly guarantees path data d never contains NaN or undefined across 100 random datasets', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            dataLength: fc.integer({ min: 1, max: 40 }),
            curveType: fc.constantFrom(
              'monotoneX',
              'linear',
              'natural',
              'step',
              'stepAfter',
              'stepBefore',
            ),
            minValue: fc.double({ min: -10000, max: -0.1, noNaN: true }),
            maxValue: fc.double({ min: 0.1, max: 10000, noNaN: true }),
          }),
          async ({ dataLength, curveType, minValue, maxValue }) => {
            const data = Array.from({ length: dataLength }, (_, i) => ({
              period: `P${i}`,
              val:
                minValue === maxValue
                  ? minValue
                  : minValue + Math.random() * (maxValue - minValue),
            }))

            const chart = await mount<MoulLineChart>(html`
              <moul-line-chart
                .data=${data}
                x-key="period"
                .series=${[{ key: 'val' }]}
                curve=${curveType}
              ></moul-line-chart>
            `)

            const pathD = getChartPathD(chart)
            assertValidSvgPath(pathD)

            const circles = chart.shadowRoot?.querySelectorAll('svg circle')
            expect(circles?.length).toBe(dataLength)

            for (const circle of Array.from(circles!)) {
              const cx = parseFloat(circle.getAttribute('cx')!)
              const cy = parseFloat(circle.getAttribute('cy')!)
              expect(Number.isFinite(cx)).toBe(true)
              expect(Number.isFinite(cy)).toBe(true)
            }

            chart.remove()
          },
        ),
        { numRuns: 100 },
      )
    })
  })
})
