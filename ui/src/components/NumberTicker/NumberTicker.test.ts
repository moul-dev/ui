import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './NumberTicker'
import type { MoulNumberTicker } from './NumberTicker'

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = []
  readonly targets: Element[] = []
  isDisconnected = false
  readonly callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    FakeIntersectionObserver.instances.push(this)
  }
  observe(target: Element) {
    this.targets.push(target)
  }
  unobserve() {}
  disconnect() {
    this.isDisconnected = true
  }
  takeRecords() {
    return []
  }
  report(isIntersecting: boolean) {
    this.callback(
      [
        {
          isIntersecting,
          target: this.targets[0],
        } as unknown as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    )
  }
}

const shadow = (el: MoulNumberTicker) => el.shadowRoot as ShadowRoot
const srText = (el: MoulNumberTicker) =>
  shadow(el).querySelector('.sr-only')?.textContent
const columns = (el: MoulNumberTicker) =>
  Array.from(
    shadow(el).querySelectorAll<HTMLElement>('.roll > .digit, .roll > .symbol'),
  )
/** The digit each column shows at rest, read from its strip position (5% per cell, 0–9 twice). */
const shownDigits = (el: MoulNumberTicker) =>
  columns(el)
    .map((column) => {
      if (column.classList.contains('symbol')) return column.textContent
      const strip = column.querySelector<HTMLElement>('.strip')
      const percent = Number(/-?[\d.]+/.exec(strip?.style.transform ?? '')?.[0])
      return String(Math.round(-percent / 5) % 10)
    })
    .join('')
const stripOf = (column: HTMLElement) =>
  column.querySelector<HTMLElement>('.strip') as HTMLElement

describe('<moul-number-ticker>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    vi.unstubAllGlobals()
    FakeIntersectionObserver.instances = []
  })

  it('is registered with an open shadow root and defaults to roll mode', async () => {
    const el = await fixture<MoulNumberTicker>(
      html`<moul-number-ticker></moul-number-ticker>`,
    )
    expect(customElements.get('moul-number-ticker')).toBeDefined()
    expect(el.value).toBe(0)
    expect(el.mode).toBe('roll')
    expect(el.getAttribute('mode')).toBe('roll')
    expect(shownDigits(el)).toBe('0')
  })

  it('falls back to roll for an unknown mode', async () => {
    const el = await fixture<MoulNumberTicker>(
      html`<moul-number-ticker mode="spin" value="3"></moul-number-ticker>`,
    )
    expect(el.mode).toBe('roll')
    expect(shownDigits(el)).toBe('3')
  })

  it('formats with Intl and keeps separators and signs as static symbols', async () => {
    const el = await fixture<MoulNumberTicker>(
      html`<moul-number-ticker
        value="-1234.5"
        locale="en-US"
        .formatOptions=${{ style: 'currency', currency: 'USD' }}
      ></moul-number-ticker>`,
    )
    expect(srText(el)).toBe('-$1,234.50')
    expect(shownDigits(el)).toBe('-$1,234.50')
    const parts = columns(el).map((column) => column.getAttribute('part'))
    expect(parts.filter((part) => part === 'digit')).toHaveLength(6)
    expect(parts.filter((part) => part === 'symbol')).toHaveLength(4)
  })

  it('rolls digits in another numbering system', async () => {
    const el = await fixture<MoulNumberTicker>(
      html`<moul-number-ticker
        value="2024"
        locale="km"
        .formatOptions=${{ numberingSystem: 'khmr', useGrouping: false }}
      ></moul-number-ticker>`,
    )
    expect(srText(el)).toBe('២០២៤')
    expect(columns(el).every((column) => column.className === 'digit')).toBe(
      true,
    )
    const strip = stripOf(columns(el)[0])
    expect(strip.children).toHaveLength(20)
    expect(strip.children[2].textContent).toBe('២')
  })

  describe('rolling', () => {
    it('rolls each digit up through the strip when the number grows, wrapping 9 to 0', async () => {
      const el = await fixture<MoulNumberTicker>(
        html`<moul-number-ticker value="19"></moul-number-ticker>`,
      )
      const ones = columns(el)[1]
      expect(stripOf(ones).style.transform).toBe('translateY(-45%)')

      el.value = 20
      await el.updateComplete
      // The ones digit sets off from 9 toward the second 0 below it, not back up through 8…1.
      expect(stripOf(ones).style.transform).toBe('translateY(-45%)')
      await vi.waitFor(() => expect(shownDigits(el)).toBe('20'), {
        timeout: 2000,
      })
      await vi.waitFor(() =>
        expect(stripOf(ones).style.transform).toBe('translateY(0%)'),
      )
    })

    it('rolls down when the number shrinks, carrying on from an interrupted roll', async () => {
      const el = await fixture<MoulNumberTicker>(
        html`<moul-number-ticker value="10"></moul-number-ticker>`,
      )
      const ones = columns(el)[1]
      el.value = 9
      await el.updateComplete
      // Down from the second 0 (cell 10) to the 9 just above it (cell 9).
      expect(stripOf(ones).style.transform).toBe('translateY(-50%)')
      el.value = 7
      await el.updateComplete
      await vi.waitFor(() => expect(shownDigits(el)).toBe('7'), {
        timeout: 2000,
      })
    })

    it('slides a new leading digit in and lets a dropped one leave', async () => {
      const el = await fixture<MoulNumberTicker>(
        html`<moul-number-ticker value="99"></moul-number-ticker>`,
      )
      el.value = 100
      await el.updateComplete
      expect(columns(el)).toHaveLength(3)
      await vi.waitFor(() => expect(shownDigits(el)).toBe('100'), {
        timeout: 2000,
      })

      el.value = 99
      await el.updateComplete
      // The leading 1 fades out where it is before it is removed.
      await vi.waitFor(() => expect(columns(el)).toHaveLength(2), {
        timeout: 2000,
      })
      await vi.waitFor(() => expect(shownDigits(el)).toBe('99'), {
        timeout: 2000,
      })
    })

    it('finishes every roll when it is disconnected', async () => {
      const el = await fixture<MoulNumberTicker>(
        html`<moul-number-ticker value="1"></moul-number-ticker>`,
      )
      el.value = 8
      await el.updateComplete
      el.remove()
      expect(shownDigits(el)).toBe('8')
      expect(stripOf(columns(el)[0]).style.transform).toBe('translateY(-40%)')
    })
  })

  describe('count mode', () => {
    it('springs through the values in between with the final fraction digits', async () => {
      const el = await fixture<MoulNumberTicker>(
        html`<moul-number-ticker
          mode="count"
          value="1.5"
          locale="en-US"
        ></moul-number-ticker>`,
      )
      const digits = () => shadow(el).querySelector('.count')?.textContent
      expect(digits()).toBe('1.5')
      el.value = 40.25
      await el.updateComplete
      const seen = new Set<string>()
      await vi.waitFor(
        () => {
          seen.add(digits() ?? '')
          expect(digits()).toBe('40.25')
        },
        { timeout: 2000, interval: 16 },
      )
      const between = [...seen].filter((text) => text !== '40.25')
      expect(between.length).toBeGreaterThan(0)
      for (const text of between) expect(text).toMatch(/^\d+\.\d\d$/)
      expect(srText(el)).toBe('40.25')
    })
  })

  describe('from', () => {
    beforeEach(() => {
      vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    })

    it('shows `from` until it first comes on screen, then rolls to `value`', async () => {
      const el = await fixture<MoulNumberTicker>(
        html`<moul-number-ticker from="0" value="42"></moul-number-ticker>`,
      )
      expect(shownDigits(el)).toBe('0')
      // Screen readers get the real value from the start.
      expect(srText(el)).toBe('42')

      const observer = FakeIntersectionObserver.instances[0]
      expect(observer.targets).toEqual([el])
      observer.report(false)
      expect(shownDigits(el)).toBe('0')
      observer.report(true)
      expect(observer.isDisconnected).toBe(true)
      await vi.waitFor(() => expect(shownDigits(el)).toBe('42'), {
        timeout: 2000,
      })
    })

    it('counts up from `from` in count mode', async () => {
      const el = await fixture<MoulNumberTicker>(
        html`<moul-number-ticker
          mode="count"
          from="0"
          value="500"
        ></moul-number-ticker>`,
      )
      const digits = () => shadow(el).querySelector('.count')?.textContent
      expect(digits()).toBe('0')
      FakeIntersectionObserver.instances[0].report(true)
      await vi.waitFor(() => expect(digits()).toBe('500'), { timeout: 2000 })
    })
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and has no role or live region', async () => {
      const el = await fixture<MoulNumberTicker>(
        html`<moul-number-ticker value="12"></moul-number-ticker>`,
      )
      expect(el.tabIndex).toBe(-1)
      expect(el.hasAttribute('role')).toBe(false)
      expect(shadow(el).querySelector('[aria-live]')).toBeNull()
      expect(shadow(el).querySelector('[tabindex]')).toBeNull()
    })

    it('hides the moving digits and reads only the final value', async () => {
      const el = await fixture<MoulNumberTicker>(
        html`<moul-number-ticker value="12"></moul-number-ticker>`,
      )
      const digits = shadow(el).querySelector('[part="digits"]')
      expect(digits?.getAttribute('aria-hidden')).toBe('true')
      el.value = 9876
      await el.updateComplete
      // Mid-roll, the hidden copy already holds the end value.
      expect(srText(el)).toBe('9,876')
    })

    it('reads slotted prefix and suffix around the number', async () => {
      const el = await fixture<MoulNumberTicker>(
        html`<moul-number-ticker value="3"
          ><span slot="prefix">≈</span><span slot="suffix"> GB</span></moul-number-ticker
        >`,
      )
      const names = Array.from(shadow(el).querySelectorAll('slot')).map(
        (slot) => slot.name,
      )
      expect(names).toEqual(['prefix', 'suffix'])
    })
  })

  describe('reduced motion', () => {
    it('jumps straight to each new value without rolling', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulNumberTicker>(
        html`<moul-number-ticker value="99"></moul-number-ticker>`,
      )
      el.value = 100
      await el.updateComplete
      expect(shownDigits(el)).toBe('100')
      el.value = 7
      await el.updateComplete
      expect(shownDigits(el)).toBe('7')
      expect(columns(el)).toHaveLength(1)
    })

    it('ignores `from` and shows the value at once', async () => {
      motion = mockReducedMotion(true)
      vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
      const el = await fixture<MoulNumberTicker>(
        html`<moul-number-ticker from="0" value="42"></moul-number-ticker>`,
      )
      expect(shownDigits(el)).toBe('42')
      expect(FakeIntersectionObserver.instances).toHaveLength(0)
    })

    it('jumps in count mode too', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulNumberTicker>(
        html`<moul-number-ticker mode="count" value="1"></moul-number-ticker>`,
      )
      el.value = 250
      await el.updateComplete
      await el.updateComplete
      expect(shadow(el).querySelector('.count')?.textContent).toBe('250')
    })
  })
})
