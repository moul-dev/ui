import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it } from 'vitest'
import type { HeatmapDataItem } from './ChartCommon'
import './HeatmapChart/HeatmapChart'
import type { MoulHeatmapChart } from './HeatmapChart/HeatmapChart'

async function mount(template: unknown): Promise<MoulHeatmapChart> {
  const container = document.createElement('div')
  // Pin the locale so date and number labels are stable across machines.
  container.lang = 'en-US'
  document.body.appendChild(container)
  render(template, container)
  const el = container.querySelector('moul-heatmap-chart') as MoulHeatmapChart
  await (el as LitElement).updateComplete
  return el
}

function text(el: MoulHeatmapChart, selector: string): string {
  return (
    el.shadowRoot
      ?.querySelector(selector)
      ?.textContent?.replace(/\s+/g, ' ')
      .trim() ?? ''
  )
}

function cellEl(el: MoulHeatmapChart, index: number): HTMLElement {
  return el.shadowRoot?.querySelector(
    `.cell[data-index="${index}"]`,
  ) as HTMLElement
}

describe('MoulHeatmapChart (`moul-heatmap-chart`)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('calendar layout', () => {
    it('HEAT-01: draws full weeks that start on Sunday and end on end-date', async () => {
      // 2025-10-25 is a Saturday, so the last column is complete.
      const el = await mount(html`
        <moul-heatmap-chart end-date="2025-10-25"></moul-heatmap-chart>
      `)
      expect(el.cells).toHaveLength(53 * 7)
      expect(el.cells[0].date?.getDay()).toBe(0)
      expect(el.cells[el.cells.length - 1].label).toBe('Sat, Oct 25, 2025')
    })

    it('HEAT-02: stops the newest column at end-date', async () => {
      // A Friday: the last column holds Sunday through Friday.
      const el = await mount(html`
        <moul-heatmap-chart end-date="2025-10-24" weeks="10"></moul-heatmap-chart>
      `)
      expect(el.cells).toHaveLength(9 * 7 + 6)
      expect(el.shadowRoot?.querySelectorAll('.cell')).toHaveLength(69)
      expect(el.cells[el.cells.length - 1].label).toBe('Fri, Oct 24, 2025')
    })

    it('HEAT-03: starts columns on Monday with week-start="1"', async () => {
      const el = await mount(html`
        <moul-heatmap-chart end-date="2025-10-26" week-start="1"></moul-heatmap-chart>
      `)
      expect(el.cells[0].date?.getDay()).toBe(1)
      const rowLabels = [
        ...(el.shadowRoot?.querySelectorAll('.row-label') ?? []),
      ].map((label) => label.textContent?.trim())
      expect(rowLabels).toEqual(['Mon', 'Wed', 'Fri'])
    })

    it('HEAT-04: labels months on their first full column and drops a crowded first label', async () => {
      // The first column starts Oct 20, 2024; November starts two columns later.
      const el = await mount(html`
        <moul-heatmap-chart end-date="2025-10-25"></moul-heatmap-chart>
      `)
      const labels = [
        ...(el.shadowRoot?.querySelectorAll('.col-label') ?? []),
      ].map((label) => label.textContent?.trim())
      expect(labels[0]).toBe('Nov')
      expect(labels).toContain('Jan')
      expect(labels.filter((label) => label === 'Oct')).toHaveLength(1)
    })
  })

  describe('aggregation and summary', () => {
    const data: HeatmapDataItem[] = [
      { date: '2025-10-24', value: 17 },
      { date: '2025-10-24' },
      { date: '2025-10-20', value: 3 },
      { date: new Date(2025, 9, 21, 15, 30), value: 1 },
      // Outside the 53-week window and unparseable entries are ignored.
      { date: '2024-01-01', value: 99 },
      { date: 'not a date', value: 5 },
      { date: '2025-10-22', value: Number.NaN },
    ]

    it('HEAT-05: sums values per local day, counting value-less items as 1', async () => {
      const el = await mount(html`
        <moul-heatmap-chart end-date="2025-10-25" .data=${data}></moul-heatmap-chart>
      `)
      const day = (label: string) =>
        el.cells.find((cell) => cell.label === label)?.value
      expect(day('Fri, Oct 24, 2025')).toBe(18)
      expect(day('Mon, Oct 20, 2025')).toBe(3)
      expect(day('Tue, Oct 21, 2025')).toBe(1)
      expect(day('Wed, Oct 22, 2025')).toBe(0)
    })

    it('HEAT-06: summarizes the total and the busiest day', async () => {
      const el = await mount(html`
        <moul-heatmap-chart end-date="2025-10-25" .data=${data}></moul-heatmap-chart>
      `)
      expect(text(el, '.total')).toBe('22 contributions in the last year')
      expect(text(el, '.peak')).toBe('Peak Fri, Oct 24, 2025 · 18')
    })

    it('HEAT-07: names shorter windows by their week count and singularizes the unit', async () => {
      const el = await mount(html`
        <moul-heatmap-chart
          end-date="2025-10-25"
          weeks="12"
          unit="activities"
          .data=${[{ date: '2025-10-24' }]}
        ></moul-heatmap-chart>
      `)
      expect(text(el, '.total')).toBe('1 activity in the last 12 weeks')

      el.unitSingular = 'deed'
      await el.updateComplete
      expect(text(el, '.total')).toBe('1 deed in the last 12 weeks')
    })

    it('HEAT-08: formats numbers with valueFormatter', async () => {
      const el = await mount(html`
        <moul-heatmap-chart
          end-date="2025-10-25"
          .data=${[{ date: '2025-10-24', value: 1500 }]}
          .valueFormatter=${(v: number) => `${v / 1000}k`}
        ></moul-heatmap-chart>
      `)
      expect(text(el, '.total')).toBe('1.5k contributions in the last year')
    })

    it('HEAT-09: omits the peak and keeps zero cells empty when there is no data', async () => {
      const el = await mount(html`
        <moul-heatmap-chart end-date="2025-10-25"></moul-heatmap-chart>
      `)
      expect(text(el, '.total')).toBe('0 contributions in the last year')
      expect(el.shadowRoot?.querySelector('.peak')).toBeNull()
      expect(el.cells.every((cell) => cell.level === 0)).toBe(true)
      expect(cellEl(el, 0).getAttribute('aria-label')).toBe(
        'No contributions, Sun, Oct 20, 2024',
      )
    })

    it('HEAT-10: hides the summary and legend on request', async () => {
      const el = await mount(html`
        <moul-heatmap-chart hide-summary hide-legend></moul-heatmap-chart>
      `)
      expect(el.shadowRoot?.querySelector('.summary')).toBeNull()
      expect(el.shadowRoot?.querySelector('.legend')).toBeNull()
    })
  })

  describe('levels', () => {
    it('HEAT-11: splits active days into quartiles and gives the max level 4', async () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8].map((value, i) => ({
        date: `2025-10-${String(10 + i).padStart(2, '0')}`,
        value,
      }))
      const el = await mount(html`
        <moul-heatmap-chart end-date="2025-10-25" .data=${data}></moul-heatmap-chart>
      `)
      const levelOf = (value: number) =>
        el.cells.find((cell) => cell.value === value)?.level
      expect([1, 2, 3, 4, 5, 6, 7, 8].map(levelOf)).toEqual([
        1, 1, 2, 2, 3, 3, 4, 4,
      ])
      expect(el.cells.find((cell) => cell.value === 0)?.level).toBe(0)
      expect(
        cellEl(
          el,
          el.cells.findIndex((c) => c.value === 8),
        ).dataset.level,
      ).toBe('4')
    })

    it('HEAT-12: applies a custom ramp color', async () => {
      const el = await mount(html`
        <moul-heatmap-chart color="var(--color-chart-1)"></moul-heatmap-chart>
      `)
      const frame = el.shadowRoot?.querySelector<HTMLElement>('.frame')
      expect(frame?.getAttribute('style')).toContain(
        '--_heat: var(--color-chart-1)',
      )
    })
  })

  describe('hour mode', () => {
    const events: HeatmapDataItem[] = [
      { date: new Date(2025, 9, 24, 14, 5) },
      { date: new Date(2025, 9, 24, 14, 50) },
      { date: new Date(2025, 9, 17, 14, 20) },
      { date: new Date(2025, 9, 20, 9, 0), value: 2 },
    ]

    it('HEAT-13: buckets timestamps into weekday × hour cells', async () => {
      const el = await mount(html`
        <moul-heatmap-chart mode="hour" end-date="2025-10-25" .data=${events}></moul-heatmap-chart>
      `)
      expect(el.cells).toHaveLength(7 * 24)
      const friday2pm = el.cells.find(
        (cell) => cell.weekday === 5 && cell.hour === 14,
      )
      expect(friday2pm?.value).toBe(3)
      expect(
        el.cells.find((cell) => cell.weekday === 1 && cell.hour === 9)?.value,
      ).toBe(2)
      expect(text(el, '.total')).toBe('5 contributions in the last year')
      expect(text(el, '.peak')).toBe('Peak Fri, 2 PM – 3 PM · 3')
    })

    it('HEAT-14: labels every sixth hour', async () => {
      const el = await mount(html`
        <moul-heatmap-chart mode="hour"></moul-heatmap-chart>
      `)
      const labels = [
        ...(el.shadowRoot?.querySelectorAll('.col-label') ?? []),
      ].map((label) => label.textContent?.replace(/\s/g, ' ').trim())
      expect(labels).toEqual(['12 AM', '6 AM', '12 PM', '6 PM'])
    })

    it('HEAT-15: rebuilds the grid when the mode changes', async () => {
      const el = await mount(html`
        <moul-heatmap-chart end-date="2025-10-25" .data=${events}></moul-heatmap-chart>
      `)
      expect(el.cells).toHaveLength(371)
      el.mode = 'hour'
      await el.updateComplete
      expect(el.cells).toHaveLength(168)
      expect(el.shadowRoot?.querySelectorAll('.cell')).toHaveLength(168)
      expect(el.getAttribute('mode')).toBe('hour')
    })
  })

  describe('interaction', () => {
    it('HEAT-16: makes only the newest cell tabbable', async () => {
      const el = await mount(html`
        <moul-heatmap-chart end-date="2025-10-24"></moul-heatmap-chart>
      `)
      const tabbable = el.shadowRoot?.querySelectorAll('.cell[tabindex="0"]')
      expect(tabbable).toHaveLength(1)
      expect((tabbable?.[0] as HTMLElement).dataset.index).toBe(
        String(el.cells.length - 1),
      )
    })

    it('HEAT-17: moves focus by week and day with the arrow keys', async () => {
      const el = await mount(html`
        <moul-heatmap-chart end-date="2025-10-24"></moul-heatmap-chart>
      `)
      const grid = el.shadowRoot?.querySelector('.grid') as HTMLElement
      const press = async (key: string) => {
        grid.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
        await el.updateComplete
        await el.updateComplete
        const current = el.shadowRoot?.querySelector(
          '.cell[tabindex="0"]',
        ) as HTMLElement
        return el.cells[Number(current.dataset.index)].label
      }

      expect(await press('ArrowLeft')).toBe('Fri, Oct 17, 2025')
      expect(await press('ArrowUp')).toBe('Thu, Oct 16, 2025')
      expect(await press('ArrowRight')).toBe('Thu, Oct 23, 2025')
      // The newest column has no Saturday yet, so ArrowDown twice stays on Friday.
      expect(await press('ArrowDown')).toBe('Fri, Oct 24, 2025')
      expect(await press('ArrowDown')).toBe('Fri, Oct 24, 2025')
      expect(await press('Home')).toBe('Fri, Oct 25, 2024')
      expect(await press('End')).toBe('Fri, Oct 24, 2025')
    })

    it('HEAT-18: reports the hovered cell and shows its readout', async () => {
      const el = await mount(html`
        <moul-heatmap-chart
          end-date="2025-10-25"
          .data=${[{ date: '2025-10-24', value: 17 }]}
        ></moul-heatmap-chart>
      `)
      const index = el.cells.findIndex((cell) => cell.value === 17)
      let detail: { value: unknown; label: string } | null = null
      el.addEventListener('point-hover', (e) => {
        detail = (e as CustomEvent).detail
      })
      let left = false
      el.addEventListener('point-leave', () => {
        left = true
      })

      cellEl(el, index).dispatchEvent(
        new PointerEvent('pointerover', { bubbles: true, composed: true }),
      )
      await el.updateComplete
      expect(detail).toMatchObject({ value: 17, label: 'Fri, Oct 24, 2025' })
      const card = el.shadowRoot?.querySelector('.hover-card') as HTMLElement
      expect(card.hasAttribute('data-open')).toBe(true)
      expect(card.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        '17 contributions Fri, Oct 24, 2025',
      )

      el.shadowRoot
        ?.querySelector('.grid')
        ?.dispatchEvent(new PointerEvent('pointerleave'))
      await el.updateComplete
      expect(left).toBe(true)
      expect(card.hasAttribute('data-open')).toBe(false)
    })

    it('HEAT-19: labels each cell for assistive tech', async () => {
      const el = await mount(html`
        <moul-heatmap-chart
          end-date="2025-10-25"
          .data=${[{ date: '2025-10-24', value: 1 }]}
        ></moul-heatmap-chart>
      `)
      const index = el.cells.findIndex((cell) => cell.value === 1)
      expect(cellEl(el, index).getAttribute('aria-label')).toBe(
        '1 contribution, Fri, Oct 24, 2025',
      )
      expect(
        el.shadowRoot
          ?.querySelector('[role="grid"]')
          ?.getAttribute('aria-label'),
      ).toBe('Contributions by day')
    })
  })
})
