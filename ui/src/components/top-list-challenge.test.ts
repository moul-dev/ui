import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TopListItem } from './ChartCommon'
import './TopList/TopList'
import type { MoulTopList } from './TopList/TopList'

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

describe('Adversarial Stress Suite: MoulTopList (`moul-top-list`)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  // =========================================================================
  // 1. Stress-Test: Empty Data Array, Null, Undefined & Non-Array Inputs
  // =========================================================================
  describe('Pathological Data: Empty, Null, Undefined & Corrupted Structures', () => {
    it('CHALLENGE-TOP-01: renders empty-state container and slot with default message for empty array', async () => {
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${[]}></moul-top-list>
      `)
      const emptyState = el.shadowRoot?.querySelector('.empty-state')
      expect(emptyState).toBeTruthy()
      expect(emptyState?.getAttribute('part')).toBe('empty')

      const slot = emptyState?.querySelector('slot[name="empty"]')
      expect(slot).toBeTruthy()

      const defaultMsg = emptyState?.querySelector('.empty-message')
      expect(defaultMsg?.textContent?.trim()).toBe('No data available')

      const items = el.shadowRoot?.querySelectorAll('.item')
      expect(items?.length).toBe(0)
    })

    it('CHALLENGE-TOP-02: renders slotted custom empty state content when data is empty', async () => {
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${[]}>
          <div slot="empty" id="adversarial-empty">
            <h3>No Metrics Available</h3>
            <p>Please check your query filters.</p>
          </div>
        </moul-top-list>
      `)
      const slot = el.shadowRoot?.querySelector('slot[name="empty"]')
      expect(slot).toBeTruthy()

      const lightChildren = el.querySelector('#adversarial-empty')
      expect(lightChildren).toBeTruthy()
      expect(lightChildren?.querySelector('h3')?.textContent).toBe(
        'No Metrics Available',
      )
    })

    it('CHALLENGE-TOP-03: handles null, undefined, and non-array data gracefully without throwing', async () => {
      const el1 = await mount<MoulTopList>(html`
        <moul-top-list .data=${null as any}></moul-top-list>
      `)
      expect(el1.shadowRoot?.querySelector('.empty-state')).toBeTruthy()

      const el2 = await mount<MoulTopList>(html`
        <moul-top-list .data=${undefined as any}></moul-top-list>
      `)
      expect(el2.shadowRoot?.querySelector('.empty-state')).toBeTruthy()

      const el3 = await mount<MoulTopList>(html`
        <moul-top-list .data=${'not an array' as any}></moul-top-list>
      `)
      expect(el3.shadowRoot?.querySelector('.empty-state')).toBeTruthy()

      const el4 = await mount<MoulTopList>(html`
        <moul-top-list .data=${{ invalid: true } as any}></moul-top-list>
      `)
      expect(el4.shadowRoot?.querySelector('.empty-state')).toBeTruthy()
    })

    it('CHALLENGE-TOP-04: maxItems boundaries (0, negative, exceeding data length)', async () => {
      const sample = [
        { label: 'Alpha', value: 100 },
        { label: 'Beta', value: 80 },
        { label: 'Gamma', value: 60 },
      ]

      // maxItems = 0 falls back to all items (non-positive slice bypass)
      const elZero = await mount<MoulTopList>(html`
        <moul-top-list .data=${sample} .maxItems=${0}></moul-top-list>
      `)
      expect(elZero.shadowRoot?.querySelectorAll('.item').length).toBe(3)

      // maxItems = -5 falls back to all items
      const elNeg = await mount<MoulTopList>(html`
        <moul-top-list .data=${sample} .maxItems=${-5}></moul-top-list>
      `)
      expect(elNeg.shadowRoot?.querySelectorAll('.item').length).toBe(3)

      // maxItems = 1 restricts to top 1
      const elOne = await mount<MoulTopList>(html`
        <moul-top-list .data=${sample} .maxItems=${1}></moul-top-list>
      `)
      expect(elOne.shadowRoot?.querySelectorAll('.item').length).toBe(1)
      expect(
        elOne.shadowRoot?.querySelector('.label')?.textContent?.trim(),
      ).toBe('Alpha')

      // maxItems = 100 exceeds data length, renders all 3
      const elLarge = await mount<MoulTopList>(html`
        <moul-top-list .data=${sample} .maxItems=${100}></moul-top-list>
      `)
      expect(elLarge.shadowRoot?.querySelectorAll('.item').length).toBe(3)
    })
  })

  // =========================================================================
  // 2. Stress-Test: Max Value = 0 (Division by Zero Safeguard) & Denominator Limits
  // =========================================================================
  describe('Division by Zero & Pathological Max Safeguards', () => {
    it('CHALLENGE-TOP-05: explicit max = 0 does NOT cause division by zero or NaN width', async () => {
      const data = [
        { label: 'Item A', value: 50 },
        { label: 'Item B', value: 25 },
      ]
      // When max = 0 is passed, safe math treats userMax <= 0 as invalid and derives max from positive values (50)
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data} .max=${0}></moul-top-list>
      `)
      const bars = el.shadowRoot?.querySelectorAll<HTMLElement>('.bar')
      expect(bars?.length).toBe(2)

      // 50 / 50 = 100%
      expect(bars?.[0].style.width).toBe('100%')
      expect(bars?.[0].style.width).not.toMatch(/NaN|Infinity/i)

      // 25 / 50 = 50%
      expect(bars?.[1].style.width).toBe('50%')
      expect(bars?.[1].style.width).not.toMatch(/NaN|Infinity/i)
    })

    it('CHALLENGE-TOP-06: explicit max = 0 with all zero values defaults computedMax to 1 without NaN', async () => {
      const data = [
        { label: 'Zero 1', value: 0 },
        { label: 'Zero 2', value: 0 },
      ]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data} .max=${0}></moul-top-list>
      `)
      const bars = el.shadowRoot?.querySelectorAll<HTMLElement>('.bar')
      expect(bars?.length).toBe(2)
      expect(bars?.[0].style.width).toBe('0%')
      expect(bars?.[1].style.width).toBe('0%')
      expect(bars?.[0].style.width).not.toMatch(/NaN|Infinity/i)

      const tracks = el.shadowRoot?.querySelectorAll('.track')
      expect(tracks?.[0].getAttribute('aria-valuenow')).toBe('0')
      expect(tracks?.[0].getAttribute('aria-valuemax')).toBe('1')
    })

    it('CHALLENGE-TOP-07: explicit maxValue = 0 (alias prop) safely prevents division by zero', async () => {
      const data = [{ label: 'Metric', value: 10 }]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data} .maxValue=${0}></moul-top-list>
      `)
      const bar = el.shadowRoot?.querySelector<HTMLElement>('.bar')
      expect(bar?.style.width).toBe('100%')
      expect(bar?.style.width).not.toMatch(/NaN|Infinity/i)
    })

    it('CHALLENGE-TOP-08: negative max, NaN max, or Infinity max safely fall back to data positive maximum', async () => {
      const data = [
        { label: 'X', value: 40 },
        { label: 'Y', value: 20 },
      ]

      // Negative max
      const elNeg = await mount<MoulTopList>(html`
        <moul-top-list .data=${data} .max=${-100}></moul-top-list>
      `)
      const barNeg = elNeg.shadowRoot?.querySelector<HTMLElement>('.bar')
      expect(barNeg?.style.width).toBe('100%')

      // NaN max
      const elNaN = await mount<MoulTopList>(html`
        <moul-top-list .data=${data} .max=${Number.NaN}></moul-top-list>
      `)
      const barNaN = elNaN.shadowRoot?.querySelector<HTMLElement>('.bar')
      expect(barNaN?.style.width).toBe('100%')

      // Infinity max
      const elInf = await mount<MoulTopList>(html`
        <moul-top-list .data=${data} .max=${Number.POSITIVE_INFINITY}></moul-top-list>
      `)
      const barInf = elInf.shadowRoot?.querySelector<HTMLElement>('.bar')
      expect(barInf?.style.width).toBe('100%')
    })
  })

  // =========================================================================
  // 3. Stress-Test: Negative Values Clamping & Non-Finite Numbers
  // =========================================================================
  describe('Negative Values Clamping & Number Resilience', () => {
    it('CHALLENGE-TOP-09: negative values clamp bar width and aria-valuenow to 0 while preserving negative text', async () => {
      const data = [
        { label: 'Deficit', value: -750 },
        { label: 'Surplus', value: 500 },
      ]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data}></moul-top-list>
      `)
      const items = el.shadowRoot?.querySelectorAll('.item')
      expect(items?.length).toBe(2)

      // Item 1 (Negative):
      // Progress bar must be clamped to 0%
      const bar1 = items?.[0].querySelector<HTMLElement>('.bar')
      expect(bar1?.style.width).toBe('0%')

      // Track aria-valuenow clamped to 0
      const track1 = items?.[0].querySelector('.track')
      expect(track1?.getAttribute('aria-valuenow')).toBe('0')
      expect(track1?.getAttribute('aria-valuemin')).toBe('0')

      // Value text displays real negative value
      const val1 = items?.[0].querySelector('.value')
      expect(val1?.textContent?.trim()).toBe('-750')

      // Item 2 (Positive):
      // Max is 500, so width is 100%
      const bar2 = items?.[1].querySelector<HTMLElement>('.bar')
      expect(bar2?.style.width).toBe('100%')
      const val2 = items?.[1].querySelector('.value')
      expect(val2?.textContent?.trim()).toBe('500')
    })

    it('CHALLENGE-TOP-10: all-negative data array renders 0% bars without NaN or negative percentages', async () => {
      const data = [
        { label: 'Loss A', value: -100 },
        { label: 'Loss B', value: -200 },
        { label: 'Loss C', value: -50 },
      ]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data}></moul-top-list>
      `)
      const bars = el.shadowRoot?.querySelectorAll<HTMLElement>('.bar')
      expect(bars?.length).toBe(3)
      for (let i = 0; i < bars!.length; i++) {
        expect(bars![i].style.width).toBe('0%')
        expect(bars![i].style.width).not.toMatch(/-/i) // No negative width
      }
    })

    it('CHALLENGE-TOP-11: item value exceeding max is clamped to 100% width', async () => {
      const data = [{ label: 'Overachiever', value: 250 }]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data} .max=${100}></moul-top-list>
      `)
      const bar = el.shadowRoot?.querySelector<HTMLElement>('.bar')
      expect(bar?.style.width).toBe('100%')
    })

    it('CHALLENGE-TOP-12: non-numeric or non-finite values (NaN, null, undefined, Infinity) fall back to 0', async () => {
      const data = [
        { label: 'NaN Item', value: Number.NaN },
        { label: 'Null Item', value: null as any },
        { label: 'Undef Item', value: undefined as any },
        { label: 'Infinity Item', value: Number.POSITIVE_INFINITY },
        { label: 'String Item', value: '100' as any },
      ]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data}></moul-top-list>
      `)
      const items = el.shadowRoot?.querySelectorAll('.item')
      expect(items?.length).toBe(5)

      for (let i = 0; i < items!.length; i++) {
        const bar = items![i].querySelector<HTMLElement>('.bar')
        expect(bar?.style.width).toBe('0%')
        expect(bar?.style.width).not.toMatch(/NaN|Infinity/i)
      }
    })
  })

  // =========================================================================
  // 4. Stress-Test: Missing Labels, Name Fallback & Unicode Safety
  // =========================================================================
  describe('Missing Labels & Label Ergonomics', () => {
    it('CHALLENGE-TOP-13: missing or empty label falls back to Item N', async () => {
      const data: TopListItem[] = [
        { value: 10 } as any,
        { label: '', value: 20 },
        { label: null as any, value: 30 },
        { label: undefined as any, value: 40 },
      ]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data}></moul-top-list>
      `)
      const labels = el.shadowRoot?.querySelectorAll('.label')
      expect(labels?.length).toBe(4)
      expect(labels?.[0].textContent?.trim()).toBe('Item 1')
      expect(labels?.[1].textContent?.trim()).toBe('Item 2')
      expect(labels?.[2].textContent?.trim()).toBe('Item 3')
      expect(labels?.[3].textContent?.trim()).toBe('Item 4')

      // Also verify track aria-label matches fallback label
      const tracks = el.shadowRoot?.querySelectorAll('.track')
      expect(tracks?.[0].getAttribute('aria-label')).toBe('Item 1')
      expect(tracks?.[1].getAttribute('aria-label')).toBe('Item 2')
    })

    it('CHALLENGE-TOP-14: supports alternative name property when label is omitted', async () => {
      const data = [
        { name: 'Revenue Stream A', value: 800 } as any,
        { name: 'Revenue Stream B', value: 400 } as any,
      ]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data}></moul-top-list>
      `)
      const labels = el.shadowRoot?.querySelectorAll('.label')
      expect(labels?.[0].textContent?.trim()).toBe('Revenue Stream A')
      expect(labels?.[1].textContent?.trim()).toBe('Revenue Stream B')
    })

    it('CHALLENGE-TOP-15: renders unicode, emojis, and HTML characters safely without corruption', async () => {
      const data: TopListItem[] = [
        { label: '🚀 Mars Base <Alpha & Omega>', value: 100 },
        { label: '日本語ラベル', value: 80 },
        { label: 'العربية', value: 60 },
      ]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data}></moul-top-list>
      `)
      const labels = el.shadowRoot?.querySelectorAll('.label')
      expect(labels?.[0].textContent?.trim()).toBe(
        '🚀 Mars Base <Alpha & Omega>',
      )
      expect(labels?.[1].textContent?.trim()).toBe('日本語ラベル')
      expect(labels?.[2].textContent?.trim()).toBe('العربية')

      // Title attribute check
      expect(labels?.[0].getAttribute('title')).toBe(
        '🚀 Mars Base <Alpha & Omega>',
      )
    })
  })

  // =========================================================================
  // 5. Stress-Test: Keyboard Enter & Space Activation & Event Dispatch
  // =========================================================================
  describe('Keyboard Enter & Space Activation and Event Payload Contracts', () => {
    it('CHALLENGE-TOP-16: Enter key on listitem fires item-press with exact payload and defaultPrevented', async () => {
      const data: TopListItem[] = [
        { label: 'Item 1', value: 100 },
        { label: 'Item 2', value: 200 },
      ]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data}></moul-top-list>
      `)
      const spy = vi.fn()
      el.addEventListener('item-press', spy)

      const items = el.shadowRoot?.querySelectorAll<HTMLElement>('.item')
      expect(items?.length).toBe(2)

      // Dispatch Enter keydown on Item 2 (index 1)
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      })
      items?.[1].dispatchEvent(enterEvent)

      expect(spy).toHaveBeenCalledTimes(1)
      const customEvent = spy.mock.calls[0][0] as CustomEvent
      expect(customEvent.type).toBe('item-press')
      expect(customEvent.bubbles).toBe(true)
      expect(customEvent.composed).toBe(true)
      expect(customEvent.cancelable).toBe(true)
      expect(customEvent.detail).toEqual({
        item: data[1],
        index: 1,
      })
      expect(enterEvent.defaultPrevented).toBe(true)
    })

    it('CHALLENGE-TOP-17: Space key on listitem fires item-press and prevents default scroll', async () => {
      const data: TopListItem[] = [
        { label: 'Item 1', value: 100 },
        { label: 'Item 2', value: 200 },
      ]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data}></moul-top-list>
      `)
      const spy = vi.fn()
      el.addEventListener('item-press', spy)

      const items = el.shadowRoot?.querySelectorAll<HTMLElement>('.item')

      // Dispatch Space keydown on Item 1 (index 0)
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      })
      items?.[0].dispatchEvent(spaceEvent)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].detail).toEqual({
        item: data[0],
        index: 0,
      })
      expect(spaceEvent.defaultPrevented).toBe(true)
    })

    it('CHALLENGE-TOP-18: Non-activation keys (Tab, Escape, ArrowDown, Letters) do NOT fire item-press', async () => {
      const data: TopListItem[] = [{ label: 'Item 1', value: 100 }]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data}></moul-top-list>
      `)
      const spy = vi.fn()
      el.addEventListener('item-press', spy)

      const item = el.shadowRoot?.querySelector<HTMLElement>('.item')

      for (const key of [
        'Tab',
        'Escape',
        'ArrowDown',
        'ArrowUp',
        'a',
        'Shift',
      ]) {
        const evt = new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true,
        })
        item?.dispatchEvent(evt)
        expect(evt.defaultPrevented).toBe(false)
      }

      expect(spy).not.toHaveBeenCalled()
    })

    it('CHALLENGE-TOP-19: Click on item or any item descendant dispatches item-press', async () => {
      const data: TopListItem[] = [{ label: 'Descendant Test', value: 300 }]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data} show-rank></moul-top-list>
      `)
      const spy = vi.fn()
      el.addEventListener('item-press', spy)

      // Click on rank span
      const rank = el.shadowRoot?.querySelector<HTMLElement>('.rank')
      rank?.click()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].detail).toEqual({ item: data[0], index: 0 })

      // Click on bar element
      const bar = el.shadowRoot?.querySelector<HTMLElement>('.bar')
      bar?.click()
      expect(spy).toHaveBeenCalledTimes(2)

      // Click on value label
      const val = el.shadowRoot?.querySelector<HTMLElement>('.value')
      val?.click()
      expect(spy).toHaveBeenCalledTimes(3)
    })

    it('CHALLENGE-TOP-20: tabindex="0" is present on items enabling native keyboard focus navigation', async () => {
      const data: TopListItem[] = [
        { label: 'Item 1', value: 10 },
        { label: 'Item 2', value: 20 },
      ]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data}></moul-top-list>
      `)
      const items = el.shadowRoot?.querySelectorAll('.item')
      expect(items?.[0].getAttribute('tabindex')).toBe('0')
      expect(items?.[1].getAttribute('tabindex')).toBe('0')
    })
  })

  // =========================================================================
  // 6. Stress-Test: ARIA Progressbar Semantics & Accessibility Conformance
  // =========================================================================
  describe('ARIA Progressbar Semantics & Semantic List Conformance', () => {
    it('CHALLENGE-TOP-21: strict validation of role="list", role="listitem", and role="progressbar"', async () => {
      const data: TopListItem[] = [{ label: 'Active Task', value: 75 }]
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data} .max=${100}></moul-top-list>
      `)
      // List semantics
      const ul = el.shadowRoot?.querySelector('ul')
      expect(ul?.getAttribute('role')).toBe('list')

      const li = el.shadowRoot?.querySelector('li')
      expect(li?.getAttribute('role')).toBe('listitem')

      // Progressbar semantics
      const track = el.shadowRoot?.querySelector('.track')
      expect(track?.getAttribute('role')).toBe('progressbar')
      expect(track?.getAttribute('aria-valuenow')).toBe('75')
      expect(track?.getAttribute('aria-valuemin')).toBe('0')
      expect(track?.getAttribute('aria-valuemax')).toBe('100')
      expect(track?.getAttribute('aria-label')).toBe('Active Task')
      expect(track?.getAttribute('aria-valuetext')).toBe('75')
    })

    it('CHALLENGE-TOP-22: custom valueFormatter syncs aria-valuetext with rendered value', async () => {
      const data: TopListItem[] = [{ label: 'Bandwidth', value: 1024 }]
      const el = await mount<MoulTopList>(html`
        <moul-top-list
          .data=${data}
          .valueFormatter=${(v: number) => `${v / 1024} GB/s`}
        ></moul-top-list>
      `)
      const track = el.shadowRoot?.querySelector('.track')
      expect(track?.getAttribute('aria-valuetext')).toBe('1 GB/s')

      const valueEl = el.shadowRoot?.querySelector('.value')
      expect(valueEl?.textContent?.trim()).toBe('1 GB/s')
    })

    it('CHALLENGE-TOP-23: showRank reflection and attribute toggling', async () => {
      const data: TopListItem[] = [
        { label: 'One', value: 10 },
        { label: 'Two', value: 20 },
      ]
      // Default: showRank is true
      const el = await mount<MoulTopList>(html`
        <moul-top-list .data=${data}></moul-top-list>
      `)
      expect(el.showRank).toBe(true)
      expect(el.shadowRoot?.querySelectorAll('.rank').length).toBe(2)

      // Turn off showRank via property
      el.showRank = false
      await awaitNestedUpdates(el)
      expect(el.shadowRoot?.querySelectorAll('.rank').length).toBe(0)

      // Turn on via attribute
      el.setAttribute('show-rank', '')
      await awaitNestedUpdates(el)
      expect(el.showRank).toBe(true)
      expect(el.shadowRoot?.querySelectorAll('.rank').length).toBe(2)

      // Turn off via show-rank="false" attribute
      el.setAttribute('show-rank', 'false')
      await awaitNestedUpdates(el)
      expect(el.showRank).toBe(false)
      expect(el.shadowRoot?.querySelectorAll('.rank').length).toBe(0)
    })

    it('CHALLENGE-TOP-24: multiColor vs barColor vs item.color hierarchy', async () => {
      const data: TopListItem[] = [
        { label: 'Default Multi', value: 10 },
        { label: 'Item Color Override', value: 20, color: '#00ff00' },
        { label: 'Second Multi', value: 30 },
      ]
      const el = await mount<MoulTopList>(html`
        <moul-top-list
          .data=${data}
          multi-color
          bar-color="var(--color-chart-5)"
        ></moul-top-list>
      `)
      const bars = el.shadowRoot?.querySelectorAll<HTMLElement>('.bar')
      expect(bars?.[0].style.backgroundColor).toContain('var(--color-chart-1)')
      expect(['#00ff00', 'rgb(0, 255, 0)']).toContain(
        bars?.[1].style.backgroundColor,
      )
      expect(bars?.[2].style.backgroundColor).toContain('var(--color-chart-3)')
    })
  })

  // =========================================================================
  // 7. Property-Based Fuzz Testing with fast-check
  // =========================================================================
  describe('Fuzzing & Invariant Verification via fast-check', () => {
    it('CHALLENGE-TOP-25: arbitrary data arrays and max parameters never produce NaN widths or uncaught exceptions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              label: fc.string({ maxLength: 50 }),
              value: fc.double({ noNaN: false, min: -1e9, max: 1e9 }),
            }),
            { maxLength: 15 },
          ),
          fc.option(fc.double({ noNaN: false, min: -1e6, max: 1e6 })),
          fc.boolean(),
          async (data, userMax, showRank) => {
            const el = document.createElement('moul-top-list') as MoulTopList
            el.data = data as TopListItem[]
            if (userMax !== null) {
              el.max = userMax
            }
            el.showRank = showRank
            document.body.appendChild(el)
            await awaitNestedUpdates(el)

            if (!data || data.length === 0) {
              const empty = el.shadowRoot?.querySelector('.empty-state')
              expect(empty).toBeTruthy()
            } else {
              const bars = el.shadowRoot?.querySelectorAll<HTMLElement>('.bar')
              for (let i = 0; i < bars!.length; i++) {
                const widthStr = bars![i].style.width
                expect(widthStr).not.toMatch(/NaN/i)
                expect(widthStr).not.toMatch(/undefined/i)
                expect(widthStr).not.toMatch(/null/i)

                // Validate percentage format: e.g. "50%" or "100%"
                const pctMatch = widthStr.match(/^([0-9.]+)%$/)
                if (pctMatch) {
                  const pct = parseFloat(pctMatch[1])
                  expect(pct).toBeGreaterThanOrEqual(0)
                  expect(pct).toBeLessThanOrEqual(100)
                }
              }

              const tracks = el.shadowRoot?.querySelectorAll('.track')
              for (let i = 0; i < tracks!.length; i++) {
                const now = tracks![i].getAttribute('aria-valuenow')
                const min = tracks![i].getAttribute('aria-valuemin')
                const max = tracks![i].getAttribute('aria-valuemax')

                expect(now).not.toMatch(/NaN|undefined|null/i)
                expect(min).toBe('0')
                expect(max).not.toMatch(/NaN|undefined|null/i)
              }
            }

            document.body.removeChild(el)
          },
        ),
        { numRuns: 50 },
      )
    })
  })
})
