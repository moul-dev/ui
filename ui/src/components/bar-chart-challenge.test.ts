import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import './BarChart/BarChart'
import type { ChartSeries, MoulBarChart, PointHoverDetail } from '../index'

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

// Strict SVG geometry inspector: traverses all SVG elements and checks all geometric attributes
function assertNoNaNInSvg(root: ShadowRoot | null): void {
  expect(root).not.toBeNull()
  if (!root) return

  const svgElements = root.querySelectorAll(
    'svg, rect, line, text, g, circle, path',
  )
  expect(svgElements.length).toBeGreaterThan(0)

  const checkedAttributes = [
    'x',
    'y',
    'width',
    'height',
    'x1',
    'y1',
    'x2',
    'y2',
    'cx',
    'cy',
    'r',
    'd',
    'viewBox',
    'transform',
  ]

  svgElements.forEach((el) => {
    for (const attr of checkedAttributes) {
      if (el.hasAttribute(attr)) {
        const val = el.getAttribute(attr)!
        expect(
          val,
          `Attribute ${attr} on <${el.tagName.toLowerCase()}> contained NaN`,
        ).not.toMatch(/\bNaN\b/i)
        expect(
          val,
          `Attribute ${attr} on <${el.tagName.toLowerCase()}> contained undefined`,
        ).not.toMatch(/\bundefined\b/i)
        expect(
          val,
          `Attribute ${attr} on <${el.tagName.toLowerCase()}> contained null`,
        ).not.toMatch(/\bnull\b/i)

        // For direct numeric attributes, verify finiteness
        if (
          [
            'x',
            'y',
            'width',
            'height',
            'x1',
            'y1',
            'x2',
            'y2',
            'cx',
            'cy',
            'r',
          ].includes(attr)
        ) {
          const num = parseFloat(val)
          expect(
            Number.isFinite(num),
            `Attribute ${attr} on <${el.tagName.toLowerCase()}> was not finite: "${val}"`,
          ).toBe(true)
        }

        // For width and height on rect, must be non-negative
        if (
          ['width', 'height'].includes(attr) &&
          el.tagName.toLowerCase() === 'rect'
        ) {
          const num = parseFloat(val)
          expect(
            num,
            `Attribute ${attr} on <rect> was negative: "${val}"`,
          ).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })
}

describe('Adversarial Stress Suite: MoulBarChart (`moul-bar-chart`)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  // =========================================================================
  // 1. Pathological Empty / Missing / Null / Undefined Data
  // =========================================================================
  describe('Pathological Data: Empty, Null, Undefined, Missing Keys', () => {
    it('renders empty state slot with fallback message when data = []', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${[]}></moul-bar-chart>
      `)
      const emptySlot = chart.shadowRoot?.querySelector('slot[name="empty"]')
      expect(emptySlot).toBeTruthy()
      expect(chart.shadowRoot?.querySelector('svg')).toBeNull()
      expect(
        chart.shadowRoot?.querySelector('.empty-message')?.textContent,
      ).toBe('No data available')
    })

    it('renders empty state without error when data = null', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${null as any}></moul-bar-chart>
      `)
      expect(chart.shadowRoot?.querySelector('slot[name="empty"]')).toBeTruthy()
      expect(chart.shadowRoot?.querySelector('svg')).toBeNull()
    })

    it('renders empty state without error when data = undefined', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${undefined as any}></moul-bar-chart>
      `)
      expect(chart.shadowRoot?.querySelector('slot[name="empty"]')).toBeTruthy()
      expect(chart.shadowRoot?.querySelector('svg')).toBeNull()
    })

    it('renders empty state when data contains objects without numeric series keys and series is empty', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${[{ name: 'Alpha' }, { name: 'Beta' }]}></moul-bar-chart>
      `)
      expect(chart.shadowRoot?.querySelector('slot[name="empty"]')).toBeTruthy()
      expect(chart.shadowRoot?.querySelector('svg')).toBeNull()
    })

    it('renders zero-height bars without NaN when series is provided but data rows lack the series key', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${[{ name: 'Alpha' }, { name: 'Beta' }]}
          .series=${[{ key: 'missingKey', name: 'Missing' }]}
        ></moul-bar-chart>
      `)
      expect(chart.shadowRoot?.querySelector('svg')).toBeTruthy()
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(2)
      bars?.forEach((bar) => {
        expect(parseFloat(bar.getAttribute('height') || '0')).toBe(0)
      })
    })
  })

  // =========================================================================
  // 2. Single Item Datasets
  // =========================================================================
  describe('Single Item Datasets (All 4 Layout Configurations)', () => {
    const singleData = [{ name: 'Solo', val: 75 }]
    const singleSeries: ChartSeries[] = [{ key: 'val', name: 'Value' }]

    it('Vertical grouped single item renders valid non-NaN geometry', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${singleData}
          .series=${singleSeries}
        ></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(1)
      expect(parseFloat(bars![0].getAttribute('width') || '0')).toBeGreaterThan(
        0,
      )
      expect(
        parseFloat(bars![0].getAttribute('height') || '0'),
      ).toBeGreaterThan(0)
    })

    it('Vertical stacked single item renders valid non-NaN geometry', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${singleData}
          .series=${singleSeries}
          stacked
        ></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(1)
      expect(parseFloat(bars![0].getAttribute('width') || '0')).toBeGreaterThan(
        0,
      )
      expect(
        parseFloat(bars![0].getAttribute('height') || '0'),
      ).toBeGreaterThan(0)
    })

    it('Horizontal grouped single item renders valid non-NaN geometry', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${singleData}
          .series=${singleSeries}
          layout="horizontal"
        ></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(1)
      expect(parseFloat(bars![0].getAttribute('width') || '0')).toBeGreaterThan(
        0,
      )
      expect(
        parseFloat(bars![0].getAttribute('height') || '0'),
      ).toBeGreaterThan(0)
    })

    it('Horizontal stacked single item renders valid non-NaN geometry', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${singleData}
          .series=${singleSeries}
          layout="horizontal"
          stacked
        ></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(1)
      expect(parseFloat(bars![0].getAttribute('width') || '0')).toBeGreaterThan(
        0,
      )
      expect(
        parseFloat(bars![0].getAttribute('height') || '0'),
      ).toBeGreaterThan(0)
    })
  })

  // =========================================================================
  // 3. All Zero Values
  // =========================================================================
  describe('All Zero Datasets', () => {
    const zeroData = [
      { name: 'Mon', v1: 0, v2: 0 },
      { name: 'Tue', v1: 0, v2: 0 },
      { name: 'Wed', v1: 0, v2: 0 },
    ]
    const series: ChartSeries[] = [
      { key: 'v1', name: 'Series 1' },
      { key: 'v2', name: 'Series 2' },
    ]

    it('Vertical grouped all-zero values: domain expands to [0, 1], rects have 0 height, no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${zeroData} .series=${series}></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(6)
      bars?.forEach((bar) => {
        expect(parseFloat(bar.getAttribute('height') || '0')).toBe(0)
        expect(parseFloat(bar.getAttribute('width') || '0')).toBeGreaterThan(0)
      })
    })

    it('Vertical stacked all-zero values: domain expands to [0, 1], rects have 0 height, no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${zeroData} .series=${series} stacked></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(6)
      bars?.forEach((bar) => {
        expect(parseFloat(bar.getAttribute('height') || '0')).toBe(0)
      })
    })

    it('Horizontal grouped all-zero values: rects have 0 width, no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${zeroData} .series=${series} layout="horizontal"></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(6)
      bars?.forEach((bar) => {
        expect(parseFloat(bar.getAttribute('width') || '0')).toBe(0)
        expect(parseFloat(bar.getAttribute('height') || '0')).toBeGreaterThan(0)
      })
    })

    it('Horizontal stacked all-zero values: rects have 0 width, no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${zeroData} .series=${series} layout="horizontal" stacked></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(6)
      bars?.forEach((bar) => {
        expect(parseFloat(bar.getAttribute('width') || '0')).toBe(0)
      })
    })
  })

  // =========================================================================
  // 4. All Negative Values
  // =========================================================================
  describe('All Negative Datasets', () => {
    const negData = [
      { name: 'Jan', expense: -120, loss: -50 },
      { name: 'Feb', expense: -200, loss: -80 },
      { name: 'Mar', expense: -90, loss: -30 },
    ]
    const series: ChartSeries[] = [
      { key: 'expense', name: 'Expense' },
      { key: 'loss', name: 'Loss' },
    ]

    it('Vertical grouped all-negative values: baseline at top, rects grow downward, no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${negData} .series=${series}></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(6)
      bars?.forEach((bar) => {
        expect(parseFloat(bar.getAttribute('height') || '0')).toBeGreaterThan(0)
        expect(parseFloat(bar.getAttribute('width') || '0')).toBeGreaterThan(0)
      })
    })

    it('Vertical stacked all-negative values: cumulative downward stacking from baseline, no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${negData} .series=${series} stacked></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(6)

      // Jan: expense (-120), loss (-50).
      // First bar starts at baselineY (yScale(0)), extends down to yScale(-120).
      // Second bar starts at yScale(-120), extends down to yScale(-170).
      const bar0 = bars![0]
      const bar1 = bars![1]
      const y0 = parseFloat(bar0.getAttribute('y') || '0')
      const h0 = parseFloat(bar0.getAttribute('height') || '0')
      const y1 = parseFloat(bar1.getAttribute('y') || '0')
      expect(Math.abs(y0 + h0 - y1)).toBeLessThan(1)
    })

    it('Horizontal grouped all-negative values: baseline at right, rects grow leftward, no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${negData} .series=${series} layout="horizontal"></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(6)
      bars?.forEach((bar) => {
        expect(parseFloat(bar.getAttribute('width') || '0')).toBeGreaterThan(0)
      })
    })

    it('Horizontal stacked all-negative values: cumulative leftward stacking from baseline, no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${negData} .series=${series} layout="horizontal" stacked></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(6)

      // Jan: expense (-120), loss (-50).
      // Second bar is to the left of the first bar.
      const bar0 = bars![0]
      const bar1 = bars![1]
      const x0 = parseFloat(bar0.getAttribute('x') || '0')
      const x1 = parseFloat(bar1.getAttribute('x') || '0')
      const w1 = parseFloat(bar1.getAttribute('width') || '0')
      expect(Math.abs(x1 + w1 - x0)).toBeLessThan(1)
    })

    it('All identical negative values: expands domain reliably without NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${[{ name: 'A', v: -40 }, { name: 'B', v: -40 }]}
          .series=${[{ key: 'v', name: 'V' }]}
        ></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(2)
      expect(bars![0].getAttribute('height')).toBe(
        bars![1].getAttribute('height'),
      )
    })
  })

  // =========================================================================
  // 5. Mixed Positive and Negative Values (Zero-Crossing)
  // =========================================================================
  describe('Mixed Positive and Negative Values (Zero-Crossing)', () => {
    const mixedData = [
      { name: 'Q1', profit: 150, loss: -80 },
      { name: 'Q2', profit: -60, loss: 120 },
      { name: 'Q3', profit: 0, loss: 0 },
    ]
    const series: ChartSeries[] = [
      { key: 'profit', name: 'Profit' },
      { key: 'loss', name: 'Loss' },
    ]

    it('Vertical grouped mixed positive/negative: baseline intersects chart cleanly, no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${mixedData} .series=${series}></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(6)
    })

    it('Vertical stacked mixed positive/negative: positive stacks upward, negative stacks downward, no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${mixedData} .series=${series} stacked></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(6)
    })

    it('Horizontal grouped mixed positive/negative: bars branch left and right from baseline, no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${mixedData} .series=${series} layout="horizontal"></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(6)
    })

    it('Horizontal stacked mixed positive/negative: positive stacks rightward, negative stacks leftward, no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart .data=${mixedData} .series=${series} layout="horizontal" stacked></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(6)
    })
  })

  // =========================================================================
  // 6. Degenerate Spans & Subnormal Deltas (< 1e-6)
  // =========================================================================
  describe('Degenerate Spans and Subnormal Deltas', () => {
    it('All identical positive values: domain expands smoothly, no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${[{ name: 'A', v: 100 }, { name: 'B', v: 100 }]}
          .series=${[{ key: 'v', name: 'V' }]}
        ></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(2)
      expect(bars![0].getAttribute('height')).toBe(
        bars![1].getAttribute('height'),
      )
    })

    it('Subnormal positive delta (< 1e-6): safeguard expands domain to [0, 1], no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${[{ name: 'A', v: 1e-12 }, { name: 'B', v: 2e-12 }]}
          .series=${[{ key: 'v', name: 'V' }]}
        ></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(2)
    })

    it('Subnormal negative delta (< 1e-6): safeguard expands domain to [-1, 0], no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${[{ name: 'A', v: -1e-12 }, { name: 'B', v: -2e-12 }]}
          .series=${[{ key: 'v', name: 'V' }]}
        ></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(2)
    })

    it('Subnormal bipolar delta spanning zero (< 1e-6): safeguard expands domain to [-1, 1], no NaN', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${[{ name: 'A', v: -1e-12 }, { name: 'B', v: 1e-12 }]}
          .series=${[{ key: 'v', name: 'V' }]}
        ></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(2)
    })
  })

  // =========================================================================
  // 7. Pathological Value Types (NaN, Infinity, String, Null in records)
  // =========================================================================
  describe('Pathological Value Types', () => {
    it('handles NaN, Infinity, -Infinity, null, and non-numeric strings safely by sanitizing to 0', async () => {
      const pathologicalData = [
        { name: 'NaN', v: Number.NaN },
        { name: 'Inf', v: Number.POSITIVE_INFINITY },
        { name: '-Inf', v: Number.NEGATIVE_INFINITY },
        { name: 'Null', v: null },
        { name: 'Undefined', v: undefined },
        { name: 'String', v: 'invalid' },
        { name: 'Valid', v: 50 },
      ]
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${pathologicalData}
          .series=${[{ key: 'v', name: 'Value' }]}
        ></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      const bars =
        chart.shadowRoot?.querySelectorAll<SVGRectElement>('rect.chart-bar')
      expect(bars?.length).toBe(7)
      // First 6 bars should sanitize to value 0 (height 0)
      for (let i = 0; i < 6; i++) {
        expect(parseFloat(bars![i].getAttribute('height') || '0')).toBe(0)
      }
      // Valid bar should have height > 0
      expect(
        parseFloat(bars![6].getAttribute('height') || '0'),
      ).toBeGreaterThan(0)
    })
  })

  // =========================================================================
  // 8. Dynamic Property Transitions & Reactive Updates
  // =========================================================================
  describe('Dynamic Property Transitions', () => {
    it('seamlessly updates geometry when layout is toggled between vertical and horizontal', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${[{ name: 'A', val: 40 }, { name: 'B', val: 80 }]}
          .series=${[{ key: 'val', name: 'Val' }]}
        ></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)

      // Switch to horizontal
      chart.layout = 'horizontal'
      await awaitNestedUpdates(chart)
      assertNoNaNInSvg(chart.shadowRoot)

      // Switch back to vertical
      chart.layout = 'vertical'
      await awaitNestedUpdates(chart)
      assertNoNaNInSvg(chart.shadowRoot)
    })

    it('seamlessly updates geometry when stacked is toggled', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${[{ name: 'A', s1: 30, s2: 50 }]}
          .series=${[{ key: 's1', name: 'S1' }, { key: 's2', name: 'S2' }]}
        ></moul-bar-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)

      chart.stacked = true
      await awaitNestedUpdates(chart)
      assertNoNaNInSvg(chart.shadowRoot)

      chart.stacked = false
      await awaitNestedUpdates(chart)
      assertNoNaNInSvg(chart.shadowRoot)
    })

    it('clamps height fallback safely when height <= 0', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${[{ name: 'A', v: 50 }]}
          .series=${[{ key: 'v', name: 'V' }]}
          .height=${-100}
        ></moul-bar-chart>
      `)
      expect(chart.containerHeight).toBe(300)
      assertNoNaNInSvg(chart.shadowRoot)
    })

    it('dispatches point-hover with finite coordinates and point-leave on pointer interactions', async () => {
      const chart = await mount<MoulBarChart>(html`
        <moul-bar-chart
          .data=${[{ name: 'HoverTest', val: 120 }]}
          .series=${[{ key: 'val', name: 'Value' }]}
        ></moul-bar-chart>
      `)
      let hovered: PointHoverDetail | null = null
      chart.addEventListener('point-hover', (e: Event) => {
        hovered = (e as CustomEvent<PointHoverDetail>).detail
      })
      let left = false
      chart.addEventListener('point-leave', () => {
        left = true
      })

      const bar =
        chart.shadowRoot!.querySelector<SVGRectElement>('rect.chart-bar')!
      bar.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
      await awaitNestedUpdates(chart)

      expect(hovered).not.toBeNull()
      expect(hovered?.label).toBe('HoverTest')
      expect(hovered?.value).toBe(120)
      expect(Number.isFinite(hovered?.x)).toBe(true)
      expect(Number.isFinite(hovered?.y)).toBe(true)
      expect(bar.classList.contains('is-active')).toBe(true)

      bar.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
      await awaitNestedUpdates(chart)

      expect(left).toBe(true)
      expect(bar.classList.contains('is-active')).toBe(false)
    })
  })

  // =========================================================================
  // 9. Fast-Check Generative Property Fuzzing (Extreme Combinations)
  // =========================================================================
  describe('Fast-Check Generative Stress Fuzzing', () => {
    it('arbitrary numerical vectors in all 4 layout configurations never emit NaN', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            layout: fc.constantFrom<'vertical' | 'horizontal'>(
              'vertical',
              'horizontal',
            ),
            stacked: fc.boolean(),
            showGrid: fc.boolean(),
            data: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 5 }),
                v1: fc.oneof(
                  fc.integer({ min: -1000, max: 1000 }),
                  fc.constant(0),
                  fc.constant(-1e-8),
                  fc.constant(1e-8),
                ),
                v2: fc.oneof(
                  fc.integer({ min: -1000, max: 1000 }),
                  fc.constant(0),
                ),
              }),
              { minLength: 1, maxLength: 6 },
            ),
          }),
          async ({ layout, stacked, showGrid, data }) => {
            const chart = await mount<MoulBarChart>(html`
              <moul-bar-chart
                .data=${data}
                .series=${[
                  { key: 'v1', name: 'Series 1' },
                  { key: 'v2', name: 'Series 2' },
                ]}
                .layout=${layout}
                .stacked=${stacked}
                .showGrid=${showGrid}
              ></moul-bar-chart>
            `)
            assertNoNaNInSvg(chart.shadowRoot)
            chart.remove()
          },
        ),
        { numRuns: 20 },
      )
    })
  })
})
