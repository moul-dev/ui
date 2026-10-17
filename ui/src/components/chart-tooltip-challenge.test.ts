import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'

import './ChartTooltip/ChartTooltip'
import type {
  ChartTooltipShowOptions,
  MoulChartTooltip,
} from './ChartTooltip/ChartTooltip'

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

describe('Empirical Challenge Suite: MoulChartTooltip Stress & Boundary Testing', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  // ===========================================================================
  // 1. Rapid Show / Hide Toggling & Race Conditions
  // ===========================================================================
  describe('1. Rapid Show / Hide Toggling & Race Conditions', () => {
    it('CHALLENGE-TLP-01: 100 synchronous rapid show/hide cycles without delay completes with correct final state', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      // Rapidly toggle 100 times synchronously ending on show
      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          tooltip.show(i * 5, i * 2, `Label ${i}`, `${i}`)
        } else {
          tooltip.hide()
        }
      }
      // Loop ends on i=99 which calls tooltip.hide()
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isOpen).toBe(false)
      expect(tooltip.matches(':popover-open')).toBe(false)

      // Now toggle 101 times ending on show
      for (let i = 0; i < 101; i++) {
        if (i % 2 === 0) {
          tooltip.show(i * 10, i * 5, `Final Point ${i}`, `$${i * 100}`)
        } else {
          tooltip.hide()
        }
      }
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.matches(':popover-open')).toBe(true)
      const label = tooltip.shadowRoot?.querySelector('[part="label"]')
      const value = tooltip.shadowRoot?.querySelector('[part="value"]')
      expect(label?.textContent).toBe('Final Point 100')
      expect(value?.textContent).toBe('$10000')
    })

    it('CHALLENGE-TLP-02: Microtask-interleaved toggling does not corrupt internal open state', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      for (let i = 0; i < 20; i++) {
        tooltip.show({ label: `Step ${i}`, value: `${i}`, x: i, y: i })
        await Promise.resolve()
        tooltip.hide()
        await Promise.resolve()
      }

      await awaitNestedUpdates(tooltip)
      expect(tooltip.isOpen).toBe(false)
      expect(tooltip.matches(':popover-open')).toBe(false)

      // Re-open after churn
      tooltip.show({ label: 'Recovered', value: '999', x: 50, y: 50 })
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.matches(':popover-open')).toBe(true)
      expect(
        tooltip.shadowRoot?.querySelector('[part="label"]')?.textContent,
      ).toBe('Recovered')
    })

    it('CHALLENGE-TLP-03: Rapid mousemove coordinate simulation (200 updates) without closing', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      tooltip.show({ label: 'Tracked Point', value: '0', x: 0, y: 0 })
      await awaitNestedUpdates(tooltip)

      for (let i = 1; i <= 200; i++) {
        tooltip.show({
          label: `Tracked Point ${i}`,
          value: `${i * 10}`,
          x: i * 2,
          y: Math.sin(i) * 50 + 100,
        })
      }
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.x).toBe(400)
      expect(tooltip.style.transform).toContain('400px')
      expect(
        tooltip.shadowRoot?.querySelector('[part="label"]')?.textContent,
      ).toBe('Tracked Point 200')
      expect(
        tooltip.shadowRoot?.querySelector('[part="value"]')?.textContent,
      ).toBe('2000')
    })

    it('CHALLENGE-TLP-04: Re-opening immediately during exit transition does not demote popover', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      tooltip.show(50, 50, 'Initial', '1')
      await awaitNestedUpdates(tooltip)
      expect(tooltip.isOpen).toBe(true)

      // Call hide then immediately show
      tooltip.hide()
      tooltip.show(100, 100, 'Interrupted Exit', '2')

      // Wait for any underlying async transitions in OverlayPresenceController to resolve
      await new Promise((r) => setTimeout(r, 150))
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.matches(':popover-open')).toBe(true)
      expect(
        tooltip.shadowRoot?.querySelector('[part="label"]')?.textContent,
      ).toBe('Interrupted Exit')
    })

    it('CHALLENGE-TLP-05: Closing immediately during enter transition cancels smoothly', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      // Call show then immediately hide
      tooltip.show(50, 50, 'Fast Enter', '1')
      tooltip.hide()

      await new Promise((r) => setTimeout(r, 150))
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isOpen).toBe(false)
      expect(tooltip.matches(':popover-open')).toBe(false)
    })
  })

  // ===========================================================================
  // 2. Extreme Coordinates & Numeric Boundary Stress
  // ===========================================================================
  describe('2. Extreme Coordinates & Numeric Boundary Stress', () => {
    it('CHALLENGE-TLP-06: Extreme negative coordinates do not throw and update styles correctly', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      expect(() => {
        tooltip.show(-999999, -500000, 'Negative Coords', '-$100')
      }).not.toThrow()
      await awaitNestedUpdates(tooltip)

      expect(tooltip.x).toBe(-999999)
      expect(tooltip.y).toBe(-500000)
      expect(tooltip.style.left).toBe('0px')
      expect(tooltip.style.top).toBe('0px')
      expect(tooltip.style.transform).toContain('-999999px')
      expect(tooltip.style.transform).toContain('-500000px')
    })

    it('CHALLENGE-TLP-07: Massive positive coordinates and Number.MAX_SAFE_INTEGER', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      expect(() => {
        tooltip.show(
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          'Max Safe',
          'Infinity',
        )
      }).not.toThrow()
      await awaitNestedUpdates(tooltip)

      expect(tooltip.x).toBe(Number.MAX_SAFE_INTEGER)
      expect(tooltip.y).toBe(Number.MAX_SAFE_INTEGER)
      expect(tooltip.style.left).toBe('0px')
      expect(tooltip.style.top).toBe('0px')
      expect(tooltip.style.transform).toContain(`${Number.MAX_SAFE_INTEGER}px`)
    })

    it('CHALLENGE-TLP-08: Sub-pixel high precision floating point coordinates', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      const x = 123.456789123
      const y = 987.654321987
      tooltip.show(x, y, 'Float Precision', '3.14159')
      await awaitNestedUpdates(tooltip)

      expect(tooltip.x).toBeCloseTo(123.456789, 4)
      expect(tooltip.y).toBeCloseTo(987.654321, 4)
      expect(tooltip.style.left).toBe('0px')
      expect(tooltip.style.top).toBe('0px')
      expect(tooltip.style.transform).toContain(`${x}px`)
      expect(tooltip.style.transform).toContain(`${y}px`)
    })

    it('CHALLENGE-TLP-09: NaN and Infinity coordinate values are handled gracefully without exceptions', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      expect(() => {
        tooltip.show(Number.NaN, Number.NaN, 'NaN Point', '0')
      }).not.toThrow()
      await awaitNestedUpdates(tooltip)
      expect(Number.isNaN(tooltip.x)).toBe(true)

      expect(() => {
        tooltip.show(
          Number.POSITIVE_INFINITY,
          Number.NEGATIVE_INFINITY,
          'Inf Point',
          '0',
        )
      }).not.toThrow()
      await awaitNestedUpdates(tooltip)
      expect(tooltip.x).toBe(Number.POSITIVE_INFINITY)
      expect(tooltip.y).toBe(Number.NEGATIVE_INFINITY)
    })

    it('CHALLENGE-TLP-10: Property-based fuzzing across arbitrary coordinates via fast-check', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      fc.assert(
        fc.property(
          fc.double({ min: -100000, max: 100000, noNaN: true }),
          fc.double({ min: -100000, max: 100000, noNaN: true }),
          fc.string(),
          fc.string(),
          (x, y, label, value) => {
            tooltip.show(x, y, label, value)
            expect(tooltip.x).toBe(x)
            expect(tooltip.y).toBe(y)
            expect(tooltip.label).toBe(label)
            expect(tooltip.value).toBe(value)
            expect(tooltip.isOpen).toBe(true)
          },
        ),
        { numRuns: 50 },
      )
    })
  })

  // ===========================================================================
  // 3. Disconnected & Lifecycle Handling
  // ===========================================================================
  describe('3. Disconnected & Lifecycle Handling', () => {
    it('CHALLENGE-TLP-11: Calling show() while disconnected does not throw DOMException and retains configuration', async () => {
      const tooltip = document.createElement(
        'moul-chart-tooltip',
      ) as MoulChartTooltip
      expect(tooltip.isConnected).toBe(false)

      expect(() => {
        tooltip.show(150, 75, 'Offline Point', '$500')
      }).not.toThrow()

      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.x).toBe(150)
      expect(tooltip.y).toBe(75)
      expect(tooltip.label).toBe('Offline Point')
      expect(tooltip.value).toBe('$500')
    })

    it('CHALLENGE-TLP-12: Tooltip pre-configured with show() while disconnected opens upon DOM attachment', async () => {
      const tooltip = document.createElement(
        'moul-chart-tooltip',
      ) as MoulChartTooltip
      tooltip.show(200, 100, 'Pre-attached Point', '$1,200')

      // Attach to DOM
      document.body.appendChild(tooltip)
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isConnected).toBe(true)
      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.matches(':popover-open')).toBe(true)

      const label = tooltip.shadowRoot?.querySelector('[part="label"]')
      const value = tooltip.shadowRoot?.querySelector('[part="value"]')
      expect(label?.textContent).toBe('Pre-attached Point')
      expect(value?.textContent).toBe('$1,200')
    })

    it('CHALLENGE-TLP-13: Calling hide() while disconnected does not throw', () => {
      const tooltip = document.createElement(
        'moul-chart-tooltip',
      ) as MoulChartTooltip
      expect(() => {
        tooltip.hide()
      }).not.toThrow()
      expect(tooltip.isOpen).toBe(false)
    })

    it('CHALLENGE-TLP-14: Removing element from DOM while open cleans up without errors', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)
      tooltip.show(100, 100, 'Active', '10')
      await awaitNestedUpdates(tooltip)
      expect(tooltip.isOpen).toBe(true)

      expect(() => {
        tooltip.remove()
      }).not.toThrow()

      expect(tooltip.isConnected).toBe(false)

      // Re-attaching does not cause collisions
      document.body.appendChild(tooltip)
      await awaitNestedUpdates(tooltip)
      expect(tooltip.isConnected).toBe(true)
    })

    it('CHALLENGE-TLP-15: Churn stress test: repeated connect/disconnect/show/hide in rapid succession', async () => {
      for (let i = 0; i < 15; i++) {
        const tooltip = document.createElement(
          'moul-chart-tooltip',
        ) as MoulChartTooltip
        tooltip.show(i * 10, i * 10, `Item ${i}`, `${i}`)
        document.body.appendChild(tooltip)
        await awaitNestedUpdates(tooltip)

        expect(tooltip.matches(':popover-open')).toBe(true)

        tooltip.hide()
        tooltip.remove()
      }
    })
  })

  // ===========================================================================
  // 4. Missing, Partial, and Malformed Arguments
  // ===========================================================================
  describe('4. Missing, Partial, and Malformed Arguments', () => {
    it('CHALLENGE-TLP-16: Positional show() with missing trailing arguments uses clean defaults', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      // Only x provided
      tooltip.show(75)
      await awaitNestedUpdates(tooltip)
      expect(tooltip.x).toBe(75)
      expect(tooltip.y).toBe(0)
      expect(tooltip.label).toBe('')
      expect(tooltip.value).toBe('')

      // x and y provided
      tooltip.show(120, 80)
      await awaitNestedUpdates(tooltip)
      expect(tooltip.x).toBe(120)
      expect(tooltip.y).toBe(80)
      expect(tooltip.label).toBe('')
      expect(tooltip.value).toBe('')

      // x, y, and label provided
      tooltip.show(150, 90, 'Only Label')
      await awaitNestedUpdates(tooltip)
      expect(tooltip.x).toBe(150)
      expect(tooltip.y).toBe(90)
      expect(tooltip.label).toBe('Only Label')
      expect(tooltip.value).toBe('')
    })

    it('CHALLENGE-TLP-17: Object options show() with missing or partial fields', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      // Empty object
      tooltip.show({} as ChartTooltipShowOptions)
      await awaitNestedUpdates(tooltip)
      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.label).toBe('')
      expect(tooltip.value).toBe('')

      // Only label and value
      tooltip.show({ label: 'Solo', value: '42' })
      await awaitNestedUpdates(tooltip)
      expect(tooltip.label).toBe('Solo')
      expect(tooltip.value).toBe('42')

      // Custom color and payload
      const customPayload = [{ id: 'series-a', rawValue: 1234 }]
      tooltip.show({
        label: 'With Payload',
        value: '100%',
        color: '#ffaa00',
        x: 30,
        y: 40,
        payload: customPayload,
      })
      await awaitNestedUpdates(tooltip)
      expect(tooltip.color).toBe('#ffaa00')
      expect(tooltip.payload).toEqual(customPayload)
      const indicator = tooltip.shadowRoot?.querySelector('[part="indicator"]')
      expect(indicator?.getAttribute('style')).toContain('#ffaa00')
    })

    it('CHALLENGE-TLP-18: Malformed argument inputs (null, undefined, boolean) do not crash', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      expect(() => {
        tooltip.show(undefined as unknown as ChartTooltipShowOptions)
      }).not.toThrow()
      expect(tooltip.isOpen).toBe(true)

      expect(() => {
        tooltip.show(null as unknown as ChartTooltipShowOptions)
      }).not.toThrow()
      expect(tooltip.isOpen).toBe(true)

      expect(() => {
        tooltip.show(false as unknown as ChartTooltipShowOptions)
      }).not.toThrow()
      expect(tooltip.isOpen).toBe(true)
    })

    it('CHALLENGE-TLP-19: XSS / HTML entity injection in label and value is securely escaped by Lit', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      const maliciousLabel =
        '<script id="xss-test">alert("xss")</script><b>Bold</b>'
      const maliciousValue = '<img src=x onerror="alert(1)">'

      tooltip.show({
        label: maliciousLabel,
        value: maliciousValue,
        x: 10,
        y: 10,
      })
      await awaitNestedUpdates(tooltip)

      // Verify no executable DOM nodes were injected into shadowRoot
      expect(tooltip.shadowRoot?.querySelector('script#xss-test')).toBeNull()
      expect(tooltip.shadowRoot?.querySelector('img')).toBeNull()

      // Content should be rendered as plain text
      const label = tooltip.shadowRoot?.querySelector('[part="label"]')
      const value = tooltip.shadowRoot?.querySelector('[part="value"]')
      expect(label?.textContent).toContain('<script id="xss-test">')
      expect(value?.textContent).toBe(maliciousValue)
    })
  })

  // ===========================================================================
  // 5. Slotted Custom Elements & Direct Popover Invocation
  // ===========================================================================
  describe('5. Slotted Custom Content & Direct Popover Invocation', () => {
    it('CHALLENGE-TLP-20: Custom slotted content projects cleanly inside tooltip container', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip>
          <div id="custom-badge" class="badge">Special Flag</div>
        </moul-chart-tooltip>
      `)

      tooltip.show({ label: 'Item with Slot', value: '42', x: 50, y: 50 })
      await awaitNestedUpdates(tooltip)

      const slot = tooltip.shadowRoot?.querySelector('slot')
      expect(slot).toBeTruthy()

      const assigned = slot?.assignedElements() ?? []
      expect(assigned.length).toBe(1)
      expect(assigned[0].id).toBe('custom-badge')
      expect(assigned[0].textContent).toBe('Special Flag')
    })

    it('CHALLENGE-TLP-21: Calling showPopover() directly without show() keeps state synchronized', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      expect(tooltip.isOpen).toBe(false)
      tooltip.showPopover()
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.matches(':popover-open')).toBe(true)

      tooltip.hidePopover()
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isOpen).toBe(false)
      expect(tooltip.matches(':popover-open')).toBe(false)
    })
  })

  // ===========================================================================
  // 6. Multi-Series Payload Stress & Malformed Data Robustness
  // ===========================================================================
  describe('6. Multi-Series Payload Stress & Malformed Data Robustness', () => {
    it('CHALLENGE-TLP-22: Empty array payload falls back cleanly to single-series layout without errors', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      // Empty payload with label and value
      tooltip.show({
        label: 'Empty Payload Test',
        value: 'Summary 100',
        payload: [],
      })
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.shadowRoot?.querySelector('.tooltip-list')).toBeNull()
      expect(
        tooltip.shadowRoot?.querySelector('[part="label"]')?.textContent,
      ).toBe('Empty Payload Test')
      expect(
        tooltip.shadowRoot?.querySelector('[part="value"]')?.textContent,
      ).toBe('Summary 100')

      // Pre-existing multi-series transitioning back to empty payload reverts layout cleanly
      tooltip.show({
        label: 'Multi',
        payload: [{ name: 'Item', value: 10 }],
      })
      await awaitNestedUpdates(tooltip)
      expect(tooltip.shadowRoot?.querySelector('.tooltip-list')).toBeTruthy()

      tooltip.show({
        label: 'Reverted',
        value: 'Single Again',
        payload: [],
      })
      await awaitNestedUpdates(tooltip)
      expect(tooltip.shadowRoot?.querySelector('.tooltip-list')).toBeNull()
      expect(
        tooltip.shadowRoot?.querySelector('[part="label"]')?.textContent,
      ).toBe('Reverted')
      expect(
        tooltip.shadowRoot?.querySelector('[part="value"]')?.textContent,
      ).toBe('Single Again')
    })

    it('CHALLENGE-TLP-23: Multi-series payload with 1 item renders list and handles label/value properly', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      tooltip.show({
        label: 'Single Series Breakdown',
        payload: [
          { name: 'Series Alpha', value: '$1,200', color: 'rgb(255, 0, 85)' },
        ],
      })
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isOpen).toBe(true)
      expect(
        tooltip.shadowRoot?.querySelector('.tooltip-title .title')?.textContent,
      ).toBe('Single Series Breakdown')

      const items = tooltip.shadowRoot?.querySelectorAll('.tooltip-item')
      expect(items?.length).toBe(1)
      expect(items?.[0].querySelector('[part="label"]')?.textContent).toBe(
        'Series Alpha',
      )
      expect(items?.[0].querySelector('[part="value"]')?.textContent).toBe(
        '$1,200',
      )
      const indicator = items?.[0].querySelector(
        '[part="indicator"]',
      ) as HTMLElement
      expect(indicator?.style.backgroundColor).toBe('rgb(255, 0, 85)')

      // Also verify when top-level summary value is provided alongside 1 payload item
      tooltip.show({
        label: 'With Top Value',
        value: 'Total $1,200',
        payload: [{ name: 'Single Item', value: '$1,200', color: '#123456' }],
      })
      await awaitNestedUpdates(tooltip)

      expect(
        tooltip.shadowRoot?.querySelector('.tooltip-header .value')
          ?.textContent,
      ).toBe('Total $1,200')
      const updatedItems = tooltip.shadowRoot?.querySelectorAll('.tooltip-item')
      expect(updatedItems?.length).toBe(1)
    })

    it('CHALLENGE-TLP-24: Multi-series payload with 8 items exercises all 8 chart color tokens', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      const eightPayload = Array.from({ length: 8 }, (_, i) => ({
        name: `Series ${i + 1}`,
        value: (i + 1) * 10,
      }))

      tooltip.show({
        label: '8 Series Breakdown',
        payload: eightPayload,
      })
      await awaitNestedUpdates(tooltip)

      const items = tooltip.shadowRoot?.querySelectorAll('.tooltip-item')
      expect(items?.length).toBe(8)

      items?.forEach((item, i) => {
        const indicator = item.querySelector(
          '[part="indicator"]',
        ) as HTMLElement
        expect(indicator?.style.backgroundColor).toBe(
          `var(--color-chart-${i + 1})`,
        )
        expect(item.querySelector('[part="label"]')?.textContent).toBe(
          `Series ${i + 1}`,
        )
        expect(item.querySelector('[part="value"]')?.textContent).toBe(
          `${(i + 1) * 10}`,
        )
      })
    })

    it('CHALLENGE-TLP-25: Multi-series payload with 50 items stresses high-volume series and verifies color modulo wrapping', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      const fiftyPayload = Array.from({ length: 50 }, (_, i) => ({
        name: `Metric ${i}`,
        value: i * 2,
      }))

      tooltip.show({
        label: '50 Series Massive Breakdown',
        payload: fiftyPayload,
      })
      await awaitNestedUpdates(tooltip)

      const items = tooltip.shadowRoot?.querySelectorAll('.tooltip-item')
      expect(items?.length).toBe(50)

      items?.forEach((item, i) => {
        const expectedColorIndex = (i % 8) + 1
        const indicator = item.querySelector(
          '[part="indicator"]',
        ) as HTMLElement
        expect(indicator?.style.backgroundColor).toBe(
          `var(--color-chart-${expectedColorIndex})`,
        )
        expect(item.querySelector('[part="label"]')?.textContent).toBe(
          `Metric ${i}`,
        )
        expect(item.querySelector('[part="value"]')?.textContent).toBe(
          `${i * 2}`,
        )
      })
    })

    it('CHALLENGE-TLP-26: Malformed payload items stress (missing color, value, name, null, undefined, primitive, empty object)', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      const malformedPayload = [
        { name: 'Missing Color', value: 123 },
        { name: 'Missing Value', color: '#ff0000' },
        { value: 456, color: '#00ff00' },
        {},
        null,
        undefined,
        42,
        'primitive text',
        { label: 'Label Prop Only', value: 789 },
        { key: 'Key Prop Only', value: 999 },
        { name: 'Zero Value', value: 0 },
        { name: 'Boolean Value', value: false },
        { name: 'Fallback Fill', fill: '#112233' },
        { name: 'Fallback Stroke', stroke: '#332211' },
        { name: 'Nested Payload Fill', payload: { fill: '#abcdef' } },
      ]

      expect(() => {
        tooltip.show({
          label: 'Malformed Payload Stress',
          payload: malformedPayload,
        })
      }).not.toThrow()
      await awaitNestedUpdates(tooltip)

      const items = tooltip.shadowRoot?.querySelectorAll('.tooltip-item')
      expect(items?.length).toBe(15)

      // 1. Missing Color: fallback color
      expect(
        (items?.[0].querySelector('[part="indicator"]') as HTMLElement)?.style
          .backgroundColor,
      ).toBe('var(--color-chart-1)')
      expect(items?.[0].querySelector('[part="label"]')?.textContent).toBe(
        'Missing Color',
      )
      expect(items?.[0].querySelector('[part="value"]')?.textContent).toBe(
        '123',
      )

      // 2. Missing Value: no value element
      expect(items?.[1].querySelector('[part="label"]')?.textContent).toBe(
        'Missing Value',
      )
      expect(items?.[1].querySelector('[part="value"]')).toBeNull()

      // 3. Missing Name: no label element
      expect(items?.[2].querySelector('[part="label"]')).toBeNull()
      expect(items?.[2].querySelector('[part="value"]')?.textContent).toBe(
        '456',
      )

      // 4. Empty Object
      expect(items?.[3].querySelector('[part="label"]')).toBeNull()
      expect(items?.[3].querySelector('[part="value"]')).toBeNull()

      // 5. null entry
      expect(items?.[4].querySelector('[part="label"]')).toBeNull()
      expect(items?.[4].querySelector('[part="value"]')).toBeNull()

      // 6. undefined entry
      expect(items?.[5].querySelector('[part="label"]')).toBeNull()
      expect(items?.[5].querySelector('[part="value"]')).toBeNull()

      // 7. Primitive number: rendered as value
      expect(items?.[6].querySelector('[part="value"]')?.textContent).toBe('42')

      // 8. Primitive string: rendered as value
      expect(items?.[7].querySelector('[part="value"]')?.textContent).toBe(
        'primitive text',
      )

      // 9. label prop used as name
      expect(items?.[8].querySelector('[part="label"]')?.textContent).toBe(
        'Label Prop Only',
      )

      // 10. key prop used as name
      expect(items?.[9].querySelector('[part="label"]')?.textContent).toBe(
        'Key Prop Only',
      )

      // 11. Zero numeric value: preserves 0
      expect(items?.[10].querySelector('[part="value"]')?.textContent).toBe('0')

      // 12. Boolean false value: preserves false
      expect(items?.[11].querySelector('[part="value"]')?.textContent).toBe(
        'false',
      )

      // 13. Fallback fill
      expect(
        (items?.[12].querySelector('[part="indicator"]') as HTMLElement)?.style
          .backgroundColor,
      ).toBe('#112233')

      // 14. Fallback stroke
      expect(
        (items?.[13].querySelector('[part="indicator"]') as HTMLElement)?.style
          .backgroundColor,
      ).toBe('#332211')

      // 15. Nested payload fill
      expect(
        (items?.[14].querySelector('[part="indicator"]') as HTMLElement)?.style
          .backgroundColor,
      ).toBe('#abcdef')
    })

    it('CHALLENGE-TLP-27: Non-array payload defensive handling does not throw', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      expect(() => {
        tooltip.show({
          label: 'Invalid Payload Type',
          value: '42',
          payload: 'not-an-array' as unknown as [],
        })
      }).not.toThrow()
      await awaitNestedUpdates(tooltip)

      expect(tooltip.payload).toEqual([])
      expect(tooltip.shadowRoot?.querySelector('.tooltip-list')).toBeNull()
      expect(
        tooltip.shadowRoot?.querySelector('[part="label"]')?.textContent,
      ).toBe('Invalid Payload Type')
    })
  })

  // ===========================================================================
  // 7. Ultra-High Churn Rapid Coordinate Updates
  // ===========================================================================
  describe('7. Ultra-High Churn Rapid Coordinate Updates', () => {
    it('CHALLENGE-TLP-28: 1000 sequential rapid coordinate updates across alternating negative and positive bounds', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      let lastX = 0
      let lastY = 0

      for (let i = 0; i < 1000; i++) {
        const sign = i % 2 === 0 ? 1 : -1
        lastX = sign * (i * 12.34 - 2500)
        lastY = -sign * (i * 8.76 - 1500)
        tooltip.show(lastX, lastY, `Seq ${i}`, `Val ${i}`)
      }
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.matches(':popover-open')).toBe(true)
      expect(tooltip.x).toBe(lastX)
      expect(tooltip.y).toBe(lastY)
      expect(tooltip.style.left).toBe('0px')
      expect(tooltip.style.top).toBe('0px')
      expect(tooltip.style.transform).toBe(
        `translate3d(${lastX}px, ${lastY}px, 0) translate(-50%, -100%) translateY(-8px)`,
      )
      expect(
        tooltip.shadowRoot?.querySelector('[part="label"]')?.textContent,
      ).toBe('Seq 999')
      expect(
        tooltip.shadowRoot?.querySelector('[part="value"]')?.textContent,
      ).toBe('Val 999')
    })

    it('CHALLENGE-TLP-29: 1000 sequential coordinate updates with alternating multi-series payloads under continuous churn', async () => {
      const tooltip = await mount<MoulChartTooltip>(html`
        <moul-chart-tooltip></moul-chart-tooltip>
      `)

      for (let i = 0; i < 1000; i++) {
        const x = (i - 500) * 10
        const y = (500 - i) * 5
        const isEven = i % 2 === 0
        tooltip.show({
          x,
          y,
          label: `Frame ${i}`,
          payload: isEven
            ? [
                { name: 'Series A', value: i },
                { name: 'Series B', value: -i },
              ]
            : [
                { name: 'Series X', value: i * 2 },
                { name: 'Series Y', value: -i * 2 },
                { name: 'Series Z', value: i * 3 },
              ],
        })
      }
      await awaitNestedUpdates(tooltip)

      // Final frame is i = 999 (odd): 3 items
      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.x).toBe(4990)
      expect(tooltip.y).toBe(-2495)
      expect(tooltip.style.left).toBe('0px')
      expect(tooltip.style.top).toBe('0px')
      expect(tooltip.style.transform).toBe(
        'translate3d(4990px, -2495px, 0) translate(-50%, -100%) translateY(-8px)',
      )
      const items = tooltip.shadowRoot?.querySelectorAll('.tooltip-item')
      expect(items?.length).toBe(3)
      expect(items?.[0].querySelector('[part="label"]')?.textContent).toBe(
        'Series X',
      )
      expect(items?.[0].querySelector('[part="value"]')?.textContent).toBe(
        '1998',
      )
      expect(items?.[1].querySelector('[part="label"]')?.textContent).toBe(
        'Series Y',
      )
      expect(items?.[1].querySelector('[part="value"]')?.textContent).toBe(
        '-1998',
      )
      expect(items?.[2].querySelector('[part="label"]')?.textContent).toBe(
        'Series Z',
      )
      expect(items?.[2].querySelector('[part="value"]')?.textContent).toBe(
        '2997',
      )
    })
  })
})
