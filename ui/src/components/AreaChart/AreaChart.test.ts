import { html, render } from 'lit'
import { afterEach, describe, expect, it } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import type { PointHoverDetail } from '../ChartCommon'
import './AreaChart'
import type { MoulAreaChart } from './AreaChart'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const WEEK = [
  { day: 'Mon', web: 120, mobile: 80 },
  { day: 'Tue', web: 160, mobile: 95 },
  { day: 'Wed', web: 140, mobile: 110 },
  { day: 'Thu', web: 180, mobile: 90 },
]
const SERIES = [
  { key: 'web', name: 'Web' },
  { key: 'mobile', name: 'Mobile' },
]

async function mount(
  data = WEEK,
  attrs: { scrub?: string } = {},
): Promise<MoulAreaChart> {
  const host = document.createElement('div')
  document.body.append(host)
  render(
    html`<moul-area-chart
      x-key="day"
      label="Visits"
      scrub=${attrs.scrub ?? ''}
      .data=${data}
      .series=${SERIES}
    ></moul-area-chart>`,
    host,
  )
  const chart = host.firstElementChild as MoulAreaChart
  await chart.updateComplete
  return chart
}

const plot = (chart: MoulAreaChart) =>
  chart.shadowRoot?.querySelector<HTMLElement>('[part="container"]') ?? null

const key = (el: Element, name: string) =>
  el.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: name,
      bubbles: true,
      cancelable: true,
    }),
  )

/** Gives the plot a 600×300 box at the origin, the size the chart draws at in happy-dom. */
function stubBox(el: HTMLElement): void {
  el.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 600,
      bottom: 300,
      width: 600,
      height: 300,
      x: 0,
      y: 0,
    }) as DOMRect
}

function hovers(chart: MoulAreaChart): PointHoverDetail[] {
  const seen: PointHoverDetail[] = []
  chart.addEventListener('point-hover', (event) => {
    seen.push((event as CustomEvent<PointHoverDetail>).detail)
  })
  return seen
}

const strokes = (chart: MoulAreaChart) =>
  Array.from(chart.shadowRoot?.querySelectorAll('path.chart-line') ?? []).map(
    (path) => path.getAttribute('d'),
  )

describe('<moul-area-chart> scrubbing', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    document.body.innerHTML = ''
  })

  describe('keyboard and screen readers', () => {
    it('is one tab stop exposed as a slider named by label', async () => {
      const chart = await mount()
      const el = plot(chart)
      expect(el?.getAttribute('role')).toBe('slider')
      expect(el?.getAttribute('tabindex')).toBe('0')
      expect(el?.getAttribute('aria-label')).toBe('Visits')
      expect(el?.getAttribute('aria-valuemin')).toBe('0')
      expect(el?.getAttribute('aria-valuemax')).toBe('3')
      // At rest it names the latest category.
      expect(el?.getAttribute('aria-valuenow')).toBe('3')
      expect(el?.getAttribute('aria-valuetext')).toBe('Thu: Web 180, Mobile 90')
      // The slider carries the values, so the SVG is hidden.
      expect(
        chart.shadowRoot?.querySelector('svg')?.getAttribute('aria-hidden'),
      ).toBe('true')
    })

    it('steps through the categories with the arrow keys, Home and End', async () => {
      const chart = await mount()
      const el = plot(chart) as HTMLElement
      const seen = hovers(chart)

      key(el, 'Home')
      await chart.updateComplete
      expect(el.getAttribute('aria-valuenow')).toBe('0')
      expect(el.getAttribute('aria-valuetext')).toBe('Mon: Web 120, Mobile 80')
      expect(el.hasAttribute('data-active')).toBe(true)

      key(el, 'ArrowRight')
      await chart.updateComplete
      expect(el.getAttribute('aria-valuenow')).toBe('1')
      key(el, 'ArrowUp')
      await chart.updateComplete
      expect(el.getAttribute('aria-valuenow')).toBe('2')
      key(el, 'ArrowDown')
      await chart.updateComplete
      expect(el.getAttribute('aria-valuenow')).toBe('1')
      key(el, 'End')
      await chart.updateComplete
      expect(el.getAttribute('aria-valuenow')).toBe('3')
      // No wrapping past the last category.
      key(el, 'ArrowRight')
      await chart.updateComplete
      expect(el.getAttribute('aria-valuenow')).toBe('3')

      expect(seen.map((d) => d.label)).toEqual([
        'Mon',
        'Tue',
        'Wed',
        'Tue',
        'Thu',
      ])
      expect(seen[0]?.index).toBe(0)
      expect(seen[0]?.entries).toEqual([
        { key: 'web', name: 'Web', value: 120, color: 'var(--color-chart-1)' },
        {
          key: 'mobile',
          name: 'Mobile',
          value: 80,
          color: 'var(--color-chart-2)',
        },
      ])
    })

    it('Escape and blur hide the guide and fire point-leave', async () => {
      const chart = await mount()
      const el = plot(chart) as HTMLElement
      let leaves = 0
      chart.addEventListener('point-leave', () => {
        leaves++
      })

      key(el, 'Home')
      await chart.updateComplete
      expect(key(el, 'Escape')).toBe(false)
      await chart.updateComplete
      expect(el.hasAttribute('data-active')).toBe(false)
      expect(leaves).toBe(1)

      key(el, 'ArrowLeft')
      await chart.updateComplete
      expect(el.getAttribute('aria-valuenow')).toBe('2')
      el.dispatchEvent(new FocusEvent('blur'))
      await chart.updateComplete
      expect(el.hasAttribute('data-active')).toBe(false)
      expect(leaves).toBe(2)
    })

    it('formats the value text with valueFormatter', async () => {
      const chart = await mount()
      chart.valueFormatter = (value: number) => `${value} visits`
      await chart.updateComplete
      expect(plot(chart)?.getAttribute('aria-valuetext')).toBe(
        'Thu: Web 180 visits, Mobile 90 visits',
      )
    })

    it('scrub="false" takes no focus and leaves the SVG alone', async () => {
      const chart = await mount(WEEK, { scrub: 'false' })
      const el = plot(chart)
      expect(chart.scrub).toBe(false)
      expect(el?.hasAttribute('role')).toBe(false)
      expect(el?.hasAttribute('tabindex')).toBe(false)
      expect(chart.shadowRoot?.querySelector('.scrub-guide')).toBeNull()
      expect(
        chart.shadowRoot?.querySelector('svg')?.hasAttribute('aria-hidden'),
      ).toBe(false)
    })
  })

  describe('pointer', () => {
    it('snaps to the nearest category and reports the series nearest the pointer', async () => {
      const chart = await mount()
      const el = plot(chart) as HTMLElement
      stubBox(el)
      const seen = hovers(chart)

      // Columns sit at 40, 221.3, 402.7 and 584; x 230 is nearest Tue.
      el.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 230, clientY: 20 }),
      )
      await chart.updateComplete
      expect(el.getAttribute('aria-valuenow')).toBe('1')
      expect(seen.at(-1)?.label).toBe('Tue')
      // Near the top, Web (160) is closer than Mobile (95).
      expect((seen.at(-1)?.series as { key: string }).key).toBe('web')

      el.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 232, clientY: 290 }),
      )
      await chart.updateComplete
      expect((seen.at(-1)?.series as { key: string }).key).toBe('mobile')
      expect(seen).toHaveLength(2)

      // Moving within the same column and series stays quiet.
      el.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 225, clientY: 288 }),
      )
      expect(seen).toHaveLength(2)

      const guide = chart.shadowRoot?.querySelector<HTMLElement>('.scrub-guide')
      expect(guide?.getAttribute('style')).toContain('left: 36.889%')
      expect(chart.shadowRoot?.querySelectorAll('.scrub-dot')).toHaveLength(2)

      el.dispatchEvent(new PointerEvent('pointerleave'))
      await chart.updateComplete
      expect(el.hasAttribute('data-active')).toBe(false)
    })

    it('keeps the scrubbed column through a live data update and reports the new values', async () => {
      const chart = await mount()
      const el = plot(chart) as HTMLElement
      const seen = hovers(chart)
      key(el, 'Home')
      await chart.updateComplete
      chart.data = WEEK.map((row) => ({ ...row, web: row.web + 1 }))
      await chart.updateComplete
      expect(el.getAttribute('aria-valuenow')).toBe('0')
      expect(seen.at(-1)?.value).toBe(121)
    })
  })

  describe('range morph', () => {
    const MONTH = Array.from({ length: 8 }, (_, i) => ({
      day: `D${i + 1}`,
      web: 100 + ((i * 37) % 90),
      mobile: 60 + ((i * 23) % 70),
    }))

    async function finalShape(data: typeof MONTH): Promise<(string | null)[]> {
      const reference = await mount(data)
      const shape = strokes(reference)
      reference.parentElement?.remove()
      return shape
    }

    it('morphs from the old shape to the new one when the data changes', async () => {
      motion = mockReducedMotion(false)
      const target = await finalShape(MONTH)
      const chart = await mount()
      const before = strokes(chart)

      chart.data = MONTH
      await chart.updateComplete
      const start = strokes(chart)
      expect(start).not.toEqual(target)
      expect(start).not.toEqual(before)
      // Eight columns now, read off the old four-point curve.
      expect(chart.shadowRoot?.querySelectorAll('svg circle')).toHaveLength(16)

      await wait(600)
      await chart.updateComplete
      expect(strokes(chart)).toEqual(target)
    })

    it('jumps to the new shape under reduced motion', async () => {
      motion = mockReducedMotion(true)
      const target = await finalShape(MONTH)
      const chart = await mount()
      chart.data = MONTH
      await chart.updateComplete
      expect(strokes(chart)).toEqual(target)
    })
  })
})
