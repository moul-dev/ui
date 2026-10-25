import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it } from 'vitest'
import type { FunnelStage } from './ChartCommon'
import './FunnelChart/FunnelChart'
import './ChartContainer/ChartContainer'
import type { MoulChartContainer } from './ChartContainer/ChartContainer'
import type { MoulFunnelChart } from './FunnelChart/FunnelChart'

const SIGNUPS: FunnelStage[] = [
  { label: 'Visited site', value: 48200 },
  { label: 'Signed up', value: 15840 },
  { label: 'Created project', value: 9120 },
  { label: 'Invited a teammate', value: 4210 },
  { label: 'Started paid plan', value: 1380 },
]

async function mount<T extends LitElement>(
  template: unknown,
  selector: string,
): Promise<T> {
  const container = document.createElement('div')
  container.lang = 'en-US'
  document.body.appendChild(container)
  render(template, container)
  const el = container.querySelector(selector) as T
  await el.updateComplete
  return el
}

function texts(el: Element, selector: string): string[] {
  return [...(el.shadowRoot?.querySelectorAll(selector) ?? [])].map(
    (node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  )
}

describe('MoulFunnelChart (`moul-funnel-chart`)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('FUNNEL-01: shows the empty state without data', async () => {
    const el = await mount<MoulFunnelChart>(
      html`<moul-funnel-chart></moul-funnel-chart>`,
      'moul-funnel-chart',
    )
    const empty = el.shadowRoot?.querySelector('[part="empty"]')
    expect(empty?.querySelector('slot[name="empty"]')).toBeTruthy()
    expect(el.shadowRoot?.querySelector('.stages')).toBeNull()
  })

  it('FUNNEL-02: labels each stage with its count and share of the first', async () => {
    const el = await mount<MoulFunnelChart>(
      html`<moul-funnel-chart .data=${SIGNUPS}></moul-funnel-chart>`,
      'moul-funnel-chart',
    )
    expect(texts(el, '.stage-label')).toEqual(SIGNUPS.map((s) => s.label))
    expect(texts(el, '.stage-count')).toEqual([
      '48,200',
      '15,840',
      '9,120',
      '4,210',
      '1,380',
    ])
    expect(texts(el, '.stage-percent')).toEqual([
      '100%',
      '33%',
      '19%',
      '8.7%',
      '2.9%',
    ])
  })

  it('FUNNEL-03: marks each step with its drop-off', async () => {
    const el = await mount<MoulFunnelChart>(
      html`<moul-funnel-chart .data=${SIGNUPS}></moul-funnel-chart>`,
      'moul-funnel-chart',
    )
    expect(texts(el, '.drop')).toEqual(['−67%', '−42%', '−54%', '−67%'])
    // One neck between each pair of stages.
    expect(el.shadowRoot?.querySelectorAll('.neck path')).toHaveLength(4)
  })

  it('FUNNEL-04: summarizes overall conversion and the steepest step', async () => {
    const el = await mount<MoulFunnelChart>(
      html`<moul-funnel-chart .data=${SIGNUPS}></moul-funnel-chart>`,
      'moul-funnel-chart',
    )
    expect(texts(el, '.headline')).toEqual(['2.9% overall conversion'])
    // 4,210 → 1,380 keeps 32.8%, a hair less than 48,200 → 15,840 (32.9%).
    expect(texts(el, '.biggest-drop')).toEqual([
      'Biggest drop: Invited a teammate → Started paid plan −67%',
    ])
  })

  it('FUNNEL-05: sizes bars against the first stage', async () => {
    const el = await mount<MoulFunnelChart>(
      html`<moul-funnel-chart .data=${SIGNUPS}></moul-funnel-chart>`,
      'moul-funnel-chart',
    )
    const widths = [
      ...(el.shadowRoot?.querySelectorAll<HTMLElement>('.stage') ?? []),
    ].map((stage) =>
      Number.parseFloat(stage.style.getPropertyValue('--_w')).toFixed(1),
    )
    expect(widths).toEqual(['100.0', '32.9', '18.9', '8.7', '2.9'])
  })

  it('FUNNEL-06: steps an ordinal ramp unless a stage brings its own color', async () => {
    const data = [
      { label: 'A', value: 10 },
      { label: 'B', value: 5, color: 'tomato' },
      { label: 'C', value: 2 },
    ]
    const el = await mount<MoulFunnelChart>(
      html`<moul-funnel-chart .data=${data}></moul-funnel-chart>`,
      'moul-funnel-chart',
    )
    const colors = [
      ...(el.shadowRoot?.querySelectorAll<HTMLElement>('.stage') ?? []),
    ].map((stage) => stage.style.getPropertyValue('--_color').trim())
    expect(colors[0]).toBe('color-mix(in oklch, var(--_to) 0%, var(--_from))')
    expect(colors[1]).toBe('tomato')
    expect(colors[2]).toBe('color-mix(in oklch, var(--_to) 100%, var(--_from))')
  })

  it('FUNNEL-07: survives zero, negative, and non-numeric values', async () => {
    const data = [
      { label: 'A', value: 0 },
      { label: 'B', value: -4 },
      { label: 'C', value: Number.NaN },
    ]
    const el = await mount<MoulFunnelChart>(
      html`<moul-funnel-chart .data=${data}></moul-funnel-chart>`,
      'moul-funnel-chart',
    )
    const rendered = el.shadowRoot?.textContent ?? ''
    expect(rendered).not.toContain('NaN')
    expect(rendered).not.toContain('Infinity')
    expect(texts(el, '.stage-count')).toEqual(['0', '0', '0'])
    // Nothing dropped, so there is no "biggest drop" to call out.
    expect(el.shadowRoot?.querySelector('.biggest-drop')).toBeNull()
  })

  it('FUNNEL-08: draws a single stage without necks or a drop line', async () => {
    const el = await mount<MoulFunnelChart>(
      html`<moul-funnel-chart .data=${[{ label: 'Only', value: 12 }]}></moul-funnel-chart>`,
      'moul-funnel-chart',
    )
    expect(el.shadowRoot?.querySelectorAll('.bar')).toHaveLength(1)
    expect(el.shadowRoot?.querySelector('.connector')).toBeNull()
    expect(texts(el, '.conversion')).toEqual(['100%'])
  })

  it('FUNNEL-09: hides the summary and renames its label', async () => {
    const el = await mount<MoulFunnelChart>(
      html`<moul-funnel-chart summary-label="visit to paid" .data=${SIGNUPS}></moul-funnel-chart>`,
      'moul-funnel-chart',
    )
    expect(texts(el, '.conversion-label')).toEqual(['visit to paid'])
    el.hideSummary = true
    await el.updateComplete
    expect(el.shadowRoot?.querySelector('.summary')).toBeNull()
  })

  it('FUNNEL-10: formats counts with valueFormatter', async () => {
    const el = await mount<MoulFunnelChart>(
      html`<moul-funnel-chart
        .data=${SIGNUPS}
        .valueFormatter=${(v: number) => `${(v / 1000).toFixed(1)}k`}
      ></moul-funnel-chart>`,
      'moul-funnel-chart',
    )
    expect(texts(el, '.stage-count')[0]).toBe('48.2k')
  })

  it('FUNNEL-11: highlights the hovered stage and reports it', async () => {
    const el = await mount<MoulFunnelChart>(
      html`<moul-funnel-chart .data=${SIGNUPS}></moul-funnel-chart>`,
      'moul-funnel-chart',
    )
    let detail: { point: FunnelStage; value: number } | null = null
    el.addEventListener('point-hover', (e) => {
      detail = (e as CustomEvent).detail
    })
    let left = false
    el.addEventListener('point-leave', () => {
      left = true
    })

    const stages = el.shadowRoot?.querySelectorAll<HTMLElement>('.stage')
    stages?.[1].dispatchEvent(new PointerEvent('pointerenter'))
    await el.updateComplete

    expect(detail).toMatchObject({ point: SIGNUPS[1], value: 15840 })
    expect(stages?.[1].classList.contains('is-active')).toBe(true)
    expect(stages?.[0].classList.contains('is-dimmed')).toBe(true)
    const card = el.shadowRoot?.querySelector('.hover-card') as HTMLElement
    expect(card.hasAttribute('data-open')).toBe(true)
    expect(card.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '15,840 Signed up From Visited site 32.9% Dropped off 32,360',
    )

    el.shadowRoot
      ?.querySelector('.stages')
      ?.dispatchEvent(new PointerEvent('pointerleave'))
    await el.updateComplete
    expect(left).toBe(true)
    expect(stages?.[0].classList.contains('is-dimmed')).toBe(false)
    expect(card.hasAttribute('data-open')).toBe(false)
  })

  it('FUNNEL-12: announces each step’s drop-off to screen readers', async () => {
    const el = await mount<MoulFunnelChart>(
      html`<moul-funnel-chart .data=${SIGNUPS}></moul-funnel-chart>`,
      'moul-funnel-chart',
    )
    expect(texts(el, '.stage .sr-only')[0]).toBe(
      ', 67% drop-off from the previous step',
    )
    expect(
      el.shadowRoot?.querySelector('.connector')?.getAttribute('aria-hidden'),
    ).toBe('true')
  })
})

describe('MoulChartContainer layout', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('CONTAINER-01: sizes to its content unless a height is set', async () => {
    const el = await mount<MoulChartContainer>(
      html`<moul-chart-container title="Signups"></moul-chart-container>`,
      'moul-chart-container',
    )
    const content =
      el.shadowRoot?.querySelector<HTMLElement>('[part="content"]')
    expect(el.height).toBeUndefined()
    expect(content?.style.height).toBe('')

    el.height = 320
    await el.updateComplete
    expect(content?.style.height).toBe('320px')
  })

  it('CONTAINER-02: collapses an empty header and legend', async () => {
    const el = await mount<MoulChartContainer>(
      html`<moul-chart-container></moul-chart-container>`,
      'moul-chart-container',
    )
    const header = el.shadowRoot?.querySelector('[part="header"]')
    const legend = el.shadowRoot?.querySelector('[part="legend"]')
    expect(header?.hasAttribute('data-empty')).toBe(true)
    expect(legend?.hasAttribute('data-empty')).toBe(true)

    el.title = 'Signups'
    await el.updateComplete
    expect(header?.hasAttribute('data-empty')).toBe(false)
  })

  it('CONTAINER-03: keeps the header and legend for slotted content', async () => {
    const el = await mount<MoulChartContainer>(
      html`<moul-chart-container>
        <button slot="header">Range</button>
        <span slot="legend">Desktop</span>
      </moul-chart-container>`,
      'moul-chart-container',
    )
    // slotchange fires after the first render.
    await new Promise((resolve) => setTimeout(resolve, 0))
    await el.updateComplete
    expect(
      el.shadowRoot
        ?.querySelector('[part="header"]')
        ?.hasAttribute('data-empty'),
    ).toBe(false)
    expect(
      el.shadowRoot
        ?.querySelector('[part="legend"]')
        ?.hasAttribute('data-empty'),
    ).toBe(false)
  })
})
