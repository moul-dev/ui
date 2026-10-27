import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import './DoughnutChart/DoughnutChart'
import type {
  DoughnutDataItem,
  MoulDoughnutChart,
  PointHoverDetail,
} from '../index'

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

  const svgElements = root.querySelectorAll('svg, path, circle, text, g')
  expect(svgElements.length).toBeGreaterThan(0)

  const checkedAttributes = [
    'd',
    'cx',
    'cy',
    'r',
    'stroke-width',
    'width',
    'height',
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

        if (
          ['cx', 'cy', 'r', 'stroke-width', 'width', 'height'].includes(attr)
        ) {
          const num = parseFloat(val)
          expect(
            Number.isFinite(num),
            `Attribute ${attr} on <${el.tagName.toLowerCase()}> was not finite: "${val}"`,
          ).toBe(true)
        }

        if (attr === 'd') {
          expect(val.length).toBeGreaterThan(0)
          expect(val.trim().startsWith('M')).toBe(true)
          const numbers = val.match(/[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g)
          if (numbers) {
            for (const n of numbers) {
              expect(Number.isFinite(parseFloat(n))).toBe(true)
            }
          }
        }
      }
    }
  })
}

describe('Adversarial Stress Suite: MoulDoughnutChart (`moul-doughnut-chart`)', () => {
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
  describe('Pathological Data: Empty, Null, Undefined', () => {
    it('renders empty state slot when data is an empty array', async () => {
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart .data=${[]}></moul-doughnut-chart>
      `)
      const emptySlot = chart.shadowRoot?.querySelector('slot[name="empty"]')
      expect(emptySlot).toBeTruthy()
      expect(chart.shadowRoot?.querySelector('svg')).toBeNull()
      expect(
        chart.shadowRoot?.querySelector('.empty-message')?.textContent,
      ).toBe('No data available')
    })

    it('renders empty state without runtime error when data is null', async () => {
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart .data=${null as any}></moul-doughnut-chart>
      `)
      expect(chart.shadowRoot?.querySelector('slot[name="empty"]')).toBeTruthy()
      expect(chart.shadowRoot?.querySelector('svg')).toBeNull()
    })

    it('renders empty state without runtime error when data is undefined', async () => {
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart .data=${undefined as any}></moul-doughnut-chart>
      `)
      expect(chart.shadowRoot?.querySelector('slot[name="empty"]')).toBeTruthy()
      expect(chart.shadowRoot?.querySelector('svg')).toBeNull()
    })
  })

  // =========================================================================
  // 2. All-Zero Doughnut Chart (Empty Track Ring)
  // =========================================================================
  describe('All-Zero Doughnut Chart (Empty Track Ring Safeguard)', () => {
    it('renders neutral circle.empty-track and NO slices when all item values are 0', async () => {
      const zeroData: DoughnutDataItem[] = [
        { name: 'A', value: 0 },
        { name: 'B', value: 0 },
        { name: 'C', value: 0 },
      ]
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart .data=${zeroData}></moul-doughnut-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)

      const slices = chart.shadowRoot?.querySelectorAll('.slice')
      expect(slices?.length).toBe(0)

      const emptyTrack = chart.shadowRoot?.querySelector('circle.empty-track')
      expect(emptyTrack).not.toBeNull()

      const r = parseFloat(emptyTrack?.getAttribute('r') || '0')
      const sw = parseFloat(emptyTrack?.getAttribute('stroke-width') || '0')
      expect(Number.isFinite(r)).toBe(true)
      expect(r).toBeGreaterThan(0)
      expect(Number.isFinite(sw)).toBe(true)
      expect(sw).toBeGreaterThan(0)
    })

    it('renders empty-track when single item has value 0', async () => {
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart .data=${[{ name: 'Zero', value: 0 }]}></moul-doughnut-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      expect(chart.shadowRoot?.querySelector('.slice')).toBeNull()
      expect(
        chart.shadowRoot?.querySelector('circle.empty-track'),
      ).not.toBeNull()
    })

    it('renders empty-track when all items have negative values', async () => {
      const negData: DoughnutDataItem[] = [
        { name: 'Neg1', value: -100 },
        { name: 'Neg2', value: -50 },
      ]
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart .data=${negData}></moul-doughnut-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)
      expect(chart.shadowRoot?.querySelector('.slice')).toBeNull()
      expect(
        chart.shadowRoot?.querySelector('circle.empty-track'),
      ).not.toBeNull()
    })
  })

  // =========================================================================
  // 3. Single Item (100% 360° Slice)
  // =========================================================================
  describe('Single Item (100% 360° Slice)', () => {
    it('renders seamless 360 continuous arc without gap or NaN when there is a single positive item', async () => {
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart .data=${[{ name: 'Complete', value: 100 }]}></moul-doughnut-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)

      const slices =
        chart.shadowRoot?.querySelectorAll<SVGPathElement>('.slice')
      expect(slices?.length).toBe(1)

      const pathD = slices![0].getAttribute('d')
      expect(pathD).toBeTruthy()
      expect(pathD?.startsWith('M')).toBe(true)
      expect(pathD?.endsWith('Z')).toBe(true)
      expect(pathD?.includes('NaN')).toBe(false)
    })

    it('renders single 360 slice even when accompanied by zero-valued or negative-valued items', async () => {
      const data: DoughnutDataItem[] = [
        { name: 'Active', value: 250 },
        { name: 'Zero1', value: 0 },
        { name: 'Negative', value: -80 },
      ]
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart .data=${data}></moul-doughnut-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)

      const slices =
        chart.shadowRoot?.querySelectorAll<SVGPathElement>('.slice')
      expect(slices?.length).toBe(1)
      expect(slices![0].getAttribute('data-name')).toBe('Active')
      expect(slices![0].getAttribute('d')?.includes('NaN')).toBe(false)
    })

    it('expands cleanly on hover for a single 360 slice and computes finite centroid coordinates', async () => {
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart .data=${[{ name: 'Solo', value: 500 }]}></moul-doughnut-chart>
      `)
      let detail: PointHoverDetail | null = null
      chart.addEventListener('point-hover', (e: Event) => {
        detail = (e as CustomEvent<PointHoverDetail>).detail
      })

      const slice = chart.shadowRoot!.querySelector<SVGPathElement>('.slice')!
      const initialD = slice.getAttribute('d')

      slice.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
      await awaitNestedUpdates(chart)

      assertNoNaNInSvg(chart.shadowRoot)
      expect(slice.classList.contains('is-active')).toBe(true)
      expect(slice.getAttribute('d')).not.toBe(initialD)
      expect(detail).not.toBeNull()
      expect(Number.isFinite(detail?.x)).toBe(true)
      expect(Number.isFinite(detail?.y)).toBe(true)
      expect(detail?.value).toBe(500)
    })
  })

  // =========================================================================
  // 4. innerRadiusRatio Boundary and Extreme Stress Testing
  // =========================================================================
  describe('innerRadiusRatio Boundary and Extreme Testing', () => {
    const testData: DoughnutDataItem[] = [
      { name: 'Slice 1', value: 60 },
      { name: 'Slice 2', value: 40 },
    ]

    it('innerRadiusRatio = 0 (solid pie chart): effective ratio is 0, no center slot container, valid paths', async () => {
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart
          .data=${testData}
          inner-radius-ratio="0"
          center-label="Pie"
        ></moul-doughnut-chart>
      `)
      expect(chart.effectiveInnerRadiusRatio).toBe(0)
      expect(chart.shadowRoot?.querySelector('.center-container')).toBeNull()
      assertNoNaNInSvg(chart.shadowRoot)

      const slices =
        chart.shadowRoot?.querySelectorAll<SVGPathElement>('.slice')
      expect(slices?.length).toBe(2)
      slices?.forEach((slice) => {
        const d = slice.getAttribute('d')
        expect(d).toBeTruthy()
        expect(d?.includes('NaN')).toBe(false)
      })
    })

    it('innerRadiusRatio = 0 with all-zero data: empty track circle renders valid stroke-width without NaN', async () => {
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart
          .data=${[{ name: 'A', value: 0 }]}
          inner-radius-ratio="0"
        ></moul-doughnut-chart>
      `)
      expect(chart.effectiveInnerRadiusRatio).toBe(0)
      assertNoNaNInSvg(chart.shadowRoot)
      const emptyTrack = chart.shadowRoot?.querySelector('circle.empty-track')
      expect(emptyTrack).not.toBeNull()
    })

    it('innerRadiusRatio = 0.95 (maximum thin ring): renders valid non-NaN path and visible center container', async () => {
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart
          .data=${testData}
          inner-radius-ratio="0.95"
          center-label="Thin Ring"
        ></moul-doughnut-chart>
      `)
      expect(chart.effectiveInnerRadiusRatio).toBe(0.95)
      expect(
        chart.shadowRoot?.querySelector('.center-container'),
      ).not.toBeNull()
      assertNoNaNInSvg(chart.shadowRoot)
    })

    it('innerRadiusRatio = 1.0 (overflow boundary): securely clamped to 0.95, no NaN', async () => {
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart
          .data=${testData}
          inner-radius-ratio="1.0"
        ></moul-doughnut-chart>
      `)
      expect(chart.effectiveInnerRadiusRatio).toBe(0.95)
      assertNoNaNInSvg(chart.shadowRoot)
    })

    it('innerRadiusRatio = 5.0 (extreme overflow): securely clamped to 0.95, no NaN', async () => {
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart
          .data=${testData}
          inner-radius-ratio="5.0"
        ></moul-doughnut-chart>
      `)
      expect(chart.effectiveInnerRadiusRatio).toBe(0.95)
      assertNoNaNInSvg(chart.shadowRoot)
    })

    it('innerRadiusRatio = -0.5 (negative boundary): securely clamped to 0, no NaN', async () => {
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart
          .data=${testData}
          inner-radius-ratio="-0.5"
        ></moul-doughnut-chart>
      `)
      expect(chart.effectiveInnerRadiusRatio).toBe(0)
      assertNoNaNInSvg(chart.shadowRoot)
    })

    it('innerRadiusRatio = NaN / invalid string: falls back safely to 0, no NaN', async () => {
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart
          .data=${testData}
          .innerRadiusRatio=${Number.NaN}
        ></moul-doughnut-chart>
      `)
      expect(chart.effectiveInnerRadiusRatio).toBe(0)
      assertNoNaNInSvg(chart.shadowRoot)
    })
  })

  // =========================================================================
  // 5. Pathological Slice Data Values
  // =========================================================================
  describe('Pathological Slice Data Values', () => {
    it('handles NaN, -Infinity, null, undefined, and non-numeric strings safely without emitting NaN in SVG', async () => {
      const malformedData: DoughnutDataItem[] = [
        { name: 'NaN', value: Number.NaN },
        { name: '-Inf', value: Number.NEGATIVE_INFINITY },
        { name: 'Null', value: null as any },
        { name: 'Undefined', value: undefined as any },
        { name: 'StringNum', value: '75' as any },
        { name: 'Regular', value: 25 },
      ]
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart .data=${malformedData}></moul-doughnut-chart>
      `)
      assertNoNaNInSvg(chart.shadowRoot)

      const slices =
        chart.shadowRoot?.querySelectorAll<SVGPathElement>('.slice')
      expect(slices?.length).toBeGreaterThanOrEqual(2)
      slices?.forEach((slice) => {
        expect(slice.getAttribute('d')?.includes('NaN')).toBe(false)
      })
    })

    it('EMPIRICAL BUG REPRODUCTION (CHALLENGE-BUG-01): Infinity in slice value produces NaN in SVG path d', async () => {
      // In MoulDoughnutChart.ts (line 191 & 201), the value conversion uses:
      // Math.max(0, Number(item?.value) || 0)
      // Since Number(Infinity) is Infinity (which is truthy and > 0),
      // d3.pie receives value: Infinity, resulting in Infinity / Infinity = NaN.
      // Consequently, D3 emits d="MNaN,NaNLNaN,NaNZ".
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart
          .data=${[
            { name: 'InfinityItem', value: Number.POSITIVE_INFINITY },
            { name: 'ValidItem', value: 100 },
          ]}
        ></moul-doughnut-chart>
      `)
      const slices =
        chart.shadowRoot?.querySelectorAll<SVGPathElement>('.slice')
      expect(slices?.length).toBeGreaterThan(0)
      const pathD = slices![0].getAttribute('d')
      expect(pathD?.includes('NaN')).toBe(true)
    })
  })

  // =========================================================================
  // 6. Interactive Keyboard Focus and Mouse Hover Events
  // =========================================================================
  describe('Interactive Keyboard Focus and Mouse Events', () => {
    it('dispatches point-hover on slice focus and point-leave on slice blur', async () => {
      const chart = await mount<MoulDoughnutChart>(html`
        <moul-doughnut-chart
          .data=${[{ name: 'One', value: 10 }, { name: 'Two', value: 20 }]}
        ></moul-doughnut-chart>
      `)
      let hovered: PointHoverDetail | null = null
      chart.addEventListener('point-hover', (e: Event) => {
        hovered = (e as CustomEvent<PointHoverDetail>).detail
      })
      let left = false
      chart.addEventListener('point-leave', () => {
        left = true
      })

      const slices =
        chart.shadowRoot!.querySelectorAll<SVGPathElement>('.slice')
      slices[1].dispatchEvent(new FocusEvent('focus', { bubbles: true }))
      await awaitNestedUpdates(chart)

      expect(hovered).not.toBeNull()
      expect(hovered?.label).toBe('Two')
      expect(slices[1].classList.contains('is-active')).toBe(true)

      slices[1].dispatchEvent(new FocusEvent('blur', { bubbles: true }))
      await awaitNestedUpdates(chart)

      expect(left).toBe(true)
      expect(slices[1].classList.contains('is-active')).toBe(false)
    })
  })

  // =========================================================================
  // 7. Fast-Check Generative Property Fuzzing (Extreme Combinations)
  // =========================================================================
  describe('Fast-Check Generative Stress Fuzzing', () => {
    it('arbitrary finite data values and ratio combinations never emit NaN in any SVG attribute', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            innerRadiusRatio: fc.oneof(
              fc.double({ min: -1.0, max: 2.0 }),
              fc.constant(0),
              fc.constant(0.6),
              fc.constant(0.95),
            ),
            padAngle: fc.double({ min: 0, max: 0.2 }),
            cornerRadius: fc.integer({ min: 0, max: 20 }),
            data: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 8 }),
                value: fc.oneof(
                  fc.integer({ min: -500, max: 1000 }),
                  fc.constant(0),
                  fc.double({ min: 0.1, max: 100 }),
                ),
              }),
              { minLength: 1, maxLength: 6 },
            ),
          }),
          async ({ innerRadiusRatio, padAngle, cornerRadius, data }) => {
            const chart = await mount<MoulDoughnutChart>(html`
              <moul-doughnut-chart
                .data=${data}
                .innerRadiusRatio=${innerRadiusRatio}
                .padAngle=${padAngle}
                .cornerRadius=${cornerRadius}
              ></moul-doughnut-chart>
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
