import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import './AreaChart/AreaChart'
import type { MoulAreaChart } from './AreaChart/AreaChart'
import type { ChartSeries, PointHoverDetail } from './ChartCommon'

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

describe('Empirical Challenge: MoulAreaChart (`moul-area-chart`)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  // =========================================================================
  // 1. Stacked Mode: Mixed Positive and Negative Values Stress Testing
  // =========================================================================
  describe('Stacked Mode with Mixed Positive and Negative Values', () => {
    const mixedData = [
      { period: 'Jan', seriesA: 100, seriesB: -40, seriesC: 25 },
      { period: 'Feb', seriesA: -50, seriesB: 60, seriesC: -20 },
      { period: 'Mar', seriesA: 80, seriesB: -30, seriesC: 45 },
      { period: 'Apr', seriesA: -20, seriesB: 50, seriesC: -60 },
      { period: 'May', seriesA: 0, seriesB: -10, seriesC: 30 },
    ]

    const threeSeries: ChartSeries[] = [
      { key: 'seriesA', name: 'Alpha' },
      { key: 'seriesB', name: 'Beta' },
      { key: 'seriesC', name: 'Gamma' },
    ]

    it('CHALLENGE-AREA-01: Correctly stacks mixed +/- values without NaN and maintains finite coordinates', async () => {
      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${mixedData}
          x-key="period"
          .series=${threeSeries}
          stacked
          height="300"
        ></moul-area-chart>
      `)

      const svg = chart.shadowRoot?.querySelector('svg')
      expect(svg).toBeTruthy()

      // 3 series area paths and 3 stroke paths
      const areaPaths = chart.shadowRoot?.querySelectorAll('path.chart-area')
      const strokePaths = chart.shadowRoot?.querySelectorAll('path.chart-line')
      expect(areaPaths?.length).toBe(3)
      expect(strokePaths?.length).toBe(3)

      // Verify every path d attribute is valid and contains no NaN or undefined
      for (const p of Array.from(areaPaths ?? [])) {
        const d = p.getAttribute('d')
        expect(d).toBeTruthy()
        expect(d!.startsWith('M')).toBe(true)
        expect(d!.includes('NaN')).toBe(false)
        expect(d!.includes('undefined')).toBe(false)
      }

      for (const p of Array.from(strokePaths ?? [])) {
        const d = p.getAttribute('d')
        expect(d).toBeTruthy()
        expect(d!.startsWith('M')).toBe(true)
        expect(d!.includes('NaN')).toBe(false)
        expect(d!.includes('undefined')).toBe(false)
      }

      // Exactly 5 periods * 3 series = 15 marker circles
      const circles = chart.shadowRoot?.querySelectorAll('svg circle')
      expect(circles?.length).toBe(15)

      for (const c of Array.from(circles ?? [])) {
        const cx = parseFloat(c.getAttribute('cx') ?? 'NaN')
        const cy = parseFloat(c.getAttribute('cy') ?? 'NaN')
        expect(Number.isFinite(cx)).toBe(true)
        expect(Number.isFinite(cy)).toBe(true)
      }
    })

    it('CHALLENGE-AREA-02: Stacked geometry separates positive baselines from negative baselines', async () => {
      // In Jan:
      // seriesA: 100 (pos baseline 0 -> 100)
      // seriesB: -40 (neg baseline 0 -> -40)
      // seriesC: 25  (pos baseline 100 -> 125, stacks atop seriesA!)
      const unstackedChart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${mixedData}
          x-key="period"
          .series=${threeSeries}
          .stacked=${false}
          height="300"
        ></moul-area-chart>
      `)

      const stackedChart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${mixedData}
          x-key="period"
          .series=${threeSeries}
          .stacked=${true}
          height="300"
        ></moul-area-chart>
      `)

      const unstackedCircles = Array.from(
        unstackedChart.shadowRoot?.querySelectorAll('svg circle') ?? [],
      )
      const stackedCircles = Array.from(
        stackedChart.shadowRoot?.querySelectorAll('svg circle') ?? [],
      )

      // Period 'Jan' (index 0) for seriesC is circle index 10 (5 for seriesA + 5 for seriesB + 0 for seriesC)
      const unstackedC_Jan_Cy = parseFloat(
        unstackedCircles[10].getAttribute('cy') ?? '0',
      )
      const stackedC_Jan_Cy = parseFloat(
        stackedCircles[10].getAttribute('cy') ?? '0',
      )

      // In stacked mode, seriesC is plotted at 100 + 25 = 125 instead of 25.
      // In SVG, higher values are rendered physically higher up (smaller cy).
      expect(stackedC_Jan_Cy).toBeLessThan(unstackedC_Jan_Cy)

      // Period 'Feb':
      // seriesA: -50 (neg baseline 0 -> -50)
      // seriesB: 60  (pos baseline 0 -> 60)
      // seriesC: -20 (neg baseline -50 -> -70, stacks downward from seriesA!)
      // Circle for seriesC in Feb is index 10 + 1 = 11
      const unstackedC_Feb_Cy = parseFloat(
        unstackedCircles[11].getAttribute('cy') ?? '0',
      )
      const stackedC_Feb_Cy = parseFloat(
        stackedCircles[11].getAttribute('cy') ?? '0',
      )

      // In stacked mode, seriesC is plotted at -50 + (-20) = -70 instead of -20.
      // In SVG, more negative values are rendered physically lower down (larger cy).
      expect(stackedC_Feb_Cy).toBeGreaterThan(unstackedC_Feb_Cy)

      // Within stacked chart, seriesC in Feb (cy at -70) is lower down than seriesA in Feb (cy at -50)
      const stackedA_Feb_Cy = parseFloat(
        stackedCircles[1].getAttribute('cy') ?? '0',
      )
      expect(stackedC_Feb_Cy).toBeGreaterThan(stackedA_Feb_Cy)
    })

    it('CHALLENGE-AREA-03: Stress-test stacked mode with all negative series', async () => {
      const allNegData = [
        { period: 'P1', a: -50, b: -30 },
        { period: 'P2', a: -80, b: -60 },
        { period: 'P3', a: -20, b: -40 },
      ]

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${allNegData}
          x-key="period"
          .series=${[{ key: 'a' }, { key: 'b' }]}
          stacked
          height="300"
        ></moul-area-chart>
      `)

      const areaPaths = chart.shadowRoot?.querySelectorAll('path.chart-area')
      expect(areaPaths?.length).toBe(2)

      for (const p of Array.from(areaPaths ?? [])) {
        const d = p.getAttribute('d')
        expect(d).toBeTruthy()
        expect(d?.startsWith('M')).toBe(true)
        expect(d?.includes('NaN')).toBe(false)
        expect(d?.endsWith('Z') || d?.trim().endsWith('Z')).toBe(true)
      }

      // Series B in P1 sits below Series A: -50 + -30 = -80 vs -50
      const circles = Array.from(
        chart.shadowRoot?.querySelectorAll('svg circle') ?? [],
      )
      expect(circles.length).toBe(6)

      const cyA_P1 = parseFloat(circles[0].getAttribute('cy') ?? '0')
      const cyB_P1 = parseFloat(circles[3].getAttribute('cy') ?? '0')
      // -80 is lower in SVG coordinates (larger cy) than -50
      expect(cyB_P1).toBeGreaterThan(cyA_P1)
    })

    it('CHALLENGE-AREA-04: Fast-check property test: stacked mode with arbitrary mixed +/- values always produces valid closed area and open stroke paths', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              category: fc.string({ minLength: 1, maxLength: 6 }),
              valA: fc.double({ min: -5000, max: 5000, noNaN: true }),
              valB: fc.double({ min: -5000, max: 5000, noNaN: true }),
              valC: fc.double({ min: -5000, max: 5000, noNaN: true }),
            }),
            { minLength: 2, maxLength: 8 },
          ),
          async (generatedRecords) => {
            const chart = await mount<MoulAreaChart>(html`
              <moul-area-chart
                .data=${generatedRecords}
                x-key="category"
                .series=${[
                  { key: 'valA', name: 'A' },
                  { key: 'valB', name: 'B' },
                  { key: 'valC', name: 'C' },
                ]}
                stacked
              ></moul-area-chart>
            `)

            const areaPaths = Array.from(
              chart.shadowRoot?.querySelectorAll('path.chart-area') ?? [],
            )
            const strokePaths = Array.from(
              chart.shadowRoot?.querySelectorAll('path.chart-line') ?? [],
            )

            expect(areaPaths.length).toBe(3)
            expect(strokePaths.length).toBe(3)

            for (let s = 0; s < 3; s++) {
              const areaD = areaPaths[s].getAttribute('d') ?? ''
              const strokeD = strokePaths[s].getAttribute('d') ?? ''

              // Area fill must be closed (ends with Z) and contain no NaN
              expect(areaD.startsWith('M')).toBe(true)
              expect(areaD.trim().endsWith('Z')).toBe(true)
              expect(areaD.includes('NaN')).toBe(false)

              // Stroke contour must be open (does NOT end with Z, does NOT contain Z)
              expect(strokeD.startsWith('M')).toBe(true)
              expect(strokeD.trim().endsWith('Z')).toBe(false)
              expect(strokeD.includes('Z')).toBe(false)
              expect(strokeD.includes('NaN')).toBe(false)
            }

            chart.remove()
          },
        ),
        { numRuns: 20 },
      )
    })
  })

  // =========================================================================
  // 2. Gradient Defs Generation and Uniqueness
  // =========================================================================
  describe('Gradient Defs Generation & ID Uniqueness', () => {
    const sampleData = [
      { x: '1', rev: 100, cost: 60 },
      { x: '2', rev: 150, cost: 80 },
    ]

    it('CHALLENGE-AREA-05: Generates valid <defs> with <linearGradient> and correct stops for each series', async () => {
      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${sampleData}
          x-key="x"
          .series=${[
            { key: 'rev', name: 'Revenue', color: 'var(--color-chart-1)' },
            { key: 'cost', name: 'Cost', color: 'var(--color-chart-2)' },
          ]}
        ></moul-area-chart>
      `)

      const defs = chart.shadowRoot?.querySelector('defs')
      expect(defs).toBeTruthy()

      const gradients = defs?.querySelectorAll('linearGradient')
      expect(gradients?.length).toBe(2)

      for (let i = 0; i < gradients!.length; i++) {
        const grad = gradients![i]
        expect(grad.getAttribute('x1')).toBe('0')
        expect(grad.getAttribute('y1')).toBe('0')
        expect(grad.getAttribute('x2')).toBe('0')
        expect(grad.getAttribute('y2')).toBe('1')

        const stops = grad.querySelectorAll('stop')
        expect(stops.length).toBe(2)

        // Stop 0: 0% offset, 0.25 opacity
        expect(stops[0].getAttribute('offset')).toBe('0%')
        expect(stops[0].getAttribute('stop-opacity')).toBe('0.25')

        // Stop 1: 100% offset, 0 opacity
        expect(stops[1].getAttribute('offset')).toBe('100%')
        expect(stops[1].getAttribute('stop-opacity')).toBe('0')
      }

      // Area fill paths reference respective gradients
      const areaPaths = Array.from(
        chart.shadowRoot?.querySelectorAll('path.chart-area') ?? [],
      )
      expect(areaPaths[0].getAttribute('fill')).toBe(
        `url(#${gradients?.[0]?.id})`,
      )
      expect(areaPaths[1].getAttribute('fill')).toBe(
        `url(#${gradients?.[1]?.id})`,
      )
    })

    it('CHALLENGE-AREA-06: Gradient IDs are strictly unique across multiple chart instances in the DOM', async () => {
      // Mount two distinct chart instances with identical series keys
      const chart1 = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${sampleData}
          x-key="x"
          .series=${[{ key: 'rev' }, { key: 'cost' }]}
        ></moul-area-chart>
      `)

      const chart2 = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${sampleData}
          x-key="x"
          .series=${[{ key: 'rev' }, { key: 'cost' }]}
        ></moul-area-chart>
      `)

      const grads1 = Array.from(
        chart1.shadowRoot?.querySelectorAll('linearGradient') ?? [],
      )
      const grads2 = Array.from(
        chart2.shadowRoot?.querySelectorAll('linearGradient') ?? [],
      )

      expect(grads1.length).toBe(2)
      expect(grads2.length).toBe(2)

      const ids1 = grads1.map((g) => g.id)
      const ids2 = grads2.map((g) => g.id)

      // No collision between instance 1 and instance 2
      for (const id of ids1) {
        expect(ids2.includes(id)).toBe(false)
      }

      const allIds = [...ids1, ...ids2]
      const uniqueIds = new Set(allIds)
      expect(uniqueIds.size).toBe(4)

      // Chart 1's paths point to Chart 1's IDs
      const paths1 = Array.from(
        chart1.shadowRoot?.querySelectorAll('path.chart-area') ?? [],
      )
      expect(paths1[0].getAttribute('fill')).toBe(`url(#${ids1[0]})`)
      expect(paths1[1].getAttribute('fill')).toBe(`url(#${ids1[1]})`)

      // Chart 2's paths point to Chart 2's IDs
      const paths2 = Array.from(
        chart2.shadowRoot?.querySelectorAll('path.chart-area') ?? [],
      )
      expect(paths2[0].getAttribute('fill')).toBe(`url(#${ids2[0]})`)
      expect(paths2[1].getAttribute('fill')).toBe(`url(#${ids2[1]})`)
    })

    it('CHALLENGE-AREA-07: Sanitizes complex series keys into valid SVG/CSS gradient IDs', async () => {
      const complexData = [
        {
          period: 'Q1',
          'Sales (2026)': 500,
          'Profit / Loss (%)': 150,
          'Expenses.Global': 350,
        },
      ]

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${complexData}
          x-key="period"
          .series=${[
            { key: 'Sales (2026)' },
            { key: 'Profit / Loss (%)' },
            { key: 'Expenses.Global' },
          ]}
        ></moul-area-chart>
      `)

      const gradients = Array.from(
        chart.shadowRoot?.querySelectorAll('linearGradient') ?? [],
      )
      expect(gradients.length).toBe(3)

      for (const grad of Array.from(gradients)) {
        // ID should only contain valid characters [a-zA-Z0-9_-]
        expect(grad.id).toMatch(/^area-grad-[a-zA-Z0-9]+-[a-zA-Z0-9_-]+$/)
        expect(grad.id).not.toContain(' ')
        expect(grad.id).not.toContain('(')
        expect(grad.id).not.toContain(')')
        expect(grad.id).not.toContain('/')
        expect(grad.id).not.toContain('%')
      }
    })

    it('CHALLENGE-AREA-08: Preserves gradient ID stability across re-renders without flickering', async () => {
      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${sampleData}
          x-key="x"
          .series=${[{ key: 'rev' }]}
        ></moul-area-chart>
      `)

      const initialGradId =
        chart.shadowRoot?.querySelector('linearGradient')?.id
      expect(initialGradId).toBeTruthy()

      // Trigger re-render by updating height and showGrid
      chart.height = 420
      chart.showGrid = false
      await chart.updateComplete

      const updatedGradId =
        chart.shadowRoot?.querySelector('linearGradient')?.id
      expect(updatedGradId).toBe(initialGradId)
    })
  })

  // =========================================================================
  // 3. Area Fill Path Closed ('Z') vs Stroke Line Path Open
  // =========================================================================
  describe('Area Fill Path Closed (terminates with Z) vs Stroke Line Path Open', () => {
    it('CHALLENGE-AREA-09: Normal dataset: Area path ends with Z and stroke path does not contain Z', async () => {
      const testData = [
        { month: 'Jan', val: 10 },
        { month: 'Feb', val: 35 },
        { month: 'Mar', val: 20 },
        { month: 'Apr', val: 60 },
      ]

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${testData}
          x-key="month"
          .series=${[{ key: 'val' }]}
        ></moul-area-chart>
      `)

      const areaPath = chart.shadowRoot?.querySelector('path.chart-area')
      const strokePath = chart.shadowRoot?.querySelector('path.chart-line')

      expect(areaPath).toBeTruthy()
      expect(strokePath).toBeTruthy()

      const areaD = areaPath!.getAttribute('d') ?? ''
      const strokeD = strokePath!.getAttribute('d') ?? ''

      // Area fill MUST be closed with Z command
      expect(areaD.startsWith('M')).toBe(true)
      expect(areaD.trim().endsWith('Z')).toBe(true)

      // Stroke line contour MUST be open (fill="none", no Z)
      expect(strokeD.startsWith('M')).toBe(true)
      expect(strokeD.trim().endsWith('Z')).toBe(false)
      expect(strokeD.includes('Z')).toBe(false)
      expect(strokePath!.getAttribute('fill')).toBe('none')
    })

    it('CHALLENGE-AREA-10: Single-point dataset: Area path ends with Z and stroke path is open', async () => {
      const singlePoint = [{ month: 'Solo', val: 75 }]

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${singlePoint}
          x-key="month"
          .series=${[{ key: 'val' }]}
        ></moul-area-chart>
      `)

      const areaPath = chart.shadowRoot?.querySelector('path.chart-area')
      const strokePath = chart.shadowRoot?.querySelector('path.chart-line')

      expect(areaPath).toBeTruthy()
      expect(strokePath).toBeTruthy()

      const areaD = areaPath!.getAttribute('d') ?? ''
      const strokeD = strokePath!.getAttribute('d') ?? ''

      // Single point creates deterministic closed rectangular polygon
      expect(areaD.startsWith('M')).toBe(true)
      expect(areaD.trim().endsWith('Z')).toBe(true)

      // Single point stroke creates a horizontal cap segment, open contour
      expect(strokeD.startsWith('M')).toBe(true)
      expect(strokeD.trim().endsWith('Z')).toBe(false)
      expect(strokeD.includes('Z')).toBe(false)
    })

    it('CHALLENGE-AREA-11: Two-point minimal dataset: Area path ends with Z and stroke path is open', async () => {
      const twoPoints = [
        { x: 'Start', val: 100 },
        { x: 'End', val: 200 },
      ]

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${twoPoints}
          x-key="x"
          .series=${[{ key: 'val' }]}
        ></moul-area-chart>
      `)

      const areaPath = chart.shadowRoot?.querySelector('path.chart-area')
      const strokePath = chart.shadowRoot?.querySelector('path.chart-line')

      const areaD = areaPath!.getAttribute('d') ?? ''
      const strokeD = strokePath!.getAttribute('d') ?? ''

      expect(areaD.startsWith('M')).toBe(true)
      expect(areaD.trim().endsWith('Z')).toBe(true)

      expect(strokeD.startsWith('M')).toBe(true)
      expect(strokeD.trim().endsWith('Z')).toBe(false)
      expect(strokeD.includes('Z')).toBe(false)
    })

    it('CHALLENGE-AREA-12: Large dataset (100 points): Area path terminates with Z, stroke path remains open', async () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        idx: `P${i}`,
        metric: Math.sin(i / 10) * 50 + 60,
      }))

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${largeData}
          x-key="idx"
          .series=${[{ key: 'metric' }]}
        ></moul-area-chart>
      `)

      const areaPath = chart.shadowRoot?.querySelector('path.chart-area')
      const strokePath = chart.shadowRoot?.querySelector('path.chart-line')

      const areaD = areaPath!.getAttribute('d') ?? ''
      const strokeD = strokePath!.getAttribute('d') ?? ''

      expect(areaD.startsWith('M')).toBe(true)
      expect(areaD.trim().endsWith('Z')).toBe(true)
      expect(areaD.includes('NaN')).toBe(false)

      expect(strokeD.startsWith('M')).toBe(true)
      expect(strokeD.trim().endsWith('Z')).toBe(false)
      expect(strokeD.includes('Z')).toBe(false)
      expect(strokeD.includes('NaN')).toBe(false)
    })
  })

  // =========================================================================
  // 4. Boundary Conditions, Pathological Data & Event Contracts
  // =========================================================================
  describe('Boundary Conditions, Pathological Data & Interaction', () => {
    it('CHALLENGE-AREA-13: Handles null, undefined, string, and missing values in data records gracefully', async () => {
      const corruptedData = [
        { x: '1', rev: null, profit: 50 },
        { x: '2', rev: undefined, profit: 'invalid' },
        { x: '3', rev: 40 }, // profit missing
        { x: '4', rev: '100', profit: -20 },
      ]

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${corruptedData}
          x-key="x"
          .series=${[{ key: 'rev' }, { key: 'profit' }]}
          stacked
        ></moul-area-chart>
      `)

      const areaPaths = Array.from(
        chart.shadowRoot?.querySelectorAll('path.chart-area') ?? [],
      )
      expect(areaPaths.length).toBe(2)

      for (const p of Array.from(areaPaths)) {
        const d = p.getAttribute('d') ?? ''
        expect(d.startsWith('M')).toBe(true)
        expect(d.trim().endsWith('Z')).toBe(true)
        expect(d.includes('NaN')).toBe(false)
      }
    })

    it('CHALLENGE-AREA-14: Auto-detects numeric series when series prop is omitted or empty', async () => {
      const dataWithoutExplicitSeries = [
        { period: '2024', revenue: 1000, profit: 300, note: 'ignored' },
        { period: '2025', revenue: 1500, profit: 450, note: 'ignored' },
      ]

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${dataWithoutExplicitSeries}
          x-key="period"
        ></moul-area-chart>
      `)

      expect(chart.effectiveSeries.length).toBe(2)
      expect(chart.effectiveSeries.map((s) => s.key)).toEqual([
        'revenue',
        'profit',
      ])

      const areaPaths = Array.from(
        chart.shadowRoot?.querySelectorAll('path.chart-area') ?? [],
      )
      expect(areaPaths.length).toBe(2)
    })

    it('CHALLENGE-AREA-15: Hovering on marker circle in stacked mixed +/- mode emits valid PointHoverDetail with original rawData', async () => {
      const data = [
        { day: 'Mon', inflow: 120, outflow: -70 },
        { day: 'Tue', inflow: 80, outflow: -90 },
      ]

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${data}
          x-key="day"
          .series=${[
            { key: 'inflow', name: 'Cash Inflow' },
            { key: 'outflow', name: 'Cash Outflow' },
          ]}
          stacked
        ></moul-area-chart>
      `)

      let hoverDetail: PointHoverDetail | null = null
      let leaveFired = false

      chart.addEventListener('point-hover', (e: Event) => {
        hoverDetail = (e as CustomEvent<PointHoverDetail>).detail
      })
      chart.addEventListener('point-leave', () => {
        leaveFired = true
      })

      // Circle 3 is Outflow on Tue (index 2 for inflow Mon/Tue, 2 for outflow Mon/Tue -> index 3 is Tue outflow)
      const circles = Array.from(
        chart.shadowRoot?.querySelectorAll('svg circle') ?? [],
      )
      expect(circles.length).toBe(4)

      const targetCircle = circles[3]
      targetCircle.dispatchEvent(
        new PointerEvent('pointerenter', { bubbles: true, composed: true }),
      )
      await awaitNestedUpdates(chart)

      expect(hoverDetail).not.toBeNull()
      expect(hoverDetail?.label).toBe('Tue')
      expect(hoverDetail?.value).toBe(-90)
      expect(hoverDetail?.series.key).toBe('outflow')
      expect(hoverDetail?.point).toEqual(data[1])
      expect(Number.isFinite(hoverDetail?.x)).toBe(true)
      expect(Number.isFinite(hoverDetail?.y)).toBe(true)

      // Pointer leave
      targetCircle.dispatchEvent(
        new PointerEvent('pointerleave', { bubbles: true, composed: true }),
      )
      await awaitNestedUpdates(chart)
      expect(leaveFired).toBe(true)
    })

    it('CHALLENGE-AREA-16: Extreme finite numerical inputs (0, -1e9, 1e9) resilience', async () => {
      const extremeData = [
        { x: '1', rev: 0, profit: 0 },
        { x: '2', rev: 1e9, profit: -1e9 },
        { x: '3', rev: 5e8, profit: -5e8 },
      ]

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${extremeData}
          x-key="x"
          .series=${[{ key: 'rev' }, { key: 'profit' }]}
          stacked
        ></moul-area-chart>
      `)

      const areaPaths = Array.from(
        chart.shadowRoot?.querySelectorAll('path.chart-area') ?? [],
      )
      expect(areaPaths.length).toBe(2)
      for (const p of Array.from(areaPaths)) {
        const d = p.getAttribute('d') ?? ''
        expect(d.startsWith('M')).toBe(true)
        expect(d.trim().endsWith('Z')).toBe(true)
        expect(d.includes('NaN')).toBe(false)
      }
    })

    it('CHALLENGE-AREA-17: Non-finite numerical inputs (Infinity / -Infinity) in stacked mode produce clean SVG paths without NaN or Infinity', async () => {
      const nonFiniteData = [
        { x: '1', rev: 100, profit: 50 },
        { x: '2', rev: Infinity, profit: -Infinity },
      ]

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${nonFiniteData}
          x-key="x"
          .series=${[{ key: 'rev' }, { key: 'profit' }]}
          stacked
        ></moul-area-chart>
      `)

      const areaPaths = Array.from(
        chart.shadowRoot?.querySelectorAll('path.chart-area') ?? [],
      )
      const strokePaths = Array.from(
        chart.shadowRoot?.querySelectorAll('path.chart-line') ?? [],
      )
      expect(areaPaths.length).toBe(2)
      expect(strokePaths.length).toBe(2)

      for (const p of areaPaths) {
        const d = p.getAttribute('d') ?? ''
        expect(d.startsWith('M')).toBe(true)
        expect(d.trim().endsWith('Z')).toBe(true)
        expect(d.includes('NaN')).toBe(false)
        expect(d.includes('Infinity')).toBe(false)
        expect(d.includes('undefined')).toBe(false)
      }

      for (const p of strokePaths) {
        const d = p.getAttribute('d') ?? ''
        expect(d.startsWith('M')).toBe(true)
        expect(d.includes('Z')).toBe(false)
        expect(d.includes('NaN')).toBe(false)
        expect(d.includes('Infinity')).toBe(false)
        expect(d.includes('undefined')).toBe(false)
      }

      const circles = Array.from(
        chart.shadowRoot?.querySelectorAll('svg circle') ?? [],
      )
      for (const c of circles) {
        const cx = parseFloat(c.getAttribute('cx') ?? 'NaN')
        const cy = parseFloat(c.getAttribute('cy') ?? 'NaN')
        expect(Number.isFinite(cx)).toBe(true)
        expect(Number.isFinite(cy)).toBe(true)
      }
    })

    it('CHALLENGE-AREA-18: All non-finite values (Infinity, -Infinity, NaN, null, undefined) in unstacked mode produce clean SVG paths', async () => {
      const nonFiniteAllData = [
        { x: '1', rev: Infinity, profit: NaN },
        { x: '2', rev: -Infinity, profit: undefined },
        { x: '3', rev: null, profit: Infinity },
        { x: '4', rev: NaN, profit: -Infinity },
      ]

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${nonFiniteAllData}
          x-key="x"
          .series=${[{ key: 'rev' }, { key: 'profit' }]}
        ></moul-area-chart>
      `)

      const areaPaths = Array.from(
        chart.shadowRoot?.querySelectorAll('path.chart-area') ?? [],
      )
      const strokePaths = Array.from(
        chart.shadowRoot?.querySelectorAll('path.chart-line') ?? [],
      )
      expect(areaPaths.length).toBe(2)
      expect(strokePaths.length).toBe(2)

      for (const p of areaPaths) {
        const d = p.getAttribute('d') ?? ''
        expect(d.startsWith('M')).toBe(true)
        expect(d.trim().endsWith('Z')).toBe(true)
        expect(d.includes('NaN')).toBe(false)
        expect(d.includes('Infinity')).toBe(false)
        expect(d.includes('undefined')).toBe(false)
      }

      for (const p of strokePaths) {
        const d = p.getAttribute('d') ?? ''
        expect(d.startsWith('M')).toBe(true)
        expect(d.includes('Z')).toBe(false)
        expect(d.includes('NaN')).toBe(false)
        expect(d.includes('Infinity')).toBe(false)
        expect(d.includes('undefined')).toBe(false)
      }

      const circles = Array.from(
        chart.shadowRoot?.querySelectorAll('svg circle') ?? [],
      )
      for (const c of circles) {
        const cx = parseFloat(c.getAttribute('cx') ?? 'NaN')
        const cy = parseFloat(c.getAttribute('cy') ?? 'NaN')
        expect(Number.isFinite(cx)).toBe(true)
        expect(Number.isFinite(cy)).toBe(true)
      }
    })

    it('CHALLENGE-AREA-19: All non-finite values (Infinity, -Infinity, NaN, null, undefined) in stacked mode produce clean SVG paths', async () => {
      const nonFiniteAllData = [
        { x: '1', a: Infinity, b: -Infinity },
        { x: '2', a: NaN, b: null },
        { x: '3', a: undefined, b: Infinity },
      ]

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${nonFiniteAllData}
          x-key="x"
          .series=${[{ key: 'a' }, { key: 'b' }]}
          stacked
        ></moul-area-chart>
      `)

      const areaPaths = Array.from(
        chart.shadowRoot?.querySelectorAll('path.chart-area') ?? [],
      )
      const strokePaths = Array.from(
        chart.shadowRoot?.querySelectorAll('path.chart-line') ?? [],
      )
      expect(areaPaths.length).toBe(2)
      expect(strokePaths.length).toBe(2)

      for (const p of areaPaths) {
        const d = p.getAttribute('d') ?? ''
        expect(d.startsWith('M')).toBe(true)
        expect(d.trim().endsWith('Z')).toBe(true)
        expect(d.includes('NaN')).toBe(false)
        expect(d.includes('Infinity')).toBe(false)
        expect(d.includes('undefined')).toBe(false)
      }

      for (const p of strokePaths) {
        const d = p.getAttribute('d') ?? ''
        expect(d.startsWith('M')).toBe(true)
        expect(d.includes('Z')).toBe(false)
        expect(d.includes('NaN')).toBe(false)
        expect(d.includes('Infinity')).toBe(false)
        expect(d.includes('undefined')).toBe(false)
      }
    })

    it('CHALLENGE-AREA-20: Single point with non-finite values triggers fallback without NaN or Infinity', async () => {
      const nonFiniteSingleCases = [
        [{ x: 'Solo', val: Infinity }],
        [{ x: 'Solo', val: -Infinity }],
        [{ x: 'Solo', val: NaN }],
        [{ x: 'Solo', val: null }],
        [{ x: 'Solo', val: undefined }],
      ]

      for (const data of nonFiniteSingleCases) {
        const chart = await mount<MoulAreaChart>(html`
          <moul-area-chart
            .data=${data}
            x-key="x"
            .series=${[{ key: 'val' }]}
          ></moul-area-chart>
        `)

        const areaPath = chart.shadowRoot?.querySelector('path.chart-area')
        const strokePath = chart.shadowRoot?.querySelector('path.chart-line')

        expect(areaPath).toBeTruthy()
        expect(strokePath).toBeTruthy()

        const areaD = areaPath!.getAttribute('d') ?? ''
        const strokeD = strokePath!.getAttribute('d') ?? ''

        expect(areaD.startsWith('M')).toBe(true)
        expect(areaD.trim().endsWith('Z')).toBe(true)
        expect(areaD.includes('NaN')).toBe(false)
        expect(areaD.includes('Infinity')).toBe(false)
        expect(areaD.includes('undefined')).toBe(false)

        expect(strokeD.startsWith('M')).toBe(true)
        expect(strokeD.includes('Z')).toBe(false)
        expect(strokeD.includes('NaN')).toBe(false)
        expect(strokeD.includes('Infinity')).toBe(false)
        expect(strokeD.includes('undefined')).toBe(false)

        chart.remove()
      }
    })

    it('CHALLENGE-AREA-21: Alternating finite and non-finite values across multi-point dataset', async () => {
      const alternatingData = [
        { x: 'A', v: 100 },
        { x: 'B', v: Infinity },
        { x: 'C', v: 250 },
        { x: 'D', v: NaN },
        { x: 'E', v: -Infinity },
        { x: 'F', v: 300 },
        { x: 'G', v: null },
        { x: 'H', v: undefined },
        { x: 'I', v: 150 },
      ]

      for (const stacked of [false, true]) {
        const chart = await mount<MoulAreaChart>(html`
          <moul-area-chart
            .data=${alternatingData}
            x-key="x"
            .series=${[{ key: 'v' }]}
            .stacked=${stacked}
          ></moul-area-chart>
        `)

        const areaPath = chart.shadowRoot?.querySelector('path.chart-area')
        const strokePath = chart.shadowRoot?.querySelector('path.chart-line')

        expect(areaPath).toBeTruthy()
        expect(strokePath).toBeTruthy()

        const areaD = areaPath!.getAttribute('d') ?? ''
        const strokeD = strokePath!.getAttribute('d') ?? ''

        expect(areaD.startsWith('M')).toBe(true)
        expect(areaD.trim().endsWith('Z')).toBe(true)
        expect(areaD.includes('NaN')).toBe(false)
        expect(areaD.includes('Infinity')).toBe(false)
        expect(areaD.includes('undefined')).toBe(false)

        expect(strokeD.startsWith('M')).toBe(true)
        expect(strokeD.includes('Z')).toBe(false)
        expect(strokeD.includes('NaN')).toBe(false)
        expect(strokeD.includes('Infinity')).toBe(false)
        expect(strokeD.includes('undefined')).toBe(false)

        const circles = Array.from(
          chart.shadowRoot?.querySelectorAll('svg circle') ?? [],
        )
        for (const c of circles) {
          const cx = parseFloat(c.getAttribute('cx') ?? 'NaN')
          const cy = parseFloat(c.getAttribute('cy') ?? 'NaN')
          expect(Number.isFinite(cx)).toBe(true)
          expect(Number.isFinite(cy)).toBe(true)
        }

        chart.remove()
      }
    })

    it('CHALLENGE-AREA-22: Subnormal floating point numbers near 0 do not throw RangeError and produce finite paths', async () => {
      const subnormalData = [
        { period: 'A', val: -5e-324 },
        { period: 'B', val: 5e-324 },
      ]

      const chart = await mount<MoulAreaChart>(html`
        <moul-area-chart
          .data=${subnormalData}
          x-key="period"
          .series=${[{ key: 'val' }]}
        ></moul-area-chart>
      `)

      const areaPath = chart.shadowRoot?.querySelector('path.chart-area')
      const strokePath = chart.shadowRoot?.querySelector('path.chart-line')

      expect(areaPath).toBeTruthy()
      expect(strokePath).toBeTruthy()

      const areaD = areaPath!.getAttribute('d') ?? ''
      const strokeD = strokePath!.getAttribute('d') ?? ''

      expect(areaD.startsWith('M')).toBe(true)
      expect(areaD.trim().endsWith('Z')).toBe(true)
      expect(areaD.includes('NaN')).toBe(false)
      expect(areaD.includes('Infinity')).toBe(false)

      expect(strokeD.startsWith('M')).toBe(true)
      expect(strokeD.includes('Z')).toBe(false)
      expect(strokeD.includes('NaN')).toBe(false)
      expect(strokeD.includes('Infinity')).toBe(false)
    })

    it('CHALLENGE-AREA-23: Fast-check property test: arbitrary non-finite, subnormal, and extreme values always produce finite paths', async () => {
      const nonFiniteArbitrary = fc.oneof(
        fc.constant(Infinity),
        fc.constant(-Infinity),
        fc.constant(NaN),
        fc.constant(null),
        fc.constant(undefined),
        fc.constant(0),
        fc.constant(5e-324),
        fc.constant(-5e-324),
        fc.double({ noNaN: false }),
      )

      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              category: fc.string({ minLength: 1, maxLength: 4 }),
              valA: nonFiniteArbitrary,
              valB: nonFiniteArbitrary,
            }),
            { minLength: 1, maxLength: 6 },
          ),
          fc.boolean(),
          async (generatedRecords, stacked) => {
            const chart = await mount<MoulAreaChart>(html`
              <moul-area-chart
                .data=${generatedRecords}
                x-key="category"
                .series=${[
                  { key: 'valA', name: 'A' },
                  { key: 'valB', name: 'B' },
                ]}
                .stacked=${stacked}
              ></moul-area-chart>
            `)

            const areaPaths = Array.from(
              chart.shadowRoot?.querySelectorAll('path.chart-area') ?? [],
            )
            const strokePaths = Array.from(
              chart.shadowRoot?.querySelectorAll('path.chart-line') ?? [],
            )

            expect(areaPaths.length).toBe(2)
            expect(strokePaths.length).toBe(2)

            for (let s = 0; s < 2; s++) {
              const areaD = areaPaths[s].getAttribute('d') ?? ''
              const strokeD = strokePaths[s].getAttribute('d') ?? ''

              expect(areaD.startsWith('M')).toBe(true)
              expect(areaD.trim().endsWith('Z')).toBe(true)
              expect(areaD.includes('NaN')).toBe(false)
              expect(areaD.includes('Infinity')).toBe(false)
              expect(areaD.includes('undefined')).toBe(false)

              expect(strokeD.startsWith('M')).toBe(true)
              expect(strokeD.includes('Z')).toBe(false)
              expect(strokeD.includes('NaN')).toBe(false)
              expect(strokeD.includes('Infinity')).toBe(false)
              expect(strokeD.includes('undefined')).toBe(false)
            }

            const circles = Array.from(
              chart.shadowRoot?.querySelectorAll('svg circle') ?? [],
            )
            for (const c of circles) {
              const cx = parseFloat(c.getAttribute('cx') ?? 'NaN')
              const cy = parseFloat(c.getAttribute('cy') ?? 'NaN')
              expect(Number.isFinite(cx)).toBe(true)
              expect(Number.isFinite(cy)).toBe(true)
            }

            chart.remove()
          },
        ),
        { numRuns: 30 },
      )
    })
  })
})
