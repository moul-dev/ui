import { html, render } from 'lit'
import { afterEach, describe, expect, it } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './DoughnutChart'
import type { MoulDoughnutChart } from './DoughnutChart'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const TRAFFIC = [
  { name: 'Organic', value: 420 },
  { name: 'Referral', value: 260 },
  { name: 'Social', value: 190 },
]

async function mount(
  template: ReturnType<typeof html>,
): Promise<MoulDoughnutChart> {
  const host = document.createElement('div')
  document.body.append(host)
  render(template, host)
  const chart = host.firstElementChild as MoulDoughnutChart
  await chart.updateComplete
  return chart
}

const centre = (chart: MoulDoughnutChart) => ({
  label: chart.shadowRoot?.querySelector('.center-label')?.textContent?.trim(),
  sublabel: chart.shadowRoot
    ?.querySelector('.center-sublabel')
    ?.textContent?.trim(),
})

const valueArc = (chart: MoulDoughnutChart) =>
  chart.shadowRoot?.querySelector('[part="value-arc"]')?.getAttribute('d')

describe('<moul-doughnut-chart> gauge and live centre', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    document.body.innerHTML = ''
  })

  describe('keyboard and screen readers', () => {
    it('exposes a gauge as one meter with its range and formatted value', async () => {
      motion = mockReducedMotion(true)
      const chart = await mount(html`
        <moul-doughnut-chart
          value="72.5"
          center-sublabel="Disk used"
          .valueFormatter=${(v: number) => `${v}%`}
        ></moul-doughnut-chart>
      `)
      const meter = chart.shadowRoot?.querySelector('[part="wrapper"]')
      expect(chart.isGauge).toBe(true)
      expect(meter?.getAttribute('role')).toBe('meter')
      expect(meter?.getAttribute('aria-label')).toBe('Disk used')
      expect(meter?.getAttribute('aria-valuemin')).toBe('0')
      expect(meter?.getAttribute('aria-valuemax')).toBe('100')
      expect(meter?.getAttribute('aria-valuenow')).toBe('72.5')
      expect(meter?.getAttribute('aria-valuetext')).toBe('72.5%')
      expect(meter?.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
        'true',
      )
      // A gauge takes no focus.
      expect(chart.shadowRoot?.querySelector('[tabindex]')).toBeNull()
    })

    it('shows the focused slice in the centre and returns to the label after blur', async () => {
      motion = mockReducedMotion(true)
      const chart = await mount(html`
        <moul-doughnut-chart
          center-label="870"
          center-sublabel="Visitors"
          .data=${TRAFFIC}
        ></moul-doughnut-chart>
      `)
      const slices = chart.shadowRoot?.querySelectorAll('.slice') ?? []
      expect(centre(chart)).toEqual({ label: '870', sublabel: 'Visitors' })

      slices[1]?.dispatchEvent(new FocusEvent('focus'))
      await chart.updateComplete
      expect(centre(chart)).toEqual({ label: '260', sublabel: 'Referral' })

      // Moving straight to the next slice keeps the centre on a slice.
      slices[1]?.dispatchEvent(new FocusEvent('blur'))
      slices[2]?.dispatchEvent(new FocusEvent('focus'))
      await chart.updateComplete
      expect(centre(chart)).toEqual({ label: '190', sublabel: 'Social' })

      slices[2]?.dispatchEvent(new FocusEvent('blur'))
      await wait(150)
      await chart.updateComplete
      expect(centre(chart)).toEqual({ label: '870', sublabel: 'Visitors' })
    })

    it('names the SVG by label first', async () => {
      const chart = await mount(html`
        <moul-doughnut-chart
          label="Traffic by source"
          center-label="870"
          .data=${TRAFFIC}
        ></moul-doughnut-chart>
      `)
      expect(
        chart.shadowRoot?.querySelector('svg')?.getAttribute('aria-label'),
      ).toBe('Traffic by source')
    })
  })

  describe('half circle', () => {
    it('lays slices over the top half and the centre on the flat edge', async () => {
      const chart = await mount(html`
        <moul-doughnut-chart
          shape="half"
          height="200"
          center-label="870"
          .data=${TRAFFIC}
        ></moul-doughnut-chart>
      `)
      const ys: number[] = []
      chart.addEventListener('point-hover', (event) => {
        ys.push((event as CustomEvent<{ y: number }>).detail.y)
      })
      for (const slice of chart.shadowRoot?.querySelectorAll('.slice') ?? []) {
        slice.dispatchEvent(new PointerEvent('pointerenter'))
      }
      // A 300 by 200 box: radius 134 on a flat edge at y 167, so every slice's middle is above it.
      expect(ys).toHaveLength(3)
      for (const y of ys) expect(y).toBeLessThan(167)
      expect(
        chart.shadowRoot?.querySelector('.center-container')?.classList,
      ).toContain('is-half')
    })

    it('falls back to a full circle for an unknown shape', async () => {
      const chart = await mount(html`
        <moul-doughnut-chart shape="oval" .data=${TRAFFIC}></moul-doughnut-chart>
      `)
      await chart.updateComplete
      expect(chart.shape).toBe('full')
    })
  })

  describe('gauge', () => {
    it('sweeps the arc and counts the centre to each new value', async () => {
      motion = mockReducedMotion(false)
      const chart = await mount(html`
        <moul-doughnut-chart value="40" min="0" max="200"></moul-doughnut-chart>
      `)
      // The first value sweeps in from the bottom of the range.
      expect(centre(chart).label).not.toBe('40')
      await wait(900)
      await chart.updateComplete
      expect(centre(chart).label).toBe('40')
      const at40 = valueArc(chart)

      chart.value = 180
      await chart.updateComplete
      await wait(30)
      await chart.updateComplete
      const mid = Number(centre(chart).label)
      expect(mid).toBeGreaterThan(40)
      expect(mid).toBeLessThan(180)
      await wait(900)
      await chart.updateComplete
      expect(centre(chart).label).toBe('180')
      expect(valueArc(chart)).not.toBe(at40)
    })

    it('jumps to the value under reduced motion and clamps it to the range', async () => {
      motion = mockReducedMotion(true)
      const chart = await mount(html`
        <moul-doughnut-chart value="140" max="120"></moul-doughnut-chart>
      `)
      expect(centre(chart).label).toBe('120')
      expect(
        chart.shadowRoot
          ?.querySelector('[part="wrapper"]')
          ?.getAttribute('aria-valuenow'),
      ).toBe('120')
      expect(chart.shadowRoot?.querySelector('[part="track"]')).not.toBeNull()
      expect(valueArc(chart)).toBeTruthy()

      chart.value = null
      await chart.updateComplete
      // Without a value and without data it is an empty chart again.
      expect(
        chart.shadowRoot?.querySelector('slot[name="empty"]'),
      ).not.toBeNull()
    })
  })
})
