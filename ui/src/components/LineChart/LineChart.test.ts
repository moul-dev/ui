import { html, render } from 'lit'
import { afterEach, describe, expect, it } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import type { PointHoverDetail } from '../ChartCommon'
import './LineChart'
import type { LineChartPauseChangeDetail, MoulLineChart } from './LineChart'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const reading = (i: number) => ({
  time: `10:${String(i).padStart(2, '0')}`,
  cpu: 40 + ((i * 17) % 40),
})

const readings = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => reading(from + i))

async function mount(
  template: (host: HTMLElement) => void,
): Promise<MoulLineChart> {
  const host = document.createElement('div')
  document.body.append(host)
  template(host)
  const chart = host.firstElementChild as MoulLineChart
  await chart.updateComplete
  return chart
}

const live = (maxPoints = 5, data = readings(0, 5)) =>
  mount((host) =>
    render(
      html`<moul-line-chart
        x-key="time"
        label="CPU"
        is-live
        max-points=${maxPoints}
        .data=${data}
        .series=${[{ key: 'cpu', name: 'CPU' }]}
      ></moul-line-chart>`,
      host,
    ),
  )

const plot = (chart: MoulLineChart) =>
  chart.shadowRoot?.querySelector<HTMLElement>('[part="container"]') ?? null

const track = (chart: MoulLineChart) =>
  chart.shadowRoot?.querySelector('.live-track') ?? null

const line = (chart: MoulLineChart) =>
  chart.shadowRoot?.querySelector('path.series-path')?.getAttribute('d')

const key = (el: Element, name: string) =>
  el.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: name,
      bubbles: true,
      cancelable: true,
    }),
  )

describe('<moul-line-chart>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    document.body.innerHTML = ''
  })

  describe('keyboard and screen readers', () => {
    it('scrubs as a slider: arrow keys, Home, End and Escape', async () => {
      const chart = await mount((host) =>
        render(
          html`<moul-line-chart
            x-key="month"
            .data=${[
              { month: 'Jan', a: 1, b: 4 },
              { month: 'Feb', a: 2, b: 5 },
              { month: 'Mar', a: 3, b: 6 },
            ]}
            .series=${[{ key: 'a', name: 'Alpha' }, { key: 'b', name: 'Beta' }]}
          ></moul-line-chart>`,
          host,
        ),
      )
      const el = plot(chart) as HTMLElement
      const seen: PointHoverDetail[] = []
      chart.addEventListener('point-hover', (event) => {
        seen.push((event as CustomEvent<PointHoverDetail>).detail)
      })

      expect(el.getAttribute('role')).toBe('slider')
      expect(el.getAttribute('aria-label')).toBe('Line chart')
      expect(el.getAttribute('aria-valuetext')).toBe('Mar: Alpha 3, Beta 6')

      key(el, 'ArrowLeft')
      await chart.updateComplete
      expect(el.getAttribute('aria-valuenow')).toBe('1')
      expect(el.getAttribute('aria-valuetext')).toBe('Feb: Alpha 2, Beta 5')
      key(el, 'Home')
      await chart.updateComplete
      expect(el.getAttribute('aria-valuenow')).toBe('0')
      expect(seen.map((d) => d.label)).toEqual(['Feb', 'Jan'])
      expect(seen[1]?.entries?.map((e) => e.value)).toEqual([1, 4])

      key(el, 'Escape')
      await chart.updateComplete
      expect(el.hasAttribute('data-active')).toBe(false)
    })

    it('with scrub="false" keeps the SVG as one img named by label', async () => {
      const chart = await mount((host) =>
        render(
          html`<moul-line-chart
            scrub="false"
            label="Revenue"
            .data=${[{ name: 'A', v: 1 }]}
          ></moul-line-chart>`,
          host,
        ),
      )
      const svg = chart.shadowRoot?.querySelector('svg')
      expect(plot(chart)?.hasAttribute('role')).toBe(false)
      expect(svg?.getAttribute('role')).toBe('img')
      expect(svg?.getAttribute('aria-label')).toBe('Revenue')
    })

    it('gives live mode a labelled pause button that toggles is-paused', async () => {
      const chart = await live()
      const button = chart.shadowRoot?.querySelector<HTMLButtonElement>(
        '[part="pause-button"]',
      )
      const changes: boolean[] = []
      chart.addEventListener('pausechange', (event) => {
        changes.push(
          (event as CustomEvent<LineChartPauseChangeDetail>).detail.isPaused,
        )
      })
      expect(button?.tagName).toBe('BUTTON')
      expect(button?.getAttribute('aria-label')).toBe('Pause live updates')
      expect(button?.getAttribute('aria-pressed')).toBe('false')

      button?.click()
      await chart.updateComplete
      expect(chart.isPaused).toBe(true)
      expect(chart.hasAttribute('is-paused')).toBe(true)
      expect(button?.getAttribute('aria-pressed')).toBe('true')
      button?.click()
      await chart.updateComplete
      expect(changes).toEqual([true, false])

      // Only live charts get the button.
      chart.isLive = false
      await chart.updateComplete
      expect(
        chart.shadowRoot?.querySelector('[part="pause-button"]'),
      ).toBeNull()
    })
  })

  describe('live mode', () => {
    it('push() appends readings and keeps the latest max-points', async () => {
      const chart = await live(5)
      chart.push(reading(5))
      chart.push([reading(6), reading(7)])
      await chart.updateComplete
      expect(chart.data.map((row) => row.time)).toEqual([
        '10:03',
        '10:04',
        '10:05',
        '10:06',
        '10:07',
      ])
      // Live mode draws no dots: the line and a head on the newest reading.
      expect(
        chart.shadowRoot?.querySelectorAll('circle.point-marker'),
      ).toHaveLength(0)
      expect(chart.shadowRoot?.querySelectorAll('[part="head"]')).toHaveLength(
        1,
      )
    })

    it('glides the track left from one step to the right after a push', async () => {
      motion = mockReducedMotion(false)
      const chart = await live(5)
      chart.push(reading(5))
      await chart.updateComplete
      // 600 wide with 48 and 24 of padding: four steps of 132.
      expect(track(chart)?.getAttribute('transform')).toBe(
        'translate(132.00 0)',
      )
      await wait(500)
      expect(track(chart)?.hasAttribute('transform')).toBe(false)
    })

    it('jumps instead of gliding under reduced motion', async () => {
      motion = mockReducedMotion(true)
      const chart = await live(5)
      chart.push(reading(5))
      await chart.updateComplete
      expect(track(chart)?.hasAttribute('transform')).toBe(false)
    })

    it('freezes the view while paused and catches up on resume', async () => {
      const chart = await live(5)
      const before = line(chart)
      chart.isPaused = true
      await chart.updateComplete
      chart.push([reading(5), reading(6)])
      await chart.updateComplete
      expect(chart.data).toHaveLength(5)
      expect(chart.data.at(-1)?.time).toBe('10:06')
      expect(line(chart)).toBe(before)

      chart.isPaused = false
      await chart.updateComplete
      expect(line(chart)).not.toBe(before)
      expect(plot(chart)?.getAttribute('aria-valuetext')).toBe('10:06: 62')
    })

    it('holds the view still while the user scrubs it', async () => {
      const chart = await live(5)
      const el = plot(chart) as HTMLElement
      key(el, 'End')
      await chart.updateComplete
      const before = line(chart)
      chart.push(reading(5))
      await chart.updateComplete
      expect(line(chart)).toBe(before)
      expect(el.getAttribute('aria-valuetext')).toBe('10:04: 68')

      key(el, 'Escape')
      await chart.updateComplete
      expect(line(chart)).not.toBe(before)
    })
  })
})
